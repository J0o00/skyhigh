import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// LoginWidget moved OUTSIDE to prevent re-creation on every parent render
const LoginWidget = ({ role, title, formState, isExpanded, isDimmed, onToggle, onInputChange, onLogin, onBack }) => {
    return (
        <div
            className={`glass-liquid rounded-[24px] p-8 flex flex-col w-full max-w-[320px] transition-all duration-700 cursor-pointer
                ${isExpanded ? 'scale-105 shadow-[0_30px_80px_rgba(0,0,0,0.8)]' : 'hover:transform hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]'}
                ${isDimmed ? 'opacity-40 scale-95 blur-[2px]' : 'opacity-100'}
            `}
            onClick={onToggle}
        >
            <div className="text-center mb-6 relative">
                <div className={`inline-block p-4 rounded-full bg-white/5 backdrop-blur-md mb-4 transition-colors duration-500 ${isExpanded ? 'bg-white/20' : 'group-hover:bg-white/10'}`}>
                    <div className="w-8 h-8 flex items-center justify-center text-white/90">
                        {role === 'client' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                        {role === 'agent' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>}
                        {role === 'admin' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
                    </div>
                </div>
                <h2 className="text-xl font-medium text-white tracking-wide opacity-90">{title}</h2>
                {!isExpanded && <p className="text-xs text-white/40 mt-2 font-light tracking-widest uppercase">Tap to Access</p>}
            </div>

            <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <form
                    onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); onLogin(e, role); }}
                    className="space-y-4 flex flex-col pt-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="email"
                        className="input-liquid text-center"
                        placeholder="Email"
                        value={formState.email}
                        onChange={(e) => onInputChange(role, 'email', e.target.value)}
                    />

                    <input
                        type="password"
                        className="input-liquid text-center"
                        placeholder="Password"
                        value={formState.password}
                        onChange={(e) => onInputChange(role, 'password', e.target.value)}
                    />

                    {formState.error && (
                        <div className="text-red-300 text-xs text-center py-2 bg-red-500/10 rounded-lg">
                            {formState.error}
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={formState.loading}
                            className="btn-liquid"
                        >
                            {formState.loading ? '...' : 'Login'}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onBack(); }}
                            className="text-white/50 hover:text-white/80 text-sm transition-colors duration-300 py-2"
                        >
                            ← Back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function RoleSelect() {
    const navigate = useNavigate();
    const { login } = useAuth();

    // Track which role is currently selected/expanded
    const [selectedRole, setSelectedRole] = useState(null);

    // State for each login form
    const [clientForm, setClientForm] = useState({ email: '', password: '', loading: false, error: '' });
    const [agentForm, setAgentForm] = useState({ email: '', password: '', loading: false, error: '' });
    const [adminForm, setAdminForm] = useState({ email: '', password: '', loading: false, error: '' });

    const handleInputChange = (role, field, value) => {
        if (role === 'client') setClientForm(prev => ({ ...prev, [field]: value, error: '' }));
        if (role === 'agent') setAgentForm(prev => ({ ...prev, [field]: value, error: '' }));
        if (role === 'admin') setAdminForm(prev => ({ ...prev, [field]: value, error: '' }));
    };

    const handleLogin = async (e, role) => {
        e.preventDefault();

        let currentState, setState;
        if (role === 'client') { currentState = clientForm; setState = setClientForm; }
        else if (role === 'agent') { currentState = agentForm; setState = setAgentForm; }
        else if (role === 'admin') { currentState = adminForm; setState = setAdminForm; }

        setState(prev => ({ ...prev, loading: true, error: '' }));

        try {
            if (!currentState.email || !currentState.password) {
                throw new Error('Required');
            }
            await login(currentState.email, currentState.password, role);
            navigate(`/${role}/dashboard`);
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Invalid credentials'
            }));
        }
    };

    const toggleRole = (role) => {
        if (selectedRole === role) {
            setSelectedRole(null);
        } else {
            setSelectedRole(role);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 selection:bg-white/20">
            {/* Background blur overlay when login mode is selected */}
            {selectedRole && (
                <div
                    className="fixed inset-0 z-0 backdrop-blur-sm bg-black/30 transition-all duration-700"
                    onClick={() => setSelectedRole(null)}
                />
            )}
            {/* Background is now handled by the global Background component */}

            {/* Main Surface */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-[1400px]">

                {/* Floating Glass Title */}
                <div className="mb-24 relative group">
                    <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-1000"></div>
                    <h1 className="text-5xl md:text-6xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight pb-2 relative z-10"
                        style={{ textShadow: '0 0 30px rgba(255,255,255,0.1)' }}>
                        ConversaIQ
                    </h1>
                </div>

                {/* Pure Auth Widgets */}
                <div className="flex flex-col lg:flex-row gap-12 items-center justify-center w-full">
                    <LoginWidget
                        role="client"
                        title="Client"
                        formState={clientForm}
                        isExpanded={selectedRole === 'client'}
                        isDimmed={selectedRole && selectedRole !== 'client'}
                        onToggle={() => toggleRole('client')}
                        onInputChange={handleInputChange}
                        onLogin={handleLogin}
                        onBack={() => setSelectedRole(null)}
                    />

                    <LoginWidget
                        role="agent"
                        title="Agent"
                        formState={agentForm}
                        isExpanded={selectedRole === 'agent'}
                        isDimmed={selectedRole && selectedRole !== 'agent'}
                        onToggle={() => toggleRole('agent')}
                        onInputChange={handleInputChange}
                        onLogin={handleLogin}
                        onBack={() => setSelectedRole(null)}
                    />

                    <LoginWidget
                        role="admin"
                        title="Admin"
                        formState={adminForm}
                        isExpanded={selectedRole === 'admin'}
                        isDimmed={selectedRole && selectedRole !== 'admin'}
                        onToggle={() => toggleRole('admin')}
                        onInputChange={handleInputChange}
                        onLogin={handleLogin}
                        onBack={() => setSelectedRole(null)}
                    />
                </div>
            </div>
        </div>
    );
}

export default RoleSelect;
