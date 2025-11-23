# Real-ESRGAN 업스케일링 기능 설치 가이드

이 가이드는 RTX 3080 Ti (12GB)를 사용하여 Real-ESRGAN 업스케일링 기능을 설치하는 방법을 설명합니다.

## 🎯 목표

- Python 백엔드 서버 설치
- Real-ESRGAN 모델 설정
- GPU(CUDA) 활성화
- Next.js와 통합

## 📋 사전 요구사항

- ✅ Python 3.8 이상
- ✅ NVIDIA GPU (RTX 3080 Ti)
- ✅ CUDA Toolkit 11.8 이상
- ✅ 12GB 이상 VRAM

## 🚀 빠른 시작 (Windows)

### 1단계: CUDA Toolkit 설치

```bash
# CUDA 11.8 다운로드 및 설치
# https://developer.nvidia.com/cuda-11-8-0-download-archive
```

설치 후 확인:
```bash
nvcc --version
```

### 2단계: Python 백엔드 설정

```bash
# 프로젝트 루트에서
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
venv\Scripts\activate

# PyTorch 설치 (CUDA 11.8)
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118

# 나머지 의존성 설치
pip install -r requirements.txt
```

### 3단계: 백엔드 서버 실행

```bash
python server.py
```

성공 시 다음과 같은 메시지가 표시됩니다:
```
==================================================
🎨 Real-ESRGAN Upscaling Server
==================================================
Device: cuda
GPU: NVIDIA GeForce RTX 3080 Ti
==================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 4단계: Next.js 프론트엔드 실행

새 터미널을 열고:

```bash
# 프로젝트 루트에서
npm run dev
```

### 5단계: 테스트

브라우저에서:
1. `http://localhost:3000/upscale` 접속
2. 이미지 업로드
3. "Upscale" 버튼 클릭
4. 결과 확인

## 🐧 Linux 설치

### CUDA 설치

```bash
# Ubuntu/Debian
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-ubuntu2204.pin
sudo mv cuda-ubuntu2204.pin /etc/apt/preferences.d/cuda-repository-pin-600
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda-repo-ubuntu2204-11-8-local_11.8.0-520.61.05-1_amd64.deb
sudo dpkg -i cuda-repo-ubuntu2204-11-8-local_11.8.0-520.61.05-1_amd64.deb
sudo cp /var/cuda-repo-ubuntu2204-11-8-local/cuda-*-keyring.gpg /usr/share/keyrings/
sudo apt-get update
sudo apt-get -y install cuda
```

### Python 백엔드 설정

```bash
cd backend
python3 -m venv venv
source venv/bin/activate

# PyTorch 설치 (CUDA 11.8)
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118

# 나머지 의존성
pip install -r requirements.txt

# 서버 실행
python server.py
```

## 🍎 macOS 설치 (CPU 모드)

**주의:** macOS는 CUDA를 지원하지 않아 CPU 모드로 실행됩니다 (매우 느림).

```bash
cd backend
python3 -m venv venv
source venv/bin/activate

# PyTorch 설치 (CPU)
pip install torch==2.1.2 torchvision==0.16.2

# 나머지 의존성
pip install -r requirements.txt

# 서버 실행
python server.py
```

## 🔧 문제 해결

### CUDA가 인식되지 않는 경우

```python
# Python에서 테스트
import torch
print(torch.cuda.is_available())  # True여야 함
print(torch.cuda.get_device_name(0))  # GPU 이름 확인
```

**False인 경우:**
1. CUDA Toolkit이 설치되었는지 확인
2. PyTorch가 CUDA 버전과 일치하는지 확인
3. 시스템 재부팅

### 메모리 부족 오류

`backend/server.py`에서 타일 크기 조정:

```python
upsampler = RealESRGANer(
    ...
    tile=256,  # 512 → 256으로 줄임
    ...
)
```

### 모델 다운로드 실패

수동 다운로드:
```bash
cd backend/models
wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
```

### 백엔드 서버 연결 실패

1. 백엔드 서버가 실행 중인지 확인:
   ```bash
   curl http://localhost:8000/health
   ```

2. 포트 충돌 확인:
   ```bash
   # Windows
   netstat -ano | findstr :8000

   # Linux/macOS
   lsof -i :8000
   ```

## 🎨 사용 예시

### API 직접 호출

```bash
curl -X POST http://localhost:8000/upscale \
  -F "image=@/path/to/image.jpg" \
  -F "scale=4" \
  -F "model=RealESRGAN_x4plus"
```

### Python 테스트

```python
import requests
import base64

# 이미지 읽기
with open("image.jpg", "rb") as f:
    img_base64 = base64.b64encode(f.read()).decode()

# API 호출
response = requests.post(
    "http://localhost:8000/upscale",
    data={
        "image": img_base64,
        "scale": 4,
        "model": "RealESRGAN_x4plus"
    }
)

result = response.json()
print(f"Original: {result['original_size']}")
print(f"Upscaled: {result['upscaled_size']}")
```

## 📊 성능 벤치마크

RTX 3080 Ti (12GB VRAM) 기준:

| 원본 해상도 | 업스케일 해상도 | 처리 시간 | VRAM 사용 |
|------------|----------------|----------|-----------|
| 512×512 | 2048×2048 (4x) | 1-2초 | ~4GB |
| 1024×1024 | 4096×4096 (4x) | 3-5초 | ~6GB |
| 2048×2048 | 8192×8192 (4x) | 10-15초 | ~10GB |

## 🔗 추가 자료

- [Real-ESRGAN GitHub](https://github.com/xinntao/Real-ESRGAN)
- [CUDA Toolkit 다운로드](https://developer.nvidia.com/cuda-downloads)
- [PyTorch 설치 가이드](https://pytorch.org/get-started/locally/)
- [FastAPI 문서](https://fastapi.tiangolo.com/)

## 💡 팁

1. **첫 실행이 느린 경우:** 모델이 다운로드되는 중입니다. 기다려주세요.
2. **VRAM 최적화:** `tile` 크기를 조정하여 메모리 사용량을 조절할 수 있습니다.
3. **속도 향상:** FP16 모드가 자동으로 활성화되어 GPU 성능을 최대화합니다.
4. **다중 모델:** `RealESRGAN_x2plus` (2배), `RealESRGAN_x4plus_anime_6B` (애니메이션) 모델도 사용 가능합니다.

## 🆘 지원

문제가 발생하면 다음을 확인하세요:
1. GPU 드라이버가 최신인지 확인
2. CUDA 버전과 PyTorch 버전이 일치하는지 확인
3. Python 버전이 3.8 이상인지 확인
4. 방화벽에서 8000 포트가 열려있는지 확인
