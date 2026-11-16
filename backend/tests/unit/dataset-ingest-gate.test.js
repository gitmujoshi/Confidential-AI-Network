const path = require('path');
const os = require('os');
const fs = require('fs');
const {
  inspectFile,
  assertAllowedIngestFiles,
  filenameExtensions,
} = require('../../services/datasetIngestGate');

describe('datasetIngestGate', () => {
  it('parses compound extensions', () => {
    expect(filenameExtensions('data.csv')).toEqual(['csv']);
    expect(filenameExtensions('model.pkl.gz')).toEqual(['pkl', 'gz']);
  });

  it('allows csv and parquet names', () => {
    expect(inspectFile({ originalname: 'train.csv' }).allowed).toBe(true);
    expect(inspectFile({ originalname: 'shard.parquet' }).allowed).toBe(true);
  });

  it('rejects pickle extensions', () => {
    const result = inspectFile({ originalname: 'sklearn_model.pkl' });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/pickle/i);
  });

  it('rejects pickle magic bytes even with a csv name', () => {
    const tmp = path.join(os.tmpdir(), `can-ingest-${Date.now()}.csv`);
    fs.writeFileSync(tmp, Buffer.from([0x80, 0x04, 0x95, 0x00, 0x00, 0x00, 0x00, 0x00]));
    try {
      const result = inspectFile({ originalname: 'sneaky.csv', path: tmp });
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/pickle/i);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('throws INGEST_FORMAT_REJECTED for mixed batches', () => {
    expect(() =>
      assertAllowedIngestFiles([
        { originalname: 'ok.csv' },
        { originalname: 'bad.pkl' },
      ])
    ).toThrow(/Dataset ingest rejected/);
    try {
      assertAllowedIngestFiles([{ originalname: 'bad.pickle' }]);
    } catch (err) {
      expect(err.code).toBe('INGEST_FORMAT_REJECTED');
      expect(err.statusCode).toBe(400);
    }
  });
});
