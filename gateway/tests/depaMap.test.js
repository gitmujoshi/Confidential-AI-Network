const {
  assertAllowedConformsTo,
  dcatToCanDataset,
  canDatasetToCatalog,
  depaContractStatus,
  ricardianFromDepa,
  canUserToProvider,
  themeToCanQuery,
} = require('../lib/depaMap');

describe('depaMap', () => {
  test('rejects pickle catalog formats', () => {
    expect(assertAllowedConformsTo('pickle').ok).toBe(false);
    expect(assertAllowedConformsTo('pkl').ok).toBe(false);
    expect(assertAllowedConformsTo('Parquet').ok).toBe(true);
    expect(assertAllowedConformsTo('csv').ok).toBe(true);
  });

  test('maps DCAT metadata onto a CAN dataset create payload', () => {
    const { canPayload, ingestStatus } = dcatToCanDataset(
      {
        providerId: 'provider-112',
        metadata: {
          'dct:title': 'COVID-19 Multi-Center Clinical Cohort',
          'dct:identifier': 'ds-covid-2026-01',
          'dct:description': 'De-identified clinical dataset for S3 CCR training',
          'dct:conformsTo': 'Parquet',
          'dcat:theme': 'public-health',
          'dct:spatial': 'IN',
          'depa:cost': 25,
        },
      },
      { id: 9, depaId: 'TDP-1' }
    );
    expect(canPayload.datasetId).toBe('ds-covid-2026-01');
    expect(canPayload.name).toContain('COVID-19');
    expect(canPayload.ownerId).toBe(9);
    expect(canPayload.domain).toBe('Healthcare');
    expect(canPayload.contentFormat).toBe('parquet');
    expect(canPayload.data_residency_region).toBe('IN');
    expect(ingestStatus).toBe('discoverable');
  });

  test('maps CAN contract statuses to DEPA names', () => {
    expect(depaContractStatus('SIGNED')).toBe('active');
    expect(depaContractStatus('REVOKED')).toBe('revoked');
    expect(depaContractStatus('DRAFT')).toBe('draft');
  });

  test('requires dataset ids when expanding a PRD contract create', () => {
    expect(() => ricardianFromDepa({ templateId: 'S3', permittedPurpose: 'demo' }, { id: 1 })).toThrow(
      /datasetIds/
    );
    const payload = ricardianFromDepa(
      {
        templateId: 'S3',
        permittedPurpose: 'COVID-19 risk classification',
        datasetIds: ['ds-covid-2026-01'],
      },
      { id: 2 }
    );
    expect(payload.datasetSelections[0].datasetId).toBe('ds-covid-2026-01');
    expect(payload.trainingParams.scenarioTemplate).toBe('S3');
    expect(payload.trainingParams.differentialPrivacy.enabled).toBe(true);
  });

  test('resolves dataset ids from a catalog template hint', () => {
    const payload = ricardianFromDepa(
      { templateId: 'S3', permittedPurpose: 'cohort training' },
      { id: 3 },
      [{
        datasetId: 'ds-from-template',
        price: 12,
        metadata: { depa: { templateHint: 'S3' } },
      }]
    );
    expect(payload.datasetSelections[0].datasetId).toBe('ds-from-template');
    expect(payload.datasetSelections[0].individualPrice).toBe(12);
  });

  test('maps TSP users to InfrastructureProvider', () => {
    const p = canUserToProvider({
      id: 4,
      name: 'Secure Cloud',
      partyType: 'TSP',
      depaId: 'TSP-1',
      email: 'tsp@example.com',
      isActive: true,
    });
    expect(p.providerType).toBe('InfrastructureProvider');
    expect(p.providerId).toBe('TSP-1');
  });

  test('maps catalog search theme onto CAN domain', () => {
    expect(themeToCanQuery({ theme: 'public-health', fmt: 'Parquet' })).toMatchObject({
      domain: 'Healthcare',
      fmt: 'parquet',
    });
  });

  test('catalog view exposes DCAT fields', () => {
    const view = canDatasetToCatalog({
      datasetId: 'ds-1',
      name: 'Cohort',
      description: 'desc',
      contentFormat: 'csv',
      isPublic: true,
      metadata: { ingest: { status: 'discoverable' } },
    });
    expect(view.metadata['dct:title']).toBe('Cohort');
    expect(view.discoverable).toBe(true);
  });
});
