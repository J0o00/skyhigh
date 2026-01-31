/**
 * Customer Intelligence Service
 * 
 * Aggregates data from multiple sources (email, phone, notes)
 * to create a unified customer profile using AI.
 * 
 * "The Single Folder" concept:
 * All interactions -> One intelligence view
 */

const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const { generateCustomerProfile, isConfigured: isAIConfigured } = require('./aiService');

/**
 * Update intelligence profile for a customer
 * @param {string} customerId 
 */
async function updateCustomerProfile(customerId) {
    try {
        if (!isAIConfigured()) {
            console.log('⚠️ AI not configured, skipping profile update');
            return null;
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }

        // 1. Gather all interactions
        // Fetch last 50 interactions to build context
        const interactions = await Interaction.find({ customerId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // 2. Segment data
        const emails = interactions
            .filter(i => i.channel === 'email')
            .map(i => ({
                date: i.createdAt,
                direction: i.direction,
                summary: i.summary,
                content: i.content ? i.content.substring(0, 500) : '' // Truncate content
            }));

        const calls = interactions
            .filter(i => i.channel === 'phone')
            .map(i => ({
                date: i.createdAt,
                duration: i.callDuration,
                intent: i.intent,
                outcome: i.outcome,
                summary: i.summary
            }));

        const notes = customer.notes ? [customer.notes] : [];
        if (customer.interactionNotes) {
            notes.push(...customer.interactionNotes);
        }

        console.log(`🧠 Generating unified profile for customer ${customerId}...`);
        console.log(`   - ${emails.length} emails, ${calls.length} calls`);

        // 3. Generate Profile using AI
        const profile = await generateCustomerProfile(emails, calls, notes);

        if (profile) {
            // 4. Update Customer Model
            customer.intelligenceProfile = {
                ...profile,
                lastUpdated: new Date()
            };

            await customer.save();
            console.log('✅ Customer intelligence profile updated');
            return customer.intelligenceProfile;
        }

        return null;

    } catch (error) {
        console.error('Error updating customer profile:', error);
        throw error;
    }
}

/**
 * Get customer intelligence (generate if stale)
 */
async function getCustomerIntelligence(customerId, forceRefresh = false) {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error('Customer not found');

    // Check if profile is stale (older than 24 hours) or missing
    const isStale = !customer.intelligenceProfile?.lastUpdated ||
        (new Date() - new Date(customer.intelligenceProfile.lastUpdated) > 24 * 60 * 60 * 1000);

    if (forceRefresh || isStale) {
        return await updateCustomerProfile(customerId);
    }

    return customer.intelligenceProfile;
}

module.exports = {
    updateCustomerProfile,
    getCustomerIntelligence
};
