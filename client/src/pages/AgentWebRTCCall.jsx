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
import '../styles/BackButton.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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

    // WebRTC hook
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
                speechRecognition.startListening();
            }
        }
    });

    // Speech recognition hook
    const speechRecognition = useSpeechRecognition({
        onResult: (entry) => {
            const transcriptEntry = {
                text: entry.text,
                speaker: 'agent',
                timestamp: new Date()
            };

            // Add to local transcript
            setTranscript(prev => [...prev, transcriptEntry]);

            // Emit to server/peer so others can see it
            if (socket && sessionId) {
                socket.emit('webrtc:transcript-chunk', {
                    sessionId,
                    ...transcriptEntry
                });
            }
        }
    });

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
        <div className="relative min-h-screen bg-[#0a0f0d] text-white flex flex-col font-sf-display-light">
            {/* Header */}
            <nav className="glass-defi border-b border-white/5 px-6 py-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
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
                        className="hover-pop px-5 py-2 flex items-center gap-2 hover:bg-white/20 transition-all text-sm font-medium"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '24px',
                            color: 'white',
                            letterSpacing: '0.03em'
                        }}
                    >
                        <img src="/white-back-arrow.svg" alt="Back" style={{ width: '16px', height: '16px' }} />
                        Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg style={{ width: '24px', height: '24px', color: '#f8fafc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                        </svg>
                        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0, letterSpacing: '0.1em' }}>
                            Agent Call Center
                        </h1>
                    </div>
                </div>

                {status === 'connected' && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-red-400 font-mono font-bold tracking-widest text-sm">
                            LIVE {formatDuration(callDuration)}
                        </span>
                    </div>
                )}
            </nav>

            <audio ref={remoteAudioRef} autoPlay />

            <main className={`flex-1 p-6 grid gap-6 max-w-[1600px] mx-auto w-full ${status === 'connected' ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>

                {/* Main Call Area */}
                <div className="flex flex-col gap-6">
                    {/* Idle - Pending Calls */}
                    {status === 'idle' && (
                        <div className="glass-liquid rounded-3xl p-8 border border-white/5 min-h-[600px] flex flex-col">
                            <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/5 pb-4">
                                Incoming Queue <span className="text-[#20e078]">({pendingCalls.length})</span>
                            </h2>

                            {pendingCalls.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                    <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center text-4xl animate-pulse-slow">
                                        📡
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Systems Online</h3>
                                    <p className="text-white/60">Waiting for incoming signals...</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {pendingCalls.map((call) => (
                                        <div key={call.sessionId} className="glass-defi p-6 rounded-2xl border-l-4 border-l-[#20e078] relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-[#20e078]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-[#20e078]/20 flex items-center justify-center text-xl animate-bounce">
                                                        📞
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-white mb-1">
                                                            {call.callerName || call.customer?.name || 'Unknown Caller'}
                                                        </div>
                                                        <div className="text-sm text-[#20e078] font-mono">
                                                            INCOMING CALL REQUEST...
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => handleRejectCall(call)}
                                                        className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors uppercase tracking-wider font-bold text-xs"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        onClick={() => handleAcceptCall(call)}
                                                        className="btn-liquid px-8 py-3 flex items-center gap-2"
                                                    >
                                                        Accept Call
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Connecting */}
                    {status === 'connecting' && (
                        <div className="glass-liquid rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[600px]">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-[#20e078]/30 border-t-[#20e078] rounded-full animate-spin mb-8" />
                                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                                    🤝
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Establishing Secure Link</h3>
                            <p className="text-white/40 font-mono">Connecting to customer stream...</p>
                        </div>
                    )}

                    {/* Connected - Active Interface */}
                    {status === 'connected' && (
                        <div className="flex flex-col h-full gap-6">
                            {/* Live Transcript Panel */}
                            <div className="glass-defi flex-1 rounded-3xl p-6 border border-white/5 relative overflow-hidden flex flex-col min-h-[500px]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#20e078] to-transparent opacity-50" />
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="flex items-center gap-2 text-[#20e078] font-bold uppercase tracking-widest text-xs">
                                        <span className="w-2 h-2 rounded-full bg-[#20e078] animate-pulse" />
                                        Live Voice Transcription
                                    </h3>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/40 font-mono">EN-US</span>
                                        <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/40 font-mono">SECURE</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2" ref={transcriptRef}>
                                    {transcript.length === 0 && !speechRecognition.interimTranscript && (
                                        <div className="text-center py-20 text-white/20 italic">
                                            Waiting for voice activity...
                                        </div>
                                    )}
                                    {transcript.map((t, i) => (
                                        <div key={i} className={`flex ${t.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl p-4 ${t.speaker === 'agent'
                                                ? 'bg-[#20e078]/10 border border-[#20e078]/20 text-white'
                                                : 'bg-white/5 border border-white/10 text-white/90'
                                                }`}>
                                                <div className={`text-[10px] font-bold uppercase mb-1 tracking-wider ${t.speaker === 'agent' ? 'text-[#20e078] text-right' : 'text-cyan-400'
                                                    }`}>
                                                    {t.speaker === 'agent' ? 'YOU' : 'CUSTOMER'}
                                                </div>
                                                <p className="leading-relaxed">{t.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {speechRecognition.interimTranscript && (
                                        <div className="flex justify-start opacity-50">
                                            <div className="max-w-[80%] rounded-2xl p-4 bg-white/5 border border-dashed border-white/10">
                                                <p className="animate-pulse">{speechRecognition.interimTranscript}...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Control Bar */}
                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-6">
                                    <button
                                        onClick={toggleMute}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${isMuted
                                            ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                            : 'bg-white/10 text-white hover:bg-[#20e078] hover:text-black border border-white/10'
                                            }`}
                                    >
                                        {isMuted ? '🔇' : '🎤'}
                                    </button>
                                    <button
                                        onClick={handleEndCall}
                                        className="px-8 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all transform hover:scale-105"
                                    >
                                        End Interaction
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Call Ended - Summary */}
                    {status === 'ended' && (
                        <div className="glass-liquid rounded-3xl p-12 max-w-2xl mx-auto w-full text-center">
                            <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-4xl mx-auto mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                ✓
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Interaction Complete</h2>
                            <p className="text-white/40 font-mono mb-8">Duration: {formatDuration(callDuration)}</p>

                            {summary && (
                                <div className="text-left bg-black/40 rounded-xl p-6 border border-white/10 mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[#20e078] text-xl">✨</span>
                                        <h3 className="font-bold text-white">AI Session Summary</h3>
                                    </div>
                                    <p className="text-white/80 leading-relaxed mb-6">{summary.summary}</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="text-[10px] uppercase text-white/40 font-bold mb-1">Customer Intent</div>
                                            <div className="text-white font-medium">{summary.intent}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="text-[10px] uppercase text-white/40 font-bold mb-1">Sentiment</div>
                                            <div className="text-white font-medium">{summary.sentiment}</div>
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
                                className="btn-liquid px-8 py-3 w-full"
                            >
                                Return to Call Queue
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar - Context & AI (Connected only) */}
                {status === 'connected' && (
                    <div className="flex flex-col gap-6">
                        {/* Customer Card */}
                        <div className="glass-defi rounded-2xl p-6 border border-white/5">
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Customer Profile</h4>
                            {customer ? (
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                            {customer.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">{customer.name}</div>
                                            <div className="text-sm text-white/50">{customer.company || 'Individual Client'}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {customer.potentialLevel && (
                                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                <span className="text-sm text-white/60">Lead Potential</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${customer.potentialLevel === 'high' ? 'bg-[#20e078]/20 text-[#20e078]' :
                                                    customer.potentialLevel === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-white/40'
                                                    }`}>
                                                    {customer.potentialLevel}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                            <span className="text-sm text-white/60">Phone</span>
                                            <span className="text-sm text-white font-mono">{customer.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                            <span className="text-sm text-white/60">Email</span>
                                            <span className="text-sm text-white truncate max-w-[150px]" title={customer.email}>{customer.email}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-white/40 italic text-center py-4">Unknown Caller ID</div>
                            )}
                        </div>

                        {/* AI Insights Card */}
                        <div className="glass-defi flex-1 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <div className="text-6xl">✨</div>
                            </div>
                            <h4 className="text-xs font-bold text-[#20e078] uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="animate-pulse">⚡</span> Real-time Intelligence
                            </h4>

                            {aiInsights ? (
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-xs text-white/40 mb-1">Detected Intent</div>
                                        <div className="text-lg font-bold text-white">{aiInsights.intent}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-white/40 mb-1">Current Sentiment</div>
                                        <div className={`text-3xl font-bold ${aiInsights.sentiment?.toLowerCase().includes('positive') ? 'text-[#20e078]' :
                                            aiInsights.sentiment?.toLowerCase().includes('negative') ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                            {aiInsights.sentiment}
                                        </div>
                                    </div>

                                    {aiInsights.keyPoints?.length > 0 && (
                                        <div>
                                            <div className="text-xs text-white/40 mb-2">Key Topics</div>
                                            <div className="flex flex-wrap gap-2">
                                                {aiInsights.keyPoints.map((pt, i) => (
                                                    <span key={i} className="px-2 py-1 rounded-md bg-white/10 text-xs text-white/80 border border-white/5">
                                                        {pt}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-center text-white/20">
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 animate-spin-slow mb-4" />
                                    <p className="text-xs uppercase tracking-widest">Analyzing Speech Patterns...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AgentWebRTCCall;
