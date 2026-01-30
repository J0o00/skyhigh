/**
 * Loading Spinner Component
 */

function Spinner({ size = 'default', text = '' }) {
    const sizeStyles = {
        small: { width: '16px', height: '16px' },
        default: { width: '24px', height: '24px' },
        large: { width: '40px', height: '40px' }
    };

    return (
        <div className="flex-center gap-md">
            <div className="spinner" style={sizeStyles[size]} />
            {text && <span className="text-secondary">{text}</span>}
        </div>
    );
}

export default Spinner;
