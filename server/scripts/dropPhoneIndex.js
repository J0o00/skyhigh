/**
 * Script to drop the phone_1 index from customers collection
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const dropIndex = async () => {
    try {
        await connectDB();

        const db = mongoose.connection.db;
        const collection = db.collection('customers');

        // List current indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        // Drop phone_1 index if it exists
        try {
            await collection.dropIndex('phone_1');
            console.log('✅ Dropped phone_1 index');
        } catch (err) {
            if (err.code === 27) {
                console.log('⚠️ phone_1 index does not exist, nothing to drop');
            } else {
                throw err;
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropIndex();
