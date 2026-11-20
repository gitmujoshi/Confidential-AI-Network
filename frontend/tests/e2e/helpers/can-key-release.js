const { wrapKeyToPublicPem } = require('../../../../backend/services/canKeyDelivery');
const crypto = require('crypto');

async function releaseWrappedKey(request, backendURL, jobId, keyType, principalId) {
  const attRes = await request.get(`${backendURL}/api/can/jcs/jobs/${jobId}/attestation`, {
    headers: { 'X-CAN-Principal-Id': principalId },
  });
  if (!attRes.ok()) {
    throw new Error(`attestation failed: HTTP ${attRes.status()} ${await attRes.text()}`);
  }
  const att = await attRes.json();
  const attestedPublicKey = att.data.tlsPublicKey;
  const secret = crypto.randomBytes(32);
  const wrappedKey = wrapKeyToPublicPem(attestedPublicKey, secret);
  secret.fill(0);
  return request.post(`${backendURL}/api/can/jcs/jobs/${jobId}/key-released`, {
    headers: { 'X-CAN-Principal-Id': principalId, 'Content-Type': 'application/json' },
    data: { keyType, attestedPublicKey, wrappedKey },
  });
}

module.exports = { releaseWrappedKey };
