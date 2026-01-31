/**
 * Conversation Routes
 * 
 * Retrieves full conversation transcripts for both client and agent
 */

const express = require('express');
const router = express.Router();
const { Interaction, Customer, Agent } = require('../models');

/**
 * GET /api/conversations/:interactionId
 * Get full conversation transcript by interaction ID
 */
router.get('/:interactionId', async (req, res) => {
    try {
        const { interactionId } = req.params;

        const interaction = await Interaction.findById(interactionId)
            .populate('customerId', 'name phone email')
            .populate('agentId', 'name email')
            .lean();

        if (!interaction) {
            return res.status(404).json({
                success: false,
                error: 'Interaction not found'
            });
        }

        // Format the conversation data
        const conversationData = {
            id: interaction._id,
            customer: interaction.customerId,
            agent: interaction.agentId,
            channel: interaction.channel,
            direction: interaction.direction,
            startTime: interaction.createdAt,
            duration: interaction.callDuration,
            summary: interaction.summary,
            transcript: interaction.transcript || [],
            intent: interaction.intent,
            sentiment: interaction.sentiment,
            keywords: interaction.keywords,
            outcome: interaction.outcome,
            notes: interaction.notes
        };

        res.json({
            success: true,
            data: conversationData
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/conversations/customer/:customerId
 * Get all conversations for a specific customer
 */
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const { limit = 50, page = 1, includeTranscript = 'true' } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = { customerId };

        // Projection based on whether transcript is needed
        const projection = includeTranscript === 'true'
            ? {}
            : { transcript: 0 };

        const [interactions, total, customer] = await Promise.all([
            Interaction.find(query, projection)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('agentId', 'name email')
                .lean(),
            Interaction.countDocuments(query),
            Customer.findById(customerId, 'name phone email').lean()
        ]);

        res.json({
            success: true,
            data: {
                customer,
                conversations: interactions,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching customer conversations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/conversations/agent/:agentId
 * Get all conversations handled by a specific agent
 */
router.get('/agent/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const { limit = 50, page = 1, includeTranscript = 'true' } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = { agentId };

        // Projection based on whether transcript is needed
        const projection = includeTranscript === 'true'
            ? {}
            : { transcript: 0 };

        const [interactions, total, agent] = await Promise.all([
            Interaction.find(query, projection)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('customerId', 'name phone email')
                .lean(),
            Interaction.countDocuments(query),
            Agent.findById(agentId, 'name email').lean()
        ]);

        res.json({
            success: true,
            data: {
                agent,
                conversations: interactions,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching agent conversations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/conversations/all
 * Get all conversations with optional filters
 */
router.get('/all/list', async (req, res) => {
    try {
        const {
            limit = 50,
            page = 1,
            channel,
            dateFrom,
            dateTo,
            includeTranscript = 'false'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = {};
        if (channel) query.channel = channel;
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        // Projection based on whether transcript is needed
        const projection = includeTranscript === 'true'
            ? {}
            : { transcript: 0 };

        const [interactions, total] = await Promise.all([
            Interaction.find(query, projection)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('customerId', 'name phone email')
                .populate('agentId', 'name email')
                .lean(),
            Interaction.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                conversations: interactions,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching all conversations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/conversations/search
 * Search conversations by keyword
 */
router.get('/search/query', async (req, res) => {
    try {
        const { q, limit = 20, page = 1 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query (q) is required'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Search in summary, content, and keywords
        const query = {
            $or: [
                { summary: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } },
                { keywords: { $in: [new RegExp(q, 'i')] } },
                { notes: { $regex: q, $options: 'i' } }
            ]
        };

        const [interactions, total] = await Promise.all([
            Interaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('customerId', 'name phone email')
                .populate('agentId', 'name email')
                .select('-transcript') // Don't include full transcript in search results
                .lean(),
            Interaction.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                query: q,
                conversations: interactions,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error searching conversations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
