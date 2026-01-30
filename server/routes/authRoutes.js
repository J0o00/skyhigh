/**
 * Auth Routes
 * 
 * Unified authentication for all user roles.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');

/**
 * POST /api/auth/register
 * Register a new user (client, agent, or admin)
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, role = 'client' } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'An account with this email already exists'
            });
        }

        // Validate role
        const allowedRoles = ['client', 'agent', 'admin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be client, agent, or admin'
            });
        }

        // Create user
        const user = new User({
            name,
            email: email.toLowerCase(),
            phone,
            password,
            role
        });

        // For clients, also create a Customer profile
        if (role === 'client') {
            const customer = new Customer({
                name,
                email: email.toLowerCase(),
                phone: phone || 'Not provided',
                currentIntent: 'inquiry',
                potentialLevel: 'medium',
                potentialScore: 50
            });
            await customer.save();
            user.customerId = customer._id;
        }

        await user.save();

        res.status(201).json({
            success: true,
            data: {
                user: user.toSafeObject(),
                message: 'Account created successfully'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'An account with this email already exists'
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const query = { email: email.toLowerCase() };
        if (role) {
            query.role = role;
        }

        const user = await User.findOne(query);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check password
        if (!user.checkPassword(password)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Update online status
        user.isOnline = true;
        user.lastActive = new Date();
        await user.save();

        res.json({
            success: true,
            data: {
                user: user.toSafeObject(),
                message: 'Login successful'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req, res) => {
    try {
        const { userId } = req.body;

        if (userId) {
            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastActive: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/auth/me/:userId
 * Get current user info
 */
router.get('/me/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user: user.toSafeObject() }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get('/users', async (req, res) => {
    try {
        const { role } = req.query;
        const query = {};
        if (role) query.role = role;

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { users, count: users.length }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
