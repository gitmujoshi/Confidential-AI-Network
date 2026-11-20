const crypto = require('crypto');

const RAW_KEY_FIELDS = [
  'key',
  'dek',
  'mek',
  'privateKey',
  'keyMaterial',
  'plaintext',
  'secret',
  'keyBytes',
];

function normalizePem(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function generateEphemeralRsaKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  return {
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  };
}

function wrapKeyToPublicPem(publicKeyPem, plaintext) {
  const body = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext);
  const wrapped = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    body
  );
  return wrapped.toString('base64');
}

function openWrappedKey(privateKeyPem, wrappedKey) {
  let wrapped;
  try {
    wrapped = Buffer.from(String(wrappedKey || ''), 'base64');
  } catch (error) {
    const err = new Error('wrappedKey is not valid base64');
    err.statusCode = 400;
    err.code = 'WRAP_MISMATCH';
    throw err;
  }
  if (!wrapped.length) {
    const err = new Error('wrappedKey is empty');
    err.statusCode = 400;
    err.code = 'WRAP_MISMATCH';
    throw err;
  }
  try {
    return crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      wrapped
    );
  } catch (error) {
    const err = new Error('wrappedKey is not encrypted to the attested clean-room public key');
    err.statusCode = 400;
    err.code = 'WRAP_MISMATCH';
    throw err;
  }
}

function assertNoRawKeyFields(body) {
  const source = body && typeof body === 'object' ? body : {};
  for (const field of RAW_KEY_FIELDS) {
    if (source[field] != null && source[field] !== '') {
      const err = new Error(
        'Key bytes must not be sent. Wrap the key to the attested public key and send wrappedKey.'
      );
      err.statusCode = 400;
      err.code = 'KEY_MATERIAL_REJECTED';
      throw err;
    }
  }
}

module.exports = {
  RAW_KEY_FIELDS,
  normalizePem,
  generateEphemeralRsaKeyPair,
  wrapKeyToPublicPem,
  openWrappedKey,
  assertNoRawKeyFields,
};
