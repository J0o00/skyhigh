/**
 * useAudioRecorder Hook
 * 
 * Captures audio from MediaStream and sends chunks to server for Whisper transcription
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecorder = (socket, mediaStream) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcripts, setTranscripts] = useState([]);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    /**
     * Start recording audio from media stream
     */
    const startRecording = useCallback(() => {
        if (!mediaStream || isRecording) return;

        try {
            // Create MediaRecorder with WebM format (compatible with Whisper)
            const mediaRecorder = new MediaRecorder(mediaStream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            // Handle data available event (every 3 seconds)
            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);

                    // Send audio chunk to server for transcription
                    if (socket && socket.connected) {
                        try {
                            // Convert blob to ArrayBuffer
                            const arrayBuffer = await event.data.arrayBuffer();

                            // Emit audio chunk via Socket.IO
                            socket.emit('webrtc:audio-chunk', {
                                audio: arrayBuffer,
                                timestamp: Date.now()
                            });
                        } catch (err) {
                            console.error('Failed to send audio chunk:', err);
                        }
                    }
                }
            };

            // Handle errors
            mediaRecorder.onerror = (error) => {
                console.error('MediaRecorder error:', error);
                setIsRecording(false);
            };

            // Start recording with 3-second chunks
            mediaRecorder.start(3000);
            setIsRecording(true);

            console.log('🎤 Audio recording started (Whisper mode)');

        } catch (error) {
            console.error('Failed to start MediaRecorder:', error);
        }
    }, [mediaStream, socket, isRecording]);

    /**
     * Stop recording
     */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            chunksRef.current = [];
            console.log('🎤 Audio recording stopped');
        }
    }, [isRecording]);

    /**
     * Listen for transcription results from server
     */
    useEffect(() => {
        if (!socket) return;

        const handleTranscript = (data) => {
            console.log('📝 Received transcript:', data);
            setTranscripts(prev => [...prev, data]);
        };

        socket.on('webrtc:transcription', handleTranscript);

        return () => {
            socket.off('webrtc:transcription', handleTranscript);
        };
    }, [socket]);

    /**
     * Auto-start/stop based on media stream
     */
    useEffect(() => {
        if (mediaStream && !isRecording) {
            startRecording();
        }

        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, [mediaStream]);

    return {
        isRecording,
        transcripts,
        startRecording,
        stopRecording
    };
};

export default useAudioRecorder;
