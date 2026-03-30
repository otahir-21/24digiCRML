const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const recoveryRoutes = require('./routes/recovery.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '24digi-node-backend' });
});

app.use('/recovery', recoveryRoutes);

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    data: null,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_SERVER_ERROR',
    },
  });
});

module.exports = { app, env };

