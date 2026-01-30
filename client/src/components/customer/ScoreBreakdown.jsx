/**
 * Score Breakdown Component
 * 
 * Displays customer potential score with explainability.
 */

import { useState } from 'react';

function ScoreBreakdown({ breakdown, score, onFeedback }) {
    const [showFeedback, setShowFeedback] = useState(false);

    if (!breakdown) {
        return null;
    }

    const factors = [
        { key: 'intentStrength', label: 'Intent Strength', icon: '🎯' },
        { key: 'engagementFrequency', label: 'Engagement', icon: '📊' },
        { key: 'budgetClarity', label: 'Budget Clarity', icon: '💰' },
        { key: 'keywordSignals', label: 'Keyword Signals', icon: '🏷️' },
        { key: 'recency', label: 'Recency', icon: '⏱️' }
    ];

    const getScoreColor = (score) => {
        if (score >= 70) return 'var(--success)';
        if (score >= 40) return 'var(--warning)';
        return 'var(--text-muted)';
    };

    const getLevel = (score) => {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        if (score >= 20) return 'low';
        return 'spam';
    };

    return (
        <div className="card">
            <div className="card-header flex-between">
                <div>
                    <h3 className="card-title">Potential Score</h3>
                    <p className="card-subtitle">Why this customer matters</p>
                </div>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowFeedback(!showFeedback)}
                >
                    ✏️ Correct
                </button>
            </div>

            {/* Score Circle */}
            <div className="flex gap-lg mb-lg">
                <div
                    className={`score-circle ${getLevel(score)}`}
                    style={{ width: '80px', height: '80px', fontSize: '1.5rem' }}
                >
                    {score}
                </div>
                <div>
                    <div className="text-lg font-semibold" style={{ textTransform: 'capitalize' }}>
                        {getLevel(score)} Potential
                    </div>
                    <p className="text-secondary text-sm mt-xs">
                        Based on {factors.length} weighted factors
                    </p>
                </div>
            </div>

            {/* Factor Breakdown */}
            <div className="flex flex-col gap-md">
                {factors.map(({ key, label, icon }) => {
                    const factor = breakdown[key];
                    if (!factor) return null;

                    const contribution = Math.round(factor.score * factor.weight);

                    return (
                        <div key={key}>
                            <div className="flex-between mb-xs">
                                <span className="text-sm">
                                    {icon} {label}
                                    <span className="text-muted"> ({Math.round(factor.weight * 100)}%)</span>
                                </span>
                                <span className="font-medium" style={{ color: getScoreColor(factor.score) }}>
                                    {factor.score}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div style={{
                                height: '6px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${factor.score}%`,
                                    height: '100%',
                                    background: getScoreColor(factor.score),
                                    borderRadius: '3px',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>

                            {/* Reason */}
                            <p className="text-xs text-muted mt-xs">{factor.reason}</p>
                        </div>
                    );
                })}
            </div>

            {/* Feedback Controls */}
            {showFeedback && (
                <div style={{
                    marginTop: 'var(--spacing-lg)',
                    paddingTop: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <p className="text-sm text-secondary mb-md">
                        Correct the potential level if you believe the scoring is inaccurate:
                    </p>
                    <div className="flex gap-sm">
                        {['high', 'medium', 'low', 'spam'].map((level) => (
                            <button
                                key={level}
                                className={`btn btn-sm ${getLevel(score) === level ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => {
                                    onFeedback(level);
                                    setShowFeedback(false);
                                }}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScoreBreakdown;
