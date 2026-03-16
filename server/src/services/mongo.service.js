const { MongoClient } = require('mongodb');

let client;

async function connectMongo(uri) {
  if (!uri) {
    // eslint-disable-next-line no-console
    console.warn('MongoDB: MONGODB_URI / MONGO_URI is not set. Skipping database connection.');
    return { connected: false, reason: 'Mongo URI not set' };
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    // eslint-disable-next-line no-console
    console.log('MongoDB: Connected successfully.');
    return { connected: true };
  } catch (err) {
    // Important: do NOT crash the server on startup if Mongo is unavailable.
    // eslint-disable-next-line no-console
    console.error('MongoDB: Connection failed:', err.message);
    return { connected: false, error: err };
  }
}

function getMongoClient() {
  return client;
}

module.exports = { connectMongo, getMongoClient };

