import React, { useState } from 'react';
import type { SceneData, EmotionKeyframe, SceneAnalysis, CinematicAnalysis, SceneReconstruction, EditedImage, GeneratedVideo, StoryboardPanel, SoundscapeAnalysis } from '../types';
import { findSegment, interpolate } from '../utils/interpolation';
import TimelineGraph from './TimelineGraph';
import Scene3DView from './Scene3DView';
import PointCloudViewer from './PointCloudViewer';
import { ToggleSwitch } from './ToggleSwitch';
import { getEmotionColor } from '../colors';
import { AnalysisIcon, CinematicIcon, CloseIcon, EmotionArcIcon, ImageEditorIcon, ReconstructionIcon, SceneLayoutIcon, ShotGeneratorIcon, TimelineIcon, GenerativeIcon, StoryboardIcon, SoundscapeIcon } from './Icons';


interface DataPanelProps {
    sceneData: SceneData;
    currentTime: number;
    showBlocking: boolean;
    setShowBlocking: (show: boolean) => void;
    showCameraPath: boolean;
    setShowCameraPath: (show: boolean) => void;
    showEmotionData: boolean;
    setShowEmotionData: (show: boolean) => void;
    showDroneView: boolean;
    setShowDroneView: (show: boolean) => void;
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
    onEditFrame: (prompt: string) => void;
    isEditingImage: boolean;
    editedImage: EditedImage | null;
    editImageError: string | null;
    onGenerateVideo: (prompt: string) => void;
    isGeneratingVideo: boolean;
    generatedVideo: GeneratedVideo | null;
    videoGenerationError: string | null;
    videoGenerationProgress: string | null;
    onAnalyzeEmotions: () => void;
    isAnalyzingEmotions: boolean;
    emotionAnalysisProgress: string | null;
    emotionAnalysisError: string | null;
    onGenerateStoryboard: (prompt: string) => void;
    isGeneratingStoryboard: boolean;
    storyboardPanels: StoryboardPanel[] | null;
    storyboardError: string | null;
    onGenerateSoundscape: (prompt: string) => void;
    isGeneratingSoundscape: boolean;
    soundscape: SoundscapeAnalysis | null;
    soundscapeError: string | null;
    onSeek: (time: number) => void;
    onClose: () => void;
}

interface AccordionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

const Accordion: React.FC<AccordionProps> = ({ title, icon, children, isOpen, onToggle }) => {
    return (
        <div className="border-b border-border last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <span className="text-accent w-5 h-5">{icon}</span>
                    <h3 className="text-md font-bold text-text-primary">{title}</h3>
                </div>
                <svg
                    className={`w-5 h-5 transform transition-transform text-text-secondary ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    <div className="p-4 pt-2">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShimmerBox: React.FC<{ text: string }> = ({ text }) => (
     <div className="relative w-full h-full flex items-center justify-center bg-primary/50 rounded-lg overflow-hidden">
        <div className="absolute inset-0 w-full h-full bg-border -translate-x-full animate-[shimmer_2s_infinite]"></div>
         <p className="text-text-secondary z-10">{text}</p>
         <style>{`
            @keyframes shimmer {
                100% { transform: translateX(100%); }
            }
         `}</style>
     </div>
);

const DataPanel: React.FC<DataPanelProps> = (props) => {
    const {
        sceneData, currentTime, showBlocking, setShowBlocking,
        showCameraPath, setShowCameraPath, showEmotionData, setShowEmotionData,
        showDroneView, setShowDroneView,
        onAnalyzeScene, isAnalyzing, sceneAnalysis, analysisError, analysisProgress,
        onAnalyzeCinematics, isAnalyzingCinematics, cinematicAnalysis, cinematicAnalysisError,
        onReconstructScene, isReconstructing, sceneReconstruction, reconstructionError, reconstructionProgress,
        onEditFrame, isEditingImage, editedImage, editImageError,
        onGenerateVideo, isGeneratingVideo, generatedVideo, videoGenerationError, videoGenerationProgress,
        onAnalyzeEmotions, isAnalyzingEmotions, emotionAnalysisProgress, emotionAnalysisError,
        onGenerateStoryboard, isGeneratingStoryboard, storyboardPanels, storyboardError,
        onGenerateSoundscape, isGeneratingSoundscape, soundscape, soundscapeError,
        onSeek,
        onClose,
    } = props;

    const [openAccordion, setOpenAccordion] = useState<string | null>('deconstruction');
    const [editPrompt, setEditPrompt] = useState<string>('Make the scene look like it was shot on vintage film.');
    const [videoPrompt, setVideoPrompt] = useState<string>('A close-up shot of the hero, looking determined, with dramatic lighting.');
    const [storyboardPrompt, setStoryboardPrompt] = useState<string>('A tense close-up of the Hero realizing the truth.');
    const [soundscapePrompt, setSoundscapePrompt] = useState<string>('An eerie, abandoned spaceship bridge. Distant, humming machinery and the faint sound of cosmic radiation.');

    const totalEmotionalIntensity = sceneData.characters.reduce((acc, char) => {
        // Handle potentially empty emotion array from new analysis
        if (char.emotion.length === 0) return acc;
        const { start, end } = findSegment<EmotionKeyframe>(char.emotion, currentTime);
        const intensity = interpolate(start.intensity, end.intensity, start.time, end.time, currentTime);
        return acc + intensity;
    }, 0) / (sceneData.characters.length || 1);
    
    const anyAnalysisRunning = isAnalyzing || isAnalyzingCinematics || isReconstructing || isEditingImage || isGeneratingVideo || isAnalyzingEmotions || isGeneratingStoryboard || isGeneratingSoundscape;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="relative flex-grow flex flex-col p-4 overflow-y-auto">
                 <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 z-50 p-2 rounded-full bg-primary/50 text-text-secondary hover:text-text-primary xl:hidden"
                    aria-label="Close panel"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3 text-text-primary border-b border-border pb-3 mb-2">
                    <AnalysisIcon className="w-6 h-6 text-accent" />
                    <h2 className="text-xl font-bold">Analysis & Visualization</h2>
                </div>
                
                <div className="border-t border-border mt-2">
                    <Accordion 
                        title="Scene Deconstruction" 
                        icon={<AnalysisIcon className="w-5 h-5" />} 
                        isOpen={openAccordion === 'deconstruction'} 
                        onToggle={() => setOpenAccordion(openAccordion === 'deconstruction' ? null : 'deconstruction')}
                    >
                        <div className="space-y-6">
                             {/* AI Scene Layout */}
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                                    <SceneLayoutIcon className="w-4 h-4 text-text-secondary" />
                                    AI Scene Layout
                                </h4>
                                <div className="pl-6 space-y-3">
                                    <button
                                        onClick={onAnalyzeScene}
                                        disabled={anyAnalysisRunning}
                                        className="w-full bg-accent text-text-primary p-2 rounded-md font-semibold hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2"
                                        title={'Analyze the current scene layout'}
                                    >
                                        {isAnalyzing && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                        <span>{isAnalyzing ? (analysisProgress || 'Analyzing...') : 'Analyze Scene Layout'}</span>
                                    </button>
                                    <div className="p-2 border border-border rounded-md bg-primary/50">
                                        <ToggleSwitch label="Show Drone View" isEnabled={showDroneView} onToggle={setShowDroneView} />
                                    </div>
                                    <div className="h-64 flex items-center justify-center">
                                        {showDroneView ? (
                                            <>
                                                {isAnalyzing && <ShimmerBox text={analysisProgress || 'AI is analyzing...'}/>}
                                                {analysisError && <p className="text-error text-center p-4">{analysisError}</p>}
                                                {sceneAnalysis && <Scene3DView analysis={sceneAnalysis} />}
                                                {!isAnalyzing && !analysisError && !sceneAnalysis && <p className="text-text-secondary text-sm">Analyze scene to generate 3D view</p>}
                                            </>
                                        ) : (
                                            <p className="text-text-secondary text-sm italic">Drone view is hidden.</p>
                                        )}
                                    </div>
                                    {sceneAnalysis && !isAnalyzing && showDroneView && (
                                        <div className="space-y-3 text-sm pt-2">
                                            <InfoBlock title="Environment" content={sceneAnalysis.environmentDescription} />
                                            <InfoBlock title="Overall Mood" content={sceneAnalysis.overallMood} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AI Emotional Arc */}
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                                    <EmotionArcIcon className="w-4 h-4 text-text-secondary" />
                                    AI Emotional Arc
                                </h4>
                                <div className="pl-6 space-y-3">
                                     <p className="text-xs text-text-secondary leading-relaxed">
                                        Analyze actor performance to generate a nuanced, second-by-second emotional curve.
                                    </p>
                                    <button
                                        onClick={onAnalyzeEmotions}
                                        disabled={anyAnalysisRunning}
                                        className="w-full bg-accent text-text-primary p-2 rounded-md font-semibold hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2"
                                        title={'Generate detailed emotional curves'}
                                    >
                                        {isAnalyzingEmotions && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                        <span>{isAnalyzingEmotions ? (emotionAnalysisProgress || 'Analyzing...') : 'Generate Emotional Arcs'}</span>
                                    </button>
                                    {isAnalyzingEmotions && <ShimmerBox text={emotionAnalysisProgress || 'AI is analyzing performance...'}/>}
                                    {emotionAnalysisError && <p className="text-error text-center p-2">{emotionAnalysisError}</p>}
                                </div>
                            </div>
                            
                             {/* AI Cinematic Analysis */}
                             <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                                    <CinematicIcon className="w-4 h-4 text-text-secondary" />
                                    AI Cinematic Analysis
                                </h4>
                                <div className="pl-6 space-y-3">
                                    <button
                                        onClick={onAnalyzeCinematics}
                                        disabled={anyAnalysisRunning}
                                        className="w-full bg-accent text-text-primary p-2 rounded-md font-semibold hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2"
                                        title={'Analyze the current frame cinematics'}
                                    >
                                        {isAnalyzingCinematics && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                        <span>{isAnalyzingCinematics ? 'Analyzing...' : 'Analyze Cinematics'}</span>
                                    </button>
                                    {isAnalyzingCinematics && <ShimmerBox text="Analyzing cinematics..." />}
                                    {cinematicAnalysisError && <p className="text-error text-center p-2">{cinematicAnalysisError}</p>}
                                    {cinematicAnalysis && !isAnalyzingCinematics && (
                                        <div className="space-y-3 text-sm">
                                            <InfoBlock title="Composition" content={cinematicAnalysis.shotComposition} />
                                            <InfoBlock title="Color Palette" content={cinematicAnalysis.colorPalette} />
                                            <InfoBlock title="Camera Work" content={cinematicAnalysis.cameraWork} />
                                        </div>
                                    )}
                                </div>
                             </div>

                             {/* AI 3D Reconstruction */}
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                                    <ReconstructionIcon className="w-4 h-4 text-text-secondary" />
                                    AI 3D Reconstruction
                                </h4>
                                <div className="pl-6 space-y-3">
                                    <button
                                        onClick={onReconstructScene}
                                        disabled={anyAnalysisRunning}
                                        className="w-full bg-secondary-accent text-primary p-2 rounded-md font-semibold hover:bg-secondary-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2"
                                        title={'Reconstruct the scene in 3D'}
                                    >
                                        {isReconstructing && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                        <span>{isReconstructing ? (reconstructionProgress || 'Reconstructing...') : 'Reconstruct 3D Scene'}</span>
                                    </button>
                                    <div className="h-64 flex items-center justify-center">
                                        {isReconstructing && <ShimmerBox text={reconstructionProgress || 'AI is reconstructing...'}/>}
                                        {reconstructionError && <p className="text-error text-center p-4">{reconstructionError}</p>}
                                        {sceneReconstruction && <PointCloudViewer reconstruction={sceneReconstruction} />}
                                        {!isReconstructing && !reconstructionError && !sceneReconstruction && <p className="text-text-secondary text-sm">Reconstruct scene to generate point cloud</p>}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </Accordion>

                    <Accordion 
                        title="Generative Tools" 
                        icon={<GenerativeIcon />} 
                        isOpen={openAccordion === 'generative'} 
                        onToggle={() => setOpenAccordion(openAccordion === 'generative' ? null : 'generative')}
                    >
                         <div className="space-y-6">
                              {/* AI Image Editor */}
                             <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                                    <ImageEditorIcon className="w-4 h-4 text-text-secondary" />
                                    AI Image Editor (Nano Banana)
                                </h4>
                                <div className="pl-6 space-y-3">
                                    <textarea
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        placeholder="Describe your edit..."
                                        rows={3}
                                        className="w-full bg-primary p-2 rounded-md text-sm placeholder-text-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                                        disabled={anyAnalysisRunning}
                                    />
                                    <button
                                        onClick={() => onEditFrame(editPrompt)}
                                        disabled={anyAnalysisRunning || !editPrompt.trim()}
                                        className="w-full bg-accent text-text-primary p-2 rounded-md font-semibold hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2"
                                        title={'Edit the current video frame'}
                                    >
                                        {isEditingImage && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                        <span>{isEditingImage ? 'Editing Frame...' : 'Generate Edit'}</span>
                                    </button>
                                    <div className="h-48 flex items-center justify-center">
                                        {isEditingImage && <ShimmerBox text="AI is editing your frame..."/>}
                                        {editImageError && <p className="text-error text-center p-4">{editImageError}</p>}
                                        {editedImage && (
                                            <div className="w-full h-full flex flex-col items-center gap-2">
                                                <img src={`data:image/jpeg;base64,${editedImage.imageData}`} alt="AI Edited Frame" className="w-full h-full object-contain rounded-md" />
                                                <p className="text-xs text-text-secondary italic text-center w-full max-w-prose">{editedImage.commentary}</p>
                                            </div>
                                        )}
                                        {!isEditingImage && !editImageError && !editedImage && <p className="text-text-secondary text-sm">Edit the current frame using a text prompt.</p>}
                                    </div>
                                </div>
                             </div>

                             {/* AI Shot Generator */}
                              <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                                    <ShotGeneratorIcon className="w-4 h-4 text-text-secondary" />
                                    AI Shot Generator (Veo)
                                </h4>
                                <div className="pl-6 space-y-3">
                                    <textarea
                                        value={videoPrompt}
                                        onChange={(e) => setVideoPrompt(e.target.value)}
                                        placeholder="Describe the shot to generate..."
                                        rows={3}
                                        className="w-full bg-primary p-2 rounded-md text-sm placeholder-text-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                                        disabled={anyAnalysisRunning}
                                    />
                                    <button
                                        onClick={() => onGenerateVideo(videoPrompt)}
                                        disabled={anyAnalysisRunning || !videoPrompt.trim()}
                                        className="w-full bg-secondary-accent text-primary p-2 rounded-md font-semibold hover:bg-secondary-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2"
                                        title={'Generate a new video shot'}
                                    >
                                        {isGeneratingVideo && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                        <span>{isGeneratingVideo ? 'Generating...' : 'Generate Shot'}</span>
                                    </button>
                                    <div className="h-48 flex items-center justify-center">
                                        {isGeneratingVideo && <ShimmerBox text={videoGenerationProgress || 'AI is generating your video...'}/>}
                                        {videoGenerationError && <p className="text-error text-center p-4">{videoGenerationError}</p>}
                                        {generatedVideo && (
                                            <video src={generatedVideo.videoUrl} controls autoPlay loop className="w-full h-full object-contain rounded-md" />
                                        )}
                                        {!isGeneratingVideo && !videoGenerationError && !generatedVideo && <p className="text-text-secondary text-sm">Generate a new video clip from a text prompt.</p>}
                                    </div>
                                </div>
                             </div>
    
                            {/* AI Storyboard Artist */}
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                                    <StoryboardIcon className="w-4 h-4 text-text-secondary" />
                                    AI Storyboard Artist (Imagen)
                                </h4>
                                <div className="pl-6 space-y-3">
                                    <textarea
                                        value={storyboardPrompt}
                                        onChange={(e) => setStoryboardPrompt(e.target.value)}
                                        placeholder="Describe a storyboard panel..."
                                        rows={3}
                                        className="w-full bg-primary p-2 rounded-md text-sm placeholder-text-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                                        disabled={anyAnalysisRunning}
                                    />
                                    <button
                                        onClick={() => onGenerateStoryboard(storyboardPrompt)}
                                        disabled={anyAnalysisRunning || !storyboardPrompt.trim()}
                                        className="w-full bg-accent text-text-primary p-2 rounded-md font-semibold hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2"
                                        title={'Generate storyboard panels'}
                                    >
                                        {isGeneratingStoryboard && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                        <span>{isGeneratingStoryboard ? 'Generating...' : 'Generate Storyboard'}</span>
                                    </button>
                                    <div className="h-48 flex items-center justify-center">
                                        {isGeneratingStoryboard && <ShimmerBox text="AI is drawing your storyboard..." />}
                                        {storyboardError && <p className="text-error text-center p-4">{storyboardError}</p>}
                                        {storyboardPanels && (
                                            <div className="grid grid-cols-3 gap-2 w-full h-full">
                                                {storyboardPanels.map((panel, index) => (
                                                    <img 
                                                        key={index} 
                                                        src={`data:image/jpeg;base64,${panel.imageData}`} 
                                                        alt={panel.description} 
                                                        className="w-full h-full object-cover rounded-md border border-border" 
                                                        title={panel.description}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {!isGeneratingStoryboard && !storyboardError && !storyboardPanels && <p className="text-text-secondary text-sm">Generate B&W storyboard panels from a text prompt.</p>}
                                    </div>
                                </div>
                            </div>

                            {/* AI Sound Designer */}
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                                    <SoundscapeIcon className="w-4 h-4 text-text-secondary" />
                                    AI Sound Designer
                                </h4>
                                <div className="pl-6 space-y-3">
                                    <textarea
                                        value={soundscapePrompt}
                                        onChange={(e) => setSoundscapePrompt(e.target.value)}
                                        placeholder="Describe a scene to create a soundscape for..."
                                        rows={3}
                                        className="w-full bg-primary p-2 rounded-md text-sm placeholder-text-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                                        disabled={anyAnalysisRunning}
                                    />
                                    <button
                                        onClick={() => onGenerateSoundscape(soundscapePrompt)}
                                        disabled={anyAnalysisRunning || !soundscapePrompt.trim()}
                                        className="w-full bg-accent text-text-primary p-2 rounded-md font-semibold hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center space-x-2"
                                        title={'Generate a soundscape description'}
                                    >
                                        {isGeneratingSoundscape && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                                        <span>{isGeneratingSoundscape ? 'Generating...' : 'Generate Soundscape'}</span>
                                    </button>
                                    <div className="flex flex-col items-center justify-center">
                                        {isGeneratingSoundscape && <div className="h-24 w-full"><ShimmerBox text="AI is designing the soundscape..." /></div>}
                                        {soundscapeError && <p className="text-error text-center p-4">{soundscapeError}</p>}
                                        {soundscape && (
                                            <div className="w-full space-y-3 text-sm">
                                                {soundscape.audioUrl && (
                                                    <audio controls src={soundscape.audioUrl} className="w-full h-8">
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                )}
                                                <InfoBlock title="Soundscape Description" content={soundscape.description} />
                                                <div>
                                                    <h4 className="font-bold text-accent mb-1">Keywords</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {soundscape.keywords.map(kw => (
                                                            <span key={kw} className="bg-primary/50 text-xs text-text-secondary px-2 py-1 rounded">{kw}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {!isGeneratingSoundscape && !soundscapeError && !soundscape && <p className="text-text-secondary text-sm h-24 flex items-center">Generate an ambient soundscape from a text prompt.</p>}
                                    </div>
                                </div>
                            </div>
                         </div>
                    </Accordion>
                </div>

                {/* Timeline & Overlays Section */}
                <div className="border-t border-border mt-4 pt-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <TimelineIcon className="w-5 h-5 text-accent" />
                        <h3 className="text-md font-bold text-text-primary">Timeline & Overlays</h3>
                    </div>

                    <div className="space-y-3 p-3 bg-primary/50 rounded-lg">
                        <ToggleSwitch label="Character Paths" isEnabled={showBlocking} onToggle={setShowBlocking} />
                        <ToggleSwitch label="Camera Path" isEnabled={showCameraPath} onToggle={setShowCameraPath} />
                        <ToggleSwitch label="Emotion Curves" isEnabled={showEmotionData} onToggle={setShowEmotionData} />
                    </div>

                    <div>
                        <h4 className="text-sm text-text-secondary mb-1">Overall Scene Emotion</h4>
                        <div className="w-full h-8 rounded-lg transition-colors duration-300 flex items-center justify-center text-xs font-bold text-primary relative overflow-hidden" style={{ backgroundColor: getEmotionColor(totalEmotionalIntensity) }}>
                            <div className="absolute inset-0 bg-black/10"></div>
                            <span className="z-10">INTENSITY: {totalEmotionalIntensity.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="flex-grow">
                        {showCameraPath && (
                            <TimelineGraph
                                type="complexity"
                                label="Camera Complexity"
                                data={sceneData.camera.movement.map(d => ({ time: d.time, intensity: d.complexity, label: d.label }))}
                                color={sceneData.camera.pathColor}
                                height={60}
                                duration={sceneData.duration}
                                currentTime={currentTime}
                                onSeek={onSeek}
                                noiseFactor={0.4}
                            />
                        )}
                        {showEmotionData && sceneData.characters.map(char => (
                            <TimelineGraph
                                key={char.id}
                                type="emotion"
                                label={`${char.name} Emotion`}
                                data={char.emotion}
                                color={char.pathColor}
                                height={40}
                                duration={sceneData.duration}
                                currentTime={currentTime}
                                onSeek={onSeek}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoBlock: React.FC<{ title: string; content: string }> = ({ title, content }) => (
    <div>
        <h4 className="font-bold text-accent">{title}</h4>
        <p className="text-text-primary bg-primary/50 p-2 rounded-md text-sm max-w-prose leading-relaxed">{content}</p>
    </div>
);

export default DataPanel;