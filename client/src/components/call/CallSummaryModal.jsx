/**
 * Call Summary Modal Component
 * 
 * Post-call form for capturing interaction details (Human-in-the-Loop).
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { callApi } from '../../services/api';
import { formatPhone, getInitials } from '../../utils';

function CallSummaryModal({ callData, onClose }) {
    const { agent } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        summary: '',
        outcome: 'neutral',
        updatedIntent: '',
        keywords: [],
        objections: [],
        pointsToRemember: [],
        followUpRequired: false,
        followUpDate: '',
        followUpNotes: '',
        assistPanelHelpful: null,
        additionalNotes: ''
    });
    const [newKeyword, setNewKeyword] = useState('');
    const [newObjection, setNewObjection] = useState('');
    const [newPoint, setNewPoint] = useState('');

    const { customer, callId, duration } = callData;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddKeyword = () => {
        if (newKeyword.trim()) {
            handleChange('keywords', [...formData.keywords, newKeyword.trim()]);
            setNewKeyword('');
        }
    };

    const handleRemoveKeyword = (index) => {
        handleChange('keywords', formData.keywords.filter((_, i) => i !== index));
    };

    const handleAddObjection = () => {
        if (newObjection.trim()) {
            handleChange('objections', [...formData.objections, newObjection.trim()]);
            setNewObjection('');
        }
    };

    const handleRemoveObjection = (index) => {
        handleChange('objections', formData.objections.filter((_, i) => i !== index));
    };

    const handleAddPoint = () => {
        if (newPoint.trim()) {
            handleChange('pointsToRemember', [...formData.pointsToRemember, newPoint.trim()]);
            setNewPoint('');
        }
    };

    const handleRemovePoint = (index) => {
        handleChange('pointsToRemember', formData.pointsToRemember.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.summary.trim()) {
            alert('Please enter a call summary');
            return;
        }

        setLoading(true);
        try {
            await callApi.submitSummary(callId, {
                ...formData,
                agentId: agent._id,
                duration
            });
            onClose();
        } catch (err) {
            console.error('Error submitting summary:', err);
            alert('Failed to submit summary');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '600px' }}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex gap-md" style={{ alignItems: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--accent-violet) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600'
                        }}>
                            {customer?.name ? getInitials(customer.name) : '?'}
                        </div>
                        <div>
                            <h3 className="modal-title">Call Summary</h3>
                            <p className="text-sm text-muted">
                                {customer?.name || 'Unknown'} • {formatDuration(duration || 0)}
                            </p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {/* Summary */}
                        <div className="form-group">
                            <label className="form-label">Call Summary *</label>
                            <textarea
                                className="form-textarea"
                                placeholder="What happened during the call?"
                                value={formData.summary}
                                onChange={(e) => handleChange('summary', e.target.value)}
                                rows={3}
                                required
                            />
                        </div>

                        {/* Outcome */}
                        <div className="form-group">
                            <label className="form-label">Outcome</label>
                            <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                {['positive', 'neutral', 'negative', 'no-answer', 'scheduled', 'converted'].map((outcome) => (
                                    <button
                                        key={outcome}
                                        type="button"
                                        className={`btn btn-sm ${formData.outcome === outcome ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleChange('outcome', outcome)}
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        {outcome.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Intent */}
                        <div className="form-group">
                            <label className="form-label">Updated Intent</label>
                            <select
                                className="form-select"
                                value={formData.updatedIntent}
                                onChange={(e) => handleChange('updatedIntent', e.target.value)}
                            >
                                <option value="">No change</option>
                                <option value="buying">Buying</option>
                                <option value="researching">Researching</option>
                                <option value="comparing">Comparing</option>
                                <option value="support">Support</option>
                                <option value="complaint">Complaint</option>
                                <option value="not-interested">Not Interested</option>
                            </select>
                        </div>

                        {/* Keywords */}
                        <div className="form-group">
                            <label className="form-label">Keywords Discovered</label>
                            <div className="flex gap-sm mb-sm">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Add keyword..."
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleAddKeyword}
                                >
                                    Add
                                </button>
                            </div>
                            {formData.keywords.length > 0 && (
                                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                    {formData.keywords.map((kw, idx) => (
                                        <span
                                            key={idx}
                                            className="tag tag-removable"
                                            onClick={() => handleRemoveKeyword(idx)}
                                        >
                                            {kw} ×
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Objections */}
                        <div className="form-group">
                            <label className="form-label">Objections Raised</label>
                            <div className="flex gap-sm mb-sm">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Add objection..."
                                    value={newObjection}
                                    onChange={(e) => setNewObjection(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjection())}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleAddObjection}
                                >
                                    Add
                                </button>
                            </div>
                            {formData.objections.length > 0 && (
                                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                    {formData.objections.map((obj, idx) => (
                                        <span
                                            key={idx}
                                            className="tag tag-negative tag-removable"
                                            onClick={() => handleRemoveObjection(idx)}
                                        >
                                            {obj} ×
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Points to Remember */}
                        <div className="form-group">
                            <label className="form-label">Points to Remember</label>
                            <div className="flex gap-sm mb-sm">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Important point for next interaction..."
                                    value={newPoint}
                                    onChange={(e) => setNewPoint(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPoint())}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleAddPoint}
                                >
                                    Add
                                </button>
                            </div>
                            {formData.pointsToRemember.length > 0 && (
                                <div className="flex flex-col gap-xs">
                                    {formData.pointsToRemember.map((point, idx) => (
                                        <div
                                            key={idx}
                                            className="tag tag-positive tag-removable"
                                            onClick={() => handleRemovePoint(idx)}
                                            style={{ display: 'block' }}
                                        >
                                            ✓ {point} ×
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Follow-up */}
                        <div className="form-group">
                            <label className="form-checkbox">
                                <input
                                    type="checkbox"
                                    checked={formData.followUpRequired}
                                    onChange={(e) => handleChange('followUpRequired', e.target.checked)}
                                />
                                Follow-up required
                            </label>

                            {formData.followUpRequired && (
                                <div className="mt-sm" style={{ paddingLeft: 'var(--spacing-lg)' }}>
                                    <input
                                        type="date"
                                        className="form-input mb-sm"
                                        value={formData.followUpDate}
                                        onChange={(e) => handleChange('followUpDate', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Follow-up notes..."
                                        value={formData.followUpNotes}
                                        onChange={(e) => handleChange('followUpNotes', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Assist Panel Feedback */}
                        <div className="form-group">
                            <label className="form-label">Was the assist panel helpful?</label>
                            <div className="flex gap-sm">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${formData.assistPanelHelpful === true ? 'btn-success' : 'btn-secondary'}`}
                                    onClick={() => handleChange('assistPanelHelpful', true)}
                                >
                                    👍 Yes
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${formData.assistPanelHelpful === false ? 'btn-danger' : 'btn-secondary'}`}
                                    onClick={() => handleChange('assistPanelHelpful', false)}
                                >
                                    👎 No
                                </button>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="form-group">
                            <label className="form-label">Additional Notes</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Any other notes..."
                                value={formData.additionalNotes}
                                onChange={(e) => handleChange('additionalNotes', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Skip
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Summary'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CallSummaryModal;
