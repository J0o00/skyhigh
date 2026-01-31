/**
 * Agent Dashboard
 * 
 * Main dashboard for agents to manage customer interactions.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import '../styles/BackButton.css';

const TiltButton = ({ children, onClick, className, style }) => {
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;

        const shimmer = ref.current.querySelector('.shimmer-button');
        if (shimmer) {
            shimmer.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4) 0%, transparent 60%)`;
            shimmer.style.opacity = 1;
        }
    };

    const handleMouseLeave = () => {
        if (!ref.current) return;
        ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        const shimmer = ref.current.querySelector('.shimmer-button');
        if (shimmer) {
            shimmer.style.opacity = 0;
        }
    };

    return (
        <button
            ref={ref}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden transition-all duration-200 ease-out transform-gpu ${className}`}
            style={{ transformStyle: 'preserve-3d', ...style }}
        >
            <div className="shimmer-button absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 z-10" />
            <div className="relative z-20 flex items-center gap-2">
                {children}
            </div>
        </button>
    );
};

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
        <div className="relative h-screen flex flex-col overflow-hidden font-sf-display-light">
            {/* Header */}
            <nav className="glass-defi border-b border-white/5 px-6 py-4 flex justify-between items-center z-50">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg style={{ width: '24px', height: '24px', color: '#f8fafc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0, letterSpacing: '0.1em' }}>
                        Agent Portal
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <TiltButton
                        onClick={() => navigate('/agent/webrtc-call')}
                        className="hover-pop glass-liquid px-5 py-2 transition-all text-sm font-medium"
                        style={{
                            borderRadius: '24px',
                            color: 'white',
                            letterSpacing: '0.03em'
                        }}
                    >
                        <img src="/white-phone-call-thin.svg" alt="Call" style={{ width: '16px', height: '16px' }} />
                        Call Center
                    </TiltButton>
                    <span className="text-white/60 text-sm">
                        {user?.name}
                    </span>
                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Inbox Sidebar */}
                <div className="w-80 glass-defi border-r border-white/5 flex flex-col">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <h2 className="text-white font-bold text-sm tracking-wide uppercase">
                            Inbox <span className="text-[#20e078]">({inbox.length})</span>
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-white/40 text-sm">Loading...</div>
                        ) : inbox.length === 0 ? (
                            <div className="p-8 text-center text-white/40 text-sm">No messages yet</div>
                        ) : (
                            inbox.map(item => (
                                <button
                                    key={item.customer._id}
                                    onClick={() => selectCustomer(item.customer._id)}
                                    className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${selectedCustomer === item.customer._id ? 'bg-white/10 border-l-2 border-l-[#20e078]' : 'border-l-2 border-l-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className={`font-medium ${selectedCustomer === item.customer._id ? 'text-white' : 'text-white/80'}`}>
                                            {item.customer.name}
                                        </span>
                                        <span className="text-xs text-white/40">
                                            {formatTime(item.latestInteraction.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-white/60 truncate pr-2 flex items-center gap-1">
                                            <span>
                                                {item.latestInteraction.channel === 'chat' && '💬'}
                                                {item.latestInteraction.channel === 'email' && '📧'}
                                                {item.latestInteraction.channel === 'phone' && '📞'}
                                            </span>
                                            {item.latestInteraction.summary?.substring(0, 25)}...
                                        </div>
                                        {item.unreadCount > 0 && (
                                            <span className="bg-[#20e078] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {item.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Customer Detail Panel */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {!selectedCustomer ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                            <div className="text-6xl mb-4 opacity-20">👋</div>
                            <p>Select a customer to view details</p>
                        </div>
                    ) : customerData ? (
                        <>
                            {/* Customer Header */}
                            <div className="p-6 border-b border-white/5 glass-liquid z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">
                                            {customerData.customer.name}
                                        </h2>
                                        <p className="text-white/50 text-sm flex gap-3">
                                            <span>📧 {customerData.customer.email}</span>
                                            <span className="text-white/20">|</span>
                                            <span>📞 {customerData.customer.phone || 'No Phone'}</span>
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${customerData.customer.potentialLevel === 'high' ? 'bg-[#20e078]/20 text-[#20e078]' :
                                        customerData.customer.potentialLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                            'bg-white/10 text-white/60'
                                        }`}>
                                        {customerData.customer.potentialLevel} Potential
                                    </div>
                                </div>

                                {/* Summary */}
                                {customerData.summary && (
                                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="text-xs font-bold text-[#20e078] mb-1 flex items-center gap-1">
                                            💡 AI Context Summary
                                        </div>
                                        <p className="text-sm text-white/80 leading-relaxed">
                                            {customerData.summary.briefSummary}
                                        </p>
                                        {customerData.summary.recommendedApproach && (
                                            <p className="mt-2 text-xs text-white/50 border-t border-white/5 pt-2">
                                                <strong className="text-white/70">Strategy:</strong> {customerData.summary.recommendedApproach}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Interactions */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
                                    History ({customerData.interactions?.length || 0})
                                </h3>

                                {customerData.interactions?.map(i => {
                                    // ... logic stays same ...
                                    let keyPoints = null;
                                    try { if (i.agentNotes) keyPoints = JSON.parse(i.agentNotes).keyPoints; } catch (e) { }

                                    const displaySummary = keyPoints?.briefSummary || (i.summary?.length > 150 ? i.summary.substring(0, 150) + '...' : i.summary);
                                    const displayIntent = keyPoints?.intent || i.intent?.toUpperCase() || 'GENERAL';
                                    const displayUrgency = keyPoints?.urgency || 'NORMAL';

                                    return (
                                        <div key={i._id} className={`p-4 rounded-xl border border-white/5 ${i.direction === 'inbound' ? 'bg-white/5' : 'bg-white/[0.02]'
                                            }`}>
                                            <div className="flex justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">
                                                        {i.channel === 'chat' ? '💬' : i.channel === 'email' ? '📧' : i.channel === 'phone' ? '📞' : '📝'}
                                                    </span>
                                                    <span className="text-xs font-medium text-white/60 uppercase">
                                                        {i.direction} • {i.channel}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-white/40 font-mono">
                                                    {formatTime(i.createdAt)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70">
                                                    {displayIntent}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${displayUrgency.includes('URGENT') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                    {displayUrgency}
                                                </span>
                                            </div>

                                            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                                                <p className="text-sm text-white/80 leading-relaxed">
                                                    {displaySummary || 'No summary available'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 border-t border-white/10 glass-defi z-20">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#20e078]/50 transition-colors resize-none mb-3"
                                    rows={2}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => sendReply('chat')}
                                        disabled={!replyText.trim() || sending}
                                        className="flex-1 btn-liquid py-2 text-xs opacity-90 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        💬 Chat Reply
                                    </button>
                                    <button
                                        onClick={() => sendReply('email')}
                                        disabled={!replyText.trim() || sending}
                                        className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        📧 Email Reply
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-white/40">
                            Loading customer data...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AgentDashboard;
