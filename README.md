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

### 3. 캔버스 도구
- 브러시: 편집할 영역 마킹
- 지우개: 마스크 제거
- 브러시 크기 조절 (5-100px)
- 이미지 확대/축소
- 이미지 다운로드

## 기술 스택

- **프레임워크**: Next.js 15, React 19
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **캔버스**: Fabric.js
- **AI API**: Google Gemini 3 Pro Image Preview
- **아이콘**: Lucide React

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 Gemini API 키를 설정합니다:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**API 키 발급 방법:**
1. [Google AI Studio](https://aistudio.google.com/apikey)에 접속
2. API 키 생성
3. 생성된 키를 `.env.local` 파일에 입력

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

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

## 향후 개발 계획

- [ ] 업스케일링 기능 (Real-ESRGAN)
- [ ] 갤러리 기능
- [ ] 이미지 히스토리 저장
- [ ] 다중 참조 이미지 지원 (최대 14개)
- [ ] Google Search grounding 통합
- [ ] 실시간 협업 기능

## 참고 자료

- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Image Generation with Gemini](https://ai.google.dev/gemini-api/docs/image-generation)
- [Fabric.js Documentation](http://fabricjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트를 환영합니다.
