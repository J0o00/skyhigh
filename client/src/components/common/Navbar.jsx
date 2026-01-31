/**
 * Navbar Component
 */

import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getInitials } from '../../utils';

function Navbar() {
    const { agent, logout } = useAuth();
    const { isConnected } = useSocket();

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                {/* Brand */}
                <div className="navbar-brand">
                    <span className="font-display title-plain text-xl">Echo</span>
                </div>

                {/* Status & User */}
                <div className="navbar-user">
                    {/* Connection Status */}
                    <div
                        className="tooltip"
                        data-tooltip={isConnected ? 'Real-time connected' : 'Disconnected'}
                    >
                        <span
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: isConnected ? 'var(--success)' : 'var(--error)',
                                display: 'inline-block'
                            }}
                        />
                    </div>

                    {/* Agent Info */}
                    {agent && (
                        <>
                            <span className="text-secondary text-sm">
                                {agent.name}
                            </span>
                            <div className="navbar-avatar">
                                {getInitials(agent.name)}
                            </div>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={logout}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
