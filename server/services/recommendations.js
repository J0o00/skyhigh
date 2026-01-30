/**
 * Action Recommendation Engine
 * 
 * Suggests next best actions based on customer context.
 * 
 * ACTION TYPES:
 * - follow-up: Schedule a follow-up call/email
 * - reminder: Set a reminder for later
 * - escalate: Pass to senior agent
 * - convert: Mark as converted/won
 * - close: Mark as closed/lost
 * - nurture: Add to nurture campaign
 * 
 * DECISION FACTORS:
 * - Customer potential level
 * - Time since last interaction
 * - Unresolved objections
 * - Follow-up status
 * - Intent and engagement
 */

/**
 * Generate action recommendations based on customer context
 * 
 * @param {Object} customer - Customer document
 * @param {Array} recentInteractions - Recent interaction documents
 * @returns {Array} List of recommended actions with explanations
 */
function getRecommendations(customer, recentInteractions = []) {
    const recommendations = [];
    const lastInteraction = recentInteractions[0];
    const potential = customer.potentialLevel || 'medium';
    const intent = customer.currentIntent || 'unknown';

    // Calculate time since last interaction
    let daysSinceInteraction = Infinity;
    if (customer.lastInteraction) {
        daysSinceInteraction = Math.floor(
            (new Date() - new Date(customer.lastInteraction)) / (1000 * 60 * 60 * 24)
        );
    }

    // Check for pending follow-ups
    const pendingFollowUp = recentInteractions.find(
        i => i.followUpRequired && !i.followUpCompleted
    );

    // 1. Follow-up recommendation
    if (pendingFollowUp) {
        const followUpDate = new Date(pendingFollowUp.followUpDate);
        const isOverdue = followUpDate < new Date();

        recommendations.push({
            action: 'follow-up',
            priority: isOverdue ? 'high' : 'medium',
            title: isOverdue ? 'Overdue Follow-up' : 'Scheduled Follow-up',
            description: isOverdue
                ? `Follow-up was due on ${followUpDate.toLocaleDateString()}`
                : `Follow-up scheduled for ${followUpDate.toLocaleDateString()}`,
            reason: 'Based on previous interaction commitment',
            suggestedChannel: lastInteraction?.channel || 'phone',
            actionButton: 'Start Follow-up'
        });
    }

    // 2. Re-engagement for dormant high-potential
    if (potential === 'high' && daysSinceInteraction > 7 && daysSinceInteraction < 30) {
        recommendations.push({
            action: 'follow-up',
            priority: 'high',
            title: 'Re-engage High-Potential Customer',
            description: `No contact in ${daysSinceInteraction} days`,
            reason: 'High-potential customers should be contacted regularly',
            suggestedChannel: 'phone',
            actionButton: 'Schedule Call'
        });
    }

    // 3. Escalation for complex issues
    if (intent === 'complaint' || lastInteraction?.outcome === 'escalated') {
        recommendations.push({
            action: 'escalate',
            priority: 'high',
            title: 'Consider Escalation',
            description: 'Customer may need senior assistance',
            reason: lastInteraction?.outcome === 'escalated'
                ? 'Previously marked for escalation'
                : 'Complaint requires careful handling',
            actionButton: 'Escalate to Senior'
        });
    }

    // 4. Conversion opportunity for ready buyers
    if (intent === 'purchase' && potential === 'high') {
        recommendations.push({
            action: 'convert',
            priority: 'high',
            title: 'Close the Deal',
            description: 'Customer shows strong purchase intent',
            reason: 'High potential with purchase intent signals',
            actionButton: 'Mark as Converting'
        });
    }

    // 5. Nurture for medium potential with inquiry intent
    if (potential === 'medium' && intent === 'inquiry' && daysSinceInteraction > 3) {
        recommendations.push({
            action: 'nurture',
            priority: 'medium',
            title: 'Add to Nurture Campaign',
            description: 'Customer is interested but not ready to buy',
            reason: 'Medium potential with inquiry intent benefits from nurturing',
            actionButton: 'Add to Nurture'
        });
    }

    // 6. Reminder for future contact
    if (potential !== 'spam' && daysSinceInteraction > 14) {
        recommendations.push({
            action: 'reminder',
            priority: 'low',
            title: 'Set Contact Reminder',
            description: 'Schedule a touchpoint to maintain relationship',
            reason: `No contact for ${daysSinceInteraction} days`,
            suggestedDate: getNextWeekday(),
            actionButton: 'Set Reminder'
        });
    }

    // 7. Close/disqualify for low potential or spam
    if (potential === 'spam' || potential === 'low') {
        if (lastInteraction?.outcome === 'not-interested' ||
            customer.keywords?.some(k => k.keyword.includes('not-interested'))) {
            recommendations.push({
                action: 'close',
                priority: 'low',
                title: 'Consider Closing',
                description: 'Customer shows low intent and potential',
                reason: 'Low potential with negative signals',
                actionButton: 'Mark as Closed'
            });
        }
    }

    // 8. Address unresolved objections
    const allObjections = recentInteractions
        .flatMap(i => i.objections || [])
        .filter(Boolean);

    if (allObjections.length > 0 && potential !== 'spam') {
        const uniqueObjections = [...new Set(allObjections)].slice(0, 3);
        recommendations.push({
            action: 'follow-up',
            priority: 'medium',
            title: 'Address Objections',
            description: `Unresolved: ${uniqueObjections.join(', ')}`,
            reason: 'Objections need to be addressed to move forward',
            suggestedChannel: 'email',
            actionButton: 'Prepare Response'
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Limit to top 5 recommendations
    return recommendations.slice(0, 5);
}

/**
 * Get next weekday for reminder suggestions
 */
function getNextWeekday() {
    const date = new Date();
    date.setDate(date.getDate() + 1);

    // Skip to Monday if weekend
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    if (date.getDay() === 6) date.setDate(date.getDate() + 2);

    return date.toISOString().split('T')[0];
}

/**
 * Execute an action (creates the appropriate record)
 */
async function executeAction(actionType, customerId, agentId, data = {}) {
    // This would integrate with task management / CRM systems
    // For MVP, we just return a confirmation

    const actionResults = {
        'follow-up': {
            success: true,
            message: 'Follow-up scheduled',
            details: data
        },
        'reminder': {
            success: true,
            message: 'Reminder set',
            date: data.date || getNextWeekday()
        },
        'escalate': {
            success: true,
            message: 'Escalated to senior agent',
            escalatedTo: data.seniorAgentId || 'Next available'
        },
        'convert': {
            success: true,
            message: 'Marked as converting',
            status: 'converted'
        },
        'close': {
            success: true,
            message: 'Marked as closed',
            status: 'closed'
        },
        'nurture': {
            success: true,
            message: 'Added to nurture campaign',
            campaign: data.campaignId || 'Default Nurture'
        }
    };

    return actionResults[actionType] || { success: false, message: 'Unknown action' };
}

module.exports = {
    getRecommendations,
    executeAction
};
