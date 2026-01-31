/**
 * V1 API Routes - Agent Endpoints
 * 
 * API for agent operations including inbox and replies.
 * 
 * Endpoints:
 * GET    /api/v1/agents              - List all agents
 * GET    /api/v1/agents/:id          - Get agent by ID
 * POST   /api/v1/agents              - Create agent
 * GET    /api/v1/agents/inbox        - Get agent inbox (grouped by customer)
 * POST   /api/v1/agents/reply        - Send reply to customer
 * POST   /api/v1/agents/keywords     - Tag customer with keywords
 */

const express = require('express');
const router = express.Router();
const Agent = require('../../models/Agent');
const Customer = require('../../models/Customer');
const Interaction = require('../../models/Interaction');

/**
 * GET /api/v1/agents
 * List all agents
 */
router.get('/', async (req, res) => {
    try {
        const agents = await Agent.find({})
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        res.apiSuccess({ agents });
    } catch (err) {
        res.apiServerError('Failed to fetch agents', err.message);
    }
});

/**
 * GET /api/v1/agents/inbox
 * Get agent inbox - interactions grouped by customer
 * NOTE: This route MUST be defined before /:id to avoid route conflicts
 * 
 * Query params:
 * - agentId: filter by assigned agent
 * - status: filter by status (pending, resolved)
 * - limit: max customers (default 20)
 */
router.get('/inbox', async (req, res) => {
    try {
        const { agentId, status, limit = 20 } = req.query;

        // Get recent interactions grouped by customer
        const pipeline = [
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$customerId',
                    latestInteraction: { $first: '$$ROOT' },
                    totalInteractions: { $sum: 1 },
                    unreadCount: {
                        $sum: { $cond: [{ $eq: ['$outcome', 'pending'] }, 1, 0] }
                    }
                }
            },
            { $sort: { 'latestInteraction.createdAt': -1 } },
            { $limit: parseInt(limit) }
        ];

        const grouped = await Interaction.aggregate(pipeline);

        // Populate customer data
        const customerIds = grouped.map(g => g._id);
        const customers = await Customer.find({ _id: { $in: customerIds } }).lean();
        const customerMap = {};
        customers.forEach(c => customerMap[c._id.toString()] = c);

        const inbox = grouped.map(g => {
            // Parse key points from latest interaction
            let keyPoints = null;
            if (g.latestInteraction.agentNotes) {
                try {
                    keyPoints = JSON.parse(g.latestInteraction.agentNotes).keyPoints;
                } catch (e) { }
            }

            return {
                customer: customerMap[g._id.toString()] || { _id: g._id, name: 'Unknown' },
                latestInteraction: g.latestInteraction,
                keyPoints,
                totalInteractions: g.totalInteractions,
                unreadCount: g.unreadCount
            };
        });

        res.apiSuccess({
            inbox,
            totalCustomers: inbox.length
        });
    } catch (err) {
        res.apiServerError('Failed to fetch inbox', err.message);
    }
});

/**
 * POST /api/v1/agents
 * Create new agent
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, password, department } = req.body;

        if (!name || !email || !password) {
            return res.apiBadRequest('Name, email, and password are required');
        }

        // Check for duplicate
        const existing = await Agent.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.apiError('Agent with this email already exists', 'DUPLICATE_ENTRY', 409);
        }

        const agent = new Agent({
            name,
            email: email.toLowerCase(),
            password, // Password will be hashed by pre-save hook in Agent model
            department: department || 'Support',
            isActive: true
        });

        await agent.save();

        // Use toSafeObject to return agent without password
        res.apiCreated({ agent: agent.toSafeObject() });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.apiBadRequest(err.message);
        }
        res.apiServerError('Failed to create agent', err.message);
    }
});

/**
 * GET /api/v1/agents/:id
 * Get agent by ID
 * NOTE: This route is defined after /inbox to avoid route conflicts
 */
router.get('/:id', async (req, res) => {
    try {
        const agent = await Agent.findById(req.params.id)
            .select('-password')
            .lean();

        if (!agent) {
            return res.apiNotFound('Agent not found');
        }

        res.apiSuccess({ agent });
    } catch (err) {
        res.apiServerError('Failed to fetch agent', err.message);
    }
});

/**
 * POST /api/v1/agents/reply
 * Send reply to customer
 * 
 * Body:
 * - customerId: string (required)
 * - agentId: string (required)
 * - channel: 'email' | 'chat' (required)
 * - content: string (required)
 */
router.post('/reply', async (req, res) => {
    try {
        const { customerId, agentId, channel, content } = req.body;

        if (!customerId || !agentId || !channel || !content) {
            return res.apiBadRequest('customerId, agentId, channel, and content are required');
        }

        // Verify customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        // Create outbound interaction
        const interaction = new Interaction({
            customerId,
            agentId,
            channel,
            direction: 'outbound',
            content,
            summary: content.substring(0, 200),
            outcome: 'neutral'
        });

        await interaction.save();

        // Update customer
        customer.interactionCount = (customer.interactionCount || 0) + 1;
        customer.lastInteraction = new Date();
        await customer.save();

        // Mark previous pending interactions as resolved
        await Interaction.updateMany(
            { customerId, outcome: 'pending' },
            { outcome: 'neutral' }
        );

        res.apiCreated({
            interaction,
            message: 'Reply sent successfully'
        });
    } catch (err) {
        res.apiServerError('Failed to send reply', err.message);
    }
});

/**
 * POST /api/v1/agents/keywords
 * Tag customer with keywords
 * 
 * Body:
 * - customerId: string (required)
 * - agentId: string (required)
 * - keywords: array of strings (required)
 * - action: 'add' | 'remove' (default: add)
 */
router.post('/keywords', async (req, res) => {
    try {
        const { customerId, agentId, keywords, action = 'add' } = req.body;

        if (!customerId || !agentId || !keywords || !Array.isArray(keywords)) {
            return res.apiBadRequest('customerId, agentId, and keywords array are required');
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        // Initialize keywords array if not exists
        if (!customer.keywords) {
            customer.keywords = [];
        }

        if (action === 'add') {
            // Add new keywords
            for (const keyword of keywords) {
                const exists = customer.keywords.some(k => k.keyword === keyword);
                if (!exists) {
                    customer.keywords.push({
                        keyword,
                        addedBy: agentId,
                        addedAt: new Date()
                    });
                }
            }
        } else if (action === 'remove') {
            // Remove keywords
            customer.keywords = customer.keywords.filter(k => !keywords.includes(k.keyword));
        }

        await customer.save();

        res.apiSuccess({
            customer: {
                _id: customer._id,
                name: customer.name,
                keywords: customer.keywords
            },
            message: `Keywords ${action === 'add' ? 'added' : 'removed'} successfully`
        });
    } catch (err) {
        res.apiServerError('Failed to update keywords', err.message);
    }
});

module.exports = router;
