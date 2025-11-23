'use client';

import { useState, useEffect, useRef } from 'react';
import { UpscaleSidebar } from '@/components/ui/UpscaleSidebar';
import { CompareSlider } from '@/components/ui/CompareSlider';
import { Upload, X, Check, Loader2, Download, FileImage, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchImage {
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    result?: string;
}

export default function UpscalePage() {
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
    const [scale, setScale] = useState(2);
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Batch State
    const [batchImages, setBatchImages] = useState<BatchImage[]>([]);
    const batchInputRef = useRef<HTMLInputElement>(null);
    const singleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedImage = localStorage.getItem('upscale_source_image');
        if (savedImage) {
            setOriginalImage(savedImage);
            localStorage.removeItem('upscale_source_image');
        }
    }, []);

    const handleUpload = (base64Data: string) => {
        setOriginalImage(base64Data);
        setUpscaledImage(null); // Reset result when new image is uploaded
    };

    const handleBatchUploadFiles = (files: File[]) => {
        const newImages: BatchImage[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            status: 'pending'
        }));
        setBatchImages(prev => [...prev, ...newImages]);
    };

    const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleBatchUploadFiles(Array.from(e.target.files));
        }
    };

    const handleSingleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                const base64Data = base64.split(',')[1];
                handleUpload(base64Data);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeBatchImage = (id: string) => {
        setBatchImages(prev => prev.filter(img => img.id !== id));
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

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length === 0) return;

        if (mode === 'single') {
            // Use the first file for single mode
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                const base64Data = base64.split(',')[1];
                handleUpload(base64Data);
            };
            reader.readAsDataURL(file);
        } else {
            // Batch mode
            handleBatchUploadFiles(files);
        }
    };

    const handleUpscale = async () => {
        if (mode === 'single') {
            if (!originalImage) return;

            setIsUpscaling(true);

            try {
                // Real-ESRGAN API 호출
                const response = await fetch('/api/upscale', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: originalImage,
                        scale: scale,
                        model: 'RealESRGAN_x4plus',
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Upscaling failed');
                }

                const data = await response.json();

                // base64 헤더 제거 (이미 포함되어 있는 경우)
                const base64Data = data.upscaled_image.replace(/^data:image\/\w+;base64,/, '');
                setUpscaledImage(base64Data);

                console.log('✅ Upscaling successful:', {
                    originalSize: data.original_size,
                    upscaledSize: data.upscaled_size,
                    scale: data.scale,
                    model: data.model,
                });
            } catch (error) {
                console.error('❌ Upscaling error:', error);
                alert(
                    error instanceof Error
                        ? error.message
                        : '업스케일링 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.'
                );
            } finally {
                setIsUpscaling(false);
            }
        } else {
            // Batch Upscale - 실제 API 호출
            setIsUpscaling(true);

            try {
                // 순차적으로 각 이미지 처리
                for (let i = 0; i < batchImages.length; i++) {
                    const img = batchImages[i];

                    // 이미 완료된 이미지는 건너뜀
                    if (img.status === 'done') continue;

                    // 처리 중 상태로 변경
                    setBatchImages(prev => prev.map((item, idx) =>
                        idx === i ? { ...item, status: 'processing' } : item
                    ));

                    try {
                        // 파일을 base64로 변환
                        const base64 = await fileToBase64(img.file);

                        // API 호출
                        const response = await fetch('/api/upscale', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                image: base64,
                                scale: scale,
                                model: 'RealESRGAN_x4plus',
                            }),
                        });

                        if (!response.ok) {
                            throw new Error('Upscaling failed');
                        }

                        const data = await response.json();
                        const resultBase64 = data.upscaled_image.replace(/^data:image\/\w+;base64,/, '');

                        // 완료 상태로 변경 및 결과 저장
                        setBatchImages(prev => prev.map((item, idx) =>
                            idx === i ? { ...item, status: 'done', result: resultBase64 } : item
                        ));

                        console.log(`✅ Batch upscaling ${i + 1}/${batchImages.length} successful`);
                    } catch (error) {
                        console.error(`❌ Batch upscaling ${i + 1} failed:`, error);

                        // 에러 상태로 변경
                        setBatchImages(prev => prev.map((item, idx) =>
                            idx === i ? { ...item, status: 'error' } : item
                        ));
                    }
                }

                console.log('✅ All batch upscaling completed');
            } catch (error) {
                console.error('❌ Batch upscaling error:', error);
                alert('일괄 업스케일링 중 오류가 발생했습니다.');
            } finally {
                setIsUpscaling(false);
            }
        }
    };

    // 파일을 base64로 변환하는 헬퍼 함수
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                // data:image/...;base64, 헤더 제거
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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

    // 배치 이미지 개별 다운로드
    const handleBatchImageDownload = (img: BatchImage) => {
        if (!img.result) return;

        const link = document.createElement('a');
        link.href = `data:image/png;base64,${img.result}`;
        link.download = `upscaled-${img.file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 배치 전체 다운로드 (ZIP)
    const handleBatchDownloadAll = () => {
        const completedImages = batchImages.filter(img => img.status === 'done' && img.result);

        if (completedImages.length === 0) {
            alert('다운로드할 이미지가 없습니다.');
            return;
        }

        // 각 이미지를 개별 다운로드 (ZIP 라이브러리 없이)
        completedImages.forEach((img, index) => {
            setTimeout(() => {
                handleBatchImageDownload(img);
            }, index * 200); // 200ms 간격으로 다운로드
        });
    };

    return (
        <div className="flex h-full overflow-hidden bg-zinc-950">
            <UpscaleSidebar
                mode={mode}
                setMode={setMode}
                scale={scale}
                setScale={setScale}
                isUpscaling={isUpscaling}
                onUpscale={handleUpscale}
                onUpload={handleUpload}
                onBatchUpload={handleBatchUploadFiles}
                hasImage={mode === 'single' ? !!originalImage : batchImages.length > 0}
                hasResult={mode === 'single' ? !!upscaledImage : batchImages.some(img => img.status === 'done')}
                onDownload={handleDownload}
                onBatchDownloadAll={handleBatchDownloadAll}
            />

            <main
                className={cn(
                    "flex-1 relative flex items-center justify-center p-8 bg-[url('/grid.svg')] bg-center overflow-hidden transition-colors",
                    isDragging && "bg-blue-500/10"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={(e) => {
                    // Prevent triggering if clicking on interactive elements
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.interactive')) return;
                    // Only trigger if empty or explicit intent?
                    // For single mode: if empty.
                    // For batch mode: always? Or just if clicking the background?
                    // Let's trigger if clicking background.
                    if (mode === 'single' && !originalImage) {
                        singleInputRef.current?.click();
                    }
                }}
            >
                {/* Hidden Inputs for Main Area Clicks */}
                <input
                    type="file"
                    ref={singleInputRef}
                    onChange={handleSingleUpload}
                    accept="image/*"
                    className="hidden"
                />
                <input
                    type="file"
                    ref={batchInputRef}
                    onChange={handleBatchUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                />

                {/* Drag Overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-3xl pointer-events-none">
                        <div className="text-center text-blue-200">
                            <Upload className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                            <p className="text-2xl font-bold">이미지를 여기에 놓으세요</p>
                        </div>
                    </div>
                )}

                {mode === 'single' ? (
                    // Single Mode UI
                    !originalImage ? (
                        <div className="text-center text-zinc-500 pointer-events-none">
                            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-zinc-800">
                                <Upload className="w-10 h-10 opacity-50" />
                            </div>
                            <h3 className="text-xl font-medium text-zinc-300 mb-2">이미지를 업로드하세요</h3>
                            <p className="text-sm max-w-xs mx-auto">
                                화면을 클릭하거나 이미지를 드래그하여<br />
                                고화질 업스케일링을 시작해보세요.
                            </p>
                        </div>
                    ) : (
                        <div className="relative w-full h-full max-w-5xl max-h-[80vh] bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl interactive">
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
                    )
                ) : (
                    // Batch Mode UI
                    <div className="w-full h-full max-w-5xl flex flex-col gap-6 interactive">
                        {/* Batch Upload Area */}
                        <div
                            onClick={() => batchInputRef.current?.click()}
                            className="w-full h-32 bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                ref={batchInputRef}
                                onChange={handleBatchUpload}
                            />
                            <Upload className="w-8 h-8 text-zinc-600 group-hover:text-zinc-400 mb-2 transition-colors" />
                            <p className="text-zinc-500 font-medium group-hover:text-zinc-300 transition-colors">
                                클릭하여 여러 이미지를 추가하세요
                            </p>
                        </div>

                        {/* Batch List */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {batchImages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600 pointer-events-none">
                                    <FileImage className="w-12 h-12 mb-4 opacity-20" />
                                    <p>이미지가 없습니다</p>
                                </div>
                            ) : (
                                batchImages.map((img) => (
                                    <div key={img.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-4 group hover:border-zinc-700 transition-colors">
                                        {/* Thumbnail */}
                                        <div className="w-16 h-16 bg-zinc-950 rounded-lg overflow-hidden shrink-0 border border-zinc-800">
                                            <img src={img.preview} alt="Thumbnail" className="w-full h-full object-cover" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-zinc-200 font-medium truncate">{img.file.name}</p>
                                            <p className="text-zinc-500 text-xs">{(img.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-3">
                                            {img.status === 'pending' && (
                                                <span className="text-zinc-500 text-sm px-3 py-1 bg-zinc-800 rounded-full">대기중</span>
                                            )}
                                            {img.status === 'processing' && (
                                                <span className="text-yellow-500 text-sm px-3 py-1 bg-yellow-500/10 rounded-full flex items-center gap-2">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    처리중
                                                </span>
                                            )}
                                            {img.status === 'done' && (
                                                <span className="text-green-500 text-sm px-3 py-1 bg-green-500/10 rounded-full flex items-center gap-2">
                                                    <Check className="w-3 h-3" />
                                                    완료
                                                </span>
                                            )}
                                            {img.status === 'error' && (
                                                <span className="text-red-500 text-sm px-3 py-1 bg-red-500/10 rounded-full flex items-center gap-2">
                                                    <X className="w-3 h-3" />
                                                    실패
                                                </span>
                                            )}

                                            {/* Actions */}
                                            {img.status === 'done' ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBatchImageDownload(img); }}
                                                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                                    title="다운로드"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            ) : img.status === 'error' ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeBatchImage(img.id); }}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
                                                    title="제거"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeBatchImage(img.id); }}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
                                                    title="제거"
                                                    disabled={img.status === 'processing'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
