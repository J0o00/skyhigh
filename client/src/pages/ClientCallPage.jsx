/**
 * Client Call Page
 * 
 * Voice call interface using browser Text-to-Speech for MVP.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function ClientCallPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle'); // idle, recording, processing, speaking
    const [message, setMessage] = useState('');
    const [transcript, setTranscript] = useState([]);
    const [error, setError] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef(null);

    // Text-to-Speech setup
    const speak = (text) => {
        return new Promise((resolve) => {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1;
                utterance.onend = resolve;
                window.speechSynthesis.speak(utterance);
            } else {
                resolve();
            }
        });
    };

    // Start call simulation
    const startCall = async () => {
        setStatus('speaking');
        setError('');

        // Start timer
        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);

        // Welcome message
        const welcomeText = `Hello ${user?.name?.split(' ')[0] || 'there'}! Thank you for calling ConversaIQ support. How can I help you today?`;
        setTranscript([{ speaker: 'agent', text: welcomeText, time: new Date() }]);
        await speak(welcomeText);
        setStatus('recording');
    };

    // Send message (user types, simulating voice)
    const sendMessage = async () => {
        if (!message.trim()) return;

        const userText = message.trim();
        setMessage('');

        // Add user message
        setTranscript(prev => [...prev, { speaker: 'user', text: userText, time: new Date() }]);

        // Record interaction
        try {
            await api.post('/client/call', {
                userId: user._id,
                message: userText,
                duration: callDuration
            });
        } catch (err) {
            console.error('Failed to record:', err);
        }

        // Simulated agent response
        setStatus('processing');
        await new Promise(r => setTimeout(r, 1000));

        const responses = [
            "I understand. Let me look into that for you.",
            "Thank you for sharing that information. I'm here to help.",
            "I see. Is there anything else you'd like to add?",
            "That's noted. Our team will follow up on this.",
            "I appreciate your patience. Let me check that for you."
        ];
        const responseText = responses[Math.floor(Math.random() * responses.length)];

        setTranscript(prev => [...prev, { speaker: 'agent', text: responseText, time: new Date() }]);
        setStatus('speaking');
        await speak(responseText);
        setStatus('recording');
    };

    // End call
    const endCall = async () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        window.speechSynthesis.cancel();

        // Final message
        const goodbyeText = "Thank you for calling. Have a great day!";
        setTranscript(prev => [...prev, { speaker: 'agent', text: goodbyeText, time: new Date() }]);
        setStatus('speaking');
        await speak(goodbyeText);

        setStatus('idle');
        setTimeout(() => navigate('/client/dashboard'), 2000);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            window.speechSynthesis.cancel();
        };
    }, []);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column'
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
                        if (status !== 'idle') {
                            if (confirm('End call?')) {
                                window.speechSynthesis.cancel();
                                if (timerRef.current) clearInterval(timerRef.current);
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
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                        📞 Voice Call
                    </h1>
                    {status !== 'idle' && (
                        <span style={{ fontSize: '0.875rem', color: '#10b981' }}>
                            🔴 {formatDuration(callDuration)}
                        </span>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                {status === 'idle' && transcript.length === 0 && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
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
                            marginBottom: '24px'
                        }}>
                            📞
                        </div>
                        <h2 style={{ color: '#f8fafc', marginBottom: '8px' }}>Ready to Call?</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '32px', maxWidth: '300px' }}>
                            Start a voice call with our support team. Uses your browser's text-to-speech.
                        </p>
                        <button
                            onClick={startCall}
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
                            Start Call
                        </button>
                    </div>
                )}

                {(status !== 'idle' || transcript.length > 0) && (
                    <>
                        {/* Transcript */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            marginBottom: '16px'
                        }}>
                            {transcript.map((msg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.speaker === 'user' ? 'flex-end' : 'flex-start',
                                        marginBottom: '16px'
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '12px 16px',
                                        borderRadius: msg.speaker === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        background: msg.speaker === 'user'
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                            : 'rgba(51, 65, 85, 0.8)',
                                        color: '#f8fafc'
                                    }}>
                                        {msg.speaker === 'agent' && (
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                                                🎧 Support Agent
                                            </div>
                                        )}
                                        <p style={{ margin: 0 }}>{msg.text}</p>
                                    </div>
                                </div>
                            ))}

                            {status === 'processing' && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        background: 'rgba(51, 65, 85, 0.8)',
                                        color: '#94a3b8'
                                    }}>
                                        Thinking...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input (simulating voice) */}
                        {status === 'recording' && (
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type what you want to say..."
                                    style={{
                                        flex: 1,
                                        padding: '14px 18px',
                                        background: 'rgba(15, 23, 42, 0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '24px',
                                        color: '#f8fafc',
                                        fontSize: '0.9375rem',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!message.trim()}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: message.trim()
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                            : 'rgba(51, 65, 85, 0.5)',
                                        color: 'white',
                                        fontSize: '1.25rem',
                                        cursor: message.trim() ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    🎤
                                </button>
                                <button
                                    onClick={endCall}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '1.25rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📵
                                </button>
                            </div>
                        )}

                        {status === 'speaking' && (
                            <div style={{
                                textAlign: 'center',
                                padding: '16px',
                                color: '#94a3b8'
                            }}>
                                🔊 Agent is speaking...
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default ClientCallPage;
