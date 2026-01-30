/**
 * Summary Service
 * 
 * Auto-generates customer context summaries from interaction history.
 */

/**
 * Generate a customer summary from their interactions
 */
function generateCustomerSummary(customer, interactions) {
    if (!interactions || interactions.length === 0) {
        return {
            briefSummary: 'New customer - no interaction history yet.',
            keyTopics: [],
            sentiment: 'neutral',
            lastChannel: null,
            pointsToRemember: [],
            recommendedApproach: 'Welcome them and understand their needs.'
        };
    }

    // Analyze interactions
    const channels = { chat: 0, email: 0, phone: 0 };
    const topics = new Map();
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    const pointsToRemember = [];

    interactions.forEach(i => {
        // Count channels
        if (i.channel) channels[i.channel]++;

        // Track sentiment from outcomes
        if (['positive', 'converted'].includes(i.outcome)) {
            sentiments.positive++;
        } else if (['negative', 'escalated'].includes(i.outcome)) {
            sentiments.negative++;
        } else {
            sentiments.neutral++;
        }

        // Extract keywords from content
        if (i.content || i.summary) {
            const text = (i.content || i.summary).toLowerCase();
            extractKeyTopics(text).forEach(topic => {
                topics.set(topic, (topics.get(topic) || 0) + 1);
            });
        }

        // Collect points to remember
        if (i.pointsToRemember && i.pointsToRemember.length > 0) {
            pointsToRemember.push(...i.pointsToRemember);
        }
    });

    // Determine primary channel
    const primaryChannel = Object.entries(channels)
        .sort((a, b) => b[1] - a[1])[0];

    // Determine overall sentiment
    let overallSentiment = 'neutral';
    if (sentiments.positive > sentiments.negative + sentiments.neutral) {
        overallSentiment = 'positive';
    } else if (sentiments.negative > sentiments.positive) {
        overallSentiment = 'negative';
    }

    // Get top topics
    const keyTopics = Array.from(topics.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);

    // Generate brief summary
    const lastInteraction = interactions[0];
    const totalInteractions = interactions.length;
    const daysSinceFirst = interactions.length > 0
        ? Math.floor((Date.now() - new Date(interactions[interactions.length - 1].createdAt)) / (1000 * 60 * 60 * 24))
        : 0;

    const briefSummary = generateBriefSummary(
        customer,
        totalInteractions,
        daysSinceFirst,
        primaryChannel[0],
        overallSentiment,
        lastInteraction
    );

    // Recommended approach
    const recommendedApproach = getRecommendedApproach(
        overallSentiment,
        customer.currentIntent,
        keyTopics
    );

    return {
        briefSummary,
        keyTopics,
        sentiment: overallSentiment,
        lastChannel: lastInteraction?.channel || null,
        lastInteractionDate: lastInteraction?.createdAt || null,
        totalInteractions,
        channelBreakdown: channels,
        pointsToRemember: [...new Set(pointsToRemember)].slice(0, 5),
        recommendedApproach
    };
}

/**
 * Extract key topics from text
 */
function extractKeyTopics(text) {
    const topics = [];
    const keywords = [
        'pricing', 'price', 'cost', 'discount',
        'delivery', 'shipping', 'timeline',
        'product', 'service', 'feature',
        'support', 'help', 'issue', 'problem',
        'quality', 'warranty', 'return',
        'payment', 'invoice', 'billing',
        'demo', 'trial', 'quote'
    ];

    keywords.forEach(kw => {
        if (text.includes(kw)) {
            topics.push(kw);
        }
    });

    return topics;
}

/**
 * Generate brief summary text
 */
function generateBriefSummary(customer, totalInteractions, daysSinceFirst, primaryChannel, sentiment, lastInteraction) {
    const sentimentText = {
        positive: 'has shown positive engagement',
        neutral: 'has had neutral interactions',
        negative: 'has expressed some concerns'
    };

    let summary = `${customer.name} has had ${totalInteractions} interaction${totalInteractions > 1 ? 's' : ''} `;

    if (daysSinceFirst > 0) {
        summary += `over ${daysSinceFirst} day${daysSinceFirst > 1 ? 's' : ''}. `;
    } else {
        summary += 'today. ';
    }

    summary += `They ${sentimentText[sentiment]} and prefer ${primaryChannel}. `;

    if (lastInteraction) {
        const lastDate = new Date(lastInteraction.createdAt).toLocaleDateString();
        summary += `Last contact was on ${lastDate} via ${lastInteraction.channel}.`;
    }

    return summary;
}

/**
 * Get recommended approach based on context
 */
function getRecommendedApproach(sentiment, intent, topics) {
    if (sentiment === 'negative') {
        return 'Address their concerns first. Listen actively and acknowledge any issues before proceeding.';
    }

    if (intent === 'complaint') {
        return 'Handle with care. Focus on resolution and follow-up to ensure satisfaction.';
    }

    if (intent === 'purchase') {
        return 'Customer is ready to buy. Facilitate the process and answer any final questions.';
    }

    if (topics.includes('pricing') || topics.includes('cost')) {
        return 'Be prepared to discuss pricing options and value proposition.';
    }

    if (topics.includes('demo') || topics.includes('trial')) {
        return 'Offer a demonstration or trial to showcase the product/service.';
    }

    return 'Understand their current needs and provide relevant information.';
}

module.exports = {
    generateCustomerSummary,
    extractKeyTopics
};
