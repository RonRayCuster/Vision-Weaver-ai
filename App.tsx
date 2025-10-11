
import React, { useState, useRef, useCallback } from 'react';
import { sceneData } from './constants';
import { findSegment, interpolate } from './utils/interpolation';
import type { CharacterPosition, SceneAnalysis, CinematicAnalysis, SceneReconstruction } from './types';
import VideoPlayer from './components/VideoPlayer';
import PlaybackControls from './components/PlaybackControls';
import DataPanel from './components/DataPanel';
import { useVideoPlayback } from './hooks/useVideoPlayback';
import { useAIDirectorChat } from './hooks/useAIDirectorChat';
import { useSceneViewOptions } from './hooks/useSceneViewOptions';
import { analyzeSceneLayout, analyzeCinematics, reconstructScene } from './services/geminiService';

export default function App() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    // FIX: Removed API key state. The API key is now handled by environment variables as per guidelines.

    const { 
        showBlocking, setShowBlocking, 
        showCameraPath, setShowCameraPath, 
        showEmotionData, setShowEmotionData 
    } = useSceneViewOptions();

    const [sceneAnalysis, setSceneAnalysis] = useState<SceneAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);

    const [cinematicAnalysis, setCinematicAnalysis] = useState<CinematicAnalysis | null>(null);
    const [isAnalyzingCinematics, setIsAnalyzingCinematics] = useState(false);
    const [cinematicAnalysisError, setCinematicAnalysisError] = useState<string | null>(null);

    const [sceneReconstruction, setSceneReconstruction] = useState<SceneReconstruction | null>(null);
    const [isReconstructing, setIsReconstructing] = useState(false);
    const [reconstructionError, setReconstructionError] = useState<string | null>(null);
    const [reconstructionProgress, setReconstructionProgress] = useState<string | null>(null);


    const { duration } = sceneData;
    const { currentTime, isPlaying, togglePlay, handleScrub, handleTimeUpdate } = useVideoPlayback(videoRef, duration);
    // FIX: API key is no longer passed to the chat hook.
    const { messages: chatMessages, isLoading: isChatLoading, error: chatError, sendMessage: sendChatMessage } = useAIDirectorChat();

    const captureFrame = useCallback((time: number): Promise<string> =>
        new Promise((resolve, reject) => {
            const videoEl = videoRef.current;
            if (!videoEl) return reject(new Error("Video element not found."));
            
            const onSeeked = () => {
                videoEl.removeEventListener('seeked', onSeeked);
                videoEl.removeEventListener('error', onError);
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth;
                canvas.height = videoEl.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Could not get canvas context"));
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
            };
            const onError = () => {
                videoEl.removeEventListener('seeked', onSeeked);
                videoEl.removeEventListener('error', onError);
                reject(new Error("Video error during seek."));
            };

            videoEl.addEventListener('seeked', onSeeked, { once: true });
            videoEl.addEventListener('error', onError, { once: true });
            videoEl.currentTime = time;
        }), []);
    
    const handleAnalyzeScene = useCallback(async () => {
        // FIX: Removed API key check. The key is assumed to be available in the environment.
        if (!videoRef.current) {
            return;
        }
        
        setIsAnalyzing(true);
        setAnalysisError(null);
        setSceneAnalysis(null);
        setAnalysisProgress(null);

        const video = videoRef.current;
        const originalTime = video.currentTime;

        try {
            const FRAME_COUNT = 3;
            const TIME_OFFSET = 0.5; // seconds
            const base64Frames: string[] = [];
            
            const timestamps = Array.from({ length: FRAME_COUNT }, (_, i) => {
                const time = originalTime + (i - Math.floor(FRAME_COUNT / 2)) * TIME_OFFSET;
                return Math.max(0, Math.min(duration, time));
            });

            for (let i = 0; i < timestamps.length; i++) {
                setAnalysisProgress(`Capturing frame ${i + 1} of ${FRAME_COUNT}...`);
                const frameData = await captureFrame(timestamps[i]);
                base64Frames.push(frameData);
            }

            setAnalysisProgress('Analyzing scene layout...');
            
            // FIX: API key is no longer passed to the service function.
            const resultJson = await analyzeSceneLayout(base64Frames);
            setSceneAnalysis(resultJson);

        } catch (error) {
            console.error("Scene analysis failed:", error);
            setAnalysisError("Failed to analyze the scene. Check your API key configuration or try again.");
        } finally {
            setIsAnalyzing(false);
            setAnalysisProgress(null);
            if (videoRef.current) {
                videoRef.current.currentTime = originalTime;
            }
        }
    }, [duration, captureFrame]);

    const handleAnalyzeCinematics = useCallback(async () => {
        // FIX: Removed API key check.
        if (!videoRef.current) {
            return;
        }

        setIsAnalyzingCinematics(true);
        setCinematicAnalysisError(null);
        setCinematicAnalysis(null);
        
        const video = videoRef.current;
        const originalTime = video.currentTime;

        try {
            const frameData = await captureFrame(originalTime);
            
            // FIX: API key is no longer passed to the service function.
            const resultJson = await analyzeCinematics(frameData);
            setCinematicAnalysis(resultJson);

        } catch (error) {
            console.error("Cinematic analysis failed:", error);
            setCinematicAnalysisError("Failed to analyze cinematics. Check your API key configuration or try again.");
        } finally {
            setIsAnalyzingCinematics(false);
            if (videoRef.current) {
                videoRef.current.currentTime = originalTime;
            }
        }
    }, [captureFrame]);

    const handleReconstructScene = useCallback(async () => {
        // FIX: Removed API key check.
        if (!videoRef.current) {
            return;
        }

        setIsReconstructing(true);
        setReconstructionError(null);
        setSceneReconstruction(null);
        setReconstructionProgress(null);

        const video = videoRef.current;
        const originalTime = video.currentTime;

        try {
            const FRAME_COUNT = 5;
            const TIME_OFFSET = 0.25;
            const base64Frames: string[] = [];
            
            const timestamps = Array.from({ length: FRAME_COUNT }, (_, i) => {
                const time = originalTime + (i - Math.floor(FRAME_COUNT / 2)) * TIME_OFFSET;
                return Math.max(0, Math.min(duration, time));
            });
            
            for (let i = 0; i < timestamps.length; i++) {
                setReconstructionProgress(`Capturing frame ${i + 1} of ${FRAME_COUNT}...`);
                const frameData = await captureFrame(timestamps[i]);
                base64Frames.push(frameData);
            }

            setReconstructionProgress('Reconstructing 3D scene...');
            
            // FIX: API key is no longer passed to the service function.
            const resultJson = await reconstructScene(base64Frames);
            setSceneReconstruction(resultJson);

        } catch (error) {
            console.error("3D Reconstruction failed:", error);
            setReconstructionError("Failed to reconstruct the 3D scene. Check your API key configuration or try again.");
        } finally {
            setIsReconstructing(false);
            setReconstructionProgress(null);
            if (videoRef.current) {
                videoRef.current.currentTime = originalTime;
            }
        }
    }, [duration, captureFrame]);

    const characterPositions: CharacterPosition[] = sceneData.characters.map(char => {
        const { start, end } = findSegment(char.blocking, currentTime);
        const x = interpolate(start.x, end.x, start.time, end.time, currentTime);
        const y = interpolate(start.y, end.y, start.time, end.time, currentTime);
        return { ...char, x, y };
    });

    const { start: camStart, end: camEnd } = findSegment(sceneData.camera.movement, currentTime);
    const cameraX = interpolate(camStart.x, camEnd.x, camStart.time, camEnd.time, currentTime);
    const cameraY = interpolate(camStart.y, camEnd.y, camStart.time, camEnd.time, currentTime);
    const cameraComplexity = interpolate(camStart.complexity, camEnd.complexity, camStart.time, camEnd.time, currentTime);
    const currentCameraPosition = { x: cameraX, y: cameraY, complexity: cameraComplexity };


    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans p-4 lg:p-6 flex flex-col">
            <header className="mb-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-sky-400">Interactive Scene Visualizer</h1>
                    <p className="text-sm text-gray-400">Blocking & Emotion Data Visualization</p>
                </div>
                 {/* FIX: Removed API key input field as per coding guidelines. */}
            </header>

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col space-y-4">
                    <VideoPlayer
                        ref={videoRef}
                        videoUrl={sceneData.videoUrl}
                        onTimeUpdate={handleTimeUpdate}
                        showBlocking={showBlocking}
                        characterPositions={characterPositions}
                        showCameraPath={showCameraPath}
                        cameraPath={sceneData.camera.movement}
                        currentCameraPosition={currentCameraPosition}
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
                    onAnalyzeScene={handleAnalyzeScene}
                    isAnalyzing={isAnalyzing}
                    sceneAnalysis={sceneAnalysis}
                    analysisError={analysisError}
                    analysisProgress={analysisProgress}
                    onAnalyzeCinematics={handleAnalyzeCinematics}
                    isAnalyzingCinematics={isAnalyzingCinematics}
                    cinematicAnalysis={cinematicAnalysis}
                    cinematicAnalysisError={cinematicAnalysisError}
                    onReconstructScene={handleReconstructScene}
                    isReconstructing={isReconstructing}
                    sceneReconstruction={sceneReconstruction}
                    reconstructionError={reconstructionError}
                    reconstructionProgress={reconstructionProgress}
                    chatMessages={chatMessages}
                    isChatLoading={isChatLoading}
                    chatError={chatError}
                    sendChatMessage={sendChatMessage}
                />
            </main>
        </div>
    );
}
