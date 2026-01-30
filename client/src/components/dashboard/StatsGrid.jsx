/**
 * Stats Grid Component
 */

function StatsGrid({ stats }) {
    const statItems = [
        {
            label: 'Total Customers',
            value: stats.total || 0,
            icon: '👥',
            iconClass: 'primary'
        },
        {
            label: 'High Potential',
            value: stats.high || 0,
            icon: '⭐',
            iconClass: 'success'
        },
        {
            label: 'Pending Follow-ups',
            value: stats.pending || 0,
            icon: '📋',
            iconClass: 'warning'
        },
        {
            label: 'Today\'s Interactions',
            value: stats.todayInteractions || 0,
            icon: '💬',
            iconClass: 'info'
        }
    ];

    return (
        <div className="stats-grid">
            {statItems.map((stat, index) => (
                <div key={index} className="stat-card">
                    <div className={`stat-icon ${stat.iconClass}`}>
                        {stat.icon}
                    </div>
                    <div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default StatsGrid;
