const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/conversaiq';

async function fixIndex() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('users');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const phoneIndex = indexes.find(idx => idx.key.phone);
        if (phoneIndex) {
            console.log(`Dropping index: ${phoneIndex.name}`);
            await collection.dropIndex(phoneIndex.name);
            console.log('Index dropped successfully.');
        } else {
            console.log('Phone index not found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

fixIndex();
