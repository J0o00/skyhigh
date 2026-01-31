/**
 * Create Admin User Script
 * Usage: node seed/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

// Admin Configuration
const ADMIN_USER = {
    name: 'System Admin',
    email: 'admin@conversaiq.com',
    password: 'admin123', // Will be hashed by pre-save hook
    role: 'admin',
    isActive: true
};

const createAdmin = async () => {
    try {
        await connectDB();

        // Check if admin exists
        let admin = await User.findOne({ email: ADMIN_USER.email });

        if (admin) {
            console.log('⚠️ Admin user already exists');
            // Update password just in case
            admin.password = ADMIN_USER.password;
            await admin.save();
            console.log('✅ Admin password updated to: admin123');
        } else {
            // Create new admin
            admin = await User.create(ADMIN_USER);
            console.log('✅ Admin user created successfully');
        }

        console.log('\n-----------------------------------');
        console.log('Admin Credentials:');
        console.log(`Email:    ${ADMIN_USER.email}`);
        console.log(`Password: ${ADMIN_USER.password}`);
        console.log('-----------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
