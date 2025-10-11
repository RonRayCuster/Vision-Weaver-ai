import React, { useState, useRef, useCallback, useEffect } from 'react';
import { sceneData } from './constants';
import { findSegment, interpolate } from './utils/interpolation';
import type { CharacterPosition, SceneAnalysis, CinematicAnalysis, SceneReconstruction, EditedImage, GeneratedVideo } from './types';
import VideoPlayer from './components/VideoPlayer';
import PlaybackControls from './components/PlaybackControls';
import DataPanel from './components/DataPanel';
import Header from './components/Header';
import { useVideoPlayback } from './hooks/useVideoPlayback';
import { useAIDirectorChat } from './hooks/useAIDirectorChat';
import { useSceneViewOptions } from './hooks/useSceneViewOptions';
import { analyzeSceneLayout, analyzeCinematics, reconstructScene, editFrame, generateVideo } from './services/geminiService';
import AIDirectorChat from './components/AIDirectorChat';
import { ResizablePanel } from './components/ResizablePanel';

export default function App() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    
    const { 
        showBlocking, setShowBlocking, 
        showCameraPath, setShowCameraPath, 
        showEmotionData, setShowEmotionData,
        showDroneView, setShowDroneView
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

    const [editedImage, setEditedImage] = useState<EditedImage | null>(null);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [editImageError, setEditImageError] = useState<string | null>(null);

    const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);
    const [videoGenerationProgress, setVideoGenerationProgress] = useState<string | null>(null);

    const [isCinemaMode, setIsCinemaMode] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const { duration } = sceneData;
    const { currentTime, isPlaying, togglePlay, handleScrub, handleTimeUpdate } = useVideoPlayback(videoRef, duration);
    const { messages: chatMessages, isLoading: isChatLoading, error: chatError, sendMessage: sendChatMessage } = useAIDirectorChat();

     // Effect to handle Escape key for exiting Cinema Mode/Panel and prevent body scroll
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsCinemaMode(false);
                setIsPanelOpen(false);
            }
        };

        const shouldPreventScroll = isCinemaMode || isPanelOpen;
        if (shouldPreventScroll) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isCinemaMode, isPanelOpen]);

    const captureFrame = useCallback((time: number): Promise<string> =>
        new Promise((resolve, reject) => {
            const videoEl = videoRef.current;
            if (!videoEl) return reject(new Error("Video element not found."));
            
            videoEl.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth;
                canvas.height = videoEl.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Could not get canvas context"));
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
                 videoEl.onseeked = null; // Clean up
            };
            videoEl.onerror = () => reject(new Error("Video error during seek."));
            videoEl.currentTime = time;
        }), []);
    
    const handleAnalyzeScene = useCallback(async () => {
        if (!videoRef.current) return;
        
        setIsAnalyzing(true);
        setAnalysisError(null);
        setSceneAnalysis(null);
        setAnalysisProgress(null);

        const video = videoRef.current;
        const originalTime = video.currentTime;

        try {
            const FRAME_COUNT = 3;
            const TIME_OFFSET = 0.5;
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
        if (!videoRef.current) return;

        setIsAnalyzingCinematics(true);
        setCinematicAnalysisError(null);
        setCinematicAnalysis(null);
        
        const video = videoRef.current;
        const originalTime = video.currentTime;

        try {
            const frameData = await captureFrame(originalTime);
            
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
        if (!videoRef.current) return;

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

    const handleEditFrame = useCallback(async (prompt: string) => {
        if (!videoRef.current || !prompt.trim()) return;

        setIsEditingImage(true);
        setEditImageError(null);
        setEditedImage(null);

        const video = videoRef.current;
        const originalTime = video.currentTime;

        try {
            const frameData = await captureFrame(originalTime);
            const result = await editFrame(frameData, prompt);
            setEditedImage(result);
        } catch (error) {
            console.error("Image editing failed:", error);
            setEditImageError("Failed to edit the frame. Please try again.");
        } finally {
            setIsEditingImage(false);
        }
    }, [captureFrame]);

    const handleGenerateVideo = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;

        setIsGeneratingVideo(true);
        setVideoGenerationError(null);
        setGeneratedVideo(null);
        setVideoGenerationProgress("Starting generation...");

        try {
            const result = await generateVideo(prompt, setVideoGenerationProgress);
            setGeneratedVideo(result);
        } catch (error) {
            console.error("Video generation failed:", error);
            setVideoGenerationError("Failed to generate the video. Please try again.");
        } finally {
            setIsGeneratingVideo(false);
            setVideoGenerationProgress(null);
        }
    }, []);

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

    const mainPanelContent = (
         <DataPanel
            sceneData={sceneData}
            currentTime={currentTime}
            showBlocking={showBlocking}
            setShowBlocking={setShowBlocking}
            showCameraPath={showCameraPath}
            setShowCameraPath={setShowCameraPath}
            showEmotionData={showEmotionData}
            setShowEmotionData={setShowEmotionData}
            showDroneView={showDroneView}
            setShowDroneView={setShowDroneView}
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
            onEditFrame={handleEditFrame}
            isEditingImage={isEditingImage}
            editedImage={editedImage}
            editImageError={editImageError}
            onGenerateVideo={handleGenerateVideo}
            isGeneratingVideo={isGeneratingVideo}
            generatedVideo={generatedVideo}
            videoGenerationError={videoGenerationError}
            videoGenerationProgress={videoGenerationProgress}
            onSeek={handleScrub}
            onClose={() => setIsPanelOpen(false)}
        />
    );
     const chatPanelContent = (
        <AIDirectorChat 
            messages={chatMessages}
            isLoading={isChatLoading}
            error={chatError}
            sendMessage={sendChatMessage}
        />
    );

    return (
        <div className="bg-primary text-text-primary min-h-screen font-sans flex flex-col h-screen overflow-hidden">
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .fade-in { animation: fadeIn 0.5s ease-out forwards; }
                    .fade-in-delay-1 { animation-delay: 0.1s; }
                    .fade-in-delay-2 { animation-delay: 0.2s; }
                    .fade-in-delay-3 { animation-delay: 0.3s; }
                `}
            </style>
             {/* Cinema Mode Overlay */}
            <div
                className={`fixed inset-0 bg-primary/90 backdrop-blur-sm z-40 transition-opacity duration-500 ${
                    isCinemaMode ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsCinemaMode(false)}
            />

            {/* Mobile Panel Overlay */}
            <div
                className={`fixed inset-0 bg-primary/70 backdrop-blur-sm z-30 transition-opacity xl:hidden ${
                    isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsPanelOpen(false)}
            />

            <div className={`transition-opacity duration-500 flex-shrink-0 ${isCinemaMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                <Header onMenuClick={() => setIsPanelOpen(true)} />
            </div>

            <main className="flex-grow p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0">
                <div className={`xl:col-span-7 flex flex-col gap-6 fade-in fade-in-delay-2 opacity-0 transition-all duration-500 min-h-0 ${isCinemaMode ? 'relative z-50' : ''}`}>
                    <VideoPlayer
                        ref={videoRef}
                        videoUrl={sceneData.videoUrl}
                        onTimeUpdate={handleTimeUpdate}
                        showBlocking={showBlocking}
                        characterPositions={characterPositions}
                        showCameraPath={showCameraPath}
                        cameraPath={sceneData.camera.movement}
                        cameraPathColor={sceneData.camera.pathColor}
                        currentCameraPosition={currentCameraPosition}
                    />
                    <PlaybackControls
                        isPlaying={isPlaying}
                        togglePlay={togglePlay}
                        currentTime={currentTime}
                        duration={duration}
                        onScrub={handleScrub}
                        isCinemaMode={isCinemaMode}
                        onToggleCinemaMode={() => setIsCinemaMode(!isCinemaMode)}
                    />
                </div>
                
                {/* Desktop Layout: Resizable Panels */}
                <div className={`hidden xl:col-span-5 xl:flex min-h-0 fade-in fade-in-delay-3 opacity-0 ${isCinemaMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <ResizablePanel>
                        {mainPanelContent}
                        {chatPanelContent}
                    </ResizablePanel>
                </div>

                 {/* Mobile Layout: Slide-out Panel */}
                <div className={`
                    fixed top-0 right-0 h-full w-11/12 max-w-lg z-40
                    transition-transform duration-300 ease-in-out transform
                    ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
                    xl:hidden 
                    bg-surface rounded-l-xl flex flex-col overflow-hidden border-l border-border
                `}>
                    <div className="flex-grow overflow-y-auto">
                        {mainPanelContent}
                    </div>
                     <div className="flex-shrink-0 h-1/2 border-t border-border">
                        {chatPanelContent}
                    </div>
                </div>
            </main>
        </div>
    );
}
