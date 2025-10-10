
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sceneData } from './constants';
import { findSegment, interpolate } from './utils/interpolation';
import type { CharacterPosition } from './types';
import VideoPlayer from './components/VideoPlayer';
import PlaybackControls from './components/PlaybackControls';
import DataPanel from './components/DataPanel';

export default function App() {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [showBlocking, setShowBlocking] = useState(true);
    const [showCameraPath, setShowCameraPath] = useState(true);
    const [showEmotionData, setShowEmotionData] = useState(true);

    const { duration } = sceneData;

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    }, []);

    const handleScrub = useCallback((newTime: number) => {
        const clampedTime = Math.max(0, Math.min(duration, newTime));
        setCurrentTime(clampedTime);
        if (videoRef.current) {
            videoRef.current.currentTime = clampedTime;
        }
    }, [duration]);

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    const characterPositions: CharacterPosition[] = sceneData.characters.map(char => {
        const { start, end } = findSegment(char.blocking, currentTime);
        const x = interpolate(start.x, end.x, start.time, end.time, currentTime);
        const y = interpolate(start.y, end.y, start.time, end.time, currentTime);
        return { ...char, x, y };
    });

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans p-4 lg:p-6 flex flex-col">
            <header className="mb-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-sky-400">Interactive Scene Visualizer</h1>
                    <p className="text-sm text-gray-400">Blocking & Emotion Data Visualization</p>
                </div>
                <div className="flex items-center space-x-4 p-2 bg-gray-800 rounded-lg">
                     <button className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-md text-sm transition-colors">Export Snapshot</button>
                     <button className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded-md text-sm transition-colors">Add Note</button>
                </div>
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col space-y-4">
                    <VideoPlayer
                        ref={videoRef}
                        videoUrl={sceneData.videoUrl}
                        onTimeUpdate={handleTimeUpdate}
                        showBlocking={showBlocking}
                        characterPositions={characterPositions}
                    />
                    <PlaybackControls
                        isPlaying={isPlaying}
                        togglePlay={togglePlay}
                        currentTime={currentTime}
                        duration={duration}
                        onScrub={handleScrub}
                    />
                </div>

                <DataPanel
                    sceneData={sceneData}
                    currentTime={currentTime}
                    showBlocking={showBlocking}
                    setShowBlocking={setShowBlocking}
                    showCameraPath={showCameraPath}
                    setShowCameraPath={setShowCameraPath}
                    showEmotionData={showEmotionData}
                    setShowEmotionData={setShowEmotionData}
                />
            </main>
        </div>
    );
}
