/**
 * Incoming Call Notification Component
 * 
 * Shows real-time call popup with instant context.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { formatPhone, getInitials } from '../../utils';
import PotentialBadge from '../common/PotentialBadge';

function IncomingCallNotification({ callData }) {
    const navigate = useNavigate();
    const { clearIncomingCall } = useSocket();
    const [callDuration, setCallDuration] = useState(0);
    const [isExpanded, setIsExpanded] = useState(true);

    const { customer, assist, callId } = callData;

    // Call timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleViewCustomer = () => {
        if (customer?._id) {
            navigate(`/customer/${customer._id}`);
        }
    };

    const handleMinimize = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="call-panel">
            {/* Header */}
            <div className="call-panel-header">
                <div className="flex-between">
                    <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                        <span className="pulse" style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#22c55e'
                        }} />
                        <span className="call-panel-title">
                            📞 Active Call
                        </span>
                        <span style={{
                            background: 'rgba(255,255,255,0.2)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}>
                            {formatDuration(callDuration)}
                        </span>
                    </div>
                    <button
                        onClick={handleMinimize}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {isExpanded ? '−' : '+'}
                    </button>
                </div>

                {/* Caller Info */}
                <div className="call-panel-subtitle" style={{ marginTop: 'var(--spacing-sm)' }}>
                    <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                        }}>
                            {customer?.name ? getInitials(customer.name) : '?'}
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', color: 'white' }}>
                                {customer?.name || 'Unknown Caller'}
                            </div>
                            <div>{formatPhone(customer?.phone)}</div>
                        </div>
                        {customer?.potentialLevel && (
                            <PotentialBadge level={customer.potentialLevel} />
                        )}
                    </div>
                </div>
            </div>

            {/* Body - Collapsible */}
            {isExpanded && (
                <div className="call-panel-body">
                    {/* Customer Status */}
                    {customer?.isNew ? (
                        <div className="badge badge-info mb-md" style={{ display: 'inline-block' }}>
                            🆕 NEW CUSTOMER
                        </div>
                    ) : customer?.company && (
                        <div className="text-secondary text-sm mb-md">
                            {customer.company}
                        </div>
                    )}

                    {/* Quick Context */}
                    {assist && (
                        <>
                            {/* Customer Summary */}
                            {assist.customerSummary && (
                                <div className="call-section">
                                    <div className="call-section-title">CONTEXT</div>
                                    <p className="text-sm">{assist.customerSummary}</p>
                                </div>
                            )}

                            {/* Call Objective */}
                            {assist.callObjective && (
                                <div className="call-section">
                                    <div className="call-section-title" style={{ color: 'var(--primary-400)' }}>
                                        🎯 OBJECTIVE
                                    </div>
                                    <p className="font-medium" style={{ color: 'var(--primary-400)' }}>
                                        {assist.callObjective}
                                    </p>
                                </div>
                            )}

                            {/* Talking Points */}
                            {assist.talkingPoints && assist.talkingPoints.length > 0 && (
                                <div className="call-section">
                                    <div className="call-section-title">TALKING POINTS</div>
                                    <ul className="call-points-list">
                                        {assist.talkingPoints.slice(0, 4).map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Points to Remember */}
                            {assist.pointsToRemember && assist.pointsToRemember.length > 0 && (
                                <div className="call-section">
                                    <div className="call-section-title" style={{ color: 'var(--success)' }}>
                                        ✓ REMEMBER
                                    </div>
                                    <ul className="call-points-list">
                                        {assist.pointsToRemember.map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Do Not Repeat */}
                            {assist.doNotRepeat && assist.doNotRepeat.length > 0 && (
                                <div className="call-section">
                                    <div className="call-section-title" style={{ color: 'var(--error)' }}>
                                        ⚠️ DON'T REPEAT
                                    </div>
                                    {assist.doNotRepeat.map((item, idx) => (
                                        <div key={idx} className="call-warning">{item}</div>
                                    ))}
                                </div>
                            )}

                            {/* Warning Flags */}
                            {assist.warningFlags && assist.warningFlags.length > 0 && (
                                <div className="call-section">
                                    {assist.warningFlags.map((flag, idx) => (
                                        <div
                                            key={idx}
                                            className="call-warning"
                                            style={{
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                borderColor: 'rgba(245, 158, 11, 0.3)',
                                                color: 'var(--warning)'
                                            }}
                                        >
                                            ⚡ {flag}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex gap-sm mt-lg">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleViewCustomer}
                            style={{ flex: 1 }}
                        >
                            View Full Profile
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={clearIncomingCall}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IncomingCallNotification;
