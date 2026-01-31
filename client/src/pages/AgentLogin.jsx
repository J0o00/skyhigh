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
        <div className="flex flex-col min-h-screen bg-black relative overflow-hidden items-center justify-center p-4 font-sans selection:bg-purple-500/30 selection:text-purple-500">
            {/* Ambient Mesh Gradient Background */}
            <div className="absolute inset-0 z-0 bg-cyber-grid pointer-events-none opacity-20"></div>

            {/* Atmospheric Background Blobs - Agent is Purple/Violet */}
            <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-blob-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none animate-blob-float [animation-delay:-5s]"></div>

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
                        <div className="w-20 h-20 mx-auto mb-6 rounded-[24px] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(168,85,247,0.15)] text-purple-500">
                            🎧
                        </div>
                        <h1 className="text-3xl font-nasalization text-white mb-2 tracking-wide">
                            Agent Workspace
                        </h1>
                        <p className="text-gray-400 text-sm font-medium tracking-wide">
                            Customer Support Access
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Email Address</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:bg-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                                    placeholder="agent@conversaiq.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-4">Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:bg-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
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
                                    : 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]'}`}
                        >
                            <span className="relative z-10">{loading ? 'Connecting...' : 'Enter Workspace'}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em] opacity-50">
                            Restricted to authorized personnel
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AgentLogin;

