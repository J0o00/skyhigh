/**
 * Main App Component
 * 
 * Handles routing for all user roles: Client, Agent, Admin.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Landing
import RoleSelect from './pages/RoleSelect';

// Client Pages
import ClientLogin from './pages/ClientLogin';
import ClientDashboard from './pages/ClientDashboard';
import ClientChatPage from './pages/ClientChatPage';
import ClientEmailPage from './pages/ClientEmailPage';
import ClientCallPage from './pages/ClientCallPage';
import CustomerWebRTCCall from './pages/CustomerWebRTCCall';

// Agent Pages
import AgentLogin from './pages/AgentLogin';
import AgentDashboard from './pages/AgentDashboard';
import AgentWebRTCCall from './pages/AgentWebRTCCall';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    const { user, loading, isAuthenticated } = useAuth();

    // Loading state
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                color: '#f8fafc'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        margin: '0 auto 16px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTopColor: '#818cf8',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: '#94a3b8' }}>Loading...</p>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    // Protected route wrapper
    const ProtectedRoute = ({ children, allowedRoles }) => {
        if (!isAuthenticated) {
            return <Navigate to="/" replace />;
        }
        if (allowedRoles && !allowedRoles.includes(user?.role)) {
            return <Navigate to="/" replace />;
        }
        return children;
    };

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={
                isAuthenticated ? (
                    user?.role === 'client' ? <Navigate to="/client/dashboard" replace /> :
                        user?.role === 'agent' ? <Navigate to="/agent/dashboard" replace /> :
                            user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
                                <RoleSelect />
                ) : <RoleSelect />
            } />

            {/* Client Routes */}
            <Route path="/client/login" element={
                isAuthenticated && user?.role === 'client'
                    ? <Navigate to="/client/dashboard" replace />
                    : <ClientLogin />
            } />
            <Route path="/client/dashboard" element={
                <ProtectedRoute allowedRoles={['client']}>
                    <ClientDashboard />
                </ProtectedRoute>
            } />
            <Route path="/client/chat" element={
                <ProtectedRoute allowedRoles={['client']}>
                    <ClientChatPage />
                </ProtectedRoute>
            } />
            <Route path="/client/email" element={
                <ProtectedRoute allowedRoles={['client']}>
                    <ClientEmailPage />
                </ProtectedRoute>
            } />
            <Route path="/client/call" element={
                <ProtectedRoute allowedRoles={['client']}>
                    <ClientCallPage />
                </ProtectedRoute>
            } />
            <Route path="/client/webrtc-call" element={
                <ProtectedRoute allowedRoles={['client']}>
                    <CustomerWebRTCCall />
                </ProtectedRoute>
            } />

            {/* Agent Routes */}
            <Route path="/agent/login" element={
                isAuthenticated && user?.role === 'agent'
                    ? <Navigate to="/agent/dashboard" replace />
                    : <AgentLogin />
            } />
            <Route path="/agent/dashboard" element={
                <ProtectedRoute allowedRoles={['agent']}>
                    <AgentDashboard />
                </ProtectedRoute>
            } />
            <Route path="/agent/webrtc-call" element={
                <ProtectedRoute allowedRoles={['agent']}>
                    <AgentWebRTCCall />
                </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/login" element={
                isAuthenticated && user?.role === 'admin'
                    ? <Navigate to="/admin/dashboard" replace />
                    : <AdminLogin />
            } />
            <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
