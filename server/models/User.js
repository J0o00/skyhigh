/**
 * User Model
 * 
 * Unified user model for all roles: client, agent, admin.
 * Replaces the old Agent model with proper authentication.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12; // Industry standard for bcrypt

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

// Hash password before saving using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        // Use bcrypt for secure password hashing
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password using bcrypt
userSchema.methods.checkPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

// Method to get safe user object (without password)
userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// Indexes
// Note: email index is automatically created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ isOnline: 1 });

module.exports = mongoose.model('User', userSchema);
