/**
 * Agents Routes
 * 
 * Manages agent profiles and authentication (simplified for MVP).
 */

const express = require('express');
const router = express.Router();
const { Agent } = require('../models');

/**
 * GET /api/agents
 * Get all agents
 */
router.get('/', async (req, res) => {
    try {
        const { isOnline, role } = req.query;

        const query = { isActive: true };
        if (isOnline !== undefined) {
            query.isOnline = isOnline === 'true';
        }
        if (role) {
            query.role = role;
        }

        const agents = await Agent.find(query)
            .select('-__v')
            .sort({ name: 1 })
            .lean();

        res.json({
            success: true,
            data: agents
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/agents/:id
 * Get single agent
 */
router.get('/:id', async (req, res) => {
    try {
        const agent = await Agent.findById(req.params.id)
            .select('-__v')
            .lean();

        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' });
        }

        res.json({
            success: true,
            data: agent
        });
    } catch (error) {
        console.error('Error fetching agent:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/agents
 * Create new agent
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, role = 'agent' } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'name and email are required'
            });
        }

        // Check if email already exists
        const existing = await Agent.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Agent with this email already exists',
                existingAgentId: existing._id
            });
        }

        const agent = new Agent({
            name,
            email: email.toLowerCase(),
            role
        });

        await agent.save();

        res.status(201).json({
            success: true,
            data: agent
        });
    } catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/agents/:id
 * Update agent
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, role, isActive } = req.body;

        const agent = await Agent.findById(req.params.id);
        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' });
        }

        if (name) agent.name = name;
        if (role) agent.role = role;
        if (isActive !== undefined) agent.isActive = isActive;

        await agent.save();

        res.json({
            success: true,
            data: agent
        });
    } catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/agents/login
 * Simple login (MVP - no password, just email)
 */
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'email is required'
            });
        }

        const agent = await Agent.findOne({
            email: email.toLowerCase(),
            isActive: true
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found or inactive'
            });
        }

        // Update online status
        agent.isOnline = true;
        agent.lastActive = new Date();
        await agent.save();

        res.json({
            success: true,
            data: agent,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/agents/:id/logout
 * Agent logout
 */
router.post('/:id/logout', async (req, res) => {
    try {
        const agent = await Agent.findByIdAndUpdate(
            req.params.id,
            {
                isOnline: false,
                currentCallId: null
            },
            { new: true }
        );

        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' });
        }

        res.json({
            success: true,
            data: agent,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/agents/:id/stats
 * Get agent statistics
 */
router.get('/:id/stats', async (req, res) => {
    try {
        const agent = await Agent.findById(req.params.id);
        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' });
        }

        res.json({
            success: true,
            data: {
                metrics: agent.metrics,
                lastActive: agent.lastActive,
                currentCallId: agent.currentCallId
            }
        });
    } catch (error) {
        console.error('Error fetching agent stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
