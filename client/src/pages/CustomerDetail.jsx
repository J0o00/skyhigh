/**
 * Customer Detail Page
 * 
 * Full customer profile with interactions and chat.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerApi, interactionApi } from '../services/api';

function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { agent } = useAuth();

    const [customer, setCustomer] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('profile');
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [sending, setSending] = useState(false);

    // Load customer data
    useEffect(() => {
        async function loadCustomer() {
            if (!id) return;

            try {
                setLoading(true);
                const response = await customerApi.getById(id);
                setCustomer(response.data.customer);
                setInteractions(response.data.recentInteractions || []);

                // Filter chat interactions for chat history
                const chats = (response.data.recentInteractions || [])
                    .filter(i => i.channel === 'chat')
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                setChatHistory(chats);
            } catch (err) {
                console.error('Error loading customer:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadCustomer();
    }, [id]);

    // Send chat message
    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim() || sending) return;

        setSending(true);
        try {
            // Create new interaction for the chat
            const newInteraction = {
                customerId: id,
                agentId: agent._id,
                channel: 'chat',
                direction: 'outbound',
                summary: chatMessage,
                outcome: 'positive'
            };

            await interactionApi.create(newInteraction);

            // Add to local chat history
            setChatHistory(prev => [...prev, {
                _id: Date.now(),
                channel: 'chat',
                direction: 'outbound',
                summary: chatMessage,
                timestamp: new Date().toISOString(),
                agentName: agent.name
            }]);

            setChatMessage('');
        } catch (err) {
            console.error('Error sending chat:', err);
        } finally {
            setSending(false);
        }
    };

    // Format date helper
    const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                color: '#94a3b8'
            }}>
                Loading customer...
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div style={{ textAlign: 'center', padding: '60px' }}>
                <h2 style={{ color: '#f8fafc' }}>Customer not found</h2>
                <p style={{ color: '#64748b', marginTop: '8px' }}>The customer you're looking for doesn't exist.</p>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: '24px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '8px 0',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                ← Back to Dashboard
            </button>

            {/* Customer Header Card */}
            <div style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        flexShrink: 0
                    }}>
                        {customer.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#f8fafc' }}>{customer.name}</h1>
                                <p style={{ margin: '4px 0 0', color: '#64748b' }}>{customer.company}</p>
                            </div>
                            {/* Potential Badge */}
                            <div style={{
                                padding: '6px 16px',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                background: customer.potentialLevel === 'high' ? 'rgba(16, 185, 129, 0.15)' :
                                    customer.potentialLevel === 'medium' ? 'rgba(245, 158, 11, 0.15)' :
                                        customer.potentialLevel === 'spam' ? 'rgba(239, 68, 68, 0.15)' :
                                            'rgba(107, 114, 128, 0.15)',
                                color: customer.potentialLevel === 'high' ? '#10b981' :
                                    customer.potentialLevel === 'medium' ? '#f59e0b' :
                                        customer.potentialLevel === 'spam' ? '#ef4444' :
                                            '#6b7280',
                                border: `1px solid ${customer.potentialLevel === 'high' ? 'rgba(16, 185, 129, 0.3)' :
                                        customer.potentialLevel === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
                                            customer.potentialLevel === 'spam' ? 'rgba(239, 68, 68, 0.3)' :
                                                'rgba(107, 114, 128, 0.3)'
                                    }`
                            }}>
                                {customer.potentialLevel} ({customer.potentialScore || 0}%)
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div style={{ display: 'flex', gap: '32px', marginTop: '16px', flexWrap: 'wrap' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Phone</span>
                                <span style={{ color: '#f8fafc', fontWeight: 500 }}>{customer.phone}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Email</span>
                                <span style={{ color: '#f8fafc', fontWeight: 500 }}>{customer.email || '-'}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Intent</span>
                                <span style={{ color: '#f8fafc', fontWeight: 500, textTransform: 'capitalize' }}>
                                    {customer.currentIntent}
                                </span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Interactions</span>
                                <span style={{ color: '#f8fafc', fontWeight: 500 }}>{customer.interactionCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {['profile', 'chat', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                            background: activeTab === tab
                                ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                                : 'rgba(51, 65, 85, 0.8)',
                            color: activeTab === tab ? 'white' : '#94a3b8'
                        }}
                    >
                        {tab === 'chat' && '💬 '}
                        {tab === 'history' && '📋 '}
                        {tab === 'profile' && '👤 '}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Keywords */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '20px'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Keywords & Tags</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {customer.keywords?.length > 0 ? (
                                customer.keywords.map((kw, idx) => (
                                    <span key={idx} style={{
                                        padding: '4px 12px',
                                        background: kw.sentiment === 'positive' ? 'rgba(16, 185, 129, 0.15)' :
                                            kw.sentiment === 'negative' ? 'rgba(239, 68, 68, 0.15)' :
                                                'rgba(51, 65, 85, 0.8)',
                                        color: kw.sentiment === 'positive' ? '#10b981' :
                                            kw.sentiment === 'negative' ? '#ef4444' :
                                                '#94a3b8',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem'
                                    }}>
                                        {kw.keyword}
                                    </span>
                                ))
                            ) : (
                                <span style={{ color: '#64748b' }}>No keywords added yet</span>
                            )}
                        </div>
                    </div>

                    {/* Preferences */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '20px'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Preferences</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Preferred Channel</span>
                                <p style={{ margin: '4px 0 0', color: '#f8fafc', textTransform: 'capitalize' }}>
                                    {customer.preferences?.preferredChannel || 'Not set'}
                                </p>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Best Time to Contact</span>
                                <p style={{ margin: '4px 0 0', color: '#f8fafc' }}>
                                    {customer.preferences?.bestTimeToContact || 'Not set'}
                                </p>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Language</span>
                                <p style={{ margin: '4px 0 0', color: '#f8fafc' }}>
                                    {customer.preferences?.language || 'English'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '20px',
                        gridColumn: 'span 2'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Context & Notes</h3>
                        <p style={{ color: '#94a3b8', margin: 0 }}>
                            {customer.contextSummary || 'No context summary available.'}
                        </p>
                        {customer.doNotMention?.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>⚠️ Do Not Mention:</span>
                                <p style={{ color: '#ef4444', margin: '4px 0 0' }}>
                                    {customer.doNotMention.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    height: '500px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Chat Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0, color: '#f8fafc' }}>💬 Chat with {customer.name}</h3>
                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                            {chatHistory.length} messages
                        </span>
                    </div>

                    {/* Chat Messages */}
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {chatHistory.length === 0 ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b'
                            }}>
                                No chat messages yet. Start a conversation!
                            </div>
                        ) : (
                            chatHistory.map((msg, idx) => (
                                <div
                                    key={msg._id || idx}
                                    style={{
                                        maxWidth: '70%',
                                        alignSelf: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                                        background: msg.direction === 'outbound'
                                            ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                                            : 'rgba(51, 65, 85, 0.8)',
                                        padding: '12px 16px',
                                        borderRadius: msg.direction === 'outbound'
                                            ? '12px 12px 4px 12px'
                                            : '12px 12px 12px 4px',
                                        color: '#f8fafc'
                                    }}
                                >
                                    <p style={{ margin: 0 }}>{msg.summary}</p>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: msg.direction === 'outbound' ? 'rgba(255,255,255,0.7)' : '#64748b',
                                        marginTop: '4px',
                                        display: 'block'
                                    }}>
                                        {formatDate(msg.timestamp)}
                                        {msg.direction === 'outbound' && msg.agentName && ` • ${msg.agentName}`}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Chat Input */}
                    <form
                        onSubmit={handleSendChat}
                        style={{
                            padding: '16px 20px',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            gap: '12px'
                        }}
                    >
                        <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            placeholder="Type your message..."
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                background: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                fontSize: '0.9375rem'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!chatMessage.trim() || sending}
                            style={{
                                padding: '12px 24px',
                                background: chatMessage.trim() && !sending
                                    ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                                    : 'rgba(51, 65, 85, 0.5)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontWeight: 500,
                                cursor: chatMessage.trim() && !sending ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'history' && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#f8fafc' }}>
                        Interaction History ({interactions.length})
                    </h3>

                    {interactions.length === 0 ? (
                        <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
                            No interactions recorded yet.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {interactions.map((interaction, idx) => (
                                <div
                                    key={interaction._id || idx}
                                    style={{
                                        padding: '16px',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        borderRadius: '8px',
                                        borderLeft: `3px solid ${interaction.channel === 'phone' ? '#10b981' :
                                                interaction.channel === 'email' ? '#f59e0b' :
                                                    '#06b6d4'
                                            }`
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{
                                            fontWeight: 600,
                                            color: '#f8fafc',
                                            textTransform: 'capitalize'
                                        }}>
                                            {interaction.channel === 'phone' && '📞'}
                                            {interaction.channel === 'email' && '📧'}
                                            {interaction.channel === 'chat' && '💬'}
                                            {' '}{interaction.channel} • {interaction.direction}
                                        </span>
                                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            {formatDate(interaction.timestamp)}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#94a3b8' }}>{interaction.summary}</p>
                                    {interaction.outcome && (
                                        <span style={{
                                            display: 'inline-block',
                                            marginTop: '8px',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            background: interaction.outcome === 'positive' ? 'rgba(16, 185, 129, 0.15)' :
                                                interaction.outcome === 'negative' ? 'rgba(239, 68, 68, 0.15)' :
                                                    'rgba(107, 114, 128, 0.15)',
                                            color: interaction.outcome === 'positive' ? '#10b981' :
                                                interaction.outcome === 'negative' ? '#ef4444' :
                                                    '#6b7280'
                                        }}>
                                            {interaction.outcome}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CustomerDetail;
