import React, { useRef } from 'react';
import { Upload, Zap, Download, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpscaleSidebarProps {
    scale: number;
    setScale: (value: number) => void;
    isUpscaling: boolean;
    onUpscale: () => void;
    onUpload: (base64Data: string) => void;
    hasImage: boolean;
    hasResult: boolean;
    onDownload: () => void;
    className?: string;
}

export function UpscaleSidebar({
    scale,
    setScale,
    isUpscaling,
    onUpscale,
    onUpload,
    hasImage,
    hasResult,
    onDownload,
    className
}: UpscaleSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다');
            return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            alert('파일 크기는 10MB를 초과할 수 없습니다');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const base64Data = base64.split(',')[1];
            onUpload(base64Data);
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn("w-80 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col gap-6 h-full", className)}>
            <div className="flex items-center gap-2 text-zinc-100 font-bold text-xl mb-4">
                <Zap className="w-6 h-6 text-yellow-500" />
                <span>업스케일</span>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUpscaling}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:opacity-50 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 font-medium transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    {hasImage ? '다른 이미지 업로드' : '이미지 업로드'}
                </button>
            </div>

            {/* Scale Factor */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    확대 배율
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {[2, 4].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setScale(s)}
                            disabled={isUpscaling}
                            className={cn(
                                "px-2 py-3 rounded-lg text-sm font-bold transition-all border",
                                scale === s
                                    ? "bg-yellow-600/20 border-yellow-500 text-yellow-500"
                                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                            )}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1" />

            {/* Upscale Button */}
            <button
                type="button"
                onClick={onUpscale}
                disabled={isUpscaling || !hasImage}
                className={cn(
                    "w-full py-3 rounded-lg font-bold text-white transition-all mb-2",
                    isUpscaling || !hasImage
                        ? "bg-zinc-700 cursor-not-allowed opacity-50"
                        : "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-lg shadow-orange-900/20"
                )}
            >
                {isUpscaling ? '처리 중...' : '업스케일 시작'}
            </button>

            {/* Download Button */}
            {hasResult && (
                <button
                    type="button"
                    onClick={onDownload}
                    disabled={isUpscaling}
                    className="w-full py-3 rounded-lg font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all flex items-center justify-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    다운로드
                </button>
            )}
        </div>
    );
}
