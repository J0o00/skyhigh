import React from 'react';

/**
 * Background Component
 * 
 * Implements the "Northern Lights" Emerald/Mint theme using CSS gradients and animations.
 * Colors: Dark Green-Black (#0a0f0d), Neon Mint (#20e078).
 */
const Background = () => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0a0f0d]">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d] via-[#0f1c15] to-[#0a0f0d]" />

            {/* Northern Lights / Aurora Effect 1 */}
            <div
                className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-30 blur-[100px] animate-aurora-1"
                style={{
                    background: 'radial-gradient(circle at center, rgba(32, 224, 120, 0.4) 0%, transparent 50%)',
                    animation: 'aurora-flow 15s infinite alternate'
                }}
            />

            {/* Aurora Effect 2 (Offset) */}
            <div
                className="absolute top-[-30%] right-[-30%] w-[150%] h-[150%] opacity-20 blur-[80px]"
                style={{
                    background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.3) 0%, transparent 60%)',
                    animation: 'aurora-flow 20s infinite alternate-reverse'
                }}
            />

            {/* Subtle Grid or Noise if needed (Optional, keeping it clean for now) */}

            <style>{`
                @keyframes aurora-flow {
                    0% { transform: translate(0, 0) rotate(0deg) scale(1); }
                    50% { transform: translate(2%, 5%) rotate(2deg) scale(1.1); }
                    100% { transform: translate(-2%, -5%) rotate(-2deg) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Background;
