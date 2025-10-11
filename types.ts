export interface BaseKeyframe {
    time: number;
}

export interface BlockingKeyframe extends BaseKeyframe {
    x: number;
    y: number;
}

export interface EmotionKeyframe extends BaseKeyframe {
    intensity: number;
    label: string;
}

export interface Character {
    id: string;
    name: string;
    color: string;
    pathColor: string;
    blocking: BlockingKeyframe[];
    emotion: EmotionKeyframe[];
}

export interface CameraKeyframe extends BlockingKeyframe {
    complexity: number;
    label: string;
}

export interface CameraData {
    movement: CameraKeyframe[];
}

export interface SceneData {
    videoUrl: string;
    duration: number;
    characters: Character[];
    camera: CameraData;
}

export interface CharacterPosition extends Character {
    x: number;
    y: number;
}

// Types for AI Scene Analysis
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface ActorAnalysis {
    name: string;
    position: Vector3;
    emotion: string;
    interaction: string | null;
}

export interface CameraAnalysis {
    position: Vector3;
    orientation?: Vector3;
    zoom?: number;
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

// Types for AI Cinematic Analysis
export interface CinematicAnalysis {
    shotComposition: string;
    colorPalette: string;
    cameraWork: string;
}

// Types for AI 3D Reconstruction (COLMAP)
export interface PointCloudPoint {
    position: Vector3;
    color: string; // Hex color string, e.g., "#RRGGBB"
}

export interface CameraPose {
    position: Vector3;
    // Quaternion for orientation
    orientation: { x: number; y: number; z: number; w: number; };
}

export interface SceneReconstruction {
    pointCloud: PointCloudPoint[];
    cameraPoses: CameraPose[];
}