import React from 'react';
import { findSegment, interpolate } from '../utils/interpolation';

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
}

const TimelineGraph: React.FC<TimelineGraphProps> = ({ data, color, height, duration, currentTime, label }) => {
    const points = data.map(d => `${(d.time / duration) * 100},${height - d.intensity * height}`).join(' ');

    // FIX: Explicitly provide the type to `findSegment` to ensure `start` and `end` are typed correctly as `TimelineDataPoint`.
    const { start, end } = findSegment<TimelineDataPoint>(data, currentTime);
    const currentIntensity = interpolate(start.intensity, end.intensity, start.time, end.time, currentTime);
    
    // Find the label of the segment we are currently in.
    const currentSegment = data.slice().reverse().find(d => currentTime >= d.time) || data[0];
    const currentLabel = currentSegment ? currentSegment.label : '';

    return (
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
            <div className="flex justify-between items-center text-xs text-gray-300 mb-1">
                <span>{label}</span>
                <span className="font-mono bg-gray-900 px-2 py-0.5 rounded">{currentLabel} ({currentIntensity.toFixed(2)})</span>
            </div>
            <svg width="100%" height={height} className="bg-gray-800 rounded-md overflow-hidden">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={points}
                />
                <line
                    x1={`${(currentTime / duration) * 100}%`}
                    y1="0"
                    x2={`${(currentTime / duration) * 100}%`}
                    y2={height}
                    stroke="#f59e0b"
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
};

export default TimelineGraph;