'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadImagesFromStorage, deleteImageFromStorage, addDummyImages, clearAllImages } from '@/lib/storage';
import { GeneratedImage, ImageType } from '@/types';
import { X, Trash2, Download, ChevronLeft, ChevronRight, Clock, Plus, Trash, Sparkles, Copy, Check } from 'lucide-react';
import { downloadImage } from '@/lib/gemini';
import { cn } from '@/lib/utils';

type FilterType = 'all' | ImageType;

export default function GalleryPage() {
    const [allImages, setAllImages] = useState<GeneratedImage[]>([]);
    const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [viewingIndex, setViewingIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (viewingIndex !== null && scrollContainerRef.current) {
            const activeElement = scrollContainerRef.current.children[viewingIndex] as HTMLElement;
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [viewingIndex]);

    // Load images on mount
    useEffect(() => {
        const loadImages = async () => {
            const savedImages = await loadImagesFromStorage();
            // Sort by timestamp descending (newest first)
            const sortedImages = savedImages.sort((a, b) => b.timestamp - a.timestamp);
            setAllImages(sortedImages);
            setLoading(false);
        };

        loadImages();

        // Reload images when the page becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadImages();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (filter === 'all') {
            setFilteredImages(allImages);
        } else {
            setFilteredImages(allImages.filter(img => img.type === filter));
        }
        setViewingIndex(null); // Reset viewer when filter changes
    }, [filter, allImages]);

    const handleDelete = async (imageId: string) => {
        if (confirm('정말 이 이미지를 삭제하시겠습니까?')) {
            await deleteImageFromStorage(imageId);
            setAllImages(prev => prev.filter(img => img.id !== imageId));
            if (viewingIndex !== null) {
                setViewingIndex(null);
            }
        }
    };

    const handleDownload = (image: GeneratedImage) => {
        try {
            downloadImage(image.base64Data, `weet-ai-${image.id}`);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleEdit = (image: GeneratedImage) => {
        // Save only image ID to local storage (not the full base64 data to avoid quota error)
        localStorage.setItem('weet-ai-edit-image-id', image.id);
        router.push('/');
    };

    const handleCopyPrompt = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    const handleCloseModal = () => {
        setViewingIndex(null);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewingIndex !== null && viewingIndex > 0) {
            setViewingIndex(viewingIndex - 1);
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewingIndex !== null && viewingIndex < filteredImages.length - 1) {
            setViewingIndex(viewingIndex + 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (viewingIndex === null) return;

            if (e.key === 'ArrowLeft') {
                if (viewingIndex > 0) setViewingIndex(viewingIndex - 1);
            } else if (e.key === 'ArrowRight') {
                if (viewingIndex < filteredImages.length - 1) setViewingIndex(viewingIndex + 1);
            } else if (e.key === 'Escape') {
                setViewingIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewingIndex, filteredImages.length]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFilterLabel = (type: FilterType) => {
        switch (type) {
            case 'all': return '전체';
            case 'generated': return '생성됨';
            case 'edited': return '수정됨';
            case 'upscaled': return '업스케일';
            default: return type;
        }
    };

    const getImageTypeLabel = (type: ImageType) => {
        switch (type) {
            case 'generated': return 'Generated';
            case 'edited': return 'Edited';
            case 'upscaled': return 'Upscaled';
            default: return type;
        }
    };

    const getImageTypeColor = (type: ImageType) => {
        switch (type) {
            case 'generated': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
            case 'edited': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
            case 'upscaled': return 'text-violet-400 border-violet-400/30 bg-violet-400/10';
            default: return 'text-zinc-400 border-zinc-400/30 bg-zinc-400/10';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
                    <div className="text-zinc-500 text-sm font-medium">갤러리 불러오는 중...</div>
                </div>
            </div>
        );
    }

    const filterOptions: FilterType[] = ['all', 'generated', 'edited', 'upscaled'];

    return (
        <div className="h-full overflow-y-auto bg-zinc-950 text-zinc-100">
            <div className="max-w-[1800px] mx-auto p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Gallery</h1>
                        <p className="text-zinc-400 text-sm">
                            총 <span className="text-white font-medium">{allImages.length}</span>개의 작품이 보관되어 있습니다
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Dev Tools */}
                        <div className="flex items-center gap-2 mr-4 border-r border-zinc-800 pr-6">
                            <button
                                onClick={async () => {
                                    await addDummyImages();
                                    const savedImages = await loadImagesFromStorage();
                                    const sortedImages = savedImages.sort((a, b) => b.timestamp - a.timestamp);
                                    setAllImages(sortedImages);
                                }}
                                className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                                title="테스트용 더미 이미지 추가"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('모든 이미지를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
                                        await clearAllImages();
                                        setAllImages([]);
                                    }
                                }}
                                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="모든 이미지 삭제"
                            >
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                            {filterOptions.map((filterOption) => {
                                const isActive = filter === filterOption;
                                return (
                                    <button
                                        key={filterOption}
                                        onClick={() => setFilter(filterOption)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-zinc-800 text-white shadow-sm"
                                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                        )}
                                    >
                                        {getFilterLabel(filterOption)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Gallery Grid - Strict Grid Layout */}
                {filteredImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                            <Sparkles className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {filter === 'all' ? '아직 생성된 이미지가 없습니다' : '해당하는 이미지가 없습니다'}
                        </h3>
                        <p className="text-zinc-500 max-w-md mx-auto">
                            스튜디오에서 새로운 이미지를 생성하거나 편집해보세요. 당신의 상상력을 현실로 만들어보세요.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {filteredImages.map((image, idx) => (
                            <div
                                key={image.id}
                                className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-blue-900/5"
                                onClick={() => setViewingIndex(idx)}
                            >
                                <img
                                    src={`data:image/png;base64,${image.base64Data}`}
                                    alt={image.prompt}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Top Badge */}
                                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border backdrop-blur-md",
                                        getImageTypeColor(image.type)
                                    )}>
                                        {getImageTypeLabel(image.type)}
                                    </span>
                                </div>

                                {/* Hover Actions - Center */}
                                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(image);
                                        }}
                                        className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors shadow-lg transform hover:scale-105"
                                        title="스튜디오에서 편집"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(image);
                                        }}
                                        className="p-3 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-colors shadow-lg border border-zinc-700 transform hover:scale-105"
                                        title="다운로드"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Bottom Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <p className="text-zinc-200 text-xs line-clamp-1 font-medium mb-1">
                                        {image.prompt}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                        <span>{image.config.imageSize}</span>
                                        <span>{formatDate(image.timestamp).split('. ')[1] + '.' + formatDate(image.timestamp).split('. ')[2]}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Full Screen Viewer Modal */}
            {viewingIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
                    {/* Main Content */}
                    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>

                        {/* Image Area */}
                        <div className="flex-1 h-full flex flex-col relative group bg-zinc-950/50">
                            {/* Close Button */}
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-6 right-6 p-3 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all z-50 border border-zinc-800 backdrop-blur-sm"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Navigation Buttons */}
                            {viewingIndex > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all z-50 border border-zinc-800 group backdrop-blur-sm"
                                >
                                    <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                                </button>
                            )}
                            {viewingIndex < filteredImages.length - 1 && (
                                <button
                                    onClick={handleNext}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all z-50 border border-zinc-800 group backdrop-blur-sm"
                                >
                                    <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}

                            <div className="flex-1 flex items-center justify-center p-8 lg:p-12 overflow-hidden">
                                <img
                                    src={`data:image/png;base64,${filteredImages[viewingIndex].base64Data}`}
                                    alt={filteredImages[viewingIndex].prompt}
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                                />
                            </div>

                            {/* Navigation Strip */}
                            <div
                                ref={scrollContainerRef}
                                className="h-24 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar"
                            >
                                {filteredImages.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingIndex(idx);
                                        }}
                                        className={cn(
                                            "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200",
                                            viewingIndex === idx
                                                ? "border-blue-500 ring-2 ring-blue-500/20 scale-105"
                                                : "border-transparent opacity-50 hover:opacity-100 hover:border-zinc-600"
                                        )}
                                    >
                                        <img
                                            src={`data:image/png;base64,${img.base64Data}`}
                                            alt={img.prompt}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {viewingIndex + 1} / {filteredImages.length}
                            </div>
                        </div>

                        {/* Sidebar Info Area */}
                        <div className="w-full lg:w-[400px] bg-zinc-900 border-l border-zinc-800 p-8 flex flex-col h-[40vh] lg:h-full overflow-y-auto">
                            <div className="flex items-center justify-between mb-8">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider",
                                    getImageTypeColor(filteredImages[viewingIndex].type)
                                )}>
                                    {getImageTypeLabel(filteredImages[viewingIndex].type)}
                                </span>
                                <span className="text-zinc-500 text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {formatDate(filteredImages[viewingIndex].timestamp)}
                                </span>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Prompt</h3>
                                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 group relative">
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        {filteredImages[viewingIndex].prompt}
                                    </p>
                                    <button
                                        onClick={() => handleCopyPrompt(filteredImages[viewingIndex].prompt)}
                                        className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                        title="프롬프트 복사"
                                    >
                                        {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                        <div className="text-zinc-500 text-xs mb-1">Size</div>
                                        <div className="text-zinc-200 font-mono text-sm">{filteredImages[viewingIndex].config.imageSize}</div>
                                    </div>
                                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                        <div className="text-zinc-500 text-xs mb-1">Aspect Ratio</div>
                                        <div className="text-zinc-200 font-mono text-sm">{filteredImages[viewingIndex].config.aspectRatio}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto flex flex-col gap-3">
                                <button
                                    onClick={() => handleEdit(filteredImages[viewingIndex])}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Edit in Studio
                                </button>
                                <button
                                    onClick={() => handleDownload(filteredImages[viewingIndex])}
                                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Image
                                </button>
                                <button
                                    onClick={() => handleDelete(filteredImages[viewingIndex].id)}
                                    className="w-full py-3 bg-transparent text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Image
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
