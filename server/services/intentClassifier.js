/**
 * Intent Classifier Service (FREE)
 * 
 * Uses Hugging Face Inference API with BART-large-MNLI
 * - 100% FREE (30,000 requests/month)
 * - No credit card required
 * - Get token: https://huggingface.co/settings/tokens
 */

const axios = require('axios');

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
const HF_MODEL = 'facebook/bart-large-mnli';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Intent categories for classification
const INTENT_LABELS = [
    'customer wants to make a purchase',
    'customer has a technical support question',
    'customer is making a complaint',
    'customer is asking for information',
    'customer wants to cancel or get a refund',
    'customer is giving feedback',
    'customer needs help with an existing order'
];

// Sentiment categories
const SENTIMENT_LABELS = [
    'positive and satisfied',
    'neutral',
    'negative and frustrated',
    'angry and upset'
];

// Urgency categories
const URGENCY_LABELS = [
    'urgent issue requiring immediate attention',
    'normal priority',
    'low priority general inquiry'
];

/**
 * Classify customer intent using BART-MNLI
 */
async function classifyIntent(text) {
    if (!HF_TOKEN) {
        console.warn('⚠️ HUGGINGFACE_TOKEN not set. Intent classification disabled.');
        return null;
    }

    if (!text || text.trim().length < 10) {
        return null;
    }

    try {
        const response = await axios.post(
            HF_API_URL,
            {
                inputs: text,
                parameters: {
                    candidate_labels: INTENT_LABELS,
                    multi_label: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10s timeout
            }
        );

        const data = response.data;

        // Extract top intent
        const topIntent = simplifyIntent(data.labels[0]);
        const confidence = Math.round(data.scores[0] * 100);

        // Get secondary intent if confidence is close
        let secondaryIntent = null;
        if (data.scores[1] > 0.3) {
            secondaryIntent = {
                intent: simplifyIntent(data.labels[1]),
                confidence: Math.round(data.scores[1] * 100)
            };
        }

        return {
            intent: topIntent,
            confidence,
            secondaryIntent,
            rawLabels: data.labels.slice(0, 3).map((label, i) => ({
                label: simplifyIntent(label),
                score: Math.round(data.scores[i] * 100)
            }))
        };

    } catch (error) {
        if (error.response?.status === 503) {
            console.log('⏳ Model is loading, please retry in 20s...');
        } else {
            console.error('Error classifying intent:', error.message);
        }
        return null;
    }
}

/**
 * Classify sentiment using BART-MNLI
 */
async function classifySentiment(text) {
    if (!HF_TOKEN || !text || text.trim().length < 10) {
        return null;
    }

    try {
        const response = await axios.post(
            HF_API_URL,
            {
                inputs: text,
                parameters: {
                    candidate_labels: SENTIMENT_LABELS,
                    multi_label: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const data = response.data;
        const sentiment = simplifySentiment(data.labels[0]);
        const confidence = Math.round(data.scores[0] * 100);

        return {
            sentiment,
            confidence,
            score: mapSentimentToScore(sentiment)
        };

    } catch (error) {
        console.error('Error classifying sentiment:', error.message);
        return null;
    }
}

/**
 * Classify urgency level
 */
async function classifyUrgency(text) {
    if (!HF_TOKEN || !text || text.trim().length < 10) {
        return null;
    }

    try {
        const response = await axios.post(
            HF_API_URL,
            {
                inputs: text,
                parameters: {
                    candidate_labels: URGENCY_LABELS,
                    multi_label: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const data = response.data;
        const urgency = simplifyUrgency(data.labels[0]);
        const confidence = Math.round(data.scores[0] * 100);

        return {
            urgency,
            confidence
        };

    } catch (error) {
        console.error('Error classifying urgency:', error.message);
        return null;
    }
}

/**
 * Classify all aspects at once (intent + sentiment + urgency)
 */
async function classifyAll(customerText) {
    if (!HF_TOKEN) {
        console.warn('⚠️ HUGGINGFACE_TOKEN not set. Classification disabled.');
        return null;
    }

    try {
        // Run all classifications in parallel for speed
        const [intent, sentiment, urgency] = await Promise.all([
            classifyIntent(customerText),
            classifySentiment(customerText),
            classifyUrgency(customerText)
        ]);

        return {
            intent: intent?.intent || 'unknown',
            intentConfidence: intent?.confidence || 0,
            sentiment: sentiment?.sentiment || 'neutral',
            sentimentConfidence: sentiment?.confidence || 0,
            sentimentScore: sentiment?.score || 0,
            urgency: urgency?.urgency || 'normal',
            urgencyConfidence: urgency?.confidence || 0,
            secondaryIntent: intent?.secondaryIntent
        };

    } catch (error) {
        console.error('Error in classifyAll:', error.message);
        return null;
    }
}

/**
 * Helper: Simplify intent labels
 */
function simplifyIntent(label) {
    if (label.includes('purchase')) return 'purchase';
    if (label.includes('support')) return 'support';
    if (label.includes('complaint')) return 'complaint';
    if (label.includes('information')) return 'inquiry';
    if (label.includes('cancel') || label.includes('refund')) return 'cancellation';
    if (label.includes('feedback')) return 'feedback';
    if (label.includes('order')) return 'order_help';
    return 'general';
}

/**
 * Helper: Simplify sentiment labels
 */
function simplifySentiment(label) {
    if (label.includes('positive') || label.includes('satisfied')) return 'positive';
    if (label.includes('negative') || label.includes('frustrated')) return 'negative';
    if (label.includes('angry') || label.includes('upset')) return 'angry';
    return 'neutral';
}

/**
 * Helper: Simplify urgency labels
 */
function simplifyUrgency(label) {
    if (label.includes('urgent') || label.includes('immediate')) return 'urgent';
    if (label.includes('low priority')) return 'low';
    return 'normal';
}

/**
 * Helper: Map sentiment to numeric score
 */
function mapSentimentToScore(sentiment) {
    const scoreMap = {
        'positive': 0.8,
        'neutral': 0,
        'negative': -0.6,
        'angry': -0.9
    };
    return scoreMap[sentiment] || 0;
}

/**
 * Check if classifier is configured
 */
function isConfigured() {
    return !!HF_TOKEN;
}

module.exports = {
    classifyIntent,
    classifySentiment,
    classifyUrgency,
    classifyAll,
    isConfigured
};
