/**
 * Isolated harness for role-based CRUD integration tests.
 * Creates tracked entities and cleans up only what it creates (no full DB wipe).
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { User, Dataset, Contract } = require('../../models');
const {
  buildDatasetPayload,
  buildDatasetUpdatePayload,
} = require('../shared/role-crud-catalog');

class RoleCrudHarness {
  constructor(app) {
    this.app = app;
    this.users = {};
    this.datasets = [];
    this.contracts = [];
  }

  tokenFor(user) {
    return jwt.sign(
      {
        userId: user.id,
        role: user.partyType,
        email: user.email,
        sub: user.iamUserId || String(user.id),
      },
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-integration-tests',
      { expiresIn: '1h' }
    );
  }

  auth(user) {
    return { Authorization: `Bearer ${this.tokenFor(user)}` };
  }

  async createUser(partyType, overrides = {}) {
    const stamp = `${partyType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const email = overrides.email || `role-crud-${stamp}@test.example.com`;
    const user = await User.create({
      walletAddress: overrides.walletAddress || null,
      publicKey: overrides.publicKey || null,
      partyType,
      name: overrides.name || `Role CRUD ${partyType}`,
      email: email.toLowerCase(),
      description: overrides.description || `Role CRUD ${partyType} user`,
      organization: overrides.organization || 'Role CRUD Test Org',
      phoneNumber: '',
      website: '',
      location: '',
      did: `did:web:test.example.com:user:${stamp}`,
      didSource: 'SYSTEM_GENERATED',
      didVerified: true,
      didVerificationMethod: 'SYSTEM_GENERATED',
      isRegistered: true,
      registrationDate: new Date(),
      isActive: true,
      onboardingStatus: 'COMPLETED',
      profileCompleted: true,
      emailVerified: true,
      iamUserId: overrides.iamUserId || `role-crud-iam-${stamp}`,
      iamUsername: email.toLowerCase(),
      cloudProviders: partyType === 'TSP' ? (overrides.cloudProviders || ['OCI']) : undefined,
    });

    const withToken = { ...user.toJSON(), token: this.tokenFor(user) };
    this.users[partyType] = withToken;
    return withToken;
  }

  async createAllRoles() {
    await this.createUser('TDP');
    await this.createUser('TDC');
    await this.createUser('TSP', { cloudProviders: ['OCI'] });
    await this.createUser('AppAdmin');
    return this.users;
  }

  async req(method, path, user, body) {
    const agent = request(this.app)[method.toLowerCase()](path).set(this.auth(user));
    if (body !== undefined) {
      agent.send(body);
    }
    return agent;
  }

  async datasetCrudForTdp() {
    const tdp = this.users.TDP;
    const payload = buildDatasetPayload(tdp.id);

    const createRes = await this.req('POST', '/api/datasets', tdp, payload);
    const created = createRes.body?.dataset;
    if (createRes.status === 201 && created?.datasetId) {
      this.datasets.push(created.datasetId);
    }

    const readRes = await this.req('GET', `/api/datasets/${payload.datasetId}`, tdp);
    const updateRes = await this.req('PUT', `/api/datasets/${payload.datasetId}`, tdp, buildDatasetUpdatePayload());
    const deleteRes = await this.req('DELETE', `/api/datasets/${payload.datasetId}`, tdp);

    return { createRes, readRes, updateRes, deleteRes, datasetId: payload.datasetId };
  }

  async createContractLinkingParties() {
    const { TDP: tdp, TDC: tdc, TSP: tsp } = this.users;
    const payload = buildDatasetPayload(tdp.id, `contract-${Date.now()}`);
    const dataset = await Dataset.create({
      ...payload,
      depaId: `DATASET-CRUD-${Date.now()}`,
    });
    this.datasets.push(dataset.datasetId);

    const contract = await Contract.create({
      contractId: `ROLE-CRUD-C-${Date.now()}`,
      status: 'PENDING_TDP_APPROVAL',
      price: 100,
      duration: 30,
      termsAndConditions: 'Role CRUD test contract',
      tdcId: tdc.id,
      tspId: tsp.id,
      tdpId: tdp.id,
      primaryTdpId: tdp.id,
      datasetId: dataset.id,
      primaryDatasetId: dataset.id,
      contractDatasets: [
        {
          datasetId: dataset.datasetId,
          tdpId: tdp.id,
          datasetName: dataset.name,
          tdpName: tdp.name,
          individualPrice: 100,
          paymentStatus: 'PENDING',
        },
      ],
      datasetCount: 1,
      tdpCount: 1,
      totalPrice: 100,
    });
    this.contracts.push(contract.id);
    return contract;
  }

  async cleanup() {
    if (this.contracts.length) {
      await Contract.destroy({ where: { id: this.contracts } });
    }
    if (this.datasets.length) {
      await Dataset.destroy({ where: { datasetId: this.datasets } });
    }
    const userIds = Object.values(this.users).map((u) => u.id).filter(Boolean);
    if (userIds.length) {
      await User.destroy({ where: { id: userIds } });
    }
  }
}

module.exports = RoleCrudHarness;
