import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { GeneratedImage } from '@/types';

interface ImageSelectionStripProps {
    images: GeneratedImage[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    className?: string;
}

export function ImageSelectionStrip({
    images,
    selectedIndex,
    onSelect,
    className
}: ImageSelectionStripProps) {
    if (images.length <= 1) return null;

    return (
        <div className={cn(
            "absolute bottom-32 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 fade-in",
            className
        )}>
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-xl p-2 shadow-2xl flex items-center gap-2 max-w-[80vw] overflow-x-auto scrollbar-hide">
                {images.map((img, index) => (
                    <button
                        key={img.id}
                        onClick={() => onSelect(index)}
                        className={cn(
                            "relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all focus:outline-none",
                            selectedIndex === index
                                ? "border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-105"
                                : "border-transparent hover:border-zinc-500 opacity-70 hover:opacity-100"
                        )}
                    >
                        <img
                            src={`data:image/png;base64,${img.base64Data}`}
                            alt={`Generated ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {selectedIndex === index && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <div className="bg-blue-500 rounded-full p-0.5">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>
            <div className="text-xs text-zinc-400 font-medium bg-zinc-900/80 px-3 py-1 rounded-full backdrop-blur-sm">
                편집할 이미지를 선택하세요 ({selectedIndex + 1}/{images.length})
            </div>
        </div>
    );
}
