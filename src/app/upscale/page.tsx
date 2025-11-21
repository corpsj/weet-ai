'use client';

import { useState } from 'react';
import { UpscaleSidebar } from '@/components/ui/UpscaleSidebar';
import { CompareSlider } from '@/components/ui/CompareSlider';
import { Upload } from 'lucide-react';

export default function UpscalePage() {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
    const [scale, setScale] = useState(2);
    const [isUpscaling, setIsUpscaling] = useState(false);

    const handleUpload = (base64Data: string) => {
        setOriginalImage(base64Data);
        setUpscaledImage(null); // Reset result when new image is uploaded
    };

    const handleUpscale = async () => {
        if (!originalImage) return;

        setIsUpscaling(true);

        // Mock API call
        setTimeout(() => {
            // For now, we just use the original image as the "upscaled" one
            // In a real app, this would be the result from the backend
            setUpscaledImage(originalImage);
            setIsUpscaling(false);
        }, 2000);
    };

    const handleDownload = () => {
        if (!upscaledImage) return;

        const link = document.createElement('a');
        link.href = `data:image/png;base64,${upscaledImage}`;
        link.download = `upscaled-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex h-full overflow-hidden bg-zinc-950">
            <UpscaleSidebar
                scale={scale}
                setScale={setScale}
                isUpscaling={isUpscaling}
                onUpscale={handleUpscale}
                onUpload={handleUpload}
                hasImage={!!originalImage}
                hasResult={!!upscaledImage}
                onDownload={handleDownload}
            />

            <main className="flex-1 relative flex items-center justify-center p-8 bg-[url('/grid.svg')] bg-center">
                {!originalImage ? (
                    <div className="text-center text-zinc-500">
                        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-zinc-800">
                            <Upload className="w-10 h-10 opacity-50" />
                        </div>
                        <h3 className="text-xl font-medium text-zinc-300 mb-2">이미지를 업로드하세요</h3>
                        <p className="text-sm max-w-xs mx-auto">
                            왼쪽 사이드바에서 이미지를 업로드하여<br />
                            고화질 업스케일링을 시작해보세요.
                        </p>
                    </div>
                ) : (
                    <div className="relative w-full h-full max-w-5xl max-h-[80vh] bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                        {upscaledImage ? (
                            <CompareSlider
                                beforeImage={originalImage}
                                afterImage={upscaledImage}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img
                                    src={`data:image/png;base64,${originalImage}`}
                                    alt="Original"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        )}

                        {isUpscaling && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-yellow-500 font-bold text-lg animate-pulse">AI가 이미지를 개선하고 있습니다...</p>
                                    <p className="text-zinc-400 text-sm mt-2">잠시만 기다려주세요</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
