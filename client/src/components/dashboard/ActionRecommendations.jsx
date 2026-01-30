/**
 * Action Recommendations Component
 * 
 * Displays suggested next actions with one-click execution.
 */

function ActionRecommendations({ recommendations = [], customerId, onAction }) {
    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recommended Actions</h3>
                </div>
                <p className="text-muted text-sm">No specific actions recommended</p>
            </div>
        );
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'var(--error)';
            case 'medium': return 'var(--warning)';
            default: return 'var(--text-muted)';
        }
    };

    const getActionIcon = (action) => {
        const icons = {
            'follow-up': '📞',
            'reminder': '⏰',
            'escalate': '⬆️',
            'convert': '✅',
            'close': '❌',
            'nurture': '🌱'
        };
        return icons[action] || '📋';
    };

    const handleAction = (recommendation) => {
        // TODO: Implement actual action execution
        console.log('Executing action:', recommendation);
        if (onAction) {
            onAction();
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Recommended Actions</h3>
                <p className="card-subtitle">{recommendations.length} suggestions</p>
            </div>

            <div className="flex flex-col gap-md">
                {recommendations.map((rec, idx) => (
                    <div
                        key={idx}
                        className="card-glass"
                        style={{
                            padding: 'var(--spacing-md)',
                            borderLeft: `3px solid ${getPriorityColor(rec.priority)}`
                        }}
                    >
                        <div className="flex-between mb-xs">
                            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                <span style={{ fontSize: '1.25rem' }}>{getActionIcon(rec.action)}</span>
                                <span className="font-medium">{rec.title}</span>
                            </div>
                            <span
                                className="badge"
                                style={{
                                    background: `${getPriorityColor(rec.priority)}20`,
                                    color: getPriorityColor(rec.priority),
                                    border: `1px solid ${getPriorityColor(rec.priority)}40`
                                }}
                            >
                                {rec.priority}
                            </span>
                        </div>

                        <p className="text-sm text-secondary mb-sm">{rec.description}</p>

                        <p className="text-xs text-muted mb-md">
                            💡 {rec.reason}
                        </p>

                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAction(rec)}
                        >
                            {rec.actionButton || 'Execute'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ActionRecommendations;
