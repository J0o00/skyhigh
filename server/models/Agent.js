/**
 * Agent Model
 * 
 * Represents agents who use the platform.
 * For MVP, this is simplified without full authentication.
 */

const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    // Role
    role: {
        type: String,
        enum: ['customer', 'agent', 'senior-agent', 'supervisor', 'admin'],
        default: 'customer'
    },

    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    isOnline: {
        type: Boolean,
        default: false
    },

    // Current call status (for real-time updates)
    currentCallId: {
        type: String,
        default: null
    },

    // Performance metrics (for future analytics)
    metrics: {
        totalCalls: { type: Number, default: 0 },
        totalEmails: { type: Number, default: 0 },
        totalChats: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 }
    },

    // Last activity
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for quick lookup
agentSchema.index({ email: 1 });
agentSchema.index({ isOnline: 1 });

module.exports = mongoose.model('Agent', agentSchema);
