/**
 * Canonical security event schema (ECS-inspired) for multi-SIEM export.
 * All providers receive this normalized shape.
 */

const { randomUUID } = require('crypto');

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'authorization', 'client_secret'];

const SEVERITY_MAP = {
  INFO: 3,
  WARN: 5,
  ERROR: 7,
  CRITICAL: 9,
  AUTH_LOGIN: 4,
  AUTH_FAILURE: 7,
  SECURITY_: 8,
  CONSENT_: 4,
  DATA_ACCESS: 5
};

function inferSeverity(eventType) {
  if (!eventType) return 3;
  const upper = String(eventType).toUpperCase();
  if (upper.includes('FAIL') || upper.includes('DENIED') || upper.includes('BREACH')) return 8;
  if (upper.startsWith('SECURITY_')) return 7;
  if (upper.startsWith('AUTH_')) return upper.includes('FAIL') ? 7 : 4;
  return SEVERITY_MAP[upper] || 3;
}

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))) {
      out[k] = '***REDACTED***';
    } else if (v && typeof v === 'object') {
      out[k] = sanitize(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function parseEventData(eventData) {
  if (!eventData) return {};
  if (typeof eventData === 'object') return eventData;
  try {
    return JSON.parse(eventData);
  } catch {
    return { raw: String(eventData) };
  }
}

/**
 * Build a canonical event from an audit log row or explicit fields.
 */
function buildCanonicalEvent({
  eventType,
  eventData,
  userId = null,
  ipAddress = null,
  userAgent = null,
  eventId = null,
  timestamp = null,
  environment = process.env.SIEM_ENVIRONMENT || process.env.NODE_ENV || 'development',
  source = 'audit-service'
}) {
  const details = sanitize(parseEventData(eventData));
  const ts = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
  const id = eventId || randomUUID();
  const severity = inferSeverity(eventType);

  return {
    '@timestamp': ts,
    event: {
      id,
      kind: 'event',
      category: [categoryFromType(eventType)],
      type: [eventType],
      action: eventType,
      outcome: details.success === false ? 'failure' : 'success',
      severity
    },
    can: {
      project: 'ConfidentialAINetwork',
      environment,
      source,
      schema_version: '1.0'
    },
    user: userId ? { id: String(userId) } : undefined,
    source: {
      ip: ipAddress || undefined,
      user_agent: userAgent || undefined
    },
    message: `${eventType}${userId ? ` user=${userId}` : ''}`,
    details
  };
}

function categoryFromType(eventType) {
  const t = String(eventType || '').toUpperCase();
  if (t.startsWith('AUTH_')) return 'authentication';
  if (t.startsWith('CONSENT_')) return 'consent';
  if (t.startsWith('SECURITY_')) return 'security';
  if (t.includes('DATA')) return 'data_access';
  if (t.includes('CONTRACT') || t.includes('SIGN')) return 'contract';
  if (t.includes('TRAINING')) return 'training';
  return 'application';
}

module.exports = {
  buildCanonicalEvent,
  sanitize,
  SENSITIVE_KEYS
};
