/**
 * Client Dashboard
 * 
 * Main dashboard for logged-in clients with Chat, Email, Call options.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ClientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const options = [
        {
            id: 'chat',
            title: 'Live Chat',
            icon: '💬',
            description: 'Chat with our support team in real-time',
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            path: '/client/chat'
        },
        {
            id: 'email',
            title: 'Send Email',
            icon: '📧',
            description: 'Send us an email inquiry',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            path: '/client/email'
        },
        {
            id: 'call',
            title: 'Voice Call',
            icon: '📞',
            description: 'Start a voice call with support',
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            path: '/client/call'
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
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
                    background: 'linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    ConversaIQ
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#94a3b8' }}>
                        Welcome, <strong style={{ color: '#f8fafc' }}>{user?.name?.split(' ')[0]}</strong>
                    </span>
                    <button
                        onClick={handleLogout}
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
            <main style={{
                maxWidth: '1000px',
                margin: '0 auto',
                padding: '48px 24px'
            }}>
                {/* Welcome */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#f8fafc',
                        marginBottom: '8px'
                    }}>
                        How can we help you today?
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
                        Choose how you'd like to connect with us
                    </p>
                </div>

                {/* Options Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px'
                }}>
                    {options.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => navigate(opt.path)}
                            style={{
                                background: 'rgba(30, 41, 59, 0.7)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '32px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            }}
                        >
                            <div style={{
                                width: '72px',
                                height: '72px',
                                margin: '0 auto 16px',
                                borderRadius: '50%',
                                background: opt.gradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem'
                            }}>
                                {opt.icon}
                            </div>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: '#f8fafc',
                                marginBottom: '8px'
                            }}>
                                {opt.title}
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.9375rem', margin: 0 }}>
                                {opt.description}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Recent Interactions Preview */}
                <div style={{
                    marginTop: '48px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#f8fafc',
                        marginBottom: '16px'
                    }}>
                        Your Recent Activity
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
                        Start a conversation to see your interaction history here.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default ClientDashboard;
