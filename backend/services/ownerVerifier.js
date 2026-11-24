/**
 * Owner-side verifier.
 * A mock bundle is accepted only in the local profile, and it is not a hardware quote.
 * A SEV-SNP report is hardware-verified only by verifySevSnpQuote.
 * GPU evidence is hardware-verified only when its token signature checks.
 */

const crypto = require('crypto');
const { verifySevSnpQuote } = require('./sevSnpQuote');

function deny(message, code) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = 409;
  throw err;
}

function verifyJwt(token, jwks, expectedIssuer) {
  const raw = String(token || '').trim();
  const parts = raw.split('.');
  if (parts.length !== 3) {
    deny('GPU attestation token is missing. A measurement string is not a quote.', 'GPU_ATTESTATION_REQUIRED');
  }
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const keys = (jwks && jwks.keys) || [];
  const jwk = keys.find((item) => item.kid === header.kid) || keys[0];
  if (!jwk || header.alg !== 'RS256') {
    deny('GPU attestation token signing key was not accepted.', 'GPU_ATTESTATION_REQUIRED');
  }
  const pem = crypto.createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
  const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
  const ok = crypto.verify('RSA-SHA256', signed, pem, Buffer.from(parts[2], 'base64url'));
  if (!ok) {
    deny('GPU attestation token signature was rejected.', 'GPU_ATTESTATION_REQUIRED');
  }
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (expectedIssuer && claims.iss !== expectedIssuer) {
    deny('GPU attestation token issuer was rejected.', 'GPU_ATTESTATION_REQUIRED');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (claims.exp && nowSec > Number(claims.exp) + 60) {
    deny('GPU attestation token is expired.', 'GPU_ATTESTATION_REQUIRED');
  }
  return claims;
}

async function verifyOwnerEvidence({
  profile = 'local',
  evidence,
  expectedReportData,
  referenceValues = {},
  http,
} = {}) {
  const bundle = evidence || {};
  const format = String(bundle.format || bundle.reportFormat || '').toUpperCase();
  if (!format || format === 'SIMULATED' || bundle.tee_type === 'mock') {
    if (profile === 'production') {
      deny('Production policy refuses a mock TEE.', 'MOCK_TEE_REFUSED');
    }
    return {
      ok: true,
      verified: false,
      teeType: 'mock',
      reportFormat: 'SIMULATED',
      claims: {
        tee_type: 'mock',
        debug_enabled: false,
        nonce_fresh: true,
        report_data_bound: true,
        gpu_verified: false,
      },
    };
  }

  let quote = null;
  if (format === 'SEV_SNP' || format === 'SEV-SNP') {
    const result = verifySevSnpQuote(bundle);
    if (!result.ok) {
      deny(result.error, result.code || 'ATTESTATION_REQUIRED');
    }
    quote = result.quote;
    if (referenceValues.measurement && quote.measurement !== referenceValues.measurement) {
      deny('SEV-SNP measurement does not match the owner reference.', 'MEASUREMENT_MISMATCH');
    }
    if (expectedReportData && quote.reportData !== expectedReportData) {
      deny('SEV-SNP report data is not bound to this release.', 'REPORT_UNBOUND');
    }
  } else if (format !== 'GPU') {
    deny('Attestation format is not accepted.', 'ATTESTATION_REQUIRED');
  }

  if (bundle.debug_enabled || bundle.debug === true) {
    deny('A debug-enabled TEE was refused.', 'DEBUG_REFUSED');
  }
  if (referenceValues.minTcb && Number(bundle.tcb || quote?.version || 0) < Number(referenceValues.minTcb)) {
    deny('TCB version is below the owner reference.', 'TCB_REJECTED');
  }
  if (referenceValues.measurement && bundle.measurement && !quote && bundle.measurement !== referenceValues.measurement) {
    deny('Image measurement does not match the owner reference.', 'MEASUREMENT_MISMATCH');
  }

  let gpuVerified = false;
  if (bundle.gpu || format === 'GPU') {
    const gpu = bundle.gpu || {};
    if (!referenceValues.gpuMeasurement) {
      deny('A GPU release needs the owner GPU reference measurement.', 'GPU_REFERENCE_REQUIRED');
    }
    if (gpu.measurement && gpu.measurement !== referenceValues.gpuMeasurement) {
      deny('GPU measurement does not match the owner reference.', 'GPU_MEASUREMENT_MISMATCH');
    }
    if (gpu.token) {
      let jwks = gpu.jwks;
      if (!jwks && gpu.jwksUrl) {
        if (!http) deny('GPU attestation JWKS could not be read.', 'GPU_ATTESTATION_REQUIRED');
        const response = await http.get(gpu.jwksUrl);
        jwks = response.data || response;
      }
      const claims = verifyJwt(gpu.token, jwks, gpu.issuer);
      const measurement = claims.measurement || claims['eat_profile'] || gpu.measurement;
      if (measurement !== referenceValues.gpuMeasurement) {
        deny('GPU attestation measurement does not match the owner reference.', 'GPU_MEASUREMENT_MISMATCH');
      }
      gpuVerified = true;
    } else if (profile === 'production' || format === 'GPU') {
      deny('GPU evidence has no signed token. A measurement string was not accepted.', 'GPU_ATTESTATION_REQUIRED');
    }
  }

  return {
    ok: true,
    verified: Boolean(quote) || gpuVerified,
    teeType: quote ? 'sev-snp' : 'gpu',
    reportFormat: quote ? 'SEV_SNP' : 'GPU',
    measurement: quote ? quote.measurement : null,
    claims: {
      tee_type: quote ? 'sev-snp' : 'gpu',
      debug_enabled: false,
      nonce_fresh: true,
      report_data_bound: true,
      gpu_verified: gpuVerified,
    },
  };
}

module.exports = {
  verifyOwnerEvidence,
};
