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

// Shared Pages
import ConversationViewer from './pages/ConversationViewer';

import Background from './components/ui/Background';

function App() {
    const { user, loading, isAuthenticated } = useAuth();

    // Loading state
    if (loading) {
        return (
            <div className="page-wrapper-auth">
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 24px',
                        borderRadius: '50%',
                        border: '4px solid rgba(255, 255, 255, 0.1)',
                        borderTopColor: 'var(--primary-500)',
                        borderRightColor: 'var(--primary-600)',
                        animation: 'spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite',
                        boxShadow: '0 0 30px rgba(255, 78, 0, 0.2)'
                    }} />
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        letterSpacing: '0.05em',
                        animation: 'pulse 2s infinite'
                    }}>
                        INITIALIZING SYSTEM...
                    </p>
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                        @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.5; }
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
        <>
            <Background />
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
                <Route path="/agent/conversations" element={
                    <ProtectedRoute allowedRoles={['agent']}>
                        <ConversationViewer />
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
                <Route path="/admin/conversations" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ConversationViewer />
                    </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
