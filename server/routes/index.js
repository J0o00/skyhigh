/**
 * Routes Index
 * 
 * Exports all route modules.
 */

const customers = require('./customers');
const callEvents = require('./callEvents');
const interactions = require('./interactions');
const keywords = require('./keywords');
const agents = require('./agents');
const auth = require('./authRoutes');
const client = require('./clientRoutes');
const agentRoutes = require('./agentRoutes');
const webrtc = require('./webrtcRoutes');
const conversations = require('./conversationRoutes');

module.exports = {
    customers,
    callEvents,
    interactions,
    keywords,
    agents,
    auth,
    client,
    agentRoutes,
    webrtc,
    conversations
};

