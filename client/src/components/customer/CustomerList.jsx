/**
 * Customer List Component
 */

import { getInitials, formatPhone, formatDate } from '../../utils';
import PotentialBadge from '../common/PotentialBadge';

function CustomerList({ customers, onSelect }) {
    if (!customers || customers.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h4 className="empty-state-title">No customers found</h4>
                <p className="empty-state-text">Try adjusting your search or filters</p>
            </div>
        );
    }

    return (
        <div className="customer-list">
            {customers.map((customer) => (
                <div
                    key={customer._id}
                    className="customer-item"
                    onClick={() => onSelect(customer._id)}
                >
                    {/* Avatar */}
                    <div className="customer-avatar">
                        {getInitials(customer.name)}
                    </div>

                    {/* Info */}
                    <div className="customer-info">
                        <div className="customer-name">{customer.name}</div>
                        <div className="customer-company">
                            {customer.company || formatPhone(customer.phone)}
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="customer-meta">
                        <div className="text-sm text-muted">
                            {customer.lastInteraction
                                ? formatDate(customer.lastInteraction, { relative: true })
                                : 'New'}
                        </div>
                        <PotentialBadge level={customer.potentialLevel} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default CustomerList;
