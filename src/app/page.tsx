'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/ui/Sidebar';
import { Toolbar, ToolType } from '@/components/ui/Toolbar';
import { Gallery } from '@/components/ui/Gallery';
import { Toast, ToastType } from '@/components/ui/Toast';
import { ImageSelectionStrip } from '@/components/ui/ImageSelectionStrip';
import { Upload } from 'lucide-react';
import { generateImage, editImage, downloadImage, isApiKeyConfigured } from '@/lib/gemini';
import { addImagesToGallery, loadImagesFromStorage, deleteImageFromStorage } from '@/lib/storage';
import {
  GeneratedImage,
  AspectRatio,
  ImageSize,
  ConversationHistory,
} from '@/types';

// Load Canvas only on client side to avoid Konva SSR issues
const Canvas = dynamic(() => import('@/components/ui/Canvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500">캔버스 로딩 중...</div>
    </div>
  ),
});

export default function Home() {
  const router = useRouter();
  // State management
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');
  const [resolution, setResolution] = useState<string>('2K');
  const [imageCount, setImageCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Advanced Settings
  const [model, setModel] = useState<'gemini-2.5-flash' | 'gemini-3-pro'>('gemini-3-pro');
  const [style, setStyle] = useState('');
  const [lighting, setLighting] = useState('');
  const [camera, setCamera] = useState('');
  const [mood, setMood] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [useGrounding, setUseGrounding] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // Strip Visibility State
  const [isStripOpen, setIsStripOpen] = useState(true);

  // Canvas state
  interface MaskLine {
    tool: ToolType;
    points: number[];
    size: number;
  }

  const [tool, setTool] = useState<ToolType>('select');
  const [brushSize, setBrushSize] = useState(20);
  const [maskLines, setMaskLines] = useState<MaskLine[]>([]);
  const [history, setHistory] = useState<MaskLine[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Images
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);

  // Load edit image from gallery if requested
  useEffect(() => {
    const loadEditImage = async () => {
      // Check if there's an image to edit from the gallery (by ID)
      const editImageId = localStorage.getItem('weet-ai-edit-image-id');
      if (editImageId) {
        try {
          // Load all images from server storage and find the one to edit
          const allImages = await loadImagesFromStorage();
          const editImage = allImages.find(img => img.id === editImageId);

          if (editImage) {
            setImages([editImage]);
            setCurrentImageIndex(0);
          }

          // Clear the flag
          localStorage.removeItem('weet-ai-edit-image-id');
        } catch (e) {
          console.error('Failed to load edit image', e);
          showToast('이미지를 불러오는 중 오류가 발생했습니다', 'error');
        }
      }
    };

    loadEditImage();
  }, [showToast]);

  // Gallery
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GeneratedImage[]>([]);

  // Load gallery images when gallery opens or when images array changes
  useEffect(() => {
    if (isGalleryOpen) {
      loadImagesFromStorage().then((savedImages) => {
        setGalleryImages(savedImages);
      });
    }
  }, [isGalleryOpen, images]);

  // Canvas ref
  const stageRef = useRef<any>(null); // Konva.Stage type
  const imageNodeRef = useRef<any>(null); // Current image node
  const canvasMethodsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
  } | null>(null);

  // Check API key on mount
  useEffect(() => {
    if (!isApiKeyConfigured()) {
      showToast('Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 키를 등록해주세요.', 'error');
    }
  }, [showToast]);

  const currentImage = currentImageIndex >= 0 ? images[currentImageIndex] : null;
  const currentImageUrl = useMemo(() => {
    return currentImage ? `data:image/png;base64,${currentImage.base64Data}` : undefined;
  }, [currentImage]);

  // Memoize Canvas callbacks to prevent unnecessary re-renders
  const handleCanvasReady = useCallback((stage: any, methods: any, imageNode: any) => {
    stageRef.current = stage;
    canvasMethodsRef.current = methods;
    imageNodeRef.current = imageNode;
  }, []);

  const handleImageLoad = useCallback((imageNode: any) => {
    imageNodeRef.current = imageNode;
  }, []);

  // Reset imageNodeRef when current image changes to prevent overlap
  useEffect(() => {
    imageNodeRef.current = null;
  }, [currentImageUrl]);

  // Generate image handler
  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Check if there's a mask for editing
      if (maskLines.length > 0 && currentImage) {
        // Extract masked image from Konva stage
        const maskedImageBase64 = await extractMaskedImageFromStage();

        if (maskedImageBase64) {
          const result = await editImage(
            maskedImageBase64,
            prompt,
            aspectRatio as AspectRatio,
            resolution as ImageSize,
            conversationHistory,
            // Advanced Settings
            {
              model,
              style: style || undefined,
              lighting: lighting || undefined,
              camera: camera || undefined,
              mood: mood || undefined,
              negativePrompt: negativePrompt || undefined,
              useGrounding,
            }
          );

          if (result.images.length > 0) {
            // Add to gallery (server storage)
            await addImagesToGallery(result.images);

            // Add to current session
            setImages((prevImages) => {
              const newImages = [...prevImages, ...result.images];
              setCurrentImageIndex(prevImages.length); // Select the first new image
              return newImages;
            });
            setConversationHistory(result.conversationHistory);
            setMaskLines([]);
            setHistory([[]]);
            setHistoryStep(0);
            showToast('이미지 편집이 완료되었습니다', 'success');
          }
        }
      } else {
        // Generate new images
        const allGeneratedImages: GeneratedImage[] = [];
        let latestHistory = conversationHistory;

        for (let i = 0; i < imageCount; i++) {
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

          if (result.images.length > 0) {
            allGeneratedImages.push(...result.images);
            latestHistory = result.conversationHistory;
          }
        }

        if (allGeneratedImages.length > 0) {
          // Add to gallery (server storage)
          await addImagesToGallery(allGeneratedImages);

          // Add to current session
          setImages((prevImages) => {
            const newImages = [...prevImages, ...allGeneratedImages];
            // If multiple images generated, stay on the first one or the last one?
            // Let's select the first of the new batch
            setCurrentImageIndex(prevImages.length);
            return newImages;
          });
          setConversationHistory(latestHistory);
          setIsStripOpen(true); // Auto-show strip on new generation
          showToast(`${allGeneratedImages.length}장의 이미지가 생성되었습니다`, 'success');
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      showToast(err instanceof Error ? err.message : '이미지 생성에 실패했습니다', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract masked image (original image + mask overlay) from Konva canvas
  const extractMaskedImageFromStage = useCallback(async (): Promise<string | null> => {
    if (!stageRef.current || !imageNodeRef.current) return null;

    const imageNode = imageNodeRef.current;
    const imageElement = imageNode.image() as HTMLImageElement;

    if (!imageElement) return null;

    // Get original image dimensions
    const originalWidth = imageElement.naturalWidth || imageElement.width;
    const originalHeight = imageElement.naturalHeight || imageElement.height;

    // Create a temporary canvas with the size of the original image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;
    const ctx = tempCanvas.getContext('2d')!;

    // Draw the original image
    ctx.drawImage(imageElement, 0, 0, originalWidth, originalHeight);

    // Calculate scale factor from imageNode display size to original image size
    const displayWidth = imageNode.width();
    if (displayWidth === 0) {
      console.error('Image display width is 0, cannot calculate scale factor');
      return null;
    }
    const scaleFactor = originalWidth / displayWidth;

    // Draw mask lines on top of the image (in red/semi-transparent for visibility)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';

    let drawnLines = 0;
    maskLines.forEach((line) => {
      ctx.lineWidth = line.size * scaleFactor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < line.points.length; i += 2) {
        const x = line.points[i] * scaleFactor;
        const y = line.points[i + 1] * scaleFactor;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      drawnLines++;
    });

    // Convert to base64
    const dataUrl = tempCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];

    console.log('🖼️ Masked image:', drawnLines, 'lines', originalWidth + 'x' + originalHeight);
    console.log('👉 Paste in browser to preview:', dataUrl.substring(0, 100) + '...');

    return base64;
  }, [maskLines]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setMaskLines(history[newStep]);
    }
  }, [history, historyStep]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setMaskLines(history[newStep]);
    }
  }, [history, historyStep]);

  // Update history when mask lines change
  const updateMaskLines = useCallback((updater: MaskLine[] | ((prev: MaskLine[]) => MaskLine[])) => {
    const newLines = typeof updater === 'function' ? updater(maskLines) : updater;
    setMaskLines(newLines);
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyStep + 1);
      newHistory.push(newLines);
      return newHistory;
    });
    setHistoryStep((prevStep) => prevStep + 1);
  }, [maskLines, historyStep]);

  // Navigation
  const handlePrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setMaskLines([]);
      setHistory([[]]);
      setHistoryStep(0);
      if (canvasMethodsRef.current) {
        canvasMethodsRef.current.resetView();
      }
    }
  }, [currentImageIndex]);

  const handleNextImage = useCallback(() => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setMaskLines([]);
      setHistory([[]]);
      setHistoryStep(0);
      if (canvasMethodsRef.current) {
        canvasMethodsRef.current.resetView();
      }
    }
  }, [currentImageIndex, images.length]);

  // Clear current image
  const handleClearImage = useCallback(() => {
    setCurrentImageIndex(-1);
    setMaskLines([]);
    setHistory([[]]);
    setHistoryStep(0);
    setEditPrompt('');
    setTool('select');
    if (canvasMethodsRef.current) {
      canvasMethodsRef.current.resetView();
    }
  }, []);

  // Download
  const handleDownload = useCallback(() => {
    if (currentImage) {
      downloadImage(
        currentImage.base64Data,
        `weet-ai-${currentImage.timestamp}.png`
      );
      showToast('이미지가 다운로드되었습니다', 'success');
    }
  }, [currentImage, showToast]);

  // Upscale with Real-ESRGAN (Redirect to Upscale Page)
  const handleUpscale = useCallback(() => {
    if (!currentImage) return;

    // Save current image to localStorage for the Upscale page
    localStorage.setItem('upscale_source_image', currentImage.base64Data);

    // Navigate to Upscale page
    router.push('/upscale');
  }, [currentImage, router]);

  // Handle edit prompt submission
  const handleEditSubmit = useCallback(async () => {
    if (!editPrompt.trim() || !currentImage) return;

    setIsGenerating(true);

    try {
      let result;

      // Advanced settings for editing
      const advancedSettings = {
        model,
        style: style || undefined,
        lighting: lighting || undefined,
        camera: camera || undefined,
        mood: mood || undefined,
        negativePrompt: negativePrompt || undefined,
        useGrounding,
      };

      // If there are mask lines, do masked editing
      if (maskLines.length > 0) {
        const maskedImageBase64 = await extractMaskedImageFromStage();
        if (!maskedImageBase64) {
          showToast('마스킹된 이미지를 추출할 수 없습니다', 'error');
          return;
        }

        result = await editImage(
          maskedImageBase64,
          editPrompt,
          aspectRatio as AspectRatio,
          resolution as ImageSize,
          conversationHistory,
          advancedSettings
        );
      } else {
        // No mask - generate new image based on current image + prompt
        result = await editImage(
          currentImage.base64Data,
          editPrompt,
          aspectRatio as AspectRatio,
          resolution as ImageSize,
          conversationHistory,
          advancedSettings
        );
      }

      if (result.images.length > 0) {
        // Add to gallery (server storage)
        await addImagesToGallery(result.images);

        // Add to current session
        setImages((prevImages) => {
          const newImages = [...prevImages, ...result.images];
          setCurrentImageIndex(prevImages.length);
          return newImages;
        });
        setConversationHistory(result.conversationHistory);
        setMaskLines([]);
        setHistory([[]]);
        setHistoryStep(0);
        setEditPrompt('');
        showToast('이미지 변형이 완료되었습니다', 'success');
      }
    } catch (err) {
      console.error('Edit error:', err);
      showToast(err instanceof Error ? err.message : '이미지 변형에 실패했습니다', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [editPrompt, currentImage, maskLines, aspectRatio, resolution, conversationHistory, extractMaskedImageFromStage, model, style, lighting, camera, mood, negativePrompt, useGrounding, showToast]);

  // Zoom
  const handleZoomIn = useCallback(() => {
    if (canvasMethodsRef.current) {
      canvasMethodsRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (canvasMethodsRef.current) {
      canvasMethodsRef.current.zoomOut();
    }
  }, []);

  // Image Upload
  const handleImageUpload = useCallback(async (base64Data: string) => {
    const newImage: GeneratedImage = {
      id: `uploaded-${Date.now()}`,
      base64Data: base64Data,
      prompt: 'Uploaded image',
      timestamp: Date.now(),
      config: {
        prompt: 'Uploaded image',
        aspectRatio: aspectRatio as AspectRatio,
        imageSize: resolution as ImageSize,
        numberOfImages: 1,
      },
      type: 'generated',
    };

    // Add to gallery (server storage)
    await addImagesToGallery([newImage]);

    // Add to current session
    setImages((prevImages) => {
      const newImages = [...prevImages, newImage];
      setCurrentImageIndex(prevImages.length);
      return newImages;
    });
    setMaskLines([]);
    setHistory([[]]);
    setHistoryStep(0);
    if (canvasMethodsRef.current) {
      canvasMethodsRef.current.resetView();
    }
    showToast('이미지가 업로드되었습니다', 'success');
  }, [aspectRatio, resolution, showToast]);

  // Gallery handlers
  const handleSelectFromGallery = (index: number) => {
    const selectedImage = galleryImages[index];
    // Set as current working image
    setImages([selectedImage]);
    setCurrentImageIndex(0);
    setMaskLines([]);
    setHistory([[]]);
    setHistoryStep(0);
    setIsGalleryOpen(false);
    if (canvasMethodsRef.current) {
      canvasMethodsRef.current.resetView();
    }
  };

  const handleDeleteFromGallery = async (index: number) => {
    const imageToDelete = galleryImages[index];

    // Delete from server storage
    await deleteImageFromStorage(imageToDelete.id);

    // Update local gallery state
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updatedGallery);

    // Also remove from current session images if it exists
    const sessionImageIndex = images.findIndex(img => img.id === imageToDelete.id);
    if (sessionImageIndex !== -1) {
      const updatedImages = images.filter((_, i) => i !== sessionImageIndex);
      setImages(updatedImages);

      // Adjust current image index if necessary
      if (currentImageIndex === sessionImageIndex) {
        // If we're deleting the current image, clear it
        setCurrentImageIndex(-1);
        setMaskLines([]);
        setHistory([[]]);
        setHistoryStep(0);
      } else if (currentImageIndex > sessionImageIndex) {
        // If we're deleting an image before the current one, adjust index
        setCurrentImageIndex(currentImageIndex - 1);
      }
    }
    showToast('이미지가 삭제되었습니다', 'info');
  };

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File processing helper
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 업로드할 수 있습니다', 'error');
      return;
    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      showToast('파일 크기는 10MB를 초과할 수 없습니다', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(',')[1];
      handleImageUpload(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = ''; // Reset input
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Image Selection Handler
  const handleSelectImage = (index: number) => {
    setCurrentImageIndex(index);
    setMaskLines([]);
    setHistory([[]]);
    setHistoryStep(0);
    imageNodeRef.current = null;
    if (canvasMethodsRef.current) {
      canvasMethodsRef.current.resetView();
    }
    setIsStripOpen(false); // Auto-hide strip on selection
  };

  const handleToggleStrip = () => {
    setIsStripOpen(!isStripOpen);
  };

  return (
    <div className="flex h-full overflow-hidden bg-zinc-950">
      <Sidebar
        prompt={prompt}
        setPrompt={setPrompt}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        resolution={resolution}
        setResolution={setResolution}
        imageCount={imageCount}
        setImageCount={setImageCount}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        isGalleryOpen={isGalleryOpen}
        onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}

        // Advanced Settings Props
        model={model}
        setModel={setModel}
        style={style}
        setStyle={setStyle}
        lighting={lighting}
        setLighting={setLighting}
        camera={camera}
        setCamera={setCamera}
        mood={mood}
        setMood={setMood}
        negativePrompt={negativePrompt}
        setNegativePrompt={setNegativePrompt}
        useGrounding={useGrounding}
        setUseGrounding={setUseGrounding}
      />

      <main
        className="flex-1 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/20 border-4 border-blue-500 border-dashed z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg animate-bounce">
              이미지를 여기에 놓으세요
            </div>
          </div>
        )}

        {/* Empty State / Click to Upload Overlay */}
        {!currentImage && !isGenerating && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          >
            <div
              className="text-center text-zinc-500 space-y-4 pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto border-2 border-dashed border-zinc-800 group-hover:border-zinc-700 transition-colors shadow-lg">
                <Upload className="w-10 h-10 opacity-50" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-300">이미지 업로드</p>
                <p className="text-sm text-zinc-500 mt-1">클릭하거나 이미지를 드래그하여 시작하세요</p>
              </div>
            </div>
          </div>
        )}

        <Canvas
          imageUrl={currentImageUrl}
          maskLines={maskLines}
          setMaskLines={updateMaskLines}
          tool={tool}
          brushSize={brushSize}
          onCanvasReady={handleCanvasReady}
          onImageLoad={handleImageLoad}
        />

        <Toolbar
          currentTool={tool}
          setTool={setTool}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          onDownload={handleDownload}
          onUpscale={handleUpscale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onClearImage={handleClearImage}
          onToggleStrip={handleToggleStrip}
          isStripOpen={isStripOpen}
          canUndo={historyStep > 0}
          canRedo={historyStep < history.length - 1}
          hasImages={images.length > 0}
        />

        {/* Multi-Image Selection Strip */}
        {isStripOpen && (
          <ImageSelectionStrip
            images={images}
            selectedIndex={currentImageIndex}
            onSelect={handleSelectImage}
          />
        )}

        {/* Loading Indicator */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-zinc-900/90 backdrop-blur-md rounded-lg p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="text-white font-medium">이미지 생성 중...</p>
              </div>
            </div>
          </div>
        )}

        {/* Image Counter (Only show if single image or strip is hidden) */}
        {images.length === 1 && (
          <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-lg text-white text-sm shadow-lg border border-zinc-700/50 z-30">
            1 / 1
          </div>
        )}

        {/* Edit Prompt Input */}
        {currentImage && (
          <div className="absolute bottom-28 right-4 z-30 max-w-md">
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-lg shadow-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-zinc-400 text-xs font-medium">
                  {maskLines.length > 0 ? '마스킹 영역 수정' : '이미지 변형'}
                </label>
                <div className="text-zinc-500 text-xs">
                  {aspectRatio} · {resolution}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSubmit();
                    }
                  }}
                  placeholder={maskLines.length > 0 ? "마스킹된 영역을 어떻게 수정할까요?" : "이미지를 어떻게 변형할까요?"}
                  disabled={isGenerating}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleEditSubmit}
                  disabled={isGenerating || !editPrompt.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isGenerating ? '...' : '적용'}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {maskLines.length > 0
                  ? '마스킹된 영역만 수정됩니다'
                  : '현재 이미지를 기반으로 새 이미지를 생성합니다'}
              </p>
            </div>
          </div>
        )}
      </main>

      <Gallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={galleryImages.map((img) => `data:image/png;base64,${img.base64Data}`)}
        thumbnails={galleryImages.map((img) => img.thumbnailData ? `data:image/jpeg;base64,${img.thumbnailData}` : `data:image/png;base64,${img.base64Data}`)}
        onSelect={handleSelectFromGallery}
        onDelete={handleDeleteFromGallery}
        currentIndex={currentImageIndex >= 0 && images[currentImageIndex] ? galleryImages.findIndex(img => img.id === images[currentImageIndex].id) : -1}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}
