/**
 * Append-only PII tombstone for a provenance id.
 * The Merkle leaf stays. A later read can see that the named fields were retired.
 * This record is local. It is not a filing with an external SRO.
 */

const EVENT = 'PROVENANCE_TOMBSTONE';

function parseEvent(row) {
  try {
    return JSON.parse(row.eventData);
  } catch {
    return null;
  }
}

async function recordProvenanceTombstone(db, { provenanceId, reason, userId, redactedFields }) {
  const id = String(provenanceId || '').trim();
  const why = String(reason || '').trim();
  if (!id || !why) {
    const err = new Error('provenanceId and reason are required');
    err.statusCode = 400;
    throw err;
  }

  const existing = await db.AuditLog.findOne({
    where: { eventType: EVENT, resourceId: id },
    order: [['timestamp', 'ASC']],
  });
  if (existing) {
    return { created: false, tombstone: parseEvent(existing) };
  }

  const tombstone = {
    provenanceId: id,
    reason: why.slice(0, 2000),
    redactedFields: Array.isArray(redactedFields) ? redactedFields.map(String).slice(0, 50) : [],
    recordedAt: new Date().toISOString(),
    externalSro: false,
    effect: 'Append-only tombstone. Provenance leaves are kept.',
  };

  await db.AuditLog.create({
    eventType: EVENT,
    eventData: JSON.stringify(tombstone),
    userId: Number.isInteger(userId) ? userId : null,
    resourceType: 'provenance',
    resourceId: id,
    action: 'TOMBSTONE',
    outcome: 'SUCCESS',
    timestamp: new Date(),
  });

  return { created: true, tombstone };
}

module.exports = {
  recordProvenanceTombstone,
  EVENT,
};
