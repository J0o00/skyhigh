/**
 * CallSummary Model
 * 
 * Stores post-call summaries submitted by agents.
 * This is CRITICAL data for ML training.
 * 
 * DESIGN NOTES:
 * - Every call must have a summary (enforced in UI)
 * - Agent-provided data is the primary training input
 * - This creates labeled data for intent/outcome prediction
 */

const mongoose = require('mongoose');

const callSummarySchema = new mongoose.Schema({
    // Call identification
    callId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // References
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },

    // Call metadata
    callerNumber: {
        type: String,
        required: true
    },
    callStartTime: {
        type: Date,
        required: true
    },
    callEndTime: {
        type: Date
    },
    callDuration: {
        type: Number // seconds
    },
    direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        default: 'inbound'
    },

    // Agent-provided summary (CRITICAL ML DATA)
    outcome: {
        type: String,
        enum: [
            'interested',
            'needs-info',
            'callback-requested',
            'not-interested',
            'converted',
            'escalated',
            'wrong-number',
            'no-response'
        ],
        required: true
    },

    // Updated intent based on call
    updatedIntent: {
        type: String,
        enum: ['purchase', 'inquiry', 'complaint', 'support', 'follow-up', 'unknown'],
        required: true
    },

    // Keywords discussed during call
    keywordsDiscussed: [{
        type: String
    }],

    // Objections raised
    objections: [{
        type: String
    }],

    // Summary text
    summaryText: {
        type: String,
        required: true
    },

    // Follow-up
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: {
        type: Date
    },
    followUpNotes: {
        type: String
    },

    // Points for next call
    pointsToRemember: [{
        type: String
    }],

    // Things not to repeat
    doNotRepeat: [{
        type: String
    }],

    // Customer potential assessment
    potentialAssessment: {
        type: String,
        enum: ['high', 'medium', 'low', 'spam'],
        required: true
    },

    // Confidence in assessment (agent self-rating)
    assessmentConfidence: {
        type: String,
        enum: ['very-confident', 'somewhat-confident', 'unsure'],
        default: 'somewhat-confident'
    },

    // Was assist panel helpful?
    assistPanelHelpful: {
        type: Boolean
    },
    assistFeedback: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for queries
callSummarySchema.index({ customerId: 1, createdAt: -1 });
callSummarySchema.index({ agentId: 1, createdAt: -1 });
callSummarySchema.index({ outcome: 1 });
callSummarySchema.index({ updatedIntent: 1 });

module.exports = mongoose.model('CallSummary', callSummarySchema);
