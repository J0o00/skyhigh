/**
 * V1 API Routes - Call Endpoints
 * 
 * API for handling incoming calls and call summaries.
 * 
 * Endpoints:
 * POST   /api/v1/calls/incoming   - Handle incoming call event
 * POST   /api/v1/calls/summary    - Submit call summary
 * GET    /api/v1/calls/:id        - Get call details
 */

const express = require('express');
const router = express.Router();
const Interaction = require('../../models/Interaction');
const Customer = require('../../models/Customer');
const { findOrCreateCustomer } = require('../../services/customerMatcher');
const agentAssist = require('../../services/agentAssist');

/**
 * POST /api/v1/calls/incoming
 * Handle incoming call event - returns customer context for agent assist
 * 
 * Body:
 * - phone: string (required) - caller phone number
 * - agentId: string - agent receiving the call
 * 
 * Returns:
 * - Customer profile (if found)
 * - Previous interactions
 * - Agent assist suggestions
 */
router.post('/incoming', async (req, res) => {
    try {
        const { phone, agentId } = req.body;

        if (!phone) {
            return res.apiBadRequest('Phone number is required');
        }

        // Find or create customer
        const { customer, isNew } = await findOrCreateCustomer({
            phone,
            updateIfFound: true
        });

        // Get previous interactions
        const previousInteractions = await Interaction.find({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Generate agent assist suggestions
        const suggestions = agentAssist.generateSuggestions({
            customer,
            interactions: previousInteractions
        });

        // Parse key points from previous interactions
        const keyPointsHistory = previousInteractions
            .filter(i => i.agentNotes)
            .map(i => {
                try {
                    return {
                        date: i.createdAt,
                        channel: i.channel,
                        ...JSON.parse(i.agentNotes).keyPoints
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean);

        res.apiSuccess({
            isNewCustomer: isNew,
            customer: {
                _id: customer._id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                currentIntent: customer.currentIntent,
                potentialLevel: customer.potentialLevel,
                potentialScore: customer.potentialScore,
                interactionCount: customer.interactionCount
            },
            previousInteractions: previousInteractions.slice(0, 5),
            keyPointsHistory: keyPointsHistory.slice(0, 5),
            agentAssist: suggestions
        });
    } catch (err) {
        res.apiServerError('Failed to process incoming call', err.message);
    }
});

/**
 * POST /api/v1/calls/summary
 * Submit call summary after call ends
 * 
 * Body:
 * - customerId: string (required)
 * - agentId: string (required)
 * - duration: number (seconds)
 * - summary: string
 * - outcome: string
 * - intent: string
 * - keywords: array of strings
 */
router.post('/summary', async (req, res) => {
    try {
        const {
            customerId,
            agentId,
            duration,
            summary,
            outcome = 'neutral',
            intent = 'inquiry',
            keywords = []
        } = req.body;

        if (!customerId) {
            return res.apiBadRequest('Customer ID is required');
        }
        if (!agentId) {
            return res.apiBadRequest('Agent ID is required');
        }

        // Verify customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        // Create interaction record
        const interaction = new Interaction({
            customerId,
            agentId,
            channel: 'phone',
            direction: 'inbound',
            summary: summary || 'Phone call',
            callDuration: duration,
            outcome,
            intent,
            keywords
        });

        await interaction.save();

        // Update customer stats
        customer.interactionCount = (customer.interactionCount || 0) + 1;
        customer.lastInteraction = new Date();
        customer.currentIntent = intent;
        await customer.save();

        res.apiCreated({
            interaction,
            customer: {
                _id: customer._id,
                name: customer.name,
                interactionCount: customer.interactionCount
            }
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.apiBadRequest(err.message);
        }
        res.apiServerError('Failed to save call summary', err.message);
    }
});

/**
 * GET /api/v1/calls/:id
 * Get call details by interaction ID
 */
router.get('/:id', async (req, res) => {
    try {
        const call = await Interaction.findOne({
            _id: req.params.id,
            channel: 'phone'
        })
            .populate('customerId', 'name email phone')
            .populate('agentId', 'name email')
            .lean();

        if (!call) {
            return res.apiNotFound('Call not found');
        }

        res.apiSuccess({ call });
    } catch (err) {
        res.apiServerError('Failed to fetch call', err.message);
    }
});

module.exports = router;
