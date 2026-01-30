/**
 * Customer Matcher Service
 * 
 * Smart customer identification to prevent duplicates.
 * Matches by email OR phone, merges records when possible.
 */

const Customer = require('../models/Customer');

/**
 * Find existing customer by email or phone, or create new one.
 * Ensures no duplicate customers are created.
 * 
 * @param {Object} params
 * @param {string} params.email - Customer email (optional)
 * @param {string} params.phone - Customer phone (optional)
 * @param {string} params.name - Customer name (optional)
 * @param {boolean} params.updateIfFound - Update existing record with new info
 * @returns {Promise<{customer: Object, isNew: boolean}>}
 */
async function findOrCreateCustomer({ email, phone, name, updateIfFound = true }) {
    // Normalize inputs
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedPhone = phone?.replace(/\s+/g, '').trim();
    const normalizedName = name?.trim();

    // Must have at least email or phone
    if (!normalizedEmail && !normalizedPhone) {
        throw new Error('Either email or phone is required to identify customer');
    }

    let customer = null;
    let isNew = false;

    // Strategy 1: Try to find by email first (most reliable)
    if (normalizedEmail) {
        customer = await Customer.findOne({ email: normalizedEmail });
    }

    // Strategy 2: If not found by email, try phone
    if (!customer && normalizedPhone) {
        customer = await Customer.findOne({ phone: normalizedPhone });
    }

    // Strategy 3: Check if same person exists with different identifier
    // (e.g., they emailed first, now calling - match if email matches)
    if (!customer && normalizedEmail && normalizedPhone) {
        // Try to find by either
        customer = await Customer.findOne({
            $or: [
                { email: normalizedEmail },
                { phone: normalizedPhone }
            ]
        });
    }

    if (customer) {
        // Found existing customer - update with any new info
        if (updateIfFound) {
            let needsUpdate = false;

            // Add phone if we didn't have it
            if (normalizedPhone && (!customer.phone || customer.phone === 'Not provided')) {
                customer.phone = normalizedPhone;
                needsUpdate = true;
            }

            // Add email if we didn't have it
            if (normalizedEmail && !customer.email) {
                customer.email = normalizedEmail;
                needsUpdate = true;
            }

            // Upgrade from anonymous to named
            if (normalizedName && isAnonymousName(customer.name)) {
                customer.name = normalizedName;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await customer.save();
            }
        }
    } else {
        // No existing customer found - create new one
        const displayName = normalizedName ||
            (normalizedEmail ? normalizedEmail.split('@')[0] : null) ||
            (normalizedPhone ? `Customer ${normalizedPhone.slice(-4)}` : 'Unknown');

        // Generate unique placeholder phone if not provided (to avoid duplicate key errors)
        const uniquePhone = normalizedPhone || `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        customer = new Customer({
            name: displayName,
            email: normalizedEmail || undefined,
            phone: uniquePhone,
            currentIntent: 'inquiry',
            potentialLevel: 'medium',
            potentialScore: 50,
            status: 'active'
        });

        await customer.save();
        isNew = true;
    }

    return { customer, isNew };
}

/**
 * Check if a name is "anonymous" (auto-generated)
 */
function isAnonymousName(name) {
    if (!name) return true;

    const anonymousPatterns = [
        /^Customer \d+$/,
        /^Unknown$/i,
        /^[a-z0-9._%+-]+$/i // Email username pattern
    ];

    return anonymousPatterns.some(pattern => pattern.test(name));
}

/**
 * Merge two customer records (when we discover they're the same person)
 * Keeps the older record and moves all interactions to it.
 */
async function mergeCustomers(primaryId, duplicateId) {
    const Interaction = require('../models/Interaction');

    // Move all interactions from duplicate to primary
    await Interaction.updateMany(
        { customerId: duplicateId },
        { customerId: primaryId }
    );

    // Copy any unique data from duplicate to primary
    const primary = await Customer.findById(primaryId);
    const duplicate = await Customer.findById(duplicateId);

    if (duplicate) {
        // Merge phone if missing
        if (!primary.phone && duplicate.phone) {
            primary.phone = duplicate.phone;
        }
        // Merge email if missing
        if (!primary.email && duplicate.email) {
            primary.email = duplicate.email;
        }
        // Use better name
        if (isAnonymousName(primary.name) && !isAnonymousName(duplicate.name)) {
            primary.name = duplicate.name;
        }
        // Merge interaction counts
        primary.interactionCount = (primary.interactionCount || 0) + (duplicate.interactionCount || 0);

        await primary.save();
        await Customer.findByIdAndDelete(duplicateId);
    }

    return primary;
}

/**
 * Find customer for incoming email
 */
async function findCustomerByEmail(email) {
    return findOrCreateCustomer({ email, updateIfFound: true });
}

/**
 * Find customer for incoming call
 */
async function findCustomerByPhone(phone) {
    return findOrCreateCustomer({ phone, updateIfFound: true });
}

/**
 * Upgrade anonymous customer when they sign up
 */
async function upgradeCustomerOnSignup({ email, phone, name }) {
    return findOrCreateCustomer({ email, phone, name, updateIfFound: true });
}

module.exports = {
    findOrCreateCustomer,
    findCustomerByEmail,
    findCustomerByPhone,
    upgradeCustomerOnSignup,
    mergeCustomers,
    isAnonymousName
};
