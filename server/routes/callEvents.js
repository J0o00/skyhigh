/**
 * Call Events Routes
 * 
 * Handles incoming call events and post-call summaries.
 * This is the core telephony integration point (simulated).
 */

const express = require('express');
const router = express.Router();
const { Customer, Interaction, CallSummary, Agent } = require('../models');
const { detectIntent, shouldUpdateIntent } = require('../services/intentDetection');
const { calculatePotentialScore } = require('../services/potentialScoring');
const { getAgentAssist } = require('../services/agentAssist');

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Store for active calls (in production, use Redis)
const activeCalls = new Map();

// Maximum age for active calls before auto-cleanup (2 hours)
const MAX_CALL_AGE_MS = 2 * 60 * 60 * 1000;

// Periodic cleanup of stale calls to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [callId, callData] of activeCalls) {
        const callAge = now - new Date(callData.startTime).getTime();
        if (callAge > MAX_CALL_AGE_MS) {
            console.log(`Cleaning up stale call: ${callId} (age: ${Math.floor(callAge / 60000)} minutes)`);
            activeCalls.delete(callId);
        }
    }
}, 15 * 60 * 1000); // Run cleanup every 15 minutes

/**
 * POST /api/call-event
 * Receive incoming call event (simulated telephony integration)
 * 
 * This endpoint triggers:
 * 1. Customer lookup by phone number
 * 2. WebSocket notification to agent
 * 3. Call assist context generation
 */
router.post('/', async (req, res) => {
    try {
        const { agent_id, caller_number, timestamp, direction = 'inbound' } = req.body;

        if (!agent_id || !caller_number) {
            return res.status(400).json({
                success: false,
                error: 'agent_id and caller_number are required'
            });
        }

        // Generate unique call ID
        const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Normalize phone number
        const normalizedPhone = caller_number.replace(/[\s-]/g, '');
        // Escape regex special characters to prevent ReDoS attacks
        const escapedPhone = escapeRegex(normalizedPhone.replace(/^\+/, ''));

        // Look up customer by phone
        let customer = await Customer.findOne({
            phone: { $regex: escapedPhone, $options: 'i' }
        });

        let isNewCustomer = false;

        // If customer doesn't exist, create a placeholder
        if (!customer) {
            isNewCustomer = true;
            customer = new Customer({
                name: 'Unknown Caller',
                phone: normalizedPhone,
                currentIntent: 'unknown',
                potentialLevel: 'medium',
                potentialScore: 50
            });
            await customer.save();
        }

        // Get recent interactions for call assist
        const recentInteractions = await Interaction.find({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('agentId', 'name')
            .lean();

        // Generate call assist
        const callAssist = getAgentAssist(customer, recentInteractions, 'phone');

        // Store call in active calls
        const callData = {
            callId,
            agentId: agent_id,
            customerId: customer._id,
            callerNumber: normalizedPhone,
            direction,
            startTime: timestamp ? new Date(timestamp) : new Date(),
            status: 'active'
        };
        activeCalls.set(callId, callData);

        // Update agent's current call
        await Agent.findByIdAndUpdate(agent_id, {
            currentCallId: callId,
            lastActive: new Date()
        });

        // Emit WebSocket event (will be handled by socket module)
        const io = req.app.get('io');
        if (io) {
            io.to(`agent_${agent_id}`).emit('call:incoming', {
                callId,
                customer: {
                    id: customer._id,
                    name: customer.name,
                    phone: customer.phone,
                    potentialLevel: customer.potentialLevel,
                    currentIntent: customer.currentIntent,
                    isNew: isNewCustomer
                },
                callAssist,
                timestamp: callData.startTime
            });
        }

        res.json({
            success: true,
            data: {
                callId,
                customer: {
                    id: customer._id,
                    name: customer.name,
                    phone: customer.phone,
                    potentialLevel: customer.potentialLevel,
                    currentIntent: customer.currentIntent,
                    interactionCount: customer.interactionCount,
                    isNew: isNewCustomer
                },
                callAssist,
                recentInteractions: recentInteractions.slice(0, 3),
                message: isNewCustomer
                    ? 'New customer - profile created'
                    : `Customer found with ${customer.interactionCount} prior interactions`
            }
        });
    } catch (error) {
        console.error('Error processing call event:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/call-event/:callId/end
 * Mark call as ended (triggers summary requirement)
 */
router.post('/:callId/end', async (req, res) => {
    try {
        const { callId } = req.params;
        const { duration } = req.body;

        const callData = activeCalls.get(callId);
        if (!callData) {
            return res.status(404).json({ success: false, error: 'Call not found' });
        }

        // Update call status
        callData.status = 'ended';
        callData.endTime = new Date();
        callData.duration = duration || Math.floor((callData.endTime - callData.startTime) / 1000);

        // Clear agent's current call
        await Agent.findByIdAndUpdate(callData.agentId, {
            currentCallId: null
        });

        // Emit WebSocket event
        const io = req.app.get('io');
        if (io) {
            io.to(`agent_${callData.agentId}`).emit('call:ended', {
                callId,
                duration: callData.duration,
                requiresSummary: true
            });
        }

        res.json({
            success: true,
            data: {
                callId,
                duration: callData.duration,
                requiresSummary: true,
                message: 'Call ended - summary required'
            }
        });
    } catch (error) {
        console.error('Error ending call:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/call-event/:callId/summary
 * Submit post-call summary (CRITICAL for ML training)
 */
router.post('/:callId/summary', async (req, res) => {
    try {
        const { callId } = req.params;
        const {
            outcome,
            updatedIntent,
            keywordsDiscussed,
            objections,
            summaryText,
            followUpRequired,
            followUpDate,
            followUpNotes,
            pointsToRemember,
            doNotRepeat,
            potentialAssessment,
            assessmentConfidence,
            assistPanelHelpful,
            assistFeedback
        } = req.body;

        // Validate required fields
        if (!outcome || !updatedIntent || !summaryText || !potentialAssessment) {
            return res.status(400).json({
                success: false,
                error: 'outcome, updatedIntent, summaryText, and potentialAssessment are required'
            });
        }

        const callData = activeCalls.get(callId);
        if (!callData) {
            return res.status(404).json({ success: false, error: 'Call not found' });
        }

        // Create call summary
        const callSummary = new CallSummary({
            callId,
            customerId: callData.customerId,
            agentId: callData.agentId,
            callerNumber: callData.callerNumber,
            callStartTime: callData.startTime,
            callEndTime: callData.endTime || new Date(),
            callDuration: callData.duration,
            direction: callData.direction,
            outcome,
            updatedIntent,
            keywordsDiscussed: keywordsDiscussed || [],
            objections: objections || [],
            summaryText,
            followUpRequired: followUpRequired || false,
            followUpDate: followUpDate ? new Date(followUpDate) : null,
            followUpNotes,
            pointsToRemember: pointsToRemember || [],
            doNotRepeat: doNotRepeat || [],
            potentialAssessment,
            assessmentConfidence: assessmentConfidence || 'somewhat-confident',
            assistPanelHelpful,
            assistFeedback
        });

        await callSummary.save();

        // Create interaction record
        const interaction = new Interaction({
            customerId: callData.customerId,
            agentId: callData.agentId,
            channel: 'phone',
            direction: callData.direction,
            summary: summaryText,
            callDuration: callData.duration,
            outcome: mapOutcomeToInteraction(outcome),
            intent: updatedIntent,
            keywords: keywordsDiscussed || [],
            objections: objections || [],
            followUpRequired: followUpRequired || false,
            followUpDate: followUpDate ? new Date(followUpDate) : null,
            pointsToRemember: pointsToRemember || [],
            doNotRepeat: doNotRepeat || [],
            callSummaryId: callSummary._id
        });

        await interaction.save();

        // Update customer profile
        const customer = await Customer.findById(callData.customerId);
        if (customer) {
            // Update interaction metrics
            customer.interactionCount = (customer.interactionCount || 0) + 1;
            customer.lastInteraction = new Date();
            customer.channelStats.phone = (customer.channelStats.phone || 0) + 1;

            // Set first interaction if not set
            if (!customer.firstInteraction) {
                customer.firstInteraction = new Date();
            }

            // Add new keywords
            const existingKeywords = customer.keywords.map(k => k.keyword.toLowerCase());
            (keywordsDiscussed || []).forEach(keyword => {
                if (!existingKeywords.includes(keyword.toLowerCase())) {
                    customer.keywords.push({
                        keyword: keyword.toLowerCase(),
                        addedBy: callData.agentId,
                        addedAt: new Date()
                    });
                }
            });

            // Update intent
            customer.currentIntent = updatedIntent;
            customer.intentConfidence = 100; // Agent-confirmed
            customer.intentExplanation = `Confirmed after call: ${summaryText.substring(0, 100)}...`;

            // Update potential based on agent assessment
            customer.potentialLevel = potentialAssessment;

            // Recalculate score
            const recentInteractions = await Interaction.find({ customerId: customer._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            const scoringResult = calculatePotentialScore(customer, recentInteractions);
            customer.potentialScore = scoringResult.score;
            customer.scoreBreakdown = scoringResult.breakdown;

            await customer.save();

            // Emit customer update
            const io = req.app.get('io');
            if (io) {
                io.to(`agent_${callData.agentId}`).emit('customer:updated', {
                    customerId: customer._id,
                    potentialLevel: customer.potentialLevel,
                    potentialScore: customer.potentialScore,
                    currentIntent: customer.currentIntent
                });
            }
        }

        // Remove from active calls
        activeCalls.delete(callId);

        res.json({
            success: true,
            data: {
                callSummary,
                interaction,
                customerUpdated: true,
                message: 'Call summary recorded successfully'
            }
        });
    } catch (error) {
        console.error('Error submitting call summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/call-event/:callId
 * Get call details
 */
router.get('/:callId', async (req, res) => {
    try {
        const { callId } = req.params;

        // Check active calls first
        const activeCall = activeCalls.get(callId);
        if (activeCall) {
            const customer = await Customer.findById(activeCall.customerId).lean();
            return res.json({
                success: true,
                data: {
                    ...activeCall,
                    customer,
                    isActive: true
                }
            });
        }

        // Check completed calls
        const callSummary = await CallSummary.findOne({ callId })
            .populate('customerId')
            .populate('agentId', 'name email')
            .lean();

        if (!callSummary) {
            return res.status(404).json({ success: false, error: 'Call not found' });
        }

        res.json({
            success: true,
            data: {
                ...callSummary,
                isActive: false
            }
        });
    } catch (error) {
        console.error('Error fetching call:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/call-event/active/:agentId
 * Get active call for an agent
 */
router.get('/active/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;

        // Find active call for this agent
        for (const [callId, callData] of activeCalls) {
            if (callData.agentId === agentId && callData.status === 'active') {
                const customer = await Customer.findById(callData.customerId).lean();
                const recentInteractions = await Interaction.find({ customerId: customer._id })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean();

                const callAssist = getAgentAssist(customer, recentInteractions, 'phone');

                return res.json({
                    success: true,
                    data: {
                        callId,
                        customer,
                        callAssist,
                        startTime: callData.startTime,
                        duration: Math.floor((new Date() - callData.startTime) / 1000)
                    }
                });
            }
        }

        res.json({
            success: true,
            data: null,
            message: 'No active call'
        });
    } catch (error) {
        console.error('Error fetching active call:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Map call summary outcome to interaction outcome
 */
function mapOutcomeToInteraction(summaryOutcome) {
    const mapping = {
        'interested': 'positive',
        'needs-info': 'neutral',
        'callback-requested': 'scheduled',
        'not-interested': 'negative',
        'converted': 'converted',
        'escalated': 'escalated',
        'wrong-number': 'negative',
        'no-response': 'no-answer'
    };
    return mapping[summaryOutcome] || 'neutral';
}

module.exports = router;
