import React, { useEffect, useRef, useState, useMemo } from 'react';

/**
 * Background Component - FINAL REBUILD
 * 
 * Matches the reference image: "White liquid light flowing slowly behind black glass."
 * 
 * Layers:
 * 1. Base Layer: Pure black → dark graphite with diagonal light falloff
 * 2. White Glossy Light Field: Large, soft, blurred white glow
 * 3. White Digital Vertical Lines: Semi-transparent, curved, fading
 * 4. Hover-Reveal Interaction: Lines reveal downward, bloom near cursor
 * 5. Depth & Glass Illusion: Layered opacity + blur
 */
const Background = () => {
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: '50%', y: '50%' });

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const x = e.clientX;
            const y = e.clientY;
            containerRef.current.style.setProperty('--mouse-x', `${x}px`);
            containerRef.current.style.setProperty('--mouse-y', `${y}px`);
            setMousePos({ x: `${x}px`, y: `${y}px` });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Generate digital vertical lines with organic, randomized properties
    const lines = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => {
            const left = 5 + Math.random() * 90; // 5% to 95% horizontal spread
            const height = 30 + Math.random() * 50; // 30% to 80% height
            const topOffset = Math.random() * 20; // Start position variation
            const animDuration = 12 + Math.random() * 18; // 12s to 30s
            const animDelay = Math.random() * 10;
            const opacity = 0.08 + Math.random() * 0.12; // 0.08 to 0.2
            const curveOffset = (Math.random() - 0.5) * 2; // Slight curve illusion via rotation

            return {
                id: i,
                left: `${left}%`,
                height: `${height}%`,
                topOffset: `${topOffset}%`,
                animDuration: `${animDuration}s`,
                animDelay: `${animDelay}s`,
                opacity,
                curveRotation: `${curveOffset}deg`,
            };
        });
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none"
            style={{
                '--mouse-x': '50vw',
                '--mouse-y': '50vh',
            }}
        >
            {/* ========== 1. BASE LAYER ========== */}
            {/* Pure black → dark graphite gradient with DIAGONAL light falloff (top-right → bottom-left) */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        linear-gradient(
                            135deg,
                            #0d0d0d 0%,
                            #0a0a0a 30%,
                            #050505 60%,
                            #020202 100%
                        )
                    `,
                }}
            />
            {/* Subtle diagonal light falloff overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: `
                        linear-gradient(
                            -45deg,
                            rgba(255, 255, 255, 0.03) 0%,
                            transparent 50%
                        )
                    `,
                }}
            />

            {/* ========== 2. WHITE GLOSSY LIGHT FIELD (MANDATORY) ========== */}
            {/* Large, soft, white glossy glow - visible immediately on load */}
            <div
                className="absolute"
                style={{
                    top: '-20%',
                    right: '-10%',
                    width: '80%',
                    height: '80%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)',
                    filter: 'blur(80px)',
                }}
            />
            <div
                className="absolute"
                style={{
                    top: '20%',
                    left: '10%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 50%)',
                    filter: 'blur(100px)',
                }}
            />
            {/* Cloud-like organic white glow in center */}
            <div
                className="absolute"
                style={{
                    top: '30%',
                    left: '30%',
                    width: '50%',
                    height: '50%',
                    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    opacity: 0.8,
                }}
            />

            {/* ========== 3. WHITE DIGITAL VERTICAL LINES ========== */}
            {/* Semi-transparent, slightly curved, soft glow edges, randomized */}
            <div className="absolute inset-0">
                {lines.map((line) => (
                    <div
                        key={line.id}
                        className="absolute"
                        style={{
                            left: line.left,
                            top: line.topOffset,
                            height: line.height,
                            width: '1px',
                            background: `linear-gradient(
                                to bottom,
                                transparent 0%,
                                rgba(255,255,255,${line.opacity}) 20%,
                                rgba(255,255,255,${line.opacity * 1.5}) 50%,
                                rgba(255,255,255,${line.opacity}) 80%,
                                transparent 100%
                            )`,
                            boxShadow: `0 0 8px rgba(255,255,255,${line.opacity * 0.5})`,
                            transform: `rotate(${line.curveRotation})`,
                            transformOrigin: 'top center',
                            animation: `line-pulse ${line.animDuration} ease-in-out infinite alternate`,
                            animationDelay: line.animDelay,
                        }}
                    >
                        {/* Falling light drop - reveals downward */}
                        <div
                            className="absolute w-[2px]"
                            style={{
                                left: '-0.5px',
                                top: '-20%',
                                height: '30%',
                                background: `linear-gradient(
                                    to bottom,
                                    transparent 0%,
                                    rgba(255,255,255,0.4) 70%,
                                    rgba(255,255,255,0.8) 100%
                                )`,
                                boxShadow: '0 0 12px rgba(255,255,255,0.5)',
                                animation: `drop-reveal ${line.animDuration} linear infinite`,
                                animationDelay: line.animDelay,
                            }}
                        >
                            {/* Drop head */}
                            <div
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] bg-white rounded-full"
                                style={{
                                    boxShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(255,255,255,0.5)',
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* ========== 4. HOVER-REVEAL INTERACTION ========== */}
            {/* Subtle bloom intensifies near cursor */}
            <div
                className="absolute inset-0 transition-opacity duration-1000"
                style={{
                    background: `
                        radial-gradient(
                            500px circle at var(--mouse-x) var(--mouse-y),
                            rgba(255, 255, 255, 0.12),
                            transparent 50%
                        )
                    `,
                    filter: 'blur(40px)',
                }}
            />
            {/* Inner bright core near cursor */}
            <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                    background: `
                        radial-gradient(
                            200px circle at var(--mouse-x) var(--mouse-y),
                            rgba(255, 255, 255, 0.2),
                            transparent 40%
                        )
                    `,
                    filter: 'blur(20px)',
                }}
            />

            {/* ========== 5. DEPTH & GLASS ILLUSION ========== */}
            {/* Soft vignette to create depth */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.8) 100%)',
                }}
            />

            {/* Subtle noise texture for glass feel */}
            <div
                className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* ========== ANIMATIONS ========== */}
            <style>{`
                @keyframes line-pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes drop-reveal {
                    0% { 
                        transform: translateY(0); 
                        opacity: 0; 
                    }
                    10% { 
                        opacity: 1; 
                    }
                    85% { 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateY(450%); 
                        opacity: 0; 
                    }
                }
            `}</style>
        </div>
    );
};

export default Background;
