const fetch = require('node-fetch');
const env = require('../config/env');

async function callRecoveryAi(path, method = 'GET', body, bearerToken) {
  const headers = { 'Content-Type': 'application/json' };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const res = await fetch(`${env.recoveryAi.baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    // ignore non-JSON responses
  }

  if (!res.ok) {
    const message = (json && (json.detail || json.error)) || res.statusText;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return json;
}

module.exports = { callRecoveryAi };

