import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// AuthWidget moved OUTSIDE to prevent re-creation on every parent render
const AuthWidget = ({
    role,
    title,
    formState,
    isExpanded,
    isDimmed,
    isSignup,
    onToggle,
    onInputChange,
    onSubmit,
    onBack,
    onToggleMode,
    canSignup = true
}) => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current || isExpanded) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation (max 15 degrees)
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        // Calculate shimmer intensity based on angle
        const shimmerOpacity = 0.15 + (Math.abs(rotateX) + Math.abs(rotateY)) / 80;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        cardRef.current.style.transition = 'transform 0.1s ease-out';

        // Update shimmer layer
        const shimmer = cardRef.current.querySelector('.shimmer-overlay');
        if (shimmer) {
            shimmer.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,${shimmerOpacity}) 0%, transparent 60%)`;
            shimmer.style.opacity = 1;
        }
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;

        cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        cardRef.current.style.transition = 'transform 0.5s ease-out';

        const shimmer = cardRef.current.querySelector('.shimmer-overlay');
        if (shimmer) {
            shimmer.style.opacity = 0;
        }
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`glass-liquid rounded-[24px] p-8 flex flex-col w-full max-w-[320px] transition-all duration-700 cursor-pointer relative overflow-hidden transform-gpu
                ${isExpanded ? 'scale-105' : ''}
                ${isDimmed ? 'opacity-40 scale-95 blur-[2px]' : 'opacity-100'}
            `}
            onClick={onToggle}
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Shimmer Overlay */}
            <div className="shimmer-overlay absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 z-0" />

            <div className="text-center mb-6 relative z-10 pointer-events-none">
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

            <div className={`transition-all duration-700 ease-in-out overflow-hidden relative z-20 ${isExpanded ? 'max-h-[450px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <form
                    onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); onSubmit(e, role); }}
                    className="space-y-4 flex flex-col pt-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Name field - only for signup */}
                    {isSignup && (
                        <input
                            type="text"
                            className="input-liquid text-center"
                            placeholder="Full Name"
                            value={formState.name || ''}
                            onChange={(e) => onInputChange(role, 'name', e.target.value)}
                        />
                    )}

                    <input
                        type="email"
                        className="input-liquid text-center"
                        placeholder="Email"
                        value={formState.email}
                        onChange={(e) => onInputChange(role, 'email', e.target.value)}
                    />

                    {/* Phone field - only for signup */}
                    {isSignup && (
                        <input
                            type="tel"
                            className="input-liquid text-center"
                            placeholder="Phone (optional)"
                            value={formState.phone || ''}
                            onChange={(e) => onInputChange(role, 'phone', e.target.value)}
                        />
                    )}

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

                    {formState.success && (
                        <div className="text-green-300 text-xs text-center py-2 bg-green-500/10 rounded-lg">
                            {formState.success}
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={formState.loading}
                            className="btn-liquid"
                        >
                            {formState.loading ? '...' : (isSignup ? 'Sign Up' : 'Login')}
                        </button>

                        {canSignup && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onToggleMode(); }}
                                className="text-white/60 hover:text-white/90 text-sm transition-colors duration-300 py-1"
                            >
                                {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onBack(); }}
                            className="text-white/40 hover:text-white/70 text-xs transition-colors duration-300 py-1"
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
    const { login, register } = useAuth();

    // Track which role is currently selected/expanded
    const [selectedRole, setSelectedRole] = useState(null);

    // Track signup mode per role
    const [signupMode, setSignupMode] = useState({
        client: false,
        agent: false,
        admin: false
    });

    // State for each form
    const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', password: '', loading: false, error: '', success: '' });
    const [agentForm, setAgentForm] = useState({ name: '', email: '', phone: '', password: '', loading: false, error: '', success: '' });
    const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '', loading: false, error: '', success: '' });

    const handleInputChange = (role, field, value) => {
        if (role === 'client') setClientForm(prev => ({ ...prev, [field]: value, error: '', success: '' }));
        if (role === 'agent') setAgentForm(prev => ({ ...prev, [field]: value, error: '', success: '' }));
        if (role === 'admin') setAdminForm(prev => ({ ...prev, [field]: value, error: '', success: '' }));
    };

    const handleSubmit = async (e, role) => {
        e.preventDefault();

        let currentState, setState;
        if (role === 'client') { currentState = clientForm; setState = setClientForm; }
        else if (role === 'agent') { currentState = agentForm; setState = setAgentForm; }
        else if (role === 'admin') { currentState = adminForm; setState = setAdminForm; }

        setState(prev => ({ ...prev, loading: true, error: '', success: '' }));

        const isSignup = signupMode[role];

        try {
            if (!currentState.email || !currentState.password) {
                throw new Error('Email and password are required');
            }

            if (isSignup) {
                if (!currentState.name) {
                    throw new Error('Name is required for signup');
                }
                await register(currentState.name, currentState.email, currentState.phone, currentState.password, role);
            } else {
                await login(currentState.email, currentState.password, role);
            }

            navigate(`/${role}/dashboard`);
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: err.response?.data?.message || err.message || (isSignup ? 'Signup failed' : 'Invalid credentials')
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

    const toggleSignupMode = (role) => {
        setSignupMode(prev => ({ ...prev, [role]: !prev[role] }));
        // Clear form errors when toggling
        if (role === 'client') setClientForm(prev => ({ ...prev, error: '', success: '' }));
        if (role === 'agent') setAgentForm(prev => ({ ...prev, error: '', success: '' }));
        if (role === 'admin') setAdminForm(prev => ({ ...prev, error: '', success: '' }));
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
                    <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-1000"></div>
                    <h1 className="title-glossy text-6xl md:text-8xl font-normal pb-4 relative z-10">
                        Echo
                    </h1>
                </div>

                {/* Pure Auth Widgets */}
                <div className="flex flex-col lg:flex-row gap-12 items-center justify-center w-full">
                    <AuthWidget
                        role="client"
                        title="Client"
                        formState={clientForm}
                        isExpanded={selectedRole === 'client'}
                        isDimmed={selectedRole && selectedRole !== 'client'}
                        isSignup={signupMode.client}
                        onToggle={() => toggleRole('client')}
                        onInputChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onBack={() => setSelectedRole(null)}
                        onToggleMode={() => toggleSignupMode('client')}
                    />

                    <AuthWidget
                        role="agent"
                        title="Agent"
                        formState={agentForm}
                        isExpanded={selectedRole === 'agent'}
                        isDimmed={selectedRole && selectedRole !== 'agent'}
                        isSignup={signupMode.agent}
                        onToggle={() => toggleRole('agent')}
                        onInputChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onBack={() => setSelectedRole(null)}
                        onToggleMode={() => toggleSignupMode('agent')}
                        canSignup={false}
                    />

                    <AuthWidget
                        role="admin"
                        title="Admin"
                        formState={adminForm}
                        isExpanded={selectedRole === 'admin'}
                        isDimmed={selectedRole && selectedRole !== 'admin'}
                        isSignup={signupMode.admin}
                        onToggle={() => toggleRole('admin')}
                        onInputChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onBack={() => setSelectedRole(null)}
                        onToggleMode={() => toggleSignupMode('admin')}
                        canSignup={false}
                    />
                </div>
            </div>
        </div>
    );
}

export default RoleSelect;
