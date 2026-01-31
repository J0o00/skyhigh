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
        <div className="flex flex-col min-h-screen bg-black relative overflow-hidden items-center justify-center p-4 font-sans selection:bg-cyan-500/30 selection:text-cyan-500">
            {/* Ambient Mesh Gradient Background */}
            <div className="absolute inset-0 z-0 bg-cyber-grid pointer-events-none opacity-20"></div>

            {/* Atmospheric Background Blobs - Client is Cyan/Blue */}
            <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-blob-float"></div>
            <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-blob-float [animation-delay:-3s]"></div>

            <div className="relative z-10 w-full max-w-[440px] flex flex-col">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-xs font-bold uppercase tracking-widest self-start group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
                </button>

                {/* iOS Glass Card */}
                <div className="relative glass-ios rounded-[40px] p-10 shadow-2xl overflow-hidden isolation-auto">
                    {/* Header */}
                    <div className="text-center mb-10 relative z-10">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-[24px] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(0,212,255,0.15)] text-cyan-400">
                            👤
                        </div>
                        <h1 className="text-3xl font-nasalization text-white mb-2 tracking-wide">
                            {isRegister ? 'Create Account' : 'Client Portal'}
                        </h1>
                        <p className="text-gray-400 text-sm font-medium tracking-wide">
                            {isRegister ? 'Join our secure platform' : 'Access your dashboard'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                        {isRegister && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Full Name</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:bg-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Email Address</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:bg-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                            </div>
                        </div>

                        {isRegister && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Phone (Optional)</label>
                                <div className="relative group">
                                    <input
                                        type="tel"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:bg-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:bg-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2">
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-bold text-base tracking-wide shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden relative
                                ${loading
                                    ? 'bg-gray-800 cursor-not-allowed text-gray-500'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]'}`}
                        >
                            <span className="relative z-10">{loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Secure Login')}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </form>

                    {/* Toggle */}
                    <div className="mt-8 text-center relative z-10">
                        <p className="text-gray-400 text-xs font-medium">
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setError('');
                                }}
                                className="text-cyan-400 font-bold hover:text-white transition-colors ml-1 focus:outline-none uppercase tracking-wider text-[10px]"
                            >
                                {isRegister ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientLogin;

