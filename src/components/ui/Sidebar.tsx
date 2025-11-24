import React, { useRef } from 'react';
import { Settings, Image as ImageIcon, Type, Hash, LayoutGrid, Upload, ChevronRight, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdvancedSettings, AdvancedSettingsProps } from './AdvancedSettings';

interface SidebarProps extends Omit<AdvancedSettingsProps, 'isOpen' | 'onClose'> {
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
    referenceImages: string[];
    setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export function Sidebar(props: SidebarProps) {
    const {
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
        // Advanced Settings
        model,
        setModel,
        style,
        setStyle,
        lighting,
        setLighting,
        camera,
        setCamera,
        mood,
        setMood,
        negativePrompt,
        setNegativePrompt,
        useGrounding,
        setUseGrounding,
        referenceImages,
        setReferenceImages,
    } = props;

    const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (referenceImages.length >= 13) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                const base64Data = base64.split(',')[1];
                setReferenceImages((prev: string[]) => [...prev, base64Data].slice(0, 13));
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

    return (
        <div className={cn("w-80 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full relative z-20", className)}>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 custom-scrollbar">
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

                    {/* Advanced Settings Toggle */}
                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={cn(
                            "w-full flex items-center justify-between p-2 rounded-lg border transition-all text-xs font-medium",
                            isAdvancedOpen
                                ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Settings className="w-3 h-3" />
                            <span>고급 설정</span>
                        </div>
                        <ChevronRight className={cn(
                            "w-3 h-3 transition-transform duration-200",
                            isAdvancedOpen ? "rotate-90" : ""
                        )} />
                    </button>
                </div>

                {/* Reference Images */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> 레퍼런스 이미지 ({referenceImages.length}/13)
                    </label>

                    <div className="grid grid-cols-4 gap-2">
                        {referenceImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden group border border-zinc-700">
                                <img src={`data:image/png;base64,${img}`} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newImages = [...referenceImages];
                                        newImages.splice(idx, 1);
                                        setReferenceImages(newImages);
                                    }}
                                    className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {referenceImages.length < 13 && (
                            <label className="aspect-square rounded-md border border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors">
                                <Plus className="w-4 h-4 text-zinc-500" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleReferenceUpload}
                                />
                            </label>
                        )}
                    </div>
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
                                    "text-zinc-600 group-hover:text-zinc-400",
                                    aspectRatio === ratio && "text-blue-500"
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
                            className="flex-1 appearance-none cursor-pointer"
                        />
                        <span className="text-zinc-200 font-mono w-4 text-center">{imageCount}</span>
                    </div>
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0 z-10">
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

            {/* Advanced Settings Flyout Panel */}
            <AdvancedSettings
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
                isOpen={isAdvancedOpen}
                onClose={() => setIsAdvancedOpen(false)}
            />
        </div>
    );
}
