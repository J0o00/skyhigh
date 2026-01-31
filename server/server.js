/**
 * ConversaIQ Server - Main Entry Point
 * 
 * Context-Aware Customer Intelligence & Agent Assist Platform
 * 
 * This server provides:
 * - REST API for customer management
 * - WebSocket for real-time notifications
 * - Rule-based intelligence services
 * - Simulated telephony integration
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initializeSocket } = require('./socket');
const routes = require('./routes');
const { initializeImap, getStatus: getImapStatus } = require('./services/emailService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
// CORS configuration - supports multiple origins for frontend independence
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
        next();
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// IMAP email status endpoint
app.get('/api/email/status', (req, res) => {
    const status = getImapStatus();
    res.json({
        success: true,
        data: status
    });
});

// Manual email check endpoint (for testing)
app.get('/api/email/check', async (req, res) => {
    const { manualCheck } = require('./services/emailService');
    try {
        const result = await manualCheck(io);
        res.json({
            success: true,
            data: {
                message: 'Email check triggered',
                result
            }
        });
    } catch (err) {
        res.json({
            success: false,
            error: err.message
        });
    }
});

// V1 API Routes with standardized responses
const v1Routes = require('./routes/v1');
const { apiResponseMiddleware } = require('./middleware/apiResponse');

// Apply API response middleware to all /api routes
app.use('/api', apiResponseMiddleware);

// V1 API - Frontend-agnostic, versioned endpoints
app.use('/api/v1', v1Routes);

// Legacy API Routes (for backward compatibility with existing frontend)
app.use('/api/customers', routes.customers);
app.use('/api/call-event', routes.callEvents);
app.use('/api/interactions', routes.interactions);
app.use('/api/keywords', routes.keywords);
app.use('/api/agents', routes.agents);
app.use('/api/auth', routes.auth);
app.use('/api/client', routes.client);
app.use('/api/agent', routes.agentRoutes);
app.use('/api/webrtc', routes.webrtc);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'ConversaIQ API',
        version: '1.0.0',
        description: 'Context-Aware Customer Intelligence & Agent Assist Platform',
        endpoints: {
            customers: {
                'GET /api/customers': 'List all customers',
                'GET /api/customers/:id': 'Get customer with context',
                'GET /api/customers/phone/:phone': 'Lookup by phone',
                'POST /api/customers': 'Create customer',
                'PUT /api/customers/:id': 'Update customer',
                'POST /api/customers/:id/keywords': 'Add keywords',
                'PUT /api/customers/:id/feedback': 'Submit feedback',
                'GET /api/customers/:id/assist/:channel': 'Get channel assist'
            },
            callEvents: {
                'POST /api/call-event': 'Receive incoming call event',
                'POST /api/call-event/:callId/end': 'End call',
                'POST /api/call-event/:callId/summary': 'Submit call summary',
                'GET /api/call-event/:callId': 'Get call details',
                'GET /api/call-event/active/:agentId': 'Get active call'
            },
            interactions: {
                'GET /api/interactions/customer/:customerId': 'Get customer timeline',
                'GET /api/interactions/:id': 'Get single interaction',
                'POST /api/interactions': 'Create interaction',
                'PUT /api/interactions/:id/follow-up': 'Update follow-up',
                'GET /api/interactions/pending-followups/:agentId': 'Get pending follow-ups'
            },
            keywords: {
                'GET /api/keywords': 'Get all keywords',
                'GET /api/keywords/categories': 'Get categories',
                'POST /api/keywords': 'Suggest new keyword',
                'PUT /api/keywords/:id': 'Update keyword',
                'GET /api/keywords/pending': 'Get pending suggestions'
            },
            agents: {
                'GET /api/agents': 'List agents',
                'GET /api/agents/:id': 'Get agent',
                'POST /api/agents': 'Create agent',
                'PUT /api/agents/:id': 'Update agent',
                'POST /api/agents/login': 'Login',
                'POST /api/agents/:id/logout': 'Logout'
            }
        },
        websocket: {
            events: {
                'agent:join': 'Join agent room for notifications',
                'agent:leave': 'Leave agent room',
                'call:incoming': 'Incoming call notification (server → client)',
                'call:ended': 'Call ended notification (server → client)',
                'customer:updated': 'Customer profile updated (server → client)'
            }
        }
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// Initialize Socket.IO handlers
initializeSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start listening
        server.listen(PORT, () => {
            // Initialize IMAP email service
            const imapStatus = getImapStatus();
            if (imapStatus.configured) {
                initializeImap(io);
            }

            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 ConversaIQ Server Running                                ║
║                                                               ║
║   REST API:    http://localhost:${PORT}/api                     ║
║   WebSocket:   ws://localhost:${PORT}                           ║
║   Health:      http://localhost:${PORT}/health                  ║
║   IMAP Email:  ${imapStatus.configured ? '✓ Enabled' : '✗ Not configured'}                                   ║
║                                                               ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
