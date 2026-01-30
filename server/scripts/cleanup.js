/**
 * Database Cleanup Script
 * Removes all demo data, fake chats, and unregistered customers
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Interaction = require(path.join(__dirname, '..', 'models', 'Interaction'));
        const Customer = require(path.join(__dirname, '..', 'models', 'Customer'));
        const User = require(path.join(__dirname, '..', 'models', 'User'));

        // Get all registered client user IDs
        const registeredUsers = await User.find({ role: 'client' }).select('customerId');
        const registeredCustomerIds = registeredUsers.map(u => u.customerId).filter(Boolean);
        console.log('Registered customers:', registeredCustomerIds.length);

        // Delete all interactions (clean slate)
        const deletedInteractions = await Interaction.deleteMany({});
        console.log('Deleted interactions:', deletedInteractions.deletedCount);

        // Delete customers that are NOT linked to registered users
        const deletedCustomers = await Customer.deleteMany({
            _id: { $nin: registeredCustomerIds }
        });
        console.log('Deleted unregistered customers:', deletedCustomers.deletedCount);

        console.log('\n✅ Cleanup complete!');
        console.log('- All demo messages removed');
        console.log('- All fake chats removed');
        console.log('- Unregistered customer data removed');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Cleanup error:', error);
        process.exit(1);
    }
}

cleanup();
