/**
 * useWebRTC Hook
 * 
 * Custom hook for WebRTC peer-to-peer audio communication.
 * Handles connection setup, media streams, and signaling via Socket.IO.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

// Google STUN servers (reliable for most use cases)
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

async function getIceServers() {
    // For local dev, Google STUN is sufficient.
    // In production, you would fetch TURN credentials here.
    return ICE_SERVERS;
}

export function useWebRTC({ sessionId: initialSessionId, role, userId, onConnectionChange, onRemoteStream }) {
    const [connectionState, setConnectionState] = useState('disconnected');
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState(initialSessionId);

    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const pendingCandidatesRef = useRef([]);

    // Use refs to avoid stale closures in cleanup and event handlers
    const activeSessionIdRef = useRef(activeSessionId);
    const roleRef = useRef(role);

    // Update refs when values change
    useEffect(() => {
        activeSessionIdRef.current = activeSessionId;
    }, [activeSessionId]);

    useEffect(() => {
        roleRef.current = role;
    }, [role]);

    // Update session ID when prop changes
    useEffect(() => {
        if (initialSessionId) {
            setActiveSessionId(initialSessionId);
        }
    }, [initialSessionId]);

    // Initialize peer connection (async to fetch TURN credentials)
    const initPeerConnection = useCallback(async (currentSessionId) => {
        if (peerConnectionRef.current) {
            console.log('📡 Peer connection already exists');
            return peerConnectionRef.current;
        }

        console.log('📡 Creating new peer connection');

        // Fetch TURN credentials from Metered.ca
        const iceConfig = await getIceServers();
        console.log('📡 Using ICE config:', iceConfig);

        peerConnectionRef.current = new RTCPeerConnection(iceConfig);

        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                console.log('🧊 Sending ICE candidate');
                socketRef.current.emit('webrtc:ice-candidate', {
                    sessionId: currentSessionId,
                    candidate: event.candidate,
                    from: role
                });
            }
        };

        // Handle connection state changes
        peerConnectionRef.current.onconnectionstatechange = () => {
            const state = peerConnectionRef.current?.connectionState;
            console.log('🔗 Connection state:', state);
            setConnectionState(state || 'disconnected');
            onConnectionChange?.(state);
        };

        // Handle ICE connection state
        peerConnectionRef.current.oniceconnectionstatechange = () => {
            console.log('🧊 ICE state:', peerConnectionRef.current?.iceConnectionState);
        };

        // Handle incoming remote stream
        peerConnectionRef.current.ontrack = (event) => {
            console.log('🎵 Received remote track');
            if (event.streams[0]) {
                onRemoteStream?.(event.streams[0]);
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                }
            }
        };

        return peerConnectionRef.current;
    }, [role, onConnectionChange, onRemoteStream]);

    // Get local media stream
    const getLocalStream = useCallback(async () => {
        if (localStreamRef.current) {
            console.log('🎤 Using existing local stream');
            return localStreamRef.current;
        }

        try {
            console.log('🎤 Requesting microphone access');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            localStreamRef.current = stream;

            // Add tracks to peer connection
            if (peerConnectionRef.current) {
                stream.getTracks().forEach(track => {
                    console.log('🎤 Adding track to peer connection');
                    peerConnectionRef.current.addTrack(track, stream);
                });
            }

            return stream;
        } catch (err) {
            console.error('Error getting media:', err);
            setError('Microphone access denied');
            throw err;
        }
    }, []);

    // Create and send offer
    const createOffer = useCallback(async (currentSessionId) => {
        if (!peerConnectionRef.current || !socketRef.current) {
            console.error('Cannot create offer - no peer connection or socket');
            return;
        }

        try {
            console.log('📤 Creating offer for session:', currentSessionId);
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);

            socketRef.current.emit('webrtc:offer', {
                sessionId: currentSessionId,
                offer,
                from: role
            });
            console.log('📤 Offer sent');
        } catch (err) {
            console.error('Error creating offer:', err);
            setError('Failed to create call offer');
        }
    }, [role]);

    // Initialize socket and set up handlers
    const initSocket = useCallback((currentSessionId) => {
        if (socketRef.current?.connected) {
            console.log('🔌 Socket already connected, joining room:', currentSessionId);
            socketRef.current.emit('webrtc:join', { sessionId: currentSessionId, role, userId });
            return socketRef.current;
        }

        console.log('🔌 Creating new WebRTC socket connection');
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected, joining room:', currentSessionId);
            socketRef.current.emit('webrtc:join', { sessionId: currentSessionId, role, userId });
        });

        // Handle incoming offer (agent receives this)
        socketRef.current.on('webrtc:offer', async ({ offer, from }) => {
            console.log('Received offer from:', from);
            try {
                // Verify peer connection exists before proceeding
                if (!peerConnectionRef.current) {
                    console.warn('No peer connection available to handle offer');
                    return;
                }

                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                console.log('Set remote description');

                // Apply any pending ICE candidates
                for (const candidate of pendingCandidatesRef.current) {
                    if (peerConnectionRef.current) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                }
                pendingCandidatesRef.current = [];

                if (!peerConnectionRef.current) {
                    console.warn('Peer connection closed during offer handling');
                    return;
                }

                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);
                console.log('Sending answer');

                socketRef.current?.emit('webrtc:answer', {
                    sessionId: currentSessionId,
                    answer,
                    from: role
                });
            } catch (err) {
                console.error('Error handling offer:', err);
                setError('Failed to handle incoming call');
            }
        });

        // Handle incoming answer (customer receives this)
        socketRef.current.on('webrtc:answer', async ({ answer }) => {
            console.log('📩 Received answer');
            try {
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('📩 Set remote description from answer');
                }
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        });

        // Handle ICE candidate
        socketRef.current.on('webrtc:ice-candidate', async ({ candidate }) => {
            if (candidate) {
                try {
                    if (peerConnectionRef.current?.remoteDescription) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } else {
                        // Queue candidate if remote description not set yet
                        pendingCandidatesRef.current.push(candidate);
                    }
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            }
        });

        // Handle peer joined - customer initiates offer when agent joins
        socketRef.current.on('webrtc:peer-joined', ({ role: peerRole }) => {
            console.log('👋 Peer joined:', peerRole, 'we are:', role);
            if (role === 'customer' && peerRole === 'agent') {
                console.log('🚀 Agent joined - creating offer');
                setTimeout(() => createOffer(currentSessionId), 500);
            }
        });

        // Handle call accepted
        socketRef.current.on('webrtc:call-accepted', () => {
            console.log('✅ Call accepted by agent');
        });

        // Handle call rejected
        socketRef.current.on('webrtc:call-rejected', ({ reason }) => {
            console.log('❌ Call rejected:', reason);
            setConnectionState('rejected');
            setError(reason || 'Call was rejected');
        });

        // Handle call ended
        socketRef.current.on('webrtc:call-ended', () => {
            console.log('📵 Call ended by peer');
            cleanup();
            setConnectionState('ended');
        });

        // Handle peer disconnected
        socketRef.current.on('webrtc:peer-disconnected', () => {
            console.log('👋 Peer disconnected');
            cleanup();
            setConnectionState('peer-disconnected');
        });

        return socketRef.current;
    }, [role, userId, createOffer]);

    // Start call (customer side)
    const startCall = useCallback(async (overrideSessionId = null) => {
        const currentSessionId = overrideSessionId || activeSessionId;
        console.log('🚀 Starting call with session:', currentSessionId);

        try {
            setError(null);
            setConnectionState('initializing');

            await initPeerConnection(currentSessionId);
            await getLocalStream();
            initSocket(currentSessionId);

            setConnectionState('waiting');
        } catch (err) {
            console.error('Error starting call:', err);
            setConnectionState('failed');
            setError(err.message);
        }
    }, [activeSessionId, initPeerConnection, getLocalStream, initSocket]);

    // Accept call (agent side)
    const acceptCall = useCallback(async (overrideSessionId = null) => {
        const currentSessionId = overrideSessionId || activeSessionId;
        console.log('📞 Accepting call with session:', currentSessionId);

        try {
            setError(null);
            setConnectionState('connecting');

            await initPeerConnection(currentSessionId);
            await getLocalStream();
            initSocket(currentSessionId);

            // Emit call-accept after joining room
            setTimeout(() => {
                socketRef.current?.emit('webrtc:call-accept', {
                    sessionId: currentSessionId,
                    agentId: userId
                });
            }, 100);
        } catch (err) {
            console.error('Error accepting call:', err);
            setConnectionState('failed');
            setError(err.message);
        }
    }, [activeSessionId, initPeerConnection, getLocalStream, initSocket, userId]);

    // Reject call
    const rejectCall = useCallback((reason = 'Busy', overrideSessionId = null) => {
        const currentSessionId = overrideSessionId || activeSessionId;
        socketRef.current?.emit('webrtc:call-reject', {
            sessionId: currentSessionId,
            agentId: userId,
            reason
        });
        setConnectionState('rejected');
    }, [activeSessionId, userId]);

    // End call - use refs to ensure we have the latest values
    const endCall = useCallback(() => {
        socketRef.current?.emit('webrtc:call-end', {
            sessionId: activeSessionIdRef.current,
            endedBy: roleRef.current
        });
        cleanup();
        setConnectionState('ended');
    }, [cleanup]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Cleanup resources - use refs to avoid stale closures
    const cleanup = useCallback(() => {
        console.log('Cleaning up WebRTC resources');

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (socketRef.current) {
            // Remove all event listeners before disconnecting to prevent memory leaks
            socketRef.current.off('connect');
            socketRef.current.off('webrtc:offer');
            socketRef.current.off('webrtc:answer');
            socketRef.current.off('webrtc:ice-candidate');
            socketRef.current.off('webrtc:peer-joined');
            socketRef.current.off('webrtc:call-accepted');
            socketRef.current.off('webrtc:call-rejected');
            socketRef.current.off('webrtc:call-ended');
            socketRef.current.off('webrtc:peer-disconnected');

            // Use ref to get current session ID to avoid stale closure
            if (socketRef.current.connected) {
                socketRef.current.emit('webrtc:leave', { sessionId: activeSessionIdRef.current });
            }
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        pendingCandidatesRef.current = [];
    }, []); // No dependencies - uses refs instead

    // Cleanup on unmount - use the cleanup function which uses refs
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        connectionState,
        isMuted,
        error,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        cleanup,
        remoteAudioRef,
        localStream: localStreamRef.current,
        socket: socketRef.current
    };
}

export default useWebRTC;
