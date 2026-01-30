/**
 * V1 API Routes Index
 * 
 * Aggregates all v1 routes for easy mounting.
 * Mount this under /api/v1 in server.js
 */

const express = require('express');
const router = express.Router();

// Import v1 routes
const customersRoutes = require('./customers');
const interactionsRoutes = require('./interactions');
const callsRoutes = require('./calls');
const agentsRoutes = require('./agents');
const intelligenceRoutes = require('./intelligence');

// Mount routes
router.use('/customers', customersRoutes);
router.use('/interactions', interactionsRoutes);
router.use('/calls', callsRoutes);
router.use('/agents', agentsRoutes);
router.use('/intelligence', intelligenceRoutes);

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'ConversaIQ API',
            version: 'v1',
            description: 'Customer Intelligence & Agent Assist Platform',
            endpoints: {
                customers: '/api/v1/customers',
                interactions: '/api/v1/interactions',
                calls: '/api/v1/calls',
                agents: '/api/v1/agents',
                intelligence: '/api/v1/intelligence'
            },
            documentation: '/api/v1/docs'
        },
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

module.exports = router;
