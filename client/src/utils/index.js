/**
 * Utility Functions
 */

/**
 * Format phone number for display
 */
export function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
}

/**
 * Format date for display
 */
export function formatDate(date, options = {}) {
    if (!date) return '';
    const d = new Date(date);

    if (options.relative) {
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
    }

    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined,
        hour: options.showTime ? 'numeric' : undefined,
        minute: options.showTime ? '2-digit' : undefined,
        ...options
    });
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get initials from name
 */
export function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Get potential level color class
 */
export function getPotentialClass(level) {
    const classes = {
        high: 'badge-high',
        medium: 'badge-medium',
        low: 'badge-low',
        spam: 'badge-spam'
    };
    return classes[level] || 'badge-medium';
}

/**
 * Get channel icon
 */
export function getChannelIcon(channel) {
    const icons = {
        phone: '📞',
        email: '📧',
        chat: '💬'
    };
    return icons[channel] || '📋';
}

/**
 * Get outcome color class
 */
export function getOutcomeClass(outcome) {
    const positive = ['positive', 'converted', 'scheduled'];
    const negative = ['negative', 'no-answer'];

    if (positive.includes(outcome)) return 'text-success';
    if (negative.includes(outcome)) return 'text-error';
    return 'text-secondary';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate unique ID
 */
export function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}
