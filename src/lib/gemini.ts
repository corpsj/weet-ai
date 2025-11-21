import { ImageGenerationConfig, GeneratedImage, ConversationHistory, AspectRatio, ImageSize, ImageType } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL = 'gemini-3-pro-image-preview';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * API 키가 설정되어 있는지 확인합니다.
 */
export function isApiKeyConfigured(): boolean {
  return !!API_KEY && API_KEY.trim().length > 0;
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
 * Gemini 개발자 가이드 권장사항에 따라 프롬프트를 최적화합니다.
 * "Describe the scene, don't just list keywords" - 서술형 프롬프트로 변환
 */
function optimizePrompt(userPrompt: string): string {
  // 사용자가 이미 서술형으로 작성한 경우 그대로 사용
  if (userPrompt.length > 50 && userPrompt.includes(' ') && !userPrompt.includes(',')) {
    return userPrompt;
  }

  // 키워드 리스트인 경우 서술형으로 변환 제안
  return `Create an image with the following characteristics: ${userPrompt}.
Focus on composition, lighting, and atmosphere to create a cohesive scene.`;
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
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
  }

  const optimizedPrompt = optimizePrompt(config.prompt);

  // Limit conversation history to prevent excessive token usage
  const limitedHistory = limitConversationHistory(conversationHistory);
  const contents: any[] = [...limitedHistory];

  // 새로운 사용자 요청 추가
  const userContent: any = {
    role: 'user',
    parts: [{ text: optimizedPrompt }]
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

  const requestBody = {
    contents,
    generationConfig: {
      responseModalities: ['IMAGE'],
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

  try {
    const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
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
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    console.error('Error generating image:', error);
    throw error;
  }
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
  conversationHistory: ConversationHistory[]
): Promise<{
  images: GeneratedImage[];
  conversationHistory: ConversationHistory[];
}> {
  // 마스킹된 영역(빨간색으로 표시된 부분)만 변경하도록 지시
  const semanticPrompt = `In the provided image, the areas marked in red indicate where changes should be made. ${editPrompt}. Change only these marked areas while keeping everything else exactly the same, preserving the original style, lighting, and composition.`;

  const config: ImageGenerationConfig = {
    prompt: semanticPrompt,
    aspectRatio,
    imageSize,
    numberOfImages: 1,
    referenceImage: maskedImage, // 마스킹된 이미지를 참조 이미지로 전달
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
  const blob = base64ToBlob(base64Data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
