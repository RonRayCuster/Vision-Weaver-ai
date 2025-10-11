import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { sceneData } from './constants';
import { findSegment, interpolate } from './utils/interpolation';
import type { CharacterPosition, SceneAnalysis, CinematicAnalysis, SceneReconstruction } from './types';
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
        if (!videoRef.current) return;
        
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
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const vector3Schema = {
                type: Type.OBJECT,
                properties: {
                    x: { type: Type.NUMBER, description: "X coordinate from 0-100" },
                    y: { type: Type.NUMBER, description: "Y coordinate from 0-100 (ground plane)" },
                    z: { type: Type.NUMBER, description: "Z coordinate from 0-100 (height)" },
                },
                 required: ["x", "y", "z"]
            };
            
            const parts = [
                { text: `Analyze this sequence of frames from a movie. Describe the 3D layout from a top-down perspective (100x100 grid), character emotions, their interactions, the overall environment, and mood. Be very descriptive and nuanced in your analysis, especially for the environment (time of day, weather, location) and mood (specific emotional tones like 'melancholy' or 'suspenseful'). The frames are sequential. Provide a single, consolidated JSON response adhering to the schema.` },
                ...base64Frames.map(frame => ({ inlineData: { mimeType: 'image/jpeg', data: frame } }))
            ];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            actors: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "Name of the actor or character."},
                                        position: vector3Schema,
                                        emotion: { type: Type.STRING, description: "The character's perceived emotion (e.g., 'happy', 'anxious')." },
                                        interaction: { type: Type.STRING, description: "Description of interaction with props or other characters. Null if none." }
                                    },
                                    required: ["name", "position", "emotion", "interaction"]
                                }
                            },
                            camera: {
                                type: Type.OBJECT,
                                properties: { position: vector3Schema },
                                required: ["position"]
                            },
                            lights: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING, description: "e.g., key, fill, back, practical"},
                                        position: vector3Schema,
                                        intensity: { type: Type.NUMBER, description: "Light intensity from 0 to 1." }
                                    },
                                    required: ["type", "position", "intensity"]
                                }
                            },
                             props: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "Name of the prop."},
                                        position: vector3Schema,
                                    },
                                    required: ["name", "position"]
                                }
                            },
                            environmentDescription: {
                                type: Type.STRING,
                                description: "Describe the physical environment. Include details like location (e.g., 'forest', 'kitchen'), time of day, and weather if applicable."
                            },
                            overallMood: {
                                type: Type.STRING,
                                description: "Describe the emotional atmosphere of the scene. Use specific, nuanced words (e.g., 'melancholy', 'suspenseful', 'joyful') rather than general categories."
                            }
                        },
                        required: ["actors", "camera", "lights", "props", "environmentDescription", "overallMood"]
                    }
                }
            });

            const resultJson = JSON.parse(response.text);
            setSceneAnalysis(resultJson);

        } catch (error) {
            console.error("Scene analysis failed:", error);
            setAnalysisError("Failed to analyze the scene. Please try again.");
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
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const parts = [
                { text: `Analyze the cinematic properties of this film frame. Describe the shot composition, color palette, and inferred camera work. Provide a JSON response adhering to the schema.` },
                { inlineData: { mimeType: 'image/jpeg', data: frameData } }
            ];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            shotComposition: {
                                type: Type.STRING,
                                description: "Describe the shot composition. Specify the shot size (e.g., 'Extreme Close-up', 'Medium Shot', 'Full Shot'). Mention any notable framing techniques like rule of thirds, leading lines, or symmetry."
                            },
                            colorPalette: {
                                type: Type.STRING,
                                description: "Describe the color palette and grading. Specify the color temperature (e.g., 'cool blues', 'warm oranges'), dominant colors, and contrast level (e.g., 'high contrast', 'low contrast'). Describe the mood these colors evoke."
                            },
                            cameraWork: {
                                type: Type.STRING,
                                description: "Infer and describe the camera work. Specify camera movement (e.g., 'static', 'handheld shake', 'smooth dolly', 'dolly zoom'). Infer the likely lens focal length (e.g., 'wide-angle', 'telephoto')."
                            }
                        },
                        required: ["shotComposition", "colorPalette", "cameraWork"]
                    }
                }
            });

            const resultJson = JSON.parse(response.text);
            setCinematicAnalysis(resultJson);

        } catch (error) {
            console.error("Cinematic analysis failed:", error);
            setCinematicAnalysisError("Failed to analyze cinematics. Please try again.");
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
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const vector3Schema = {
                type: Type.OBJECT,
                properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    z: { type: Type.NUMBER },
                },
                required: ["x", "y", "z"]
            };

            const parts = [
                { text: `Analyze this sequence of frames. Use the COLMAP tool to perform a 3D reconstruction of the scene. Generate a dense point cloud and the corresponding camera poses for each frame. The origin (0,0,0) should be the center of the scene. Provide a JSON response adhering to the schema.` },
                ...base64Frames.map(frame => ({ inlineData: { mimeType: 'image/jpeg', data: frame } }))
            ];
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                tools: [{ colmap: {} }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            pointCloud: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        position: vector3Schema,
                                        color: { type: Type.STRING, description: "Hex color string (#RRGGBB)" }
                                    },
                                    required: ["position", "color"]
                                }
                            },
                            cameraPoses: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        position: vector3Schema,
                                        orientation: {
                                            type: Type.OBJECT,
                                            properties: {
                                                x: { type: Type.NUMBER },
                                                y: { type: Type.NUMBER },
                                                z: { type: Type.NUMBER },
                                                w: { type: Type.NUMBER },
                                            },
                                            description: "Quaternion representing camera orientation.",
                                            required: ["x", "y", "z", "w"]
                                        }
                                    },
                                    required: ["position", "orientation"]
                                }
                            }
                        },
                        required: ["pointCloud", "cameraPoses"]
                    }
                }
            });
            const resultJson = JSON.parse(response.text);
            setSceneReconstruction(resultJson);

        } catch (error) {
            console.error("3D Reconstruction failed:", error);
            setReconstructionError("Failed to reconstruct the 3D scene. Please try again.");
        } finally {
            setIsReconstructing(false);
            setReconstructionProgress(null);
            if (videoRef.current) {
                videoRef.current.currentTime = originalTime;
            }
        }
    }, [duration, captureFrame]);


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
                />
            </main>
        </div>
    );
}