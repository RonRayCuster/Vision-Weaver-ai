import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { presets, Preset } from './presets';
import { findSegment, interpolate } from './utils/interpolation';
// FIX: Imported specific keyframe types to use as explicit generic arguments for `findSegment`, resolving type errors.
import type { Character, CharacterPosition, SceneAnalysis, CinematicAnalysis, SceneReconstruction, EditedImage, GeneratedVideo, SceneData, BlockingKeyframe, CameraKeyframe, EmotionKeyframe, StoryboardPanel, SoundscapeAnalysis } from './types';
import VideoPlayer from './components/VideoPlayer';
import PlaybackControls from './components/PlaybackControls';
import DataPanel from './components/DataPanel';
import Header from './components/Header';
import { useVideoPlayback } from './hooks/useVideoPlayback';
import { useAIDirectorChat } from './hooks/useAIDirectorChat';
import { useSceneViewOptions } from './hooks/useSceneViewOptions';
import { analyzeSceneLayout, analyzeCinematics, reconstructScene, editFrame, generateVideo, analyzeEmotionalArc, FrameData, generateStoryboard, generateSoundscape } from './services/geminiService';
import AIDirectorChat from './components/AIDirectorChat';
import { ResizablePanel } from './components/ResizablePanel';
import { ToggleSwitch } from './components/ToggleSwitch';

const USER_PRESETS_STORAGE_KEY = 'visionweaver_user_presets';
const PRESET_ICONS = ['🎬', '🎥', '🍿', '🎞️', '🌟', '💡', '🎭', '✍️'];

export default function App() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    
    const [userPresets, setUserPresets] = useState<Preset[]>(() => {
        try {
            const saved = localStorage.getItem(USER_PRESETS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to load user presets from local storage:", error);
            return [];
        }
    });

    const [currentPresetId, setCurrentPresetId] = useState<string>(presets[0].id);
    const [currentSceneData, setCurrentSceneData] = useState<SceneData>(presets[0].data);
    
    const allPresets = useMemo(() => [...presets, ...userPresets], [userPresets]);

    // Effect to save user presets to local storage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(USER_PRESETS_STORAGE_KEY, JSON.stringify(userPresets));
        } catch (error) {
            console.error("Failed to save user presets to local storage:", error);
        }
    }, [userPresets]);


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
    const [originalImageForEdit, setOriginalImageForEdit] = useState<string | null>(null);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [editImageError, setEditImageError] = useState<string | null>(null);

    const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);
    const [videoGenerationProgress, setVideoGenerationProgress] = useState<string | null>(null);
    
    const [emotionalArcAnalysis, setEmotionalArcAnalysis] = useState<Record<string, EmotionKeyframe[]> | null>(null);
    const [isAnalyzingEmotions, setIsAnalyzingEmotions] = useState(false);
    const [emotionAnalysisError, setEmotionAnalysisError] = useState<string | null>(null);
    const [emotionAnalysisProgress, setEmotionAnalysisProgress] = useState<string | null>(null);

    const [storyboardPanels, setStoryboardPanels] = useState<StoryboardPanel[] | null>(null);
    const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
    const [storyboardError, setStoryboardError] = useState<string | null>(null);

    const [soundscape, setSoundscape] = useState<SoundscapeAnalysis | null>(null);
    const [isGeneratingSoundscape, setIsGeneratingSoundscape] = useState(false);
    const [soundscapeError, setSoundscapeError] = useState<string | null>(null);

    const [isCinemaMode, setIsCinemaMode] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const { duration } = currentSceneData;
    const { currentTime, isPlaying, togglePlay, handleScrub, handleTimeUpdate, setCurrentTime, setIsPlaying } = useVideoPlayback(videoRef, duration);
    const { messages: chatMessages, isLoading: isChatLoading, error: chatError, sendMessage: sendChatMessage } = useAIDirectorChat();
    
    const activeSceneData = useMemo(() => {
        if (!emotionalArcAnalysis) {
            return currentSceneData;
        }

        const newSceneData: SceneData = JSON.parse(JSON.stringify(currentSceneData));

        newSceneData.characters.forEach((char: Character) => {
            if (emotionalArcAnalysis[char.id]) {
                char.emotion = emotionalArcAnalysis[char.id];
            }
        });

        return newSceneData;
    }, [currentSceneData, emotionalArcAnalysis]);

    const handlePresetChange = useCallback((presetId: string) => {
        const newPreset = allPresets.find(p => p.id === presetId);
        if (newPreset) {
            const oldVideoUrl = currentSceneData.videoUrl;
            setCurrentPresetId(newPreset.id);
            setCurrentSceneData(newPreset.data);

            if (videoRef.current) {
                // Check if the video source needs changing to avoid unnecessary reloads
                if (oldVideoUrl !== newPreset.data.videoUrl) {
                    videoRef.current.src = newPreset.data.videoUrl;
                    videoRef.current.load();
                }
                videoRef.current.currentTime = 0;
            }
            setCurrentTime(0);
            setIsPlaying(false);

            // Reset all analysis states
            setSceneAnalysis(null);
            setAnalysisError(null);
            setAnalysisProgress(null);
            
            setCinematicAnalysis(null);
            setCinematicAnalysisError(null);
            
            setSceneReconstruction(null);
            setReconstructionError(null);
            setReconstructionProgress(null);
            
            setEditedImage(null);
            setEditImageError(null);
            setOriginalImageForEdit(null);

            setGeneratedVideo(null);
            setVideoGenerationError(null);
            setVideoGenerationProgress(null);
            
            setEmotionalArcAnalysis(null);
            setEmotionAnalysisError(null);
            setEmotionAnalysisProgress(null);

            setStoryboardPanels(null);
            setStoryboardError(null);

            setSoundscape(null);
            setSoundscapeError(null);

            setIsCinemaMode(false);
            setIsPanelOpen(false);
        }
    }, [allPresets, setCurrentTime, setIsPlaying, currentSceneData.videoUrl]);
    
    const handleSavePreset = useCallback(() => {
        const presetName = prompt("Enter a name for your new preset:");
        if (presetName && presetName.trim()) {
            const newPreset: Preset = {
                id: `user-${Date.now()}`, // Simple unique ID
                name: presetName.trim(),
                icon: PRESET_ICONS[userPresets.length % PRESET_ICONS.length], // Assign a cyclical icon
                data: activeSceneData, // Use the currently active data, which may include AI analysis
            };
            setUserPresets(prev => [...prev, newPreset]);
            // Automatically switch to the new preset
            setCurrentPresetId(newPreset.id);
        }
    }, [activeSceneData, userPresets.length]);


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
            
            const wasPlaying = !videoEl.paused;
            if (wasPlaying) videoEl.pause();

            videoEl.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth;
                canvas.height = videoEl.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Could not get canvas context"));
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
                 videoEl.onseeked = null; // Clean up
                 if (wasPlaying) videoEl.play();
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
        const wasPlaying = !video.paused;
        if (wasPlaying) video.pause();


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
                if(wasPlaying) videoRef.current.play();
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
        const wasPlaying = !video.paused;
        if (wasPlaying) video.pause();

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
                if(wasPlaying) videoRef.current.play();
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
        const wasPlaying = !video.paused;
        if (wasPlaying) video.pause();

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
                 if(wasPlaying) videoRef.current.play();
            }
        }
    }, [duration, captureFrame]);
    
    const handleAnalyzeEmotions = useCallback(async () => {
        if (!videoRef.current) return;

        setIsAnalyzingEmotions(true);
        setEmotionAnalysisError(null);
        setEmotionalArcAnalysis(null);
        setEmotionAnalysisProgress("Preparing for analysis...");

        const video = videoRef.current;
        const originalTime = video.currentTime;
        const wasPlaying = !video.paused;
        if (wasPlaying) video.pause();

        try {
            const FRAME_COUNT = 15;
            const frames: FrameData[] = [];

            for (let i = 0; i < FRAME_COUNT; i++) {
                const timestamp = (i / (FRAME_COUNT - 1)) * duration;
                setEmotionAnalysisProgress(`Capturing frame ${i + 1} of ${FRAME_COUNT}...`);
                const frameData = await captureFrame(timestamp);
                frames.push({ timestamp, base64: frameData });
            }

            setEmotionAnalysisProgress('Analyzing emotional performance...');
            
            const charactersToAnalyze = currentSceneData.characters.map(c => ({ id: c.id, name: c.name }));
            const result = await analyzeEmotionalArc(frames, charactersToAnalyze, duration);
            setEmotionalArcAnalysis(result);

        } catch (error) {
            console.error("Emotional Arc analysis failed:", error);
            setEmotionAnalysisError("Failed to analyze emotional performance. Please try again.");
        } finally {
            setIsAnalyzingEmotions(false);
            setEmotionAnalysisProgress(null);
            if (videoRef.current) {
                videoRef.current.currentTime = originalTime;
                if(wasPlaying) videoRef.current.play();
            }
        }
    }, [duration, captureFrame, currentSceneData.characters]);


    const handleEditFrame = useCallback(async (prompt: string) => {
        if (!videoRef.current || !prompt.trim()) return;

        setIsEditingImage(true);
        setEditImageError(null);
        setEditedImage(null);
        setOriginalImageForEdit(null);

        const video = videoRef.current;
        const originalTime = video.currentTime;

        try {
            const frameData = await captureFrame(originalTime);
            setOriginalImageForEdit(frameData);
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

    const handleGenerateStoryboard = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;
    
        setIsGeneratingStoryboard(true);
        setStoryboardError(null);
        setStoryboardPanels(null);
    
        try {
            const result = await generateStoryboard(prompt);
            setStoryboardPanels(result);
        } catch (error) {
            console.error("Storyboard generation failed:", error);
            setStoryboardError("Failed to generate the storyboard. Please try again.");
        } finally {
            setIsGeneratingStoryboard(false);
        }
    }, []);
    
    const handleGenerateSoundscape = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;
    
        setIsGeneratingSoundscape(true);
        setSoundscapeError(null);
        setSoundscape(null);
    
        try {
            const result = await generateSoundscape(prompt);
            setSoundscape(result);
        } catch (error) {
            console.error("Soundscape generation failed:", error);
            setSoundscapeError("Failed to generate the soundscape. Please try again.");
        } finally {
            setIsGeneratingSoundscape(false);
        }
    }, []);

    const handleExecuteAction = useCallback((actionType: string, timestamp: number) => {
        handleScrub(timestamp);

        // The analysis functions use the video's current time, which handleScrub updates.
        // The captureFrame utility handles waiting for the seek to complete.
        switch (actionType) {
            case 'ANALYZE_CINEMATICS':
                handleAnalyzeCinematics();
                break;
            case 'ANALYZE_LAYOUT':
                handleAnalyzeScene();
                break;
            case 'RECONSTRUCT_SCENE':
                handleReconstructScene();
                break;
            default:
                console.warn(`Unknown action type from chat: ${actionType}`);
        }
    }, [handleScrub, handleAnalyzeCinematics, handleAnalyzeScene, handleReconstructScene]);

    const characterPositions: CharacterPosition[] = activeSceneData.characters.map(char => {
        // FIX: Added explicit generic type `<BlockingKeyframe>` to the `findSegment` call.
        // This ensures TypeScript correctly identifies the returned object's shape,
        // allowing access to properties `x` and `y` and fixing the type error.
        const { start, end } = findSegment<BlockingKeyframe>(char.blocking, currentTime);
        const x = interpolate(start.x, end.x, start.time, end.time, currentTime);
        const y = interpolate(start.y, end.y, start.time, end.time, currentTime);
        return { ...char, x, y };
    });

    // FIX: Added explicit generic type `<CameraKeyframe>` to the `findSegment` call.
    // This resolves type errors by ensuring TypeScript recognizes the returned
    // `camStart` and `camEnd` objects as `CameraKeyframe` type, allowing access
    // to `x`, `y`, and `complexity` properties.
    const { start: camStart, end: camEnd } = findSegment<CameraKeyframe>(activeSceneData.camera.movement, currentTime);
    const cameraX = interpolate(camStart.x, camEnd.x, camStart.time, camEnd.time, currentTime);
    const cameraY = interpolate(camStart.y, camEnd.y, camStart.time, camEnd.time, currentTime);
    const cameraComplexity = interpolate(camStart.complexity, camEnd.complexity, camStart.time, camEnd.time, currentTime);
    const currentCameraPosition = { x: cameraX, y: cameraY, complexity: cameraComplexity };

    const mainPanelContent = (
         <DataPanel
            sceneData={activeSceneData}
            currentTime={currentTime}
            showCameraPath={showCameraPath}
            showEmotionData={showEmotionData}
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
            originalImageForEdit={originalImageForEdit}
            editImageError={editImageError}
            onGenerateVideo={handleGenerateVideo}
            isGeneratingVideo={isGeneratingVideo}
            generatedVideo={generatedVideo}
            videoGenerationError={videoGenerationError}
            videoGenerationProgress={videoGenerationProgress}
            onAnalyzeEmotions={handleAnalyzeEmotions}
            isAnalyzingEmotions={isAnalyzingEmotions}
            emotionAnalysisProgress={emotionAnalysisProgress}
            emotionAnalysisError={emotionAnalysisError}
            onGenerateStoryboard={handleGenerateStoryboard}
            isGeneratingStoryboard={isGeneratingStoryboard}
            storyboardPanels={storyboardPanels}
            storyboardError={storyboardError}
            onGenerateSoundscape={handleGenerateSoundscape}
            isGeneratingSoundscape={isGeneratingSoundscape}
            soundscape={soundscape}
            soundscapeError={soundscapeError}
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
            onExecuteAction={handleExecuteAction}
        />
    );

    const videoPlayerSection = (
        <div className={`flex flex-col gap-3 transition-all duration-500 min-h-0 ${isCinemaMode ? 'relative z-50' : ''}`}>
            <VideoPlayer
                ref={videoRef}
                videoUrl={activeSceneData.videoUrl}
                onTimeUpdate={handleTimeUpdate}
                showBlocking={showBlocking}
                characterPositions={characterPositions}
                showCameraPath={showCameraPath}
                cameraPath={activeSceneData.camera.movement}
                cameraPathColor={activeSceneData.camera.pathColor}
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
            <div className="bg-surface p-3 rounded-xl flex items-center justify-around space-x-4 border border-border shadow-lg">
                <ToggleSwitch label="Character Paths" isEnabled={showBlocking} onToggle={setShowBlocking} />
                <ToggleSwitch label="Camera Path" isEnabled={showCameraPath} onToggle={setShowCameraPath} />
                <ToggleSwitch label="Emotion Curves" isEnabled={showEmotionData} onToggle={setShowEmotionData} />
            </div>
        </div>
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
                <Header 
                    onMenuClick={() => setIsPanelOpen(true)}
                    presets={allPresets}
                    currentPresetId={currentPresetId}
                    onPresetChange={handlePresetChange}
                    onSavePreset={handleSavePreset}
                />
            </div>

            <main className="flex-grow p-4 lg:p-6 flex min-h-0">
                 {/* Desktop Layout: Resizable Panels */}
                <div className="hidden xl:flex w-full h-full min-h-0 fade-in fade-in-delay-2 opacity-0">
                    <ResizablePanel direction="horizontal" initialSize={60} minSize={40} maxSize={75}>
                        {/* Left Panel */}
                        <div className="h-full min-h-0 pr-2">
                            {videoPlayerSection}
                        </div>
                        {/* Right Panel */}
                        <div className={`h-full min-h-0 pl-2 flex flex-col ${isCinemaMode ? 'opacity-20 pointer-events-none' : ''}`}>
                            <div className="w-full h-full bg-surface rounded-xl border border-border overflow-hidden">
                                <ResizablePanel direction="vertical" initialSize={65} minSize={30} maxSize={70}>
                                    <div className="h-full w-full overflow-hidden">
                                        {mainPanelContent}
                                    </div>
                                    <div className="h-full w-full overflow-hidden border-t-2 border-border">
                                        {chatPanelContent}
                                    </div>
                                </ResizablePanel>
                            </div>
                        </div>
                    </ResizablePanel>
                </div>
                
                {/* Mobile/Tablet Layout */}
                <div className="flex xl:hidden w-full h-full min-h-0 fade-in fade-in-delay-2 opacity-0">
                    {videoPlayerSection}
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