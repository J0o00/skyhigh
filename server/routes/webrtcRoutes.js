/**
 * WebRTC Routes
 * 
 * Handles WebRTC call session management and transcript processing.
 */

const express = require('express');
const router = express.Router();
const { Customer, Interaction, CallSummary } = require('../models');
const { processTranscript } = require('../services/transcriptProcessor');

// In-memory session store (use Redis in production)
const { webrtcSessions } = require('../services/sessionStore');

/**
 * POST /api/webrtc/sessions
 * Create a new WebRTC call session - broadcasts to all available agents
 */
router.post('/sessions', async (req, res) => {
    try {
        const { customerId, customerUserId, callerName, callerPhone, agentId } = req.body;

        const sessionId = `webrtc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get customer info if customerId provided
        let customer = null;
        if (customerId) {
            customer = await Customer.findById(customerId).lean();
        }

        const session = {
            sessionId,
            customerId: customerId || null,
            customerUserId: customerUserId || null,
            callerName: callerName || 'Unknown Caller',
            callerPhone: callerPhone || null,
            agentId: null, // Will be set when an agent accepts
            targetAgentId: agentId || null, // If specific agent requested
            customer,
            status: 'pending', // pending, connected, ended
            startTime: null,
            endTime: null,
            duration: 0,
            transcript: [],
            processedSummary: null,
            createdAt: new Date()
        };

        webrtcSessions.set(sessionId, session);

        // Notify all available agents of incoming call request
        const io = req.app.get('io');
        if (io) {
            const callData = {
                sessionId,
                customer,
                customerUserId,
                callerName: callerName || 'Unknown Caller',
                callerPhone,
                timestamp: new Date()
            };

            if (agentId) {
                // If specific agent requested, only notify that agent
                io.to(`agent_${agentId}`).emit('webrtc:call-request', callData);
                console.log(`📞 Call request sent to specific agent: ${agentId}`);
            } else {
                // Broadcast to all connected agents (use agents room or iterate)
                // For now, emit to 'agents' room - agents should join this on connect
                io.emit('webrtc:call-broadcast', callData);
                console.log(`📞 Call request broadcast to all agents`);
            }
        }

        res.status(201).json({
            success: true,
            data: {
                sessionId,
                status: 'pending',
                message: 'Call session created, waiting for agent'
            }
        });
    } catch (error) {
        console.error('Error creating WebRTC session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/webrtc/sessions/:id
 * Get session details
 */
router.get('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const session = webrtcSessions.get(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/webrtc/sessions/:id/status
 * Update session status
 */
router.put('/sessions/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const session = webrtcSessions.get(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        session.status = status;

        if (status === 'connected' && !session.startTime) {
            session.startTime = new Date();
        }

        if (status === 'ended' && !session.endTime) {
            session.endTime = new Date();
            if (session.startTime) {
                session.duration = Math.floor((session.endTime - session.startTime) / 1000);
            }
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/webrtc/sessions/:id/transcript
 * Submit transcript for post-processing
 */
router.post('/sessions/:id/transcript', async (req, res) => {
    try {
        const { id } = req.params;
        const { transcript } = req.body;

        const session = webrtcSessions.get(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        if (!transcript || !Array.isArray(transcript)) {
            return res.status(400).json({
                success: false,
                error: 'transcript must be an array'
            });
        }

        // Store transcript - DISABLED as per user requirement to only store short points
        // session.transcript = transcript; 
        session.status = 'processing';

        // Process transcript
        const processedResult = await processTranscript(transcript, session);
        session.processedSummary = processedResult;
        session.status = 'completed';

        // Create interaction record if we have customer
        if (session.customerId) {
            const interaction = new Interaction({
                customerId: session.customerId,
                agentId: session.agentId,
                channel: 'phone',
                direction: 'inbound',
                summary: processedResult.summary,
                callDuration: session.duration,
                outcome: processedResult.outcome,
                intent: processedResult.intent,
                keywords: processedResult.keywords,
                transcript: transcript, // Persist full transcript
                notes: `WebRTC Call - ${transcript.length} messages exchanged`
            });
            await interaction.save();

            // Update customer
            const customer = await Customer.findById(session.customerId);
            if (customer) {
                customer.interactionCount = (customer.interactionCount || 0) + 1;
                customer.lastInteraction = new Date();
                customer.channelStats.phone = (customer.channelStats.phone || 0) + 1;

                if (processedResult.intent !== 'unknown') {
                    customer.currentIntent = processedResult.intent;
                    customer.intentConfidence = processedResult.intentConfidence || 70;
                }

                // Add to communication history - unified storage for all interactions
                customer.communicationHistory.push({
                    type: 'call',
                    date: session.endTime || new Date(),
                    duration: session.duration,
                    summary: processedResult.summary,
                    keyPoints: processedResult.keywords || [], // Important conversation highlights
                    sentiment: processedResult.sentiment || 'neutral',
                    intent: processedResult.intent || 'unknown',
                    agentId: session.agentId,
                    metadata: {
                        sessionId: session.sessionId,
                        transcriptLength: transcript.length,
                        outcome: processedResult.outcome
                    }
                });

                await customer.save();
            }
        }

        res.json({
            success: true,
            data: {
                sessionId: id,
                processedSummary: processedResult,
                message: 'Transcript processed successfully'
            }
        });
    } catch (error) {
        console.error('Error processing transcript:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/webrtc/sessions/:id/summary
 * Get processed call summary
 */
router.get('/sessions/:id/summary', async (req, res) => {
    try {
        const { id } = req.params;
        const session = webrtcSessions.get(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        if (!session.processedSummary) {
            return res.status(404).json({
                success: false,
                error: 'Summary not yet available'
            });
        }

        res.json({
            success: true,
            data: session.processedSummary
        });
    } catch (error) {
        console.error('Error getting summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/webrtc/sessions/pending/:agentId
 * Get pending call requests for an agent
 */
router.get('/sessions/pending/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const pendingSessions = [];

        for (const [id, session] of webrtcSessions) {
            if (session.agentId === agentId && session.status === 'pending') {
                pendingSessions.push(session);
            }
        }

        res.json({
            success: true,
            data: pendingSessions
        });
    } catch (error) {
        console.error('Error getting pending sessions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Export sessions map for socket access
router.getSessions = () => webrtcSessions;

module.exports = router;
