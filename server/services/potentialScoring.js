/**
 * Customer Potential Scoring Service (Rule-Based - Phase 1)
 * 
 * Calculates customer potential score based on multiple factors.
 * Provides full explainability for each score component.
 * 
 * SCORING FACTORS:
 * - Intent Strength (30%): Strong purchase intent = higher score
 * - Engagement Frequency (25%): More interactions = higher engagement
 * - Budget Clarity (20%): Clear budget = serious buyer
 * - Agent Keywords (15%): Positive keywords boost score
 * - Recency (10%): Recent activity matters
 * 
 * POTENTIAL LEVELS:
 * - High: 70-100 (Priority customers)
 * - Medium: 40-69 (Nurture candidates)
 * - Low: 20-39 (Low priority)
 * - Spam: 0-19 (Likely not genuine)
 */

// Keywords that indicate positive/negative potential
const KEYWORD_SIGNALS = {
    positive: [
        'interested', 'budget-confirmed', 'decision-maker', 'urgent',
        'ready-to-buy', 'comparing-options', 'serious', 'timeline-set',
        'referral', 'enterprise', 'expansion', 'upgrade'
    ],
    negative: [
        'just-browsing', 'no-budget', 'competitor-loyalist', 'price-only',
        'spam', 'wrong-number', 'not-interested', 'do-not-call'
    ]
};

// Intent to score mapping
const INTENT_SCORES = {
    'purchase': 100,
    'follow-up': 70,
    'inquiry': 50,
    'support': 40,
    'complaint': 30,
    'unknown': 25
};

/**
 * Calculate Intent Strength Score (0-100)
 */
function calculateIntentScore(customer) {
    const intent = customer.currentIntent || 'unknown';
    const baseScore = INTENT_SCORES[intent] || 25;

    // Boost by confidence
    const confidence = customer.intentConfidence || 0;
    const adjustedScore = baseScore * (0.7 + (confidence / 100) * 0.3);

    let reason = `Intent "${intent}" `;
    if (confidence > 70) {
        reason += `with high confidence (${confidence}%)`;
    } else if (confidence > 40) {
        reason += `with moderate confidence (${confidence}%)`;
    } else {
        reason += `with low confidence (${confidence}%)`;
    }

    return {
        score: Math.round(adjustedScore),
        reason
    };
}

/**
 * Calculate Engagement Frequency Score (0-100)
 */
function calculateEngagementScore(customer, interactions = []) {
    const interactionCount = customer.interactionCount || interactions.length || 0;

    // Scoring tiers
    let score;
    let reason;

    if (interactionCount >= 10) {
        score = 100;
        reason = `Highly engaged: ${interactionCount} interactions`;
    } else if (interactionCount >= 5) {
        score = 80;
        reason = `Well engaged: ${interactionCount} interactions`;
    } else if (interactionCount >= 3) {
        score = 60;
        reason = `Moderately engaged: ${interactionCount} interactions`;
    } else if (interactionCount >= 1) {
        score = 40;
        reason = `New engagement: ${interactionCount} interaction(s)`;
    } else {
        score = 20;
        reason = 'No prior interactions';
    }

    // Bonus for multi-channel engagement
    const channelStats = customer.channelStats || {};
    const channelsUsed = Object.values(channelStats).filter(c => c > 0).length;
    if (channelsUsed >= 2) {
        score = Math.min(100, score + 10);
        reason += ` across ${channelsUsed} channels`;
    }

    return { score, reason };
}

/**
 * Calculate Budget Clarity Score (0-100)
 */
function calculateBudgetScore(customer) {
    const budget = customer.preferences?.budget || 'not-specified';

    const budgetScores = {
        'premium': 100,
        'high': 85,
        'medium': 60,
        'low': 40,
        'not-specified': 25
    };

    const score = budgetScores[budget] || 25;
    let reason;

    if (budget === 'not-specified') {
        reason = 'Budget not yet discussed';
    } else {
        reason = `Budget indicated: ${budget}`;
    }

    // Boost if urgency is high
    if (customer.preferences?.urgency === 'high') {
        return {
            score: Math.min(100, score + 15),
            reason: reason + ' with high urgency'
        };
    }

    return { score, reason };
}

/**
 * Calculate Keyword Signals Score (0-100)
 */
function calculateKeywordScore(customer) {
    const keywords = customer.keywords?.map(k => k.keyword.toLowerCase()) || [];

    if (keywords.length === 0) {
        return {
            score: 50, // Neutral
            reason: 'No keywords tagged'
        };
    }

    let positiveCount = 0;
    let negativeCount = 0;
    const positiveMatches = [];
    const negativeMatches = [];

    keywords.forEach(keyword => {
        if (KEYWORD_SIGNALS.positive.some(p => keyword.includes(p))) {
            positiveCount++;
            positiveMatches.push(keyword);
        }
        if (KEYWORD_SIGNALS.negative.some(n => keyword.includes(n))) {
            negativeCount++;
            negativeMatches.push(keyword);
        }
    });

    // Calculate score based on positive/negative balance
    const baseScore = 50;
    const positiveBoost = positiveCount * 15;
    const negativePenalty = negativeCount * 20;

    const score = Math.max(0, Math.min(100, baseScore + positiveBoost - negativePenalty));

    let reason;
    if (positiveCount > 0 && negativeCount === 0) {
        reason = `Positive signals: ${positiveMatches.slice(0, 3).join(', ')}`;
    } else if (negativeCount > 0 && positiveCount === 0) {
        reason = `Warning signals: ${negativeMatches.slice(0, 3).join(', ')}`;
    } else if (positiveCount > 0 && negativeCount > 0) {
        reason = `Mixed signals: ${positiveCount} positive, ${negativeCount} negative`;
    } else {
        reason = `${keywords.length} neutral keywords`;
    }

    return { score, reason };
}

/**
 * Calculate Recency Score (0-100)
 */
function calculateRecencyScore(customer) {
    const lastInteraction = customer.lastInteraction;

    if (!lastInteraction) {
        return {
            score: 20,
            reason: 'No interaction date recorded'
        };
    }

    const now = new Date();
    const lastDate = new Date(lastInteraction);
    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    let score;
    let reason;

    if (daysSince <= 1) {
        score = 100;
        reason = 'Interacted today or yesterday';
    } else if (daysSince <= 3) {
        score = 90;
        reason = `Interacted ${daysSince} days ago`;
    } else if (daysSince <= 7) {
        score = 75;
        reason = `Interacted within the past week`;
    } else if (daysSince <= 14) {
        score = 55;
        reason = `Interacted ${daysSince} days ago`;
    } else if (daysSince <= 30) {
        score = 35;
        reason = 'Interacted within the past month';
    } else {
        score = 15;
        reason = `No interaction for ${daysSince} days`;
    }

    return { score, reason };
}

/**
 * Calculate the overall potential score
 * 
 * @param {Object} customer - Customer document
 * @param {Array} interactions - Recent interactions (optional)
 * @returns {Object} { score, level, breakdown, explanation }
 */
function calculatePotentialScore(customer, interactions = []) {
    // Calculate each component
    const intentResult = calculateIntentScore(customer);
    const engagementResult = calculateEngagementScore(customer, interactions);
    const budgetResult = calculateBudgetScore(customer);
    const keywordResult = calculateKeywordScore(customer);
    const recencyResult = calculateRecencyScore(customer);

    // Weights (must sum to 1.0)
    const weights = {
        intentStrength: 0.30,
        engagementFrequency: 0.25,
        budgetClarity: 0.20,
        keywordSignals: 0.15,
        recency: 0.10
    };

    // Calculate weighted score
    const weightedScore =
        (intentResult.score * weights.intentStrength) +
        (engagementResult.score * weights.engagementFrequency) +
        (budgetResult.score * weights.budgetClarity) +
        (keywordResult.score * weights.keywordSignals) +
        (recencyResult.score * weights.recency);

    const finalScore = Math.round(weightedScore);

    // Determine level
    let level;
    if (finalScore >= 70) {
        level = 'high';
    } else if (finalScore >= 40) {
        level = 'medium';
    } else if (finalScore >= 20) {
        level = 'low';
    } else {
        level = 'spam';
    }

    // Build breakdown for explainability
    const breakdown = {
        intentStrength: {
            score: intentResult.score,
            weight: weights.intentStrength,
            reason: intentResult.reason
        },
        engagementFrequency: {
            score: engagementResult.score,
            weight: weights.engagementFrequency,
            reason: engagementResult.reason
        },
        budgetClarity: {
            score: budgetResult.score,
            weight: weights.budgetClarity,
            reason: budgetResult.reason
        },
        keywordSignals: {
            score: keywordResult.score,
            weight: weights.keywordSignals,
            reason: keywordResult.reason
        },
        recency: {
            score: recencyResult.score,
            weight: weights.recency,
            reason: recencyResult.reason
        }
    };

    // Generate summary explanation
    const topFactor = Object.entries(breakdown)
        .sort((a, b) => (b[1].score * b[1].weight) - (a[1].score * a[1].weight))[0];

    const explanation = `${level.toUpperCase()} potential (${finalScore}/100). ` +
        `Strongest signal: ${topFactor[0].replace(/([A-Z])/g, ' $1').trim()} - ${topFactor[1].reason}`;

    return {
        score: finalScore,
        level,
        breakdown,
        explanation
    };
}

/**
 * Get level from score
 */
function getLevelFromScore(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'spam';
}

module.exports = {
    calculatePotentialScore,
    getLevelFromScore,
    KEYWORD_SIGNALS
};
