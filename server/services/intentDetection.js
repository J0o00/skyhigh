/**
 * Intent Detection Service (Rule-Based - Phase 1)
 * 
 * Detects customer intent from keywords, interaction history, and patterns.
 * 
 * INTENT TYPES:
 * - purchase: Customer wants to buy
 * - inquiry: Customer seeking information
 * - complaint: Customer has a problem/complaint
 * - support: Customer needs technical/product support
 * - follow-up: Continuation of previous conversation
 * - unknown: Cannot determine intent
 * 
 * DETECTION LOGIC:
 * 1. Keyword matching (weighted by category)
 * 2. Historical pattern analysis
 * 3. Recency weighting
 * 4. Confidence scoring
 */

// Keyword mappings for intent detection
const INTENT_KEYWORDS = {
    purchase: {
        strong: ['buy', 'purchase', 'order', 'payment', 'invoice', 'quote', 'pricing', 'discount', 'deal'],
        moderate: ['interested', 'consider', 'budget', 'afford', 'plan', 'ready', 'decide'],
        weak: ['looking', 'option', 'feature', 'compare']
    },
    inquiry: {
        strong: ['information', 'details', 'learn', 'know', 'how does', 'what is', 'explain'],
        moderate: ['curious', 'wondering', 'question', 'ask', 'clarify'],
        weak: ['about', 'regarding', 'concerning']
    },
    complaint: {
        strong: ['complaint', 'terrible', 'awful', 'unacceptable', 'refund', 'return', 'broken'],
        moderate: ['disappointed', 'frustrated', 'unhappy', 'issue', 'problem', 'wrong'],
        weak: ['concern', 'worry', 'trouble']
    },
    support: {
        strong: ['help', 'support', 'assist', 'troubleshoot', 'fix', 'repair', 'not working'],
        moderate: ['issue', 'problem', 'error', 'stuck', 'confused'],
        weak: ['question', 'how to', 'guidance']
    },
    'follow-up': {
        strong: ['following up', 'checking in', 'as discussed', 'last time', 'our conversation'],
        moderate: ['update', 'status', 'progress', 'next steps'],
        weak: ['remind', 'remember']
    }
};

// Weights for keyword strength
const STRENGTH_WEIGHTS = {
    strong: 1.0,
    moderate: 0.6,
    weak: 0.3
};

/**
 * Calculate intent score for a single intent type
 */
function calculateIntentScore(keywords, intentType) {
    const intentPatterns = INTENT_KEYWORDS[intentType];
    if (!intentPatterns) return 0;

    let score = 0;
    const matchedKeywords = [];

    // Normalize keywords for matching
    const normalizedKeywords = keywords.map(k => k.toLowerCase());

    // Check each strength level
    for (const [strength, patterns] of Object.entries(intentPatterns)) {
        for (const pattern of patterns) {
            // Check if any keyword contains this pattern
            const matched = normalizedKeywords.some(k => k.includes(pattern));
            if (matched) {
                score += STRENGTH_WEIGHTS[strength];
                matchedKeywords.push({ pattern, strength });
            }
        }
    }

    return { score, matchedKeywords };
}

/**
 * Detect intent from customer data and recent interactions
 * 
 * @param {Object} customer - Customer document
 * @param {Array} recentInteractions - Recent interaction documents
 * @returns {Object} { intent, confidence, explanation, breakdown }
 */
function detectIntent(customer, recentInteractions = []) {
    // Collect all keywords from various sources
    const allKeywords = [];

    // 1. Customer-tagged keywords (most relevant)
    if (customer.keywords && customer.keywords.length > 0) {
        allKeywords.push(...customer.keywords.map(k => k.keyword));
    }

    // 2. Keywords from recent interactions (with recency weighting)
    recentInteractions.forEach((interaction, index) => {
        if (interaction.keywords && interaction.keywords.length > 0) {
            // More recent interactions get higher weight (we'll count duplicates)
            const recencyMultiplier = Math.max(1, 3 - index); // 3 for most recent, 1 for older
            for (let i = 0; i < recencyMultiplier; i++) {
                allKeywords.push(...interaction.keywords);
            }
        }
    });

    // 3. Check most recent interaction intent (if agent-confirmed)
    let lastConfirmedIntent = null;
    if (recentInteractions.length > 0 && recentInteractions[0].intent !== 'unknown') {
        lastConfirmedIntent = recentInteractions[0].intent;
    }

    // Calculate scores for each intent
    const intentScores = {};
    const intentBreakdown = {};

    for (const intentType of Object.keys(INTENT_KEYWORDS)) {
        const { score, matchedKeywords } = calculateIntentScore(allKeywords, intentType);
        intentScores[intentType] = score;
        intentBreakdown[intentType] = {
            score,
            matchedKeywords,
            normalized: 0 // Will calculate below
        };
    }

    // Boost last confirmed intent
    if (lastConfirmedIntent && intentScores[lastConfirmedIntent] !== undefined) {
        intentScores[lastConfirmedIntent] *= 1.5;
        intentBreakdown[lastConfirmedIntent].boosted = true;
        intentBreakdown[lastConfirmedIntent].boostReason = 'Agent confirmed in last interaction';
    }

    // Find highest scoring intent
    let maxIntent = 'unknown';
    let maxScore = 0;

    for (const [intent, score] of Object.entries(intentScores)) {
        if (score > maxScore) {
            maxScore = score;
            maxIntent = intent;
        }
    }

    // Calculate confidence (0-100)
    // Confidence is based on:
    // 1. Absolute score (higher = more confident)
    // 2. Margin over second-best (larger margin = more confident)
    const scores = Object.values(intentScores).sort((a, b) => b - a);
    const margin = scores.length > 1 ? scores[0] - scores[1] : scores[0];

    let confidence = Math.min(100, Math.round(
        (maxScore * 20) + // Base score contribution
        (margin * 15)      // Margin contribution
    ));

    // Cap confidence at 85% for rule-based (ML can go higher)
    confidence = Math.min(confidence, 85);

    // Generate human-readable explanation
    let explanation = '';
    if (maxScore === 0) {
        explanation = 'Unable to detect intent - insufficient keyword signals.';
        maxIntent = 'unknown';
        confidence = 0;
    } else {
        const matched = intentBreakdown[maxIntent].matchedKeywords;
        const strongMatches = matched.filter(m => m.strength === 'strong').map(m => m.pattern);

        if (strongMatches.length > 0) {
            explanation = `Strong ${maxIntent} signals detected: "${strongMatches.slice(0, 3).join('", "')}".`;
        } else {
            explanation = `Moderate ${maxIntent} signals detected based on keyword patterns.`;
        }

        if (intentBreakdown[maxIntent].boosted) {
            explanation += ' Boosted by recent agent confirmation.';
        }
    }

    // Normalize breakdown scores for display
    const totalScore = Object.values(intentScores).reduce((a, b) => a + b, 0);
    if (totalScore > 0) {
        for (const intent of Object.keys(intentBreakdown)) {
            intentBreakdown[intent].normalized = Math.round((intentScores[intent] / totalScore) * 100);
        }
    }

    return {
        intent: maxIntent,
        confidence,
        explanation,
        breakdown: intentBreakdown,
        keywordCount: allKeywords.length
    };
}

/**
 * Check if intent should be updated after new interaction
 */
function shouldUpdateIntent(currentIntent, newIntentData) {
    // Always update if current is unknown
    if (currentIntent === 'unknown') return true;

    // Update if new intent has significantly higher confidence
    if (newIntentData.confidence >= 60 && newIntentData.intent !== currentIntent) {
        return true;
    }

    return false;
}

module.exports = {
    detectIntent,
    shouldUpdateIntent,
    INTENT_KEYWORDS
};
