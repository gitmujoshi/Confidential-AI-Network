#!/usr/bin/env node
/**
 * Single-origin gateway for publishing the local stack:
 *   /api, /health, /uploads → backend :5001
 *   everything else       → frontend :3000
 *
 * Usage: node scripts/public/local-gateway.js
 */
const http = require('http');
const { URL } = require('url');

const GATEWAY_PORT = Number(process.env.GATEWAY_PORT || 8080);
const FRONTEND = process.env.FRONTEND_TARGET || 'http://127.0.0.1:3000';
const BACKEND = process.env.BACKEND_TARGET || 'http://127.0.0.1:5001';

function isBackend(urlPath) {
  return (
    urlPath.startsWith('/api') ||
    urlPath.startsWith('/health') ||
    urlPath.startsWith('/uploads') ||
    urlPath.startsWith('/socket.io')
  );
}

function proxyRequest(req, res, targetBase) {
  const target = new URL(req.url || '/', targetBase);
  const headers = { ...req.headers, host: target.host };
  // Avoid compressing mismatches through the tunnel
  delete headers['accept-encoding'];

  const proxyReq = http.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('[gateway]', req.method, req.url, '→', targetBase, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    res.end(`Bad gateway: ${err.message}`);
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const target = isBackend(urlPath) ? BACKEND : FRONTEND;
  proxyRequest(req, res, target);
});

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log(
    `[gateway] http://127.0.0.1:${GATEWAY_PORT} → FE ${FRONTEND} | BE ${BACKEND}`
  );
});
