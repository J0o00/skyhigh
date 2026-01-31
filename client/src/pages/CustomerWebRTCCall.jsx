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
import '../styles/BackButton.css';

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
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    // WebRTC hook
    const {
        connectionState,
        isMuted,
        error: webrtcError,
        startCall,
        endCall,
        toggleMute,
        remoteAudioRef,
        socket // Get socket instance
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
            const transcriptEntry = {
                text: entry.text,
                speaker: 'customer',
                timestamp: new Date()
            };

            // Add to our transcript locally
            setAgentTranscript(prev => [...prev, transcriptEntry]);

            // Emit to server for agent to receive
            if (socket && sessionId) {
                socket.emit('webrtc:transcript-chunk', {
                    sessionId,
                    ...transcriptEntry
                });
            }
        }
    });

    // Listen for agent transcripts
    useEffect(() => {
        if (!socket) return;

        socket.on('webrtc:transcript-chunk', (data) => {
            // Receive transcripts from agent
            setAgentTranscript(prev => [...prev, {
                text: data.text,
                speaker: data.speaker,
                timestamp: data.timestamp
            }]);
        });

        return () => {
            socket.off('webrtc:transcript-chunk');
        };
    }, [socket]);

    // Request a call with an available agent
    const requestCall = async () => {
        try {
            setStatus('requesting');

            // Create WebRTC session with caller name - broadcast to all agents
            const res = await api.post('/webrtc/sessions', {
                customerUserId: user._id,
                callerName: user.name || user.email || 'Unknown Caller',
                callerPhone: user.phone
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
        <div
            onMouseMove={handleMouseMove}
            className="relative min-h-screen text-white flex flex-col font-sf-display-light"
            style={{
                backgroundColor: '#0f172a',
                backgroundImage: `
                    radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.15), transparent 80%),
                    repeating-radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, transparent 0, transparent 20px, rgba(255,255,255,0.05) 21px, transparent 22px),
                    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
                backgroundPosition: '0 0, 0 0, center center, center center',
                backgroundRepeat: 'no-repeat, no-repeat, repeat, repeat',
                backgroundBlendMode: 'normal',
                transition: 'background-image 0s'
            }}
        >
            {/* Header */}
            <nav className="glass-defi border-b border-white/5 px-6 py-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
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
                        className="back-btn-crystalline"
                        style={{
                            cursor: 'pointer',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '8px'
                        }}
                    >
                        <img src="/white-back-arrow.svg" alt="Back" style={{ width: '24px', height: '24px' }} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="/white-phone-call-thin.svg" alt="Phone" style={{ width: '24px', height: '24px' }} />
                        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0, letterSpacing: '0.1em' }}>
                            WebRTC Call
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

            <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">

                {/* Idle state - Request call */}
                {status === 'idle' && (
                    <div className="glass-liquid rounded-3xl p-12 text-center max-w-lg w-full transform hover:scale-105 transition-all duration-500">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-float">
                            <img src="/white-phone-call-thin.svg" alt="Phone" style={{ width: '64px', height: '64px' }} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4" style={{ letterSpacing: '0.1em' }}>Support Line</h2>
                        <p className="text-white/60 mb-8 leading-relaxed" style={{ letterSpacing: '0.025em' }}>
                            Connect with a live agent instantly. Your conversation will be transcribed in real-time for better service.
                        </p>

                        {!speechRecognition.isSupported && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-amber-400 text-sm">
                                ⚠️ Speech recognition not supported. Please use Chrome or Edge.
                            </div>
                        )}

                        <button
                            onClick={requestCall}
                            className="hover-pop px-10 py-4 text-lg w-full flex items-center justify-center gap-2 group"
                            style={{
                                background: 'rgba(30, 41, 59, 0.8)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '24px',
                                color: 'white'
                            }}
                        >
                            <span className="group-hover:animate-pulse">Start Voice Call</span>
                        </button>
                    </div>
                )}

                {/* Waiting for agent */}
                {(status === 'requesting' || status === 'waiting') && (
                    <div className="glass-liquid rounded-3xl p-12 text-center max-w-lg w-full">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 border-4 border-[#20e078]/30 border-t-[#20e078] rounded-full animate-spin mx-auto" />
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">
                                ⏳
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: '0.05em' }}>Connecting...</h3>
                        <p className="text-white/40">Looking for an available agent to take your call.</p>
                        <div className="mt-8 flex justify-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#20e078] animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 rounded-full bg-[#20e078] animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 rounded-full bg-[#20e078] animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}

                {/* Connected - Active call */}
                {status === 'connected' && (
                    <div className="glass-defi w-full rounded-3xl p-8 border border-white/5 flex flex-col h-[70vh]">
                        {/* Call status banner */}
                        <div className="flex items-center justify-center gap-4 mb-8 pb-6 border-b border-white/5">
                            <div className="relative">
                                <div className="w-3 h-3 rounded-full bg-[#20e078]" />
                                <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#20e078] animate-ping" />
                            </div>
                            <span className="text-white font-medium text-lg">Connected with Agent</span>
                            <span className="px-3 py-1 rounded bg-white/5 text-white/40 font-mono text-sm">
                                {formatDuration(callDuration)}
                            </span>
                        </div>

                        {/* Live transcript */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 px-4 mb-6" ref={transcriptRef}>
                            <div className="text-center py-4 text-white/20 text-xs uppercase tracking-widest">
                                --- Conversation Started ---
                            </div>

                            {agentTranscript.length === 0 && !speechRecognition.interimTranscript && (
                                <div className="text-center py-12 text-white/20 italic">
                                    Start speaking... your words will appear here.
                                </div>
                            )}

                            {agentTranscript.map((t, i) => (
                                <div key={i} className={`flex ${t.speaker === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-4 ${t.speaker === 'customer'
                                        ? 'bg-[#20e078]/10 border border-[#20e078]/20 text-white'
                                        : 'bg-white/5 border border-white/10 text-white/90'
                                        }`}>
                                        <div className={`text-[10px] font-bold uppercase mb-1 tracking-wider ${t.speaker === 'customer' ? 'text-[#20e078] text-right' : 'text-purple-400'
                                            }`}>
                                            {t.speaker === 'customer' ? 'YOU' : 'AGENT'}
                                        </div>
                                        <p className="leading-relaxed">{t.text}</p>
                                    </div>
                                </div>
                            ))}
                            {speechRecognition.interimTranscript && (
                                <div className="flex justify-end opacity-50">
                                    <div className="max-w-[80%] rounded-2xl p-4 bg-white/5 border border-dashed border-white/10">
                                        <p className="animate-pulse">{speechRecognition.interimTranscript}...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Call controls */}
                        <div className="flex justify-center gap-6 pt-6 border-t border-white/5">
                            <button
                                onClick={toggleMute}
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all ${isMuted
                                    ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                    : 'bg-white/10 text-white hover:bg-[#20e078] hover:text-black border border-white/10 shadow-lg'
                                    }`}
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? '🔇' : '🎤'}
                            </button>
                            <button
                                onClick={handleEndCall}
                                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center text-xl hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all transform hover:scale-110"
                                title="End Call"
                            >
                                📞
                            </button>
                        </div>
                    </div>
                )}

                {/* Call ended - Show summary */}
                {status === 'ended' && (
                    <div className="glass-liquid rounded-3xl p-12 text-center max-w-lg w-full animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-4xl mx-auto mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            ✓
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Call Ended</h2>
                        <p className="text-white/40 font-mono mb-8">Duration: {formatDuration(callDuration)}</p>

                        {summary && (
                            <div className="text-left bg-black/40 rounded-xl p-6 border border-white/10 mb-8">
                                <h4 className="text-[#20e078] font-bold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <span>📝</span> Call Summary
                                </h4>
                                <p className="text-white/80 leading-relaxed text-sm mb-4">{summary.summary}</p>
                                {summary.keywords?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {summary.keywords.map((k, i) => (
                                            <span key={i} className="px-2 py-1 rounded bg-[#20e078]/10 text-[#20e078] text-xs border border-[#20e078]/20">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/client/dashboard')}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-xl transition-all hover:scale-105"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}

                {/* Error display */}
                {webrtcError && (
                    <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 animate-slide-up">
                        <span>❌</span>
                        {webrtcError}
                    </div>
                )}
            </main>
        </div>
    );
}

export default CustomerWebRTCCall;
