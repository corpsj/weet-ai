import { ImageGenerationConfig, GeneratedImage, ConversationHistory, AspectRatio, ImageSize, ImageType, ModelType } from '@/types';

// Model mapping
const MODEL_MAP: Record<ModelType, string> = {
  'gemini-2.5-flash': 'gemini-2.5-flash-image',
  'gemini-3-pro': 'gemini-3-pro-image-preview'
};

function getApiKey(): string | undefined {
  // 1. localStorage에서 먼저 확인 (Settings에서 설정한 키)
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey?.trim()) return storedKey;
  }
  // 2. 환경 변수 fallback
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey?.trim()) return envKey;

  return undefined;
}

/**
 * API 키가 설정되어 있는지 확인합니다.
 */
export function isApiKeyConfigured(): boolean {
  const key = getApiKey();
  return !!key && key.trim().length > 0;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
      role: string;
    };
    finishReason: string;
    thoughtSignature?: string;
  }>;
}

/**
 * 고급 설정을 기반으로 프롬프트를 강화합니다.
 */
function enhancePrompt(config: ImageGenerationConfig): string {
  let enhancedPrompt = config.prompt;

  // Style, lighting, camera, mood를 자연스럽게 조합
  const descriptors: string[] = [];

  if (config.style) {
    descriptors.push(`${config.style} style`);
  }

  if (config.lighting) {
    descriptors.push(`${config.lighting} lighting`);
  }

  if (config.camera) {
    descriptors.push(`shot with ${config.camera}`);
  }

  if (config.mood) {
    descriptors.push(`${config.mood} atmosphere`);
  }

  // 프롬프트에 설명 추가
  if (descriptors.length > 0) {
    enhancedPrompt = `${enhancedPrompt}, ${descriptors.join(', ')}`;
  }

  // Negative prompt 처리 (자연어 제약 조건)
  if (config.negativePrompt) {
    enhancedPrompt = `${enhancedPrompt}. Avoid: ${config.negativePrompt}`;
  }

  return enhancedPrompt;
}

/**
 * 대화 히스토리를 최근 N개로 제한합니다.
 * API 비용과 메모리를 절약하기 위해 너무 오래된 대화는 제거합니다.
 */
function limitConversationHistory(
  history: ConversationHistory[],
  maxEntries: number = 10
): ConversationHistory[] {
  if (history.length <= maxEntries) {
    return history;
  }
  // 최근 항목만 유지
  return history.slice(-maxEntries);
}

/**
 * Gemini API를 호출하여 이미지를 생성합니다.
 * 개발자 가이드에 따라 thought signature를 포함한 전체 응답을 반환합니다.
 */
export async function generateImage(
  config: ImageGenerationConfig,
  conversationHistory: ConversationHistory[] = [],
  imageType: ImageType = 'generated'
): Promise<{
  images: GeneratedImage[];
  conversationHistory: ConversationHistory[];
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set it in Settings or .env.local');
  }

  // 모델 선택 (기본값: gemini-3-pro)
  const modelType = config.model || 'gemini-3-pro';
  const modelName = MODEL_MAP[modelType];
  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  // 고급 설정을 반영하여 프롬프트 강화
  const enhancedPrompt = enhancePrompt(config);

  console.log('🎨 Model:', modelName);
  console.log('📝 Enhanced Prompt:', enhancedPrompt);

  // Limit conversation history to prevent excessive token usage
  const limitedHistory = limitConversationHistory(conversationHistory);
  const contents: any[] = [...limitedHistory];

  // 새로운 사용자 요청 추가
  const userContent: any = {
    role: 'user',
    parts: [{ text: enhancedPrompt }]
  };

  // 마스크 또는 참조 이미지가 있는 경우 추가
  if (config.referenceImage) {
    console.log('📷 Ref image:', config.referenceImage.length);
    userContent.parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: config.referenceImage
      }
    });
  }

  // Multiple reference images (up to 13)
  if (config.referenceImages && config.referenceImages.length > 0) {
    console.log('📷 Ref images count:', config.referenceImages.length);
    config.referenceImages.forEach((refImg) => {
      userContent.parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: refImg
        }
      });
    });
  }

  if (config.maskData) {
    console.log('🎭 Mask:', config.maskData.length);
    userContent.parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: config.maskData
      }
    });
  }

  contents.push(userContent);

  console.log('📤 API parts:', userContent.parts.length);

  // Request body 구성
  const requestBody: any = {
    contents,
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'], // Grounding 사용 시 TEXT 필요
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      candidateCount: 1, // Gemini API는 현재 단일 후보만 지원
      imageConfig: {
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize
      }
    }
  };

  // Google Search Grounding (Pro 모델 전용) - tools는 최상위 레벨에 위치
  if (config.useGrounding && modelType === 'gemini-3-pro') {
    requestBody.tools = [{ google_search: {} }];
    console.log('🔍 Grounding enabled with Google Search');
  }

  // Retry logic for transient errors
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API attempt ${attempt}/${maxRetries}`);

      const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Unknown error';
        const errorCode = errorData.error?.code || response.status;

        // If it's a 500 error and we have retries left, retry
        if (errorCode === 500 && attempt < maxRetries) {
          console.warn(`⚠️ 500 error, retrying in ${attempt}s...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }

        // For other errors or last retry, throw with detailed message
        if (errorCode === 500) {
          throw new Error(
            `Gemini API 서버 오류가 발생했습니다. ` +
            `모델명(${modelName})이 올바른지 확인하거나 잠시 후 다시 시도해주세요. ` +
            `상세: ${errorMessage}`
          );
        }

        throw new Error(`Gemini API error (${errorCode}): ${errorMessage}`);
      }

      const data: GeminiResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      const images: GeneratedImage[] = [];

      // 이미지 데이터 추출 (thought signature 보존)
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          images.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            base64Data: part.inlineData.data,
            prompt: config.prompt,
            timestamp: Date.now(),
            config,
            type: imageType,
            thoughtSignature: candidate.thoughtSignature
          });
        }
      }

      // 대화 히스토리 업데이트 (thought signature 포함)
      const updatedHistory: ConversationHistory[] = [
        ...contents,
        {
          role: 'model',
          parts: candidate.content.parts,
          thoughtSignature: candidate.thoughtSignature
        }
      ];

      return {
        images,
        conversationHistory: updatedHistory
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Attempt ${attempt} failed:`, lastError.message);

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // For 500 errors, wait before retrying
      if (lastError.message.includes('500')) {
        console.log(`⏳ Waiting ${attempt}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Unknown error occurred');
}

/**
 * 이미지를 편집합니다
 * 마스킹된 이미지(원본 이미지 + 마스크 오버레이)를 직접 받아서 처리합니다.
 */
export async function editImage(
  maskedImage: string, // 마스킹이 오버레이된 이미지
  editPrompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize,
  conversationHistory: ConversationHistory[],
  advancedSettings?: {
    model?: ModelType;
    style?: string;
    lighting?: string;
    camera?: string;
    mood?: string;
    negativePrompt?: string;
    useGrounding?: boolean;
    referenceImages?: string[];
  }
): Promise<{
  images: GeneratedImage[];
  conversationHistory: ConversationHistory[];
}> {
  // 마스킹된 영역(빨간색으로 표시된 부분)만 변경하도록 지시
  const semanticPrompt = `The provided image contains red markings which act as a mask. These red marked areas indicate exactly where you must generate new content based on this prompt: "${editPrompt}". \n\nIMPORTANT INSTRUCTIONS:\n1. Completely replace the content covered by the red markings.\n2. The red markings themselves MUST NOT appear in the final image.\n3. Keep all other parts of the image exactly the same.\n4. Ensure the new content blends seamlessly with the original style, lighting, and composition.`;

  const config: ImageGenerationConfig = {
    prompt: semanticPrompt,
    aspectRatio,
    imageSize,
    numberOfImages: 1,
    referenceImage: maskedImage, // 마스킹된 이미지를 참조 이미지로 전달
    // Advanced Settings
    ...advancedSettings,
  };

  return generateImage(config, conversationHistory, 'edited');
}

/**
 * Base64 이미지를 Blob으로 변환
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeType });
}

/**
 * 이미지를 다운로드합니다
 */
export function downloadImage(base64Data: string, filename: string = 'generated-image.png') {
  const mimeType = filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')
    ? 'image/jpeg'
    : 'image/png';
  const blob = base64ToBlob(base64Data, mimeType);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
