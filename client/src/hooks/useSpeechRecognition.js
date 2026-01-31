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
            console.log('🎤 Speech recognition started');
            setIsListening(true);
            setError(null);
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
                onResult?.(newEntry);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);

            // Handle different error types
            switch (event.error) {
                case 'not-allowed':
                    setError('Microphone access denied. Please allow microphone access.');
                    break;
                case 'network':
                    setError('Network error occurred. Speech recognition requires internet.');
                    break;
                case 'no-speech':
                    // Not a critical error, just no speech detected
                    break;
                case 'aborted':
                    // User or system stopped recognition
                    break;
                default:
                    setError(`Speech recognition error: ${event.error}`);
            }

            onError?.(event.error);
        };

        recognition.onend = () => {
            console.log('🎤 Speech recognition ended');
            setIsListening(false);

            // Auto-restart if still supposed to be listening
            if (recognitionRef.current && continuous) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // Already started or stopped
                }
            }
        };

        return recognition;
    }, [continuous, interimResults, language, onResult, onError]);

    // Start listening
    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition not supported');
            return;
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Already stopped
            }
        }

        recognitionRef.current = initRecognition();
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error('Error starting recognition:', e);
            }
        }
    }, [initRecognition]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.continuous = false; // Prevent auto-restart
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
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Already stopped
                }
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
