/**
 * Role Select Page
 * 
 * Landing page with role selection: Client, Agent, Admin
 */

import { useNavigate } from 'react-router-dom';

const roles = [
    {
        id: 'client',
        title: 'Client',
        icon: '👤',
        description: 'Access support via Chat, Email, or Call',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        path: '/client/login'
    },
    {
        id: 'agent',
        title: 'Agent',
        icon: '🎧',
        description: 'Help customers and manage interactions',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        path: '/agent/login'
    },
    {
        id: 'admin',
        title: 'Admin',
        icon: '⚙️',
        description: 'Manage users, agents, and settings',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        path: '/admin/login'
    }
];

function RoleSelect() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            {/* Logo */}
            <div style={{
                marginBottom: '48px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px'
                }}>
                    ConversaIQ
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
                    Select how you'd like to continue
                </p>
            </div>

            {/* Role Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                maxWidth: '960px',
                width: '100%'
            }}>
                {roles.map(role => (
                    <button
                        key={role.id}
                        onClick={() => navigate(role.path)}
                        style={{
                            background: 'rgba(30, 41, 59, 0.7)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '32px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
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
                        {/* Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 20px',
                            borderRadius: '50%',
                            background: role.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem'
                        }}>
                            {role.icon}
                        </div>

                        {/* Title */}
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#f8fafc',
                            marginBottom: '8px'
                        }}>
                            {role.title}
                        </h2>

                        {/* Description */}
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '0.9375rem',
                            margin: 0
                        }}>
                            {role.description}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default RoleSelect;
