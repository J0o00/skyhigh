/**
 * Potential Badge Component
 * 
 * Displays customer potential level with color coding.
 */

import { getPotentialClass } from '../../utils';

function PotentialBadge({ level, score, showScore = false, size = 'default' }) {
    const className = getPotentialClass(level);

    return (
        <span
            className={`badge ${className}`}
            style={size === 'large' ? { padding: '0.375rem 0.875rem', fontSize: '0.875rem' } : {}}
        >
            {level?.toUpperCase()}
            {showScore && score !== undefined && (
                <span style={{ marginLeft: '4px', opacity: 0.8 }}>
                    ({score})
                </span>
            )}
        </span>
    );
}

export default PotentialBadge;
