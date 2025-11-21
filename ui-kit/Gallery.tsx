import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { cn } from './utils';

interface GalleryProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    onSelect: (index: number) => void;
    onDelete: (index: number) => void;
    className?: string;
}

export function Gallery({
    isOpen,
    onClose,
    images,
    onSelect,
    onDelete,
    className
}: GalleryProps) {
    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full",
            className
        )}>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-100">Gallery</h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
                {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-800 hover:border-blue-500 transition-colors cursor-pointer">
                        <img
                            src={img}
                            alt={`Generated ${idx}`}
                            className="w-full h-full object-cover"
                            onClick={() => onSelect(idx)}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(idx); }}
                            className="absolute top-1 right-1 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {images.length === 0 && (
                    <div className="col-span-2 text-center text-zinc-500 py-8 text-sm">
                        No images yet.
                    </div>
                )}
            </div>
        </div>
    );
}
