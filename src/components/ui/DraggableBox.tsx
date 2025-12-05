import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DraggableBoxProps {
    children: React.ReactNode;
    initialPosition?: { x: number; y: number };
    className?: string;
    handleClassName?: string;
}

export function DraggableBox({
    children,
    initialPosition = { x: 0, y: 0 },
    className,
    handleClassName
}: DraggableBoxProps) {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Optional: Add boundary checks here if needed

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only allow dragging from the handle if specified, otherwise the whole box
        if (handleClassName && !(e.target as HTMLElement).closest(`.${handleClassName}`)) {
            return;
        }

        // Prevent dragging if interacting with inputs or buttons
        if ((e.target as HTMLElement).tagName === 'INPUT' ||
            (e.target as HTMLElement).tagName === 'TEXTAREA' ||
            (e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }

        if (boxRef.current) {
            const rect = boxRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
            setIsDragging(true);
        }
    };

    return (
        <div
            ref={boxRef}
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 50, // High z-index to stay on top
                cursor: isDragging ? 'grabbing' : 'auto'
            }}
            className={cn("touch-none", className)}
            onMouseDown={handleMouseDown}
        >
            {children}
        </div>
    );
}
