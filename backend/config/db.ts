import mongoose from 'mongoose';

/**
 * Connects to MongoDB via Mongoose.
 * Reads MONGO_URI from environment variables.
 * Logs connection host on success or handles errors.
 */
const connectDB = async (): Promise<typeof mongoose | null> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.trim() === '' || mongoUri === 'your_mongodb_connection_string_here') {
    console.warn('⚠️ [MongoDB Warning]: process.env.MONGO_URI is not set or contains placeholder.');
    console.warn('ℹ️ [MongoDB Info]: Running with in-memory resilient data store for preview. Set MONGO_URI in .env to connect to MongoDB Atlas or local instance.');
    return null;
  }

  try {
    const connection = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If strict DB flag is enabled or in production with explicit URI, exit process
    if (process.env.STRICT_DB === 'true') {
      process.exit(1);
    }
    return null;
  }
};

export default connectDB;
