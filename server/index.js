const { app, env } = require('./src/app');
const { connectMongo } = require('./src/services/mongo.service');

async function start() {
  // Log basic environment info
  // eslint-disable-next-line no-console
  console.log(
    `Starting 24digi-node-backend in ${env.nodeEnv} mode. Port: ${env.port}`,
  );

  // Try to connect to MongoDB, but do not crash the server if it fails.
  const mongoStatus = await connectMongo(env.mongo.uri);

  if (mongoStatus.connected) {
    // eslint-disable-next-line no-console
    console.log('Startup: MongoDB connection established.');
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      'Startup: MongoDB not connected.',
      mongoStatus.reason || mongoStatus.error?.message || '',
    );
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `24digi-node-backend listening on port ${env.port} (NODE_ENV=${env.nodeEnv}).`,
    );
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err);
});

