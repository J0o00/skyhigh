/**
 * Simulate Call Panel Component
 * 
 * Allows simulating incoming call events for demo.
 */

import { useState } from 'react';
import { callApi } from '../../services/api';

function SimulateCallPanel({ agentId, onClose }) {
    const [phone, setPhone] = useState('+919876543210');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const demoNumbers = [
        { name: 'Rajesh Sharma (High)', phone: '+919876543210' },
        { name: 'Priya Patel (Medium)', phone: '+919876543211' },
        { name: 'Amit Kumar (High)', phone: '+919876543212' },
        { name: 'New Customer', phone: '+919999999999' }
    ];

    const handleSimulate = async () => {
        if (!phone) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await callApi.triggerCall(agentId, phone);
            setResult(response);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to simulate call');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex-between mb-md">
                <h3>📞 Simulate Incoming Call</h3>
                <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
            </div>

            <p className="text-secondary text-sm mb-md">
                This simulates a telephony integration sending a call event to the system.
            </p>

            {/* Quick select */}
            <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                {demoNumbers.map((demo) => (
                    <button
                        key={demo.phone}
                        className={`btn btn-sm ${phone === demo.phone ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPhone(demo.phone)}
                    >
                        {demo.name}
                    </button>
                ))}
            </div>

            {/* Phone input */}
            <div className="flex gap-sm mb-md">
                <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    style={{ flex: 1 }}
                />
                <button
                    className="btn btn-primary"
                    onClick={handleSimulate}
                    disabled={loading || !phone}
                >
                    {loading ? 'Calling...' : 'Simulate Call'}
                </button>
            </div>

            {/* Result */}
            {result && (
                <div className="card-glass" style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    marginTop: 'var(--spacing-md)'
                }}>
                    <p className="text-success font-medium mb-sm">✓ Call Event Triggered!</p>
                    <p className="text-sm text-secondary">
                        {result.data.customer.isNew ? 'New customer created' : `Customer: ${result.data.customer.name}`}
                    </p>
                    <p className="text-sm text-secondary">
                        Call ID: {result.data.callId}
                    </p>
                    <p className="text-xs text-muted mt-sm">
                        Check the notification popup for call assist
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="call-warning" style={{ marginTop: 'var(--spacing-md)' }}>
                    {error}
                </div>
            )}
        </div>
    );
}

export default SimulateCallPanel;
