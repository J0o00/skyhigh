/**
 * useWebRTC Hook
 * 
 * Custom hook for WebRTC peer-to-peer audio communication.
 * Handles connection setup, media streams, and signaling via Socket.IO.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// ICE servers for NAT traversal (STUN + TURN)
// TURN servers are required for cross-network calls when direct P2P fails
const ICE_SERVERS = {
    iceServers: [
        // STUN servers (free, for discovering public IP)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        // TURN servers from Metered.ca (for relaying when P2P fails)
        {
            urls: 'turn:global.relay.metered.ca:80',
            username: '5764b5511687c05753186f01',
            credential: '5764b5511687c05753186f01'
        },
        {
            urls: 'turn:global.relay.metered.ca:80?transport=tcp',
            username: '5764b5511687c05753186f01',
            credential: '5764b5511687c05753186f01'
        },
        {
            urls: 'turn:global.relay.metered.ca:443',
            username: '5764b5511687c05753186f01',
            credential: '5764b5511687c05753186f01'
        },
        {
            urls: 'turns:global.relay.metered.ca:443?transport=tcp',
            username: '5764b5511687c05753186f01',
            credential: '5764b5511687c05753186f01'
        }
    ]
};

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

    // Update session ID when prop changes
    useEffect(() => {
        if (initialSessionId) {
            setActiveSessionId(initialSessionId);
        }
    }, [initialSessionId]);

    // Initialize peer connection
    const initPeerConnection = useCallback((currentSessionId) => {
        if (peerConnectionRef.current) {
            console.log('📡 Peer connection already exists');
            return peerConnectionRef.current;
        }

        console.log('📡 Creating new peer connection');
        peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

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
            console.log('📩 Received offer from:', from);
            try {
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                    console.log('📩 Set remote description');

                    // Apply any pending ICE candidates
                    for (const candidate of pendingCandidatesRef.current) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    pendingCandidatesRef.current = [];

                    const answer = await peerConnectionRef.current.createAnswer();
                    await peerConnectionRef.current.setLocalDescription(answer);
                    console.log('📤 Sending answer');

                    socketRef.current.emit('webrtc:answer', {
                        sessionId: currentSessionId,
                        answer,
                        from: role
                    });
                }
            } catch (err) {
                console.error('Error handling offer:', err);
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

            initPeerConnection(currentSessionId);
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

            initPeerConnection(currentSessionId);
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

    // End call
    const endCall = useCallback(() => {
        socketRef.current?.emit('webrtc:call-end', {
            sessionId: activeSessionId,
            endedBy: role
        });
        cleanup();
        setConnectionState('ended');
    }, [activeSessionId, role]);

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

    // Cleanup resources
    const cleanup = useCallback(() => {
        console.log('🧹 Cleaning up WebRTC resources');

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.emit('webrtc:leave', { sessionId: activeSessionId });
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        pendingCandidatesRef.current = [];
    }, [activeSessionId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

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
