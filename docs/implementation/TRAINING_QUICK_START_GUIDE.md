# 🚀 Training Environment Quick Start Guide

## 📋 Overview

This guide provides step-by-step instructions for quickly setting up and testing the model training environment based on signed contracts. Follow this guide to get a basic training workflow running in your development environment.

## 🎯 Prerequisites

### **System Requirements**
- Node.js 18+ and npm
- Docker and Docker Compose
- Cloud provider account (AWS, Azure, GCP, or OCI)
- Terraform (for infrastructure provisioning)
- Git

### **Environment Setup**
```bash
# Clone the repository
git clone https://github.com/gitmujoshi/ContractManagement.git
cd ContractManagement

# Install dependencies
npm install

# Setup environment variables
cp config.env.example config.env
# Edit config.env with your cloud provider credentials
```

## 🏗️ Quick Implementation Steps

### **Step 1: Setup Training Service (5 minutes)**

Create the basic training orchestration service:

```bash
# Create training service directory
mkdir -p backend/services/training
cd backend/services/training

# Create the main training service
cat > trainingOrchestrationService.js << 'EOF'
const { ContractService } = require('../contractService');
const { TEEProvisioningService } = require('./teeProvisioningService');
const { AttestationService } = require('./attestationService');
const { TrainingMonitoringService } = require('./trainingMonitoringService');

class TrainingOrchestrationService {
  constructor() {
    this.contractService = new ContractService();
    this.teeProvisioningService = new TEEProvisioningService();
    this.attestationService = new AttestationService();
    this.monitoringService = new TrainingMonitoringService();
  }

  async executeTrainingWorkflow(contractId) {
    try {
      console.log(`🚀 Starting training workflow for contract: ${contractId}`);
      
      // 1. Validate contract
      const contract = await this.validateContract(contractId);
      
      // 2. Provision TEE environment
      const teeEnvironment = await this.provisionTEEEnvironment(contract);
      
      // 3. Setup secure data access
      await this.setupSecureDataAccess(teeEnvironment, contract);
      
      // 4. Deploy training container
      const trainingJob = await this.deployTrainingContainer(teeEnvironment, contract);
      
      // 5. Start monitoring
      await this.startTrainingMonitoring(trainingJob);
      
      console.log(`✅ Training workflow started: ${trainingJob.jobId}`);
      return trainingJob;
      
    } catch (error) {
      console.error('❌ Training workflow failed:', error);
      throw error;
    }
  }

  async validateContract(contractId) {
    const contract = await this.contractService.getContract(contractId);
    
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }
    
    if (contract.status !== 'SIGNED') {
      throw new Error(`Contract not signed: ${contract.status}`);
    }
    
    return contract;
  }

  async provisionTEEEnvironment(contract) {
    const config = contract.trainingEnvironment || {
      provider: 'azure',
      region: 'eastus',
      instanceType: 'Standard_D4s_v3',
      securityLevel: 'high'
    };
    
    return await this.teeProvisioningService.provisionEnvironment(config);
  }

  async setupSecureDataAccess(teeEnvironment, contract) {
    // Setup encrypted data access
    console.log('🔐 Setting up secure data access...');
    // Implementation details here
  }

  async deployTrainingContainer(teeEnvironment, contract) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const trainingJob = {
      jobId,
      contractId: contract.contractId,
      environmentId: teeEnvironment.id,
      status: 'PENDING',
      provider: teeEnvironment.provider,
      region: teeEnvironment.region,
      createdAt: new Date()
    };
    
    console.log('📦 Deploying training container...');
    // Container deployment logic here
    
    return trainingJob;
  }

  async startTrainingMonitoring(trainingJob) {
    console.log('📊 Starting training monitoring...');
    // Monitoring setup here
  }
}

module.exports = TrainingOrchestrationService;
EOF
```

### **Step 2: Create TEE Provisioning Service (10 minutes)**

```bash
# Create TEE provisioning service
cat > teeProvisioningService.js << 'EOF'
class TEEProvisioningService {
  async provisionEnvironment(config) {
    const environmentId = `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🏗️ Provisioning TEE environment: ${environmentId}`);
    
    // Simulate TEE provisioning
    const environment = {
      id: environmentId,
      provider: config.provider,
      region: config.region,
      status: 'PROVISIONING',
      createdAt: new Date()
    };
    
    // In a real implementation, this would:
    // 1. Call cloud provider APIs
    // 2. Deploy TEE infrastructure
    // 3. Configure security settings
    // 4. Setup network access
    
    console.log(`✅ TEE environment provisioned: ${environmentId}`);
    return environment;
  }
}

module.exports = TEEProvisioningService;
EOF
```

### **Step 3: Create Basic Training Container (15 minutes)**

```bash
# Create training container directory
mkdir -p training-containers/basic
cd training-containers/basic

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.9-slim

# Install required packages
RUN pip install --no-cache-dir \
    numpy \
    pandas \
    scikit-learn \
    torch \
    transformers \
    requests

# Create app directory
WORKDIR /app

# Copy training scripts
COPY training/ /app/training/
COPY config/ /app/config/

# Create non-root user
RUN useradd -m -u 1000 trainer && chown -R trainer:trainer /app
USER trainer

# Set entrypoint
ENTRYPOINT ["python", "training/main.py"]
EOF

# Create training directory
mkdir -p training config

# Create main training script
cat > training/main.py << 'EOF'
#!/usr/bin/env python3
import os
import json
import logging
import time
import requests

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BasicTrainingOrchestrator:
    def __init__(self):
        self.contract_id = os.getenv('CONTRACT_ID')
        self.job_id = os.getenv('JOB_ID')
        self.environment_id = os.getenv('ENVIRONMENT_ID')
        
        # Training configuration
        self.epochs = int(os.getenv('TRAINING_EPOCHS', '10'))
        self.batch_size = int(os.getenv('BATCH_SIZE', '32'))
        self.learning_rate = float(os.getenv('LEARNING_RATE', '0.001'))
        
    async def execute_training(self):
        try:
            logger.info(f"Starting training for contract: {self.contract_id}")
            
            # 1. Load contract specifications
            contract = await self.load_contract_specs()
            
            # 2. Load training data
            datasets = await self.load_training_data(contract)
            
            # 3. Load base models
            models = await self.load_base_models(contract)
            
            # 4. Execute training
            trained_model = await self.train_model(datasets, models, contract)
            
            # 5. Validate model
            validation_results = await self.validate_model(trained_model, contract)
            
            # 6. Save model
            await self.save_model(trained_model, contract)
            
            # 7. Report completion
            await self.report_completion(validation_results)
            
            logger.info("Training completed successfully")
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            await self.report_error(str(e))
            raise
    
    async def load_contract_specs(self):
        # In a real implementation, this would load from the contract management system
        logger.info("Loading contract specifications...")
        
        # Simulate contract loading
        contract = {
            'contractId': self.contract_id,
            'datasets': ['dataset_1', 'dataset_2'],
            'aiModels': ['model_1'],
            'trainingParams': {
                'epochs': self.epochs,
                'batchSize': self.batch_size,
                'learningRate': self.learning_rate
            }
        }
        
        return contract
    
    async def load_training_data(self, contract):
        logger.info("Loading training data...")
        
        # Simulate data loading
        datasets = []
        for dataset_id in contract['datasets']:
            # In a real implementation, this would:
            # 1. Download encrypted dataset
            # 2. Decrypt using TEE keys
            # 3. Load into memory
            dataset = {
                'id': dataset_id,
                'samples': 1000,  # Simulated
                'features': 10,   # Simulated
                'data': None      # Would contain actual data
            }
            datasets.append(dataset)
        
        return datasets
    
    async def load_base_models(self, contract):
        logger.info("Loading base models...")
        
        # Simulate model loading
        models = []
        for model_id in contract['aiModels']:
            # In a real implementation, this would:
            # 1. Download encrypted model
            # 2. Decrypt using TEE keys
            # 3. Load model weights
            model = {
                'id': model_id,
                'type': 'neural_network',
                'architecture': 'transformer',
                'weights': None  # Would contain actual weights
            }
            models.append(model)
        
        return models
    
    async def train_model(self, datasets, models, contract):
        logger.info("Starting model training...")
        
        # Simulate training process
        for epoch in range(contract['trainingParams']['epochs']):
            logger.info(f"Epoch {epoch + 1}/{contract['trainingParams']['epochs']}")
            
            # Simulate training step
            loss = 1.0 - (epoch * 0.1)  # Simulated loss decrease
            accuracy = epoch * 0.1      # Simulated accuracy increase
            
            logger.info(f"Loss: {loss:.4f}, Accuracy: {accuracy:.4f}")
            
            # Report progress
            await self.report_progress(epoch + 1, contract['trainingParams']['epochs'], loss, accuracy)
            
            # Simulate training time
            time.sleep(1)
        
        # Create trained model
        trained_model = {
            'id': f"trained_model_{self.job_id}",
            'type': 'neural_network',
            'architecture': 'transformer',
            'weights': 'trained_weights',  # Would contain actual weights
            'metrics': {
                'final_loss': loss,
                'final_accuracy': accuracy
            }
        }
        
        logger.info("Model training completed")
        return trained_model
    
    async def validate_model(self, model, contract):
        logger.info("Validating model...")
        
        # Simulate model validation
        validation_results = {
            'accuracy': model['metrics']['final_accuracy'],
            'loss': model['metrics']['final_loss'],
            'meets_requirements': model['metrics']['final_accuracy'] > 0.8
        }
        
        logger.info(f"Validation results: {validation_results}")
        return validation_results
    
    async def save_model(self, model, contract):
        logger.info("Saving trained model...")
        
        # In a real implementation, this would:
        # 1. Encrypt model with TEE keys
        # 2. Upload to secure storage
        # 3. Register in model registry
        
        logger.info(f"Model saved: {model['id']}")
    
    async def report_progress(self, current_epoch, total_epochs, loss, accuracy):
        progress_percentage = (current_epoch / total_epochs) * 100
        
        # In a real implementation, this would send to monitoring service
        logger.info(f"Progress: {progress_percentage:.1f}% - Epoch {current_epoch}/{total_epochs}")
    
    async def report_completion(self, validation_results):
        logger.info("Reporting training completion...")
        
        # In a real implementation, this would:
        # 1. Send completion notification
        # 2. Update contract status
        # 3. Trigger cleanup processes
    
    async def report_error(self, error_message):
        logger.error(f"Reporting training error: {error_message}")
        
        # In a real implementation, this would:
        # 1. Send error notification
        # 2. Update contract status
        # 3. Trigger cleanup processes

if __name__ == "__main__":
    import asyncio
    
    orchestrator = BasicTrainingOrchestrator()
    asyncio.run(orchestrator.execute_training())
EOF

# Create configuration file
cat > config/training.json << 'EOF'
{
  "training": {
    "default_epochs": 10,
    "default_batch_size": 32,
    "default_learning_rate": 0.001,
    "max_training_time": 3600,
    "checkpoint_interval": 5
  },
  "monitoring": {
    "progress_report_interval": 30,
    "metrics_collection_interval": 10
  },
  "security": {
    "encryption_algorithm": "AES-256-GCM",
    "key_rotation_interval": 3600
  }
}
EOF
```

### **Step 4: Create API Endpoints (10 minutes)**

```bash
# Go back to backend directory
cd ../../..

# Create training routes
cat > backend/routes/training.js << 'EOF'
const express = require('express');
const router = express.Router();
const TrainingOrchestrationService = require('../services/training/trainingOrchestrationService');

const trainingOrchestrator = new TrainingOrchestrationService();

// Execute training for a contract
router.post('/training/execute/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    console.log(`🚀 Executing training for contract: ${contractId}`);
    
    const trainingJob = await trainingOrchestrator.executeTrainingWorkflow(contractId);
    
    res.json({
      success: true,
      message: 'Training workflow started successfully',
      trainingJob: {
        jobId: trainingJob.jobId,
        status: trainingJob.status,
        environmentId: trainingJob.environmentId,
        provider: trainingJob.provider,
        region: trainingJob.region
      }
    });
    
  } catch (error) {
    console.error('Training execution failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get training status
router.get('/training/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // In a real implementation, this would query the database
    const status = {
      jobId,
      status: 'RUNNING',
      progress: 45.5,
      currentEpoch: 5,
      totalEpochs: 10,
      currentLoss: 0.234,
      validationAccuracy: 0.876
    };
    
    res.json({
      success: true,
      status
    });
    
  } catch (error) {
    console.error('Failed to get training status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get training progress
router.get('/training/progress/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // In a real implementation, this would query the database
    const progress = {
      jobId,
      progressPercentage: 45.5,
      currentEpoch: 5,
      totalEpochs: 10,
      currentLoss: 0.234,
      validationAccuracy: 0.876,
      estimatedTimeRemaining: 1800, // seconds
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      progress
    });
    
  } catch (error) {
    console.error('Failed to get training progress:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel training
router.post('/training/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`🛑 Cancelling training job: ${jobId}`);
    
    // In a real implementation, this would:
    // 1. Stop the training container
    // 2. Clean up resources
    // 3. Update database status
    
    res.json({
      success: true,
      message: 'Training job cancelled successfully'
    });
    
  } catch (error) {
    console.error('Failed to cancel training:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
EOF
```

### **Step 5: Update Server Configuration (5 minutes)**

```bash
# Update server.js to include training routes
echo "
// Training routes
const trainingRouter = require('./routes/training');
app.use('/api', trainingRouter);
" >> backend/server.js
```

### **Step 6: Test the Implementation (10 minutes)**

```bash
# Start the backend server
cd backend
npm start &

# NOTE: The endpoints below were for an older training router prototype.
# For the current TDC contract-scoped flow, see docs/training/TDC_TRAINING_RUNTIME.md.
#
# Example (current): start training for a signed contract (TDC-only)
# curl -X POST http://localhost:5001/api/tdc/training/contracts/<contractId>/start \
#   -H "Authorization: Bearer <token>" \
#   -H "Content-Type: application/json"
#
# Example (current): list jobs for a contract (TDC-only)
# curl http://localhost:5001/api/tdc/training/contracts/<contractId>/jobs \
#   -H "Authorization: Bearer <token>"
```

## 🧪 Testing the Training Workflow

### **Test 1: Basic Training Execution**

```bash
# Create a test script
cat > test-training.js << 'EOF'
const axios = require('axios');

async function testTrainingWorkflow() {
  try {
    console.log('🧪 Testing training workflow...');
    
    console.log('See docs/training/TDC_TRAINING_RUNTIME.md for current API examples.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTrainingWorkflow();
EOF

# Run the test
node test-training.js
```

### **Test 2: Docker Container Training**

```bash
# Build the training container
cd training-containers/basic
docker build -t training-container:latest .

# Test the container locally
docker run --rm \
  -e CONTRACT_ID=CONTRACT-2025-001 \
  -e JOB_ID=job_1234567890_abc123 \
  -e ENVIRONMENT_ID=env_1234567890_xyz789 \
  -e TRAINING_EPOCHS=5 \
  -e BATCH_SIZE=16 \
  -e LEARNING_RATE=0.01 \
  training-container:latest
```

## 📊 Monitoring and Debugging

### **View Training Logs**

```bash
# View backend logs
tail -f logs/backend.log

# View training container logs
docker logs -f <container_id>
```

### **Check Training Status**

```bash
# Current status endpoints are role-specific.
# - TDC:   /api/tdc/training/contracts/<contractId>/jobs
# - CCRP:  /api/ccrp/training/jobs/<userId> (plus start/stop/delete/logs per job)
#
# See docs/training/TDC_TRAINING_RUNTIME.md for full examples.
```

## 🚀 Next Steps

### **Immediate Next Steps**
1. **Integrate with Real Cloud Providers**: Replace mock services with actual cloud provider APIs
2. **Add Database Persistence**: Store training jobs and progress in the database
3. **Implement Real TEE Integration**: Add actual TEE provisioning and attestation
4. **Add Security Features**: Implement proper encryption and key management

### **Advanced Features**
1. **Multi-Cloud Support**: Add support for AWS, GCP, and OCI
2. **Federated Learning**: Implement federated learning capabilities
3. **AutoML Integration**: Add automated model selection and hyperparameter tuning
4. **Real-time Monitoring**: Implement WebSocket-based real-time progress updates

## 🔧 Troubleshooting

### **Common Issues**

#### **Issue: Training API not responding**
```bash
# Check if backend is running
ps aux | grep node

# Check backend logs
tail -f logs/backend.log

# Restart backend
pkill -f "node.*server.js"
npm start
```

#### **Issue: Container not starting**
```bash
# Check Docker is running
docker ps

# Check container logs
docker logs <container_id>

# Rebuild container
docker build --no-cache -t training-container:latest .
```

#### **Issue: Database connection errors**
```bash
# Check database connection
node -e "require('./backend/config/database').testConnection()"

# Check database logs
tail -f logs/database.log
```

## 📚 Additional Resources

- **Full Implementation Plan**: `docs/implementation/MODEL_TRAINING_IMPLEMENTATION_PLAN.md`
- **TEE Integration Guide**: `docs/architecture/KMS_TRAINING_ENVIRONMENT_ARCHITECTURE.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **Security Guide**: `docs/SECURITY_GUIDE.md`

This quick start guide provides a foundation for implementing the model training environment. For production deployment, refer to the full implementation plan for comprehensive security, monitoring, and compliance features.
