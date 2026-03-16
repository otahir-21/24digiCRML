require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  // Default to 8080 in production environments, fall back to 8080 otherwise.
  // Elastic Beanstalk / many PaaS providers inject PORT at runtime.
  port: Number(process.env.PORT) || 8080,
  mongo: {
    uri: process.env.MONGODB_URI || '',
  },
  recoveryAi: {
    baseUrl: process.env.RECOVERY_AI_URL || 'http://localhost:8000',
  },
};

module.exports = env;


