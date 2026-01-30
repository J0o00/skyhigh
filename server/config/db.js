/**
 * MongoDB Connection Configuration
 * 
 * Uses Mongoose ODM for MongoDB interactions.
 * Connection string is loaded from environment variables.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8+ no longer needs these options, but keeping for clarity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Log database name for verification
    console.log(`📦 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

module.exports = connectDB;
