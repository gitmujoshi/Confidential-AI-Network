const axios = require('axios');

const CAN_BASE = process.env.CAN_BACKEND_URL || 'http://localhost:5001';

function authHeaders(req) {
  const headers = { 'Content-Type': 'application/json' };
  if (req?.headers?.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  return headers;
}

async function canRequest(req, { method = 'GET', path, data, params }) {
  const response = await axios({
    baseURL: CAN_BASE,
    method,
    url: path,
    data,
    params,
    headers: authHeaders(req),
    validateStatus: () => true,
    timeout: Number(process.env.CAN_BACKEND_TIMEOUT_MS || 20000),
  });
  return response;
}

function forwardError(res, canRes) {
  const status = canRes.status || 502;
  const body = canRes.data && typeof canRes.data === 'object' ? canRes.data : { error: canRes.data };
  return res.status(status).json({
    success: false,
    error: body.error || body.message || 'CAN backend error',
    can: body,
  });
}

module.exports = {
  CAN_BASE,
  canRequest,
  forwardError,
};
