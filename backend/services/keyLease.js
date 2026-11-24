/**
 * Short owner-key leases.
 * A lease can be renewed only while it is still valid. An expired lease stays expired.
 */

const crypto = require('crypto');

function leaseError(message) {
  const err = new Error(message);
  err.code = 'LEASE_EXPIRED';
  err.statusCode = 409;
  return err;
}

class KeyLeaseStore {
  constructor({ ttlMs = 60 * 1000 } = {}) {
    this.ttlMs = ttlMs;
    this.leases = new Map();
  }

  now() {
    return Date.now();
  }

  issue({ ownerId, now } = {}) {
    const at = now == null ? this.now() : now;
    const leaseId = crypto.randomBytes(16).toString('hex');
    const expiresAt = at + this.ttlMs;
    this.leases.set(leaseId, { ownerId, expiresAt });
    return { leaseId, ownerId, expiresAt: new Date(expiresAt).toISOString() };
  }

  renew({ leaseId, ownerId, now } = {}) {
    const at = now == null ? this.now() : now;
    const lease = this.leases.get(leaseId);
    if (!lease || lease.ownerId !== ownerId || lease.expiresAt <= at) {
      throw leaseError('Key lease expired. It was not renewed.');
    }
    lease.expiresAt = at + this.ttlMs;
    return { leaseId, ownerId, expiresAt: new Date(lease.expiresAt).toISOString() };
  }

  assertActive({ leaseId, now = Date.now() } = {}) {
    const lease = this.leases.get(leaseId);
    if (!lease || lease.expiresAt <= now) {
      throw leaseError('Key lease expired. Output release was blocked.');
    }
    return lease;
  }
}

module.exports = {
  KeyLeaseStore,
  KeyLeaseTable: KeyLeaseStore,
};
