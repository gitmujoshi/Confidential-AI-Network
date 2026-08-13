# CompliancePulse AI - API Reference

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All API endpoints (except `/health`) require JWT authentication.

Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "spiffe": { "status": "healthy", "details": {...} },
    "opa": { "status": "healthy", "details": {...} },
    "baml": { "status": "healthy", "details": {...} },
    "audit": { "status": "healthy", "details": {...} }
  },
  "timestamp": "2024-01-15T14:32:15.000Z"
}
```

---

### Agents

#### POST /api/v1/agents/register

Register a new AI agent.

**Request Body:**
```json
{
  "name": "My Agent",
  "type": "orchestrator|triage|forensic|remediation|custom",
  "workloadId": "unique-workload-id",
  "configuration": {},
  "capabilities": ["capability1", "capability2"]
}
```

**Response:**
```json
{
  "agent": {
    "id": "uuid",
    "name": "My Agent",
    "type": "orchestrator",
    "workloadId": "unique-workload-id",
    "spiffeId": "spiffe://compliancepulse.ai/workload/..."
  },
  "svid": {
    "certificate": "-----BEGIN CERTIFICATE-----...",
    "expiresAt": "2024-01-15T15:32:15.000Z"
  }
}
```

#### GET /api/v1/agents

List all agents.

**Query Parameters:**
- `status` (optional): Filter by status (active, inactive, suspended)
- `type` (optional): Filter by type

**Response:**
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "My Agent",
      "type": "orchestrator",
      "status": "active",
      "workloadId": "unique-workload-id",
      "spiffeId": "spiffe://...",
      "lastActiveAt": "2024-01-15T14:32:15.000Z"
    }
  ]
}
```

#### GET /api/v1/agents/:id

Get agent by ID.

**Response:**
```json
{
  "agent": {
    "id": "uuid",
    "name": "My Agent",
    "type": "orchestrator",
    "status": "active",
    "workloadId": "unique-workload-id",
    "spiffeId": "spiffe://...",
    "configuration": {},
    "capabilities": [],
    "lastActiveAt": "2024-01-15T14:32:15.000Z"
  }
}
```

---

### Policy Evaluation

#### POST /api/v1/policy/evaluate

Evaluate a tool invocation against OPA policies.

**Request Body:**
```json
{
  "agentId": "agent-uuid",
  "toolName": "execute_sql",
  "parameters": {
    "query": "SELECT * FROM users",
    "database": "production"
  },
  "environment": "production"
}
```

**Response:**
```json
{
  "allowed": false,
  "violations": [
    "DROP TABLE operations not allowed in production"
  ],
  "warnings": [],
  "metadata": {
    "evaluationTimeMs": 15,
    "policiesEvaluated": ["policy-001", "policy-002"]
  }
}
```

---

### Identity Management

#### POST /api/v1/identity/issue

Issue a new SPIFFE SVID.

**Request Body:**
```json
{
  "workloadId": "unique-workload-id"
}
```

**Response:**
```json
{
  "spiffeId": "spiffe://compliancepulse.ai/workload/...",
  "certificate": "-----BEGIN CERTIFICATE-----...",
  "expiresAt": "2024-01-15T15:32:15.000Z",
  "issuedAt": "2024-01-15T14:32:15.000Z"
}
```

---

### Audit Trail

#### GET /api/v1/audit/trail

Query audit events.

**Query Parameters:**
- `startDate` (ISO 8601): Start date filter
- `endDate` (ISO 8601): End date filter
- `eventTypes` (comma-separated): Filter by event types
- `agentIds` (comma-separated): Filter by agent IDs
- `limit` (number): Results per page (max 1000)
- `offset` (number): Pagination offset

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "timestamp": "2024-01-15T14:32:15.000Z",
      "eventType": "TOOL_INVOCATION",
      "agentId": "agent-uuid",
      "action": "invoke:execute_sql",
      "resource": "tool:execute_sql",
      "result": "denied",
      "metadata": {
        "violations": ["DROP TABLE not allowed"]
      }
    }
  ],
  "total": 1240
}
```

#### GET /api/v1/audit/compliance-report

Generate a compliance report.

**Query Parameters:**
- `startDate` (ISO 8601, required): Report start date
- `endDate` (ISO 8601, required): Report end date

**Response:**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.000Z"
  },
  "summary": {
    "totalEvents": 12450,
    "byEventType": {
      "TOOL_INVOCATION": 8500,
      "POLICY_EVALUATION": 8500,
      "SVID_ISSUED": 150
    },
    "byResult": {
      "success": 12200,
      "denied": 200,
      "failure": 50
    },
    "policyViolations": 200
  },
  "topAgents": [
    { "agentId": "agent-001", "eventCount": 3200 }
  ],
  "topViolations": [
    { "violation": "Cost threshold exceeded", "count": 120 }
  ]
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information (development only)"
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

API requests are rate-limited to 100 requests per minute per IP address.

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642258335
```

---

## Webhooks

CompliancePulse AI can send webhooks for important events:

- Policy violations
- Critical investigations
- Agent failures
- SVID expirations

Configure webhooks in Settings > Webhooks.
