import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import type { SceneAnalysis, ActorAnalysis, CameraAnalysis, LightAnalysis, PropAnalysis, DynamicFeedback, SceneData, BlockingKeyframe, EmotionKeyframe } from '../types';
import { colors } from '../colors';
import { ExportIcon } from './Icons';
import PerspectiveView from './PerspectiveView';
import { getDynamicFeedbackForChange } from '../services/geminiService';
import { findSegment, interpolate } from '../utils/interpolation';

interface Scene3DViewProps {
    analysis?: SceneAnalysis;
}

export type SelectedItem =
    | { type: 'actor'; data: ActorAnalysis }
    | { type: 'prop'; data: PropAnalysis }
    | { type: 'light'; data: LightAnalysis }
    | { type: 'camera'; data: CameraAnalysis };

type DraggedItem = 
    | { type: 'prop'; index: number }
    | { type: 'light'; index: number }
    | { type: 'actor'; index: number }
    | { type: 'camera' };

const MAX_LIGHTS = 25;
const MAX_PROPS = 25;

const getPropVisuals = (propName: string): { icon: string; color: string } => {
    const name = propName.toLowerCase();
    if (name.includes('chair') || name.includes('sofa') || name.includes('couch')) return { icon: '🛋️', color: colors.accent };
    if (name.includes('table') || name.includes('desk')) return { icon: '🟫', color: colors.accent };
    if (name.includes('lamp') || name.includes('light fixture')) return { icon: '💡', color: colors.warning };
    if (name.includes('plant') || name.includes('tree')) return { icon: '🌱', color: colors.success };
    if (name.includes('book')) return { icon: '📖', color: colors.accent };
    if (name.includes('window')) return { icon: '🪟', color: colors.accent };
    if (name.includes('door')) return { icon: '🚪', color: colors.error };
    if (name.includes('bed')) return { icon: '🛏️', color: colors.success };
    return { icon: '📦', color: colors['text-secondary'] };
};

const InfoPanel: React.FC<{ item: SelectedItem | null; onClose: () => void }> = ({ item, onClose }) => {
    if (!item) return null;

    const [title, setTitle] = useState('');
    const [details, setDetails] = useState<Record<string, string | number>>({});

    useEffect(() => {
        let newTitle = '';
        const newDetails: Record<string, string | number> = {};
        const position = 'position' in item.data && item.data.position
            ? `(${item.data.position.x.toFixed(0)}, ${item.data.position.y.toFixed(0)}, ${item.data.position.z.toFixed(0)})`
            : 'N/A';
        
        switch (item.type) {
            case 'actor':
                newTitle = item.data.name;
                newDetails['Type'] = 'Actor';
                newDetails['Emotion'] = item.data.emotion;
                if (item.data.interaction) newDetails['Interaction'] = item.data.interaction;
                newDetails['Position'] = position;
                break;
            case 'prop':
                newTitle = item.data.name;
                newDetails['Type'] = 'Prop';
                newDetails['Position'] = position;
                break;
            case 'light':
                newTitle = item.data.type;
                newDetails['Type'] = 'Light';
                newDetails['Intensity'] = item.data.intensity.toFixed(2);
                newDetails['Position'] = position;
                break;
            case 'camera':
                newTitle = 'Camera';
                newDetails['Type'] = 'Camera';
                newDetails['Position'] = position;
                break;
        }
        setTitle(newTitle);
        setDetails(newDetails);
    }, [item]);


    return (
        <div className="absolute top-2 right-2 bg-surface/80 backdrop-blur-sm p-3 rounded-lg w-52 shadow-lg border border-border text-left z-20 animate-fade-in-right">
             <style>{`
                @keyframes fade-in-right {
                    from { opacity: 0; transform: translateX(10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-right { animation: fade-in-right 0.3s ease-out forwards; }
            `}</style>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm text-text-primary capitalize truncate pr-2">{title}</h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-primary/50 focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label="Close panel"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <ul className="text-xs space-y-1">
                {Object.entries(details).map(([key, value]) => (
                    <li key={key} className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-text-secondary whitespace-nowrap">{key}:</span>
                        <span className="text-text-primary text-right break-words">{String(value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const DynamicFeedbackPanel: React.FC<{ feedback: DynamicFeedback | null; isLoading: boolean; onClose: () => void }> = ({ feedback, isLoading, onClose }) => {
    if (!feedback && !isLoading) return null;

    return (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-sm p-4 rounded-lg w-[95%] max-w-md shadow-2xl border border-border text-left z-30 animate-fade-in-up">
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translate(-50%, 10px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm text-accent flex items-center gap-2">
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zM8.293 6.293a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414L10 8.414l-.293.293a1 1 0 01-1.414-1.414l2-2a1 1 0 010-1.414zM10 16a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                    </svg>
                    Live AI Cinematic Feedback
                </h3>
                <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-primary/50 focus:outline-none" aria-label="Close feedback"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            {isLoading ? (
                 <p className="text-sm text-text-secondary italic">Analyzing cinematic impact...</p>
            ) : feedback && (
                 <div className="text-xs space-y-2">
                    <div>
                        <h4 className="font-semibold text-text-secondary">Impact:</h4>
                        <p className="text-text-primary">{feedback.impact}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-secondary">Suggestion:</h4>
                        <p className="text-text-primary">{feedback.suggestion}</p>
                    </div>
                </div>
            )}
        </div>
    )
};


const Scene3DView: React.FC<Scene3DViewProps> = ({ analysis }) => {
    
    const [localAnalysis, setLocalAnalysis] = useState<SceneAnalysis | undefined>(analysis);
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
    const [showLights, setShowLights] = useState(true);
    const [showCamera, setShowCamera] = useState(true);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
    const [dynamicFeedback, setDynamicFeedback] = useState<DynamicFeedback | null>(null);
    const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const feedbackRequestTimer = useRef<number | null>(null);
    
    useEffect(() => {
        setLocalAnalysis(analysis);
    }, [analysis]);

    useEffect(() => {
        if (selectedItem) {
            if (!showLights && selectedItem.type === 'light') setSelectedItem(null);
            if (!showCamera && selectedItem.type === 'camera') setSelectedItem(null);
        }
    }, [showLights, showCamera, selectedItem]);

    const triggerFeedback = useCallback((updatedAnalysis: SceneAnalysis, changedItem: SelectedItem) => {
        if (feedbackRequestTimer.current) {
            clearTimeout(feedbackRequestTimer.current);
        }
        feedbackRequestTimer.current = window.setTimeout(async () => {
            setIsFetchingFeedback(true);
            setDynamicFeedback(null);
            try {
                const changedObjectName = 'name' in changedItem.data ? changedItem.data.name : changedItem.type;
                const feedback = await getDynamicFeedbackForChange(updatedAnalysis, changedObjectName);
                setDynamicFeedback(feedback);
            } catch (e) {
                console.error("Failed to get dynamic feedback:", e);
                setDynamicFeedback({
                    impact: "Could not analyze the change.",
                    suggestion: "There was an error communicating with the AI. Please try again."
                });
            } finally {
                setIsFetchingFeedback(false);
            }
        }, 500); // Debounce to prevent too many API calls
    }, []);

    const handleItemMoved = useCallback((updatedAnalysis: SceneAnalysis, movedItem: SelectedItem) => {
        setLocalAnalysis(updatedAnalysis);
        triggerFeedback(updatedAnalysis, movedItem);
    }, [triggerFeedback]);


    const handleSelect = (event: React.MouseEvent | null, item: SelectedItem) => {
        event?.stopPropagation();
        setSelectedItem(item);
    };

    const handleDeselect = () => {
        setSelectedItem(null);
        setDynamicFeedback(null);
    };

    const handleToggle = (event: React.MouseEvent, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        event.stopPropagation();
        setter(prev => !prev);
    };
    
    const handleMouseDown = (e: React.MouseEvent, item: DraggedItem) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggedItem(item);
        setDynamicFeedback(null);
    };

    const handleMouseUp = () => {
        if (!draggedItem || !localAnalysis) return;

        let movedItem: SelectedItem | null = null;
        if (draggedItem.type === 'camera') {
            movedItem = { type: 'camera', data: localAnalysis.camera };
        } else if (draggedItem.type === 'light') {
            movedItem = { type: 'light', data: localAnalysis.lights[draggedItem.index] };
        } else if (draggedItem.type === 'prop') {
            movedItem = { type: 'prop', data: localAnalysis.props[draggedItem.index] };
        } else if (draggedItem.type === 'actor') {
            movedItem = { type: 'actor', data: localAnalysis.actors[draggedItem.index] };
        }

        if (movedItem) {
            triggerFeedback(localAnalysis, movedItem);
        }
        setDraggedItem(null);
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (viewMode !== '2d' || !draggedItem || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        setLocalAnalysis(prev => {
            if (!prev) return prev;
            const newAnalysis = JSON.parse(JSON.stringify(prev));
            if (draggedItem.type === 'light' && newAnalysis.lights[draggedItem.index]) {
                newAnalysis.lights[draggedItem.index].position.x = x;
                newAnalysis.lights[draggedItem.index].position.y = y;
            } else if (draggedItem.type === 'prop' && newAnalysis.props[draggedItem.index]) {
                newAnalysis.props[draggedItem.index].position.x = x;
                newAnalysis.props[draggedItem.index].position.y = y;
            } else if (draggedItem.type === 'actor' && newAnalysis.actors[draggedItem.index]) {
                newAnalysis.actors[draggedItem.index].position.x = x;
                newAnalysis.actors[draggedItem.index].position.y = y;
            } else if (draggedItem.type === 'camera' && newAnalysis.camera) {
                newAnalysis.camera.position.x = x;
                newAnalysis.camera.position.y = y;
            }
            return newAnalysis;
        });
    };

    const generateSvgString = (
        currentAnalysis: SceneAnalysis,
        lightsVisible: boolean,
        cameraVisible: boolean
    ): string => {
        let svg = `<svg width="800" height="800" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="background-color: ${colors.primary}; font-family: 'Satoshi', sans-serif;">`;
        
        svg += '<g id="grid">';
        for (let i = 0; i <= 10; i++) {
            const pos = i * 10;
            svg += `<line x1="${pos}" y1="0" x2="${pos}" y2="100" stroke="${colors.accent}" stroke-opacity="0.1" />`;
            svg += `<line x1="0" y1="${pos}" x2="100" y2="${pos}" stroke="${colors.accent}" stroke-opacity="0.1" />`;
        }
        svg += '</g>';

        if (lightsVisible) {
            currentAnalysis.lights.slice(0, MAX_LIGHTS).forEach(light => {
                const radius = 1.5 + light.intensity * 4.5;
                svg += `<circle cx="${light.position.x}" cy="${light.position.y}" r="${radius}" fill="${colors.warning}" opacity="0.5" />`;
            });
        }

        currentAnalysis.props.slice(0, MAX_PROPS).forEach(prop => {
            const visuals = getPropVisuals(prop.name);
            svg += `<text x="${prop.position.x}" y="${prop.position.y}" font-size="5" dominant-baseline="middle" text-anchor="middle">${visuals.icon}</text>`;
        });

        currentAnalysis.actors.forEach(actor => {
            svg += `<g transform="translate(${actor.position.x}, ${actor.position.y})">`;
            svg += `<circle cx="0" cy="0" r="3" fill="${colors.accent}" />`;
            svg += `<text x="0" y="5" font-size="2.5" fill="${colors['text-primary']}" text-anchor="middle" dominant-baseline="hanging">${actor.name}</text>`;
            svg += '</g>';
        });

        if (cameraVisible && currentAnalysis.camera) {
            const cam = currentAnalysis.camera;
            svg += `<g transform="translate(${cam.position.x}, ${cam.position.y})">`;
            svg += `<rect x="-2" y="-1.25" width="4" height="2.5" fill="${colors.error}" stroke="${colors['text-primary']}" stroke-width="0.3" rx="0.2" />`;
            svg += `<text x="0" y="4" font-size="2" fill="${colors['text-primary']}" text-anchor="middle" dominant-baseline="hanging">CAM</text>`;
            svg += `</g>`;
        }
        
        svg += '</svg>';
        return svg;
    };

    const handleExportSvg = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!localAnalysis) return;
        const svgData = generateSvgString(localAnalysis, showLights, showCamera);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'visionweaver-scene-layout.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
    };

    const handleExportJson = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!localAnalysis) return;
        const jsonData = JSON.stringify(localAnalysis, null, 2); // Pretty print JSON
        const jsonBlob = new Blob([jsonData], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = jsonUrl;
        downloadLink.download = 'visionweaver-scene-export.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(jsonUrl);
    };

    const cursorClass = viewMode === '2d' && draggedItem ? 'cursor-grabbing' : 'cursor-default';
    if (!localAnalysis) return <div className="w-full h-full bg-primary rounded-lg flex items-center justify-center text-text-secondary">Analyze the scene to see the 3D View</div>;


    return (
        <div 
            className={`w-full h-full bg-primary rounded-lg p-2 relative overflow-hidden ${cursorClass}`} 
            onClick={handleDeselect}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={containerRef}
        >
            <style>{`
                @keyframes pulse-halo {
                    0%, 100% { box-shadow: 0 0 0 2px ${colors['text-primary']}, 0 0 15px 5px var(--glow-color); }
                    50% { box-shadow: 0 0 0 3px ${colors['text-primary']}, 0 0 20px 8px var(--glow-color); }
                }
                .pulse-animation { animation: pulse-halo 2s infinite ease-in-out; }
            `}</style>
           
            {viewMode === '2d' && (
                <>
                     <div className="absolute inset-0 bg-radial-gradient pointer-events-none"></div>
                     <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none">
                         {[...Array(100)].map((_, i) => <div key={i} className="border border-accent/10"></div>)}
                     </div>
                     <style>{`
                        .bg-radial-gradient {
                            background: radial-gradient(circle, transparent 0%, ${colors.primary} 70%);
                        }
                     `}</style>
                    
                    <div className="relative w-full h-full">
                        {localAnalysis.actors.map((actor, index) => {
                            const isSelected = selectedItem?.type === 'actor' && selectedItem.data.name === actor.name;
                            const isDragged = draggedItem?.type === 'actor' && draggedItem.index === index;
                            const cursor = (isDragged ? 'cursor-grabbing' : 'cursor-grab');
                            return (
                                 <div
                                    key={`actor-${index}`}
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${cursor} ${isSelected ? 'pulse-animation' : ''}`}
                                    style={{
                                        left: `${actor.position.x}%`,
                                        top: `${actor.position.y}%`,
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: colors.accent,
                                        '--glow-color': colors.accent,
                                        transform: `translate(-50%, -50%) scale(${isSelected || isDragged ? 1.3 : 1})`,
                                        opacity: isDragged ? 0.75 : 1,
                                        zIndex: isDragged ? 20 : 10,
                                    } as React.CSSProperties}
                                    title={`${actor.name} (${actor.emotion})`}
                                    onClick={(e) => handleSelect(e, {type: 'actor', data: actor})}
                                    onMouseDown={(e) => handleMouseDown(e, { type: 'actor', index })}
                                >
                                    <div className="absolute top-full mt-1.5 text-xs text-text-primary whitespace-nowrap bg-primary/70 px-1.5 py-0.5 rounded pointer-events-none shadow-md">
                                        {actor.name}
                                    </div>
                                </div>
                            );
                        })}
                        
                         {showCamera && localAnalysis.camera && (() => {
                            const isSelected = selectedItem?.type === 'camera';
                            const isDragged = draggedItem?.type === 'camera';
                            const cursor = (isDragged ? 'cursor-grabbing' : 'cursor-grab');
                            return (
                                 <div
                                    key="camera"
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md flex items-center justify-center transition-all duration-200 z-10 ${cursor} ${isSelected ? 'pulse-animation' : ''}`}
                                    style={{
                                        left: `${localAnalysis.camera.position.x}%`,
                                        top: `${localAnalysis.camera.position.y}%`,
                                        width: '16px',
                                        height: '10px',
                                        backgroundColor: colors.error,
                                        '--glow-color': colors.error,
                                        transform: `translate(-50%, -50%) scale(${isSelected || isDragged ? 1.3 : 1})`,
                                        opacity: isDragged ? 0.75 : 1,
                                        zIndex: isDragged ? 20 : 10,
                                        border: `1.5px solid ${colors['text-primary']}`
                                    } as React.CSSProperties}
                                    title={`CAM (x:${localAnalysis.camera.position.x.toFixed(0)}, y:${localAnalysis.camera.position.y.toFixed(0)}, z:${localAnalysis.camera.position.z.toFixed(0)})`}
                                    onClick={(e) => handleSelect(e, {type: 'camera', data: localAnalysis.camera})}
                                    onMouseDown={(e) => handleMouseDown(e, { type: 'camera' })}
                                >
                                    <div className="absolute top-full mt-1.5 text-xs text-text-primary whitespace-nowrap bg-primary/70 px-1.5 py-0.5 rounded pointer-events-none shadow-md">
                                        CAM
                                   </div>
                                </div>
                            );
                        })()}

                        {showLights && localAnalysis.lights.slice(0, MAX_LIGHTS).map((light, index) => {
                            const isSelected = selectedItem?.type === 'light' && selectedItem.data === light;
                            const isDragged = draggedItem?.type === 'light' && draggedItem.index === index;
                            const cursor = (isDragged ? 'cursor-grabbing' : 'cursor-grab');
                            const lightBaseShadow = `0 0 ${light.intensity * 25}px ${light.intensity * 8}px ${colors.warning}99`;

                            return (
                             <div
                                key={`light-${index}`}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${cursor} ${isSelected ? 'pulse-animation' : ''}`}
                                style={{
                                    left: `${light.position.x}%`,
                                    top: `${light.position.y}%`,
                                    width: `${6 + light.intensity * 18}px`,
                                    height: `${6 + light.intensity * 18}px`,
                                    backgroundColor: `${colors.warning}80`,
                                    boxShadow: isSelected ? undefined : lightBaseShadow,
                                    '--glow-color': colors.warning,
                                    transform: `translate(-50%, -50%) scale(${isSelected || isDragged ? 1.3 : 1})`,
                                    opacity: isDragged ? 0.75 : 1,
                                    zIndex: isDragged ? 20 : 10,
                                } as React.CSSProperties}
                                title={`${light.type} (Intensity: ${light.intensity.toFixed(2)})`}
                                onClick={(e) => handleSelect(e, {type: 'light', data: light})}
                                onMouseDown={(e) => handleMouseDown(e, { type: 'light', index })}
                            ></div>
                        )})}

                        {localAnalysis.props.slice(0, MAX_PROPS).map((prop, index) => {
                            const visuals = getPropVisuals(prop.name);
                            const isSelected = selectedItem?.type === 'prop' && selectedItem.data.name === prop.name;
                            const isDragged = draggedItem?.type === 'prop' && draggedItem.index === index;
                            const cursor = (isDragged ? 'cursor-grabbing' : 'cursor-grab');
                            const glowColor = visuals.color !== colors['text-secondary'] ? visuals.color : colors['text-primary'];
                            
                            return (
                                <div
                                    key={`prop-${index}`}
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 z-10 ${cursor} ${isSelected ? 'pulse-animation' : ''}`}
                                    style={{
                                        left: `${prop.position.x}%`,
                                        top: `${prop.position.y}%`,
                                        backgroundColor: visuals.icon === '📦' ? visuals.color : 'transparent',
                                        '--glow-color': glowColor,
                                        transform: `translate(-50%, -50%) scale(${isSelected || isDragged ? 1.3 : 1})`,
                                        opacity: isDragged ? 0.75 : 1,
                                        zIndex: isDragged ? 20 : 10,
                                    } as React.CSSProperties}
                                    title={`${prop.name} (x:${prop.position.x}, y:${prop.position.y}, z:${prop.position.z})`}
                                    onClick={(e) => handleSelect(e, {type: 'prop', data: prop})}
                                    onMouseDown={(e) => handleMouseDown(e, { type: 'prop', index })}
                                >
                                    <span className="text-base pointer-events-none" role="img" aria-label={prop.name}>{visuals.icon}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {viewMode === '3d' && (
                <PerspectiveView
                    analysis={localAnalysis}
                    selectedItem={selectedItem}
                    onSelect={(item) => setSelectedItem(item)}
                    showLights={showLights}
                    showCamera={showCamera}
                    onItemMoved={handleItemMoved}
                    isPlaybackMode={false}
                />
            )}
            
            <InfoPanel item={selectedItem} onClose={handleDeselect} />
            <DynamicFeedbackPanel feedback={dynamicFeedback} isLoading={isFetchingFeedback} onClose={() => setDynamicFeedback(null)} />

            <div className="absolute bottom-2 left-2 flex flex-col gap-2 z-20">
                <div className="flex gap-1 bg-surface/80 p-1 rounded-lg border border-border text-xs shadow-md">
                    <button
                        onClick={() => setViewMode('2d')}
                        className={`px-3 py-1 rounded-md transition-all font-semibold ${
                            viewMode === '2d' ? 'bg-accent text-text-primary' : 'text-text-secondary hover:bg-primary'
                        }`}
                        title="Switch to 2D Top-Down View"
                    >
                        2D
                    </button>
                    <button
                        onClick={() => setViewMode('3d')}
                         className={`px-3 py-1 rounded-md transition-all font-semibold ${
                            viewMode === '3d' ? 'bg-accent text-text-primary' : 'text-text-secondary hover:bg-primary'
                        }`}
                        title="Switch to 3D Perspective View"
                    >
                        3D
                    </button>
                </div>
                 <div className="flex gap-2 text-xs">
                    <button
                        onClick={(e) => handleToggle(e, setShowLights)}
                        className={`px-2.5 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 shadow-md border ${
                            showLights
                                ? 'bg-warning/90 text-primary border-warning'
                                : 'bg-surface/80 text-text-secondary hover:bg-surface border-border'
                        }`}
                        title={showLights ? 'Hide Lights' : 'Show Lights'}
                    >
                        💡 Lights
                    </button>
                    <button
                        onClick={(e) => handleToggle(e, setShowCamera)}
                        className={`px-2.5 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 shadow-md border ${
                            showCamera
                                ? 'bg-error/90 text-text-primary border-error'
                                : 'bg-surface/80 text-text-secondary hover:bg-surface border-border'
                        }`}
                         title={showCamera ? 'Hide Camera' : 'Show Camera'}
                    >
                        📷 Camera
                    </button>
                    {viewMode === '2d' && (
                        <button
                            onClick={handleExportSvg}
                            className="px-2.5 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 shadow-md border bg-surface/80 text-text-secondary hover:bg-surface border-border"
                            title="Export 2D Layout as SVG"
                        >
                           <ExportIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={handleExportJson}
                        className="px-2.5 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 shadow-md border bg-surface/80 text-text-secondary hover:bg-surface border-border"
                        title="Export Scene Data as JSON"
                    >
                       <ExportIcon className="w-3.5 h-3.5" />
                       <span className="font-semibold text-xs">JSON</span>
                    </button>
                </div>
            </div>
            <p className="absolute bottom-1 right-2 text-[10px] text-text-secondary/50 pointer-events-none">
                {viewMode === '2d'
                    ? 'Top-Down View: Drag to move elements' 
                    : '3D View: Drag to Rotate | Scroll to Zoom | Right-drag to Pan'}
            </p>
        </div>
    );
};

Scene3DView.propTypes = {
    analysis: PropTypes.object,
};

export default Scene3DView;