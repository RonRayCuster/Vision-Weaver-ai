import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragHandleIcon } from './Icons';

interface ResizablePanelProps {
    children: [React.ReactNode, React.ReactNode];
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Initial width in percentage

    const handleMouseDown = useCallback(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
                // Constrain the width between 25% and 75%
                setLeftPanelWidth(Math.max(25, Math.min(75, newWidth)));
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
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const [leftPanel, rightPanel] = children;

    return (
        <div ref={containerRef} className="flex h-full w-full">
            <div 
                className="h-full min-w-[25%] max-w-[75%] bg-surface rounded-xl border border-border" 
                style={{ width: `${leftPanelWidth}%` }}
            >
                {leftPanel}
            </div>
            <div
                onMouseDown={handleMouseDown}
                className="w-4 h-full flex items-center justify-center cursor-col-resize group flex-shrink-0"
                title="Drag to resize panels"
            >
                <div className="w-1 h-16 bg-border rounded-full transition-all group-hover:bg-accent group-active:bg-accent group-active:scale-y-110 flex items-center justify-center">
                    <DragHandleIcon className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors"/>
                </div>
            </div>
            <div className="h-full flex-grow">
                {rightPanel}
            </div>
        </div>
    );
};
