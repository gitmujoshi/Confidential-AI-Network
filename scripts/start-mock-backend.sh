#!/bin/bash

# Mock Backend for Testing
# This script starts a simple mock backend for testing purposes

set -e

# Load centralized configuration
if [ -f "config.env" ]; then
    source config.env
fi

echo "🚀 Starting Mock Backend for Testing..."

# Kill any existing mock backend
pkill -f "mock-backend" || true
sleep 2

# Start mock backend from backend directory
cd backend
node -e "
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      scittCcf: 'healthy',
      blockchain: 'disabled'
    }
  });
});

// Basic auth endpoint
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    accessToken: 'mock-jwt-token',
    user: {
      id: 1,
      email: req.body.email,
      role: 'TDP'
    }
  });
});

// Basic users endpoint
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, email: 'tdp.medical@example.com', role: 'TDP' },
    { id: 2, email: 'tdc.healthcare@example.com', role: 'TDC' },
    { id: 3, email: 'ccrp.securecloud@example.com', role: 'CCRP' }
  ]);
});

// Basic datasets endpoint
app.get('/api/datasets', (req, res) => {
  res.json([
    { id: 1, name: 'Medical Dataset 1', category: 'Healthcare', price: 1000 },
    { id: 2, name: 'Financial Dataset 1', category: 'Finance', price: 1500 }
  ]);
});

// Basic AI models endpoint
app.get('/api/ai-models', (req, res) => {
  res.json([
    { id: 1, name: 'Medical AI Model', type: 'Classification', framework: 'TensorFlow' },
    { id: 2, name: 'Financial AI Model', type: 'Regression', framework: 'PyTorch' }
  ]);
});

const PORT = ${BACKEND_PORT:-5001};
app.listen(PORT, () => {
  console.log(\`✅ Mock Backend server running on port \${PORT}\`);
  console.log('✅ Health endpoint: http://localhost:' + PORT + '/health');
  console.log('✅ Auth endpoint: http://localhost:' + PORT + '/api/auth/login');
  console.log('✅ Users endpoint: http://localhost:' + PORT + '/api/users');
  console.log('✅ Datasets endpoint: http://localhost:' + PORT + '/api/datasets');
  console.log('✅ AI Models endpoint: http://localhost:' + PORT + '/api/ai-models');
});
" &

MOCK_PID=$!
echo "Mock Backend started with PID: $MOCK_PID"
echo $MOCK_PID > ../mock-backend.pid
cd ..

# Wait for backend to be ready
echo "Waiting for mock backend to be ready..."
sleep 3

if curl -s "http://localhost:${BACKEND_PORT:-5001}/health" > /dev/null 2>&1; then
    echo "✅ Mock Backend is ready!"
else
    echo "❌ Mock Backend failed to start"
    exit 1
fi
