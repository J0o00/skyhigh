/**
 * Email Service (IMAP) - Enhanced with auto-reconnection
 * 
 * Polls company email inbox and creates customer interactions.
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { findCustomerByEmail } = require('./customerMatcher');
const Interaction = require('../models/Interaction');

let imapClient = null;
let isPolling = false;
let ioInstance = null;
let reconnectAttempts = 0;
let pollIntervalId = null; // Store interval ID for cleanup
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Configuration from environment variables
 */
const config = {
    user: process.env.IMAP_USER || '',
    password: process.env.IMAP_PASSWORD || '',
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT) || 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    pollInterval: parseInt(process.env.IMAP_POLL_INTERVAL) || 60000, // 60 seconds
    keepalive: true,
    authTimeout: 30000
};

/**
 * Initialize IMAP connection with auto-reconnect
 */
function initializeImap(io) {
    if (!config.user || !config.password) {
        console.log('📧 IMAP not configured - set IMAP_USER and IMAP_PASSWORD in .env');
        return null;
    }

    ioInstance = io;
    connectImap();
    return true;
}

/**
 * Connect to IMAP server
 */
function connectImap() {
    console.log(`📧 Connecting to IMAP (${config.host})...`);

    imapClient = new Imap(config);

    imapClient.on('ready', () => {
        console.log('📧 IMAP connected successfully');
        reconnectAttempts = 0;
        startPolling(ioInstance);
    });

    imapClient.on('error', (err) => {
        console.error('📧 IMAP error:', err.message);
        scheduleReconnect();
    });

    imapClient.on('end', () => {
        console.log('📧 IMAP connection ended');
        scheduleReconnect();
    });

    imapClient.on('close', (hadError) => {
        console.log(`📧 IMAP connection closed ${hadError ? 'with error' : ''}`);
        scheduleReconnect();
    });

    try {
        imapClient.connect();
    } catch (err) {
        console.error('📧 IMAP connect error:', err.message);
        scheduleReconnect();
    }
}

/**
 * Schedule a reconnection attempt
 */
function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('📧 Max reconnection attempts reached. IMAP disabled.');
        return;
    }

    reconnectAttempts++;
    const delay = Math.min(5000 * reconnectAttempts, 30000); // Max 30 seconds
    console.log(`📧 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

    setTimeout(() => {
        // Stop polling before reconnecting
        stopPolling();
        
        if (imapClient) {
            try {
                imapClient.end();
            } catch (e) { }
        }
        connectImap();
    }, delay);
}

/**
 * Stop polling and clear interval
 */
function stopPolling() {
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
    }
    isPolling = false;
}

/**
 * Start polling for new emails
 */
function startPolling(io) {
    if (isPolling) return;
    
    // Clear any existing interval first
    stopPolling();
    isPolling = true;

    const poll = async () => {
        try {
            if (!imapClient || imapClient.state !== 'authenticated') {
                console.log('IMAP not ready, skipping poll');
                return;
            }
            await checkForNewEmails(io);
        } catch (err) {
            console.error('Poll error:', err.message);
            // If authentication error, trigger reconnect
            if (err.message.includes('Not authenticated') || err.message.includes('Not connected')) {
                scheduleReconnect();
            }
        }
    };

    // Initial check after short delay
    setTimeout(poll, 2000);

    // Set up interval and store the ID for cleanup
    pollIntervalId = setInterval(poll, config.pollInterval);
    console.log(`Polling every ${config.pollInterval / 1000} seconds`);
}

/**
 * Check inbox for ALL emails (read and unread)
 */
function checkForNewEmails(io) {
    return new Promise((resolve, reject) => {
        if (!imapClient || imapClient.state !== 'authenticated') {
            reject(new Error('Not authenticated'));
            return;
        }

        console.log('📧 Opening INBOX to check for emails...');

        imapClient.openBox('INBOX', true, (err, box) => {
            if (err) {
                console.error('📧 Error opening INBOX:', err.message);
                reject(err);
                return;
            }

            console.log(`📧 INBOX opened. Total messages: ${box.messages.total}`);

            // Search for ALL emails (not just unseen)
            imapClient.search(['ALL'], async (err, results) => {
                if (err) {
                    console.error('📧 Search error:', err.message);
                    reject(err);
                    return;
                }

                console.log(`📧 IMAP search returned ${results?.length || 0} results`);

                if (!results || results.length === 0) {
                    console.log('📧 No emails found');
                    resolve([]);
                    return;
                }

                // Get most recent 20 emails
                const recentResults = results.slice(-20);
                console.log(`📧 Found ${results.length} email(s), processing ${recentResults.length} most recent`);

                const fetch = imapClient.fetch(recentResults, { bodies: '' });
                const emails = [];

                fetch.on('message', (msg, seqno) => {
                    msg.on('body', async (stream) => {
                        try {
                            const parsed = await simpleParser(stream);
                            const email = await processEmail(parsed, io);
                            if (email) emails.push(email);
                        } catch (parseErr) {
                            console.error('📧 Parse error:', parseErr.message);
                        }
                    });
                });

                fetch.once('error', reject);
                fetch.once('end', () => resolve(emails));
            });
        });
    });
}

/**
 * Process a single email and create interaction with key points
 */
async function processEmail(parsed, io) {
    const from = parsed.from?.value?.[0];
    if (!from?.address) {
        console.log('📧 Skipping email with no sender');
        return null;
    }

    const senderEmail = from.address.toLowerCase();
    const senderName = from.name || senderEmail.split('@')[0];
    const subject = parsed.subject || '(No Subject)';
    const body = parsed.text || parsed.html || '';

    console.log(`📧 Processing email from: ${senderEmail} - ${subject}`);

    try {
        // Find or create customer
        const { customer, isNew } = await findCustomerByEmail(senderEmail);

        // Update name if we got a better one
        if (senderName && senderName !== senderEmail.split('@')[0]) {
            customer.name = senderName;
            await customer.save();
        }

        // Extract key points for agent summary
        const { extractKeyPoints, formatForAgent } = require('./keyPointsExtractor');
        const keyPoints = extractKeyPoints(subject, body);
        const agentSummary = formatForAgent(keyPoints);

        // Create interaction with extracted key points
        const interaction = new Interaction({
            customerId: customer._id,
            agentId: null, // No agent assigned yet
            channel: 'email',
            direction: 'inbound',
            summary: `[${keyPoints.mainIntent.toUpperCase()}] ${subject}`,
            content: body.substring(0, 5000), // Limit content size
            outcome: 'pending',
            intent: keyPoints.mainIntent,
            // Store key points in agentNotes for display
            agentNotes: JSON.stringify({
                keyPoints: agentSummary,
                extractedAt: new Date()
            })
        });

        await interaction.save();

        // Update customer with detected intent
        customer.interactionCount = (customer.interactionCount || 0) + 1;
        customer.lastContactDate = new Date();
        customer.currentIntent = keyPoints.mainIntent;
        await customer.save();

        // Emit socket event for agents with summary
        if (io) {
            io.emit('email:new', {
                customerId: customer._id,
                customerName: customer.name,
                customerEmail: senderEmail,
                interactionId: interaction._id,
                subject,
                keyPoints: agentSummary,
                urgency: keyPoints.urgency,
                intent: keyPoints.mainIntent,
                actionRequired: keyPoints.actionRequired,
                briefSummary: keyPoints.summary,
                timestamp: new Date()
            });
        }

        console.log(`📧 Created interaction for ${customer.name} [${keyPoints.mainIntent}/${keyPoints.urgency}] (${isNew ? 'new' : 'existing'} customer)`);

        return {
            customer,
            interaction,
            keyPoints: agentSummary,
            isNewCustomer: isNew
        };
    } catch (err) {
        console.error('📧 Failed to process email:', err.message);
        return null;
    }
}

/**
 * Manually check for emails (for testing)
 */
async function manualCheck(io) {
    if (!imapClient || imapClient.state !== 'authenticated') {
        return { error: 'IMAP not connected' };
    }
    return checkForNewEmails(io || ioInstance);
}

/**
 * Get IMAP status
 */
function getStatus() {
    return {
        configured: !!(config.user && config.password),
        connected: imapClient?.state === 'authenticated',
        host: config.host,
        user: config.user ? config.user.replace(/(.{3}).*(@.*)/, '$1***$2') : null,
        pollInterval: config.pollInterval,
        reconnectAttempts
    };
}

module.exports = {
    initializeImap,
    manualCheck,
    getStatus
};
