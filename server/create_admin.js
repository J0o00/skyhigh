require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conversaiq';

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@conversaiq.com';
        const adminPassword = 'password123';

        // Check if admin exists
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user already exists. Updating password...');
            admin.password = adminPassword;
            admin.role = 'admin';
            admin.isActive = true;
            await admin.save();
            console.log('Admin password updated.');
        } else {
            console.log('Creating new admin user...');
            admin = new User({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                isActive: true
            });
            await admin.save();
            console.log('Admin user created successfully.');
        }

        console.log('-----------------------------------');
        console.log('Admin Login Credentials:');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

createAdmin();
