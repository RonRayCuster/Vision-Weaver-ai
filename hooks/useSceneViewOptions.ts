import { useState } from 'react';

/**
 * Custom hook to manage the visibility state for different scene data layers.
 * @returns An object with state values and setters for scene view options.
 */
export function useSceneViewOptions() {
    const [showBlocking, setShowBlocking] = useState(true);
    const [showCameraPath, setShowCameraPath] = useState(true);
    const [showEmotionData, setShowEmotionData] = useState(true);

    return {
        showBlocking,
        setShowBlocking,
        showCameraPath,
        setShowCameraPath,
        showEmotionData,
        setShowEmotionData,
    };
}
