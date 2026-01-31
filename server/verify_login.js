const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/conversaiq';

async function check() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const email = 'admin@conversaiq.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User NOT FOUND:', email);
        } else {
            console.log('User FOUND:', user.email, 'Role:', user.role);
            const isMatch = await user.checkPassword('admin123');
            console.log('Password "admin123" match:', isMatch);
        }

        const client = await User.findOne({ email: 'client@conversaiq.com' });
        if (client) {
            console.log('User FOUND:', client.email, 'Role:', client.role);
            const isMatch = await client.checkPassword('client123');
            console.log('Password "client123" match:', isMatch);
        } else {
            console.log('Client NOT FOUND');
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
check();
