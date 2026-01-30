/**
 * Keyword Model
 * 
 * Predefined keywords for agent tagging.
 * These act as soft labels for ML training.
 * 
 * DESIGN NOTES:
 * - Keywords are domain-specific and curated
 * - Categories help organize keywords in the UI
 * - Weight indicates importance for scoring
 * - sentimentImpact affects potential scoring
 */

const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
    // Keyword text
    keyword: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    // Category for UI grouping
    category: {
        type: String,
        enum: [
            'intent',        // Purchase intent signals
            'objection',     // Common objections
            'product',       // Product-related
            'competitor',    // Competitor mentions
            'timeline',      // Timing signals
            'budget',        // Budget-related
            'decision',      // Decision-making signals
            'sentiment',     // Emotional indicators
            'other'
        ],
        required: true
    },

    // Display label (for UI)
    displayLabel: {
        type: String,
        trim: true
    },

    // Weight for scoring calculations (0-1)
    weight: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
    },

    // Impact on potential score
    sentimentImpact: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral'
    },

    // Whether this keyword was suggested by an agent
    isAgentSuggested: {
        type: Boolean,
        default: false
    },
    suggestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent'
    },

    // Approval status for agent-suggested keywords
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },

    // Usage count (for analytics)
    usageCount: {
        type: Number,
        default: 0
    },

    // Active status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for quick lookups
keywordSchema.index({ category: 1, isActive: 1 });
keywordSchema.index({ keyword: 'text' }); // Text search

// Virtual for display
keywordSchema.virtual('label').get(function () {
    return this.displayLabel || this.keyword;
});

keywordSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Keyword', keywordSchema);
