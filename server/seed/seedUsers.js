/**
 * Seed Users Script
 * 
 * Create default users for testing (Admin, Agent, Client)
 */

require('dotenv').config(); // Load .env from current directory
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedUsers = async () => {
    try {
        await connectDB();

        // Admin User
        const adminData = {
            name: 'Chrysler Marshal',
            email: 'chryslermarshal@gmail.com',
            password: '123456',
            role: 'admin',
            isActive: true
        };

        const defaultAdminData = {
            name: 'System Admin',
            email: 'admin@skyhigh.com',
            password: 'admin',
            role: 'admin',
            isActive: true
        };

        // Agent User
        const agentData = {
            name: 'Support Agent',
            email: 'agent@skyhigh.com',
            password: 'agent',
            role: 'agent',
            isActive: true
        };

        // Client User
        const clientData = {
            name: 'John Doe',
            email: 'client@skyhigh.com',
            password: 'client',
            role: 'client',
            isActive: true
        };

        // Upsert users (update if exists, insert if not)
        // Note: pre-save hook for password hashing only runs on save(), 
        // fallback to creating new instance and saving if not found.

        // Agent User 2 (Chrysler)
        const agentData2 = {
            name: 'Chrysler Agent',
            email: 'chrykm10@gmail.com',
            password: '123456',
            role: 'agent',
            isActive: true
        };

        const users = [adminData, defaultAdminData, agentData, agentData2, clientData];

        for (const userData of users) {
            // Check if user exists
            let user = await User.findOne({ email: userData.email });

            if (user) {
                console.log(`User ${userData.email} already exists. Updating...`);
                // Update fields
                user.name = userData.name;
                user.role = userData.role;

                // Only update password if we want to reset it (let's reset for consistency)
                user.password = userData.password;

                await user.save();
                console.log(`✅ Updated ${userData.role}: ${userData.email}`);
            } else {
                // Create new
                user = new User(userData);
                await user.save();
                console.log(`✅ Created ${userData.role}: ${userData.email}`);
            }
        }

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedUsers();
