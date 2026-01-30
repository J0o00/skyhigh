/**
 * V1 API Routes - Intelligence Endpoints
 * 
 * API for customer scoring, suggestions, and recommendations.
 * All business logic lives here - frontend just displays results.
 * 
 * Endpoints:
 * GET    /api/v1/intelligence/score/:customerId        - Get potential score
 * GET    /api/v1/intelligence/suggestions/:customerId  - Get context-aware suggestions
 * GET    /api/v1/intelligence/recommendations/:customerId - Get action recommendations
 * POST   /api/v1/intelligence/analyze                  - Analyze text for intent/sentiment
 */

const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Interaction = require('../../models/Interaction');
const potentialScoring = require('../../services/potentialScoring');
const recommendations = require('../../services/recommendations');
const agentAssist = require('../../services/agentAssist');
const { extractKeyPoints } = require('../../services/keyPointsExtractor');

/**
 * GET /api/v1/intelligence/score/:customerId
 * Calculate and return customer potential score
 */
router.get('/score/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId);
        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        const interactions = await Interaction.find({ customerId: req.params.customerId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Calculate score using scoring service
        const scoreResult = potentialScoring.calculateScore({
            customer,
            interactions
        });

        // Update customer with new score
        customer.potentialScore = scoreResult.score;
        customer.potentialLevel = scoreResult.level;
        customer.scoreBreakdown = scoreResult.breakdown;
        await customer.save();

        res.apiSuccess({
            customerId: customer._id,
            score: scoreResult.score,
            level: scoreResult.level,
            breakdown: scoreResult.breakdown,
            explanation: scoreResult.explanation
        });
    } catch (err) {
        res.apiServerError('Failed to calculate score', err.message);
    }
});

/**
 * GET /api/v1/intelligence/suggestions/:customerId
 * Get context-aware suggestions for agent
 */
router.get('/suggestions/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId);
        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        const interactions = await Interaction.find({ customerId: req.params.customerId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Parse key points from interactions
        const keyPointsHistory = interactions
            .filter(i => i.agentNotes)
            .map(i => {
                try {
                    return JSON.parse(i.agentNotes).keyPoints;
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean);

        // Generate suggestions using agent assist service
        const suggestions = agentAssist.generateSuggestions({
            customer,
            interactions,
            keyPoints: keyPointsHistory
        });

        res.apiSuccess({
            customerId: customer._id,
            customerName: customer.name,
            currentIntent: customer.currentIntent,
            suggestions: {
                openingLines: suggestions.openingLines || [],
                talkingPoints: suggestions.talkingPoints || [],
                objectionsToAddress: suggestions.objections || [],
                upsellOpportunities: suggestions.upsell || []
            },
            contextSummary: suggestions.summary || null
        });
    } catch (err) {
        res.apiServerError('Failed to generate suggestions', err.message);
    }
});

/**
 * GET /api/v1/intelligence/recommendations/:customerId
 * Get action recommendations for customer
 */
router.get('/recommendations/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId);
        if (!customer) {
            return res.apiNotFound('Customer not found');
        }

        const interactions = await Interaction.find({ customerId: req.params.customerId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Generate recommendations
        const recs = recommendations.generateRecommendations({
            customer,
            interactions
        });

        res.apiSuccess({
            customerId: customer._id,
            customerName: customer.name,
            potentialLevel: customer.potentialLevel,
            recommendations: {
                nextBestAction: recs.nextAction || null,
                priority: recs.priority || 'normal',
                actions: recs.actions || [],
                followUpDate: recs.followUpDate || null,
                riskFactors: recs.risks || []
            }
        });
    } catch (err) {
        res.apiServerError('Failed to generate recommendations', err.message);
    }
});

/**
 * POST /api/v1/intelligence/analyze
 * Analyze text for intent, sentiment, and key points
 * 
 * Body:
 * - text: string (required)
 * - subject: string (optional, for emails)
 */
router.post('/analyze', async (req, res) => {
    try {
        const { text, subject = '' } = req.body;

        if (!text) {
            return res.apiBadRequest('Text is required');
        }

        // Use key points extractor
        const analysis = extractKeyPoints(text, subject);

        res.apiSuccess({
            intent: analysis.intent,
            urgency: analysis.urgency,
            sentiment: analysis.sentiment,
            keyPhrases: analysis.keyPhrases,
            actionRequired: analysis.actionRequired,
            briefSummary: analysis.briefSummary
        });
    } catch (err) {
        res.apiServerError('Failed to analyze text', err.message);
    }
});

module.exports = router;
