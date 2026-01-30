/**
 * Interactions Routes
 * 
 * Manages interaction history across all channels.
 */

const express = require('express');
const router = express.Router();
const { Interaction, Customer } = require('../models');
const { detectIntent, shouldUpdateIntent } = require('../services/intentDetection');
const { calculatePotentialScore } = require('../services/potentialScoring');

/**
 * GET /api/interactions/customer/:customerId
 * Get interaction timeline for a customer
 */
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const { limit = 20, page = 1, channel } = req.query;

        const query = { customerId };
        if (channel) {
            query.channel = channel;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [interactions, total] = await Promise.all([
            Interaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('agentId', 'name email')
                .lean(),
            Interaction.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: interactions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching interactions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/interactions/:id
 * Get single interaction
 */
router.get('/:id', async (req, res) => {
    try {
        const interaction = await Interaction.findById(req.params.id)
            .populate('agentId', 'name email')
            .populate('customerId')
            .lean();

        if (!interaction) {
            return res.status(404).json({ success: false, error: 'Interaction not found' });
        }

        res.json({
            success: true,
            data: interaction
        });
    } catch (error) {
        console.error('Error fetching interaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/interactions
 * Create new interaction (for email/chat)
 */
router.post('/', async (req, res) => {
    try {
        const {
            customerId,
            agentId,
            channel,
            direction,
            summary,
            content,
            outcome,
            intent,
            keywords,
            objections,
            followUpRequired,
            followUpDate,
            pointsToRemember,
            doNotRepeat,
            notes
        } = req.body;

        // Validate required fields
        if (!customerId || !agentId || !channel || !direction || !summary || !outcome) {
            return res.status(400).json({
                success: false,
                error: 'customerId, agentId, channel, direction, summary, and outcome are required'
            });
        }

        // Create interaction
        const interaction = new Interaction({
            customerId,
            agentId,
            channel,
            direction,
            summary,
            content,
            outcome,
            intent: intent || 'unknown',
            keywords: keywords || [],
            objections: objections || [],
            followUpRequired: followUpRequired || false,
            followUpDate: followUpDate ? new Date(followUpDate) : null,
            pointsToRemember: pointsToRemember || [],
            doNotRepeat: doNotRepeat || [],
            notes
        });

        await interaction.save();

        // Update customer profile
        const customer = await Customer.findById(customerId);
        if (customer) {
            // Update metrics
            customer.interactionCount = (customer.interactionCount || 0) + 1;
            customer.lastInteraction = new Date();
            customer.channelStats[channel] = (customer.channelStats[channel] || 0) + 1;

            if (!customer.firstInteraction) {
                customer.firstInteraction = new Date();
            }

            // Add keywords
            const existingKeywords = customer.keywords.map(k => k.keyword.toLowerCase());
            (keywords || []).forEach(keyword => {
                if (!existingKeywords.includes(keyword.toLowerCase())) {
                    customer.keywords.push({
                        keyword: keyword.toLowerCase(),
                        addedBy: agentId,
                        addedAt: new Date()
                    });
                }
            });

            // Update intent if provided
            if (intent && intent !== 'unknown') {
                customer.currentIntent = intent;
                customer.intentConfidence = 100;
                customer.intentExplanation = `Set from ${channel} interaction`;
            }

            // Recalculate scores
            const recentInteractions = await Interaction.find({ customerId })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            const intentResult = detectIntent(customer, recentInteractions);
            if (shouldUpdateIntent(customer.currentIntent, intentResult)) {
                customer.currentIntent = intentResult.intent;
                customer.intentConfidence = intentResult.confidence;
                customer.intentExplanation = intentResult.explanation;
            }

            const scoringResult = calculatePotentialScore(customer, recentInteractions);
            customer.potentialScore = scoringResult.score;
            customer.potentialLevel = scoringResult.level;
            customer.scoreBreakdown = scoringResult.breakdown;

            await customer.save();
        }

        // Populate for response
        await interaction.populate('agentId', 'name email');

        res.status(201).json({
            success: true,
            data: interaction
        });
    } catch (error) {
        console.error('Error creating interaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/interactions/:id/follow-up
 * Update follow-up status
 */
router.put('/:id/follow-up', async (req, res) => {
    try {
        const { completed, newDate, notes } = req.body;

        const interaction = await Interaction.findById(req.params.id);
        if (!interaction) {
            return res.status(404).json({ success: false, error: 'Interaction not found' });
        }

        if (completed !== undefined) {
            interaction.followUpCompleted = completed;
        }
        if (newDate) {
            interaction.followUpDate = new Date(newDate);
        }
        if (notes) {
            interaction.notes = (interaction.notes || '') + '\n' + notes;
        }

        await interaction.save();

        res.json({
            success: true,
            data: interaction
        });
    } catch (error) {
        console.error('Error updating follow-up:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/interactions/pending-followups/:agentId
 * Get pending follow-ups for an agent
 */
router.get('/pending-followups/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;

        const pendingFollowups = await Interaction.find({
            agentId,
            followUpRequired: true,
            followUpCompleted: false
        })
            .sort({ followUpDate: 1 })
            .populate('customerId', 'name phone potentialLevel')
            .lean();

        // Categorize by urgency
        const now = new Date();
        const overdue = [];
        const today = [];
        const upcoming = [];

        pendingFollowups.forEach(fu => {
            const fuDate = new Date(fu.followUpDate);
            const daysDiff = Math.floor((fuDate - now) / (1000 * 60 * 60 * 24));

            if (daysDiff < 0) {
                overdue.push({ ...fu, daysOverdue: Math.abs(daysDiff) });
            } else if (daysDiff === 0) {
                today.push(fu);
            } else {
                upcoming.push({ ...fu, daysUntil: daysDiff });
            }
        });

        res.json({
            success: true,
            data: {
                overdue,
                today,
                upcoming,
                total: pendingFollowups.length
            }
        });
    } catch (error) {
        console.error('Error fetching pending follow-ups:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
