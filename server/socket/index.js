/**
 * WebSocket Handlers (Socket.IO)
 * 
 * Real-time communication for:
 * - Incoming call notifications
 * - Call status updates
 * - Customer profile updates
 * - Agent assist refresh
 */

const { Agent } = require('../models');
const { webrtcSessions } = require('../services/sessionStore');
const { generateCallInsights, isConfigured: isAIConfigured } = require('../services/aiService');

/**
 * Initialize Socket.IO handlers
 */
function initializeSocket(io) {
    // Connection handler
    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        /**
         * Agent joins their personal room
         * This allows us to send targeted notifications
         */
        socket.on('agent:join', async (data) => {
            const { agentId } = data;

            if (!agentId) {
                socket.emit('error', { message: 'agentId required' });
                return;
            }

            // Join agent-specific room
            socket.join(`agent_${agentId}`);
            // Also join common agents room for broadcast calls
            socket.join('agents');
            console.log(`👤 Agent ${agentId} joined room agent_${agentId} and agents`);

            // Store agentId on socket for later use
            socket.agentId = agentId;

            // Update agent online status
            try {
                await Agent.findByIdAndUpdate(agentId, {
                    isOnline: true,
                    lastActive: new Date()
                });
            } catch (err) {
                console.error('Error updating agent status:', err);
            }

            // Acknowledge
            socket.emit('agent:joined', {
                agentId,
                room: `agent_${agentId}`,
                timestamp: new Date()
            });
        });

        /**
         * Agent leaves room (logout or disconnect)
         */
        socket.on('agent:leave', async (data) => {
            const { agentId } = data;

            if (agentId) {
                socket.leave(`agent_${agentId}`);
                console.log(`👤 Agent ${agentId} left room`);

                try {
                    await Agent.findByIdAndUpdate(agentId, {
                        isOnline: false,
                        currentCallId: null
                    });
                } catch (err) {
                    console.error('Error updating agent status:', err);
                }
            }
        });

        /**
         * Agent requests call assist refresh
         */
        socket.on('assist:request', async (data) => {
            const { customerId, channel, agentId } = data;

            // This would trigger a fresh assist generation
            // For now, acknowledge the request
            socket.emit('assist:loading', { customerId, channel });

            // The actual assist will be sent via REST API or separate handler
            console.log(`🔄 Assist requested for customer ${customerId} on ${channel}`);
        });

        /**
         * Agent starts a call (manual trigger)
         */
        socket.on('call:start', (data) => {
            const { agentId, customerId, phone } = data;
            console.log(`📞 Call started by agent ${agentId} to ${phone}`);

            // Broadcast to agent's room
            io.to(`agent_${agentId}`).emit('call:started', {
                customerId,
                phone,
                timestamp: new Date()
            });
        });

        /**
         * Agent ends a call
         */
        socket.on('call:end', (data) => {
            const { agentId, callId } = data;
            console.log(`📞 Call ${callId} ended by agent ${agentId}`);

            io.to(`agent_${agentId}`).emit('call:ended', {
                callId,
                requiresSummary: true,
                timestamp: new Date()
            });
        });

        // ============ WebRTC Signaling Events ============

        /**
         * Join a WebRTC call room
         */
        socket.on('webrtc:join', (data) => {
            const { sessionId, role, userId } = data;
            socket.join(`webrtc_${sessionId}`);
            socket.webrtcSession = { sessionId, role, userId };
            console.log(`🎥 ${role} ${userId} joined WebRTC room ${sessionId}`);

            // Notify others in the room
            socket.to(`webrtc_${sessionId}`).emit('webrtc:peer-joined', {
                role,
                userId,
                timestamp: new Date()
            });
        });

        /**
         * WebRTC offer (from caller)
         */
        socket.on('webrtc:offer', (data) => {
            const { sessionId, offer, from } = data;
            console.log(`📡 WebRTC offer from ${from} in session ${sessionId}`);
            socket.to(`webrtc_${sessionId}`).emit('webrtc:offer', {
                offer,
                from,
                timestamp: new Date()
            });
        });

        /**
         * WebRTC answer (from callee)
         */
        socket.on('webrtc:answer', (data) => {
            const { sessionId, answer, from } = data;
            console.log(`📡 WebRTC answer from ${from} in session ${sessionId}`);
            socket.to(`webrtc_${sessionId}`).emit('webrtc:answer', {
                answer,
                from,
                timestamp: new Date()
            });
        });

        /**
         * ICE candidate exchange
         */
        socket.on('webrtc:ice-candidate', (data) => {
            const { sessionId, candidate, from } = data;
            socket.to(`webrtc_${sessionId}`).emit('webrtc:ice-candidate', {
                candidate,
                from,
                timestamp: new Date()
            });
        });

        /**
         * Call accepted by agent
         */
        socket.on('webrtc:call-accept', (data) => {
            const { sessionId, agentId } = data;
            console.log(`✅ Agent ${agentId} accepted call ${sessionId}`);

            // Notify participants in the call room
            io.to(`webrtc_${sessionId}`).emit('webrtc:call-accepted', {
                agentId,
                timestamp: new Date()
            });

            // Notify all other agents that the call is taken
            io.to('agents').emit('webrtc:call-taken', {
                sessionId,
                agentId,
                timestamp: new Date()
            });
        });

        /**
         * Call rejected by agent
         */
        socket.on('webrtc:call-reject', (data) => {
            const { sessionId, agentId, reason } = data;
            console.log(`❌ Agent ${agentId} rejected call ${sessionId}: ${reason}`);
            io.to(`webrtc_${sessionId}`).emit('webrtc:call-rejected', {
                agentId,
                reason,
                timestamp: new Date()
            });
        });

        /**
         * Call ended by either party
         */
        socket.on('webrtc:call-end', (data) => {
            const { sessionId, endedBy } = data;
            console.log(`📵 WebRTC call ${sessionId} ended by ${endedBy}`);
            io.to(`webrtc_${sessionId}`).emit('webrtc:call-ended', {
                endedBy,
                timestamp: new Date()
            });
        });

        /**
         * Leave WebRTC room
         */
        socket.on('webrtc:leave', (data) => {
            const { sessionId } = data;
            socket.leave(`webrtc_${sessionId}`);
            socket.to(`webrtc_${sessionId}`).emit('webrtc:peer-left', {
                timestamp: new Date()
            });
        });

        /**
         * Handle disconnect
         */
        socket.on('disconnect', () => {
            // If in a WebRTC session, notify peers
            if (socket.webrtcSession) {
                const { sessionId, role } = socket.webrtcSession;
                socket.to(`webrtc_${sessionId}`).emit('webrtc:peer-disconnected', {
                    role,
                    timestamp: new Date()
                });
            }
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });

        /**
         * Real-time Transcript Handling & AI Analysis
         */
        socket.on('webrtc:transcript-chunk', async (data) => {
            const { sessionId, text, speaker, timestamp } = data;

            // 1. Broadcast to other participants (e.g. Agent sees Customer text)
            // Legacy handler - keeping for compatibility if needed, but new logic is below
            socket.to(`webrtc_${sessionId}`).emit('webrtc:transcript-chunk', {
                text,
                speaker,
                timestamp
            });

            // 2. Buffer for AI processing
            const session = webrtcSessions.get(sessionId);
            if (session) {
                // Initialize transcript array if needed
                if (!session.transcript) session.transcript = [];

                session.transcript.push({
                    speaker,
                    text,
                    timestamp: new Date(timestamp)
                });

                // 3. Trigger AI Analysis periodically
                // (Existing logic remains)
            }
        });

        /**
         * New Bidirectional Speech Relay
         */
        socket.on('agent_speech', (data) => {
            // Relay agent's words to the client/customer
            // We use broadcast to send to everyone in the room EXCEPT sender
            // But strict broadcast.emit sends to everyone globally connected to socket if not scoped
            // Better to use .to(room) or .broadcast.to(room) if using rooms

            // Assuming data contains: { sessionId, text }
            if (data.sessionId) {
                socket.to(`webrtc_${data.sessionId}`).emit('agent_speech', data);

                // Also save to session transcript for AI
                const session = webrtcSessions.get(data.sessionId);
                if (session) {
                    if (!session.transcript) session.transcript = [];
                    session.transcript.push({
                        speaker: 'agent',
                        text: data.text,
                        timestamp: new Date()
                    });
                }
            }
        });

        socket.on('client_speech', (data) => {
            // Relay client's words to the agent
            if (data.sessionId) {
                socket.to(`webrtc_${data.sessionId}`).emit('client_speech', data);

                // Also save to session transcript for AI
                // Check if we have enough new content for AI
                checkAndTriggerAI(sessionId, session);
            }
        });

        socket.on('client_speech', (data) => {
            // Relay client's words to the agent
            if (data.sessionId) {
                socket.to(`webrtc_${data.sessionId}`).emit('client_speech', data);

                // Also save to session transcript for AI
                const session = webrtcSessions.get(data.sessionId);
                if (session) {
                    if (!session.transcript) session.transcript = [];
                    session.transcript.push({
                        speaker: 'customer',
                        text: data.text,
                        timestamp: new Date()
                    });

                    // Check if we have enough new content for AI
                    checkAndTriggerAI(data.sessionId, session);
                }
            }
        });

        // Helper function for AI processing
        function checkAndTriggerAI(sessionId, session) {
            const transcriptLength = session.transcript.length;
            const lastProcessed = session.lastAiProcessedIndex || 0;

            if (transcriptLength - lastProcessed >= 5) {
                session.lastAiProcessedIndex = transcriptLength; // Update index

                // Run AI in background
                if (isAIConfigured()) {
                    generateCallInsights(session.transcript, session.customer)
                        .then(insights => {
                            if (insights) {
                                // Broadcast insights to the room
                                io.to(`webrtc_${sessionId}`).emit('webrtc:ai-insights', {
                                    insights,
                                    timestamp: new Date()
                                });
                                console.log(`✨ Emitted AI insights for session ${sessionId}`);
                            }
                        })
                        .catch(err => console.error('AI Processing Error:', err));
                }
            }
        }

        // Middleware to log all events (development only)
        if (process.env.NODE_ENV !== 'production') {
            io.use((socket, next) => {
                const originalEmit = socket.emit;
                socket.emit = function (...args) {
                    console.log(`📤 Emit: ${args[0]}`, args[1] ? '(with data)' : '');
                    return originalEmit.apply(socket, args);
                };
                next();
            });
        }

        console.log('✅ Socket.IO handlers initialized');
    }); // End io.on('connection')
} // End initializeSocket

/**
 * Helper function to emit to specific agent
 */
function emitToAgent(io, agentId, event, data) {
    io.to(`agent_${agentId}`).emit(event, {
        ...data,
        timestamp: new Date()
    });
}

/**
 * Broadcast incoming call notification
 */
function notifyIncomingCall(io, agentId, callData) {
    emitToAgent(io, agentId, 'call:incoming', callData);
}

/**
 * Notify call ended
 */
function notifyCallEnded(io, agentId, callId) {
    emitToAgent(io, agentId, 'call:ended', {
        callId,
        requiresSummary: true
    });
}

/**
 * Notify customer updated
 */
function notifyCustomerUpdate(io, agentId, customerId, updates) {
    emitToAgent(io, agentId, 'customer:updated', {
        customerId,
        ...updates
    });
}

module.exports = {
    initializeSocket,
    emitToAgent,
    notifyIncomingCall,
    notifyCallEnded,
    notifyCustomerUpdate
};
