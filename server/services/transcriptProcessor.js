/**
 * Transcript Processor Service
 * 
 * Processes call transcripts for:
 * - Intent detection
 * - Keyword extraction
 * - Sentiment analysis
 * - Summary generation
 */

const { detectIntent } = require('./intentDetection');

// Keyword patterns for extraction
const keywordPatterns = {
    intent: ['buy', 'purchase', 'interested', 'want', 'need', 'looking for', 'demo', 'trial'],
    objection: ['expensive', 'costly', 'budget', 'not now', 'later', 'think about', 'competitor'],
    positive: ['great', 'excellent', 'perfect', 'love', 'amazing', 'helpful', 'thank'],
    negative: ['problem', 'issue', 'frustrated', 'angry', 'disappointed', 'terrible', 'worst'],
    timeline: ['urgent', 'asap', 'immediately', 'next week', 'next month', 'soon', 'quickly']
};

// Sentiment keywords and scores
const sentimentScores = {
    positive: ['thank', 'great', 'excellent', 'perfect', 'love', 'amazing', 'helpful', 'good', 'wonderful', 'appreciate'],
    negative: ['problem', 'issue', 'frustrated', 'angry', 'disappointed', 'terrible', 'worst', 'bad', 'hate', 'awful']
};

/**
 * Process transcript and extract insights
 */
async function processTranscript(transcript, session) {
    // Combine all text for analysis
    const customerMessages = transcript
        .filter(t => t.speaker === 'customer')
        .map(t => t.text)
        .join(' ');

    const agentMessages = transcript
        .filter(t => t.speaker === 'agent')
        .map(t => t.text)
        .join(' ');

    const allText = transcript.map(t => t.text).join(' ').toLowerCase();

    // Extract keywords
    const keywords = extractKeywords(allText);

    // Detect intent from customer messages
    const intentResult = detectIntentFromText(customerMessages);

    // Analyze sentiment
    const sentiment = analyzeSentiment(allText);

    // Generate summary
    const summary = generateSummary(transcript, intentResult, sentiment, keywords);

    // Determine outcome based on analysis
    const outcome = determineOutcome(intentResult, sentiment, keywords);

    return {
        summary,
        intent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        keywords,
        sentiment: sentiment.label,
        sentimentScore: sentiment.score,
        outcome,
        messageCount: transcript.length,
        customerMessages: transcript.filter(t => t.speaker === 'customer').length,
        agentMessages: transcript.filter(t => t.speaker === 'agent').length,
        duration: session.duration,
        processedAt: new Date()
    };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
    const textLower = text.toLowerCase();
    const found = [];

    for (const [category, patterns] of Object.entries(keywordPatterns)) {
        for (const pattern of patterns) {
            if (textLower.includes(pattern)) {
                found.push({
                    keyword: pattern,
                    category
                });
            }
        }
    }

    // Return unique keywords
    const unique = [];
    const seen = new Set();
    for (const kw of found) {
        if (!seen.has(kw.keyword)) {
            seen.add(kw.keyword);
            unique.push(kw.keyword);
        }
    }

    return unique;
}

/**
 * Detect intent from customer text
 */
function detectIntentFromText(text) {
    const textLower = text.toLowerCase();

    // Purchase intent signals
    const purchaseSignals = ['buy', 'purchase', 'order', 'sign up', 'subscribe', 'get started', 'pricing'];
    const inquirySignals = ['how', 'what', 'tell me', 'explain', 'information', 'learn more', 'curious'];
    const supportSignals = ['help', 'issue', 'problem', 'not working', 'error', 'fix', 'broken'];
    const complaintSignals = ['complaint', 'frustrated', 'angry', 'worst', 'terrible', 'refund', 'cancel'];

    let intent = 'unknown';
    let confidence = 30;

    // Check for purchase intent
    if (purchaseSignals.some(s => textLower.includes(s))) {
        intent = 'purchase';
        confidence = 75;
    }
    // Check for inquiry
    else if (inquirySignals.some(s => textLower.includes(s))) {
        intent = 'inquiry';
        confidence = 65;
    }
    // Check for support
    else if (supportSignals.some(s => textLower.includes(s))) {
        intent = 'support';
        confidence = 70;
    }
    // Check for complaint
    else if (complaintSignals.some(s => textLower.includes(s))) {
        intent = 'complaint';
        confidence = 80;
    }

    return { intent, confidence };
}

/**
 * Analyze sentiment
 */
function analyzeSentiment(text) {
    const textLower = text.toLowerCase();
    let score = 0;

    // Count positive words
    for (const word of sentimentScores.positive) {
        if (textLower.includes(word)) {
            score += 1;
        }
    }

    // Count negative words
    for (const word of sentimentScores.negative) {
        if (textLower.includes(word)) {
            score -= 1;
        }
    }

    // Normalize to -1 to 1 range
    const normalized = Math.max(-1, Math.min(1, score / 5));

    let label = 'neutral';
    if (normalized > 0.2) label = 'positive';
    else if (normalized < -0.2) label = 'negative';

    return {
        score: normalized,
        label
    };
}

/**
 * Generate call summary
 */
function generateSummary(transcript, intentResult, sentiment, keywords) {
    const messageCount = transcript.length;
    const customerMsgCount = transcript.filter(t => t.speaker === 'customer').length;

    let summary = `WebRTC call with ${messageCount} exchanges. `;

    // Add intent info
    if (intentResult.intent !== 'unknown') {
        summary += `Customer intent: ${intentResult.intent} (${intentResult.confidence}% confidence). `;
    }

    // Add sentiment
    summary += `Overall sentiment: ${sentiment.label}. `;

    // Add keywords if found
    if (keywords.length > 0) {
        summary += `Key topics: ${keywords.slice(0, 5).join(', ')}.`;
    }

    return summary;
}

/**
 * Determine call outcome
 */
function determineOutcome(intentResult, sentiment, keywords) {
    // Positive engagement
    if (intentResult.intent === 'purchase' && sentiment.label !== 'negative') {
        return 'positive';
    }

    // Interested but not ready
    if (intentResult.intent === 'inquiry') {
        return 'neutral';
    }

    // Support or complaint
    if (intentResult.intent === 'support' || intentResult.intent === 'complaint') {
        return sentiment.label === 'positive' ? 'positive' : 'neutral';
    }

    // Default based on sentiment
    if (sentiment.label === 'positive') return 'positive';
    if (sentiment.label === 'negative') return 'negative';

    return 'neutral';
}

module.exports = {
    processTranscript,
    extractKeywords,
    detectIntentFromText,
    analyzeSentiment
};
