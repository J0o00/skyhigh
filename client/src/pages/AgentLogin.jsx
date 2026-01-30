/**
 * Agent Login Page
 * 
 * Login for agents (no public registration)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AgentLogin() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.email || !formData.password) {
                throw new Error('Please enter email and password');
            }
            await login(formData.email, formData.password, 'agent');
            navigate('/agent/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px'
            }}>
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9375rem'
                    }}
                >
                    ← Back to roles
                </button>

                {/* Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    borderRadius: '20px',
                    padding: '40px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 16px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.75rem'
                        }}>
                            🎧
                        </div>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#f8fafc',
                            marginBottom: '4px'
                        }}>
                            Agent Portal
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '0.9375rem' }}>
                            Sign in to help customers
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="agent@company.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
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
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: loading ? '#475569' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p style={{
                        textAlign: 'center',
                        marginTop: '24px',
                        color: '#64748b',
                        fontSize: '0.875rem'
                    }}>
                        Agent accounts are created by admins
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AgentLogin;
