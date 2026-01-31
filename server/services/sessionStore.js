/**
 * Session Store
 * 
 * Shared in-memory storage for active WebRTC sessions.
 * Allows sharing state between REST routes and Socket handlers.
 */

const webrtcSessions = new Map();

module.exports = {
    webrtcSessions
};
