/**
 * User Model
 * 
 * Unified user model for all roles: client, agent, admin.
 * Replaces the old Agent model with proper authentication.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
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
    phone: {
        type: String,
        trim: true,
        sparse: true
    },

    // Authentication
    password: {
        type: String,
        required: true
    },

    // Role
    role: {
        type: String,
        enum: ['client', 'agent', 'admin'],
        required: true,
        default: 'client'
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

    // For agents - current call status
    currentCallId: {
        type: String,
        default: null
    },

    // Performance metrics (for agents)
    metrics: {
        totalCalls: { type: Number, default: 0 },
        totalEmails: { type: Number, default: 0 },
        totalChats: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 }
    },

    // For clients - link to customer profile
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },

    // Last activity
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', function (next) {
    if (!this.isModified('password')) return next();

    // Simple hash for MVP (in production, use bcrypt)
    this.password = crypto.createHash('sha256').update(this.password).digest('hex');
    next();
});

// Method to check password
userSchema.methods.checkPassword = function (password) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return this.password === hash;
};

// Method to get safe user object (without password)
userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isOnline: 1 });

module.exports = mongoose.model('User', userSchema);
