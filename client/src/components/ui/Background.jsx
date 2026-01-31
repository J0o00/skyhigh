import React from 'react';

/**
 * Background Component
 * 
 * Displays the static gradient background image as requested.
 * All dynamic effects (lines, drops, gradients) have been removed.
 */
const Background = () => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
            <img
                src="/background.jpg"
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Optional: Very subtle vignette to ensure text readability if needed, but keeping it raw as requested */}
            <div className="absolute inset-0 bg-black/20" />
        </div>
    );
};

export default Background;
