import React, { useState, useCallback, useRef, ReactNode } from 'react';

interface ResizablePanelProps {
    children: [ReactNode, ReactNode];
    direction?: 'horizontal' | 'vertical';
    initialSize?: number; // percentage
    minSize?: number; // percentage
    maxSize?: number; // percentage
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
    children,
    direction = 'horizontal',
    initialSize = 50,
    minSize = 25,
    maxSize = 75,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [firstPanelSize, setFirstPanelSize] = useState(initialSize);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection during drag
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                let newSize;
                if (direction === 'horizontal') {
                    newSize = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                } else {
                    newSize = ((moveEvent.clientY - rect.top) / rect.height) * 100;
                }
                setFirstPanelSize(Math.max(minSize, Math.min(maxSize, newSize)));
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    }, [direction, minSize, maxSize]);

    const [firstPanel, secondPanel] = children;
    const isHorizontal = direction === 'horizontal';

    return (
        <div ref={containerRef} className={`flex h-full w-full ${isHorizontal ? 'flex-row' : 'flex-col'}`}>
            <div 
                className="min-w-0 min-h-0"
                style={isHorizontal ? { width: `${firstPanelSize}%` } : { height: `${firstPanelSize}%` }}
            >
                {firstPanel}
            </div>
            <div
                onMouseDown={handleMouseDown}
                className={`flex-shrink-0 flex items-center justify-center group ${isHorizontal ? 'w-4 h-full cursor-col-resize' : 'h-4 w-full cursor-row-resize'}`}
                title="Drag to resize panels"
            >
                <div 
                    className={`rounded-full transition-all bg-border group-hover:bg-accent group-active:bg-accent ${isHorizontal ? 'w-1 h-16 group-active:scale-y-110' : 'h-1 w-16 group-active:scale-x-110'}`}
                />
            </div>
            <div className="flex-grow min-w-0 min-h-0 flex">
                {secondPanel}
            </div>
        </div>
    );
};
