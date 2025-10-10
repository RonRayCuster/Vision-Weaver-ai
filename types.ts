

// FIX: Export BaseKeyframe to allow its use as a generic constraint in other files.
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

export interface CameraKeyframe extends BaseKeyframe {
  complexity: number;
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