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
            console.log(`👤 Agent ${agentId} joined room agent_${agentId}`);

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
            io.to(`webrtc_${sessionId}`).emit('webrtc:call-accepted', {
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
    });

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
}

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
