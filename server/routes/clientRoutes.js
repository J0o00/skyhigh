/**
 * Client Routes
 * 
 * Client-specific endpoints for chat, email, and call interactions.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');

/**
 * POST /api/client/chat
 * Send a chat message
 */
router.post('/chat', async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                success: false,
                error: 'User ID and message are required'
            });
        }

        // Get user and their customer profile
        const user = await User.findById(userId);
        if (!user || user.role !== 'client') {
            return res.status(404).json({
                success: false,
                error: 'Client not found'
            });
        }

        // Create interaction
        const interaction = new Interaction({
            customerId: user.customerId,
            agentId: userId, // Self for client messages
            channel: 'chat',
            direction: 'inbound',
            summary: message,
            content: message,
            outcome: 'neutral',
            intent: 'inquiry'
        });
        await interaction.save();

        // Update customer stats
        await Customer.findByIdAndUpdate(user.customerId, {
            $inc: { interactionCount: 1, 'channelStats.chat': 1 },
            lastInteraction: new Date()
        });

        // Emit via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('chat:new', {
                interactionId: interaction._id,
                customerId: user.customerId,
                userId,
                userName: user.name,
                message,
                direction: 'inbound',
                channel: 'chat',
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            data: {
                interactionId: interaction._id,
                timestamp: interaction.createdAt
            }
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/client/email
 * Send an email
 */
router.post('/email', async (req, res) => {
    try {
        const { userId, subject, message } = req.body;

        if (!userId || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'User ID, subject, and message are required'
            });
        }

        const user = await User.findById(userId);
        if (!user || user.role !== 'client') {
            return res.status(404).json({
                success: false,
                error: 'Client not found'
            });
        }

        // Create interaction
        const interaction = new Interaction({
            customerId: user.customerId,
            agentId: userId,
            channel: 'email',
            direction: 'inbound',
            summary: `[${subject}] ${message.substring(0, 100)}...`,
            content: `Subject: ${subject}\n\n${message}`,
            outcome: 'neutral',
            intent: 'inquiry'
        });
        await interaction.save();

        // Update customer stats
        await Customer.findByIdAndUpdate(user.customerId, {
            $inc: { interactionCount: 1, 'channelStats.email': 1 },
            lastInteraction: new Date()
        });

        // Emit via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('email:new', {
                interactionId: interaction._id,
                customerId: user.customerId,
                userId,
                userName: user.name,
                subject,
                preview: message.substring(0, 150),
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            data: {
                interactionId: interaction._id,
                message: 'Email sent successfully'
            }
        });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/client/call
 * Start a call (simulated with TTS on frontend)
 */
router.post('/call', async (req, res) => {
    try {
        const { userId, message, duration } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                success: false,
                error: 'User ID and message are required'
            });
        }

        const user = await User.findById(userId);
        if (!user || user.role !== 'client') {
            return res.status(404).json({
                success: false,
                error: 'Client not found'
            });
        }

        // Create call interaction
        const interaction = new Interaction({
            customerId: user.customerId,
            agentId: userId,
            channel: 'phone',
            direction: 'inbound',
            summary: message,
            content: message,
            callDuration: duration || 0,
            outcome: 'neutral',
            intent: 'inquiry'
        });
        await interaction.save();

        // Update customer stats
        await Customer.findByIdAndUpdate(user.customerId, {
            $inc: { interactionCount: 1, 'channelStats.phone': 1 },
            lastInteraction: new Date()
        });

        // Emit via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('call:new', {
                interactionId: interaction._id,
                customerId: user.customerId,
                userId,
                userName: user.name,
                message,
                duration,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            data: {
                interactionId: interaction._id,
                message: 'Call recorded successfully'
            }
        });
    } catch (error) {
        console.error('Call error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/client/:userId/history
 * Get client's interaction history
 */
router.get('/:userId/history', async (req, res) => {
    try {
        const { userId } = req.params;
        const { channel, limit = 50 } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const query = { customerId: user.customerId };
        if (channel) query.channel = channel;

        const interactions = await Interaction.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: { interactions }
        });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
