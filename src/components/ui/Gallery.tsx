import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    thumbnails?: string[]; // Optional thumbnails for faster loading
    onSelect: (index: number) => void;
    onDelete: (index: number) => Promise<void>;
    currentIndex?: number;
    className?: string;
}

// Lazy loading image component
function LazyImage({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const currentRef = imgRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                    }
                });
            },
            { rootMargin: '50px' }
        );

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    return (
        <img
            ref={imgRef}
            src={isInView ? src : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt={alt}
            className={cn(className, !isLoaded && isInView && 'animate-pulse bg-zinc-800')}
            onLoad={() => setIsLoaded(true)}
            onClick={onClick}
            loading="lazy"
        />
    );
}

export function Gallery({
    isOpen,
    onClose,
    images,
    thumbnails,
    onSelect,
    onDelete,
    currentIndex = -1,
    className
}: GalleryProps) {
    const [viewingIndex, setViewingIndex] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleImageClick = (idx: number) => {
        setViewingIndex(idx);
    };

    const handleCloseModal = () => {
        setViewingIndex(null);
    };

    const handleSelectAndClose = (idx: number) => {
        onSelect(idx);
        handleCloseModal();
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewingIndex !== null && viewingIndex > 0) {
            setViewingIndex(viewingIndex - 1);
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewingIndex !== null && viewingIndex < images.length - 1) {
            setViewingIndex(viewingIndex + 1);
        }
    };

    return (
        <>
            <div className={cn(
                "fixed inset-y-0 right-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full",
                className
            )}>
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-bold text-zinc-100">갤러리</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-3">
                        {images.map((img, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                                    currentIndex === idx
                                        ? "border-blue-500 ring-2 ring-blue-500/50"
                                        : "border-zinc-800 hover:border-blue-400"
                                )}
                            >
                                <LazyImage
                                    src={thumbnails?.[idx] || img}
                                    alt={`Generated ${idx + 1}`}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    onClick={() => handleImageClick(idx)}
                                />

                                {/* Current indicator */}
                                {currentIndex === idx && (
                                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                                        현재
                                    </div>
                                )}

                                {/* Image number */}
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                    #{idx + 1}
                                </div>

                                {/* Delete button */}
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await onDelete(idx);
                                    }}
                                    className="absolute top-1 right-1 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {images.length === 0 && (
                        <div className="text-center text-zinc-500 py-8 text-sm">
                            아직 이미지가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* Image Viewer Modal */}
            {viewingIndex !== null && (
                <div
                    className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
                    onClick={handleCloseModal}
                >
                    <button
                        onClick={handleCloseModal}
                        className="absolute top-4 right-4 p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Previous button */}
                    {viewingIndex > 0 && (
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-full text-white transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    {/* Next button */}
                    {viewingIndex < images.length - 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-4 p-3 bg-zinc-800/80 hover:bg-zinc-700 rounded-full text-white transition-colors"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}

                    {/* Image */}
                    <div
                        className="relative max-w-5xl max-h-[90vh] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={images[viewingIndex]}
                            alt={`Viewing ${viewingIndex + 1}`}
                            className="w-full h-full object-contain rounded-lg"
                        />

                        {/* Image info */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm border border-zinc-700">
                            {viewingIndex + 1} / {images.length}
                        </div>

                        {/* Action buttons */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <button
                                onClick={() => handleSelectAndClose(viewingIndex)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
                            >
                                선택
                            </button>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await onDelete(viewingIndex);
                                    // Close modal if this was the last image, otherwise adjust index
                                    if (images.length <= 1) {
                                        setViewingIndex(null);
                                    } else if (viewingIndex >= images.length - 1) {
                                        setViewingIndex(Math.max(0, images.length - 2));
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
