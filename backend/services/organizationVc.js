/**
 * Verify a W3C organization credential carried as a compact JWT (vc+jwt).
 * The issuer public key and the trusted issuer ids come from the API host.
 * A caller-supplied key is not accepted.
 */

const crypto = require('crypto');

const PARTY = {
  DataProvider: 'TDP',
  DataConsumer: 'TDC',
  InfrastructureProvider: 'TSP',
  TDP: 'TDP',
  TDC: 'TDC',
  TSP: 'TSP',
  CCRP: 'TSP',
};

function b64urlDecode(segment) {
  const pad = segment.length % 4 === 0 ? '' : '='.repeat(4 - (segment.length % 4));
  return Buffer.from(String(segment).replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function rawEcToDer(sig) {
  const half = sig.length / 2;
  const r = sig.subarray(0, half);
  const s = sig.subarray(half);
  const int = (buf) => {
    let v = buf;
    let i = 0;
    while (i < v.length - 1 && v[i] === 0) i += 1;
    v = v.subarray(i);
    if (v[0] & 0x80) v = Buffer.concat([Buffer.from([0x00]), v]);
    return Buffer.concat([Buffer.from([0x02, v.length]), v]);
  };
  const body = Buffer.concat([int(r), int(s)]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

function verifyOrganizationVc(token, options = {}) {
  const pem = options.issuerPem || process.env.DEPA_VC_ISSUER_PEM || '';
  const trusted = String(options.trustedIssuers || process.env.DEPA_VC_TRUSTED_ISSUERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!pem || trusted.length === 0) {
    return {
      ok: false,
      code: 'VC_TRUST_NOT_CONFIGURED',
      error: 'Set DEPA_VC_ISSUER_PEM and DEPA_VC_TRUSTED_ISSUERS before accepting an organization credential.',
    };
  }

  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts.some((p) => !p)) {
    return { ok: false, code: 'VC_MALFORMED', error: 'Organization credential must be a compact JWT.' };
  }

  let header;
  let payload;
  try {
    header = JSON.parse(b64urlDecode(parts[0]).toString('utf8'));
    payload = JSON.parse(b64urlDecode(parts[1]).toString('utf8'));
  } catch {
    return { ok: false, code: 'VC_MALFORMED', error: 'Organization credential is not valid JSON.' };
  }

  const hash = header.alg === 'RS256' || header.alg === 'ES256' ? 'sha256' : header.alg === 'ES384' ? 'sha384' : null;
  if (!hash) {
    return { ok: false, code: 'VC_ALG', error: `Unsupported credential alg ${header.alg}. Use RS256, ES256, or ES384.` };
  }

  let key;
  try {
    key = crypto.createPublicKey(pem);
  } catch {
    return { ok: false, code: 'VC_TRUST_NOT_CONFIGURED', error: 'DEPA_VC_ISSUER_PEM is not a public key.' };
  }

  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = b64urlDecode(parts[2]);
  let signed = crypto.verify(hash, signingInput, key, signature);
  if (!signed && (header.alg === 'ES256' || header.alg === 'ES384')) {
    const rawLen = header.alg === 'ES256' ? 64 : 96;
    if (signature.length === rawLen) {
      signed = crypto.verify(hash, signingInput, key, rawEcToDer(signature));
    }
  }
  if (!signed) {
    return { ok: false, code: 'VC_SIGNATURE', error: 'Organization credential signature does not match the trusted issuer key.' };
  }
  if (!trusted.includes(payload.iss)) {
    return { ok: false, code: 'VC_ISSUER', error: 'Organization credential issuer is not trusted.' };
  }

  const vc = payload.vc || {};
  const types = Array.isArray(vc.type) ? vc.type : [];
  if (types.length && !types.includes('VerifiableCredential')) {
    return { ok: false, code: 'VC_TYPE', error: 'Credential type must include VerifiableCredential.' };
  }

  const subject = vc.credentialSubject || {};
  const partyType = PARTY[subject.partyType] || PARTY[subject.providerType];
  if (!subject.name || !subject.email || !partyType) {
    return {
      ok: false,
      code: 'VC_SUBJECT',
      error: 'Credential subject needs name, email, and partyType (DataProvider, DataConsumer, or InfrastructureProvider).',
    };
  }

  return {
    ok: true,
    issuer: payload.iss,
    subject: {
      name: String(subject.name),
      email: String(subject.email).toLowerCase(),
      partyType,
      organization: subject.organization || subject.name,
    },
  };
}

module.exports = {
  verifyOrganizationVc,
  b64urlDecode,
  rawEcToDer,
};
