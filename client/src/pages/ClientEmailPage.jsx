/**
 * Client Email Page
 * 
 * Email compose interface for clients.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function ClientEmailPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ subject: '', message: '' });
    const [status, setStatus] = useState('compose'); // compose, sending, sent
    const [error, setError] = useState('');

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
        <div style={{
            minHeight: '100vh',
            background: '#0f172a'
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
                    onClick={() => navigate('/client/dashboard')}
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
                <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                    📧 Send Email
                </h1>
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
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                📤 Send Email
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
