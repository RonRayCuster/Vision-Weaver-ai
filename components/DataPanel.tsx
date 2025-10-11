
import React from 'react';
// FIX: Import `EmotionKeyframe` to use as an explicit generic type argument for `findSegment`.
import type { SceneData, EmotionKeyframe, SceneAnalysis, CinematicAnalysis, SceneReconstruction } from '../types';
import { findSegment, interpolate } from '../utils/interpolation';
import TimelineGraph from './TimelineGraph';
import Scene3DView from './Scene3DView';
import PointCloudViewer from './PointCloudViewer';
import AIDirectorChat from './AIDirectorChat';
import type { ChatMessage } from '../hooks/useAIDirectorChat';

interface DataPanelProps {
    sceneData: SceneData;
    currentTime: number;
    showBlocking: boolean;
    setShowBlocking: (show: boolean) => void;
    showCameraPath: boolean;
    setShowCameraPath: (show: boolean) => void;
    showEmotionData: boolean;
    setShowEmotionData: (show: boolean) => void;
    onAnalyzeScene: () => void;
    isAnalyzing: boolean;
    sceneAnalysis: SceneAnalysis | null;
    analysisError: string | null;
    analysisProgress: string | null;
    onAnalyzeCinematics: () => void;
    isAnalyzingCinematics: boolean;
    cinematicAnalysis: CinematicAnalysis | null;
    cinematicAnalysisError: string | null;
    onReconstructScene: () => void;
    isReconstructing: boolean;
    sceneReconstruction: SceneReconstruction | null;
    reconstructionError: string | null;
    reconstructionProgress: string | null;
    // Chat props
    chatMessages: ChatMessage[];
    isChatLoading: boolean;
    chatError: string | null;
    sendChatMessage: (message: string) => void;
}

const getEmotionColor = (intensity: number) => {
    const hue = (1 - intensity) * 240; // 0 (red) to 240 (blue)
    return `hsl(${hue}, 80%, 50%)`;
};

const DataPanel: React.FC<DataPanelProps> = ({
    sceneData,
    currentTime,
    showBlocking,
    setShowBlocking,
    showCameraPath,
    setShowCameraPath,
    showEmotionData,
    setShowEmotionData,
    onAnalyzeScene,
    isAnalyzing,
    sceneAnalysis,
    analysisError,
    analysisProgress,
    onAnalyzeCinematics,
    isAnalyzingCinematics,
    cinematicAnalysis,
    cinematicAnalysisError,
    onReconstructScene,
    isReconstructing,
    sceneReconstruction,
    reconstructionError,
    reconstructionProgress,
    chatMessages,
    isChatLoading,
    chatError,
    sendChatMessage,
}) => {
    const totalEmotionalIntensity = sceneData.characters.reduce((acc, char) => {
        // FIX: Explicitly provide the type to `findSegment` to ensure `start` and `end` are typed correctly as `EmotionKeyframe`.
        const { start, end } = findSegment<EmotionKeyframe>(char.emotion, currentTime);
        const intensity = interpolate(start.intensity, end.intensity, start.time, end.time, currentTime);
        return acc + intensity;
    }, 0) / sceneData.characters.length;
    
    const baseButtonClass = "w-full text-center p-2 rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm";
    const anyAnalysisRunning = isAnalyzing || isAnalyzingCinematics || isReconstructing;

    return (
        <div className="bg-gray-800 p-4 rounded-xl flex flex-col overflow-y-auto max-h-[calc(100vh-120px)]">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                     <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Data Layers</h2>
                     <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                            onClick={() => setShowBlocking(!showBlocking)}
                            className={`${baseButtonClass} ${
                                showBlocking
                                    ? 'bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-500'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-sky-500'
                            }`}
                        >
                            Bird's Eye Blocking
                        </button>
                         <button
                            onClick={() => setShowCameraPath(!showCameraPath)}
                            className={`${baseButtonClass} ${
                                showCameraPath
                                    ? 'bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-500'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-pink-500'
                            }`}
                         >
                            Camera Data
                        </button>
                        <button
                            onClick={() => setShowEmotionData(!showEmotionData)}
                            className={`${baseButtonClass} col-span-2 ${
                                showEmotionData
                                    ? 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-amber-500'
                            }`}
                        >
                            Emotion Curves
                        </button>
                     </div>

                    <div className="border-b border-gray-700 mb-4 pb-4">
                         <h2 className="text-lg font-semibold mb-3 pb-2">AI Scene Analysis</h2>
                         <div className="mb-4">
                            <button
                                onClick={onAnalyzeScene}
                                // FIX: Removed isApiKeySet check from disabled logic.
                                disabled={anyAnalysisRunning}
                                className="w-full bg-indigo-600 text-white p-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                // FIX: Removed conditional title.
                                title={'Analyze the current scene layout'}
                            >
                                 {isAnalyzing && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                 <span>{isAnalyzing ? (analysisProgress || 'Analyzing...') : 'Analyze Scene Layout'}</span>
                            </button>
                         </div>
                         <div className="h-64 mb-4 flex items-center justify-center bg-gray-900/50 rounded-lg">
                            {isAnalyzing && (
                                 <div className="text-center p-4">
                                   <p className="text-gray-400">{analysisProgress || 'AI is analyzing the scene...'}</p>
                                 </div>
                            )}
                            {analysisError && <p className="text-red-400 text-center p-4">{analysisError}</p>}
                            {sceneAnalysis && <Scene3DView analysis={sceneAnalysis} />}
                            {/* FIX: Removed conditional text based on API key status. */}
                            {!isAnalyzing && !analysisError && !sceneAnalysis && <p className="text-gray-500">Analyze scene to generate 3D view</p>}
                         </div>
                          {sceneAnalysis && (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <h4 className="font-semibold text-gray-300">Environment</h4>
                                    <p className="text-gray-400 bg-gray-900/50 p-2 rounded-md text-xs">{sceneAnalysis.environmentDescription}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-300">Overall Mood</h4>
                                    <p className="text-gray-400 bg-gray-900/50 p-2 rounded-md text-xs">{sceneAnalysis.overallMood}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-300">Character Details</h4>
                                    <ul className="space-y-2">
                                        {sceneAnalysis.actors.map((actor, i) => (
                                            <li key={i} className="bg-gray-900/50 p-2 rounded-md">
                                                <p><strong className="text-sky-400">{actor.name}:</strong> <span className="text-gray-300 capitalize">{actor.emotion}</span></p>
                                                {actor.interaction && (
                                                    <p className="text-xs text-gray-500 mt-1"><em>&rarr; Interaction: {actor.interaction}</em></p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="border-b border-gray-700 mb-4 pb-4">
                        <h2 className="text-lg font-semibold mb-3 pb-2">AI Cinematic Analysis</h2>
                         <div className="mb-4">
                            <button
                                onClick={onAnalyzeCinematics}
                                disabled={anyAnalysisRunning}
                                className="w-full bg-teal-600 text-white p-2 rounded-md font-semibold hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                title={'Analyze the current frame cinematics'}
                            >
                                 {isAnalyzingCinematics && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                 <span>{isAnalyzingCinematics ? 'Analyzing...' : 'Analyze Cinematics'}</span>
                            </button>
                         </div>
                         {isAnalyzingCinematics && (
                             <div className="text-center p-4 text-gray-400">
                               <p>AI is analyzing cinematic properties...</p>
                             </div>
                         )}
                         {cinematicAnalysisError && <p className="text-red-400 text-center p-4">{cinematicAnalysisError}</p>}
                         {cinematicAnalysis && (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <h4 className="font-semibold text-teal-300">Composition</h4>
                                    <p className="text-gray-400 bg-gray-900/50 p-2 rounded-md text-xs">{cinematicAnalysis.shotComposition}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-teal-300">Color Palette</h4>
                                    <p className="text-gray-400 bg-gray-900/50 p-2 rounded-md text-xs">{cinematicAnalysis.colorPalette}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-teal-300">Camera Work</h4>
                                    <p className="text-gray-400 bg-gray-900/50 p-2 rounded-md text-xs">{cinematicAnalysis.cameraWork}</p>
                                </div>
                            </div>
                        )}
                    </div>

                     <div className="border-b border-gray-700 mb-4 pb-4">
                         <h2 className="text-lg font-semibold mb-3 pb-2">AI 3D Reconstruction</h2>
                         <div className="mb-4">
                            <button
                                onClick={onReconstructScene}
                                disabled={anyAnalysisRunning}
                                className="w-full bg-purple-600 text-white p-2 rounded-md font-semibold hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                title={'Reconstruct the scene in 3D'}
                            >
                                 {isReconstructing && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                 <span>{isReconstructing ? (reconstructionProgress || 'Reconstructing...') : 'Reconstruct 3D Scene'}</span>
                            </button>
                         </div>
                         <div className="h-64 mb-4 flex items-center justify-center bg-gray-900/50 rounded-lg">
                            {isReconstructing && (
                                 <div className="text-center p-4">
                                   <p className="text-gray-400">{reconstructionProgress || 'AI is reconstructing the scene...'}</p>
                                 </div>
                            )}
                            {reconstructionError && <p className="text-red-400 text-center p-4">{reconstructionError}</p>}
                            {sceneReconstruction && <PointCloudViewer reconstruction={sceneReconstruction} />}
                            {!isReconstructing && !reconstructionError && !sceneReconstruction && <p className="text-gray-500">Reconstruct scene to generate point cloud</p>}
                         </div>
                    </div>


                     <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Frame Data</h2>
                    <div className="mb-4">
                        <h3 className="text-sm text-gray-300 mb-1">Overall Scene Emotion</h3>
                        <div className="w-full h-8 rounded-lg transition-colors duration-300 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: getEmotionColor(totalEmotionalIntensity) }}>
                             INTENSITY: {totalEmotionalIntensity.toFixed(2)}
                        </div>
                    </div>
                    
                    <div className="flex-grow">
                        {showCameraPath && (
                            <TimelineGraph
                                label="Camera Complexity"
                                data={sceneData.camera.movement.map(d => ({ time: d.time, intensity: d.complexity, label: d.label }))}
                                color="#f472b6" // Pink
                                height={60}
                                duration={sceneData.duration}
                                currentTime={currentTime}
                            />
                        )}
                        {showEmotionData && sceneData.characters.map(char => (
                             <TimelineGraph
                                key={char.id}
                                label={`${char.name} Emotion`}
                                data={char.emotion}
                                color={char.pathColor}
                                height={60}
                                duration={sceneData.duration}
                                currentTime={currentTime}
                            />
                        ))}
                    </div>
                </div>

                <div className="min-h-0">
                    <AIDirectorChat 
                        messages={chatMessages}
                        isLoading={isChatLoading}
                        error={chatError}
                        sendMessage={sendChatMessage}
                    />
                </div>
            </div>
        </div>
    );
};

export default DataPanel;
