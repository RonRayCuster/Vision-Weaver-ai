
import React from 'react';
import type { SceneData } from '../types';
import { findSegment, interpolate } from '../utils/interpolation';
import TimelineGraph from './TimelineGraph';

interface DataPanelProps {
    sceneData: SceneData;
    currentTime: number;
    showBlocking: boolean;
    setShowBlocking: (show: boolean) => void;
    showCameraPath: boolean;
    setShowCameraPath: (show: boolean) => void;
    showEmotionData: boolean;
    setShowEmotionData: (show: boolean) => void;
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
    setShowEmotionData
}) => {
    const totalEmotionalIntensity = sceneData.characters.reduce((acc, char) => {
        const { start, end } = findSegment(char.emotion, currentTime);
        const intensity = interpolate(start.intensity, end.intensity, start.time, end.time, currentTime);
        return acc + intensity;
    }, 0) / sceneData.characters.length;

    return (
        <div className="bg-gray-800 p-4 rounded-xl flex flex-col overflow-y-auto max-h-[calc(100vh-120px)]">
             <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Data Layers</h2>
             <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <label className="flex items-center space-x-2 p-2 bg-gray-700/50 rounded-md cursor-pointer hover:bg-gray-700 transition-colors">
                    <input type="checkbox" checked={showBlocking} onChange={() => setShowBlocking(!showBlocking)} className="h-4 w-4 accent-sky-500 bg-gray-900 border-gray-600 rounded focus:ring-sky-500" />
                    <span>Blocking Paths</span>
                </label>
                 <label className="flex items-center space-x-2 p-2 bg-gray-700/50 rounded-md cursor-pointer hover:bg-gray-700 transition-colors">
                    <input type="checkbox" checked={showCameraPath} onChange={() => setShowCameraPath(!showCameraPath)} className="h-4 w-4 accent-sky-500 bg-gray-900 border-gray-600 rounded focus:ring-sky-500" />
                    <span>Camera Data</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-gray-700/50 rounded-md cursor-pointer hover:bg-gray-700 col-span-2 transition-colors">
                    <input type="checkbox" checked={showEmotionData} onChange={() => setShowEmotionData(!showEmotionData)} className="h-4 w-4 accent-sky-500 bg-gray-900 border-gray-600 rounded focus:ring-sky-500" />
                    <span>Emotion Curves</span>
                </label>
             </div>

             <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Analysis</h2>
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
    );
};

export default DataPanel;
