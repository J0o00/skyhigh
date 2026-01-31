/**
 * Customer Model
 * 
 * Unified customer profile that aggregates data across all channels.
 * This is the central entity for customer intelligence.
 * 
 * SCHEMA DESIGN NOTES:
 * - keywords: Agent-tagged keywords with attribution for ML training
 * - scoreBreakdown: Stores explanation of how potential score was calculated
 * - preferences: Flexible structure for customer preferences
 */

const mongoose = require('mongoose');

// Sub-schema for agent-tagged keywords (Human-in-the-Loop)
const keywordTagSchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    // Track if this keyword was later confirmed or rejected
    confirmedRelevant: {
        type: Boolean,
        default: null // null = not yet reviewed, true/false = agent feedback
    }
}, { _id: false });

// Sub-schema for customer preferences
const preferencesSchema = new mongoose.Schema({
    budget: {
        type: String,
        enum: ['not-specified', 'low', 'medium', 'high', 'premium'],
        default: 'not-specified'
    },
    productInterest: [{
        type: String
    }],
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    preferredChannel: {
        type: String,
        enum: ['email', 'phone', 'chat', 'no-preference'],
        default: 'no-preference'
    },
    preferredTime: {
        type: String // e.g., "morning", "afternoon", "evening"
    }
}, { _id: false });

// Sub-schema for score breakdown (Explainability)
const scoreBreakdownSchema = new mongoose.Schema({
    intentStrength: {
        score: Number,
        weight: { type: Number, default: 0.30 },
        reason: String
    },
    engagementFrequency: {
        score: Number,
        weight: { type: Number, default: 0.25 },
        reason: String
    },
    budgetClarity: {
        score: Number,
        weight: { type: Number, default: 0.20 },
        reason: String
    },
    keywordSignals: {
        score: Number,
        weight: { type: Number, default: 0.15 },
        reason: String
    },
    recency: {
        score: Number,
        weight: { type: Number, default: 0.10 },
        reason: String
    }
}, { _id: false });

// Main Customer Schema
const customerSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        sparse: true // Allow multiple null/empty values
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    company: {
        type: String,
        trim: true
    },

    // Customer Preferences
    preferences: {
        type: preferencesSchema,
        default: () => ({})
    },

    // Agent-Tagged Keywords (Human-in-the-Loop Data)
    keywords: [keywordTagSchema],

    // Current Intent (Rule-based detection, agent-correctable)
    currentIntent: {
        type: String,
        enum: ['purchase', 'inquiry', 'complaint', 'support', 'follow-up', 'general', 'appreciation', 'unknown'],
        default: 'unknown'
    },
    intentConfidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    intentExplanation: {
        type: String
    },

    // Customer Potential Scoring
    potentialLevel: {
        type: String,
        enum: ['high', 'medium', 'low', 'spam'],
        default: 'medium'
    },
    potentialScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    scoreBreakdown: {
        type: scoreBreakdownSchema,
        default: () => ({})
    },

    // Interaction Metrics
    interactionCount: {
        type: Number,
        default: 0
    },
    lastInteraction: {
        type: Date
    },
    firstInteraction: {
        type: Date
    },

    // Channel-specific interaction counts
    channelStats: {
        email: { type: Number, default: 0 },
        phone: { type: Number, default: 0 },
        chat: { type: Number, default: 0 }
    },

    // Agent Feedback (for ML training)
    feedbackHistory: [{
        field: String, // e.g., 'intent', 'potentialLevel', 'keyword'
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        correctedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Agent'
        },
        correctedAt: {
            type: Date,
            default: Date.now
        },
        reason: String
    }],

    // Status
    status: {
        type: String,
        enum: ['active', 'converted', 'closed', 'dormant'],
        default: 'active'
    },

    // Notes
    notes: {
        type: String
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Indexes for common queries
customerSchema.index({ potentialLevel: 1 });
customerSchema.index({ currentIntent: 1 });
customerSchema.index({ lastInteraction: -1 });
customerSchema.index({ 'keywords.keyword': 1 });

// Virtual for full phone display
customerSchema.virtual('formattedPhone').get(function () {
    if (!this.phone) return '';
    // Format: +91 98765 43210
    const cleaned = this.phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return this.phone;
});

// Method to get keywords as simple array
customerSchema.methods.getKeywordList = function () {
    return this.keywords.map(k => k.keyword);
};

// Ensure virtuals are included in JSON
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);
