const { spawnSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const { generateHpkeKeyPair, seal } = require('../../services/hpke');
const { buildDockerRunArgs } = require('../../../training/localDockerTrainingRunner');
const { buildGuestOwners, keyFileName } = require('../../services/guestRelease');

const guestKey = path.join(__dirname, '../../local-training/guest_key.py');
const probe = spawnSync('python3', ['-c', 'import cryptography'], { encoding: 'utf8' });
const hasCryptography = probe.status === 0;

describe('local training guest', () => {
  test('the default docker command still ends with the image', () => {
    const args = buildDockerRunArgs({
      jobId: 'job-1',
      contractId: 'c-1',
      maxEpochs: 1,
      inputsDir: '/tmp/in',
      outDir: '/tmp/out',
      image: 'contractmanagement/local-trainer:latest',
      trainingParams: {},
    });
    expect(args[args.length - 1]).toBe('contractmanagement/local-trainer:latest');
    expect(args.includes('GUEST_DECRYPT=1')).toBe(false);
  });

  test('guest decrypt sets the container entry and keeps inputs read-only', () => {
    const args = buildDockerRunArgs({
      jobId: 'job-1',
      contractId: 'c-1',
      maxEpochs: 1,
      inputsDir: '/tmp/in',
      outDir: '/tmp/out',
      image: 'contractmanagement/local-trainer:latest',
      trainingParams: { guestDecrypt: true },
    });
    expect(args.slice(-3)).toEqual(['contractmanagement/local-trainer:latest', 'python', '/app/guest_entry.py']);
    expect(args).toContain('GUEST_DECRYPT=1');
    expect(args).toContain('/tmp/in:/inputs:ro');
  });

  test('a mock owner is used only when a key file is present', () => {
    const owners = buildGuestOwners({
      datasets: [{ ownerId: 'did:can:tdp' }],
      models: [{ ownerId: 'did:can:tdc' }],
    }, { datasetEndpoint: 'mock', modelEndpoint: 'mock' });
    expect(owners).toEqual([]);
    expect(keyFileName('did:can:tdp', 'DEK')).toBe(`${encodeURIComponent('did:can:tdp')}__DEK`);
  });

  (hasCryptography ? test : test.skip)('python opens a key sealed by the API', () => {
    const pair = generateHpkeKeyPair();
    const plaintext = crypto.randomBytes(32);
    const wrapped = seal({ recipientPublicKey: pair.publicKey, plaintext });
    const opened = spawnSync('python3', [guestKey, 'open-stdin'], {
      input: JSON.stringify({
        privateKey: pair.privateKey.toString('base64url'),
        wrappedKey: wrapped,
      }),
      encoding: 'utf8',
    });
    expect(opened.status).toBe(0);
    expect(Buffer.from(opened.stdout, 'base64url').equals(plaintext)).toBe(true);
    const selftest = spawnSync('python3', [guestKey, 'selftest'], { encoding: 'utf8' });
    expect(selftest.status).toBe(0);
  });
});
