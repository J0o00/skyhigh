/**
 * Agent Assist Service
 * 
 * Generates context-aware suggestions for agents based on:
 * - Customer profile and history
 * - Current channel (email/chat/phone)
 * - Recent interactions
 * - Customer preferences
 * 
 * IMPORTANT: All suggestions are EDITABLE, never auto-sent.
 */

/**
 * Generate email assistance
 */
function generateEmailAssist(customer, lastInteraction) {
    const name = customer.name?.split(' ')[0] || 'there';
    const potential = customer.potentialLevel || 'medium';
    const intent = customer.currentIntent || 'inquiry';

    const suggestions = {
        openingSentences: [],
        followUpLines: [],
        callToActions: [],
        warnings: []
    };

    // Opening sentences based on context
    if (lastInteraction) {
        const daysSince = Math.floor(
            (new Date() - new Date(lastInteraction.createdAt)) / (1000 * 60 * 60 * 24)
        );

        if (daysSince <= 1) {
            suggestions.openingSentences.push(
                `Hi ${name}, thank you for our recent conversation.`,
                `Hi ${name}, following up on our discussion from earlier.`
            );
        } else if (daysSince <= 7) {
            suggestions.openingSentences.push(
                `Hi ${name}, I hope you're doing well. Following up on our conversation from last week.`,
                `Hi ${name}, I wanted to check in with you regarding our previous discussion.`
            );
        } else {
            suggestions.openingSentences.push(
                `Hi ${name}, I hope this email finds you well.`,
                `Hi ${name}, it's been a while since we connected - I wanted to reach out.`
            );
        }
    } else {
        suggestions.openingSentences.push(
            `Hi ${name}, I hope this email finds you well.`,
            `Hi ${name}, thank you for your interest in our services.`
        );
    }

    // Follow-up lines based on intent
    switch (intent) {
        case 'purchase':
            suggestions.followUpLines.push(
                'I wanted to share some additional information that might help with your decision.',
                'Here are the next steps to move forward with your purchase.',
                'I\'ve attached the detailed proposal as discussed.'
            );
            break;
        case 'inquiry':
            suggestions.followUpLines.push(
                'I\'d be happy to provide more details about our offerings.',
                'Here\'s the information you requested.',
                'Please find below the details that address your questions.'
            );
            break;
        case 'complaint':
            suggestions.followUpLines.push(
                'I understand your concerns and want to help resolve this.',
                'I\'ve looked into the issue you raised and here\'s what I found.',
                'We take your feedback seriously and are working on a solution.'
            );
            break;
        default:
            suggestions.followUpLines.push(
                'I wanted to touch base with you regarding our services.',
                'Is there anything specific I can help you with?'
            );
    }

    // CTAs based on potential
    if (potential === 'high') {
        suggestions.callToActions.push(
            'Would you have 15 minutes for a quick call this week?',
            'I\'d love to schedule a demo at your convenience.',
            'Let me know a good time to discuss the next steps.'
        );
    } else if (potential === 'medium') {
        suggestions.callToActions.push(
            'Feel free to reply to this email with any questions.',
            'Would you like me to send over more information?',
            'Let me know if you\'d like to explore this further.'
        );
    } else {
        suggestions.callToActions.push(
            'Please let me know if I can assist with anything.',
            'Feel free to reach out if you have any questions.'
        );
    }

    // Add warnings if applicable
    if (lastInteraction?.objections?.length > 0) {
        suggestions.warnings.push(
            `Previous objections: ${lastInteraction.objections.join(', ')}`
        );
    }

    return suggestions;
}

/**
 * Generate chat assistance (quick replies)
 */
function generateChatAssist(customer, lastInteraction, currentMessage = '') {
    const name = customer.name?.split(' ')[0] || '';
    const intent = customer.currentIntent || 'inquiry';

    const quickReplies = [];

    // Greeting if this seems like start of conversation
    if (!lastInteraction || currentMessage.toLowerCase().includes('hi')) {
        quickReplies.push({
            text: `Hi${name ? ' ' + name : ''}! How can I help you today?`,
            type: 'greeting'
        });
    }

    // Intent-based replies
    switch (intent) {
        case 'purchase':
            quickReplies.push(
                { text: 'I can help you complete your purchase. What specific information do you need?', type: 'assist' },
                { text: 'Would you like me to walk you through the ordering process?', type: 'assist' },
                { text: 'I can share our current offers with you. Interested?', type: 'upsell' }
            );
            break;
        case 'inquiry':
            quickReplies.push(
                { text: 'Great question! Let me explain...', type: 'assist' },
                { text: 'I\'d be happy to provide more details about that.', type: 'assist' },
                { text: 'Here are the key points you should know...', type: 'inform' }
            );
            break;
        case 'complaint':
            quickReplies.push(
                { text: 'I\'m sorry to hear that. Let me help resolve this for you.', type: 'empathy' },
                { text: 'I understand your frustration. Can you share more details?', type: 'empathy' },
                { text: 'Let me look into this and get back to you right away.', type: 'action' }
            );
            break;
        case 'support':
            quickReplies.push(
                { text: 'I\'m here to help! What issue are you experiencing?', type: 'assist' },
                { text: 'Let me guide you through the troubleshooting steps.', type: 'assist' },
                { text: 'Have you tried restarting the application?', type: 'troubleshoot' }
            );
            break;
        default:
            quickReplies.push(
                { text: 'How can I assist you today?', type: 'general' },
                { text: 'I\'m here to help with any questions you have.', type: 'general' },
                { text: 'What brings you to us today?', type: 'discovery' }
            );
    }

    // Limit to 3 suggestions
    return quickReplies.slice(0, 3);
}

/**
 * Generate call assistance (during call)
 */
function generateCallAssist(customer, recentInteractions = []) {
    const assist = {
        customerSummary: '',
        pointsToRemember: [],
        doNotRepeat: [],
        callObjective: '',
        talkingPoints: [],
        warningFlags: []
    };

    // Customer summary
    const name = customer.name || 'Customer';
    const potential = customer.potentialLevel || 'unknown';
    const intent = customer.currentIntent || 'unknown';
    const interactionCount = customer.interactionCount || 0;

    assist.customerSummary = `${name} - ${potential.toUpperCase()} potential customer with ${interactionCount} prior interaction(s). Current intent: ${intent}.`;

    // Budget info
    if (customer.preferences?.budget && customer.preferences.budget !== 'not-specified') {
        assist.customerSummary += ` Budget: ${customer.preferences.budget}.`;
    }

    // Points to remember from last interactions
    recentInteractions.forEach(interaction => {
        if (interaction.pointsToRemember?.length > 0) {
            assist.pointsToRemember.push(...interaction.pointsToRemember);
        }
        if (interaction.doNotRepeat?.length > 0) {
            assist.doNotRepeat.push(...interaction.doNotRepeat);
        }
    });

    // Remove duplicates
    assist.pointsToRemember = [...new Set(assist.pointsToRemember)].slice(0, 5);
    assist.doNotRepeat = [...new Set(assist.doNotRepeat)].slice(0, 5);

    // Call objective based on intent and potential
    if (intent === 'purchase' && potential === 'high') {
        assist.callObjective = 'Close the deal - customer is ready to buy';
        assist.talkingPoints.push(
            'Confirm their requirements are met',
            'Address any final concerns',
            'Guide through purchase process',
            'Discuss implementation timeline'
        );
    } else if (intent === 'inquiry') {
        assist.callObjective = 'Qualify the lead and understand needs';
        assist.talkingPoints.push(
            'Understand their pain points',
            'Assess budget and timeline',
            'Identify decision-makers',
            'Schedule follow-up if interested'
        );
    } else if (intent === 'complaint') {
        assist.callObjective = 'Resolve the issue and retain the customer';
        assist.talkingPoints.push(
            'Listen actively and empathize',
            'Apologize for the inconvenience',
            'Propose a solution',
            'Confirm resolution and satisfaction'
        );
    } else if (intent === 'follow-up') {
        assist.callObjective = 'Continue previous conversation and advance deal';
        assist.talkingPoints.push(
            'Reference previous discussion',
            'Address outstanding questions',
            'Propose next steps',
            'Confirm commitment level'
        );
    } else {
        assist.callObjective = 'Understand customer needs and qualify';
        assist.talkingPoints.push(
            'Build rapport',
            'Understand their situation',
            'Present relevant solutions',
            'Schedule follow-up if needed'
        );
    }

    // Warning flags
    if (potential === 'low' || potential === 'spam') {
        assist.warningFlags.push('Low potential - evaluate if worth pursuing');
    }
    if (customer.keywords?.some(k => k.keyword.includes('competitor'))) {
        assist.warningFlags.push('Competitor mentioned in past - be prepared to differentiate');
    }
    if (recentInteractions.some(i => i.outcome === 'negative')) {
        assist.warningFlags.push('Previous negative interaction - handle with care');
    }

    return assist;
}

/**
 * Main function to get channel-specific assistance
 */
function getAgentAssist(customer, recentInteractions, channel) {
    switch (channel) {
        case 'email':
            return {
                channel: 'email',
                ...generateEmailAssist(customer, recentInteractions[0])
            };
        case 'chat':
            return {
                channel: 'chat',
                quickReplies: generateChatAssist(customer, recentInteractions[0])
            };
        case 'phone':
            return {
                channel: 'phone',
                ...generateCallAssist(customer, recentInteractions)
            };
        default:
            return {
                channel: 'unknown',
                message: 'Select a channel for context-aware assistance'
            };
    }
}

module.exports = {
    getAgentAssist,
    generateEmailAssist,
    generateChatAssist,
    generateCallAssist
};
