import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast after 5 seconds
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`[MongoDB Error] Critical Database Connection Failure: ${err.message}`);
        console.error(`Please ensure your current IP address is whitelisted in MongoDB Atlas.`);
        // Always exit if database connection fails, otherwise the app is in a zombie state
        process.exit(1);
    }
};

export default connectDB;
