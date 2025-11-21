import React from 'react';
import {
    Undo, Redo, ChevronLeft, ChevronRight,
    Brush, Eraser, Download, ZoomIn, ZoomOut,
    MousePointer2, Maximize2
} from 'lucide-react';
import { cn } from './utils';

export type ToolType = 'select' | 'brush' | 'eraser';

interface ToolbarProps {
    currentTool: ToolType;
    setTool: (tool: ToolType) => void;
    brushSize: number;
    setBrushSize: (size: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    onPrev: () => void;
    onNext: () => void;
    onDownload: () => void;
    onUpscale: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    canUndo: boolean;
    canRedo: boolean;
    hasImages: boolean;
    isUpscaling: boolean;
    className?: string;
}

export function Toolbar({
    currentTool,
    setTool,
    brushSize,
    setBrushSize,
    onUndo,
    onRedo,
    onPrev,
    onNext,
    onDownload,
    onUpscale,
    onZoomIn,
    onZoomOut,
    canUndo,
    canRedo,
    hasImages,
    isUpscaling,
    className
}: ToolbarProps) {
    return (
        <div className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-2xl",
            className
        )}>
            {/* Navigation */}
            <div className="flex items-center gap-1 border-r border-zinc-700 pr-4">
                <IconButton icon={ChevronLeft} onClick={onPrev} disabled={!hasImages} tooltip="Previous" />
                <IconButton icon={ChevronRight} onClick={onNext} disabled={!hasImages} tooltip="Next" />
            </div>

            {/* History */}
            <div className="flex items-center gap-1 border-r border-zinc-700 pr-4">
                <IconButton icon={Undo} onClick={onUndo} disabled={!canUndo} tooltip="Undo" />
                <IconButton icon={Redo} onClick={onRedo} disabled={!canRedo} tooltip="Redo" />
            </div>

            {/* Tools */}
            <div className="flex items-center gap-2 border-r border-zinc-700 pr-4">
                <ToolButton
                    icon={MousePointer2}
                    active={currentTool === 'select'}
                    onClick={() => setTool('select')}
                    tooltip="Select/Move"
                />
                <ToolButton
                    icon={Brush}
                    active={currentTool === 'brush'}
                    onClick={() => setTool('brush')}
                    tooltip="Brush"
                />
                <ToolButton
                    icon={Eraser}
                    active={currentTool === 'eraser'}
                    onClick={() => setTool('eraser')}
                    tooltip="Eraser"
                />

                {/* Brush Size Slider (only visible for brush/eraser) */}
                {(currentTool === 'brush' || currentTool === 'eraser') && (
                    <div className="w-24 ml-2 flex items-center">
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                    </div>
                )}
            </div>

            {/* Zoom & Actions */}
            <div className="flex items-center gap-1">
                <IconButton icon={ZoomOut} onClick={onZoomOut} tooltip="Zoom Out" />
                <IconButton icon={ZoomIn} onClick={onZoomIn} tooltip="Zoom In" />
                <div className="w-px h-6 bg-zinc-700 mx-2" />
                <IconButton
                    icon={Maximize2}
                    onClick={onUpscale}
                    disabled={!hasImages || isUpscaling}
                    tooltip={isUpscaling ? "Upscaling..." : "Upscale (4x)"}
                    className={isUpscaling ? "animate-pulse text-blue-400" : ""}
                />
                <IconButton icon={Download} onClick={onDownload} disabled={!hasImages} tooltip="Download" />
            </div>
        </div>
    );
}

function IconButton({ icon: Icon, onClick, disabled, tooltip, className }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={tooltip}
            className={cn(
                "p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors",
                className
            )}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}

function ToolButton({ icon: Icon, active, onClick, tooltip }: any) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={cn(
                "p-2 rounded-lg transition-all",
                active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
