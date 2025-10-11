import React, { forwardRef } from 'react';
import type { CharacterPosition, CameraKeyframe } from '../types';

interface CurrentCameraPosition {
    x: number;
    y: number;
    complexity: number;
}
interface VideoPlayerProps {
    videoUrl: string;
    onTimeUpdate: () => void;
    showBlocking: boolean;
    characterPositions: CharacterPosition[];
    showCameraPath: boolean;
    cameraPath: CameraKeyframe[];
    cameraPathColor: string;
    currentCameraPosition: CurrentCameraPosition;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
    ({ videoUrl, onTimeUpdate, showBlocking, characterPositions, showCameraPath, cameraPath, cameraPathColor, currentCameraPosition }, ref) => {
        return (
            <div className="relative w-full aspect-video bg-primary rounded-xl overflow-hidden shadow-2xl shadow-accent/10">
                <video
                    ref={ref}
                    className="w-full h-full object-cover"
                    onTimeUpdate={onTimeUpdate}
                    src={videoUrl}
                    crossOrigin="anonymous"
                />
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none text-text-primary">
                    {showBlocking && characterPositions.map(char => (
                        <React.Fragment key={char.id}>
                            <polyline
                                points={char.blocking.map(p => `${p.x}%,${p.y}%`).join(' ')}
                                fill="none"
                                stroke={char.pathColor}
                                strokeWidth="2"
                                strokeDasharray="4"
                                opacity="0.5"
                            />
                            <g transform={`translate(${char.x}%, ${char.y}%)`}>
                                <circle cx="0" cy="0" r="12" fill={char.pathColor} opacity="0.3" />
                                <circle cx="0" cy="0" r="8" fill={char.pathColor} className="stroke-text-primary" strokeWidth="2" />
                                <text x="15" y="5" className="fill-current font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" fontSize="12">{char.name}</text>
                            </g>
                        </React.Fragment>
                    ))}
                    {showCameraPath && (
                        <React.Fragment>
                            <polyline
                                points={cameraPath.map(p => `${p.x}%,${p.y}%`).join(' ')}
                                fill="none"
                                stroke={cameraPathColor}
                                strokeWidth="2"
                                strokeDasharray="4"
                                opacity="0.5"
                            />
                            <g transform={`translate(${currentCameraPosition.x}%, ${currentCameraPosition.y}%)`}>
                                <circle cx="0" cy="0" r={5 + currentCameraPosition.complexity * 15} fill={cameraPathColor} opacity="0.3" />
                                <rect x="-8" y="-5" width="16" height="10" rx="2" fill={cameraPathColor} className="stroke-text-primary" strokeWidth="1.5" />
                                <circle cx="0" cy="0" r="3" className="fill-text-primary" />
                                <text x="12" y="4" className="fill-current font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" fontSize="10">CAM</text>
                            </g>
                        </React.Fragment>
                    )}
                </svg>
            </div>
        );
    }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
