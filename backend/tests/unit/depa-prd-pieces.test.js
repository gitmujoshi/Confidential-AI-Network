const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { verifyOrganizationVc } = require('../../services/organizationVc');
const { verifySevSnpQuote, REPORT_SIZE, SIGNED_LEN } = require('../../services/sevSnpQuote');
const { recordProvenanceTombstone } = require('../../services/provenanceTombstoneService');

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function derToRaw(der, size) {
  let o = 2;
  if (der[1] & 0x80) o = 2 + (der[1] & 0x7f);
  const read = () => {
    if (der[o] !== 0x02) throw new Error('not an integer');
    const len = der[o + 1];
    let v = der.subarray(o + 2, o + 2 + len);
    o += 2 + len;
    if (v[0] === 0x00) v = v.subarray(1);
    const out = Buffer.alloc(size);
    v.copy(out, size - v.length);
    return out;
  };
  return Buffer.concat([read(), read()]);
}

function signVc(payload, privateKey) {
  const header = b64url(JSON.stringify({ alg: 'ES256', typ: 'vc+jwt' }));
  const body = b64url(JSON.stringify(payload));
  const der = crypto.sign('sha256', Buffer.from(`${header}.${body}`), privateKey);
  return `${header}.${body}.${b64url(derToRaw(der, 32))}`;
}

function opensslChain(dir) {
  const run = (args) => execFileSync('openssl', args, { cwd: dir, stdio: 'pipe' });
  run(['ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', 'ark.key']);
  run(['req', '-new', '-x509', '-key', 'ark.key', '-out', 'ark.pem', '-days', '2', '-subj', '/CN=test-ark']);
  run(['ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', 'ask.key']);
  run(['req', '-new', '-key', 'ask.key', '-out', 'ask.csr', '-subj', '/CN=test-ask']);
  run(['x509', '-req', '-in', 'ask.csr', '-CA', 'ark.pem', '-CAkey', 'ark.key', '-CAcreateserial', '-out', 'ask.pem', '-days', '2']);
  run(['ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', 'vcek.key']);
  run(['req', '-new', '-key', 'vcek.key', '-out', 'vcek.csr', '-subj', '/CN=test-vcek']);
  run(['x509', '-req', '-in', 'vcek.csr', '-CA', 'ask.pem', '-CAkey', 'ask.key', '-CAcreateserial', '-out', 'vcek.pem', '-days', '2']);
}

describe('DEPA PRD pieces', () => {
  test('accepts an organization VC signed by the trusted issuer', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const pem = publicKey.export({ type: 'spki', format: 'pem' });
    const token = signVc(
      {
        iss: 'did:example:sro',
        vc: {
          type: ['VerifiableCredential', 'OrganizationCredential'],
          credentialSubject: {
            name: 'Clinic',
            email: 'Clinic@Example.com',
            partyType: 'DataProvider',
            organization: 'Clinic',
          },
        },
      },
      privateKey
    );
    const ok = verifyOrganizationVc(token, { issuerPem: pem, trustedIssuers: 'did:example:sro' });
    expect(ok.ok).toBe(true);
    expect(ok.subject.partyType).toBe('TDP');
    expect(ok.subject.email).toBe('clinic@example.com');

    const wrong = verifyOrganizationVc(token, { issuerPem: pem, trustedIssuers: 'did:example:other' });
    expect(wrong.ok).toBe(false);
    expect(wrong.code).toBe('VC_ISSUER');
  });

  test('rejects organization VC onboarding when no issuer is configured', () => {
    const savedPem = process.env.DEPA_VC_ISSUER_PEM;
    const savedIss = process.env.DEPA_VC_TRUSTED_ISSUERS;
    delete process.env.DEPA_VC_ISSUER_PEM;
    delete process.env.DEPA_VC_TRUSTED_ISSUERS;
    const result = verifyOrganizationVc('a.b.c');
    expect(result.code).toBe('VC_TRUST_NOT_CONFIGURED');
    if (savedPem) process.env.DEPA_VC_ISSUER_PEM = savedPem;
    if (savedIss) process.env.DEPA_VC_TRUSTED_ISSUERS = savedIss;
  });

  test('verifies a SEV-SNP report against a pinned ARK and rejects a swapped signature', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sev-snp-'));
    opensslChain(dir);
    const arkPem = fs.readFileSync(path.join(dir, 'ark.pem'), 'utf8');
    const askPem = fs.readFileSync(path.join(dir, 'ask.pem'), 'utf8');
    const vcekPem = fs.readFileSync(path.join(dir, 'vcek.pem'), 'utf8');
    const vcekKey = crypto.createPrivateKey(fs.readFileSync(path.join(dir, 'vcek.key')));

    const report = Buffer.alloc(REPORT_SIZE);
    report.writeUInt32LE(3, 0);
    report.writeUInt32LE(1, 0x34);
    report.write('measurement-bytes', 0x90);
    const der = crypto.sign('sha384', report.subarray(0, SIGNED_LEN), vcekKey);
    const raw = derToRaw(der, 48);
    const le = (be) => {
      const out = Buffer.alloc(72);
      for (let i = 0; i < be.length; i += 1) out[i] = be[be.length - 1 - i];
      return out;
    };
    le(raw.subarray(0, 48)).copy(report, 0x2a0);
    le(raw.subarray(48)).copy(report, 0x2a0 + 72);

    const good = verifySevSnpQuote(
      { report: report.toString('base64'), vcekPem, askPem },
      { arkPem }
    );
    expect(good.ok).toBe(true);
    expect(good.quote.mode).toBe('sev-snp');
    expect(good.quote.measurement.startsWith(Buffer.from('measurement-bytes').toString('hex'))).toBe(true);

    report[0x90] ^= 0xff;
    const bad = verifySevSnpQuote(
      { report: report.toString('base64'), vcekPem, askPem },
      { arkPem }
    );
    expect(bad.ok).toBe(false);
    expect(bad.code).toBe('QUOTE_SIGNATURE');
  });

  test('records one append-only tombstone for a provenance id', async () => {
    const rows = [];
    const db = {
      AuditLog: {
        findOne: async ({ where }) =>
          rows.find((row) => row.eventType === where.eventType && row.resourceId === where.resourceId) || null,
        create: async (row) => {
          rows.push(row);
          return row;
        },
      },
    };
    const first = await recordProvenanceTombstone(db, {
      provenanceId: 'prov-1',
      reason: 'Erase patient name',
      userId: 7,
      redactedFields: ['patientName'],
    });
    const second = await recordProvenanceTombstone(db, {
      provenanceId: 'prov-1',
      reason: 'again',
      userId: 7,
    });
    expect(first.created).toBe(true);
    expect(first.tombstone.externalSro).toBe(false);
    expect(second.created).toBe(false);
    expect(rows).toHaveLength(1);
    expect(JSON.parse(rows[0].eventData).redactedFields).toEqual(['patientName']);
  });
});
