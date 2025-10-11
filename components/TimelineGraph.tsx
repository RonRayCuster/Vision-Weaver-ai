import React, { useState, useRef } from 'react';
import { findSegment, interpolate } from '../utils/interpolation';
import { colors, getEmotionColor } from '../colors';

interface TimelineDataPoint {
    time: number;
    intensity: number;
    label: string;
}

interface TimelineGraphProps {
    data: TimelineDataPoint[];
    color: string;
    height: number;
    duration: number;
    currentTime: number;
    label: string;
    type?: 'emotion' | 'complexity' | 'default';
    onSeek?: (time: number) => void;
    noiseFactor?: number;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const TimelineGraph: React.FC<TimelineGraphProps> = ({ data, color, height, duration, currentTime, label, type = 'default', onSeek, noiseFactor }) => {
    const graphRef = useRef<HTMLDivElement>(null);
    const [hoverInfo, setHoverInfo] = useState<{ time: number; intensity: number; label: string; x: number } | null>(null);

    const { start, end } = findSegment<TimelineDataPoint>(data, currentTime);
    const currentIntensity = interpolate(start.intensity, end.intensity, start.time, end.time, currentTime);
    
    const currentSegment = data.slice().reverse().find(d => currentTime >= d.time) || data[0];
    const currentLabel = currentSegment ? currentSegment.label : '';

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!graphRef.current) return;
        const rect = graphRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const hoverTime = percentage * duration;

        const { start: hoverStart, end: hoverEnd } = findSegment<TimelineDataPoint>(data, hoverTime);
        const hoverIntensity = interpolate(hoverStart.intensity, hoverEnd.intensity, hoverStart.time, hoverEnd.time, hoverTime);
        const hoverSegment = data.slice().reverse().find(d => hoverTime >= d.time) || data[0];
        
        setHoverInfo({
            time: hoverTime,
            intensity: hoverIntensity,
            label: hoverSegment ? hoverSegment.label : '',
            x: x,
        });
    };
    
    const handleMouseLeave = () => {
        setHoverInfo(null);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!graphRef.current || !onSeek) return;
        const rect = graphRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        onSeek(percentage * duration);
    };

    const renderGraph = () => {
        switch (type) {
            case 'emotion': {
                const gradientId = `emotion-gradient-${label.replace(/\s+/g, '-')}`;
                const gradientStops = [];
                // FIX: Wrapped case in a block scope to resolve 'Cannot redeclare block-scoped variable' error.
                const steps = 200; // Increase steps for a much smoother gradient

                for (let i = 0; i <= steps; i++) {
                    const time = (i / steps) * duration;
                    const { start: s, end: e } = findSegment<TimelineDataPoint>(data, time);
                    const intensity = interpolate(s.intensity, e.intensity, s.time, e.time, time);
                    
                    gradientStops.push(
                        <stop 
                            key={i} 
                            offset={`${(i / steps) * 100}%`} 
                            stopColor={getEmotionColor(intensity)} 
                        />
                    );
                }

                return (
                    <svg width="100%" height={height} className="bg-surface rounded-md overflow-hidden">
                        <defs>
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                {gradientStops}
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="100%" height={height} fill={`url(#${gradientId})`} />
                    </svg>
                );
            }
            case 'complexity': {
                const points: string[] = [];
                // FIX: Wrapped case in a block scope to resolve 'Cannot redeclare block-scoped variable' error.
                const steps = 200; // Number of segments for more detail
                const finalNoiseFactor = noiseFactor ?? 0.3; // How much visual noise
                
                for (let i = 0; i <= steps; i++) {
                    const time = (i / steps) * duration;
                    const { start: s, end: e } = findSegment<TimelineDataPoint>(data, time);
                    const intensity = interpolate(s.intensity, e.intensity, s.time, e.time, time);
                    
                    // Deterministic noise based on time/index
                    const noise = (Math.sin(i * 0.4) * Math.cos(i * 0.15)) * intensity * finalNoiseFactor;
                    const y = height - (intensity * height * (1 - finalNoiseFactor)) - (height * noise);

                    const xPercent = (i / steps) * 100;
                    points.push(`${xPercent},${Math.max(0, Math.min(height, y))}`);
                }

                const polygonPoints = `${points.join(' ')} 100,${height} 0,${height}`;

                return (
                     <svg width="100%" height={height} className="bg-surface rounded-md overflow-hidden">
                        <polygon
                            fill={color}
                            fillOpacity="0.4"
                            stroke={color}
                            strokeWidth="1.5"
                            points={polygonPoints}
                        />
                    </svg>
                );
            }
            default: {
                const linePoints = data.map(d => `${(d.time / duration) * 100},${height - d.intensity * height}`).join(' ');
                return (
                    <svg width="100%" height={height} className="bg-surface rounded-md overflow-hidden">
                        <polyline
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            points={linePoints}
                        />
                    </svg>
                );
            }
        }
    };

    return (
        <div className="mb-2 p-3 bg-primary/50 rounded-lg">
            <div className="flex justify-between items-center text-xs text-text-secondary mb-1">
                <span>{label}</span>
                <span className="font-mono bg-primary px-2 py-0.5 rounded">{currentLabel} ({currentIntensity.toFixed(2)})</span>
            </div>
            <div 
                ref={graphRef}
                className="relative cursor-pointer group"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                {renderGraph()}
                <div
                    className="absolute top-0 bottom-0 w-0.5 transition-all duration-200 ease-linear"
                    style={{ 
                        left: `${(currentTime / duration) * 100}%`,
                        background: `repeating-linear-gradient(to bottom, ${colors.warning} 0, ${colors.warning} 4px, transparent 4px, transparent 8px)`
                     }}
                />
                {hoverInfo && (
                    <>
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-text-primary/70" 
                            style={{ left: `${hoverInfo.x}px` }}
                        />
                        <div 
                            className="absolute bottom-full mb-2 -translate-x-1/2 bg-primary text-text-primary text-xs font-mono px-2 py-1 rounded-md pointer-events-none shadow-lg z-10"
                            style={{ left: `${hoverInfo.x}px` }}
                        >
                            {formatTime(hoverInfo.time)} - {hoverInfo.label} ({hoverInfo.intensity.toFixed(2)})
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TimelineGraph;