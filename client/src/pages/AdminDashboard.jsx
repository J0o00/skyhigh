/**
 * Admin Dashboard
 * 
 * Admin panel for managing users, agents, and viewing analytics.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../styles/BackButton.css';

const TiltCard = ({ children, className }) => {
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        const shimmerOpacity = 0.15 + (Math.abs(rotateX) + Math.abs(rotateY)) / 80;

        ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        const shimmer = ref.current.querySelector('.shimmer-card');
        if (shimmer) {
            shimmer.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,${shimmerOpacity}) 0%, transparent 60%)`;
            shimmer.style.opacity = 1;
        }
    };

    const handleMouseLeave = () => {
        if (!ref.current) return;
        ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        const shimmer = ref.current.querySelector('.shimmer-card');
        if (shimmer) {
            shimmer.style.opacity = 0;
        }
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden transition-all duration-200 ease-out transform-gpu ${className}`}
            style={{ transformStyle: 'preserve-3d' }}
        >
            <div className="shimmer-card absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 z-10" />
            <div className="relative z-20">
                {children}
            </div>
        </div>
    );
};

function AdminDashboard() {
    const { user, logout, register } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'agent' });
    const [error, setError] = useState('');

    // Load users
    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await api.get('/auth/users');
                setUsers(response.data.data.users || []);
            } catch (err) {
                console.error('Failed to load users:', err);
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, []);

    // Create user
    const createUser = async (e) => {
        e.preventDefault();
        setError('');

        if (!newUser.name || !newUser.email || !newUser.password) {
            setError('All fields are required');
            return;
        }

        try {
            await api.post('/auth/register', newUser);
            // Reload users
            const response = await api.get('/auth/users');
            setUsers(response.data.data.users || []);
            setShowCreateModal(false);
            setNewUser({ name: '', email: '', password: '', role: 'agent' });
        } catch (err) {
            console.error('Create user error:', err);
            const msg = err.response?.data?.error || err.message || 'Failed to create user';
            const details = err.response?.data ? JSON.stringify(err.response.data) : '';
            setError(msg + (details ? ` (${details})` : ''));
        }
    };

    const stats = {
        totalClients: users.filter(u => u.role === 'client').length,
        totalAgents: users.filter(u => u.role === 'agent').length,
        totalAdmins: users.filter(u => u.role === 'admin').length,
        onlineAgents: users.filter(u => u.role === 'agent' && u.isOnline).length
    };

    const tabs = [
        { id: 'users', label: 'All Users', icon: '👥' },
        { id: 'agents', label: 'Agents', icon: '🎧' },
        { id: 'clients', label: 'Clients', icon: '👤' }
    ];

    const filteredUsers = activeTab === 'users' ? users :
        activeTab === 'agents' ? users.filter(u => u.role === 'agent') :
            users.filter(u => u.role === 'client');

    return (
        <div className="relative min-h-screen font-sf-display-light">
            {/* Header */}
            <nav className="glass-defi border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg style={{ width: '24px', height: '24px', color: '#f8fafc' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', margin: 0, letterSpacing: '0.1em' }}>
                        Admin Portal
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-white/60 text-sm">{user?.name}</span>
                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Clients', value: stats.totalClients, color: 'text-cyan-400', from: 'from-cyan-500/20', to: 'to-cyan-500/5' },
                        { label: 'Total Agents', value: stats.totalAgents, color: 'text-[#20e078]', from: 'from-[#20e078]/20', to: 'to-[#20e078]/5' },
                        { label: 'Online Agents', value: stats.onlineAgents, color: 'text-emerald-400', from: 'from-emerald-500/20', to: 'to-emerald-500/5' },
                        { label: 'Admins', value: stats.totalAdmins, color: 'text-amber-400', from: 'from-amber-500/20', to: 'to-amber-500/5' }
                    ].map(stat => (
                        <TiltCard
                            key={stat.label}
                            className={`glass-liquid p-6 rounded-2xl border border-white/5 bg-gradient-to-br ${stat.from} ${stat.to}`}
                        >
                            <div className="text-white/60 text-sm mb-2 uppercase tracking-wide">
                                {stat.label}
                            </div>
                            <div className={`text-4xl font-bold ${stat.color} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                                {stat.value}
                            </div>
                        </TiltCard>
                    ))}
                </div>

                {/* Tabs & Content */}
                <div className="glass-defi rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-[500px]">
                    {/* Tab Header */}
                    <div className="flex border-b border-white/5 justify-between items-center px-6 bg-white/[0.02]">
                        <div className="flex gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-4 text-sm font-medium transition-all relative ${activeTab === tab.id
                                        ? 'text-[#20e078]'
                                        : 'text-white/40 hover:text-white/70'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {tab.icon} {tab.label}
                                    </span>
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#20e078] shadow-[0_0_10px_#20e078]" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="hover-pop glass-liquid px-5 py-2 text-sm flex items-center gap-2 font-medium transition-all"
                            style={{
                                borderRadius: '24px',
                                color: 'white',
                                letterSpacing: '0.03em'
                            }}
                        >
                            <span>+</span> Create User
                        </button>
                    </div>

                    {/* User List */}
                    <div className="p-6 overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-12 text-white/40 animate-pulse">
                                Loading data...
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12 text-white/40">
                                No users found
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                                            <th key={h} className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map((u, i) => (
                                        <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4 text-white font-medium group-hover:text-[#20e078] transition-colors">{u.name}</td>
                                            <td className="p-4 text-white/60">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-500' :
                                                    u.role === 'agent' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-cyan-500/20 text-cyan-400'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-2 text-xs font-bold ${u.isOnline ? 'text-emerald-400' : 'text-white/30'
                                                    }`}>
                                                    <span className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/20'
                                                        }`} />
                                                    {u.isOnline ? 'ONLINE' : 'OFFLINE'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-white/40 text-sm font-mono">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass-liquid w-full max-w-md p-8 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <h2 className="text-2xl font-bold text-white mb-6">Create New User</h2>

                        <form onSubmit={createUser} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">Name</label>
                                <input
                                    type="text"
                                    className="input-liquid w-full"
                                    value={newUser.name}
                                    onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">Email</label>
                                <input
                                    type="email"
                                    className="input-liquid w-full"
                                    value={newUser.email}
                                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">Password</label>
                                <input
                                    type="password"
                                    className="input-liquid w-full"
                                    value={newUser.password}
                                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                                />
                                <small style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                    Min 4 characters
                                </small>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">Role</label>
                                <select
                                    className="input-liquid w-full appearance-none"
                                    value={newUser.role}
                                    onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                                >
                                    <option value="client" className="bg-slate-900">Client</option>
                                    <option value="agent" className="bg-slate-900">Agent</option>
                                    <option value="admin" className="bg-slate-900">Admin</option>
                                </select>
                            </div>

                            {error && (
                                <div className="p-3 rounded bg-red-500/20 text-red-400 text-sm border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-liquid py-3"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
