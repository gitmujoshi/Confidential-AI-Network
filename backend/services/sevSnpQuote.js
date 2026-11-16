/**
 * Verify an AMD SEV-SNP guest attestation report.
 * A report is hardware-verified only when its ECDSA-P384 signature matches the VCEK
 * and that VCEK chains to the pinned AMD ARK through the ASK.
 * Anything else stays unverified. This module does not synthesize a quote.
 *
 * Report layout follows AMD SEV-SNP ABI: 0x4A0 bytes, signed prefix 0x2A0,
 * signature at 0x2A0 as little-endian P-384 r (72) || s (72).
 */

const crypto = require('crypto');

const REPORT_SIZE = 0x4a0;
const SIGNED_LEN = 0x2a0;
const SIG_OFF = 0x2a0;
const COORD_SLOT = 72;
const P384_LEN = 48;

function leCoordToBe(slot) {
  const le = Buffer.from(slot.subarray(0, COORD_SLOT));
  let last = COORD_SLOT - 1;
  while (last > 0 && le[last] === 0) last -= 1;
  const be = Buffer.alloc(last + 1);
  for (let i = 0; i <= last; i += 1) be[i] = le[last - i];
  return be;
}

function ecdsaDer(rBe, sBe) {
  const int = (buf) => {
    let v = Buffer.from(buf);
    if (v[0] & 0x80) v = Buffer.concat([Buffer.from([0x00]), v]);
    return Buffer.concat([Buffer.from([0x02, v.length]), v]);
  };
  const body = Buffer.concat([int(rBe), int(sBe)]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

function hex(buf) {
  return Buffer.from(buf).toString('hex');
}

function verifySevSnpQuote(input = {}, options = {}) {
  const reportB64 = input.report || input.attestationReport;
  const vcekPem = input.vcekPem;
  const askPem = input.askPem;
  if (!reportB64 || !vcekPem || !askPem) {
    return {
      ok: false,
      code: 'QUOTE_INCOMPLETE',
      error: 'A SEV-SNP quote needs the report, the VCEK certificate, and the ASK certificate.',
    };
  }

  let report;
  try {
    report = Buffer.from(reportB64, 'base64');
  } catch {
    return { ok: false, code: 'QUOTE_MALFORMED', error: 'The attestation report is not base64.' };
  }
  if (report.length !== REPORT_SIZE) {
    return {
      ok: false,
      code: 'QUOTE_MALFORMED',
      error: `SEV-SNP report must be ${REPORT_SIZE} bytes.`,
    };
  }

  const version = report.readUInt32LE(0);
  const signatureAlgo = report.readUInt32LE(0x34);
  if (![2, 3, 4].includes(version) || signatureAlgo !== 1) {
    return {
      ok: false,
      code: 'QUOTE_MALFORMED',
      error: 'SEV-SNP report version or signature algorithm is not ECDSA-P384.',
    };
  }

  const pinnedPem = options.arkPem || process.env.SEV_SNP_ARK_PEM || '';
  if (!pinnedPem) {
    return {
      ok: false,
      code: 'ARK_UNPINNED',
      error: 'Set SEV_SNP_ARK_PEM to the AMD ARK certificate before accepting a hardware quote.',
    };
  }

  let vcek;
  let ask;
  let ark;
  try {
    vcek = new crypto.X509Certificate(vcekPem);
    ask = new crypto.X509Certificate(askPem);
    ark = new crypto.X509Certificate(pinnedPem);
  } catch {
    return { ok: false, code: 'QUOTE_CHAIN', error: 'VCEK, ASK, or ARK certificate could not be parsed.' };
  }

  let askOk = false;
  let vcekOk = false;
  try {
    askOk = ask.verify(ark.publicKey);
    vcekOk = vcek.verify(ask.publicKey);
  } catch {
    askOk = false;
    vcekOk = false;
  }
  if (!askOk) {
    return { ok: false, code: 'QUOTE_CHAIN', error: 'ASK certificate is not signed by the pinned AMD ARK.' };
  }
  if (!vcekOk) {
    return { ok: false, code: 'QUOTE_CHAIN', error: 'VCEK certificate is not signed by the ASK.' };
  }

  const r = leCoordToBe(report.subarray(SIG_OFF, SIG_OFF + COORD_SLOT));
  const s = leCoordToBe(report.subarray(SIG_OFF + COORD_SLOT, SIG_OFF + COORD_SLOT * 2));
  if (r.length > P384_LEN + 1 || s.length > P384_LEN + 1) {
    return { ok: false, code: 'QUOTE_MALFORMED', error: 'SEV-SNP signature coordinates are the wrong size.' };
  }
  const der = ecdsaDer(r, s);
  const signed = report.subarray(0, SIGNED_LEN);
  const verified = crypto.verify('sha384', signed, vcek.publicKey, der);
  if (!verified) {
    return { ok: false, code: 'QUOTE_SIGNATURE', error: 'SEV-SNP report signature does not match the VCEK.' };
  }

  return {
    ok: true,
    quote: {
      verified: true,
      mode: 'sev-snp',
      algorithm: 'ECDSA-P384-SHA384',
      version,
      measurement: hex(report.subarray(0x90, 0x90 + 48)),
      reportData: hex(report.subarray(0x50, 0x50 + 64)),
      chipId: hex(report.subarray(0x1a0, 0x1a0 + 64)),
      verifiedAt: new Date().toISOString(),
      arkPinned: true,
    },
  };
}

module.exports = {
  verifySevSnpQuote,
  REPORT_SIZE,
  SIGNED_LEN,
  leCoordToBe,
  ecdsaDer,
};
