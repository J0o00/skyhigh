/**
 * Agent WebRTC Call Page
 * 
 * Agent-facing call interface with:
 * - Incoming call notifications
 * - Accept/reject controls
 * - Live transcription display
 * - Customer context sidebar
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { api } from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

function AgentWebRTCCall() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get session from navigation state or query params
    const incomingSession = location.state?.session;

    const [sessionId, setSessionId] = useState(incomingSession?.sessionId || null);
    const [status, setStatus] = useState(incomingSession ? 'incoming' : 'idle');
    const [callDuration, setCallDuration] = useState(0);
    const [transcript, setTranscript] = useState([]);
    const [customer, setCustomer] = useState(incomingSession?.customer || null);
    const [callerName, setCallerName] = useState(incomingSession?.callerName || null);
    const [summary, setSummary] = useState(null);
    const [pendingCalls, setPendingCalls] = useState([]);
    const [aiInsights, setAiInsights] = useState(null); // Live AI insights

    const timerRef = useRef(null);
    const transcriptRef = useRef(null);
    const listenerSocketRef = useRef(null);
    const speechRecognitionRef = useRef(null);

    // Speech recognition hook - must be called before useWebRTC to avoid hooks order issues
    const speechRecognition = useSpeechRecognition({
        onResult: (entry) => {
            setTranscript(prev => [...prev, {
                ...entry,
                speaker: 'agent'
            }]);
        }
    });

    // Store speech recognition in ref for use in callbacks
    useEffect(() => {
        speechRecognitionRef.current = speechRecognition;
    }, [speechRecognition]);

    // WebRTC hook - called unconditionally at top level (Rules of Hooks compliant)
    const {
        connectionState,
        isMuted,
        error: webrtcError,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        remoteAudioRef,
        socket // Get WebRTC socket
    } = useWebRTC({
        sessionId,
        role: 'agent',
        userId: user?._id,
        onConnectionChange: (state) => {
            if (state === 'connected') {
                setStatus('connected');
                startTimer();
                // Use ref to safely access speech recognition
                speechRecognitionRef.current?.startListening();
            }
        }
    });

    // Emit transcript chunks when socket and sessionId are available
    useEffect(() => {
        if (!socket || !sessionId) return;

        // Subscribe to transcript updates from speech recognition
        const lastTranscriptLength = { current: 0 };

        const checkAndEmitTranscript = () => {
            if (transcript.length > lastTranscriptLength.current) {
                const newEntries = transcript.slice(lastTranscriptLength.current);
                newEntries.forEach(entry => {
                    if (entry.speaker === 'agent') {
                        socket.emit('webrtc:transcript-chunk', {
                            sessionId,
                            text: entry.text,
                            speaker: 'agent',
                            timestamp: new Date()
                        });
                    }
                });
                lastTranscriptLength.current = transcript.length;
            }
        };

        checkAndEmitTranscript();
    }, [socket, sessionId, transcript]);

    // Listen for WebRTC events (transcript & insights)
    useEffect(() => {
        if (!socket) return;

        socket.on('webrtc:transcript-chunk', (data) => {
            // Agents receive all transcripts (client + agent)
            setTranscript(prev => [...prev, {
                text: data.text,
                speaker: data.speaker,
                timestamp: data.timestamp
            }]);
        });

        socket.on('webrtc:ai-insights', (data) => {
            console.log('🤖 AI Insights Update:', data.insights);
            setAiInsights(data.insights);
        });

        return () => {
            socket.off('webrtc:transcript-chunk');
            socket.off('webrtc:ai-insights');
        };
    }, [socket]);

    // Listen for incoming call requests
    useEffect(() => {
        if (!user?._id) return;

        console.log('🔌 Agent connecting to socket with user ID:', user._id);

        // Load existing pending calls first
        const loadPendingCalls = async () => {
            try {
                // Try to get pending calls for this agent
                const res = await api.get(`/webrtc/sessions/pending/${user._id}`);
                if (res.data.success && res.data.data.length > 0) {
                    console.log('📞 Found pending calls:', res.data.data);
                    setPendingCalls(res.data.data);
                }
            } catch (err) {
                console.log('No pending calls or error:', err.message);
            }
        };
        loadPendingCalls();

        // Also listen for new calls via socket
        listenerSocketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

        listenerSocketRef.current.on('connect', () => {
            console.log('✅ Socket connected, joining agent room:', user._id);
            // Join agent room for notifications - use user._id as the agent identifier
            listenerSocketRef.current.emit('agent:join', { agentId: user._id });
        });

        // Listen for direct calls
        listenerSocketRef.current.on('webrtc:call-request', (data) => {
            console.log('📞 Incoming call request:', data);
            setPendingCalls(prev => {
                if (prev.some(c => c.sessionId === data.sessionId)) return prev;
                return [...prev, data];
            });
        });

        // Listen for broadcast calls
        listenerSocketRef.current.on('webrtc:call-broadcast', (data) => {
            console.log('📞 Broadcast call request:', data);
            setPendingCalls(prev => {
                if (prev.some(c => c.sessionId === data.sessionId)) return prev;
                return [...prev, data];
            });
        });

        // Listen for calls taken by other agents
        listenerSocketRef.current.on('webrtc:call-taken', (data) => {
            console.log('✅ Call taken by agent:', data.agentId);
            setPendingCalls(prev => prev.filter(c => c.sessionId !== data.sessionId));
        });

        return () => {
            listenerSocketRef.current?.disconnect();
        };
    }, [user?._id]);

    // Handle accepting a call
    const handleAcceptCall = async (session) => {
        console.log('📞 Agent accepting call:', session.sessionId);
        setSessionId(session.sessionId);
        setCustomer(session.customer);
        setCallerName(session.callerName || session.customer?.name || 'Unknown Caller');
        setStatus('connecting');
        // Remove from pending list
        setPendingCalls(prev => prev.filter(c => c.sessionId !== session.sessionId));
        // Pass sessionId directly since state won't be updated yet
        await acceptCall(session.sessionId);
    };

    // Handle rejecting a call
    const handleRejectCall = (session) => {
        rejectCall('Agent busy', session.sessionId);
        setPendingCalls(prev => prev.filter(c => c.sessionId !== session.sessionId));
    };

    // Start call timer
    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    // Handle end call
    const handleEndCall = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        speechRecognition.stopListening();

        // Submit transcript
        if (sessionId && transcript.length > 0) {
            try {
                const res = await api.post(`/webrtc/sessions/${sessionId}/transcript`, {
                    transcript: transcript.map(t => ({
                        speaker: t.speaker,
                        text: t.text,
                        timestamp: t.timestamp
                    }))
                });
                if (res.data.success) {
                    setSummary(res.data.data.processedSummary);
                }
            } catch (err) {
                console.error('Error submitting transcript:', err);
            }
        }

        endCall();
        setStatus('ended');
    };

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f8fafc'
        }}>
            {/* Header */}
            <nav style={{
                background: 'rgba(15, 23, 42, 0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <button
                    onClick={() => {
                        if (status === 'connected') {
                            if (window.confirm('End the call?')) {
                                handleEndCall();
                                navigate('/agent/dashboard');
                            }
                        } else {
                            navigate('/agent/dashboard');
                        }
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '1.25rem'
                    }}
                >
                    ←
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                        🎧 Agent Call Center
                    </h1>
                    {status === 'connected' && (
                        <span style={{ fontSize: '0.875rem', color: '#10b981' }}>
                            🔴 {formatDuration(callDuration)}
                        </span>
                    )}
                </div>
            </nav>

            <audio ref={remoteAudioRef} autoPlay />

            <main style={{
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: status === 'connected' ? '1fr 300px' : '1fr',
                gap: '24px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Main call area */}
                <div>
                    {/* Idle - Show pending calls */}
                    {status === 'idle' && (
                        <div>
                            <h2 style={{ marginBottom: '24px' }}>Incoming Calls</h2>

                            {pendingCalls.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '60px 20px',
                                    background: 'rgba(30, 41, 59, 0.3)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📞</div>
                                    <p style={{ color: '#94a3b8' }}>No pending calls. Waiting for customers...</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {pendingCalls.map((call) => (
                                        <div key={call.sessionId} style={{
                                            background: 'rgba(30, 41, 59, 0.5)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            animation: 'glow 2s infinite'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>
                                                        📞 Incoming Call
                                                    </div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                                        {call.callerName || call.customer?.name || 'Unknown Caller'}
                                                        {call.callerPhone && (
                                                            <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                                                                📱 {call.callerPhone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button
                                                        onClick={() => handleAcceptCall(call)}
                                                        style={{
                                                            padding: '10px 24px',
                                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: 'white',
                                                            fontWeight: 500,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectCall(call)}
                                                        style={{
                                                            padding: '10px 24px',
                                                            background: 'rgba(239, 68, 68, 0.2)',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                            borderRadius: '8px',
                                                            color: '#f87171',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <style>{`@keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.3); } 50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }}`}</style>
                        </div>
                    )}

                    {/* Connecting */}
                    {status === 'connecting' && (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                border: '4px solid rgba(16, 185, 129, 0.2)',
                                borderTopColor: '#10b981',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 24px'
                            }} />
                            <h3>Connecting to customer...</h3>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                        </div>
                    )}

                    {/* Connected - Active call */}
                    {status === 'connected' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginBottom: '24px'
                            }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    animation: 'pulse 2s infinite'
                                }} />
                                <span style={{ fontWeight: 500 }}>On Call with {callerName || customer?.name || 'Customer'}</span>
                                <span style={{ color: '#94a3b8' }}>{formatDuration(callDuration)}</span>
                                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; }}`}</style>
                            </div>

                            {/* Transcript */}
                            <div style={{
                                background: 'rgba(30, 41, 59, 0.5)',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px',
                                height: '350px',
                                overflowY: 'auto'
                            }} ref={transcriptRef}>
                                <h4 style={{ color: '#94a3b8', marginBottom: '12px', fontSize: '0.875rem' }}>
                                    📝 Live Transcript
                                </h4>
                                {transcript.length === 0 && !speechRecognition.interimTranscript && (
                                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                                        Listening for speech...
                                    </p>
                                )}
                                {transcript.map((t, i) => (
                                    <div key={i} style={{
                                        marginBottom: '8px',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        background: t.speaker === 'agent'
                                            ? 'rgba(99, 102, 241, 0.1)'
                                            : 'rgba(16, 185, 129, 0.1)'
                                    }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: t.speaker === 'agent' ? '#818cf8' : '#10b981',
                                            fontWeight: 500
                                        }}>
                                            {t.speaker === 'agent' ? '🎧 Agent' : '👤 Client'}
                                        </span>
                                        <p style={{ margin: '4px 0 0' }}>{t.text}</p>
                                    </div>
                                ))}
                                {speechRecognition.interimTranscript && (
                                    <div style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(99, 102, 241, 0.05)',
                                        color: '#94a3b8',
                                        fontStyle: 'italic'
                                    }}>
                                        {speechRecognition.interimTranscript}...
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '16px'
                            }}>
                                <button
                                    onClick={toggleMute}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: isMuted ? '#ef4444' : 'rgba(51, 65, 85, 0.8)',
                                        color: 'white',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isMuted ? '🔇' : '🎤'}
                                </button>
                                <button
                                    onClick={handleEndCall}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📵
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Call ended */}
                    {status === 'ended' && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                margin: '0 auto 24px'
                            }}>
                                ✅
                            </div>
                            <h2>Call Completed</h2>
                            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                                Duration: {formatDuration(callDuration)}
                            </p>

                            {summary && (
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    textAlign: 'left',
                                    marginBottom: '24px',
                                    maxWidth: '600px',
                                    margin: '0 auto 24px'
                                }}>
                                    <h4 style={{ marginBottom: '12px' }}>📋 Call Summary</h4>
                                    <p style={{ color: '#94a3b8' }}>{summary.summary}</p>
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                                        <div>
                                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Intent:</span>
                                            <span style={{ marginLeft: '4px' }}>{summary.intent}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Sentiment:</span>
                                            <span style={{ marginLeft: '4px' }}>{summary.sentiment}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setStatus('idle');
                                    setTranscript([]);
                                    setCallDuration(0);
                                    setSummary(null);
                                }}
                                style={{
                                    padding: '12px 32px',
                                    background: 'rgba(99, 102, 241, 0.2)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    borderRadius: '8px',
                                    color: '#818cf8',
                                    cursor: 'pointer'
                                }}
                            >
                                Return to Queue
                            </button>
                        </div>
                    )}
                </div>

                {/* Customer context sidebar (when connected) */}
                {status === 'connected' && (customer || aiInsights) && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '12px',
                        padding: '20px',
                        height: 'fit-content'
                    }}>
                        {customer && (
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ marginBottom: '16px' }}>👤 Customer Info</h4>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Name</div>
                                    <div>{customer.name || 'Unknown'}</div>
                                </div>
                                {customer.company && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Company</div>
                                        <div>{customer.company}</div>
                                    </div>
                                )}
                                {customer.potentialLevel && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Potential</div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            background: customer.potentialLevel === 'high' ? 'rgba(16, 185, 129, 0.2)' :
                                                customer.potentialLevel === 'medium' ? 'rgba(234, 179, 8, 0.2)' :
                                                    'rgba(239, 68, 68, 0.2)',
                                            borderRadius: '4px',
                                            fontSize: '0.875rem'
                                        }}>{customer.potentialLevel}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {aiInsights && (
                            <div>
                                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ✨ Live Intelligence
                                </h4>

                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Detected Intent</div>
                                    <div style={{ fontWeight: 500 }}>{aiInsights.intent || 'Analyzing...'}</div>
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Sentiment</div>
                                    <div style={{
                                        color: aiInsights.sentiment?.toLowerCase().includes('positive') ? '#10b981' :
                                            aiInsights.sentiment?.toLowerCase().includes('negative') ? '#ef4444' : '#94a3b8'
                                    }}>
                                        {aiInsights.sentiment || 'Neutral'}
                                    </div>
                                </div>

                                {aiInsights.keyPoints && aiInsights.keyPoints.length > 0 && (
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '4px' }}>Key Points</div>
                                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.875rem' }}>
                                            {aiInsights.keyPoints.map((point, i) => (
                                                <li key={i} style={{ marginBottom: '4px' }}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Error display */}
                {webrtcError && (
                    <div style={{
                        gridColumn: '1 / -1',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: '#f87171'
                    }}>
                        ❌ {webrtcError}
                    </div>
                )}
            </main>
        </div>
    );
}

export default AgentWebRTCCall;
