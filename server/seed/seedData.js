/**
 * Seed Data Script
 * 
 * Populates the database with demo data for testing.
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Import models
const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const Keyword = require('../models/Keyword');
const Interaction = require('../models/Interaction');
const User = require('../models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conversaiq';

// Demo Users (for admin/agent login with password)
const users = [
    {
        name: 'Admin User',
        email: 'admin@conversaiq.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah@conversaiq.com',
        password: 'agent123',
        role: 'agent',
        isActive: true
    },
    {
        name: 'Michael Chen',
        email: 'michael@conversaiq.com',
        password: 'agent123',
        role: 'agent',
        isActive: true
    }
];

// Demo Agents
const agents = [
    {
        name: 'Sarah Johnson',
        email: 'sarah@conversaiq.com',
        role: 'agent',
        isActive: true,
        metrics: { totalCalls: 45, totalEmails: 120, totalChats: 30, conversions: 12 }
    },
    {
        name: 'Michael Chen',
        email: 'michael@conversaiq.com',
        role: 'senior-agent',
        isActive: true,
        metrics: { totalCalls: 89, totalEmails: 200, totalChats: 55, conversions: 28 }
    },
    {
        name: 'Emily Rodriguez',
        email: 'emily@conversaiq.com',
        role: 'agent',
        isActive: true,
        metrics: { totalCalls: 32, totalEmails: 85, totalChats: 42, conversions: 8 }
    },
    {
        name: 'Admin User',
        email: 'admin@conversaiq.com',
        role: 'admin',
        isActive: true,
        metrics: { totalCalls: 0, totalEmails: 0, totalChats: 0, conversions: 0 }
    }
];

// Demo Customers
const customers = [
    {
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        email: 'rajesh.kumar@techsolutions.in',
        company: 'Tech Solutions Pvt Ltd',
        currentIntent: 'purchase',
        intentConfidence: 85,
        potentialLevel: 'high',
        potentialScore: 82,
        preferences: {
            budget: 'high',
            productInterest: ['Enterprise Plan', 'API Access'],
            urgency: 'high',
            preferredChannel: 'phone'
        },
        interactionCount: 8,
        channelStats: { email: 3, phone: 4, chat: 1 }
    },
    {
        name: 'Priya Sharma',
        phone: '+919123456789',
        email: 'priya@startupnow.io',
        company: 'StartupNow',
        currentIntent: 'inquiry',
        intentConfidence: 60,
        potentialLevel: 'medium',
        potentialScore: 55,
        preferences: {
            budget: 'medium',
            productInterest: ['Starter Plan'],
            urgency: 'medium',
            preferredChannel: 'email'
        },
        interactionCount: 3,
        channelStats: { email: 2, phone: 1, chat: 0 }
    },
    {
        name: 'Amit Patel',
        phone: '+919234567890',
        email: 'amit.patel@globalcorp.com',
        company: 'Global Corp',
        currentIntent: 'follow-up',
        intentConfidence: 70,
        potentialLevel: 'high',
        potentialScore: 78,
        preferences: {
            budget: 'premium',
            productInterest: ['Enterprise Plan', 'Custom Integration'],
            urgency: 'low',
            preferredChannel: 'phone'
        },
        interactionCount: 12,
        channelStats: { email: 5, phone: 6, chat: 1 }
    },
    {
        name: 'Sunita Reddy',
        phone: '+919345678901',
        email: 'sunita@smallbiz.in',
        company: 'SmallBiz Solutions',
        currentIntent: 'support',
        intentConfidence: 90,
        potentialLevel: 'low',
        potentialScore: 35,
        preferences: {
            budget: 'low',
            productInterest: ['Basic Plan'],
            urgency: 'high',
            preferredChannel: 'chat'
        },
        interactionCount: 5,
        channelStats: { email: 1, phone: 1, chat: 3 }
    },
    {
        name: 'Vikram Singh',
        phone: '+919456789012',
        email: 'vikram@enterprise.co',
        company: 'Enterprise Co',
        currentIntent: 'purchase',
        intentConfidence: 95,
        potentialLevel: 'high',
        potentialScore: 92,
        preferences: {
            budget: 'premium',
            productInterest: ['Enterprise Plan', 'API Access', 'Priority Support'],
            urgency: 'high',
            preferredChannel: 'phone'
        },
        interactionCount: 15,
        channelStats: { email: 6, phone: 8, chat: 1 }
    }
];

// Demo Keywords
const keywords = [
    // Intent keywords
    { keyword: 'ready to buy', category: 'intent', displayLabel: 'Ready to Buy', weight: 0.9, sentimentImpact: 'positive' },
    { keyword: 'interested', category: 'intent', displayLabel: 'Interested', weight: 0.7, sentimentImpact: 'positive' },
    { keyword: 'demo request', category: 'intent', displayLabel: 'Demo Request', weight: 0.8, sentimentImpact: 'positive' },
    { keyword: 'pricing inquiry', category: 'intent', displayLabel: 'Pricing Inquiry', weight: 0.6, sentimentImpact: 'positive' },

    // Objection keywords
    { keyword: 'too expensive', category: 'objection', displayLabel: 'Too Expensive', weight: 0.7, sentimentImpact: 'negative' },
    { keyword: 'not now', category: 'objection', displayLabel: 'Not Now', weight: 0.5, sentimentImpact: 'negative' },
    { keyword: 'considering alternatives', category: 'objection', displayLabel: 'Considering Alternatives', weight: 0.6, sentimentImpact: 'negative' },

    // Budget keywords
    { keyword: 'budget approved', category: 'budget', displayLabel: 'Budget Approved', weight: 0.9, sentimentImpact: 'positive' },
    { keyword: 'limited budget', category: 'budget', displayLabel: 'Limited Budget', weight: 0.5, sentimentImpact: 'neutral' },

    // Timeline keywords
    { keyword: 'urgent', category: 'timeline', displayLabel: 'Urgent', weight: 0.8, sentimentImpact: 'positive' },
    { keyword: 'next quarter', category: 'timeline', displayLabel: 'Next Quarter', weight: 0.4, sentimentImpact: 'neutral' },
    { keyword: 'immediate need', category: 'timeline', displayLabel: 'Immediate Need', weight: 0.9, sentimentImpact: 'positive' },

    // Decision keywords
    { keyword: 'decision maker', category: 'decision', displayLabel: 'Decision Maker', weight: 0.8, sentimentImpact: 'positive' },
    { keyword: 'need approval', category: 'decision', displayLabel: 'Need Approval', weight: 0.4, sentimentImpact: 'neutral' },

    // Sentiment keywords
    { keyword: 'happy customer', category: 'sentiment', displayLabel: 'Happy Customer', weight: 0.7, sentimentImpact: 'positive' },
    { keyword: 'frustrated', category: 'sentiment', displayLabel: 'Frustrated', weight: 0.6, sentimentImpact: 'negative' }
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seed...\n');

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Agent.deleteMany({});
        await Customer.deleteMany({});
        await Keyword.deleteMany({});
        await Interaction.deleteMany({});
        await User.deleteMany({});

        // Seed Users (with passwords for admin portal)
        console.log('👤 Seeding users...');
        for (const userData of users) {
            const user = new User(userData);
            await user.save(); // This triggers the password hashing
        }
        console.log(`   Created ${users.length} users`);

        // Seed Agents
        console.log('👥 Seeding agents...');
        const createdAgents = await Agent.insertMany(agents);
        console.log(`   Created ${createdAgents.length} agents`);

        // Seed Keywords
        console.log('🏷️  Seeding keywords...');
        const createdKeywords = await Keyword.insertMany(keywords);
        console.log(`   Created ${createdKeywords.length} keywords`);

        // Seed Customers (with keyword references)
        console.log('👤 Seeding customers...');
        const sarahAgent = createdAgents.find(a => a.email === 'sarah@conversaiq.com');

        for (const customerData of customers) {
            const customer = new Customer({
                ...customerData,
                keywords: [
                    { keyword: 'interested', addedBy: sarahAgent._id },
                    { keyword: customerData.preferences.urgency === 'high' ? 'urgent' : 'next quarter', addedBy: sarahAgent._id }
                ],
                firstInteraction: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                lastInteraction: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random within last week
            });
            await customer.save();
        }
        console.log(`   Created ${customers.length} customers`);

        // Create sample interactions
        console.log('💬 Seeding sample interactions...');
        const createdCustomers = await Customer.find();
        let interactionCount = 0;

        for (const customer of createdCustomers) {
            // Create a few interactions per customer
            const interactions = [
                {
                    customerId: customer._id,
                    agentId: sarahAgent._id,
                    channel: 'email',
                    direction: 'inbound',
                    summary: `Product inquiry from ${customer.company}`,
                    content: `Hi, I'm interested in learning more about your product for ${customer.company}.`,
                    outcome: 'positive',
                    intent: customer.currentIntent
                },
                {
                    customerId: customer._id,
                    agentId: sarahAgent._id,
                    channel: 'phone',
                    direction: 'outbound',
                    callDuration: 300 + Math.floor(Math.random() * 600),
                    summary: 'Discussed pricing and features. Customer interested in demo.',
                    outcome: 'scheduled',
                    notes: 'Follow-up scheduled for next week.',
                    intent: customer.currentIntent
                }
            ];

            await Interaction.insertMany(interactions);
            interactionCount += interactions.length;
        }
        console.log(`   Created ${interactionCount} interactions`);

        console.log('\n✨ Database seeded successfully!\n');
        console.log('📧 Demo login emails:');
        createdAgents.forEach(agent => {
            console.log(`   - ${agent.name}: ${agent.email}`);
        });
        console.log('\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the seed
seedDatabase();
