/**
 * Login Page
 * 
 * Sign In and Sign Up for agents.
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'customer'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        let result;
        if (isSignUp) {
            if (!formData.name.trim()) {
                setError('Name is required');
                setLoading(false);
                return;
            }
            result = await signup(formData.name, formData.email, formData.role);
        } else {
            result = await login(formData.email);
        }

        if (!result.success) {
            setError(result.error);
        }

        setLoading(false);
    };

    // Quick login buttons for demo
    const demoAgents = [
        { name: 'Sarah Johnson', email: 'sarah@conversaiq.com' },
        { name: 'Michael Chen', email: 'michael@conversaiq.com' },
        { name: 'Emily Rodriguez', email: 'emily@conversaiq.com' }
    ];

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: 'var(--spacing-lg)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontFamily: "'SF Display Thin', var(--font-family)",
                        fontWeight: 100,
                        background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--accent-cyan) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        ConversaIQ
                    </h1>
                    <p className="text-secondary">
                        Context-Aware Customer Intelligence
                    </p>
                </div>

                {/* Toggle Sign In / Sign Up */}
                <div className="flex gap-sm mb-lg" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                    <button
                        type="button"
                        className={`btn ${!isSignUp ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                        onClick={() => setIsSignUp(false)}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className={`btn ${isSignUp ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                        onClick={() => setIsSignUp(true)}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Name (Sign Up only) */}
                    {isSignUp && (
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                required={isSignUp}
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                        />
                    </div>

                    {/* Role (Sign Up only) */}
                    {isSignUp && (
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                className="form-select"
                                value={formData.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                            >
                                <option value="customer">Customer</option>
                                <option value="agent">Agent</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: 'var(--error)',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            marginBottom: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.875rem'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                {/* Demo Quick Login (Sign In only) */}
                {!isSignUp && (
                    <div style={{ marginTop: 'var(--spacing-xl)' }}>
                        <p className="text-muted text-sm" style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
                            Demo Accounts (click to use)
                        </p>
                        <div className="flex flex-col gap-sm">
                            {demoAgents.map((agent) => (
                                <button
                                    key={agent.email}
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleChange('email', agent.email)}
                                    style={{ justifyContent: 'flex-start' }}
                                >
                                    <span style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--accent-violet) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}>
                                        {agent.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div className="text-primary font-medium">{agent.name}</div>
                                        <div className="text-muted text-xs">{agent.email}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Note */}
                <div style={{
                    marginTop: 'var(--spacing-xl)',
                    paddingTop: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <p className="text-muted text-xs">
                        {isSignUp
                            ? 'Already have an account? '
                            : "Don't have an account? "}
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-400)',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
