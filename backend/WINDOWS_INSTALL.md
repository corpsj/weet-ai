# Windows 설치 가이드 (RTX 3080 Ti)

이 가이드는 Windows 환경에서 RTX 3080 Ti를 사용하여 Real-ESRGAN 백엔드를 설치하는 방법입니다.

## 🎯 시스템 사양

- **OS**: Windows 10/11
- **GPU**: NVIDIA GeForce RTX 3080 Ti (12GB VRAM)
- **CPU**: AMD Ryzen 7 7800X3D
- **RAM**: 32GB

## 📋 사전 요구사항

### 1. Python 설치

Python 3.9 이상을 설치합니다:

1. [Python 공식 사이트](https://www.python.org/downloads/)에서 다운로드
2. 설치 시 **"Add Python to PATH"** 체크 ✅
3. 설치 확인:
   ```cmd
   python --version
   ```

### 2. CUDA Toolkit 설치

NVIDIA GPU를 사용하려면 CUDA Toolkit이 필요합니다:

1. [CUDA Toolkit 11.8 다운로드](https://developer.nvidia.com/cuda-11-8-0-download-archive)
2. Windows 버전 선택 후 설치
3. 설치 확인:
   ```cmd
   nvcc --version
   ```

### 3. NVIDIA 드라이버 확인

최신 드라이버가 설치되어 있는지 확인:
```cmd
nvidia-smi
```

다음과 같은 정보가 표시되어야 합니다:
```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 536.xx       Driver Version: 536.xx       CUDA Version: 12.x    |
|-------------------------------+----------------------+----------------------+
| GPU  Name            TCC/WDDM | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce ... WDDM  | 00000000:01:00.0  On |                  N/A |
| 30%   45C    P8    25W / 350W |   1234MiB / 12288MiB |      0%      Default |
+-------------------------------+----------------------+----------------------+
```

## 🚀 자동 설치 (권장)

### 방법 1: 배치 파일 실행

1. `backend` 폴더를 Windows PC로 복사
2. `setup-windows.bat` 더블클릭
3. 모든 의존성이 자동으로 설치됩니다

```cmd
cd backend
setup-windows.bat
```

설치가 완료되면 GPU 정보가 표시됩니다:
```
CUDA Available: True
GPU Name: NVIDIA GeForce RTX 3080 Ti
GPU Count: 1
```

### 방법 2: 서버 바로 시작

설치 후 서버 시작:
```cmd
start-server.bat
```

## 🔧 수동 설치

자동 설치가 실패하는 경우 수동으로 설치:

### 1단계: 가상환경 생성

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
```

### 2단계: PyTorch 설치 (CUDA 11.8)

```cmd
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
```

### 3단계: 나머지 의존성 설치

```cmd
pip install -r requirements.txt
```

### 4단계: GPU 테스트

```cmd
python -c "import torch; print(torch.cuda.is_available())"
```

`True`가 출력되어야 합니다.

### 5단계: 서버 실행

```cmd
python server.py
```

## ✅ 설치 확인

### GPU 테스트 스크립트

```cmd
test-gpu.bat
```

다음과 같이 출력되어야 합니다:
```
==================================================
PyTorch Version: 2.1.2+cu118
CUDA Available: True
CUDA Version: 11.8
==================================================

GPU Information:
GPU Name: NVIDIA GeForce RTX 3080 Ti
GPU Count: 1
Current Device: 0

Total VRAM: 12.0GB
==================================================
```

### 서버 상태 확인

브라우저에서:
```
http://localhost:8000
```

다음과 같은 JSON이 표시되어야 합니다:
```json
{
  "status": "running",
  "device": "cuda",
  "cuda_available": true,
  "gpu_name": "NVIDIA GeForce RTX 3080 Ti"
}
```

## 🎮 사용 방법

### 1. 백엔드 서버 시작

```cmd
cd backend
start-server.bat
```

서버 시작 시 다음과 같이 표시됩니다:
```
==================================================
🎨 Real-ESRGAN Upscaling Server
==================================================
Device: cuda
GPU: NVIDIA GeForce RTX 3080 Ti
==================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Next.js 프론트엔드 시작 (새 터미널)

```cmd
npm run dev
```

### 3. 브라우저에서 접속

- **메인 스튜디오**: http://localhost:3000
- **업스케일 페이지**: http://localhost:3000/upscale

## 📊 성능 벤치마크 (RTX 3080 Ti)

| 원본 크기 | 업스케일 크기 | 예상 처리 시간 | VRAM 사용량 |
|----------|--------------|---------------|------------|
| 512×512 | 2048×2048 (4x) | **1-2초** | ~4GB |
| 1024×1024 | 4096×4096 (4x) | **3-5초** | ~6GB |
| 2048×2048 | 8192×8192 (4x) | **10-15초** | ~10GB |

## 🔧 문제 해결

### CUDA가 인식되지 않는 경우

```cmd
# CUDA 경로 확인
set PATH=C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin;%PATH%
set PATH=C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\libnvvp;%PATH%
```

### "torch.cuda.is_available() = False" 오류

1. CUDA Toolkit 재설치
2. NVIDIA 드라이버 업데이트
3. PyTorch 재설치:
   ```cmd
   pip uninstall torch torchvision
   pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
   ```

### 메모리 부족 오류

`server.py`에서 타일 크기 조정:
```python
tile=256,  # 기본값 512에서 줄임
```

### 포트 충돌 (8000 포트 사용 중)

```cmd
# 포트 사용 프로세스 확인
netstat -ano | findstr :8000

# 프로세스 종료 (PID 확인 후)
taskkill /PID [PID번호] /F
```

### 모델 다운로드 실패

수동 다운로드:
1. [RealESRGAN_x4plus.pth](https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth) 다운로드
2. `backend/models/` 폴더에 저장

## 💡 최적화 팁

### 1. VRAM 사용량 최적화

RTX 3080 Ti는 12GB VRAM이 있으므로 다음 설정 사용:

```python
# server.py
tile=512,        # 기본값 (큰 이미지용)
# tile=1024,     # 더 큰 타일 (12GB VRAM에서 가능)
```

### 2. FP16 모드 (자동 활성화)

GPU에서 자동으로 FP16(Half Precision) 모드가 활성화되어 속도가 2배 빨라집니다.

### 3. 배치 처리

여러 이미지를 처리할 때는 순차적으로 처리됩니다.

## 🆘 지원

문제가 발생하면:

1. `test-gpu.bat` 실행하여 GPU 상태 확인
2. 백엔드 콘솔 로그 확인
3. 브라우저 콘솔 (F12) 오류 확인
4. [GitHub Issues](https://github.com/xinntao/Real-ESRGAN/issues)

## 📦 폴더 구조

```
backend/
├── server.py                 # FastAPI 서버
├── requirements.txt          # Python 의존성
├── README.md                 # 상세 문서
├── WINDOWS_INSTALL.md        # 이 파일
├── setup-windows.bat         # 자동 설치 스크립트
├── start-server.bat          # 서버 시작 스크립트
├── test-gpu.bat              # GPU 테스트 스크립트
├── venv/                     # Python 가상환경 (설치 후 생성)
└── models/                   # Real-ESRGAN 모델 (자동 다운로드)
    └── RealESRGAN_x4plus.pth
```

## 🎉 설치 완료 후

1. **백엔드 서버 시작**: `start-server.bat`
2. **프론트엔드 시작**: `npm run dev`
3. **브라우저 접속**: http://localhost:3000/upscale
4. **테스트**: 이미지 업로드 후 업스케일 버튼 클릭

RTX 3080 Ti의 강력한 성능을 경험하세요! 🚀
