'use strict';

const {
  normalizePartyType,
  isAppAdminParty,
  rolesAllowSigning,
  resolveSigningUser,
  parseContractDatasets,
  datasetPkAndSlugRefs,
  isLinkedTdpStatic,
  resolveIsLinkedTdp,
} = require('../../services/contractSigningGate');

describe('contractSigningGate', () => {
  describe('normalizePartyType', () => {
    test('uppercases and trims', () => {
      expect(normalizePartyType(' tdp ')).toBe('TDP');
      expect(normalizePartyType('AppAdmin')).toBe('APPADMIN');
    });
    test('handles empty', () => {
      expect(normalizePartyType()).toBe('');
      expect(normalizePartyType(null)).toBe('');
    });
  });

  describe('isAppAdminParty', () => {
    test('detects AppAdmin', () => {
      expect(isAppAdminParty('AppAdmin')).toBe(true);
      expect(isAppAdminParty('appadmin')).toBe(true);
      expect(isAppAdminParty('TDP')).toBe(false);
    });
  });

  describe('rolesAllowSigning', () => {
    test('same role passes', () => {
      expect(rolesAllowSigning('TDP', 'TDP')).toBe(true);
      expect(rolesAllowSigning('TDP', 'tdp')).toBe(true);
    });
    test('mismatch fails unless AppAdmin actor', () => {
      expect(rolesAllowSigning('TDP', 'TSP')).toBe(false);
      expect(rolesAllowSigning('AppAdmin', 'TSP')).toBe(true);
    });
    test('legacy CCRP aliases TSP for signing', () => {
      expect(rolesAllowSigning('TSP', 'CCRP')).toBe(true);
      expect(rolesAllowSigning('CCRP', 'TSP')).toBe(true);
      expect(rolesAllowSigning('CCRP', 'CCRP')).toBe(true);
    });
  });

  describe('resolveSigningUser', () => {
    test('prefers localUser (Keycloak-style)', () => {
      const req = {
        user: {
          localUser: {
            id: 10,
            partyType: 'TDP',
            email: 'tdp@test.com',
            walletAddress: '0xabc',
            did: 'did:web:x',
            depaId: 'DEPA-TDP',
          },
          id: 999,
          partyType: 'ShouldNotUse',
        },
      };
      expect(resolveSigningUser(req)).toEqual({
        id: 10,
        partyType: 'TDP',
        email: 'tdp@test.com',
        walletAddress: '0xabc',
        did: 'did:web:x',
        depaId: 'DEPA-TDP',
      });
    });

    test('falls back to JWT-style req.user without localUser', () => {
      const req = {
        user: {
          id: 20,
          partyType: 'TSP',
          email: 'tsp@test.com',
          walletAddress: null,
          did: null,
          depaId: 'DEPA-C',
        },
      };
      expect(resolveSigningUser(req)).toEqual({
        id: 20,
        partyType: 'TSP',
        email: 'tsp@test.com',
        walletAddress: null,
        did: null,
        depaId: 'DEPA-C',
      });
    });

    test('returns null when incomplete', () => {
      expect(resolveSigningUser({ user: { localUser: { id: 1 } } })).toBeNull();
      expect(resolveSigningUser({ user: {} })).toBeNull();
      expect(resolveSigningUser({})).toBeNull();
    });
  });

  describe('parseContractDatasets', () => {
    test('parses JSON string contract_datasets', () => {
      const json = JSON.stringify([{ tdpId: 5, datasetId: 'DS-1' }]);
      const rows = parseContractDatasets({ contract_datasets: json });
      expect(rows).toHaveLength(1);
      expect(rows[0].tdpId).toBe(5);
    });

    test('returns [] for invalid JSON string', () => {
      expect(parseContractDatasets({ contract_datasets: 'not-json' })).toEqual([]);
    });
  });

  describe('datasetPkAndSlugRefs', () => {
    test('classifies numeric vs slug datasetId', () => {
      const refs = datasetPkAndSlugRefs([
        { datasetId: 44 },
        { datasetId: '45' },
        { datasetId: ' DS-SLUG ' },
      ]);
      expect(refs.internalIds.sort((a, b) => a - b)).toEqual([44, 45]);
      expect(refs.externalIds).toEqual(['DS-SLUG']);
    });
  });

  describe('isLinkedTdpStatic', () => {
    test('matches contract.tdpId', () => {
      expect(isLinkedTdpStatic({ tdpId: 5, contractDatasets: [] }, 5)).toBe(true);
      expect(isLinkedTdpStatic({ tdpId: 5, contractDatasets: [] }, 6)).toBe(false);
    });

    test('matches nested tdp.id in contractDatasets', () => {
      const contract = {
        contractDatasets: [{ datasetId: 'X', tdp: { id: 9 } }],
      };
      expect(isLinkedTdpStatic(contract, 9)).toBe(true);
    });
  });

  describe('resolveIsLinkedTdp', () => {
    test('short-circuits when static linkage passes', async () => {
      const db = {
        Dataset: {
          findByPk: jest.fn(),
          findOne: jest.fn(),
        },
      };
      await expect(resolveIsLinkedTdp({ tdpId: 1 }, 1, db)).resolves.toBe(true);
      expect(db.Dataset.findByPk).not.toHaveBeenCalled();
    });

    test('uses Dataset.findByPk(owner) when FK columns and JSON miss tdpId', async () => {
      const db = {
        Dataset: {
          findByPk: jest.fn().mockResolvedValue({ ownerId: 7 }),
          findOne: jest.fn(),
        },
      };
      const contract = {
        tdpId: null,
        primaryTdpId: null,
        contractDatasets: [],
        datasetId: 42,
      };
      await expect(resolveIsLinkedTdp(contract, 7, db)).resolves.toBe(true);
      expect(db.Dataset.findByPk).toHaveBeenCalledWith(42, { attributes: ['ownerId'] });
    });

    test('uses Dataset.findOne by business datasetId', async () => {
      const db = {
        Dataset: {
          findByPk: jest.fn().mockResolvedValue(null),
          findOne: jest.fn().mockResolvedValue({ ownerId: 3 }),
        },
      };
      const contract = {
        contractDatasets: [{ datasetId: 'DS-UNIT-001' }],
      };
      await expect(resolveIsLinkedTdp(contract, 3, db)).resolves.toBe(true);
      expect(db.Dataset.findOne).toHaveBeenCalledWith({
        where: { datasetId: 'DS-UNIT-001' },
        attributes: ['ownerId'],
      });
    });

    test('uses Dataset.findByPk when datasetId is numeric in JSON only', async () => {
      const db = {
        Dataset: {
          findByPk: jest.fn().mockResolvedValue({ ownerId: 8 }),
          findOne: jest.fn(),
        },
      };
      const contract = {
        tdpId: null,
        primaryTdpId: null,
        datasetId: null,
        primaryDatasetId: null,
        contractDatasets: [{ datasetId: 100 }],
      };
      await expect(resolveIsLinkedTdp(contract, 8, db)).resolves.toBe(true);
      expect(db.Dataset.findByPk).toHaveBeenCalledWith(100, { attributes: ['ownerId'] });
    });

    test('returns false when nothing matches', async () => {
      const db = {
        Dataset: {
          findByPk: jest.fn().mockResolvedValue(null),
          findOne: jest.fn().mockResolvedValue(null),
        },
      };
      const contract = { contractDatasets: [{ datasetId: 'missing' }] };
      await expect(resolveIsLinkedTdp(contract, 99, db)).resolves.toBe(false);
    });

    test('matches signerEmail to embedded tdpEmail when ids are missing', async () => {
      const db = { Dataset: { findByPk: jest.fn(), findOne: jest.fn() } };
      const contract = {
        contractDatasets: [{ datasetId: 'X', tdpEmail: 'OWNER@Example.COM' }],
      };
      await expect(resolveIsLinkedTdp(contract, 999, db, 'owner@example.com')).resolves.toBe(true);
    });
  });
});
