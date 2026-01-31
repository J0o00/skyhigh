/**
 * Customer WebRTC Call Page
 * 
 * Customer-facing call interface with:
 * - Call initiation
 * - Live transcription display
 * - Post-call summary
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { api } from '../services/api';

function CustomerWebRTCCall() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [sessionId, setSessionId] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, requesting, waiting, connected, ended
    const [callDuration, setCallDuration] = useState(0);
    const [agentTranscript, setAgentTranscript] = useState([]);
    const [summary, setSummary] = useState(null);
    const timerRef = useRef(null);
    const transcriptRef = useRef(null);

    // WebRTC hook
    const {
        connectionState,
        isMuted,
        error: webrtcError,
        startCall,
        endCall,
        toggleMute,
        remoteAudioRef
    } = useWebRTC({
        sessionId,
        role: 'customer',
        userId: user?._id,
        onConnectionChange: (state) => {
            if (state === 'connected') {
                setStatus('connected');
                startTimer();
                speechRecognition.startListening();
            }
        }
    });

    // Speech recognition hook
    const speechRecognition = useSpeechRecognition({
        onResult: (entry) => {
            // Add to our transcript with role
            setAgentTranscript(prev => [...prev, {
                ...entry,
                speaker: 'customer'
            }]);
        }
    });

    // Request a call with an available agent
    const requestCall = async () => {
        try {
            setStatus('requesting');

            // Get available agents - need to use User collection to match login IDs
            // Fetch users with role='agent' from auth/agents endpoint
            let agentId = null;

            try {
                // First try to get users with agent role
                const usersRes = await api.get('/auth/agents');
                const agentUsers = usersRes.data?.data || [];
                const availableAgent = agentUsers.find(a => a.isActive);
                if (availableAgent) {
                    agentId = availableAgent._id;
                    console.log('Found agent user:', availableAgent.name, agentId);
                }
            } catch (err) {
                console.log('Falling back to agents endpoint');
            }

            // Fallback: use agents endpoint (less reliable for ID matching)
            if (!agentId) {
                const agentsRes = await api.get('/agents');
                const agents = agentsRes.data?.data || [];
                const availableAgent = agents.find(a => a.isActive);
                if (availableAgent) {
                    agentId = availableAgent._id;
                }
            }

            if (!agentId) {
                alert('No agents available. Please try again later.');
                setStatus('idle');
                return;
            }

            // Create WebRTC session with caller name
            const res = await api.post('/webrtc/sessions', {
                customerUserId: user._id,
                callerName: user.name || user.email || 'Unknown Caller',
                callerPhone: user.phone,
                agentId: agentId
            });

            if (res.data.success) {
                const newSessionId = res.data.data.sessionId;
                console.log('📞 Created session:', newSessionId);
                setSessionId(newSessionId);
                setStatus('waiting');
                // Pass sessionId directly since state update is async
                await startCall(newSessionId);
            }
        } catch (err) {
            console.error('Error requesting call:', err);
            setStatus('idle');
            alert('Failed to request call. Please try again.');
        }
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

        // Combine transcripts
        const fullTranscript = agentTranscript.map(t => ({
            speaker: t.speaker,
            text: t.text,
            timestamp: t.timestamp
        }));

        // Submit transcript for processing
        if (sessionId && fullTranscript.length > 0) {
            try {
                const res = await api.post(`/webrtc/sessions/${sessionId}/transcript`, {
                    transcript: fullTranscript
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

    // Scroll transcript to bottom
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [agentTranscript]);

    // Cleanup on unmount
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
                                navigate('/client/dashboard');
                            }
                        } else {
                            navigate('/client/dashboard');
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
                        📞 WebRTC Voice Call
                    </h1>
                    {status === 'connected' && (
                        <span style={{ fontSize: '0.875rem', color: '#10b981' }}>
                            🔴 {formatDuration(callDuration)}
                        </span>
                    )}
                </div>
            </nav>

            {/* Remote audio element */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Main content */}
            <main style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

                {/* Idle state - Request call */}
                {status === 'idle' && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            margin: '0 auto 24px'
                        }}>
                            📞
                        </div>
                        <h2 style={{ marginBottom: '8px' }}>WebRTC Voice Call</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
                            Start a real-time voice call with our support team. Your voice will be transcribed live for better assistance.
                        </p>

                        {!speechRecognition.isSupported && (
                            <div style={{
                                background: 'rgba(234, 179, 8, 0.1)',
                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                marginBottom: '24px',
                                color: '#fbbf24'
                            }}>
                                ⚠️ Speech recognition not supported. Use Chrome or Edge for live transcription.
                            </div>
                        )}

                        <button
                            onClick={requestCall}
                            style={{
                                padding: '16px 48px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '50px',
                                color: 'white',
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Request Call
                        </button>
                    </div>
                )}

                {/* Waiting for agent */}
                {(status === 'requesting' || status === 'waiting') && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            border: '4px solid rgba(16, 185, 129, 0.2)',
                            borderTopColor: '#10b981',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 24px'
                        }} />
                        <h3>Connecting to agent...</h3>
                        <p style={{ color: '#94a3b8' }}>Please wait while we connect you with an available agent</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                    </div>
                )}

                {/* Connected - Active call */}
                {status === 'connected' && (
                    <div>
                        {/* Call status */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                            <span style={{ fontWeight: 500 }}>Connected with Agent</span>
                            <span style={{ color: '#94a3b8' }}>{formatDuration(callDuration)}</span>
                            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; }}`}</style>
                        </div>

                        {/* Live transcript */}
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '24px',
                            height: '300px',
                            overflowY: 'auto'
                        }} ref={transcriptRef}>
                            <h4 style={{ color: '#94a3b8', marginBottom: '12px', fontSize: '0.875rem' }}>
                                📝 Live Transcript
                            </h4>
                            {agentTranscript.length === 0 && !speechRecognition.interimTranscript && (
                                <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                                    Start speaking... your words will appear here.
                                </p>
                            )}
                            {agentTranscript.map((t, i) => (
                                <div key={i} style={{
                                    marginBottom: '8px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: t.speaker === 'customer'
                                        ? 'rgba(16, 185, 129, 0.1)'
                                        : 'rgba(99, 102, 241, 0.1)'
                                }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: t.speaker === 'customer' ? '#10b981' : '#818cf8',
                                        fontWeight: 500
                                    }}>
                                        {t.speaker === 'customer' ? '👤 You' : '🎧 Agent'}
                                    </span>
                                    <p style={{ margin: '4px 0 0' }}>{t.text}</p>
                                </div>
                            ))}
                            {speechRecognition.interimTranscript && (
                                <div style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(16, 185, 129, 0.05)',
                                    color: '#94a3b8',
                                    fontStyle: 'italic'
                                }}>
                                    {speechRecognition.interimTranscript}...
                                </div>
                            )}
                        </div>

                        {/* Call controls */}
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

                {/* Call ended - Show summary */}
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
                        <h2>Call Ended</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                            Duration: {formatDuration(callDuration)}
                        </p>

                        {summary && (
                            <div style={{
                                background: 'rgba(30, 41, 59, 0.5)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'left',
                                marginBottom: '24px'
                            }}>
                                <h4 style={{ marginBottom: '12px' }}>📋 Call Summary</h4>
                                <p style={{ color: '#94a3b8' }}>{summary.summary}</p>
                                {summary.keywords?.length > 0 && (
                                    <div style={{ marginTop: '12px' }}>
                                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Topics: </span>
                                        {summary.keywords.map((k, i) => (
                                            <span key={i} style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                background: 'rgba(99, 102, 241, 0.2)',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                marginRight: '6px'
                                            }}>{k}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/client/dashboard')}
                            style={{
                                padding: '12px 32px',
                                background: 'rgba(99, 102, 241, 0.2)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '8px',
                                color: '#818cf8',
                                cursor: 'pointer'
                            }}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}

                {/* Error display */}
                {webrtcError && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginTop: '16px',
                        color: '#f87171'
                    }}>
                        ❌ {webrtcError}
                    </div>
                )}
            </main>
        </div>
    );
}

export default CustomerWebRTCCall;
