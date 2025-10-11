import React, { useRef, useState } from 'react';
import { CinemaModeIcon, ExitCinemaModeIcon } from './Icons';

interface PlaybackControlsProps {
    isPlaying: boolean;
    togglePlay: () => void;
    currentTime: number;
    duration: number;
    onScrub: (time: number) => void;
    isCinemaMode: boolean;
    onToggleCinemaMode: () => void;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, togglePlay, currentTime, duration, onScrub, isCinemaMode, onToggleCinemaMode }) => {
    const timelineRef = useRef<HTMLDivElement | null>(null);
    const [tooltipTime, setTooltipTime] = useState<number | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState(0);

    const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
        const timeline = timelineRef.current;
        if (timeline) {
            const rect = timeline.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            onScrub(percentage * duration);
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        handleScrub(e); 
        const onMouseMove = (moveEvent: MouseEvent) => {
            const timeline = timelineRef.current;
            if (timeline) {
                const rect = timeline.getBoundingClientRect();
                const x = moveEvent.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, x / rect.width));
                onScrub(percentage * duration);
            }
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
        const timeline = timelineRef.current;
        if (timeline) {
            const rect = timeline.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            setTooltipTime(percentage * duration);
            setTooltipPosition(x);
        }
    };

    return (
        <div className="bg-surface p-3 rounded-xl flex items-center space-x-4 border border-border shadow-lg">
            <button 
                onClick={togglePlay} 
                className="w-10 h-10 flex items-center justify-center bg-accent hover:bg-accent/90 rounded-full text-text-primary transition-all flex-shrink-0 active:scale-90 focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M5 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm10 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 5.172a1 1 0 00-1.3.858v7.94a1 1 0 001.3.858l6.35-3.97a1 1 0 000-1.716L6.3 5.172z" /></svg>
                )}
            </button>
            <div className="text-sm font-mono text-text-secondary w-14 text-center">{formatTime(currentTime)}</div>
            <div 
                ref={timelineRef} 
                onMouseDown={handleMouseDown} 
                onMouseMove={handleTimelineHover}
                onMouseLeave={() => setTooltipTime(null)}
                className="relative w-full h-2.5 bg-primary rounded-full cursor-pointer group"
            >
                 <div className="absolute top-0 left-0 h-full bg-accent rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                 <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-text-primary rounded-full border-2 border-accent group-hover:scale-110 transition-transform shadow-md" 
                    style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                ></div>
                {tooltipTime !== null && (
                    <div 
                        className="absolute bottom-full mb-2 -translate-x-1/2 bg-primary text-text-primary text-xs font-mono px-2 py-1 rounded-md pointer-events-none"
                        style={{ left: `${tooltipPosition}px` }}
                    >
                        {formatTime(tooltipTime)}
                    </div>
                )}
            </div>
            <div className="text-sm font-mono text-text-secondary w-14 text-center">{formatTime(duration)}</div>
            <button 
                onClick={onToggleCinemaMode} 
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0 active:scale-90 focus:outline-none focus:ring-2 focus:ring-accent ${isCinemaMode ? 'bg-accent text-text-primary' : 'bg-primary text-text-secondary hover:bg-border'}`}
                aria-label={isCinemaMode ? "Exit Cinema Mode" : "Enter Cinema Mode"}
                title={isCinemaMode ? "Exit Cinema Mode (Esc)" : "Enter Cinema Mode"}
            >
                {isCinemaMode ? <ExitCinemaModeIcon /> : <CinemaModeIcon />}
            </button>
        </div>
    );
};

export default PlaybackControls;