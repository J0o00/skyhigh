/**
 * useSpeechRecognition Hook
 * 
 * Custom hook for Browser Speech API (Web Speech API).
 * Provides real-time speech-to-text transcription.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSupported = !!SpeechRecognition;

export function useSpeechRecognition({
    onResult,
    onError,
    continuous = true,
    interimResults = true,
    language = 'en-US'
}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const transcriptIndexRef = useRef(0);
    const shouldRestartRef = useRef(false); // Track if we should restart on end
    const restartAttemptsRef = useRef(0); // Track restart attempts to prevent infinite loops
    const maxRestartAttempts = 5;
    
    // Store callbacks in refs to avoid dependency issues
    const onResultRef = useRef(onResult);
    const onErrorRef = useRef(onError);
    
    // Update callback refs when they change
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);
    
    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    // Initialize speech recognition
    const initRecognition = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition not supported in this browser. Use Chrome or Edge.');
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = language;

        recognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
            setError(null);
            restartAttemptsRef.current = 0; // Reset restart attempts on successful start
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptText = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcriptText;
                } else {
                    interim += transcriptText;
                }
            }

            setInterimTranscript(interim);

            if (final) {
                const newEntry = {
                    id: transcriptIndexRef.current++,
                    text: final.trim(),
                    timestamp: new Date(),
                    confidence: event.results[event.resultIndex][0].confidence
                };

                setTranscript(prev => [...prev, newEntry]);
                // Use ref to call callback to avoid dependency issues
                onResultRef.current?.(newEntry);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);

            // Handle different error types
            switch (event.error) {
                case 'not-allowed':
                    setError('Microphone access denied. Please allow microphone access.');
                    shouldRestartRef.current = false; // Stop trying to restart
                    break;
                case 'network':
                    setError('Network error occurred. Speech recognition requires internet.');
                    break;
                case 'no-speech':
                    // Not a critical error, just no speech detected - clear any previous error
                    setError(null);
                    break;
                case 'aborted':
                    // User or system stopped recognition - clear error
                    setError(null);
                    break;
                default:
                    setError(`Speech recognition error: ${event.error}`);
            }

            // Use ref to call callback
            onErrorRef.current?.(event.error);
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);

            // Auto-restart if still supposed to be listening and haven't exceeded attempts
            if (shouldRestartRef.current && continuous) {
                if (restartAttemptsRef.current < maxRestartAttempts) {
                    restartAttemptsRef.current++;
                    try {
                        // Small delay before restarting to prevent rapid loops
                        setTimeout(() => {
                            if (shouldRestartRef.current && recognitionRef.current) {
                                recognitionRef.current.start();
                            }
                        }, 100);
                    } catch (e) {
                        console.error('Error restarting recognition:', e);
                    }
                } else {
                    console.warn('Max restart attempts reached, stopping speech recognition');
                    setError('Speech recognition stopped after multiple restart attempts');
                    shouldRestartRef.current = false;
                }
            }
        };

        return recognition;
    }, [continuous, interimResults, language]); // Removed callback dependencies

    // Start listening
    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition not supported');
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            try {
                shouldRestartRef.current = false; // Prevent auto-restart during cleanup
                recognitionRef.current.stop();
            } catch (e) {
                // Already stopped
            }
            recognitionRef.current = null;
        }

        // Reset state
        restartAttemptsRef.current = 0;
        shouldRestartRef.current = true; // Enable auto-restart for continuous mode
        setError(null);

        recognitionRef.current = initRecognition();
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error('Error starting recognition:', e);
                setError('Failed to start speech recognition');
            }
        }
    }, [initRecognition]);

    // Stop listening
    const stopListening = useCallback(() => {
        shouldRestartRef.current = false; // Prevent auto-restart
        
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Already stopped
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // Clear transcript
    const clearTranscript = useCallback(() => {
        setTranscript([]);
        setInterimTranscript('');
        transcriptIndexRef.current = 0;
    }, []);

    // Get full transcript text
    const getFullTranscript = useCallback(() => {
        return transcript.map(t => t.text).join(' ');
    }, [transcript]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            shouldRestartRef.current = false; // Prevent auto-restart during cleanup
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Already stopped
                }
                recognitionRef.current = null;
            }
        };
    }, []);

    return {
        // State
        isListening,
        transcript,
        interimTranscript,
        error,
        isSupported,
        // Actions
        startListening,
        stopListening,
        clearTranscript,
        getFullTranscript
    };
}

export default useSpeechRecognition;
