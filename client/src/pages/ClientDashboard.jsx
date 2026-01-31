/**
 * Client Dashboard
 * 
 * Main dashboard for logged-in clients with Chat, Email, Call options.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Widget with 3D Tilt Effect
const DashboardWidget = ({ opt, i, navigate }) => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation (max 15 degrees)
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        // Calculate shimmer intensity
        const shimmerOpacity = 0.4 + (Math.abs(rotateX) + Math.abs(rotateY)) / 40;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        // Update shimmer
        const shimmer = cardRef.current.querySelector('.shimmer-overlay');
        if (shimmer) {
            shimmer.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,${shimmerOpacity}) 0%, transparent 60%)`;
            shimmer.style.opacity = 1;
        }
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        const shimmer = cardRef.current.querySelector('.shimmer-overlay');
        if (shimmer) {
            shimmer.style.opacity = 0;
        }
    };

    return (
        <button
            ref={cardRef}
            onClick={() => navigate(opt.path)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="glass-liquid p-8 rounded-2xl text-center group transition-all duration-300 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] max-w-[350px] relative overflow-hidden transform-gpu"
            style={{
                animationDelay: `${i * 100}ms`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out'
            }}
        >
            {/* Shimmer Overlay */}
            <div className="shimmer-overlay absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 z-0" />

            <div className="relative z-10 pointer-events-none flex flex-col items-center">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 p-1">
                    {opt.image ? (
                        <img src={opt.image} alt={opt.title} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(32,224,120,0.5)]" />
                    ) : (
                        opt.icon
                    )}
                </div>
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#20e078] transition-colors">
                    {opt.title}
                </h2>
                <p className="text-white/50 text-sm">
                    {opt.description}
                </p>
            </div>
        </button>
    );
};

function ClientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const options = [
        {
            id: 'chat',
            title: 'Live Chat',
            image: '/white-chat-dots-thin.svg',
            description: 'Chat with our support team in real-time',
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            path: '/client/chat'
        },
        {
            id: 'email',
            title: 'Send Email',
            image: '/white-envelope-thin.svg',
            description: 'Send us an email inquiry',
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            path: '/client/email'
        },

        {
            id: 'webrtc',
            title: 'WebRTC Call',
            image: '/white-phone-call-thin.svg',
            description: 'Real-time voice call with live transcription',
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            path: '/client/webrtc-call'
        }
    ];

    return (
        <div className="relative min-h-screen">
            {/* Header */}
            <nav className="glass-defi border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="title-plain text-xl font-bold">
                    Echo
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-white/90 text-xl tracking-wide">
                        Welcome, <strong className="text-[#20e078] font-bold">{user?.name?.split(' ')[0]}</strong>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Welcome */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                        How can we help you today?
                    </h1>
                    <p className="text-white/60 text-lg">
                        Choose how you'd like to connect with us
                    </p>
                </div>

                {/* Options Grid */}
                <div className="flex flex-wrap justify-center gap-6">
                    {options.map((opt, i) => (
                        <DashboardWidget
                            key={opt.id}
                            opt={opt}
                            i={i}
                            navigate={navigate}
                        />
                    ))}
                </div>

                {/* Recent Interactions Preview */}
                <div className="mt-12 glass-defi rounded-2xl p-8 border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-[#20e078]">⚡</span> Your Recent Activity
                    </h3>
                    <p className="text-white/40 text-sm">
                        Start a conversation to see your interaction history here.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default ClientDashboard;
