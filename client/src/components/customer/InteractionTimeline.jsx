/**
 * Interaction Timeline Component
 */

import { formatDate, getChannelIcon, getOutcomeClass } from '../../utils';

function InteractionTimeline({ interactions }) {
    if (!interactions || interactions.length === 0) {
        return (
            <div className="empty-state" style={{ padding: 'var(--spacing-lg)' }}>
                <p className="text-muted">No interactions yet</p>
            </div>
        );
    }

    return (
        <div className="timeline">
            {interactions.map((interaction) => (
                <div
                    key={interaction._id}
                    className={`timeline-item ${interaction.channel}`}
                >
                    <div className="timeline-date">
                        {getChannelIcon(interaction.channel)}{' '}
                        {formatDate(interaction.createdAt, { showTime: true })}
                        {' • '}
                        <span style={{ textTransform: 'capitalize' }}>{interaction.direction}</span>
                    </div>

                    <div className="timeline-content">
                        <p className="text-primary mb-sm">{interaction.summary}</p>

                        <div className="flex gap-md text-sm">
                            <span className={getOutcomeClass(interaction.outcome)}>
                                {interaction.outcome}
                            </span>

                            {interaction.intent && interaction.intent !== 'unknown' && (
                                <span className="text-muted">
                                    Intent: {interaction.intent}
                                </span>
                            )}

                            {interaction.followUpRequired && (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                                    Follow-up
                                </span>
                            )}
                        </div>

                        {/* Keywords */}
                        {interaction.keywords && interaction.keywords.length > 0 && (
                            <div className="flex gap-sm mt-sm" style={{ flexWrap: 'wrap' }}>
                                {interaction.keywords.map((kw, idx) => (
                                    <span key={idx} className="tag">{kw}</span>
                                ))}
                            </div>
                        )}

                        {/* Points to remember */}
                        {interaction.pointsToRemember && interaction.pointsToRemember.length > 0 && (
                            <div className="mt-sm">
                                <span className="text-xs text-muted">Points to remember:</span>
                                <ul style={{ marginLeft: 'var(--spacing-md)', marginTop: 'var(--spacing-xs)' }}>
                                    {interaction.pointsToRemember.map((point, idx) => (
                                        <li key={idx} className="text-sm text-secondary">{point}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Agent */}
                        {interaction.agentId && (
                            <div className="text-xs text-muted mt-sm">
                                by {typeof interaction.agentId === 'object' 
                                    ? (interaction.agentId?.name || 'Agent') 
                                    : 'Agent'}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default InteractionTimeline;
