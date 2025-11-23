# Advanced Settings - 고급 설정 가이드

이 문서는 Weet AI Studio의 고급 설정 기능에 대한 개발자 가이드입니다.

## 구현 완료 사항

### 1. 타입 정의 (src/types/index.ts)

```typescript
export type ModelType = 'gemini-2.5-flash' | 'gemini-3-pro';

export interface ImageGenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  numberOfImages: number;
  // Advanced Settings
  model?: ModelType;
  style?: string;
  lighting?: string;
  camera?: string;
  mood?: string;
  negativePrompt?: string;
  useGrounding?: boolean; // Google Search grounding (Pro model only)
}
```

### 2. 모델 선택 (src/lib/gemini.ts)

- **Gemini 2.5 Flash** (`gemini-2.5-flash-image`): 빠른 속도, 1024px 해상도
- **Gemini 3 Pro** (`gemini-3-pro-image-preview`): 고급 기능, 최대 4K 해상도

```typescript
const MODEL_MAP: Record<ModelType, string> = {
  'gemini-2.5-flash': 'gemini-2.5-flash-image',
  'gemini-3-pro': 'gemini-3-pro-image-preview'
};
```

### 3. 프롬프트 강화 (Prompt Engineering)

`enhancePrompt()` 함수가 사용자 입력과 고급 설정을 자연스럽게 조합:

```typescript
// 입력: "A beautiful landscape"
// Style: "Photorealistic"
// Lighting: "Golden hour"
// Camera: "Wide-angle lens"
// Mood: "Peaceful"

// 결과: "A beautiful landscape, Photorealistic style, Golden hour lighting,
//       shot with Wide-angle lens, Peaceful atmosphere"
```

### 4. Negative Prompt 처리

부정 프롬프트는 "Avoid:" 키워드와 함께 자연어 제약 조건으로 추가:

```typescript
// negativePrompt: "blur, noise, artifacts"
// 결과: "...your prompt... Avoid: blur, noise, artifacts"
```

### 5. Google Search Grounding

Pro 모델 전용 기능으로, 실시간 정보 기반 이미지 생성:

```typescript
if (config.useGrounding && modelType === 'gemini-3-pro') {
  requestBody.generationConfig.tools = [{ google_search: {} }];
  console.log('🔍 Grounding enabled with Google Search');
}
```

**사용 예시:**
- "Visualize the current weather forecast for Seoul"
- "Create a chart of recent stock market trends"
- "Generate an infographic about the latest tech news"

## UI 컴포넌트

### AdvancedSettings.tsx (src/components/ui/AdvancedSettings.tsx)

플라이아웃 패널 형태로 다음 설정 제공:

1. **Model Selection**: Flash (빠름) vs Pro (고급)
2. **Style**: Photorealistic, Anime, Oil Painting, Watercolor 등
3. **Lighting**: Golden hour, Studio, Cinematic, Natural 등
4. **Camera**: Wide-angle, Macro, Portrait, Drone 등
5. **Mood**: Peaceful, Dramatic, Mysterious, Joyful 등
6. **Negative Prompt**: 제외할 요소들
7. **Google Grounding**: Pro 모델 전용, 실시간 정보 활용

## 상태 관리 (src/app/page.tsx)

```typescript
// Advanced Settings State
const [model, setModel] = useState<'gemini-2.5-flash' | 'gemini-3-pro'>('gemini-2.5-flash');
const [style, setStyle] = useState('');
const [lighting, setLighting] = useState('');
const [camera, setCamera] = useState('');
const [mood, setMood] = useState('');
const [negativePrompt, setNegativePrompt] = useState('');
const [useGrounding, setUseGrounding] = useState(false);
```

## API 연동

### 이미지 생성 (handleGenerate)

```typescript
const result = await generateImage(
  {
    prompt,
    aspectRatio: aspectRatio as AspectRatio,
    imageSize: resolution as ImageSize,
    numberOfImages: 1,
    // Advanced Settings
    model,
    style: style || undefined,
    lighting: lighting || undefined,
    camera: camera || undefined,
    mood: mood || undefined,
    negativePrompt: negativePrompt || undefined,
    useGrounding,
  },
  latestHistory
);
```

### 이미지 편집 (handleEditSubmit)

```typescript
const advancedSettings = {
  model,
  style: style || undefined,
  lighting: lighting || undefined,
  camera: camera || undefined,
  mood: mood || undefined,
  negativePrompt: negativePrompt || undefined,
  useGrounding,
};

const result = await editImage(
  maskedImageBase64,
  editPrompt,
  aspectRatio as AspectRatio,
  resolution as ImageSize,
  conversationHistory,
  advancedSettings
);
```

## 콘솔 로그

개발 중 다음 로그로 설정 확인 가능:

```
🎨 Model: gemini-3-pro-image-preview
📝 Enhanced Prompt: A beautiful landscape, Photorealistic style, Golden hour lighting...
🔍 Grounding enabled with Google Search (Pro 모델 사용 시)
```

## 참고 자료

- **image-prompt-guide.md**: Gemini 이미지 생성 공식 가이드
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs/imagen)

## 사용 예시

### 예시 1: 사실적인 풍경 사진

```
Prompt: "Mountain landscape at sunrise"
Model: Gemini 3 Pro
Style: Photorealistic
Lighting: Golden hour
Camera: Wide-angle lens
Mood: Peaceful
Resolution: 4K
```

### 예시 2: 애니메이션 캐릭터

```
Prompt: "Young girl reading a book in library"
Model: Gemini 2.5 Flash
Style: Anime
Lighting: Soft natural light
Mood: Cozy
Negative Prompt: "realistic, 3D, photographic"
Resolution: 2K
```

### 예시 3: Google Grounding 활용

```
Prompt: "Current weather map of Tokyo with temperature zones"
Model: Gemini 3 Pro
Style: Modern infographic
Grounding: ON (Google Search)
Resolution: 2K
```

## 제한사항

1. **Google Grounding**은 Pro 모델에서만 사용 가능
2. **4K 해상도**는 Pro 모델에서만 지원
3. Grounding 사용 시 `responseModalities`에 'TEXT' 포함 필수
4. Negative prompt는 자연어 형태로 처리 (Gemini API에 네이티브 negative prompt 없음)

## 추가 개선 가능 사항

- [ ] 스타일 프리셋 저장/불러오기
- [ ] 자주 사용하는 설정 즐겨찾기
- [ ] 고급 설정 on/off 토글
- [ ] 설정별 결과 비교 기능
