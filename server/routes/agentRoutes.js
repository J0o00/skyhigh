/**
 * Agent Routes
 * 
 * Agent-specific endpoints for viewing and responding to customer interactions.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const { generateCustomerSummary } = require('../services/summaryService');

/**
 * GET /api/agent/inbox
 * Get pending interactions for agent
 */
router.get('/inbox', async (req, res) => {
    try {
        const { agentId } = req.query;

        // Get recent inbound interactions that need attention
        const interactions = await Interaction.find({
            direction: 'inbound'
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('customerId', 'name phone email potentialLevel currentIntent')
            .lean();

        // Group by customer
        const customerMap = new Map();
        interactions.forEach(i => {
            if (i.customerId) {
                const custId = i.customerId._id.toString();
                if (!customerMap.has(custId)) {
                    customerMap.set(custId, {
                        customer: i.customerId,
                        latestInteraction: i,
                        unreadCount: 1
                    });
                } else {
                    customerMap.get(custId).unreadCount++;
                }
            }
        });

        res.json({
            success: true,
            data: {
                inbox: Array.from(customerMap.values()),
                totalInteractions: interactions.length
            }
        });
    } catch (error) {
        console.error('Inbox error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/agent/customer/:customerId
 * Get full customer context with summary
 */
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findById(customerId).lean();
        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Get all interactions
        const interactions = await Interaction.find({ customerId })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        // Generate summary
        const summary = generateCustomerSummary(customer, interactions);

        res.json({
            success: true,
            data: {
                customer,
                interactions,
                summary
            }
        });
    } catch (error) {
        console.error('Customer context error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/agent/reply
 * Agent replies to customer
 */
router.post('/reply', async (req, res) => {
    try {
        const { agentId, customerId, channel, message } = req.body;

        if (!agentId || !customerId || !channel || !message) {
            return res.status(400).json({
                success: false,
                error: 'Agent ID, customer ID, channel, and message are required'
            });
        }

        const agent = await User.findById(agentId);
        if (!agent || !['agent', 'admin'].includes(agent.role)) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        // Create outbound interaction
        const interaction = new Interaction({
            customerId,
            agentId,
            channel,
            direction: 'outbound',
            summary: message,
            content: message,
            outcome: 'neutral'
        });
        await interaction.save();

        // Update agent metrics
        await User.findByIdAndUpdate(agentId, {
            $inc: { [`metrics.total${channel.charAt(0).toUpperCase() + channel.slice(1)}s`]: 1 }
        });

        // Emit via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit(`${channel}:reply`, {
                interactionId: interaction._id,
                customerId,
                agentId,
                agentName: agent.name,
                message,
                channel,
                direction: 'outbound',
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            data: {
                interactionId: interaction._id,
                message: 'Reply sent'
            }
        });
    } catch (error) {
        console.error('Reply error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/agent/summary
 * Update customer summary/notes
 */
router.post('/summary', async (req, res) => {
    try {
        const { agentId, customerId, notes, intent, potentialLevel } = req.body;

        if (!agentId || !customerId) {
            return res.status(400).json({
                success: false,
                error: 'Agent ID and customer ID are required'
            });
        }

        const updates = {};
        if (notes) updates.notes = notes;
        if (intent) updates.currentIntent = intent;
        if (potentialLevel) updates.potentialLevel = potentialLevel;

        const customer = await Customer.findByIdAndUpdate(
            customerId,
            { $set: updates },
            { new: true }
        );

        res.json({
            success: true,
            data: { customer }
        });
    } catch (error) {
        console.error('Summary update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
