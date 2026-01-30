/**
 * Admin Dashboard
 * 
 * Admin panel for managing users, agents, and viewing analytics.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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
            setError(err.response?.data?.error || 'Failed to create user');
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
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    ⚙️ Admin Portal
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#94a3b8' }}>{user?.name}</span>
                    <button
                        onClick={() => { logout(); navigate('/'); }}
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
            <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {[
                        { label: 'Total Clients', value: stats.totalClients, color: '#06b6d4' },
                        { label: 'Total Agents', value: stats.totalAgents, color: '#8b5cf6' },
                        { label: 'Online Agents', value: stats.onlineAgents, color: '#10b981' },
                        { label: 'Admins', value: stats.totalAdmins, color: '#f59e0b' }
                    ].map(stat => (
                        <div
                            key={stat.label}
                            style={{
                                background: 'rgba(30, 41, 59, 0.7)',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '8px' }}>
                                {stat.label}
                            </div>
                            <div style={{ color: stat.color, fontSize: '2rem', fontWeight: 700 }}>
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs & Content */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden'
                }}>
                    {/* Tab Header */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 16px'
                    }}>
                        <div style={{ display: 'flex' }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '16px 24px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
                                        color: activeTab === tab.id ? '#f8fafc' : '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '0.9375rem',
                                        fontWeight: activeTab === tab.id ? 600 : 400
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            + Create User
                        </button>
                    </div>

                    {/* User List */}
                    <div style={{ padding: '16px' }}>
                        {loading ? (
                            <div style={{ color: '#64748b', textAlign: 'center', padding: '48px' }}>
                                Loading...
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div style={{ color: '#64748b', textAlign: 'center', padding: '48px' }}>
                                No users found
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</th>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</th>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Role</th>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u._id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px', color: '#f8fafc' }}>{u.name}</td>
                                            <td style={{ padding: '12px', color: '#94a3b8' }}>{u.email}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: u.role === 'admin' ? 'rgba(245, 158, 11, 0.15)' :
                                                        u.role === 'agent' ? 'rgba(139, 92, 246, 0.15)' :
                                                            'rgba(6, 182, 212, 0.15)',
                                                    color: u.role === 'admin' ? '#f59e0b' :
                                                        u.role === 'agent' ? '#8b5cf6' : '#06b6d4'
                                                }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    color: u.isOnline ? '#10b981' : '#64748b',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    {u.isOnline ? '● Online' : '○ Offline'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', color: '#64748b', fontSize: '0.875rem' }}>
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
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1e293b',
                        borderRadius: '16px',
                        padding: '32px',
                        width: '400px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h2 style={{ color: '#f8fafc', marginBottom: '24px' }}>Create New User</h2>

                        <form onSubmit={createUser}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newUser.name}
                                    onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={newUser.email}
                                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={newUser.password}
                                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-input"
                                    value={newUser.role}
                                    onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                                >
                                    <option value="client">Client</option>
                                    <option value="agent">Agent</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {error && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#ef4444',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '0.875rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        color: '#94a3b8',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Create
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
