import type { SceneData } from './types';
import { colors } from './colors';

export interface Preset {
    id: string;
    name: string;
    data: SceneData;
}

export const presets: Preset[] = [
    {
        id: 'big-buck-bunny',
        name: 'Big Buck Bunny (Default)',
        data: {
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
        }
    },
    {
        id: 'chase-scene',
        name: 'Chase Scene',
        data: {
            videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: 60,
            characters: [
                {
                    id: 'char1',
                    name: 'Hero',
                    color: 'bg-accent',
                    pathColor: colors.accent,
                    blocking: [
                        { time: 0, x: 5, y: 10 },
                        { time: 15, x: 40, y: 50 },
                        { time: 30, x: 75, y: 90 },
                        { time: 45, x: 50, y: 50 },
                        { time: 60, x: 95, y: 10 },
                    ],
                    emotion: [
                        { time: 0, intensity: 0.6, label: 'Determined' },
                        { time: 30, intensity: 0.9, label: 'Strained' },
                        { time: 60, intensity: 0.7, label: 'Focused' },
                    ],
                },
                {
                    id: 'char2',
                    name: 'Rival',
                    color: 'bg-error',
                    pathColor: colors.error,
                    blocking: [
                        { time: 0, x: 10, y: 5 },
                        { time: 15, x: 45, y: 45 },
                        { time: 30, x: 80, y: 85 },
                        { time: 45, x: 55, y: 45 },
                        { time: 60, x: 100, y: 5 },
                    ],
                    emotion: [
                        { time: 0, intensity: 0.8, label: 'Aggressive' },
                        { time: 30, intensity: 0.9, label: 'Frustrated' },
                        { time: 60, intensity: 0.8, label: 'Relentless' },
                    ],
                },
            ],
            camera: {
                movement: [
                    { time: 0, complexity: 0.7, label: 'Tracking', x: 7, y: 7 },
                    { time: 15, complexity: 0.8, label: 'Tracking', x: 42, y: 47 },
                    { time: 30, complexity: 0.9, label: 'Handheld', x: 77, y: 87 },
                    { time: 45, complexity: 0.7, label: 'Tracking', x: 52, y: 47 },
                    { time: 60, complexity: 0.9, label: 'Handheld', x: 97, y: 7 },
                ],
                pathColor: colors.warning,
            },
        }
    },
    {
        id: 'tense-standoff',
        name: 'Tense Standoff',
        data: {
            videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: 60,
            characters: [
                {
                    id: 'char1',
                    name: 'Hero',
                    color: 'bg-accent',
                    pathColor: colors.accent,
                    blocking: [
                        { time: 0, x: 20, y: 50 },
                        { time: 20, x: 25, y: 50 },
                        { time: 40, x: 24, y: 51 },
                        { time: 60, x: 30, y: 50 },
                    ],
                    emotion: [
                        { time: 0, intensity: 0.8, label: 'Tense' },
                        { time: 30, intensity: 0.9, label: 'Resolved' },
                        { time: 60, intensity: 0.7, label: 'Wary' },
                    ],
                },
                {
                    id: 'char2',
                    name: 'Rival',
                    color: 'bg-error',
                    pathColor: colors.error,
                    blocking: [
                        { time: 0, x: 80, y: 50 },
                        { time: 20, x: 75, y: 50 },
                        { time: 40, x: 76, y: 49 },
                        { time: 60, x: 70, y: 50 },
                    ],
                    emotion: [
                        { time: 0, intensity: 0.8, label: 'Cautious' },
                        { time: 30, intensity: 0.85, label: 'Threatening' },
                        { time: 60, intensity: 0.7, label: 'Uncertain' },
                    ],
                },
            ],
            camera: {
                movement: [
                    { time: 0, complexity: 0.2, label: 'Static', x: 50, y: 10 },
                    { time: 15, complexity: 0.3, label: 'Slow Push In', x: 50, y: 15 },
                    { time: 30, complexity: 0.8, label: 'Whip Pan', x: 50, y: 20 },
                    { time: 45, complexity: 0.3, label: 'Slow Push In', x: 50, y: 25 },
                    { time: 60, complexity: 0.2, label: 'Static', x: 50, y: 30 },
                ],
                pathColor: colors.warning,
            },
        }
    }
];
