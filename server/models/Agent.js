/**
 * Agent Model
 * 
 * Represents agents who use the platform.
 * Now includes proper password authentication with bcrypt.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

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
    
    // Authentication
    password: {
        type: String,
        required: false // Optional for backwards compatibility
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

// Hash password before saving using bcrypt
agentSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
agentSchema.methods.checkPassword = async function (password) {
    if (!this.password) return false;
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

// Method to get safe agent object (without password)
agentSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// Index for quick lookup
// Note: email index is automatically created by unique: true
agentSchema.index({ isOnline: 1 });

module.exports = mongoose.model('Agent', agentSchema);
