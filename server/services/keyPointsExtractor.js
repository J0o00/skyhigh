/**
 * Email Key Points Extractor
 * 
 * Extracts main points from email content for agent summary.
 */

/**
 * Extract key points from email content
 * @param {string} subject - Email subject
 * @param {string} body - Email body text
 * @returns {Object} Extracted key points
 */
function extractKeyPoints(subject, body) {
    const keyPoints = {
        subject: subject || '(No Subject)',
        mainIntent: detectIntent(subject, body),
        urgency: detectUrgency(subject, body),
        keyPhrases: extractKeyPhrases(body),
        actionRequired: detectActionRequired(body),
        sentiment: detectSentiment(body),
        summary: generateBriefSummary(body)
    };

    return keyPoints;
}

/**
 * Detect the main intent of the email
 */
function detectIntent(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();

    const intents = {
        'complaint': ['complaint', 'unhappy', 'disappointed', 'terrible', 'worst', 'refund', 'cancel'],
        'inquiry': ['how to', 'what is', 'can you', 'could you', 'question', 'wondering', 'info', 'details'],
        'support': ['help', 'issue', 'problem', 'not working', 'error', 'broken', 'fix'],
        'purchase': ['buy', 'order', 'price', 'cost', 'purchase', 'payment', 'subscribe'],
        'follow-up': ['following up', 'checking in', 'any update', 'status', 'waiting'],
        'appreciation': ['thank', 'great', 'excellent', 'amazing', 'love', 'appreciate']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return intent;
        }
    }

    return 'general';
}

/**
 * Detect urgency level
 */
function detectUrgency(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline', 'today'];
    const highKeywords = ['soon', 'quickly', 'priority', 'important'];

    if (urgentKeywords.some(k => text.includes(k))) return 'urgent';
    if (highKeywords.some(k => text.includes(k))) return 'high';
    return 'normal';
}

/**
 * Extract key phrases from the email
 */
function extractKeyPhrases(body) {
    if (!body) return [];

    // Clean the text
    const cleanText = body
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')
        .trim();

    // Split into sentences
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Take first 3 meaningful sentences as key phrases
    const keyPhrases = sentences.slice(0, 3).map(s => s.trim().substring(0, 100));

    return keyPhrases;
}

/**
 * Detect if action is required
 */
function detectActionRequired(body) {
    const text = (body || '').toLowerCase();
    const actionKeywords = [
        'please', 'could you', 'can you', 'need', 'want', 'require',
        'reply', 'respond', 'call me', 'contact me', 'get back'
    ];

    return actionKeywords.some(k => text.includes(k));
}

/**
 * Simple sentiment detection
 */
function detectSentiment(body) {
    const text = (body || '').toLowerCase();

    const positiveWords = ['thank', 'great', 'good', 'excellent', 'happy', 'love', 'appreciate', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'disappointed', 'angry', 'frustrated', 'unhappy', 'complaint'];

    const positiveCount = positiveWords.filter(w => text.includes(w)).length;
    const negativeCount = negativeWords.filter(w => text.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
}

/**
 * Generate a brief summary (first ~200 chars of cleaned content)
 */
function generateBriefSummary(body) {
    if (!body) return 'No content';

    // Clean the text
    const cleanText = body
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ')
        .replace(/^\s*[-*]\s*/gm, '') // Remove bullet markers
        .trim();

    // Return first 200 characters
    if (cleanText.length <= 200) return cleanText;
    return cleanText.substring(0, 200).trim() + '...';
}

/**
 * Format key points for agent display
 */
function formatForAgent(keyPoints) {
    const urgencyIcons = {
        'urgent': '🔴',
        'high': '🟠',
        'normal': '🟢'
    };

    const sentimentIcons = {
        'positive': '😊',
        'negative': '😠',
        'neutral': '😐'
    };

    return {
        headline: keyPoints.subject,
        intent: keyPoints.mainIntent.toUpperCase(),
        urgency: `${urgencyIcons[keyPoints.urgency]} ${keyPoints.urgency.toUpperCase()}`,
        sentiment: `${sentimentIcons[keyPoints.sentiment]} ${keyPoints.sentiment}`,
        actionNeeded: keyPoints.actionRequired ? '⚡ Response Needed' : '📋 Read Only',
        briefSummary: keyPoints.summary,
        keyPhrases: keyPoints.keyPhrases
    };
}

module.exports = {
    extractKeyPoints,
    formatForAgent,
    detectIntent,
    detectUrgency,
    detectSentiment
};
