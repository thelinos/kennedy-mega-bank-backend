import { MongoClient, Db } from 'mongodb';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

/**
 * getMongoClient - Returns a singleton MongoDB client instance
 *
 * This function implements the singleton pattern to ensure only one
 * MongoDB client instance exists throughout the application lifecycle.
 * The client manages the connection pool to MongoDB.
 *
 * MongoDB is used for:
 * - Storing user avatars (binary image data)
 * - Storing other unstructured/large data
 * - Storing data that doesn't fit well in relational schema
 *
 * @param uri - MongoDB connection string
 * @returns Promise<MongoClient> - The singleton MongoDB client instance
 */
export const getMongoClient = async (uri: string): Promise<MongoClient> => {
  if (!mongoClient) {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
  }
  return mongoClient;
};

/**
 * getMongoDb - Returns a MongoDB database instance
 *
 * This function returns a specific database from the MongoDB client.
 * It uses the singleton pattern to ensure the same database instance
 * is reused across the application.
 *
 * @param uri - MongoDB connection string
 * @param dbName - Name of the database to access
 * @returns Promise<Db> - The MongoDB database instance
 */
export const getMongoDb = async (uri: string, dbName: string): Promise<Db> => {
  if (!mongoDb) {
    const client = await getMongoClient(uri);
    mongoDb = client.db(dbName);
  }
  return mongoDb;
};

/**
 * disconnectMongo - Disconnects the MongoDB client from the database
 *
 * This function gracefully disconnects the MongoDB client, closing all
 * database connections. It should be called during application shutdown
 * to ensure clean disconnection.
 *
 * @returns Promise<void>
 */
export const disconnectMongo = async (): Promise<void> => {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
  }
};
