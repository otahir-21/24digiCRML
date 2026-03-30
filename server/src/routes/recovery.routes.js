const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { success } = require('../utils/response');
const { callRecoveryAi } = require('../services/recoveryAi.service');

const router = express.Router();

function getRecoveryToken(req, res) {
  const header = req.headers['x-recovery-token'];
  if (!header) {
    res.status(400).json({
      success: false,
      data: null,
      error: {
        message: 'Missing X-Recovery-Token header',
        code: 'RECOVERY_TOKEN_REQUIRED',
      },
    });
    return null;
  }
  return header.replace(/^Bearer\s+/i, '');
}

// Generate AI plan
router.post('/plans', authMiddleware, async (req, res, next) => {
  const token = getRecoveryToken(req, res);
  if (!token) return;

  try {
    const data = await callRecoveryAi('/plans', 'POST', req.body, token);
    return success(res, data, 200);
  } catch (err) {
    return next(err);
  }
});

// Daily check-in
router.post('/checkins', authMiddleware, async (req, res, next) => {
  const token = getRecoveryToken(req, res);
  if (!token) return;

  try {
    const data = await callRecoveryAi('/checkins', 'POST', req.body, token);
    return success(res, data, 200);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

