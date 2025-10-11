
// FIX: Import `BaseKeyframe` to use as a generic type constraint.
import type { BaseKeyframe } from '../types';

export const interpolate = (val1: number, val2: number, time1: number, time2: number, currentTime: number): number => {
    if (currentTime <= time1) return val1;
    if (currentTime >= time2) return val2;
    if (time1 === time2) return val1;
    const t = (currentTime - time1) / (time2 - time1);
    return val1 + (val2 - val1) * t;
};

// FIX: `findSegment` was incorrectly typed to return `BaseKeyframe`, losing specific subtype information.
// By converting it to a generic function (`<T extends BaseKeyframe>`), it now preserves the exact
// keyframe type (e.g., `EmotionKeyframe`), making properties like `intensity` available and fixing downstream type errors.
export const findSegment = <T extends BaseKeyframe>(data: T[], currentTime: number): { start: T; end: T } => {
    for (let i = 0; i < data.length - 1; i++) {
        if (currentTime >= data[i].time && currentTime < data[i + 1].time) {
            return { start: data[i], end: data[i + 1] };
        }
    }
    return { start: data[data.length - 1], end: data[data.length - 1] };
};