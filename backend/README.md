# Real-ESRGAN Upscaling Backend

이 백엔드 서버는 Real-ESRGAN을 사용하여 이미지 업스케일링을 수행합니다.

## 시스템 요구사항

- Python 3.8 이상
- NVIDIA GPU (CUDA 지원) - RTX 3080 Ti 권장
- CUDA 11.8 이상
- 12GB 이상 VRAM (4K 이미지 처리 시)

## 설치 방법

### 1. Python 가상환경 생성 (권장)

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. CUDA 설치 (GPU 사용 시 필수)

NVIDIA GPU를 사용하는 경우, CUDA Toolkit을 설치해야 합니다:

**macOS는 CUDA를 지원하지 않습니다.** CPU 모드로 실행됩니다.

**Windows/Linux:**
- [CUDA Toolkit 11.8](https://developer.nvidia.com/cuda-11-8-0-download-archive) 다운로드 및 설치
- 또는 [CUDA Toolkit 12.1](https://developer.nvidia.com/cuda-downloads)

### 3. PyTorch 설치 (GPU 버전)

CUDA 버전에 맞는 PyTorch를 설치합니다:

```bash
# CUDA 11.8용
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1용
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu121

# CPU만 사용 (macOS 포함)
pip install torch==2.1.2 torchvision==0.16.2
```

### 4. 나머지 의존성 설치

```bash
pip install -r requirements.txt
```

## 서버 실행

```bash
# 백엔드 디렉토리에서
python server.py
```

서버가 실행되면:
- 주소: `http://localhost:8000`
- API 문서: `http://localhost:8000/docs`

## GPU 확인

서버 시작 시 다음과 같은 메시지가 표시되어야 합니다:

```
🎮 Using device: cuda
🚀 GPU: NVIDIA GeForce RTX 3080 Ti
💾 VRAM: 12.0GB
```

만약 `cpu`로 표시되면 CUDA가 제대로 설치되지 않은 것입니다.

## 모델 자동 다운로드

첫 실행 시 Real-ESRGAN 모델이 자동으로 다운로드됩니다:
- `RealESRGAN_x4plus.pth` (~17MB) - 일반 실사용

필요에 따라 추가 모델도 자동 다운로드됩니다:
- `RealESRGAN_x2plus.pth` - 2배 업스케일용
- `RealESRGAN_x4plus_anime_6B.pth` - 애니메이션용

## API 엔드포인트

### POST /upscale

이미지 업스케일링을 수행합니다.

**요청:**
```json
{
  "image": "data:image/png;base64,iVBORw0KG...",
  "scale": 4,
  "model": "RealESRGAN_x4plus"
}
```

**응답:**
```json
{
  "success": true,
  "upscaled_image": "data:image/png;base64,iVBORw0KG...",
  "original_size": {"width": 512, "height": 512},
  "upscaled_size": {"width": 2048, "height": 2048},
  "scale": 4,
  "model": "RealESRGAN_x4plus"
}
```

### GET /

서버 상태를 확인합니다.

### GET /health

헬스 체크

## 성능 최적화

RTX 3080 Ti (12GB VRAM)에서:
- 512x512 → 2048x2048 (4x): ~1-2초
- 1024x1024 → 4096x4096 (4x): ~3-5초
- FP16 (Half Precision) 자동 활성화로 속도 향상

## 문제 해결

### CUDA 메모리 부족 오류

`server.py`에서 `tile` 크기를 조정:

```python
upsampler = RealESRGANer(
    ...
    tile=256,  # 512에서 256으로 줄임
    ...
)
```

### 모델 로딩 실패

모델을 수동으로 다운로드하고 `backend/models/` 폴더에 넣으세요:
- [RealESRGAN_x4plus.pth](https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth)

## 참고

- [Real-ESRGAN GitHub](https://github.com/xinntao/Real-ESRGAN)
- [Real-ESRGAN 논문](https://arxiv.org/abs/2107.10833)
