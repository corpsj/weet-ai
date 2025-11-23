"""
Real-ESRGAN Upscaling Backend Server
Optimized for RTX 3080 Ti with CUDA support
"""

import os
import io
import base64
from pathlib import Path
from typing import Optional
import torch
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet

app = FastAPI(title="Real-ESRGAN Upscaling Server")

# CORS 설정 (Next.js에서 접근 가능하도록)
# Vercel 배포 시 환경에 맞게 allow_origins 수정 필요
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        # Vercel 배포 시 아래 주석 해제하고 실제 URL로 변경
        # "https://your-project.vercel.app",
        # "https://*.vercel.app",  # Preview 배포용
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GPU 설정
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🎮 Using device: {device}")
if torch.cuda.is_available():
    print(f"🚀 GPU: {torch.cuda.get_device_name(0)}")
    print(f"💾 VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB")

# 모델 저장 경로
MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

# Real-ESRGAN 모델 인스턴스 (lazy loading)
upsampler_cache = {}


def get_upsampler(model_name: str = "RealESRGAN_x4plus", scale: int = 4):
    """
    Real-ESRGAN 업샘플러 가져오기 (캐시 사용)

    모델 종류:
    - RealESRGAN_x4plus: 일반 실사용 (기본, 추천)
    - RealESRGAN_x4plus_anime_6B: 애니메이션/일러스트용
    - RealESRGAN_x2plus: 2배 업스케일용
    """
    cache_key = f"{model_name}_{scale}"

    if cache_key in upsampler_cache:
        return upsampler_cache[cache_key]

    print(f"📦 Loading model: {model_name} (scale: {scale}x)...")

    # 모델 파라미터 설정
    if model_name == "RealESRGAN_x4plus":
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        netscale = 4
        model_path = MODEL_DIR / "RealESRGAN_x4plus.pth"
        model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"

    elif model_name == "RealESRGAN_x4plus_anime_6B":
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=6, num_grow_ch=32, scale=4)
        netscale = 4
        model_path = MODEL_DIR / "RealESRGAN_x4plus_anime_6B.pth"
        model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"

    elif model_name == "RealESRGAN_x2plus":
        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
        netscale = 2
        model_path = MODEL_DIR / "RealESRGAN_x2plus.pth"
        model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth"

    else:
        raise ValueError(f"Unknown model: {model_name}")

    # 모델 다운로드 (없는 경우)
    if not model_path.exists():
        print(f"⬇️  Downloading model from {model_url}...")
        import urllib.request
        urllib.request.urlretrieve(model_url, model_path)
        print(f"✅ Model downloaded: {model_path}")

    # Real-ESRGAN 업샘플러 생성
    upsampler = RealESRGANer(
        scale=netscale,
        model_path=str(model_path),
        model=model,
        tile=512,  # 메모리 최적화를 위한 타일 크기 (3080 Ti는 더 크게 가능)
        tile_pad=10,
        pre_pad=0,
        half=True if device == torch.device('cuda') else False,  # FP16 (GPU만)
        device=device,
    )

    upsampler_cache[cache_key] = upsampler
    print(f"✅ Model loaded successfully!")

    return upsampler


def image_to_base64(image: np.ndarray) -> str:
    """OpenCV 이미지를 base64로 변환"""
    # BGR to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(image_rgb)

    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()

    return img_str


def base64_to_image(base64_str: str) -> np.ndarray:
    """base64를 OpenCV 이미지로 변환"""
    # base64 헤더 제거 (data:image/png;base64, 등)
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]

    img_data = base64.b64decode(base64_str)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    return img


@app.get("/")
async def root():
    """서버 상태 확인"""
    return {
        "status": "running",
        "device": str(device),
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}


@app.post("/upscale")
async def upscale_image(
    image: str = Form(...),  # base64 인코딩된 이미지
    scale: int = Form(4),  # 업스케일 배율 (2 또는 4)
    model: str = Form("RealESRGAN_x4plus"),  # 모델 이름
):
    """
    이미지 업스케일링 API

    Parameters:
    - image: base64 인코딩된 이미지
    - scale: 업스케일 배율 (2 또는 4)
    - model: 모델 이름 (RealESRGAN_x4plus, RealESRGAN_x2plus, RealESRGAN_x4plus_anime_6B)

    Returns:
    - upscaled_image: base64 인코딩된 업스케일 이미지
    - original_size: 원본 이미지 크기
    - upscaled_size: 업스케일된 이미지 크기
    """
    try:
        # base64 이미지를 OpenCV 이미지로 변환
        img = base64_to_image(image)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        original_height, original_width = img.shape[:2]
        print(f"📸 Original image: {original_width}x{original_height}")

        # 스케일에 맞는 모델 선택
        if scale == 2:
            model_name = "RealESRGAN_x2plus"
        elif scale == 4:
            model_name = model  # 사용자가 선택한 모델 (기본: RealESRGAN_x4plus)
        else:
            raise HTTPException(status_code=400, detail="Scale must be 2 or 4")

        # 업샘플러 가져오기
        upsampler = get_upsampler(model_name, scale)

        # 업스케일링 수행
        print(f"🚀 Upscaling with {model_name}...")
        output, _ = upsampler.enhance(img, outscale=scale)

        upscaled_height, upscaled_width = output.shape[:2]
        print(f"✨ Upscaled image: {upscaled_width}x{upscaled_height}")

        # base64로 변환
        upscaled_base64 = image_to_base64(output)

        return JSONResponse({
            "success": True,
            "upscaled_image": f"data:image/png;base64,{upscaled_base64}",
            "original_size": {"width": original_width, "height": original_height},
            "upscaled_size": {"width": upscaled_width, "height": upscaled_height},
            "scale": scale,
            "model": model_name,
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upscale-file")
async def upscale_file(
    file: UploadFile = File(...),
    scale: int = Form(4),
    model: str = Form("RealESRGAN_x4plus"),
):
    """
    파일 업로드 방식의 업스케일링 API
    """
    try:
        # 파일 읽기
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        original_height, original_width = img.shape[:2]
        print(f"📸 Original image: {original_width}x{original_height}")

        # 스케일에 맞는 모델 선택
        if scale == 2:
            model_name = "RealESRGAN_x2plus"
        elif scale == 4:
            model_name = model
        else:
            raise HTTPException(status_code=400, detail="Scale must be 2 or 4")

        # 업샘플러 가져오기
        upsampler = get_upsampler(model_name, scale)

        # 업스케일링 수행
        print(f"🚀 Upscaling with {model_name}...")
        output, _ = upsampler.enhance(img, outscale=scale)

        upscaled_height, upscaled_width = output.shape[:2]
        print(f"✨ Upscaled image: {upscaled_width}x{upscaled_height}")

        # base64로 변환
        upscaled_base64 = image_to_base64(output)

        return JSONResponse({
            "success": True,
            "upscaled_image": f"data:image/png;base64,{upscaled_base64}",
            "original_size": {"width": original_width, "height": original_height},
            "upscaled_size": {"width": upscaled_width, "height": upscaled_height},
            "scale": scale,
            "model": model_name,
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    print("=" * 50)
    print("🎨 Real-ESRGAN Upscaling Server")
    print("=" * 50)
    print(f"Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    print("=" * 50)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
