/**
 * Signed key-release receipts.
 * The receipt is appended to SCITT only when the ledger is enabled.
 * A disabled ledger does not invent a claim id.
 */

const crypto = require('crypto');

function receiptBody(receipt) {
  return JSON.stringify({
    ownerId: receipt.ownerId,
    keyType: receipt.keyType,
    namespace: receipt.namespace,
    nonce: receipt.nonce,
    contractHash: receipt.contractHash || null,
    leaseId: receipt.leaseId || null,
    teeType: receipt.teeType,
    keyStored: false,
  });
}

function signReceipt(receipt, privateKey) {
  const body = receiptBody(receipt);
  const signature = crypto.sign(null, Buffer.from(body), privateKey).toString('base64url');
  const publicKey = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' });
  return {
    body,
    signature,
    publicKey,
    keyStored: false,
  };
}

function verifyReceipt(signed) {
  return crypto.verify(
    null,
    Buffer.from(signed.body),
    signed.publicKey,
    Buffer.from(signed.signature, 'base64url')
  );
}

async function appendReleaseReceipt(signed, scitt) {
  if (!scitt || !scitt.isEnabled) {
    return { logged: false, keyStored: false };
  }
  const result = await scitt.submitClaim({
    type: 'KEY_RELEASE_RECEIPT',
    data: {
      body: signed.body,
      signature: signed.signature,
      publicKey: signed.publicKey,
      keyStored: false,
    },
  });
  if (!result || !result.claimId) {
    const err = new Error('Transparency log did not return a receipt claim.');
    err.code = 'TRANSPARENCY_LOG_FAILED';
    err.statusCode = 502;
    throw err;
  }
  return { logged: true, claimId: result.claimId, keyStored: false };
}

module.exports = {
  signReceipt,
  verifyReceipt,
  appendReleaseReceipt,
};
