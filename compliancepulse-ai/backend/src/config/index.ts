import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api/v1',

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/compliancepulse',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      acquire: 30000,
      idle: 10000,
    },
  },

  // SPIFFE/SPIRE Configuration
  spiffe: {
    serverAddress: process.env.SPIRE_SERVER_ADDRESS || 'unix:///tmp/spire-server/socket',
    trustDomain: process.env.SPIRE_TRUST_DOMAIN || 'compliancepulse.ai',
    svidTTL: parseInt(process.env.SPIFFE_SVID_TTL || '3600', 10), // 1 hour
  },

  // OPA Configuration
  opa: {
    serverUrl: process.env.OPA_SERVER_URL || 'http://localhost:8181',
    policyPath: process.env.OPA_POLICY_PATH || 'compliancepulse',
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '1h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Audit Logging
  audit: {
    enabled: process.env.AUDIT_ENABLED !== 'false',
    gcpProjectId: process.env.GCP_PROJECT_ID,
    bigQueryDataset: process.env.BIGQUERY_DATASET || 'audit_logs',
    bigQueryTable: process.env.BIGQUERY_TABLE || 'tool_invocations',
  },

  // Redis Configuration (for job queues)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // Agent Configuration
  agents: {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_AGENTS || '10', 10),
    defaultTimeout: parseInt(process.env.AGENT_DEFAULT_TIMEOUT || '300000', 10), // 5 minutes
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};
