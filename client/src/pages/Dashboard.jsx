/**
 * Dashboard Page (Simplified for debugging)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerApi } from '../services/api';

function Dashboard() {
    const { agent } = useAuth();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadCustomers() {
            try {
                const response = await customerApi.getAll();
                setCustomers(response.data || []);
            } catch (err) {
                console.error('Error loading customers:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadCustomers();
    }, []);

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                    Dashboard
                </h1>
                <p style={{ color: '#94a3b8', marginTop: '8px' }}>
                    Welcome back, {agent?.name || 'Agent'}
                </p>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Customers</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>{customers.length}</div>
                </div>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>High Potential</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                        {customers.filter(c => c.potentialLevel === 'high').length}
                    </div>
                </div>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Medium Potential</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                        {customers.filter(c => c.potentialLevel === 'medium').length}
                    </div>
                </div>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Low Potential</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6b7280' }}>
                        {customers.filter(c => c.potentialLevel === 'low').length}
                    </div>
                </div>
            </div>

            {/* Loading/Error state */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Loading customers...
                </div>
            )}

            {error && (
                <div style={{
                    padding: '16px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    marginBottom: '24px'
                }}>
                    Error: {error}
                </div>
            )}

            {/* Customer List */}
            {!loading && !error && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', color: '#f8fafc' }}>
                        Customers
                    </h3>

                    {customers.length === 0 ? (
                        <div style={{ color: '#64748b', padding: '20px', textAlign: 'center' }}>
                            No customers found. Run `npm run seed` in the server directory.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {customers.map(customer => (
                                <div
                                    key={customer._id}
                                    onClick={() => navigate(`/customer/${customer._id}`)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        flexShrink: 0
                                    }}>
                                        {customer.name?.split(' ').map(n => n[0]).join('') || '?'}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{customer.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            {customer.company || customer.phone}
                                        </div>
                                    </div>

                                    {/* Potential Badge */}
                                    <div style={{
                                        padding: '4px 12px',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        background: customer.potentialLevel === 'high' ? 'rgba(16, 185, 129, 0.15)' :
                                            customer.potentialLevel === 'medium' ? 'rgba(245, 158, 11, 0.15)' :
                                                customer.potentialLevel === 'spam' ? 'rgba(239, 68, 68, 0.15)' :
                                                    'rgba(107, 114, 128, 0.15)',
                                        color: customer.potentialLevel === 'high' ? '#10b981' :
                                            customer.potentialLevel === 'medium' ? '#f59e0b' :
                                                customer.potentialLevel === 'spam' ? '#ef4444' :
                                                    '#6b7280',
                                        border: `1px solid ${customer.potentialLevel === 'high' ? 'rgba(16, 185, 129, 0.3)' :
                                                customer.potentialLevel === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
                                                    customer.potentialLevel === 'spam' ? 'rgba(239, 68, 68, 0.3)' :
                                                        'rgba(107, 114, 128, 0.3)'
                                            }`
                                    }}>
                                        {customer.potentialLevel}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
