'use client';

import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { ToolType } from './Toolbar';

interface MaskLine {
    tool: ToolType;
    points: number[];
    size: number;
}

interface CanvasProps {
    imageUrl?: string;
    maskLines: MaskLine[];
    setMaskLines: (lines: MaskLine[] | ((prev: MaskLine[]) => MaskLine[])) => void;
    tool: ToolType;
    brushSize: number;
    onCanvasReady?: (stage: Konva.Stage, methods: CanvasMethods, imageNode: Konva.Image | null) => void;
    onImageLoad?: (imageNode: Konva.Image) => void;
}

interface CanvasMethods {
    zoomIn: () => void;
    zoomOut: () => void;
    resetView: () => void;
}

export default function Canvas({
    imageUrl,
    maskLines,
    setMaskLines,
    tool,
    brushSize,
    onCanvasReady,
    onImageLoad
}: CanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage | null>(null);
    const layerRef = useRef<Konva.Layer | null>(null);
    const imageNodeRef = useRef<Konva.Image | null>(null);
    const isDrawing = useRef(false);
    const currentLineRef = useRef<Konva.Line | null>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const lastPanPosition = useRef({ x: 0, y: 0 });
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

    // Initialize Konva stage (only once on mount)
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // Create stage
        const stage = new Konva.Stage({
            container: container,
            width: width,
            height: height,
            draggable: false
        });

        // Create layer
        const layer = new Konva.Layer();
        stage.add(layer);

        stageRef.current = stage;
        layerRef.current = layer;

        // Canvas methods
        const canvasMethods: CanvasMethods = {
            zoomIn: () => {
                const stage = stageRef.current;
                const layer = layerRef.current;
                if (!stage || !layer) return;

                const oldScale = stage.scaleX();
                const newScale = oldScale * 1.2;

                const center = {
                    x: stage.width() / 2,
                    y: stage.height() / 2
                };

                const mousePointTo = {
                    x: (center.x - stage.x()) / oldScale,
                    y: (center.y - stage.y()) / oldScale,
                };

                const newPos = {
                    x: center.x - mousePointTo.x * newScale,
                    y: center.y - mousePointTo.y * newScale,
                };

                setScale(newScale);
                setPosition(newPos);
                stage.scale({ x: newScale, y: newScale });
                stage.position(newPos);
                layer.batchDraw();
            },
            zoomOut: () => {
                const stage = stageRef.current;
                const layer = layerRef.current;
                if (!stage || !layer) return;

                const oldScale = stage.scaleX();
                const newScale = Math.max(0.1, oldScale * 0.8);

                const center = {
                    x: stage.width() / 2,
                    y: stage.height() / 2
                };

                const mousePointTo = {
                    x: (center.x - stage.x()) / oldScale,
                    y: (center.y - stage.y()) / oldScale,
                };

                const newPos = {
                    x: center.x - mousePointTo.x * newScale,
                    y: center.y - mousePointTo.y * newScale,
                };

                setScale(newScale);
                setPosition(newPos);
                stage.scale({ x: newScale, y: newScale });
                stage.position(newPos);
                layer.batchDraw();
            },
            resetView: () => {
                const stage = stageRef.current;
                const layer = layerRef.current;
                if (!stage || !layer) return;

                setScale(1);
                setPosition({ x: 0, y: 0 });
                stage.scale({ x: 1, y: 1 });
                stage.position({ x: 0, y: 0 });
                layer.batchDraw();
            }
        };

        if (onCanvasReady) {
            onCanvasReady(stage, canvasMethods, imageNodeRef.current);
        }

        // Set initial cursor style
        stage.container().style.cursor = 'default';

        // Prevent context menu on middle click
        stage.container().addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Handle resize
        const handleResize = () => {
            const newWidth = container.offsetWidth;
            const newHeight = container.offsetHeight;
            stage.width(newWidth);
            stage.height(newHeight);
            layer.batchDraw();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            stage.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Update cursor based on tool
    useEffect(() => {
        if (stageRef.current) {
            stageRef.current.draggable(false);
            const cursor = tool === 'select' ? 'default' : 'none'; // Hide cursor for brush/eraser
            stageRef.current.container().style.cursor = cursor;
        }
    }, [tool]);

    // Load and display image
    useEffect(() => {
        if (!layerRef.current) return;

        const layer = layerRef.current;

        // Remove old image if exists
        if (imageNodeRef.current) {
            imageNodeRef.current.destroy();
            imageNodeRef.current = null;
            layer.batchDraw();
        }

        // If no imageUrl, just remove the image and return
        if (!imageUrl) return;

        // Load new image
        const imageObj = new Image();
        imageObj.crossOrigin = 'anonymous';
        imageObj.onload = () => {
            const konvaImage = new Konva.Image({
                image: imageObj,
                x: 0,
                y: 0
            });

            imageNodeRef.current = konvaImage;
            layer.add(konvaImage);
            konvaImage.moveToBottom();
            layer.batchDraw();

            // Notify parent of image load
            if (onImageLoad) {
                onImageLoad(konvaImage);
            }

            // Center and fit image
            if (stageRef.current) {
                const stage = stageRef.current;
                const containerWidth = stage.width();
                const containerHeight = stage.height();

                const scaleX = (containerWidth * 0.8) / imageObj.width;
                const scaleY = (containerHeight * 0.8) / imageObj.height;
                const fitScale = Math.min(scaleX, scaleY);

                const newX = (containerWidth - imageObj.width * fitScale) / 2;
                const newY = (containerHeight - imageObj.height * fitScale) / 2;

                setScale(fitScale);
                setPosition({ x: newX, y: newY });

                stage.scale({ x: fitScale, y: fitScale });
                stage.position({ x: newX, y: newY });
                layer.batchDraw();
            }
        };
        imageObj.src = imageUrl;
    }, [imageUrl, onImageLoad]);

    // Redraw mask lines
    useEffect(() => {
        if (!layerRef.current) return;

        const layer = layerRef.current;

        // Remove all lines
        layer.find('.mask-line').forEach(line => line.destroy());

        // Draw new lines
        maskLines.forEach((line, i) => {
            const konvaLine = new Konva.Line({
                name: 'mask-line',
                points: line.points,
                stroke: '#ff0000',
                strokeWidth: line.size,
                tension: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: line.tool === 'eraser' ? 'destination-out' : 'source-over',
                opacity: 0.5
            });
            layer.add(konvaLine);
        });

        layer.batchDraw();
    }, [maskLines]);

    // Handle mouse events
    useEffect(() => {
        if (!stageRef.current || !layerRef.current) return;

        const stage = stageRef.current;
        const layer = layerRef.current;

        const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
            const evt = e.evt;

            // Middle mouse button (wheel click) for panning
            if (evt.button === 1) {
                setIsPanning(true);
                lastPanPosition.current = stage.getPointerPosition() || { x: 0, y: 0 };
                stage.container().style.cursor = 'grabbing';
                evt.preventDefault();
                return;
            }

            // Space + left click for panning (alternative)
            if (evt.button === 0 && evt.shiftKey) {
                setIsPanning(true);
                lastPanPosition.current = stage.getPointerPosition() || { x: 0, y: 0 };
                stage.container().style.cursor = 'grabbing';
                return;
            }

            if (tool === 'select' || !imageUrl) return;

            isDrawing.current = true;
            const pos = stage.getRelativePointerPosition();
            if (!pos) return;

            // Create temporary line for drawing
            const line = new Konva.Line({
                name: 'temp-line',
                points: [pos.x, pos.y],
                stroke: '#ff0000',
                strokeWidth: brushSize,
                tension: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over',
                opacity: 0.5
            });

            currentLineRef.current = line;
            layer.add(line);
            layer.batchDraw();
        };

        const handleMouseMove = () => {
            const pointerPos = stage.getPointerPosition();

            // Track cursor position for brush visualization
            if (pointerPos && (tool === 'brush' || tool === 'eraser')) {
                setCursorPos(pointerPos);
            } else {
                setCursorPos(null);
            }

            // Handle panning
            if (isPanning) {
                if (!pointerPos) return;

                const dx = pointerPos.x - lastPanPosition.current.x;
                const dy = pointerPos.y - lastPanPosition.current.y;

                const newPos = {
                    x: stage.x() + dx,
                    y: stage.y() + dy
                };

                setPosition(newPos);
                stage.position(newPos);
                layer.batchDraw();

                lastPanPosition.current = pointerPos;
                return;
            }

            if (!isDrawing.current || tool === 'select' || !imageUrl || !currentLineRef.current) return;

            const point = stage.getRelativePointerPosition();
            if (!point) return;

            // Update current line points
            const currentPoints = currentLineRef.current.points();
            currentLineRef.current.points(currentPoints.concat([point.x, point.y]));
            layer.batchDraw();
        };

        const handleMouseUp = () => {
            // End panning
            if (isPanning) {
                setIsPanning(false);
                stage.container().style.cursor = tool === 'select' ? 'default' : 'crosshair';
                return;
            }

            if (!isDrawing.current || !currentLineRef.current) {
                isDrawing.current = false;
                return;
            }

            isDrawing.current = false;

            // Add completed line to maskLines
            const points = currentLineRef.current.points();
            const currentTool = tool;
            const currentBrushSize = brushSize;

            if (points.length > 0) {
                setMaskLines((prevLines) => [
                    ...prevLines,
                    { tool: currentTool, points, size: currentBrushSize }
                ]);
            }

            // Remove temporary line
            currentLineRef.current.destroy();
            currentLineRef.current = null;
            layer.batchDraw();
        };

        const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
            e.evt.preventDefault();

            const evt = e.evt;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            // Detect pinch zoom on Mac trackpad (ctrlKey is set for pinch gestures)
            const isPinchZoom = evt.ctrlKey || evt.metaKey;

            if (isPinchZoom) {
                // Zoom with Ctrl/Cmd + wheel or trackpad pinch
                const mousePointTo = {
                    x: (pointer.x - stage.x()) / oldScale,
                    y: (pointer.y - stage.y()) / oldScale,
                };

                // Adjust zoom speed for better control
                const zoomSpeed = 0.05;
                const direction = evt.deltaY > 0 ? -1 : 1;
                const newScale = Math.max(0.1, Math.min(10, oldScale * (1 + direction * zoomSpeed)));

                setScale(newScale);

                const newPos = {
                    x: pointer.x - mousePointTo.x * newScale,
                    y: pointer.y - mousePointTo.y * newScale,
                };
                setPosition(newPos);

                stage.scale({ x: newScale, y: newScale });
                stage.position(newPos);
                layer?.batchDraw();
            } else {
                // Pan with regular wheel or trackpad two-finger scroll
                const dx = evt.deltaX || 0;
                const dy = evt.deltaY || 0;

                const newPos = {
                    x: stage.x() - dx,
                    y: stage.y() - dy,
                };

                setPosition(newPos);
                stage.position(newPos);
                layer?.batchDraw();
            }
        };

        const handleMouseLeave = () => {
            setCursorPos(null);
            handleMouseUp();
        };

        stage.on('mousedown', handleMouseDown);
        stage.on('mousemove', handleMouseMove);
        stage.on('mouseup', handleMouseUp);
        stage.on('mouseleave', handleMouseLeave);
        stage.on('wheel', handleWheel);

        return () => {
            stage.off('mousedown', handleMouseDown);
            stage.off('mousemove', handleMouseMove);
            stage.off('mouseup', handleMouseUp);
            stage.off('mouseleave', handleMouseLeave);
            stage.off('wheel', handleWheel);
        };
    }, [tool, brushSize, imageUrl, setMaskLines, isPanning]);

    return (
        <div className="w-full h-full bg-zinc-950 relative overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />

            {/* Custom Brush Cursor */}
            {cursorPos && (tool === 'brush' || tool === 'eraser') && (
                <div
                    className="pointer-events-none absolute rounded-full border-2 border-white/70 mix-blend-difference"
                    style={{
                        left: cursorPos.x,
                        top: cursorPos.y,
                        width: brushSize * scale,
                        height: brushSize * scale,
                        transform: 'translate(-50%, -50%)',
                        transition: 'width 0.1s, height 0.1s'
                    }}
                />
            )}
        </div>
    );
}
