/**
 * Client Chat Page
 * 
 * Real-time chat interface for clients.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';

import '../styles/BackButton.css';

function ClientChatPage() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    // Load chat history
    useEffect(() => {
        async function loadHistory() {
            try {
                const response = await api.get(`/client/${user._id}/history?channel=chat`);
                const interactions = response.data.data.interactions || [];
                setMessages(interactions.map(i => ({
                    id: i._id,
                    text: i.content || i.summary,
                    direction: i.direction,
                    timestamp: i.createdAt,
                    agentName: i.direction === 'outbound' ? 'Support' : null
                })).reverse());
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setLoading(false);
            }
        }
        if (user?._id) loadHistory();
    }, [user]);

    // Listen for replies
    useEffect(() => {
        if (!socket) return;

        const handleReply = (data) => {
            if (data.customerId === user?.customerId) {
                setMessages(prev => [...prev, {
                    id: data.interactionId,
                    text: data.message,
                    direction: 'outbound',
                    timestamp: data.timestamp,
                    agentName: data.agentName
                }]);
            }
        };

        socket.on('chat:reply', handleReply);
        return () => socket.off('chat:reply', handleReply);
    }, [socket, user]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const text = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Optimistic update
        const tempId = `temp_${Date.now()}`;
        setMessages(prev => [...prev, {
            id: tempId,
            text,
            direction: 'inbound',
            timestamp: new Date().toISOString()
        }]);

        try {
            await api.post('/client/chat', {
                userId: user._id,
                message: text
            });
        } catch (err) {
            console.error('Send failed:', err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setSending(false);
        }
    };

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            style={{
                height: '100vh',
                backgroundColor: '#0f172a',
                backgroundImage: `
                    radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.15), transparent 80%),
                    repeating-radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, transparent 0, transparent 20px, rgba(255,255,255,0.05) 21px, transparent 22px),
                    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
                backgroundPosition: '0 0, 0 0, center center, center center',
                backgroundRepeat: 'no-repeat, no-repeat, repeat, repeat',
                backgroundBlendMode: 'normal',
                transition: 'background-image 0s', // Instant update for responsiveness
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <nav style={{
                background: 'rgba(15, 23, 42, 0.2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <button
                    onClick={() => navigate('/client/dashboard')}
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
                    <img src="/white-chat-dots-thin.svg" alt="Chat" style={{ width: '24px', height: '24px' }} />
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                        Live Chat
                    </h1>
                </div>
            </nav>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {loading ? (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: '48px' }}>
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ color: '#ffffff', textAlign: 'center', padding: '48px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
                        <p>Start a conversation!</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            style={{
                                maxWidth: '75%',
                                alignSelf: msg.direction === 'inbound' ? 'flex-end' : 'flex-start'
                            }}
                        >
                            {msg.direction === 'outbound' && msg.agentName && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                                    {msg.agentName}
                                </div>
                            )}
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: msg.direction === 'inbound' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                background: msg.direction === 'inbound'
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : 'rgba(51, 65, 85, 0.8)',
                                color: '#f8fafc'
                            }}>
                                {msg.text}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#64748b',
                                marginTop: '4px',
                                textAlign: msg.direction === 'inbound' ? 'right' : 'left'
                            }}>
                                {formatTime(msg.timestamp)}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={sendMessage}
                style={{
                    padding: '16px 24px',
                    background: 'rgba(30, 41, 59, 0.2)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    gap: '12px'
                }}
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
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
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="hover-pop"
                    style={{
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        color: 'white',
                        fontSize: '1.25rem',
                        cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                        opacity: newMessage.trim() && !sending ? 1 : 0.5,
                        transition: 'all 0.2s ease'
                    }}
                >
                    ➤
                </button>
            </form >
        </div >
    );
}

export default ClientChatPage;
