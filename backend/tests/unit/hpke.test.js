const { seal, open, baseContext, generateHpkeKeyPair } = require('../../services/hpke');

const info = Buffer.from('4f6465206f6e2061204772656369616e2055726e', 'hex');
const pkRm = Buffer.from('3948cfe0ad1ddb695d780e59077195da6c56506b027329794ab02bca80815c4d', 'hex');
const skEm = Buffer.from('52c4a758a802cd8b936eceea314432798d5baf2d7e9235dc084ab1b9cfa2f736', 'hex');
const pkEm = Buffer.from('37fda3567bdbd628e88668c3c8d7e97d1d1253b6d4ea6d44c150f741f1bf4431', 'hex');
const pt = Buffer.from('4265617574792069732074727574682c20747275746820626561757479', 'hex');
const aad = Buffer.from('436f756e742d30', 'hex');

describe('HPKE base mode', () => {
  test('matches the RFC 9180 X25519 AES-128-GCM vector', () => {
    const context = baseContext({
      recipientPublicKey: pkRm,
      ephemeralPrivateKey: skEm,
      ephemeralPublicKey: pkEm,
      info,
    });
    expect(context.sharedSecret.toString('hex')).toBe('fe0e18c9f024ce43799ae393c7e8fe8fce9d218875e8227b0187c04e7d2ea1fc');
    expect(context.key.toString('hex')).toBe('4531685d41d65f03dc48f6b8302c05b0');
    expect(context.baseNonce.toString('hex')).toBe('56d890e5accaaf011cff4b7d');

    const sealed = seal({
      recipientPublicKey: pkRm,
      plaintext: pt,
      info,
      aad,
      ephemeralPrivateKey: skEm,
      ephemeralPublicKey: pkEm,
    });
    const packed = Buffer.from(sealed.slice('hpke1.'.length), 'base64url');
    expect(packed.subarray(32).toString('hex')).toBe(
      'f938558b5d72f1a23810b4be2ab4f84331acc02fc97babc53a52ae8218a355a96d8770ac83d07bea87e13c512a'
    );
  });

  test('a recipient opens a sealed key and a different key does not', () => {
    const recipient = generateHpkeKeyPair();
    const sealed = seal({ recipientPublicKey: recipient.publicKey, plaintext: Buffer.from('dataset-dek') });
    expect(open({ recipientPrivateKey: recipient.privateKey, encapsulated: sealed }).toString()).toBe('dataset-dek');
    const other = generateHpkeKeyPair();
    expect(() => open({ recipientPrivateKey: other.privateKey, encapsulated: sealed })).toThrow();
  });
});
