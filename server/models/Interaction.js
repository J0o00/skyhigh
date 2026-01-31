/**
 * Interaction Model
 * 
 * Records every customer interaction across all channels.
 * This is the primary data source for:
 * - Building interaction timeline
 * - Training intent detection
 * - Calculating engagement scores
 * 
 * DESIGN NOTE:
 * Each interaction is immutable after creation (append-only log).
 * Updates to customer state happen on the Customer model.
 */

const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    // References
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: false  // Optional for unassigned inbound messages
    },

    // Channel Information
    channel: {
        type: String,
        enum: ['email', 'phone', 'chat'],
        required: true
    },
    direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true
    },

    // Interaction Content
    summary: {
        type: String,
        required: true
    },

    // For email/chat - store actual content
    content: {
        type: String
    },

    // Full transcript for voice calls
    transcript: [{
        speaker: String,
        text: String,
        timestamp: Date
    }],

    // Call-specific fields
    callDuration: {
        type: Number // in seconds
    },

    // Outcome & Intent
    outcome: {
        type: String,
        enum: [
            'pending',       // Awaiting response
            'positive',      // Customer showed interest
            'neutral',       // Information exchange
            'negative',      // Customer showed disinterest
            'escalated',     // Needed senior help
            'converted',     // Sale/conversion happened
            'scheduled',     // Follow-up scheduled
            'no-answer',     // Call not answered
            'voicemail'      // Left voicemail
        ],
        default: 'pending'
    },

    intent: {
        type: String,
        enum: ['purchase', 'inquiry', 'complaint', 'support', 'follow-up', 'general', 'appreciation', 'unknown'],
        default: 'unknown'
    },

    // Keywords discussed (from predefined list)
    keywords: [{
        type: String
    }],

    // Objections raised by customer
    objections: [{
        type: String
    }],

    // Follow-up tracking
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: {
        type: Date
    },
    followUpCompleted: {
        type: Boolean,
        default: false
    },

    // Points to remember for next interaction
    pointsToRemember: [{
        type: String
    }],

    // Things not to repeat
    doNotRepeat: [{
        type: String
    }],

    // Agent notes
    notes: {
        type: String
    },

    // Linked to call summary (for phone interactions)
    callSummaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CallSummary'
    }
}, {
    timestamps: true
});

// Compound index for customer timeline queries
interactionSchema.index({ customerId: 1, createdAt: -1 });

// Index for follow-up queries
interactionSchema.index({ followUpRequired: 1, followUpDate: 1, followUpCompleted: 1 });

// Method to get a short display summary
interactionSchema.methods.getDisplaySummary = function (maxLength = 100) {
    if (this.summary.length <= maxLength) return this.summary;
    return this.summary.substring(0, maxLength - 3) + '...';
};

// Static method to get recent interactions for a customer
interactionSchema.statics.getRecentForCustomer = async function (customerId, limit = 10) {
    return this.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('agentId', 'name');
};

module.exports = mongoose.model('Interaction', interactionSchema);
