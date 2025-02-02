const mongoose = require('mongoose');
require('dotenv').config();  // Ensure you're loading environment variables

const connectDB = async () => {
    try {
        // Remove the deprecated option 'useUnifiedTopology'
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000  // Timeout after 30 seconds
        });

        console.log('Database connected successfully!');
    } catch (error) {
        console.error('Database connection error:', error.message);
        process.exit(1);  // Exit the process with failure status
    }
};

module.exports = connectDB;
