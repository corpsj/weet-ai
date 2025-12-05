import { GeneratedImage } from '@/types';

// Load images from server
export const loadImagesFromStorage = async (): Promise<GeneratedImage[]> => {
  try {
    const response = await fetch('/api/images');
    if (!response.ok) {
      throw new Error('Failed to load images');
    }
    const data = await response.json();

    // Load base64 data for each image
    const imagesWithData = await Promise.all(
      data.images.map(async (img: GeneratedImage) => {
        try {
          // Load image from public folder
          const imageResponse = await fetch(`/generated-images/${img.id}.png`);
          if (imageResponse.ok) {
            const blob = await imageResponse.blob();
            const base64Data = await blobToBase64(blob);

            // Generate thumbnail for gallery display
            let thumbnailData: string | undefined;
            try {
              thumbnailData = await generateThumbnail(base64Data, 300);
            } catch (thumbError) {
              console.warn(`Failed to generate thumbnail for ${img.id}:`, thumbError);
              // Use original as fallback (will be slower but functional)
              thumbnailData = base64Data;
            }

            return { ...img, base64Data, thumbnailData };
          }
          // Return null if image file not found
          console.warn(`Image file not found: ${img.id}`);
          return null;
        } catch (error) {
          console.error(`Failed to load image ${img.id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed images
    return imagesWithData.filter((img): img is GeneratedImage => img !== null && !!img.base64Data);
  } catch (error) {
    console.error('Failed to load images from server:', error);
    return [];
  }
};

// Save images to server
// Save images to server
export const addImagesToGallery = async (newImages: GeneratedImage[]): Promise<void> => {
  try {
    const formData = new FormData();

    // Append each image as a separate field or a JSON string for metadata + files
    // Strategy: Send metadata as JSON, but exclude base64Data. Send base64Data as files.

    const imagesMetadata = newImages.map(img => {
      // Remove all large base64 data from metadata
      const { base64Data, thumbnailData, ...rest } = img;
      // Also remove base64 data from config
      const cleanConfig = { ...rest.config };
      delete cleanConfig.maskData;
      delete cleanConfig.referenceImage;
      delete cleanConfig.referenceImages;
      return { ...rest, config: cleanConfig };
    });

    formData.append('metadata', JSON.stringify(imagesMetadata));

    // Convert base64 to blobs and append as files
    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i];
      const response = await fetch(`data:image/png;base64,${img.base64Data}`);
      const blob = await response.blob();
      formData.append('files', blob, `${img.id}.png`);
    }

    const response = await fetch('/api/images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save images');
    }

    console.log(`Successfully saved ${newImages.length} images to server`);
  } catch (error) {
    console.error('Failed to add images to gallery:', error);
    throw error;
  }
};

// Delete a specific image
export const deleteImageFromStorage = async (imageId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/images/${imageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    throw error;
  }
};

// Clear all images
export const clearAllImages = async (): Promise<void> => {
  try {
    const response = await fetch('/api/images', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear images');
    }
  } catch (error) {
    console.error('Failed to clear images:', error);
    throw error;
  }
};

// Helper: Convert Blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data:image/png;base64, prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper: Generate thumbnail from base64 image data
function generateThumbnail(base64Data: string, maxSize: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate thumbnail dimensions
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with compression (quality 0.7)
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const thumbnailBase64 = thumbnailDataUrl.split(',')[1];
      resolve(thumbnailBase64);
    };
    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = `data:image/png;base64,${base64Data}`;
  });
}

// Minimal 1x1 transparent PNG in base64 (for dummy images)
const PLACEHOLDER_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Add dummy images for testing
export const addDummyImages = async (): Promise<void> => {
  const dummyPrompts = [
    'A serene mountain landscape with snow-capped peaks at sunset',
    'Futuristic cityscape with neon lights and flying cars',
    'Cute kitten playing with a ball of yarn in a cozy living room',
    'Abstract geometric patterns in vibrant colors',
    'Peaceful zen garden with cherry blossoms and stone pathway',
    'Underwater scene with colorful coral reef and tropical fish',
    'Rustic coffee shop interior with warm lighting',
    'Magical forest with glowing mushrooms and fireflies',
    'Modern minimalist bedroom with large windows',
    'Vintage bicycle leaning against a brick wall covered in ivy'
  ];

  const imageTypes: any[] = ['generated', 'generated', 'edited', 'generated', 'upscaled', 'edited', 'generated', 'generated', 'edited', 'upscaled'];
  const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '1:1', '16:9', '1:1', '4:3', '16:9', '1:1'];
  const imageSizes = ['2K', '4K', '2K', '1K', '4K', '2K', '1K', '2K', '4K', '2K'];

  const baseTimestamp = Date.now();

  const dummyImages: GeneratedImage[] = dummyPrompts.map((prompt, index) => ({
    id: `dummy-${Date.now()}-${index}`,
    base64Data: PLACEHOLDER_IMAGE,
    prompt,
    timestamp: baseTimestamp - (index * 3600000), // 1 hour apart
    type: imageTypes[index],
    config: {
      prompt,
      aspectRatio: aspectRatios[index] as any,
      imageSize: imageSizes[index] as any,
      numberOfImages: 1,
    },
  }));

  await addImagesToGallery(dummyImages);
};
