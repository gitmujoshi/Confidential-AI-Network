#!/bin/bash

# Setup Local Training Environment
# This script sets up the local development environment for model training

set -e

echo "🏠 Setting up local training environment..."

# Create local TEE directory structure
echo "📁 Creating directory structure..."
mkdir -p local-tee/{environments,containers,attestations,logs,data,outputs,provenance}

# Set permissions
chmod 755 local-tee
chmod 755 local-tee/*

# Create Docker Compose file for local development
echo "🐳 Creating Docker Compose configuration..."
cat > local-tee/docker-compose.yml << 'EOF'
version: '3.8'

services:
  local-tee:
    image: local-tee:latest
    container_name: local-tee
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
      - ./outputs:/outputs
      - ./logs:/logs
    environment:
      - TEE_MODE=local
      - ATTESTATION_ENABLED=true
    networks:
      - tee-network

  training-container:
    image: training-container:local
    container_name: training-container
    depends_on:
      - local-tee
    volumes:
      - ./data:/data:ro
      - ./outputs:/outputs
    environment:
      - TEE_ENVIRONMENT=local
      - PROVENANCE_ENABLED=true
    networks:
      - tee-network

networks:
  tee-network:
    driver: bridge
EOF

# Create local training container Dockerfile
echo "📦 Creating training container Dockerfile..."
mkdir -p local-tee/containers/base
cat > local-tee/containers/base/Dockerfile << 'EOF'
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    numpy==1.24.3 \
    pandas==2.0.3 \
    scikit-learn==1.3.0 \
    torch==2.0.1 \
    tensorflow==2.13.0 \
    matplotlib==3.7.2 \
    seaborn==0.12.2 \
    jupyter==1.0.0

# Create output directory
RUN mkdir -p /outputs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TEE_MODE=local

# Default command
CMD ["python", "--version"]
EOF

# Create sample training data
echo "📊 Creating sample training data..."
mkdir -p local-tee/data/samples
cat > local-tee/data/samples/sample_data.csv << 'EOF'
feature1,feature2,feature3,label
1.0,2.0,3.0,0
2.0,3.0,4.0,1
3.0,4.0,5.0,0
4.0,5.0,6.0,1
5.0,6.0,7.0,0
EOF

# Create local development configuration
echo "⚙️ Creating local development configuration..."
cat > local-tee/config.json << 'EOF'
{
  "environment": "local",
  "providers": {
    "local": {
      "enabled": true,
      "basePath": "./local-tee",
      "containerImage": "training-container:local",
      "resources": {
        "cpu": 2,
        "memory": "4GB",
        "storage": "50GB"
      }
    }
  },
  "training": {
    "defaultEpochs": 10,
    "defaultBatchSize": 32,
    "defaultLearningRate": 0.001,
    "monitoringInterval": 30000
  },
  "provenance": {
    "enabled": true,
    "storagePath": "./local-tee/provenance"
  },
  "security": {
    "attestationEnabled": true,
    "encryptionEnabled": true,
    "accessControlEnabled": true
  }
}
EOF

# Create test script
echo "🧪 Creating test script..."
cat > local-tee/test-training.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing local training environment..."

# Test directory structure
echo "📁 Testing directory structure..."
if [ -d "environments" ] && [ -d "containers" ] && [ -d "data" ]; then
    echo "✅ Directory structure is correct"
else
    echo "❌ Directory structure is missing"
    exit 1
fi

# Test configuration
echo "⚙️ Testing configuration..."
if [ -f "config.json" ]; then
    echo "✅ Configuration file exists"
    python3 -m json.tool config.json > /dev/null && echo "✅ Configuration is valid JSON"
else
    echo "❌ Configuration file missing"
    exit 1
fi

# Test sample data
echo "📊 Testing sample data..."
if [ -f "data/samples/sample_data.csv" ]; then
    echo "✅ Sample data exists"
    wc -l data/samples/sample_data.csv
else
    echo "❌ Sample data missing"
    exit 1
fi

echo "✅ Local training environment test completed successfully!"
EOF

chmod +x local-tee/test-training.sh

# Create development helper script
echo "🛠️ Creating development helper script..."
cat > scripts/dev-training.sh << 'EOF'
#!/bin/bash

# Development helper for local training environment

case "$1" in
    "start")
        echo "🚀 Starting local training environment..."
        cd local-tee
        docker-compose up -d
        ;;
    "stop")
        echo "🛑 Stopping local training environment..."
        cd local-tee
        docker-compose down
        ;;
    "test")
        echo "🧪 Testing local training environment..."
        cd local-tee
        ./test-training.sh
        ;;
    "clean")
        echo "🧹 Cleaning local training environment..."
        cd local-tee
        docker-compose down -v
        rm -rf environments/* containers/* outputs/* logs/*
        ;;
    "logs")
        echo "📄 Showing training logs..."
        cd local-tee
        docker-compose logs -f
        ;;
    *)
        echo "Usage: $0 {start|stop|test|clean|logs}"
        echo "  start  - Start local training environment"
        echo "  stop   - Stop local training environment"
        echo "  test   - Test local training environment"
        echo "  clean  - Clean up local training environment"
        echo "  logs   - Show training logs"
        exit 1
        ;;
esac
EOF

chmod +x scripts/dev-training.sh

echo "✅ Local training environment setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run './scripts/dev-training.sh start' to start the local environment"
echo "2. Run './scripts/dev-training.sh test' to test the setup"
echo "3. Use the training API endpoints to create and manage training jobs"
echo ""
echo "🔧 Configuration files created:"
echo "  - local-tee/docker-compose.yml"
echo "  - local-tee/config.json"
echo "  - local-tee/containers/base/Dockerfile"
echo "  - config.local.env"
echo ""
echo "📁 Directory structure:"
echo "  - local-tee/environments/     # TEE environments"
echo "  - local-tee/containers/       # Training containers"
echo "  - local-tee/data/            # Training data"
echo "  - local-tee/outputs/         # Training outputs"
echo "  - local-tee/logs/            # Training logs"
echo "  - local-tee/provenance/      # Provenance data"
