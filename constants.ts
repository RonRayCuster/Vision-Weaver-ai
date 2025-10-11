import type { SceneData } from './types';
import { colors } from './colors';

export const sceneData: SceneData = {
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: 60,
    characters: [
        {
            id: 'char1',
            name: 'Hero',
            color: 'bg-accent',
            pathColor: colors.accent,
            blocking: [
                { time: 0, x: 10, y: 50 },
                { time: 10, x: 30, y: 40 },
                { time: 20, x: 50, y: 60 },
                { time: 30, x: 40, y: 80 },
                { time: 40, x: 70, y: 70 },
                { time: 50, x: 90, y: 50 },
                { time: 60, x: 80, y: 30 },
            ],
            emotion: [
                { time: 0, intensity: 0.2, label: 'Neutral' },
                { time: 15, intensity: 0.8, label: 'Surprise' },
                { time: 30, intensity: 0.5, label: 'Concern' },
                { time: 45, intensity: 0.9, label: 'Anger' },
                { time: 60, intensity: 0.3, label: 'Relief' },
            ],
        },
        {
            id: 'char2',
            name: 'Rival',
            color: 'bg-error',
            pathColor: colors.error,
            blocking: [
                { time: 0, x: 90, y: 50 },
                { time: 10, x: 70, y: 60 },
                { time: 20, x: 50, y: 40 },
                { time: 30, x: 60, y: 20 },
                { time: 40, x: 30, y: 30 },
                { time: 50, x: 10, y: 50 },
                { time: 60, x: 20, y: 70 },
            ],
            emotion: [
                { time: 0, intensity: 0.4, label: 'Confident' },
                { time: 15, intensity: 0.6, label: 'Annoyed' },
                { time: 30, intensity: 0.9, label: 'Rage' },
                { time: 45, intensity: 0.4, label: 'Frustrated' },
                { time: 60, intensity: 0.2, label: 'Defeated' },
            ],
        },
    ],
    camera: {
        movement: [
            { time: 0, complexity: 0.1, label: 'Static', x: 50, y: 50 },
            { time: 10, complexity: 0.4, label: 'Slow Pan', x: 60, y: 50 },
            { time: 25, complexity: 0.9, label: 'Crash Zoom', x: 50, y: 50 },
            { time: 40, complexity: 0.6, label: 'Dolly Out', x: 40, y: 50 },
            { time: 60, complexity: 0.1, label: 'Static', x: 40, y: 50 },
        ],
        pathColor: colors.warning,
    },
};
