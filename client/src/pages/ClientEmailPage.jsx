/**
 * Client Email Page
 * 
 * Email compose interface for clients.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../styles/BackButton.css';

function ClientEmailPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ subject: '', message: '' });
    const [status, setStatus] = useState('compose'); // compose, sending, sent
    const [error, setError] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject.trim() || !formData.message.trim()) {
            setError('Please fill in both subject and message');
            return;
        }

        setStatus('sending');
        setError('');

        try {
            await api.post('/client/email', {
                userId: user._id,
                subject: formData.subject.trim(),
                message: formData.message.trim()
            });
            setStatus('sent');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send email');
            setStatus('compose');
        }
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            className="font-sf-display-light"
            style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                backgroundImage: `
                    radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.15), transparent 80%),
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
            <nav style={{
                background: 'rgba(15, 23, 42, 0.95)',
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
                    <img src="/white-envelope-thin.svg" alt="Send Email" style={{ width: '24px', height: '24px' }} />
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0, letterSpacing: '0.05em' }}>
                        Send Email
                    </h1>
                </div>
            </nav>

            {/* Content */}
            <main style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
                {status === 'compose' && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.7)',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <form onSubmit={handleSubmit}>
                            {/* From */}
                            <div className="form-group">
                                <label className="form-label">From</label>
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}>
                                        {user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{user?.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{user?.email}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="What is this about?"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                                />
                            </div>

                            {/* Message */}
                            <div className="form-group">
                                <label className="form-label">Message *</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Type your message here..."
                                    rows={8}
                                    style={{ resize: 'vertical', minHeight: '150px' }}
                                    value={formData.message}
                                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '0.875rem'
                                }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="hover-pop"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '24px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontFamily: 'sans-serif'
                                }}
                            >
                                SEND
                            </button>
                        </form>
                    </div>
                )}

                {status === 'sending' && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.7)',
                        borderRadius: '16px',
                        padding: '64px',
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 24px',
                            borderRadius: '50%',
                            background: 'rgba(245, 158, 11, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem'
                        }}>
                            ✉️
                        </div>
                        <h2 style={{ color: '#f8fafc', marginBottom: '8px' }}>Sending...</h2>
                        <p style={{ color: '#94a3b8' }}>Please wait</p>
                    </div>
                )}

                {status === 'sent' && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.7)',
                        borderRadius: '16px',
                        padding: '64px',
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 24px',
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem'
                        }}>
                            ✅
                        </div>
                        <h2 style={{ color: '#f8fafc', marginBottom: '8px' }}>Email Sent!</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
                            We'll get back to you soon.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    setFormData({ subject: '', message: '' });
                                    setStatus('compose');
                                }}
                                style={{
                                    padding: '12px 24px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: '#94a3b8',
                                    cursor: 'pointer'
                                }}
                            >
                                Send Another
                            </button>
                            <button
                                onClick={() => navigate('/client/dashboard')}
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ClientEmailPage;
