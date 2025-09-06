const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check main app health
    const mainAppHealth = await checkServiceHealth('http://localhost:5001/health');
    
    // Check SCITT CCF health
    const scittCcfHealth = await checkServiceHealth('http://localhost:9000/health');
    
    const responseTime = Date.now() - startTime;
    
    const overallStatus = mainAppHealth.status === 'healthy' && scittCcfHealth.status === 'healthy' 
      ? 'healthy' 
      : 'degraded';
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      services: {
        main_app: mainAppHealth,
        scitt_ccf: scittCcfHealth,
        api_gateway: {
          status: 'healthy',
          response_time: responseTime
        }
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Aggregated health check
app.get('/health/aggregated', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check all services
    const [mainAppHealth, scittCcfHealth] = await Promise.allSettled([
      checkServiceHealth('http://localhost:5001/health'),
      checkServiceHealth('http://localhost:9000/health')
    ]);
    
    const responseTime = Date.now() - startTime;
    
    const services = {
      main_app: mainAppHealth.status === 'fulfilled' ? mainAppHealth.value : { status: 'unhealthy', error: mainAppHealth.reason?.message },
      scitt_ccf: scittCcfHealth.status === 'fulfilled' ? scittCcfHealth.value : { status: 'unhealthy', error: scittCcfHealth.reason?.message }
    };
    
    const overallStatus = Object.values(services).every(s => s.status === 'healthy') 
      ? 'healthy' 
      : 'degraded';
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      services
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Service health check helper
async function checkServiceHealth(url) {
  try {
    const startTime = Date.now();
    const response = await axios.get(url, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.data.status || 'healthy',
      response_time: responseTime,
      ...response.data
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: null,
      error: error.message
    };
  }
}

// Route main app requests
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
  onError: (err, req, res) => {
    console.error('Main app proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: {
        code: 'MAIN_APP_UNAVAILABLE',
        message: 'Main application service is currently unavailable',
        details: err.message,
        timestamp: new Date().toISOString()
      }
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> Main App`);
  }
}));

// Route SCITT CCF requests
app.use('/api/scitt', createProxyMiddleware({
  target: 'http://localhost:9000',
  changeOrigin: true,
  pathRewrite: { '^/api/scitt': '/api' },
  onError: (err, req, res) => {
    console.error('SCITT CCF proxy error:', err.message);
    res.status(503).json({
      success: false,
      error: {
        code: 'SCITT_CCF_UNAVAILABLE',
        message: 'SCITT CCF service is currently unavailable',
        details: err.message,
        timestamp: new Date().toISOString()
      }
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> SCITT CCF`);
  }
}));

// Route SCITT CCF dashboard
app.use('/scitt-dashboard', createProxyMiddleware({
  target: 'http://localhost:9001',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('SCITT CCF dashboard proxy error:', err.message);
    res.status(503).send('SCITT CCF Dashboard is currently unavailable');
  }
}));

// Route SCITT CCF monitoring
app.use('/scitt-monitor', createProxyMiddleware({
  target: 'http://localhost:9002',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('SCITT CCF monitor proxy error:', err.message);
    res.status(503).send('SCITT CCF Monitoring is currently unavailable');
  }
}));

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Contract Management System API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      main_app: 'http://localhost:5001',
      scitt_ccf: 'http://localhost:9000',
      scitt_dashboard: 'http://localhost:9001',
      scitt_monitor: 'http://localhost:9002'
    },
    endpoints: {
      health: '/health',
      aggregated_health: '/health/aggregated',
      main_app_api: '/api/*',
      scitt_ccf_api: '/api/scitt/*',
      scitt_dashboard: '/scitt-dashboard',
      scitt_monitor: '/scitt-monitor'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'GATEWAY_ERROR',
      message: 'Internal gateway error',
      details: err.message,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Aggregated health: http://localhost:${PORT}/health/aggregated`);
  console.log(`🌐 Main app API: http://localhost:${PORT}/api/*`);
  console.log(`🔐 SCITT CCF API: http://localhost:${PORT}/api/scitt/*`);
  console.log(`📈 SCITT Dashboard: http://localhost:${PORT}/scitt-dashboard`);
  console.log(`📊 SCITT Monitor: http://localhost:${PORT}/scitt-monitor`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
