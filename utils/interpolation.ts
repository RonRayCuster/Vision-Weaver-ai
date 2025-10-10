
// FIX: Import BaseKeyframe to use as a more specific type constraint.
import type { BaseKeyframe } from '../types';

export const interpolate = (val1: number, val2: number, time1: number, time2: number, currentTime: number): number => {
    if (currentTime <= time1) return val1;
    if (currentTime >= time2) return val2;
    if (time1 === time2) return val1;
    const t = (currentTime - time1) / (time2 - time1);
    return val1 + (val2 - val1) * t;
};

// FIX: Use BaseKeyframe as the generic constraint for T. This helps TypeScript
// correctly infer the specific keyframe type (e.g., EmotionKeyframe) at call sites,
// resolving errors where properties like 'intensity' were not found.
export const findSegment = <T extends BaseKeyframe>(data: T[], currentTime: number): { start: T; end: T } => {
    for (let i = 0; i < data.length - 1; i++) {
        if (currentTime >= data[i].time && currentTime < data[i + 1].time) {
            return { start: data[i], end: data[i + 1] };
        }
    }
    return { start: data[data.length - 1], end: data[data.length - 1] };
};