/**
 * Client Login Page
 * 
 * Login/Register for customers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ClientLogin() {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, register } = useAuth();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isRegister) {
                if (!formData.name || !formData.email || !formData.password) {
                    throw new Error('Please fill all required fields');
                }
                await register(formData.name, formData.email, formData.phone, formData.password, 'client');
            } else {
                if (!formData.email || !formData.password) {
                    throw new Error('Please enter email and password');
                }
                await login(formData.email, formData.password, 'client');
            }
            navigate('/client/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Authentication failed');
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
                            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.75rem'
                        }}>
                            👤
                        </div>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#f8fafc',
                            marginBottom: '4px'
                        }}>
                            {isRegister ? 'Create Account' : 'Welcome Back'}
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '0.9375rem' }}>
                            {isRegister ? 'Sign up as a client' : 'Sign in to your account'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {isRegister && (
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>

                        {isRegister && (
                            <div className="form-group">
                                <label className="form-label">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Password *</label>
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
                                background: loading ? '#475569' : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p style={{
                        textAlign: 'center',
                        marginTop: '24px',
                        color: '#94a3b8',
                        fontSize: '0.9375rem'
                    }}>
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#06b6d4',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {isRegister ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ClientLogin;
