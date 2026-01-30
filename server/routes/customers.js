/**
 * Customer Routes
 * 
 * CRUD operations for customer profiles.
 * Includes keyword tagging and feedback endpoints.
 */

const express = require('express');
const router = express.Router();
const { Customer, Interaction } = require('../models');
const { detectIntent, shouldUpdateIntent } = require('../services/intentDetection');
const { calculatePotentialScore } = require('../services/potentialScoring');
const { getAgentAssist } = require('../services/agentAssist');
const { getRecommendations } = require('../services/recommendations');

/**
 * GET /api/customers
 * List all customers with optional filtering
 */
router.get('/', async (req, res) => {
    try {
        const {
            potential,  // Filter by potential level
            intent,     // Filter by intent
            search,     // Search by name or phone
            limit = 50,
            page = 1
        } = req.query;

        const query = {};

        if (potential) {
            query.potentialLevel = potential;
        }
        if (intent) {
            query.currentIntent = intent;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [customers, total] = await Promise.all([
            Customer.find(query)
                .sort({ lastInteraction: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Customer.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: customers,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/customers/:id
 * Get customer profile with full context
 */
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).lean();

        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Get recent interactions
        const recentInteractions = await Interaction.find({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('agentId', 'name email')
            .lean();

        // Get recommendations
        const recommendations = getRecommendations(customer, recentInteractions);

        res.json({
            success: true,
            data: {
                customer,
                recentInteractions,
                recommendations
            }
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/customers/phone/:phone
 * Lookup customer by phone number (used for incoming calls)
 */
router.get('/phone/:phone', async (req, res) => {
    try {
        // Normalize phone number (remove spaces, dashes)
        const phone = req.params.phone.replace(/[\s-]/g, '');

        const customer = await Customer.findOne({
            phone: { $regex: phone.replace(/^\+/, ''), $options: 'i' }
        }).lean();

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found',
                isNewCustomer: true,
                phone: phone
            });
        }

        // Get recent interactions for call assist
        const recentInteractions = await Interaction.find({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Generate call assist
        const callAssist = getAgentAssist(customer, recentInteractions, 'phone');

        res.json({
            success: true,
            data: {
                customer,
                callAssist,
                recentInteractions
            }
        });
    } catch (error) {
        console.error('Error looking up customer by phone:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/customers
 * Create new customer
 */
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, company, preferences, notes } = req.body;

        // Check if phone already exists
        const existing = await Customer.findOne({ phone });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Customer with this phone number already exists',
                existingCustomerId: existing._id
            });
        }

        const customer = new Customer({
            name,
            phone,
            email,
            company,
            preferences,
            notes,
            currentIntent: 'unknown',
            potentialLevel: 'medium',
            potentialScore: 50
        });

        await customer.save();

        res.status(201).json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/customers/:id
 * Update customer profile
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, email, company, preferences, notes, status } = req.body;

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Update fields
        if (name) customer.name = name;
        if (email) customer.email = email;
        if (company) customer.company = company;
        if (preferences) customer.preferences = { ...customer.preferences, ...preferences };
        if (notes !== undefined) customer.notes = notes;
        if (status) customer.status = status;

        // Recalculate potential score if preferences changed
        if (preferences) {
            const recentInteractions = await Interaction.find({ customerId: customer._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            const scoringResult = calculatePotentialScore(customer, recentInteractions);
            customer.potentialScore = scoringResult.score;
            customer.potentialLevel = scoringResult.level;
            customer.scoreBreakdown = scoringResult.breakdown;
        }

        await customer.save();

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/customers/:id/keywords
 * Add keyword tags to customer
 */
router.post('/:id/keywords', async (req, res) => {
    try {
        const { keywords, agentId } = req.body;

        if (!keywords || !Array.isArray(keywords)) {
            return res.status(400).json({ success: false, error: 'Keywords array required' });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Add new keywords (avoid duplicates)
        const existingKeywords = customer.keywords.map(k => k.keyword.toLowerCase());

        keywords.forEach(keyword => {
            if (!existingKeywords.includes(keyword.toLowerCase())) {
                customer.keywords.push({
                    keyword: keyword.toLowerCase(),
                    addedBy: agentId,
                    addedAt: new Date()
                });
            }
        });

        // Recalculate intent based on new keywords
        const recentInteractions = await Interaction.find({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const intentResult = detectIntent(customer, recentInteractions);
        if (shouldUpdateIntent(customer.currentIntent, intentResult)) {
            customer.currentIntent = intentResult.intent;
            customer.intentConfidence = intentResult.confidence;
            customer.intentExplanation = intentResult.explanation;
        }

        // Recalculate potential score
        const scoringResult = calculatePotentialScore(customer, recentInteractions);
        customer.potentialScore = scoringResult.score;
        customer.potentialLevel = scoringResult.level;
        customer.scoreBreakdown = scoringResult.breakdown;

        await customer.save();

        res.json({
            success: true,
            data: {
                customer,
                intentUpdate: intentResult,
                scoringUpdate: scoringResult
            }
        });
    } catch (error) {
        console.error('Error adding keywords:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/customers/:id/feedback
 * Submit agent feedback/correction
 */
router.put('/:id/feedback', async (req, res) => {
    try {
        const { field, newValue, agentId, reason } = req.body;

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        const oldValue = customer[field];

        // Record the feedback for ML training
        customer.feedbackHistory.push({
            field,
            oldValue,
            newValue,
            correctedBy: agentId,
            correctedAt: new Date(),
            reason
        });

        // Apply the correction
        if (field === 'currentIntent') {
            customer.currentIntent = newValue;
            customer.intentConfidence = 100; // Agent-confirmed = 100% confidence
            customer.intentExplanation = `Agent corrected to "${newValue}". Reason: ${reason || 'Not specified'}`;
        } else if (field === 'potentialLevel') {
            customer.potentialLevel = newValue;
            // Adjust score to match level
            const levelScores = { high: 80, medium: 55, low: 30, spam: 10 };
            customer.potentialScore = levelScores[newValue] || 50;
        } else if (customer[field] !== undefined) {
            customer[field] = newValue;
        }

        await customer.save();

        res.json({
            success: true,
            data: customer,
            message: `Feedback recorded: ${field} changed from "${oldValue}" to "${newValue}"`
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/customers/:id/assist/:channel
 * Get channel-specific agent assistance
 */
router.get('/:id/assist/:channel', async (req, res) => {
    try {
        const { id, channel } = req.params;

        const customer = await Customer.findById(id).lean();
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        const recentInteractions = await Interaction.find({ customerId: id })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const assist = getAgentAssist(customer, recentInteractions, channel);

        res.json({
            success: true,
            data: assist
        });
    } catch (error) {
        console.error('Error getting assist:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
