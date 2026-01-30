/**
 * Agent Dashboard
 * 
 * Main dashboard for agents to manage customer interactions.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';

function AgentDashboard() {
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [inbox, setInbox] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerData, setCustomerData] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Load inbox
    useEffect(() => {
        async function loadInbox() {
            try {
                const response = await api.get('/agent/inbox');
                setInbox(response.data.data.inbox || []);
            } catch (err) {
                console.error('Failed to load inbox:', err);
            } finally {
                setLoading(false);
            }
        }
        loadInbox();
    }, []);

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;

        const handleNew = () => {
            // Reload inbox on new message
            api.get('/agent/inbox').then(res => setInbox(res.data.data.inbox || []));
        };

        socket.on('chat:new', handleNew);
        socket.on('email:new', handleNew);
        socket.on('call:new', handleNew);

        return () => {
            socket.off('chat:new', handleNew);
            socket.off('email:new', handleNew);
            socket.off('call:new', handleNew);
        };
    }, [socket]);

    // Load customer details
    const selectCustomer = async (customerId) => {
        setSelectedCustomer(customerId);
        try {
            const response = await api.get(`/agent/customer/${customerId}`);
            setCustomerData(response.data.data);
        } catch (err) {
            console.error('Failed to load customer:', err);
        }
    };

    // Send reply
    const sendReply = async (channel) => {
        if (!replyText.trim() || !selectedCustomer || sending) return;

        setSending(true);
        try {
            await api.post('/agent/reply', {
                agentId: user._id,
                customerId: selectedCustomer,
                channel,
                message: replyText.trim()
            });
            setReplyText('');
            // Reload customer data
            const response = await api.get(`/agent/customer/${selectedCustomer}`);
            setCustomerData(response.data.data);
        } catch (err) {
            console.error('Failed to send reply:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (ts) => {
        const date = new Date(ts);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div style={{
            height: '100vh',
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
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #818cf8 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    🎧 Agent Portal
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/agent/webrtc-call')}
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            border: 'none',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        🎧 Call Center
                    </button>
                    <span style={{ color: '#94a3b8' }}>{user?.name}</span>
                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#94a3b8',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Inbox Sidebar */}
                <div style={{
                    width: '320px',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    overflowY: 'auto',
                    background: 'rgba(15, 23, 42, 0.5)'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ color: '#f8fafc', fontSize: '1rem', margin: 0 }}>
                            Inbox ({inbox.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ padding: '24px', color: '#64748b', textAlign: 'center' }}>
                            Loading...
                        </div>
                    ) : inbox.length === 0 ? (
                        <div style={{ padding: '24px', color: '#64748b', textAlign: 'center' }}>
                            No messages yet
                        </div>
                    ) : (
                        inbox.map(item => (
                            <button
                                key={item.customer._id}
                                onClick={() => selectCustomer(item.customer._id)}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: selectedCustomer === item.customer._id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: '#f8fafc', fontWeight: 500 }}>{item.customer.name}</span>
                                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                        {formatTime(item.latestInteraction.createdAt)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                        {item.latestInteraction.channel === 'chat' && '💬'}
                                        {item.latestInteraction.channel === 'email' && '📧'}
                                        {item.latestInteraction.channel === 'phone' && '📞'}
                                        {' '}{item.latestInteraction.summary?.substring(0, 30)}...
                                    </span>
                                    {item.unreadCount > 0 && (
                                        <span style={{
                                            background: '#8b5cf6',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '12px'
                                        }}>
                                            {item.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Customer Detail Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {!selectedCustomer ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b'
                        }}>
                            Select a customer to view details
                        </div>
                    ) : customerData ? (
                        <>
                            {/* Customer Header */}
                            <div style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(30, 41, 59, 0.5)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <h2 style={{ color: '#f8fafc', margin: '0 0 4px 0' }}>
                                            {customerData.customer.name}
                                        </h2>
                                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>
                                            {customerData.customer.email} • {customerData.customer.phone}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '4px 12px',
                                        background: customerData.customer.potentialLevel === 'high' ? 'rgba(16, 185, 129, 0.15)' :
                                            customerData.customer.potentialLevel === 'medium' ? 'rgba(245, 158, 11, 0.15)' :
                                                'rgba(100, 116, 139, 0.15)',
                                        color: customerData.customer.potentialLevel === 'high' ? '#10b981' :
                                            customerData.customer.potentialLevel === 'medium' ? '#f59e0b' : '#64748b',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 600
                                    }}>
                                        {customerData.customer.potentialLevel} potential
                                    </div>
                                </div>

                                {/* Summary */}
                                {customerData.summary && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px',
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(139, 92, 246, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginBottom: '4px', fontWeight: 600 }}>
                                            💡 Context Summary
                                        </div>
                                        <p style={{ color: '#e2e8f0', margin: 0, fontSize: '0.875rem' }}>
                                            {customerData.summary.briefSummary}
                                        </p>
                                        {customerData.summary.recommendedApproach && (
                                            <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: '0.8125rem' }}>
                                                <strong>Tip:</strong> {customerData.summary.recommendedApproach}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Interactions */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                <h3 style={{ color: '#f8fafc', fontSize: '0.875rem', marginBottom: '16px' }}>
                                    Interaction History ({customerData.interactions?.length || 0})
                                </h3>

                                {customerData.interactions?.map(i => {
                                    // Parse key points if available
                                    let keyPoints = null;
                                    try {
                                        if (i.agentNotes) {
                                            const parsed = JSON.parse(i.agentNotes);
                                            keyPoints = parsed.keyPoints;
                                        }
                                    } catch (e) { }

                                    // Generate summary for non-email channels
                                    const getChannelIcon = () => {
                                        if (i.channel === 'chat') return '💬';
                                        if (i.channel === 'email') return '📧';
                                        if (i.channel === 'phone') return '📞';
                                        return '📝';
                                    };

                                    const getIntentColor = (intent) => {
                                        const colors = {
                                            'complaint': '#ef4444',
                                            'support': '#f59e0b',
                                            'inquiry': '#3b82f6',
                                            'purchase': '#10b981',
                                            'follow-up': '#8b5cf6'
                                        };
                                        return colors[intent] || '#64748b';
                                    };

                                    // Use key points if available, otherwise create basic summary
                                    const displaySummary = keyPoints?.briefSummary ||
                                        (i.summary?.length > 150 ? i.summary.substring(0, 150) + '...' : i.summary);
                                    const displayIntent = keyPoints?.intent || i.intent?.toUpperCase() || 'GENERAL';
                                    const displayUrgency = keyPoints?.urgency || '🟢 NORMAL';

                                    return (
                                        <div
                                            key={i._id}
                                            style={{
                                                marginBottom: '16px',
                                                padding: '14px',
                                                background: i.direction === 'inbound' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(139, 92, 246, 0.08)',
                                                borderRadius: '10px',
                                                borderLeft: `3px solid ${i.direction === 'inbound' ? '#06b6d4' : '#8b5cf6'}`
                                            }}
                                        >
                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>{getChannelIcon()}</span>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                                        {i.direction === 'inbound' ? 'Customer' : 'Agent'} • {i.channel}
                                                    </span>
                                                </div>
                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                    {formatTime(i.createdAt)}
                                                </span>
                                            </div>

                                            {/* Key Points Badges */}
                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    padding: '3px 10px',
                                                    background: `${getIntentColor(i.intent)}22`,
                                                    color: getIntentColor(i.intent),
                                                    borderRadius: '12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600
                                                }}>
                                                    {displayIntent}
                                                </span>
                                                <span style={{
                                                    padding: '3px 10px',
                                                    background: displayUrgency.includes('URGENT') ? 'rgba(239, 68, 68, 0.2)' :
                                                        displayUrgency.includes('HIGH') ? 'rgba(245, 158, 11, 0.2)' :
                                                            'rgba(16, 185, 129, 0.2)',
                                                    color: displayUrgency.includes('URGENT') ? '#fca5a5' :
                                                        displayUrgency.includes('HIGH') ? '#fcd34d' : '#6ee7b7',
                                                    borderRadius: '12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600
                                                }}>
                                                    {displayUrgency}
                                                </span>
                                                {keyPoints?.actionNeeded && (
                                                    <span style={{
                                                        padding: '3px 10px',
                                                        background: 'rgba(6, 182, 212, 0.2)',
                                                        color: '#67e8f9',
                                                        borderRadius: '12px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600
                                                    }}>
                                                        {keyPoints.actionNeeded}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Summary Only - No Raw Content */}
                                            <div style={{
                                                background: 'rgba(0,0,0,0.15)',
                                                padding: '12px',
                                                borderRadius: '8px'
                                            }}>
                                                <p style={{
                                                    color: '#e2e8f0',
                                                    margin: 0,
                                                    fontSize: '0.9rem',
                                                    lineHeight: '1.6'
                                                }}>
                                                    <strong style={{ color: '#a78bfa' }}>📋 Summary:</strong>{' '}
                                                    {displaySummary || 'No summary available'}
                                                </p>

                                                {/* Call duration if phone */}
                                                {i.channel === 'phone' && i.callDuration && (
                                                    <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: '0.8rem' }}>
                                                        ⏱️ Duration: {Math.floor(i.callDuration / 60)}m {i.callDuration % 60}s
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Box */}
                            <div style={{
                                padding: '16px 24px',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(30, 41, 59, 0.5)'
                            }}>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(15, 23, 42, 0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#f8fafc',
                                        resize: 'none',
                                        outline: 'none',
                                        marginBottom: '12px'
                                    }}
                                    rows={2}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => sendReply('chat')}
                                        disabled={!replyText.trim() || sending}
                                        style={{
                                            padding: '8px 16px',
                                            background: replyText.trim() ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : '#334155',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        💬 Chat Reply
                                    </button>
                                    <button
                                        onClick={() => sendReply('email')}
                                        disabled={!replyText.trim() || sending}
                                        style={{
                                            padding: '8px 16px',
                                            background: replyText.trim() ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#334155',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        📧 Email Reply
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b'
                        }}>
                            Loading customer...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AgentDashboard;
