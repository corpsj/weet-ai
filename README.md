# Weet AI - Image Generation Studio

Gemini 3 Pro Image Preview를 사용한 AI 이미지 생성 및 편집 웹 애플리케이션입니다.

## 주요 기능

### 1. 이미지 생성
- Gemini 3 Pro Image Preview API를 사용한 고품질 이미지 생성
- 다양한 해상도 지원 (1K, 2K, 4K)
- 여러 종횡비 옵션 (1:1, 16:9, 9:16, 4:3, 3:4, 5:4, 4:5)
- 한번에 여러 이미지 생성 가능

### 2. 이미지 편집
- 캔버스에서 브러시로 영역 마스킹
- 마스킹된 영역을 프롬프트에 따라 수정
- 대화형 편집 지원 (thought signature 기반)
- Undo/Redo 기능

### 3. 이미지 업스케일링 (Real-ESRGAN)
- AI 기반 고품질 이미지 업스케일링
- 2배 및 4배 확대 지원
- 실사 사진 최적화 (인물, 건물, 풍경)
- GPU 가속 지원 (CUDA)
- 전용 업스케일 페이지 및 비교 슬라이더

### 4. 캔버스 도구
- 브러시: 편집할 영역 마킹
- 지우개: 마스크 제거
- 브러시 크기 조절 (5-100px)
- 이미지 확대/축소
- 이미지 다운로드

## 기술 스택

### Frontend
- **프레임워크**: Next.js 15, React 19
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **캔버스**: Konva.js
- **AI API**: Google Gemini 3 Pro Image Preview
- **아이콘**: Lucide React

### Backend (Upscaling)
- **서버**: FastAPI (Python)
- **AI 모델**: Real-ESRGAN
- **딥러닝**: PyTorch
- **이미지 처리**: OpenCV, Pillow

## 설치 및 실행

### Frontend (Next.js) 설정

#### 1. 의존성 설치

```bash
npm install
```

#### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 Gemini API 키를 설정합니다:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**API 키 발급 방법:**
1. [Google AI Studio](https://aistudio.google.com/apikey)에 접속
2. API 키 생성
3. 생성된 키를 `.env.local` 파일에 입력

#### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

**Mock 모드** (백엔드 없이 프론트엔드만 테스트):
```bash
npm run dev:mock
```
상세 가이드: [MOCK_MODE.md](MOCK_MODE.md)

#### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

---

### Backend (Real-ESRGAN Upscaling) 설정

업스케일링 기능을 사용하려면 Python 백엔드 서버가 필요합니다.

#### 시스템 요구사항
- Python 3.8 이상
- NVIDIA GPU (CUDA 지원) - **RTX 3080 Ti 권장**
- CUDA 11.8 이상
- 12GB 이상 VRAM

#### 1. Python 가상환경 생성

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### 2. CUDA 설치 (GPU 사용 시 필수)

**Windows/Linux:**
- [CUDA Toolkit 11.8](https://developer.nvidia.com/cuda-11-8-0-download-archive) 설치

**macOS:**
- CUDA를 지원하지 않아 CPU 모드로 실행됩니다 (느림)

#### 3. PyTorch 설치 (GPU 버전)

```bash
# CUDA 11.8용 (권장)
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118

# CPU만 사용 (macOS)
pip install torch==2.1.2 torchvision==0.16.2
```

#### 4. 나머지 의존성 설치

```bash
pip install -r requirements.txt
```

#### 5. 백엔드 서버 실행

```bash
python server.py
```

서버 시작 시 다음 메시지가 표시됩니다:
```
🎮 Using device: cuda
🚀 GPU: NVIDIA GeForce RTX 3080 Ti
💾 VRAM: 12.0GB
```

백엔드 서버가 `http://localhost:8000`에서 실행됩니다.

**참고:**
- 첫 실행 시 Real-ESRGAN 모델(~17MB)이 자동으로 다운로드됩니다
- 자세한 내용은 [backend/README.md](backend/README.md)를 참조하세요

## 사용 방법

### 기본 이미지 생성
1. 좌측 사이드바의 프롬프트 입력란에 원하는 이미지에 대한 설명을 입력합니다
2. 해상도, 종횡비, 이미지 개수를 선택합니다
3. "Generate Image" 버튼을 클릭합니다
4. 생성된 이미지가 캔버스에 표시됩니다

### 이미지 편집
1. 생성된 이미지가 캔버스에 표시된 상태에서 하단 툴바의 브러시를 선택합니다
2. 편집하고 싶은 영역을 브러시로 마스킹합니다
3. 사이드바에 편집 내용을 설명하는 프롬프트를 입력합니다
   - 예: "색칠한 부분을 파란색으로 변경해줘"
4. "Generate Image" 버튼을 클릭하면 마스킹된 영역이 수정됩니다

### 이미지 업스케일링
1. **메인 스튜디오에서:**
   - 업스케일할 이미지를 선택합니다
   - 하단 툴바의 "Upscale" 버튼을 클릭합니다
   - AI가 4배 고화질로 업스케일합니다

2. **전용 업스케일 페이지에서:**
   - 상단 네비게이션에서 "Upscale" 메뉴를 클릭합니다
   - 이미지를 업로드합니다
   - 2배 또는 4배 배율을 선택합니다
   - "Upscale" 버튼을 클릭합니다
   - 비교 슬라이더로 원본과 결과를 비교합니다
   - "Download" 버튼으로 결과를 저장합니다

**주의:** 업스케일링 기능을 사용하려면 Python 백엔드 서버가 실행 중이어야 합니다.

### 프롬프트 작성 팁

Gemini 개발자 가이드에 따르면, **키워드 나열보다는 서술형 문장이 더 좋은 결과를 냅니다:**

❌ 나쁜 예:
```
cat, sunset, beach, realistic, 4k
```

✅ 좋은 예:
```
A photorealistic image of a cat sitting on a sandy beach during sunset.
The warm golden light from the setting sun illuminates the cat's fur.
The composition shows the cat in the foreground with the ocean waves
and colorful sky in the background.
```

**권장 사항:**
- 장면을 자세히 설명하세요
- 구도, 조명, 분위기, 스타일을 포함하세요
- 단순 키워드보다는 문장으로 작성하세요

## 프로젝트 구조

```
weet-ai_v3(claude)/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 메인 페이지
│   │   └── globals.css         # 글로벌 스타일
│   ├── components/
│   │   ├── Sidebar.tsx         # 사이드바 (프롬프트 입력)
│   │   ├── Canvas.tsx          # 캔버스 (이미지 표시 및 마스킹)
│   │   └── FloatingToolbar.tsx # 플로팅 툴바
│   ├── lib/
│   │   └── gemini.ts           # Gemini API 유틸리티
│   └── types/
│       └── index.ts            # TypeScript 타입 정의
├── .env.local                  # 환경 변수 (API 키)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 주요 기능 구현 상세

### Gemini API 통합
- **Thought Signature 보존**: 대화형 편집을 위해 API 응답의 thought signature를 저장하고 전달
- **프롬프트 최적화**: 사용자 입력을 서술형 프롬프트로 자동 변환
- **대화 히스토리 관리**: 편집 작업 시 이전 컨텍스트 유지

### 캔버스 편집
- **Fabric.js 활용**: 강력한 캔버스 조작 기능
- **마스크 생성**: 사용자가 그린 경로를 바이너리 마스크로 변환
- **Base64 인코딩**: API로 전송하기 위한 이미지 데이터 변환

## 제한사항

- 생성된 이미지에는 SynthID 워터마크가 포함됩니다
- API는 한 번에 하나의 이미지만 생성합니다 (여러 이미지 요청 시 순차적으로 생성)
- 4K 해상도는 Gemini 3 Pro에서만 사용 가능합니다
- 해상도 파라미터는 대문자 'K'를 사용해야 합니다 (4K, not 4k)

## API 비용

Gemini 3 Pro Image Preview 사용 시:
- 텍스트 입력: $2 / 1M tokens
- 이미지 출력: $0.134 (해상도에 따라 다름)

자세한 정보는 [Google AI Pricing](https://ai.google.dev/pricing)을 참조하세요.

## 문제 해결

### API 키 오류
```
Gemini API key is not configured
```
→ `.env.local` 파일이 존재하고 올바른 API 키가 설정되어 있는지 확인하세요.

### 이미지 생성 실패
```
Gemini API error: 400
```
→ 프롬프트가 정책에 위반되는지 확인하세요. 안전하고 적절한 내용으로 수정하세요.

### Fabric.js 오류
→ 브라우저 콘솔에서 오류를 확인하고, 필요시 페이지를 새로고침하세요.

## 성능 최적화

### RTX 3080 Ti (12GB VRAM) 기준 업스케일링 속도
- 512×512 → 2048×2048 (4x): **~1-2초**
- 1024×1024 → 4096×4096 (4x): **~3-5초**
- FP16 (Half Precision) 자동 활성화

## Vercel 배포 (프론트엔드만)

프론트엔드는 Vercel에 배포하고, 백엔드는 로컬 PC(RTX 3080 Ti)에서 실행할 수 있습니다.

### 빠른 가이드

```
사용자 → Vercel (Next.js) → Cloudflare Tunnel → 내 컴퓨터 (Real-ESRGAN)
```

1. **Cloudflare Tunnel 설정** (로컬 백엔드를 인터넷에 노출)
   ```cmd
   cd backend
   cloudflare-tunnel-setup.bat
   ```

2. **Vercel 배포**
   - GitHub에 푸시
   - [Vercel](https://vercel.com)에서 import
   - 환경 변수 설정:
     - `NEXT_PUBLIC_GEMINI_API_KEY`: Gemini API 키
     - `UPSCALE_BACKEND_URL`: Cloudflare Tunnel URL

3. **로컬 PC에서 실행**
   ```cmd
   cd backend
   start-all.bat
   ```

**상세 가이드**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

### 비용 비교

| 방식 | 비용/월 |
|------|---------|
| Vercel + 로컬 GPU | **~$20-50** (전기료만) |
| 클라우드 GPU (AWS g4dn) | **~$526** |
| **절감액** | **90% 이상** |

---

## 향후 개발 계획

- [x] 업스케일링 기능 (Real-ESRGAN) ✅
- [x] Vercel 배포 지원 (로컬 백엔드) ✅
- [ ] 갤러리 기능 (부분 구현)
- [ ] 이미지 히스토리 저장 (부분 구현)
- [ ] 다중 참조 이미지 지원 (최대 14개)
- [ ] Google Search grounding 통합
- [ ] 실시간 협업 기능
- [ ] SwinIR 모델 추가 (최고 품질 옵션)
- [ ] 애니메이션 업스케일 모델 추가

## 참고 자료

- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Image Generation with Gemini](https://ai.google.dev/gemini-api/docs/image-generation)
- [Real-ESRGAN GitHub](https://github.com/xinntao/Real-ESRGAN)
- [Real-ESRGAN 논문](https://arxiv.org/abs/2107.10833)
- [Konva.js Documentation](https://konvajs.org/)
- [Next.js Documentation](https://nextjs.org/docs)

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트를 환영합니다.
