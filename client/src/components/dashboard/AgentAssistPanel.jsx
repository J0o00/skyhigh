/**
 * Agent Assist Panel Component
 * 
 * Shows context-aware suggestions based on channel.
 */

import { useState } from 'react';

function AgentAssistPanel({ assist, channel }) {
    const [copiedIndex, setCopiedIndex] = useState(null);

    const copyToClipboard = async (text, index) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    if (!assist) {
        return <p className="text-muted">No suggestions available</p>;
    }

    // Phone assist
    if (channel === 'phone') {
        return (
            <div className="flex flex-col gap-md">
                {/* Customer Summary */}
                {assist.customerSummary && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted mb-sm">CUSTOMER SUMMARY</h4>
                        <p className="text-sm text-secondary">{assist.customerSummary}</p>
                    </div>
                )}

                {/* Call Objective */}
                {assist.callObjective && (
                    <div>
                        <h4 className="text-xs font-semibold text-primary mb-sm">🎯 CALL OBJECTIVE</h4>
                        <p className="text-sm font-medium text-primary">{assist.callObjective}</p>
                    </div>
                )}

                {/* Talking Points */}
                {assist.talkingPoints && assist.talkingPoints.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted mb-sm">💬 TALKING POINTS</h4>
                        <ul className="call-points-list">
                            {assist.talkingPoints.map((point, idx) => (
                                <li key={idx}>{point}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Points to Remember */}
                {assist.pointsToRemember && assist.pointsToRemember.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-success mb-sm">✓ POINTS TO REMEMBER</h4>
                        <ul className="call-points-list">
                            {assist.pointsToRemember.map((point, idx) => (
                                <li key={idx}>{point}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Do Not Repeat */}
                {assist.doNotRepeat && assist.doNotRepeat.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-error mb-sm">⚠️ DO NOT REPEAT</h4>
                        {assist.doNotRepeat.map((item, idx) => (
                            <div key={idx} className="call-warning">{item}</div>
                        ))}
                    </div>
                )}

                {/* Warning Flags */}
                {assist.warningFlags && assist.warningFlags.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-warning mb-sm">⚡ WARNINGS</h4>
                        {assist.warningFlags.map((flag, idx) => (
                            <div key={idx} className="call-warning" style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderColor: 'rgba(245, 158, 11, 0.3)',
                                color: 'var(--warning)'
                            }}>
                                {flag}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Email assist
    if (channel === 'email') {
        const { openingSentences = [], followUpLines = [], callToActions = [], warnings = [] } = assist;

        return (
            <div className="flex flex-col gap-md">
                {/* Opening Sentences */}
                {openingSentences.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted mb-sm">📧 OPENING SENTENCES</h4>
                        {openingSentences.map((text, idx) => (
                            <div
                                key={idx}
                                className="card-glass mb-sm"
                                style={{ padding: 'var(--spacing-sm)', cursor: 'pointer' }}
                                onClick={() => copyToClipboard(text, `open-${idx}`)}
                            >
                                <p className="text-sm">{text}</p>
                                <span className="text-xs text-muted">
                                    {copiedIndex === `open-${idx}` ? '✓ Copied!' : 'Click to copy'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Follow-up Lines */}
                {followUpLines.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted mb-sm">↩️ FOLLOW-UP LINES</h4>
                        {followUpLines.map((text, idx) => (
                            <div
                                key={idx}
                                className="card-glass mb-sm"
                                style={{ padding: 'var(--spacing-sm)', cursor: 'pointer' }}
                                onClick={() => copyToClipboard(text, `follow-${idx}`)}
                            >
                                <p className="text-sm">{text}</p>
                                <span className="text-xs text-muted">
                                    {copiedIndex === `follow-${idx}` ? '✓ Copied!' : 'Click to copy'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTAs */}
                {callToActions.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted mb-sm">🎯 CALL TO ACTION</h4>
                        {callToActions.map((text, idx) => (
                            <div
                                key={idx}
                                className="card-glass mb-sm"
                                style={{ padding: 'var(--spacing-sm)', cursor: 'pointer' }}
                                onClick={() => copyToClipboard(text, `cta-${idx}`)}
                            >
                                <p className="text-sm">{text}</p>
                                <span className="text-xs text-muted">
                                    {copiedIndex === `cta-${idx}` ? '✓ Copied!' : 'Click to copy'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-warning mb-sm">⚠️ WARNINGS</h4>
                        {warnings.map((text, idx) => (
                            <div key={idx} className="call-warning">{text}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Chat assist
    if (channel === 'chat') {
        const { quickReplies = [] } = assist;

        return (
            <div className="flex flex-col gap-sm">
                <h4 className="text-xs font-semibold text-muted">💬 QUICK REPLIES</h4>
                {quickReplies.map((reply, idx) => (
                    <div
                        key={idx}
                        className="card-glass"
                        style={{ padding: 'var(--spacing-sm)', cursor: 'pointer' }}
                        onClick={() => copyToClipboard(reply.text, `chat-${idx}`)}
                    >
                        <span
                            className="badge badge-info text-xs mb-sm"
                            style={{ display: 'inline-block' }}
                        >
                            {reply.type}
                        </span>
                        <p className="text-sm">{reply.text}</p>
                        <span className="text-xs text-muted">
                            {copiedIndex === `chat-${idx}` ? '✓ Copied!' : 'Click to copy'}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return <p className="text-muted">Select a channel for suggestions</p>;
}

export default AgentAssistPanel;
