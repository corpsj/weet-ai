# Windows 환경 완전 설정 가이드

이 프로젝트를 Windows PC (RTX 3080 Ti)에서 실행하기 위한 완전한 가이드입니다.

## 🖥️ 시스템 사양

- **OS**: Windows 10/11
- **GPU**: NVIDIA GeForce RTX 3080 Ti (12GB VRAM)
- **CPU**: AMD Ryzen 7 7800X3D
- **RAM**: 32GB DDR4/DDR5

---

## 📦 1단계: 필수 소프트웨어 설치

### 1.1 Node.js 설치

프론트엔드(Next.js) 실행에 필요합니다.

1. [Node.js 공식 사이트](https://nodejs.org/) 접속
2. **LTS 버전** 다운로드 (권장: v18 이상)
3. 설치 시 모든 기본 옵션 그대로 진행
4. 설치 확인:
   ```cmd
   node --version
   npm --version
   ```

### 1.2 Python 설치

백엔드(Real-ESRGAN) 실행에 필요합니다.

1. [Python 공식 사이트](https://www.python.org/downloads/) 접속
2. **Python 3.9 이상** 다운로드
3. 설치 시 **중요**: "Add Python to PATH" 체크박스 ✅ 반드시 선택!
4. 설치 확인:
   ```cmd
   python --version
   ```

### 1.3 CUDA Toolkit 설치

GPU 가속에 필수입니다.

1. [CUDA Toolkit 11.8 다운로드](https://developer.nvidia.com/cuda-11-8-0-download-archive)
2. **Windows** 선택 → **x86_64** → **10 or 11** → **exe (local)**
3. 다운로드 후 실행 (약 3GB, 설치 시간 10-20분)
4. 기본 옵션으로 설치
5. 설치 확인:
   ```cmd
   nvcc --version
   ```

### 1.4 NVIDIA 드라이버 최신 버전 확인

1. [NVIDIA 드라이버 다운로드](https://www.nvidia.com/Download/index.aspx)
2. GeForce RTX 3080 Ti 선택 후 최신 드라이버 설치
3. 설치 확인:
   ```cmd
   nvidia-smi
   ```

   다음과 같이 GPU 정보가 표시되어야 합니다:
   ```
   NVIDIA GeForce RTX 3080 Ti
   ```

### 1.5 Git 설치 (선택사항, 프로젝트 다운로드용)

1. [Git for Windows](https://git-scm.com/download/win) 다운로드
2. 설치 (기본 옵션)

---

## 📂 2단계: 프로젝트 설정

### 2.1 프로젝트 폴더 준비

프로젝트를 Windows PC로 복사하거나 Git으로 클론:

```cmd
# Git 사용 시
git clone [repository-url]
cd weet-ai_v3(claude)

# 또는 ZIP 파일 압축 해제 후
cd [프로젝트 폴더]
```

---

## 🎨 3단계: 프론트엔드 설정 (Next.js)

### 3.1 의존성 설치

```cmd
npm install
```

처음 설치 시 2-5분 소요됩니다.

### 3.2 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```cmd
# 메모장으로 생성
notepad .env.local
```

다음 내용 입력:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**API 키 발급:**
1. [Google AI Studio](https://aistudio.google.com/apikey) 접속
2. "Create API Key" 클릭
3. 생성된 키를 복사하여 `.env.local`에 붙여넣기

### 3.3 프론트엔드 실행 테스트

```cmd
npm run dev
```

브라우저에서 `http://localhost:3000` 접속하여 확인

**테스트 후 Ctrl+C로 종료**

---

## 🤖 4단계: 백엔드 설정 (Real-ESRGAN)

### 4.1 자동 설치 (권장)

```cmd
cd backend
setup-windows.bat
```

이 스크립트가 자동으로:
- Python 가상환경 생성
- PyTorch (CUDA 11.8) 설치
- Real-ESRGAN 및 의존성 설치
- GPU 테스트

설치 완료 시 다음과 같이 표시됩니다:
```
CUDA Available: True
GPU Name: NVIDIA GeForce RTX 3080 Ti
GPU Count: 1
```

### 4.2 수동 설치 (자동 설치 실패 시)

```cmd
cd backend

# 1. 가상환경 생성
python -m venv venv

# 2. 가상환경 활성화
venv\Scripts\activate

# 3. PyTorch 설치 (CUDA 11.8)
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118

# 4. 나머지 의존성 설치
pip install -r requirements.txt
```

### 4.3 GPU 테스트

```cmd
cd backend
test-gpu.bat
```

다음과 같이 출력되어야 합니다:
```
PyTorch Version: 2.1.2+cu118
CUDA Available: True
GPU Name: NVIDIA GeForce RTX 3080 Ti
Total VRAM: 12.0GB
```

---

## 🚀 5단계: 실행하기

### 방법 1: 배치 파일 사용 (간편)

**터미널 1 - 백엔드:**
```cmd
cd backend
start-server.bat
```

**터미널 2 - 프론트엔드:**
```cmd
npm run dev
```

### 방법 2: 수동 실행

**터미널 1 - 백엔드:**
```cmd
cd backend
venv\Scripts\activate
python server.py
```

**터미널 2 - 프론트엔드:**
```cmd
npm run dev
```

---

## 🎯 6단계: 사용하기

### 웹 인터페이스 접속

브라우저에서:
- **메인 스튜디오**: http://localhost:3000
- **업스케일 전용 페이지**: http://localhost:3000/upscale
- **갤러리**: http://localhost:3000/gallery

### 이미지 업스케일링 테스트

1. http://localhost:3000/upscale 접속
2. 이미지 업로드 (JPEG, PNG)
3. 배율 선택 (2x 또는 4x)
4. "Upscale" 버튼 클릭
5. 비교 슬라이더로 결과 확인
6. "Download" 버튼으로 저장

---

## 📊 성능 확인

### RTX 3080 Ti 예상 성능

| 원본 크기 | 업스케일 크기 | 예상 시간 |
|----------|--------------|-----------|
| 512×512 | 2048×2048 (4x) | **1-2초** |
| 1024×1024 | 4096×4096 (4x) | **3-5초** |
| 2048×2048 | 8192×8192 (4x) | **10-15초** |

백엔드 콘솔에서 처리 시간 확인 가능:
```
📸 Original image: 512x512
🚀 Upscaling with RealESRGAN_x4plus...
✨ Upscaled image: 2048x2048
```

---

## 🔧 문제 해결

### "CUDA Available: False" 오류

**원인**: CUDA가 제대로 설치되지 않음

**해결:**
1. CUDA Toolkit 11.8 재설치
2. NVIDIA 드라이버 업데이트
3. 시스템 재부팅
4. PyTorch 재설치:
   ```cmd
   pip uninstall torch torchvision
   pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
   ```

### "Python을 찾을 수 없습니다" 오류

**원인**: Python이 PATH에 없음

**해결:**
1. Python 재설치 시 "Add Python to PATH" 체크
2. 또는 수동으로 PATH 추가:
   - 시스템 환경 변수 → Path 편집
   - `C:\Users\[사용자명]\AppData\Local\Programs\Python\Python39` 추가

### "npm을 찾을 수 없습니다" 오류

**원인**: Node.js가 설치되지 않음

**해결:** Node.js 설치 후 시스템 재부팅

### 포트 충돌 (3000, 8000 포트 사용 중)

**백엔드 포트 변경 (8000 → 8001):**

`backend/server.py` 마지막 줄 수정:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # 8000 → 8001
```

`src/app/api/upscale/route.ts` 수정:
```typescript
const BACKEND_URL = 'http://localhost:8001';  // 8000 → 8001
```

**프론트엔드 포트 변경 (3000 → 3001):**
```cmd
set PORT=3001 && npm run dev
```

### 메모리 부족 오류

`backend/server.py`에서 타일 크기 조정:
```python
tile=256,  # 512 → 256으로 줄임
```

---

## 📁 최종 폴더 구조

```
weet-ai_v3(claude)/
├── backend/                          # Python 백엔드
│   ├── server.py                     # FastAPI 서버
│   ├── requirements.txt              # Python 의존성
│   ├── setup-windows.bat             # 자동 설치 스크립트
│   ├── start-server.bat              # 서버 시작 스크립트
│   ├── test-gpu.bat                  # GPU 테스트
│   ├── WINDOWS_INSTALL.md            # 백엔드 상세 가이드
│   ├── venv/                         # Python 가상환경 (자동 생성)
│   └── models/                       # AI 모델 (자동 다운로드)
│       └── RealESRGAN_x4plus.pth
├── src/                              # Next.js 소스
│   ├── app/
│   │   ├── page.tsx                  # 메인 페이지
│   │   ├── upscale/page.tsx          # 업스케일 페이지
│   │   └── api/upscale/route.ts      # 업스케일 API
│   ├── components/
│   └── lib/
├── .env.local                        # 환경 변수 (직접 생성)
├── package.json
├── README.md                         # 프로젝트 메인 문서
├── WINDOWS_SETUP_GUIDE.md            # 이 파일
└── UPSCALE_SETUP.md                  # 업스케일 상세 가이드
```

---

## ✅ 설치 완료 체크리스트

- [ ] Node.js 설치 완료
- [ ] Python 3.9+ 설치 완료
- [ ] CUDA Toolkit 11.8 설치 완료
- [ ] NVIDIA 드라이버 최신 버전
- [ ] `npm install` 완료
- [ ] `.env.local` 파일 생성 및 API 키 입력
- [ ] `backend/setup-windows.bat` 실행 완료
- [ ] `test-gpu.bat` 실행 시 GPU 인식 확인
- [ ] 백엔드 서버 실행 확인 (http://localhost:8000)
- [ ] 프론트엔드 실행 확인 (http://localhost:3000)
- [ ] 업스케일 기능 테스트 완료

---

## 🎉 모든 설치 완료!

이제 다음 명령어로 프로젝트를 실행할 수 있습니다:

**매번 실행 시:**
1. 터미널 1: `cd backend && start-server.bat`
2. 터미널 2: `npm run dev`
3. 브라우저: http://localhost:3000

RTX 3080 Ti의 강력한 성능으로 초고속 AI 이미지 업스케일링을 경험하세요! 🚀

---

## 📞 추가 도움말

- 백엔드 상세 가이드: [backend/WINDOWS_INSTALL.md](backend/WINDOWS_INSTALL.md)
- 업스케일 기능 가이드: [UPSCALE_SETUP.md](UPSCALE_SETUP.md)
- 프로젝트 전체 문서: [README.md](README.md)
- Real-ESRGAN 공식: https://github.com/xinntao/Real-ESRGAN
