import React, { useRef } from 'react';
import { Settings, Image as ImageIcon, Type, Hash, LayoutGrid, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    isGalleryOpen: boolean;
    onToggleGallery: () => void;
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
    isGalleryOpen,
    onToggleGallery,
}: SidebarProps) {
    return (
        <div className={cn("w-80 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col gap-6 h-full", className)}>
            <div className="flex items-center gap-2 text-zinc-100 font-bold text-xl mb-4">
                <ImageIcon className="w-6 h-6 text-blue-500" />
                <span>스튜디오</span>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-3 h-3" /> 프롬프트
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="이미지를 자세히 설명해주세요. 구성, 조명, 분위기, 스타일 등을 중심으로..."
                    className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={isGenerating}
                />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-3 h-3" /> 비율
                </label>
                <div className="grid grid-cols-5 gap-2">
                    {/* Headers */}
                    <div className="col-span-2 text-[10px] text-zinc-500 text-center font-medium">가로</div>
                    <div className="col-span-1 text-[10px] text-zinc-500 text-center font-medium">정방형</div>
                    <div className="col-span-2 text-[10px] text-zinc-500 text-center font-medium">세로</div>

                    {/* Buttons */}
                    {['4:3', '16:9', '1:1', '3:4', '9:16'].map((ratio) => (
                        <button
                            key={ratio}
                            type="button"
                            onClick={() => setAspectRatio(ratio)}
                            disabled={isGenerating}
                            className="flex flex-col items-center gap-1.5 group w-full"
                        >
                            <div
                                className={cn(
                                    "w-full rounded-sm border-2 transition-all",
                                    aspectRatio === ratio
                                        ? "border-blue-500 bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                        : "border-zinc-700 bg-zinc-800/50 group-hover:border-zinc-500 group-hover:bg-zinc-800"
                                )}
                                style={{ aspectRatio: ratio.replace(':', '/') }}
                            />
                            <span className={cn(
                                "text-[10px] font-medium transition-colors",
                                aspectRatio === ratio ? "text-blue-500" : "text-zinc-600 group-hover:text-zinc-400"
                            )}>{ratio}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Resolution */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3" /> 해상도
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: '1K', desc: '1024px' },
                        { label: '2K', desc: '2048px' },
                        { label: '4K', desc: '4096px' }
                    ].map((opt) => (
                        <button
                            key={opt.label}
                            type="button"
                            onClick={() => setResolution(opt.label)}
                            disabled={isGenerating}
                            className={cn(
                                "flex flex-col items-center justify-center py-3 rounded-lg border transition-all gap-1",
                                resolution === opt.label
                                    ? "bg-zinc-800 border-blue-500 text-blue-500 ring-1 ring-blue-500/20"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700"
                            )}
                        >
                            <span className="text-sm font-bold">{opt.label}</span>
                            <span className="text-[10px] opacity-60 font-medium">{opt.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Count */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-3 h-3" /> 이미지 수
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="4"
                        value={imageCount}
                        onChange={(e) => setImageCount(parseInt(e.target.value))}
                        disabled={isGenerating}
                        className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-zinc-200 font-mono w-4 text-center">{imageCount}</span>
                </div>
            </div>

            <div className="flex-1" />

            {/* Generate Button */}
            <button
                type="button"
                tabIndex={-1}
                onClick={onGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={cn(
                    "w-full py-3 rounded-lg font-bold text-white transition-all",
                    isGenerating || !prompt.trim()
                        ? "bg-zinc-700 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20"
                )}
            >
                {isGenerating ? '생성 중...' : '생성하기'}
            </button>

            {/* View Gallery Button */}
            <button
                type="button"
                tabIndex={-1}
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
                    {isGalleryOpen ? '갤러리 닫기' : '갤러리 보기'}
                </div>
            </button>
        </div>
    );
}
