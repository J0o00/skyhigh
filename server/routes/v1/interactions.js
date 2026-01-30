/**
 * V1 API Routes - Interaction Endpoints
 * 
 * API for ingesting and managing customer interactions.
 * 
 * Endpoints:
 * POST   /api/v1/interactions           - Create/ingest new interaction
 * GET    /api/v1/interactions/:id       - Get interaction by ID
 * GET    /api/v1/interactions           - List interactions with filters
 */

const express = require('express');
const router = express.Router();
const Interaction = require('../../models/Interaction');
const Customer = require('../../models/Customer');
const { findOrCreateCustomer } = require('../../services/customerMatcher');
const { extractKeyPoints } = require('../../services/keyPointsExtractor');

/**
 * POST /api/v1/interactions
 * Ingest a new interaction (email, call, or chat)
 * 
 * Body:
 * - channel: 'email' | 'phone' | 'chat' (required)
 * - direction: 'inbound' | 'outbound' (required)
 * - content: string (required) - the message content
 * - customerId: string - existing customer ID
 * - customerEmail: string - to find/create customer
 * - customerPhone: string - to find/create customer
 * - customerName: string - optional name
 * - agentId: string - agent handling this
 * - callDuration: number - for phone calls
 */
router.post('/', async (req, res) => {
    try {
        const {
            channel,
            direction,
            content,
            customerId,
            customerEmail,
            customerPhone,
            customerName,
            agentId,
            callDuration
        } = req.body;

        // Validation
        if (!channel || !['email', 'phone', 'chat'].includes(channel)) {
            return res.apiBadRequest('Invalid channel. Must be: email, phone, or chat');
        }
        if (!direction || !['inbound', 'outbound'].includes(direction)) {
            return res.apiBadRequest('Invalid direction. Must be: inbound or outbound');
        }
        if (!content) {
            return res.apiBadRequest('Content is required');
        }

        // Find or create customer
        let customer;
        if (customerId) {
            customer = await Customer.findById(customerId);
            if (!customer) {
                return res.apiNotFound('Customer not found');
            }
        } else if (customerEmail || customerPhone) {
            const result = await findOrCreateCustomer({
                email: customerEmail,
                phone: customerPhone,
                name: customerName
            });
            customer = result.customer;
        } else {
            return res.apiBadRequest('Either customerId, customerEmail, or customerPhone is required');
        }

        // Extract key points from content
        const keyPoints = extractKeyPoints(content, channel === 'email' ? content : '');

        // Create interaction
        const interaction = new Interaction({
            customerId: customer._id,
            agentId,
            channel,
            direction,
            content,
            summary: keyPoints.briefSummary || content.substring(0, 200),
            intent: keyPoints.intent?.toLowerCase() || 'unknown',
            callDuration: channel === 'phone' ? callDuration : undefined,
            agentNotes: JSON.stringify({ keyPoints })
        });

        await interaction.save();

        // Update customer stats
        customer.interactionCount = (customer.interactionCount || 0) + 1;
        customer.lastInteraction = new Date();
        if (keyPoints.intent && keyPoints.intent !== 'GENERAL') {
            customer.currentIntent = keyPoints.intent.toLowerCase();
        }
        await customer.save();

        res.apiCreated({
            interaction,
            customer: {
                _id: customer._id,
                name: customer.name,
                email: customer.email
            },
            keyPoints
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.apiBadRequest(err.message);
        }
        res.apiServerError('Failed to create interaction', err.message);
    }
});

/**
 * GET /api/v1/interactions/:id
 * Get single interaction by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const interaction = await Interaction.findById(req.params.id)
            .populate('customerId', 'name email phone')
            .populate('agentId', 'name email')
            .lean();

        if (!interaction) {
            return res.apiNotFound('Interaction not found');
        }

        // Parse key points
        let keyPoints = null;
        if (interaction.agentNotes) {
            try {
                keyPoints = JSON.parse(interaction.agentNotes).keyPoints;
            } catch (e) { }
        }

        res.apiSuccess({
            interaction,
            keyPoints
        });
    } catch (err) {
        res.apiServerError('Failed to fetch interaction', err.message);
    }
});

/**
 * GET /api/v1/interactions
 * List interactions with filters
 * 
 * Query params:
 * - channel: filter by channel
 * - direction: filter by direction
 * - customerId: filter by customer
 * - limit: max results (default 50)
 * - skip: pagination offset
 */
router.get('/', async (req, res) => {
    try {
        const { channel, direction, customerId, limit = 50, skip = 0 } = req.query;

        const filter = {};
        if (channel) filter.channel = channel;
        if (direction) filter.direction = direction;
        if (customerId) filter.customerId = customerId;

        const interactions = await Interaction.find(filter)
            .populate('customerId', 'name email phone')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        const total = await Interaction.countDocuments(filter);

        res.apiSuccess({
            interactions,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: skip + interactions.length < total
            }
        });
    } catch (err) {
        res.apiServerError('Failed to fetch interactions', err.message);
    }
});

module.exports = router;
