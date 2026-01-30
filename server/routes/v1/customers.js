/**
 * V1 API Routes - Customer Endpoints
 * 
 * Full REST API for customer management.
 * 
 * Endpoints:
 * GET    /api/v1/customers              - List all customers
 * GET    /api/v1/customers/:id          - Get customer by ID
 * POST   /api/v1/customers              - Create new customer
 * PATCH  /api/v1/customers/:id          - Update customer
 * DELETE /api/v1/customers/:id          - Delete customer
 * GET    /api/v1/customers/:id/interactions - Get customer interaction history
 * GET    /api/v1/customers/:id/context  - Get full customer context for agents
 */

const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Interaction = require('../../models/Interaction');
const { ErrorCodes } = require('../../middleware/apiResponse');

/**
 * GET /api/v1/customers
 * List all customers with optional filters
 * 
 * Query params:
 * - status: filter by status (active, converted, closed, dormant)
 * - potential: filter by potential level (high, medium, low)
 * - limit: max results (default 50)
 * - skip: pagination offset
 */
router.get('/', async (req, res) => {
    try {
        const { status, potential, limit = 50, skip = 0 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (potential) filter.potentialLevel = potential;

        const customers = await Customer.find(filter)
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        const total = await Customer.countDocuments(filter);

        res.apiSuccess({
            customers,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: skip + customers.length < total
            }
        });
    } catch (err) {
        res.apiServerError('Failed to fetch customers', err.message);
    }
});

/**
 * GET /api/v1/customers/:id
 * Get single customer by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).lean();

        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        res.apiSuccess({ customer });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.apiBadRequest('Invalid customer ID format');
        }
        res.apiServerError('Failed to fetch customer', err.message);
    }
});

/**
 * POST /api/v1/customers
 * Create new customer
 * 
 * Body:
 * - name: string (required)
 * - email: string
 * - phone: string
 * - currentIntent: string
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, currentIntent = 'inquiry' } = req.body;

        if (!name) {
            return res.apiBadRequest('Name is required');
        }

        // Check for duplicate email/phone
        if (email) {
            const existing = await Customer.findOne({ email: email.toLowerCase() });
            if (existing) {
                return res.apiError('Customer with this email already exists', ErrorCodes.DUPLICATE_ENTRY, 409);
            }
        }

        const customer = new Customer({
            name,
            email: email?.toLowerCase(),
            phone,
            currentIntent,
            status: 'active'
        });

        await customer.save();
        res.apiCreated({ customer });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.apiBadRequest(err.message);
        }
        res.apiServerError('Failed to create customer', err.message);
    }
});

/**
 * PATCH /api/v1/customers/:id
 * Update customer fields
 */
router.patch('/:id', async (req, res) => {
    try {
        const allowedUpdates = ['name', 'email', 'phone', 'currentIntent', 'potentialLevel', 'status', 'notes'];
        const updates = {};

        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        res.apiSuccess({ customer });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.apiBadRequest(err.message);
        }
        res.apiServerError('Failed to update customer', err.message);
    }
});

/**
 * DELETE /api/v1/customers/:id
 * Delete customer (soft delete by setting status to 'closed')
 */
router.delete('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { status: 'closed' },
            { new: true }
        );

        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        res.apiSuccess({ message: 'Customer deleted', customer });
    } catch (err) {
        res.apiServerError('Failed to delete customer', err.message);
    }
});

/**
 * GET /api/v1/customers/:id/interactions
 * Get all interactions for a customer
 */
router.get('/:id/interactions', async (req, res) => {
    try {
        const { limit = 50, channel } = req.query;

        const filter = { customerId: req.params.id };
        if (channel) filter.channel = channel;

        const interactions = await Interaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.apiSuccess({
            interactions,
            count: interactions.length
        });
    } catch (err) {
        res.apiServerError('Failed to fetch interactions', err.message);
    }
});

/**
 * GET /api/v1/customers/:id/context
 * Get full customer context for agent assist
 * Includes: profile, recent interactions, key points, recommendations
 */
router.get('/:id/context', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).lean();

        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        // Get recent interactions
        const interactions = await Interaction.find({ customerId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Parse key points from interactions
        const keyPoints = interactions
            .filter(i => i.agentNotes)
            .map(i => {
                try {
                    return JSON.parse(i.agentNotes).keyPoints;
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean);

        // Generate context summary
        const context = {
            customer,
            recentInteractions: interactions,
            keyPointsSummary: keyPoints.slice(0, 5),
            stats: {
                totalInteractions: customer.interactionCount || interactions.length,
                lastContact: interactions[0]?.createdAt || null,
                channels: [...new Set(interactions.map(i => i.channel))]
            }
        };

        res.apiSuccess(context);
    } catch (err) {
        res.apiServerError('Failed to fetch customer context', err.message);
    }
});

module.exports = router;
