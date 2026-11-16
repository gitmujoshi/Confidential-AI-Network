const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');
const v1Router = require('./routes/v1');
const { CAN_BASE } = require('./lib/canClient');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;
const SCITT_BASE = process.env.SCITT_CCF_URL || 'http://localhost:9000';

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use(limiter);

const V1_ROUTES = [
  '/v1/providers',
  '/v1/catalog',
  '/v1/scenarios',
  '/v1/contracts',
  '/v1/ccr',
  '/v1/aichain',
];

async function checkServiceHealth(url) {
  try {
    const startTime = Date.now();
    const response = await axios.get(url, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    return {
      status: response.data.status || 'healthy',
      response_time: responseTime,
      ...response.data,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: null,
      error: error.message,
    };
  }
}

app.get('/health', async (_req, res) => {
  try {
    const startTime = Date.now();
    const mainAppHealth = await checkServiceHealth(`${CAN_BASE}/health`);
    const scittCcfHealth = await checkServiceHealth(`${SCITT_BASE}/health`);
    const responseTime = Date.now() - startTime;
    const overallStatus =
      mainAppHealth.status === 'healthy' && scittCcfHealth.status === 'healthy'
        ? 'healthy'
        : 'degraded';

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      facade: 'depa-prd-v1-over-can',
      routes: V1_ROUTES,
      services: {
        main_app: mainAppHealth,
        scitt_ccf: scittCcfHealth,
        api_gateway: {
          status: 'healthy',
          response_time: responseTime,
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.get('/health/aggregated', async (_req, res) => {
  try {
    const startTime = Date.now();
    const [mainAppHealth, scittCcfHealth] = await Promise.allSettled([
      checkServiceHealth(`${CAN_BASE}/health`),
      checkServiceHealth(`${SCITT_BASE}/health`),
    ]);
    const responseTime = Date.now() - startTime;
    const services = {
      main_app:
        mainAppHealth.status === 'fulfilled'
          ? mainAppHealth.value
          : { status: 'unhealthy', error: mainAppHealth.reason?.message },
      scitt_ccf:
        scittCcfHealth.status === 'fulfilled'
          ? scittCcfHealth.value
          : { status: 'unhealthy', error: scittCcfHealth.reason?.message },
    };
    const overallStatus = Object.values(services).every((s) => s.status === 'healthy')
      ? 'healthy'
      : 'degraded';
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      routes: V1_ROUTES,
      services,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// JSON body only for façade routes so /api proxy still receives the raw body.
app.use('/v1', express.json({ limit: '2mb' }), v1Router);

app.use(
  '/api/scitt',
  createProxyMiddleware({
    target: SCITT_BASE,
    changeOrigin: true,
    pathRewrite: { '^/api/scitt': '/api' },
    onError: (err, _req, res) => {
      console.error('SCITT CCF proxy error:', err.message);
      res.status(503).json({
        success: false,
        error: {
          code: 'SCITT_CCF_UNAVAILABLE',
          message: 'SCITT CCF service is currently unavailable',
          details: err.message,
          timestamp: new Date().toISOString(),
        },
      });
    },
    onProxyReq: (_proxyReq, req) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> SCITT CCF`);
    },
  })
);

app.use(
  '/api',
  createProxyMiddleware({
    target: CAN_BASE,
    changeOrigin: true,
    pathRewrite: { '^/api': '/api' },
    onError: (err, _req, res) => {
      console.error('Main app proxy error:', err.message);
      res.status(503).json({
        success: false,
        error: {
          code: 'MAIN_APP_UNAVAILABLE',
          message: 'Main application service is currently unavailable',
          details: err.message,
          timestamp: new Date().toISOString(),
        },
      });
    },
    onProxyReq: (_proxyReq, req) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> CAN`);
    },
  })
);

app.use(
  '/scitt-dashboard',
  createProxyMiddleware({
    target: process.env.SCITT_DASHBOARD_URL || 'http://localhost:9001',
    changeOrigin: true,
    onError: (err, _req, res) => {
      console.error('SCITT CCF dashboard proxy error:', err.message);
      res.status(503).send('SCITT CCF Dashboard is currently unavailable');
    },
  })
);

app.use(
  '/scitt-monitor',
  createProxyMiddleware({
    target: process.env.SCITT_MONITOR_URL || 'http://localhost:9002',
    changeOrigin: true,
    onError: (err, _req, res) => {
      console.error('SCITT CCF monitor proxy error:', err.message);
      res.status(503).send('SCITT CCF Monitoring is currently unavailable');
    },
  })
);

app.get('/', (_req, res) => {
  res.json({
    message: 'CAN API Gateway — DEPA PRD /v1 façade over existing CAN /api',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    facade: 'depa-prd-v1-over-can',
    services: {
      can_backend: CAN_BASE,
      scitt_ccf: SCITT_BASE,
    },
    endpoints: {
      health: '/health',
      v1: '/v1',
      can_api: '/api/*',
      scitt_ccf_api: '/api/scitt/*',
    },
    routes: V1_ROUTES,
  });
});

app.use((err, _req, res, _next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'GATEWAY_ERROR',
      message: 'Internal gateway error',
      details: err.message,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API Gateway on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`DEPA /v1 façade: http://localhost:${PORT}/v1`);
    console.log(`CAN /api proxy: http://localhost:${PORT}/api/* -> ${CAN_BASE}`);
  });
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
