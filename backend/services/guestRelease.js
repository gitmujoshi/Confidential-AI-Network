/**
 * Hand sealed owner keys to the local training guest.
 * The guest public key is read from the container output mount.
 * Wrapped keys are written for the guest to open. Plaintext keys are not written.
 */

const fs = require('fs');
const path = require('path');
const { MockOwnerKbs } = require('../sdk/owner-kbs');

function keyFileName(ownerId, keyType) {
  return `${encodeURIComponent(String(ownerId))}__${keyType}`;
}

function readOwnerKey(keyDir, ownerId, keyType) {
  if (!keyDir) return null;
  const filePath = path.join(keyDir, keyFileName(ownerId, keyType));
  if (!fs.existsSync(filePath)) return null;
  const bytes = fs.readFileSync(filePath);
  return bytes;
}

function ownerFromRow(row, fallback) {
  if (!row) return fallback;
  if (row.tdp && row.tdp.did) return String(row.tdp.did);
  if (row.ownerDid) return String(row.ownerDid);
  if (row.ownerId != null) return String(row.ownerId);
  return fallback;
}

function buildGuestOwners(inputs = {}, { keyDir, datasetEndpoint, modelEndpoint } = {}) {
  const owners = [];
  const seen = new Set();
  for (const dataset of inputs.datasets || []) {
    const ownerId = ownerFromRow(dataset, null);
    if (!ownerId) continue;
    const id = `DEK:${ownerId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    owners.push(clientFor(ownerId, 'DEK', dataset.kbsEndpoint || datasetEndpoint, keyDir));
  }
  for (const model of inputs.models || []) {
    const ownerId = ownerFromRow(model, inputs.contract && inputs.contract.tdcId);
    if (!ownerId) continue;
    const id = `MEK:${ownerId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    owners.push(clientFor(ownerId, 'MEK', model.kbsEndpoint || modelEndpoint, keyDir));
  }
  return owners.filter(Boolean);
}

function clientFor(ownerId, keyType, endpoint, keyDir) {
  const key = readOwnerKey(keyDir, ownerId, keyType);
  if (key) {
    const client = new MockOwnerKbs({ ownerId: String(ownerId), keyType });
    client.holdKey(key);
    key.fill(0);
    return { ownerId: String(ownerId), keyType, client };
  }
  if (endpoint && endpoint !== 'mock') {
    return { ownerId: String(ownerId), keyType, endpoint };
  }
  return null;
}

function waitForGuestPublicKey(outDir, { timeoutMs = 180000, intervalMs = 200 } = {}) {
  const filePath = path.join(outDir, 'guest-public.json');
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      try {
        if (fs.existsSync(filePath)) {
          const body = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (body && String(body.hpkePublicKey || '').startsWith('hpke1.')) {
            clearInterval(timer);
            resolve(body.hpkePublicKey);
            return;
          }
        }
      } catch (error) {
        clearInterval(timer);
        reject(error);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        const err = new Error('The training guest did not publish a public key.');
        err.code = 'GUEST_PUBLIC_KEY';
        err.statusCode = 504;
        reject(err);
      }
    }, intervalMs);
  });
}

function datasetRoots(inputsDir) {
  const root = path.join(inputsDir, 'datasets');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).map((name) => `/inputs/datasets/${name}`);
}

function modelRoots(inputsDir) {
  const root = path.join(inputsDir, 'models');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).map((name) => `/inputs/models/${name}`);
}

function writeSealedRelease(inputsDir, releases) {
  const dir = path.join(inputsDir, 'guest');
  fs.mkdirSync(dir, { recursive: true });
  const body = {
    keys: (releases || []).map((item) => ({
      ownerId: item.ownerId,
      keyType: item.keyType,
      wrappedKey: item.wrappedKey,
    })),
    datasetRoots: datasetRoots(inputsDir),
    modelRoots: modelRoots(inputsDir),
  };
  fs.writeFileSync(path.join(dir, 'sealed-release.json'), JSON.stringify(body));
  body.keys.forEach((item) => {
    item.wrappedKey = null;
  });
}

module.exports = {
  keyFileName,
  buildGuestOwners,
  waitForGuestPublicKey,
  writeSealedRelease,
};
