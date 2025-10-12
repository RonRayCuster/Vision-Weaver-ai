import { useState, useEffect, useCallback, RefObject } from 'react';

/**
 * Custom hook to manage video playback state and controls.
 * @param videoRef A React ref to the HTMLVideoElement.
 * @returns An object with playback state and control functions.
 */
export function useVideoPlayback(videoRef: RefObject<HTMLVideoElement>) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);


    /**
     * Callback passed to the <video> element's onTimeUpdate event to sync state.
     */
    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    }, [videoRef]);

    /**
     * Handles scrubbing the video timeline to a new time.
     */
    const handleScrub = useCallback((newTime: number) => {
        const clampedTime = Math.max(0, Math.min(duration, newTime));
        setCurrentTime(clampedTime);
        if (videoRef.current) {
            videoRef.current.currentTime = clampedTime;
        }
    }, [duration, videoRef]);

    /**
     * Toggles the video between playing and paused states.
     */
    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    }, [videoRef]);

    /**
     * Effect to sync the `isPlaying` state with the video element's native play/pause events.
     */
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlayEvent = () => setIsPlaying(true);
        const handlePauseEvent = () => setIsPlaying(false);

        // Listen for the native events from the video element
        video.addEventListener('play', handlePlayEvent);
        video.addEventListener('pause', handlePauseEvent);
        
        // Cleanup listeners on unmount
        return () => {
            video.removeEventListener('play', handlePlayEvent);
            video.removeEventListener('pause', handlePauseEvent);
        };
    }, [videoRef]);
    
    return {
        currentTime,
        isPlaying,
        duration,
        togglePlay,
        handleScrub,
        handleTimeUpdate,
        setCurrentTime,
        setIsPlaying,
        setDuration,
    };
}