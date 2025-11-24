export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '5:4' | '4:5';
export type ImageSize = '1K' | '2K' | '4K';
export type ModelType = 'gemini-2.5-flash' | 'gemini-3-pro';

export interface ImageGenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  numberOfImages: number;
  maskData?: string; // Base64 encoded mask image for editing
  referenceImage?: string; // Base64 encoded reference image
  referenceImages?: string[]; // Array of Base64 encoded reference images (up to 13)
  // Advanced Settings
  model?: ModelType;
  style?: string;
  lighting?: string;
  camera?: string;
  mood?: string;
  negativePrompt?: string;
  useGrounding?: boolean; // Google Search grounding (Pro model only)
}

export type ImageType = 'generated' | 'edited' | 'upscaled';

export interface GeneratedImage {
  id: string;
  base64Data: string;
  thumbnailData?: string; // Compressed thumbnail for gallery display
  prompt: string;
  timestamp: number;
  config: ImageGenerationConfig;
  type: ImageType;
  thoughtSignature?: string; // Required for conversational editing
}

export interface ConversationHistory {
  role: 'user' | 'model';
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
  }>;
  thoughtSignature?: string;
}

export interface MaskPoint {
  x: number;
  y: number;
}

export interface CanvasTool {
  type: 'brush';
  size: number;
}

export interface MaskLine {
  tool: 'brush' | 'select';
  points: number[];
  size: number;
}
