/**
 * Short-lived token that lets a training pod submit one SEV-SNP quote.
 * The token does not make a report valid. The quote still has to verify.
 */

const crypto = require('crypto');

const PURPOSE = 'sev-snp-quote';
const TTL_MS = 60 * 60 * 1000;

function secretOf(env = process.env) {
  return env.CAN_PLATFORM_SIGNING_SECRET || 'dev-can-signing-secret';
}

function mintGuestQuoteToken(jobId, env = process.env, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({
    purpose: PURPOSE,
    jobId: String(jobId),
    exp: now + TTL_MS,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secretOf(env)).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyGuestQuoteToken(token, env = process.env, now = Date.now()) {
  const raw = String(token || '');
  const parts = raw.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = crypto.createHmac('sha256', secretOf(env)).update(parts[0]).digest('base64url');
  const given = Buffer.from(parts[1]);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) return null;
  let claims;
  try {
    claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch (error) {
    return null;
  }
  if (!claims || claims.purpose !== PURPOSE || !claims.jobId) return null;
  if (!claims.exp || now > Number(claims.exp)) return null;
  return { jobId: String(claims.jobId), exp: Number(claims.exp) };
}

module.exports = {
  mintGuestQuoteToken,
  verifyGuestQuoteToken,
};
