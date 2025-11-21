import React from 'react';
import { Settings, Image as ImageIcon, Type, Hash, LayoutGrid } from 'lucide-react'; // Added LayoutGrid icon
import { cn } from './utils';

interface SidebarProps {
    prompt: string;
    setPrompt: (value: string) => void;
    aspectRatio: string;
    setAspectRatio: (value: string) => void;
    resolution: string;
    setResolution: (value: string) => void;
    imageCount: number;
    setImageCount: (value: number) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    className?: string;
    isGalleryOpen: boolean; // New prop for gallery state
    onToggleGallery: () => void; // New prop for toggling gallery
}

export function Sidebar({
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    imageCount,
    setImageCount,
    onGenerate,
    isGenerating,
    className,
    isGalleryOpen, // Destructure new prop
    onToggleGallery, // Destructure new prop
}: SidebarProps) {
    return (
        <div className={cn("w-80 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col gap-6 h-full", className)}>
            <div className="flex items-center gap-2 text-zinc-100 font-bold text-xl mb-4">
                <ImageIcon className="w-6 h-6 text-blue-500" />
                <span>Gemini Studio</span>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-3 h-3" /> Prompt
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your image..."
                    className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-3 h-3" /> Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={cn(
                                "px-2 py-2 rounded-md text-xs font-medium transition-colors border",
                                aspectRatio === ratio
                                    ? "bg-blue-600 border-blue-500 text-white"
                                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                            )}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    Resolution
                </label>
                <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="1024x1024">1024x1024 (1K)</option>
                    <option value="2048x2048">2048x2048 (2K)</option>
                    <option value="4096x4096">4096x4096 (4K)</option>
                </select>
            </div>

            {/* Image Count */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Image Count
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="4"
                        value={imageCount}
                        onChange={(e) => setImageCount(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-zinc-200 font-mono w-4 text-center">{imageCount}</span>
                </div>
            </div>

            <div className="flex-1" />

            {/* Generate Button */}
            <button
                onClick={onGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={cn(
                    "w-full py-3 rounded-lg font-bold text-white transition-all",
                    isGenerating
                        ? "bg-zinc-700 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20"
                )}
            >
                {isGenerating ? 'Generating...' : 'Generate'}
            </button>

            {/* View Gallery Button */}
            <button
                onClick={onToggleGallery}
                className={cn(
                    "w-full py-2 mt-2 rounded-lg font-medium transition-colors border",
                    isGalleryOpen
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                )}
            >
                <div className="flex items-center justify-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    {isGalleryOpen ? 'Hide Gallery' : 'View Gallery'}
                </div>
            </button>
        </div>
    );
}
