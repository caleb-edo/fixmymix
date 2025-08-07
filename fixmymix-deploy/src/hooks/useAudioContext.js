import { useState, useEffect, useRef } from 'react';

export const useAudioContext = () => {
    const [audioContext, setAudioContext] = useState(null);
    const [isContextReady, setIsContextReady] = useState(false);

    useEffect(() => {
        const initAudioContext = () => {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                setAudioContext(context);
                setIsContextReady(true);
            } catch (error) {
                console.error('Web Audio API not supported:', error);
            }
        };

        // Initialize on user interaction
        const handleUserInteraction = () => {
            if (!audioContext) {
                initAudioContext();
                document.removeEventListener('click', handleUserInteraction);
            }
        };

        document.addEventListener('click', handleUserInteraction);

        return () => {
            document.removeEventListener('click', handleUserInteraction);
            if (audioContext) {
                audioContext.close();
            }
        };
    }, [audioContext]);

    return { audioContext, isContextReady };
};