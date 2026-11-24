/**
 * HPKE base mode, RFC 9180.
 * DHKEM(X25519, HKDF-SHA256), HKDF-SHA256, AES-128-GCM.
 * The clean room holds the recipient key. The owner broker seals to it.
 */

const crypto = require('crypto');

const KEM_ID = 0x0020;
const KDF_ID = 0x0001;
const AEAD_ID = 0x0001;
const NSECRET = 32;
const NK = 16;
const NN = 12;

function concat(...parts) {
  return Buffer.concat(parts.map((part) => (Buffer.isBuffer(part) ? part : Buffer.from(part))));
}

function i2osp(value, length) {
  const out = Buffer.alloc(length);
  let current = value;
  for (let i = length - 1; i >= 0; i -= 1) {
    out[i] = current & 0xff;
    current = Math.floor(current / 256);
  }
  return out;
}

function extract(salt, ikm) {
  const used = salt && salt.length ? salt : Buffer.alloc(32);
  return crypto.createHmac('sha256', used).update(ikm).digest();
}

function expand(prk, info, length) {
  let previous = Buffer.alloc(0);
  const chunks = [];
  const rounds = Math.ceil(length / 32);
  for (let i = 1; i <= rounds; i += 1) {
    previous = crypto.createHmac('sha256', prk)
      .update(concat(previous, info, Buffer.from([i])))
      .digest();
    chunks.push(previous);
  }
  return concat(...chunks).subarray(0, length);
}

function labeledExtract(suiteId, salt, label, ikm) {
  return extract(salt, concat('HPKE-v1', suiteId, label, ikm));
}

function labeledExpand(suiteId, prk, label, info, length) {
  return expand(prk, concat(i2osp(length, 2), 'HPKE-v1', suiteId, label, info || Buffer.alloc(0)), length);
}

const kemSuite = concat('KEM', i2osp(KEM_ID, 2));
const hpkeSuite = concat('HPKE', i2osp(KEM_ID, 2), i2osp(KDF_ID, 2), i2osp(AEAD_ID, 2));

function privateKeyFromRaw(raw) {
  const secret = Buffer.from(raw);
  if (secret.length !== 32) {
    throw new Error('X25519 private key must be 32 bytes.');
  }
  const pkcs8 = concat(Buffer.from('302e020100300506032b656e04220420', 'hex'), secret);
  return crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
}

function publicKeyFromRaw(raw) {
  const bytes = Buffer.from(raw);
  if (bytes.length !== 32) {
    throw new Error('X25519 public key must be 32 bytes.');
  }
  return crypto.createPublicKey({
    key: { kty: 'OKP', crv: 'X25519', x: bytes.toString('base64url') },
    format: 'jwk',
  });
}

function publicRawFromPrivate(privateKey) {
  const jwk = crypto.createPublicKey(privateKey).export({ format: 'jwk' });
  return Buffer.from(jwk.x, 'base64url');
}

function decodePublicKey(value) {
  const text = Buffer.isBuffer(value) ? null : String(value || '');
  if (Buffer.isBuffer(value)) {
    if (value.length !== 32) throw new Error('pk_ccr must be a 32-byte X25519 public key.');
    return Buffer.from(value);
  }
  const raw = text.startsWith('hpke1.') ? text.slice('hpke1.'.length) : text;
  const bytes = Buffer.from(raw, 'base64url');
  if (bytes.length !== 32) {
    throw new Error('pk_ccr must be an hpke1 X25519 public key.');
  }
  return bytes;
}

function extractAndExpand(dh, kemContext) {
  const eae = labeledExtract(kemSuite, Buffer.alloc(0), 'eae_prk', dh);
  return labeledExpand(kemSuite, eae, 'shared_secret', kemContext, NSECRET);
}

function keySchedule(sharedSecret, info) {
  const pskIdHash = labeledExtract(hpkeSuite, Buffer.alloc(0), 'psk_id_hash', Buffer.alloc(0));
  const infoHash = labeledExtract(hpkeSuite, Buffer.alloc(0), 'info_hash', info || Buffer.alloc(0));
  const context = concat(Buffer.from([0x00]), pskIdHash, infoHash);
  const secret = labeledExtract(hpkeSuite, sharedSecret, 'secret', Buffer.alloc(0));
  return {
    context,
    secret,
    key: labeledExpand(hpkeSuite, secret, 'key', context, NK),
    baseNonce: labeledExpand(hpkeSuite, secret, 'base_nonce', context, NN),
  };
}

function dh(privateRaw, publicRaw) {
  return crypto.diffieHellman({
    privateKey: privateKeyFromRaw(privateRaw),
    publicKey: publicKeyFromRaw(publicRaw),
  });
}

function encap(recipientPublic, ephemeralPrivate, ephemeralPublic) {
  const sharedDh = dh(ephemeralPrivate, recipientPublic);
  const kemContext = concat(ephemeralPublic, recipientPublic);
  const sharedSecret = extractAndExpand(sharedDh, kemContext);
  sharedDh.fill(0);
  return { enc: Buffer.from(ephemeralPublic), sharedSecret };
}

function sealAead(key, nonce, aad, plaintext) {
  const cipher = crypto.createCipheriv('aes-128-gcm', key, nonce);
  if (aad && aad.length) cipher.setAAD(aad);
  return concat(cipher.update(plaintext), cipher.final(), cipher.getAuthTag());
}

function openAead(key, nonce, aad, ciphertext) {
  const body = ciphertext.subarray(0, ciphertext.length - 16);
  const tag = ciphertext.subarray(ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-128-gcm', key, nonce);
  if (aad && aad.length) decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return concat(decipher.update(body), decipher.final());
}

function generateHpkeKeyPair() {
  const { privateKey } = crypto.generateKeyPairSync('x25519');
  const pkcs8 = privateKey.export({ format: 'der', type: 'pkcs8' });
  const rawPrivate = pkcs8.subarray(pkcs8.length - 32);
  const rawPublic = publicRawFromPrivate(privateKey);
  return {
    privateKey: rawPrivate,
    publicKey: `hpke1.${rawPublic.toString('base64url')}`,
  };
}

function seal({ recipientPublicKey, plaintext, info, aad, ephemeralPrivateKey, ephemeralPublicKey } = {}) {
  const recipient = decodePublicKey(recipientPublicKey);
  let skE = ephemeralPrivateKey ? Buffer.from(ephemeralPrivateKey) : null;
  let pkE = ephemeralPublicKey ? Buffer.from(ephemeralPublicKey) : null;
  if (!skE) {
    const generated = crypto.generateKeyPairSync('x25519');
    const pkcs8 = generated.privateKey.export({ format: 'der', type: 'pkcs8' });
    skE = pkcs8.subarray(pkcs8.length - 32);
    pkE = publicRawFromPrivate(generated.privateKey);
  }
  const { enc, sharedSecret } = encap(recipient, skE, pkE);
  const schedule = keySchedule(sharedSecret, info);
  const ciphertext = sealAead(schedule.key, schedule.baseNonce, aad, Buffer.from(plaintext));
  sharedSecret.fill(0);
  schedule.key.fill(0);
  schedule.baseNonce.fill(0);
  if (!ephemeralPrivateKey) skE.fill(0);
  return `hpke1.${concat(enc, ciphertext).toString('base64url')}`;
}

function open({ recipientPrivateKey, encapsulated, info, aad } = {}) {
  const packed = String(encapsulated || '');
  if (!packed.startsWith('hpke1.')) {
    throw new Error('Wrapped key is not HPKE.');
  }
  const bytes = Buffer.from(packed.slice('hpke1.'.length), 'base64url');
  const enc = bytes.subarray(0, 32);
  const ciphertext = bytes.subarray(32);
  const recipient = Buffer.from(recipientPrivateKey);
  const recipientPublic = publicRawFromPrivate(privateKeyFromRaw(recipient));
  const sharedDh = dh(recipient, enc);
  const sharedSecret = extractAndExpand(sharedDh, concat(enc, recipientPublic));
  const schedule = keySchedule(sharedSecret, info);
  const plaintext = openAead(schedule.key, schedule.baseNonce, aad, ciphertext);
  sharedDh.fill(0);
  sharedSecret.fill(0);
  schedule.key.fill(0);
  schedule.baseNonce.fill(0);
  return plaintext;
}

function baseContext({ recipientPublicKey, ephemeralPrivateKey, ephemeralPublicKey, info } = {}) {
  const recipient = decodePublicKey(recipientPublicKey);
  const { sharedSecret } = encap(recipient, Buffer.from(ephemeralPrivateKey), Buffer.from(ephemeralPublicKey));
  const schedule = keySchedule(sharedSecret, info);
  return {
    sharedSecret: Buffer.from(sharedSecret),
    key: Buffer.from(schedule.key),
    baseNonce: Buffer.from(schedule.baseNonce),
  };
}

module.exports = {
  generateHpkeKeyPair,
  seal,
  open,
  baseContext,
};
