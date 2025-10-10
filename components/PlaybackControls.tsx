
import React, { useRef } from 'react';

interface PlaybackControlsProps {
    isPlaying: boolean;
    togglePlay: () => void;
    currentTime: number;
    duration: number;
    onScrub: (time: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, togglePlay, currentTime, duration, onScrub }) => {
    const timelineRef = useRef<HTMLDivElement | null>(null);

    const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
        const timeline = timelineRef.current;
        if (timeline) {
            const rect = timeline.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const newTime = percentage * duration;
            onScrub(newTime);
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
                const newTime = percentage * duration;
                onScrub(newTime);
            }
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    return (
        <div className="bg-gray-800 p-3 rounded-lg flex items-center space-x-4">
            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-sky-500 hover:bg-sky-600 rounded-full text-white transition-colors flex-shrink-0">
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
            </button>
            <div className="text-sm font-mono">{currentTime.toFixed(2)}s</div>
            <div 
                ref={timelineRef} 
                onMouseDown={handleMouseDown} 
                className="relative w-full h-2 bg-gray-700 rounded-full cursor-pointer group"
            >
                 <div className="absolute top-0 left-0 h-full bg-sky-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                 <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-sky-500 group-hover:scale-110 transition-transform" style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}></div>
            </div>
            <div className="text-sm font-mono">{duration.toFixed(2)}s</div>
        </div>
    );
};

export default PlaybackControls;
