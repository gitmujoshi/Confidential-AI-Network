const hf = require('../../services/huggingfaceIntegrationService');

describe('huggingfaceIntegrationService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('validateRepoId', () => {
    it('accepts org/name format', () => {
      expect(hf.validateRepoId('sshleifer/tiny-distilbert-base-cased')).toEqual({
        valid: true,
        repoId: 'sshleifer/tiny-distilbert-base-cased',
      });
    });

    it('rejects invalid ids', () => {
      expect(hf.validateRepoId('not-a-repo').valid).toBe(false);
      expect(hf.validateRepoId('').valid).toBe(false);
    });

    it('accepts single-segment dataset ids', () => {
      expect(hf.validateRepoId('ag_news', 'dataset').valid).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('reports tokenConfigured without exposing token', () => {
      process.env.HF_TOKEN = 'hf_secret';
      const cfg = hf.getConfig();
      expect(cfg.tokenConfigured).toBe(true);
      expect(cfg).not.toHaveProperty('token');
    });
  });

  describe('normalizeHfBlock', () => {
    it('normalizes dataset block with splits', () => {
      const block = hf.normalizeHfBlock(
        { repoId: 'ag_news', splitTrain: 'train', splitTest: 'test' },
        'dataset'
      );
      expect(block).toMatchObject({
        repoType: 'dataset',
        repoId: 'ag_news',
        splitTrain: 'train',
        splitTest: 'test',
      });
    });
  });

  describe('extractFromCatalogRow', () => {
    it('reads huggingfaceModel from model metadata', () => {
      const row = {
        architecture: 'custom-arch',
        metadata: { huggingfaceModel: 'org/model' },
      };
      expect(hf.extractFromCatalogRow(row, 'model')).toMatchObject({
        repoId: 'org/model',
        repoType: 'model',
      });
    });

    it('reads hfDatasetId from dataset metadata', () => {
      const row = { metadata: { hfDatasetId: 'ag_news' } };
      expect(hf.extractFromCatalogRow(row, 'dataset')).toMatchObject({
        repoId: 'ag_news',
        repoType: 'dataset',
      });
    });

    it('reads structured huggingface metadata', () => {
      const row = {
        metadata: {
          huggingface: { repoId: 'org/ds', repoType: 'dataset', revision: 'v1' },
        },
      };
      expect(hf.extractFromCatalogRow(row, 'dataset')).toMatchObject({
        repoId: 'org/ds',
        revision: 'v1',
      });
    });
  });

  describe('attachHfToRow', () => {
    it('adds huggingface key when metadata present', () => {
      const out = hf.attachHfToRow(
        { metadata: { hfDatasetId: 'ag_news' } },
        'dataset'
      );
      expect(out.huggingface.repoId).toBe('ag_news');
    });
  });

  describe('isEnabled', () => {
    it('is false when flag unset', () => {
      delete process.env.HUGGINGFACE_INTEGRATION_ENABLED;
      process.env.NODE_ENV = 'development';
      expect(hf.isEnabled()).toBe(false);
    });

    it('is true in development when flag set', () => {
      process.env.HUGGINGFACE_INTEGRATION_ENABLED = 'true';
      process.env.NODE_ENV = 'development';
      expect(hf.isEnabled()).toBe(true);
    });

    it('is false in production without override', () => {
      process.env.HUGGINGFACE_INTEGRATION_ENABLED = 'true';
      process.env.NODE_ENV = 'production';
      delete process.env.HUGGINGFACE_ALLOW_IN_PRODUCTION;
      expect(hf.isEnabled()).toBe(false);
    });
  });
});
