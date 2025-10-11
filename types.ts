// Base Interfaces
export interface BaseKeyframe {
    time: number;
}

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

// Keyframe Types for Scene Data
export interface BlockingKeyframe extends BaseKeyframe {
    x: number;
    y: number;
}

export interface EmotionKeyframe extends BaseKeyframe {
    intensity: number;
    label: string;
}

export interface CameraKeyframe extends BaseKeyframe {
    complexity: number;
    label: string;
    x: number;
    y: number;
}

// Pre-defined Scene Data Structure
export interface Character {
    id: string;
    name: string;
    color: string;
    pathColor: string;
    blocking: BlockingKeyframe[];
    emotion: EmotionKeyframe[];
}

// A Character with its interpolated position at a specific time
export interface CharacterPosition extends Character {
    x: number;
    y: number;
}

export interface SceneData {
    videoUrl: string;
    duration: number;
    characters: Character[];
    camera: {
        movement: CameraKeyframe[];
        pathColor: string;
    };
}

// Types for Gemini Service Responses

// Scene Layout Analysis
export interface ActorAnalysis {
    name: string;
    position: Vector3;
    emotion: string;
    interaction: string | null;
}

export interface CameraAnalysis {
    position: Vector3;
}

export interface LightAnalysis {
    type: string;
    position: Vector3;
    intensity: number;
}

export interface PropAnalysis {
    name: string;
    position: Vector3;
}

export interface SceneAnalysis {
    actors: ActorAnalysis[];
    camera: CameraAnalysis;
    lights: LightAnalysis[];
    props: PropAnalysis[];
    environmentDescription: string;
    overallMood: string;
}

// Cinematic Analysis
export interface CinematicAnalysis {
    shotComposition: string;
    colorPalette: string;
    cameraWork: string;
}

// 3D Scene Reconstruction
export interface PointCloudPoint {
    position: Vector3;
    color: string;
}

export interface CameraPose {
    position: Vector3;
    orientation: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
}

export interface SceneReconstruction {
    pointCloud: PointCloudPoint[];
    cameraPoses: CameraPose[];
}

// Dynamic Feedback on Scene Changes
export interface DynamicFeedback {
    impact: string;
    suggestion: string;
}

// AI Image Editing
export interface EditedImage {
    imageData: string; // base64 encoded image data
    commentary: string;
}

// AI Video Generation
export interface GeneratedVideo {
    videoUrl: string; // Blob URL for the generated video
}

// AI Storyboard Generation
export interface StoryboardPanel {
    imageData: string; // base64 encoded image data
    description: string;
}

// AI Soundscape Generation
export interface SoundscapeAnalysis {
    description: string;
    keywords: string[];
    audioUrl?: string;
}