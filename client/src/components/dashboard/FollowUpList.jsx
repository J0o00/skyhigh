/**
 * Follow-up List Component
 */

import { formatDate, formatPhone } from '../../utils';
import PotentialBadge from '../common/PotentialBadge';

function FollowUpList({ followUps, onSelect }) {
    const { overdue = [], today = [], upcoming = [] } = followUps;
    const hasFollowUps = overdue.length > 0 || today.length > 0 || upcoming.length > 0;

    if (!hasFollowUps) {
        return (
            <div className="empty-state" style={{ padding: 'var(--spacing-lg)' }}>
                <div className="empty-state-icon">✅</div>
                <p className="text-muted">No pending follow-ups</p>
            </div>
        );
    }

    const renderItem = (item, isOverdue = false) => (
        <div
            key={item._id}
            className="customer-item"
            onClick={() => onSelect(item.customerId?._id || item.customerId)}
            style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderColor: isOverdue ? 'var(--error)' : undefined
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-medium text-sm truncate">
                    {item.customerId?.name || 'Unknown'}
                </div>
                <div className="text-xs text-muted">
                    {item.followUpDate && formatDate(item.followUpDate)}
                </div>
            </div>
            {item.customerId?.potentialLevel && (
                <PotentialBadge level={item.customerId.potentialLevel} />
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-md">
            {/* Overdue */}
            {overdue.length > 0 && (
                <div>
                    <div className="text-xs font-semibold text-error mb-sm">
                        ⚠️ OVERDUE ({overdue.length})
                    </div>
                    <div className="flex flex-col gap-xs">
                        {overdue.map(item => renderItem(item, true))}
                    </div>
                </div>
            )}

            {/* Today */}
            {today.length > 0 && (
                <div>
                    <div className="text-xs font-semibold text-warning mb-sm">
                        📅 TODAY ({today.length})
                    </div>
                    <div className="flex flex-col gap-xs">
                        {today.map(item => renderItem(item))}
                    </div>
                </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
                <div>
                    <div className="text-xs font-semibold text-muted mb-sm">
                        📋 UPCOMING ({upcoming.length})
                    </div>
                    <div className="flex flex-col gap-xs">
                        {upcoming.slice(0, 5).map(item => renderItem(item))}
                    </div>
                    {upcoming.length > 5 && (
                        <p className="text-xs text-muted mt-sm">
                            +{upcoming.length - 5} more
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default FollowUpList;
