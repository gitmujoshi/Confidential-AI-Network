const crypto = require('crypto');
const db = require('../models');

function stableStringify(obj) {
  // JSONB order isn’t guaranteed; we hash a stable representation.
  if (obj === null || obj === undefined) return 'null';
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(obj);
}

class CANProvenanceService {
  async appendJobEvent({ jobId, seq, eventType, payload }) {
    const prev = await db.CANProvenanceEvent.findOne({
      where: { jobId },
      order: [['seq', 'DESC']]
    });

    const prevHash = prev ? prev.hash : null;
    const body = stableStringify({
      jobId,
      seq,
      eventType,
      payload,
      prevHash
    });
    const hash = crypto.createHash('sha256').update(body).digest('hex');

    return db.CANProvenanceEvent.create({
      stream: 'CAN_JCS',
      jobId,
      seq,
      eventType,
      payload,
      prevHash,
      hash
    });
  }
}

module.exports = {
  CANProvenanceService
};

