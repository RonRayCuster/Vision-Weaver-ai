import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import type { SceneAnalysis, ActorAnalysis, CameraAnalysis, LightAnalysis, PropAnalysis } from '../types';

interface Scene3DViewProps {
    analysis: SceneAnalysis;
}

/**
 * Defines the structure for a selected item in the scene view.
 */
type SelectedItem =
    | { type: 'actor'; data: ActorAnalysis }
    | { type: 'prop'; data: PropAnalysis }
    | { type: 'light'; data: LightAnalysis }
    | { type: 'camera'; data: CameraAnalysis };


/**
 * Determines the visual representation (icon and color) for a prop based on its name.
 * @param propName The name of the prop from the scene analysis.
 * @returns An object containing the icon and color for the prop.
 */
const getPropVisuals = (propName: string): { icon: string; color: string } => {
    const name = propName.toLowerCase();
    if (name.includes('chair') || name.includes('sofa') || name.includes('couch')) {
        return { icon: '🛋️', color: '#a78bfa' }; // Violet
    }
    if (name.includes('table') || name.includes('desk')) {
        return { icon: '🟫', color: '#a78bfa' }; // Violet (using a brown square emoji for shape)
    }
    if (name.includes('lamp') || name.includes('light fixture')) {
        return { icon: '💡', color: '#facc15' }; // Yellow
    }
    if (name.includes('plant') || name.includes('tree')) {
        return { icon: '🌱', color: '#4ade80' }; // Green
    }
    if (name.includes('book')) {
        return { icon: '📖', color: '#60a5fa' }; // Blue
    }
    if (name.includes('window')) {
        return { icon: '🪟', color: '#a5f3fc' }; // Cyan
    }
    if (name.includes('door')) {
        return { icon: '🚪', color: '#f9a8d4' }; // Pink
    }
    if (name.includes('bed')) {
        return { icon: '🛏️', color: '#6ee7b7' }; // Emerald
    }
    // Default fallback for unrecognized props
    return { icon: '📦', color: '#9ca3af' }; // Gray
};

/**
 * An information panel that displays details of the selected scene item.
 */
const InfoPanel: React.FC<{ item: SelectedItem | null; onClose: () => void }> = ({ item, onClose }) => {
    if (!item) return null;

    let title = '';
    const details: { [key: string]: string | number } = {};
    const position =
        'position' in item.data && item.data.position
            ? `(${item.data.position.x.toFixed(0)}, ${item.data.position.y.toFixed(0)}, ${item.data.position.z.toFixed(0)})`
            : 'N/A';

    switch (item.type) {
        case 'actor':
            title = item.data.name;
            details['Type'] = 'Actor';
            details['Emotion'] = item.data.emotion;
            if (item.data.interaction) {
                details['Interaction'] = item.data.interaction;
            }
            details['Position'] = position;
            break;
        case 'prop':
            title = item.data.name;
            details['Type'] = 'Prop';
            details['Position'] = position;
            break;
        case 'light':
            title = item.data.type;
            details['Type'] = 'Light';
            details['Intensity'] = item.data.intensity.toFixed(2);
            details['Position'] = position;
            break;
        case 'camera':
            title = 'Camera';
            details['Type'] = 'Camera';
            details['Position'] = position;
            break;
    }

    return (
        <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm p-3 rounded-lg w-52 shadow-lg border border-gray-700 text-left z-20">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm text-white capitalize truncate pr-2">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none flex-shrink-0">&times;</button>
            </div>
            <ul className="text-xs space-y-1">
                {Object.entries(details).map(([key, value]) => (
                    <li key={key} className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-gray-300 whitespace-nowrap">{key}:</span>
                        <span className="text-gray-400 text-right break-words">{String(value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const Scene3DView: React.FC<Scene3DViewProps> = ({ analysis }) => {
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [showLights, setShowLights] = useState(true);
    const [showCamera, setShowCamera] = useState(true);

    useEffect(() => {
        if (selectedItem) {
            if (!showLights && selectedItem.type === 'light') {
                setSelectedItem(null);
            }
            if (!showCamera && selectedItem.type === 'camera') {
                setSelectedItem(null);
            }
        }
    }, [showLights, showCamera, selectedItem]);


    const handleSelect = (event: React.MouseEvent, item: SelectedItem) => {
        event.stopPropagation();
        setSelectedItem(item);
    };

    const handleDeselect = () => {
        setSelectedItem(null);
    };

    const handleToggle = (event: React.MouseEvent, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        event.stopPropagation();
        setter(prev => !prev);
    };

    return (
        <div className="w-full h-full bg-gray-700/50 rounded-lg p-2 relative overflow-hidden" onClick={handleDeselect}>
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                {[...Array(100)].map((_, i) => (
                    <div key={i} className="border border-gray-600/30"></div>
                ))}
            </div>
            
            <div className="relative w-full h-full">
                {/* Actors */}
                {analysis.actors.map((actor, index) => {
                    const isSelected = selectedItem?.type === 'actor' && selectedItem.data.name === actor.name;
                    return (
                         <div
                            key={`actor-${index}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 z-10"
                            style={{
                                left: `${actor.position.x}%`,
                                top: `${actor.position.y}%`,
                                width: '12px',
                                height: '12px',
                                backgroundColor: '#38bdf8',
                                boxShadow: isSelected ? '0 0 10px 2px #38bdf8' : 'none',
                                transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
                            }}
                            title={`${actor.name} (${actor.emotion})`}
                            onClick={(e) => handleSelect(e, {type: 'actor', data: actor})}
                        >
                            <div className="absolute top-full mt-1 text-xs text-white whitespace-nowrap bg-black/50 px-1 rounded">
                                {actor.name}
                            </div>
                        </div>
                    );
                })}
                
                {/* Camera */}
                 {showCamera && (() => {
                    const isSelected = selectedItem?.type === 'camera';
                    return (
                         <div
                            key="camera"
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 z-10"
                            style={{
                                left: `${analysis.camera.position.x}%`,
                                top: `${analysis.camera.position.y}%`,
                                width: '16px',
                                height: '10px',
                                backgroundColor: '#f472b6',
                                boxShadow: isSelected ? '0 0 10px 2px #f472b6' : 'none',
                                transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
                                border: '1px solid white'
                            }}
                            title={`CAM (x:${analysis.camera.position.x}, y:${analysis.camera.position.y}, z:${analysis.camera.position.z})`}
                            onClick={(e) => handleSelect(e, {type: 'camera', data: analysis.camera})}
                        >
                            <div className="absolute top-full mt-1 text-xs text-white whitespace-nowrap bg-black/50 px-1 rounded">
                                CAM
                           </div>
                        </div>
                    );
                })()}

                {/* Lights */}
                {showLights && analysis.lights.map((light, index) => {
                    const isSelected = selectedItem?.type === 'light' && selectedItem.data === light;
                    return (
                     <div
                        key={`light-${index}`}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-all duration-200"
                        style={{
                            left: `${light.position.x}%`,
                            top: `${light.position.y}%`,
                            width: `${8 + light.intensity * 12}px`,
                            height: `${8 + light.intensity * 12}px`,
                            backgroundColor: `rgba(252, 211, 77, 0.5)`,
                            boxShadow: `0 0 ${light.intensity * 15}px ${light.intensity * 5}px rgba(252, 211, 77, 0.5)${isSelected ? ', 0 0 12px 3px #facc15' : ''}`,
                            transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
                        }}
                        title={`${light.type} (Intensity: ${light.intensity.toFixed(2)})`}
                        onClick={(e) => handleSelect(e, {type: 'light', data: light})}
                    >
                        <div className="absolute top-full mt-1 text-xs text-white whitespace-nowrap bg-black/50 px-1 rounded">
                            {light.type}
                        </div>
                    </div>
                )})}

                {/* Props */}
                {analysis.props.map((prop, index) => {
                    const visuals = getPropVisuals(prop.name);
                    const isSelected = selectedItem?.type === 'prop' && selectedItem.data.name === prop.name;
                    const style = {
                        left: `${prop.position.x}%`,
                        top: `${prop.position.y}%`,
                        backgroundColor: visuals.icon === '📦' ? visuals.color : 'transparent',
                        boxShadow: isSelected ? '0 0 10px 2px #ffffff' : 'none',
                        transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
                    };
                    return (
                        <div
                            key={`prop-${index}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 z-10"
                            style={style}
                            title={`${prop.name} (x:${prop.position.x}, y:${prop.position.y}, z:${prop.position.z})`}
                            onClick={(e) => handleSelect(e, {type: 'prop', data: prop})}
                        >
                            <span className="text-base" role="img" aria-label={prop.name}>{visuals.icon}</span>
                            <div className="absolute top-full mt-1 text-xs text-white whitespace-nowrap bg-black/50 px-1 rounded">
                                {prop.name}
                            </div>
                        </div>
                    );
                })}
            </div>
            <InfoPanel item={selectedItem} onClose={handleDeselect} />
             {/* View Toggles */}
            <div className="absolute bottom-2 left-2 flex gap-2 text-xs z-20">
                <button
                    onClick={(e) => handleToggle(e, setShowLights)}
                    className={`px-2 py-1 rounded transition-colors font-medium flex items-center gap-1 ${
                        showLights
                            ? 'bg-yellow-400/90 text-black'
                            : 'bg-gray-800/80 text-gray-300 hover:bg-gray-800'
                    }`}
                    title={showLights ? 'Hide Lights' : 'Show Lights'}
                >
                    💡 Lights
                </button>
                <button
                    onClick={(e) => handleToggle(e, setShowCamera)}
                    className={`px-2 py-1 rounded transition-colors font-medium flex items-center gap-1 ${
                        showCamera
                            ? 'bg-pink-500/90 text-white'
                            : 'bg-gray-800/80 text-gray-300 hover:bg-gray-800'
                    }`}
                     title={showCamera ? 'Hide Camera' : 'Show Camera'}
                >
                    📷 Camera
                </button>
            </div>
            <p className="absolute bottom-1 right-2 text-xs text-gray-400">Top-Down View (Click items to inspect)</p>
        </div>
    );
};

// Define a reusable shape for Vector3 for cleaner PropTypes.
const Vector3PropTypes = PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    z: PropTypes.number.isRequired,
});

// Define PropTypes for the component to ensure runtime type safety and provide documentation.
Scene3DView.propTypes = {
    /**
     * The structured scene analysis data generated by the AI.
     * This object contains all the elements to be rendered in the 3D view.
     */
    analysis: PropTypes.shape({
        actors: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            position: Vector3PropTypes.isRequired,
            emotion: PropTypes.string.isRequired,
            interaction: PropTypes.string, // Can be string or null
        })).isRequired,
        camera: PropTypes.shape({
            position: Vector3PropTypes.isRequired,
        }).isRequired,
        lights: PropTypes.arrayOf(PropTypes.shape({
            type: PropTypes.string.isRequired,
            position: Vector3PropTypes.isRequired,
            intensity: PropTypes.number.isRequired,
        })).isRequired,
        props: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            position: Vector3PropTypes.isRequired,
        })).isRequired,
        environmentDescription: PropTypes.string.isRequired,
        overallMood: PropTypes.string.isRequired,
    }).isRequired,
};

export default Scene3DView;
