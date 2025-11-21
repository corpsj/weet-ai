'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import useImage from 'use-image';
import { KonvaEventObject } from 'konva/lib/Node';
import { ToolType } from './Toolbar';

interface CanvasProps {
    imageUrl?: string;
    maskLines: any[];
    setMaskLines: (lines: any[]) => void;
    tool: ToolType;
    brushSize: number;
    onCanvasReady?: (stage: any) => void;
}

export default function Canvas({
    imageUrl,
    maskLines,
    setMaskLines,
    tool,
    brushSize,
    onCanvasReady
}: CanvasProps) {
    const [image] = useImage(imageUrl || '', 'anonymous');
    const isDrawing = useRef(false);
    const stageRef = useRef<any>(null);

    // Notify parent when stage is ready
    useEffect(() => {
        if (stageRef.current && onCanvasReady) {
            onCanvasReady(stageRef.current);
        }
    }, [onCanvasReady]);

    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        if (tool === 'select' || !imageUrl) return;

        isDrawing.current = true;
        const pos = e.target.getStage()?.getRelativePointerPosition();
        if (!pos) return;

        setMaskLines([
            ...maskLines,
            { tool, points: [pos.x, pos.y], size: brushSize }
        ]);
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (!isDrawing.current || (tool === 'select') || !imageUrl) return;

        const stage = e.target.getStage();
        const point = stage?.getRelativePointerPosition();
        if (!point) return;

        const lastLine = maskLines[maskLines.length - 1];
        // add point
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        // replace last
        maskLines.splice(maskLines.length - 1, 1, lastLine);
        setMaskLines(maskLines.concat());
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    // Zoom logic
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        const oldScale = stage.scaleX();

        const pointer = stage.getPointerPosition();
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
        setScale(newScale);

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        setPosition(newPos);
    };

    // Center image when loaded
    useEffect(() => {
        if (image && stageRef.current) {
            const stage = stageRef.current;
            const containerWidth = stage.width();
            const containerHeight = stage.height();

            // Fit image to stage with some padding
            const scaleX = (containerWidth * 0.8) / image.width;
            const scaleY = (containerHeight * 0.8) / image.height;
            const fitScale = Math.min(scaleX, scaleY);

            setScale(fitScale);
            setPosition({
                x: (containerWidth - image.width * fitScale) / 2,
                y: (containerHeight - image.height * fitScale) / 2
            });
        }
    }, [image]);

    return (
        <div className="w-full h-full bg-zinc-950 relative overflow-hidden">
            <Stage
                width={window.innerWidth - 320} // Sidebar width
                height={window.innerHeight}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                onWheel={handleWheel}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                ref={stageRef}
                draggable={tool === 'select'}
            >
                <Layer>
                    {image && (
                        <KonvaImage
                            image={image}
                        />
                    )}
                    {maskLines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke="#ff0000" // Visual mask color (red)
                            strokeWidth={line.size}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={
                                line.tool === 'eraser' ? 'destination-out' : 'source-over'
                            }
                            opacity={0.5} // Semi-transparent to see underlying image
                        />
                    ))}
                </Layer>
            </Stage>

            {!imageUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 pointer-events-none">
                    <div className="text-center">
                        <p className="text-lg font-medium">No image generated</p>
                        <p className="text-sm">Enter a prompt and click generate to start</p>
                    </div>
                </div>
            )}
        </div>
    );
}
