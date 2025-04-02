import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'ifsc-app';

// Create MongoDB client
const client = new MongoClient(uri);

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db(dbName);
  } catch (error) {
    console.error('Could not connect to MongoDB', error);
    process.exit(1);
  }
}

// Close MongoDB connection
export async function closeDatabase() {
  await client.close();
  console.log('MongoDB connection closed');
}

// Export database instance for reuse
export const getDb = (customDbName?: string) => client.db(customDbName || dbName);