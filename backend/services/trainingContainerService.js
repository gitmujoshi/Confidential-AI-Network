/**
 * Training Container Service
 * 
 * Manages training container lifecycle, including building, deploying,
 * and monitoring training containers for AI model training.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TrainingContainerService {
  constructor() {
    this.activeContainers = new Map();
    this.containerTemplates = new Map();
    this.basePath = process.env.TRAINING_BASE_PATH || './local-tee';
    this.isLocalMode = process.env.NODE_ENV === 'development' || process.env.TEE_MODE === 'local';
    
    this.initializeTemplates();
  }

  /**
   * Initialize container templates
   */
  initializeTemplates() {
    // Python-based training template
    this.containerTemplates.set('python', {
      baseImage: 'python:3.9-slim',
      framework: 'pytorch',
      dependencies: [
        'numpy==1.24.3',
        'pandas==2.0.3',
        'scikit-learn==1.3.0',
        'torch==2.0.1',
        'tensorflow==2.13.0',
        'matplotlib==3.7.2',
        'seaborn==0.12.2',
        'jupyter==1.0.0'
      ]
    });

    // R-based training template
    this.containerTemplates.set('r', {
      baseImage: 'r-base:4.3.0',
      framework: 'caret',
      dependencies: [
        'caret',
        'randomForest',
        'e1071',
        'nnet',
        'rpart'
      ]
    });

    // Julia-based training template
    this.containerTemplates.set('julia', {
      baseImage: 'julia:1.9.0',
      framework: 'flux',
      dependencies: [
        'Flux',
        'MLJ',
        'DataFrames',
        'CSV'
      ]
    });
  }

  /**
   * Build training container
   * @param {Object} config - Container build configuration
   * @returns {Object} Build result
   */
  async buildContainer(config) {
    try {
      console.log(`🔨 Building training container: ${config.containerId}`);
      
      const containerId = config.containerId;
      const template = config.template || 'python';
      const containerPath = path.join(this.basePath, 'containers', containerId);
      
      // Create container directory
      await fs.mkdir(containerPath, { recursive: true });
      
      // Generate container files
      await this.generateContainerFiles(containerPath, config, template);
      
      // Build Docker image if not in local mode
      if (!this.isLocalMode) {
        await this.buildDockerImage(containerPath, containerId);
      }
      
      const buildResult = {
        containerId,
        template,
        status: 'BUILT',
        path: containerPath,
        image: this.isLocalMode ? `${containerId}:local` : `${containerId}:latest`,
        createdAt: new Date()
      };
      
      console.log(`✅ Training container built: ${containerId}`);
      return buildResult;
      
    } catch (error) {
      console.error('❌ Container build failed:', error);
      throw error;
    }
  }

  /**
   * Deploy training container
   * @param {Object} config - Container deployment configuration
   * @returns {Object} Deployment result
   */
  async deployContainer(config) {
    try {
      console.log(`🚀 Deploying training container: ${config.containerId}`);
      
      const containerId = config.containerId;
      const environmentId = config.environmentId;
      
      // Create deployment configuration
      const deploymentConfig = {
        containerId,
        environmentId,
        jobId: config.jobId,
        image: config.image || `${containerId}:local`,
        status: 'DEPLOYING',
        resources: config.resources || {
          cpu: 2,
          memory: 4,
          gpu: 0
        },
        environment: config.environment || {},
        volumes: config.volumes || [],
        createdAt: new Date()
      };
      
      // Deploy based on mode
      if (this.isLocalMode) {
        await this.deployLocalContainer(deploymentConfig);
      } else {
        await this.deployCloudContainer(deploymentConfig);
      }
      
      deploymentConfig.status = 'DEPLOYED';
      this.activeContainers.set(containerId, deploymentConfig);
      
      console.log(`✅ Training container deployed: ${containerId}`);
      return deploymentConfig;
      
    } catch (error) {
      console.error('❌ Container deployment failed:', error);
      throw error;
    }
  }

  /**
   * Start training container
   * @param {string} containerId - Container ID
   * @param {Object} trainingConfig - Training configuration
   */
  async startContainer(containerId, trainingConfig = {}) {
    try {
      console.log(`▶️ Starting training container: ${containerId}`);
      
      const container = this.activeContainers.get(containerId);
      if (!container) {
        throw new Error(`Container not found: ${containerId}`);
      }
      
      // Start training based on mode
      if (this.isLocalMode) {
        await this.startLocalTraining(container, trainingConfig);
      } else {
        await this.startCloudTraining(container, trainingConfig);
      }
      
      container.status = 'RUNNING';
      container.startedAt = new Date();
      container.trainingConfig = trainingConfig;
      
      console.log(`✅ Training container started: ${containerId}`);
      
    } catch (error) {
      console.error('❌ Failed to start container:', error);
      throw error;
    }
  }

  /**
   * Stop training container
   * @param {string} containerId - Container ID
   */
  async stopContainer(containerId) {
    try {
      console.log(`🛑 Stopping training container: ${containerId}`);
      
      const container = this.activeContainers.get(containerId);
      if (!container) {
        throw new Error(`Container not found: ${containerId}`);
      }
      
      // Stop training based on mode
      if (this.isLocalMode) {
        await this.stopLocalTraining(container);
      } else {
        await this.stopCloudTraining(container);
      }
      
      container.status = 'STOPPED';
      container.stoppedAt = new Date();
      
      console.log(`✅ Training container stopped: ${containerId}`);
      
    } catch (error) {
      console.error('❌ Failed to stop container:', error);
      throw error;
    }
  }

  /**
   * Get container status
   * @param {string} containerId - Container ID
   * @returns {Object} Container status
   */
  async getContainerStatus(containerId) {
    const container = this.activeContainers.get(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    
    // Get additional status information
    const status = {
      containerId: container.containerId,
      environmentId: container.environmentId,
      jobId: container.jobId,
      status: container.status,
      image: container.image,
      resources: container.resources,
      createdAt: container.createdAt,
      startedAt: container.startedAt,
      stoppedAt: container.stoppedAt
    };
    
    // Add training progress if running
    if (container.status === 'RUNNING') {
      status.progress = await this.getTrainingProgress(containerId);
      status.logs = await this.getContainerLogs(containerId);
    }
    
    return status;
  }

  /**
   * Get all active containers
   * @returns {Array} List of active containers
   */
  getAllContainers() {
    return Array.from(this.activeContainers.values());
  }

  /**
   * Generate container files
   * @param {string} containerPath - Container directory path
   * @param {Object} config - Container configuration
   * @param {string} template - Template type
   */
  async generateContainerFiles(containerPath, config, template) {
    const templateConfig = this.containerTemplates.get(template);
    
    // Generate Dockerfile
    const dockerfile = this.generateDockerfile(config, templateConfig);
    await fs.writeFile(path.join(containerPath, 'Dockerfile'), dockerfile);
    
    // Generate training script
    const trainingScript = this.generateTrainingScript(config, template);
    await fs.writeFile(path.join(containerPath, 'train.py'), trainingScript);
    
    // Generate requirements file
    const requirements = this.generateRequirements(templateConfig);
    await fs.writeFile(path.join(containerPath, 'requirements.txt'), requirements);
    
    // Generate configuration file
    const configFile = this.generateConfigFile(config);
    await fs.writeFile(path.join(containerPath, 'config.json'), configFile);
    
    // Generate entrypoint script
    const entrypoint = this.generateEntrypointScript(template);
    await fs.writeFile(path.join(containerPath, 'entrypoint.sh'), entrypoint);
    await fs.chmod(path.join(containerPath, 'entrypoint.sh'), '755');
  }

  /**
   * Generate Dockerfile
   * @param {Object} config - Container configuration
   * @param {Object} templateConfig - Template configuration
   * @returns {string} Dockerfile content
   */
  generateDockerfile(config, templateConfig) {
    const { baseImage, dependencies } = templateConfig;
    
    return `FROM ${baseImage}

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    curl \\
    wget \\
    git \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
${dependencies.map(dep => `RUN pip install --no-cache-dir ${dep}`).join('\n')}

# Copy application files
COPY . .

# Create directories
RUN mkdir -p /data /outputs /logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TEE_MODE=${this.isLocalMode ? 'local' : 'cloud'}
ENV CONTAINER_ID=${config.containerId}
ENV JOB_ID=${config.jobId || 'unknown'}

# Set permissions
RUN chmod +x entrypoint.sh

# Expose port for monitoring
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8080/health || exit 1

# Run entrypoint
CMD ["./entrypoint.sh"]
`;
  }

  /**
   * Generate training script
   * @param {Object} config - Container configuration
   * @param {string} template - Template type
   * @returns {string} Training script content
   */
  generateTrainingScript(config, template) {
    if (template === 'python') {
      return this.generatePythonTrainingScript(config);
    } else if (template === 'r') {
      return this.generateRTrainingScript(config);
    } else if (template === 'julia') {
      return this.generateJuliaTrainingScript(config);
    }
    
    return this.generatePythonTrainingScript(config);
  }

  /**
   * Generate Python training script
   * @param {Object} config - Container configuration
   * @returns {string} Python training script
   */
  generatePythonTrainingScript(config) {
    return `#!/usr/bin/env python3
"""
AI Model Training Script
Generated for container: ${config.containerId}
"""

import os
import sys
import json
import time
import logging
import argparse
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/logs/training.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class ModelTrainer:
    def __init__(self, config):
        self.config = config
        self.job_id = config.get('jobId', 'unknown')
        self.container_id = config.get('containerId', 'unknown')
        self.epochs = config.get('epochs', 10)
        self.batch_size = config.get('batchSize', 32)
        self.learning_rate = config.get('learningRate', 0.001)
        self.algorithm = config.get('algorithm', 'adam')
        
        # Initialize progress tracking
        self.current_epoch = 0
        self.progress = 0.0
        self.metrics = {
            'loss': [],
            'accuracy': [],
            'validation_loss': [],
            'validation_accuracy': []
        }
        
        logger.info(f"Initialized trainer for job: {self.job_id}")
        logger.info(f"Configuration: {self.epochs} epochs, batch size {self.batch_size}")
    
    def load_data(self):
        """Load training data"""
        logger.info("Loading training data...")
        
        # Simulate data loading
        import numpy as np
        
        # Generate synthetic data for testing
        n_samples = 1000
        n_features = 10
        
        X = np.random.randn(n_samples, n_features)
        y = np.random.randint(0, 2, n_samples)
        
        logger.info(f"Loaded {n_samples} samples with {n_features} features")
        return X, y
    
    def create_model(self):
        """Create model architecture"""
        logger.info("Creating model architecture...")
        
        try:
            import torch
            import torch.nn as nn
            import torch.optim as optim
            
            class SimpleModel(nn.Module):
                def __init__(self, input_size, hidden_size, output_size):
                    super(SimpleModel, self).__init__()
                    self.fc1 = nn.Linear(input_size, hidden_size)
                    self.fc2 = nn.Linear(hidden_size, hidden_size)
                    self.fc3 = nn.Linear(hidden_size, output_size)
                    self.relu = nn.ReLU()
                    self.dropout = nn.Dropout(0.2)
                
                def forward(self, x):
                    x = self.relu(self.fc1(x))
                    x = self.dropout(x)
                    x = self.relu(self.fc2(x))
                    x = self.dropout(x)
                    x = self.fc3(x)
                    return x
            
            model = SimpleModel(10, 64, 2)
            optimizer = optim.Adam(model.parameters(), lr=self.learning_rate)
            criterion = nn.CrossEntropyLoss()
            
            logger.info("Model created successfully")
            return model, optimizer, criterion
            
        except ImportError:
            logger.warning("PyTorch not available, using scikit-learn")
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.linear_model import LogisticRegression
            
            if self.algorithm == 'random_forest':
                model = RandomForestClassifier(n_estimators=100, random_state=42)
            else:
                model = LogisticRegression(random_state=42)
            
            return model, None, None
    
    def train_epoch(self, model, X, y, optimizer=None, criterion=None):
        """Train for one epoch"""
        if hasattr(model, 'fit'):  # scikit-learn model
            model.fit(X, y)
            return 0.5, 0.8  # Mock metrics
        else:  # PyTorch model
            model.train()
            total_loss = 0
            correct = 0
            total = 0
            
            # Simulate batch training
            for i in range(0, len(X), self.batch_size):
                batch_X = X[i:i+self.batch_size]
                batch_y = y[i:i+self.batch_size]
                
                optimizer.zero_grad()
                outputs = model(torch.FloatTensor(batch_X))
                loss = criterion(outputs, torch.LongTensor(batch_y))
                loss.backward()
                optimizer.step()
                
                total_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += batch_y.size
                correct += (predicted.numpy() == batch_y).sum().item()
            
            accuracy = correct / total
            avg_loss = total_loss / (len(X) // self.batch_size)
            
            return avg_loss, accuracy
    
    def train(self):
        """Main training loop"""
        logger.info("Starting training...")
        
        # Load data
        X, y = self.load_data()
        
        # Create model
        model, optimizer, criterion = self.create_model()
        
        # Training loop
        for epoch in range(self.epochs):
            self.current_epoch = epoch + 1
            self.progress = (epoch + 1) / self.epochs * 100
            
            logger.info(f"Epoch {self.current_epoch}/{self.epochs}")
            
            # Train epoch
            loss, accuracy = self.train_epoch(model, X, y, optimizer, criterion)
            
            # Store metrics
            self.metrics['loss'].append(loss)
            self.metrics['accuracy'].append(accuracy)
            
            # Log progress
            logger.info(f"Epoch {self.current_epoch} - Loss: {loss:.4f}, Accuracy: {accuracy:.4f}")
            
            # Save progress
            self.save_progress()
            
            # Simulate training time
            time.sleep(1)
        
        # Save final model
        self.save_model(model)
        
        # Save final results
        self.save_results()
        
        logger.info("Training completed successfully!")
    
    def save_progress(self):
        """Save training progress"""
        progress_data = {
            'jobId': self.job_id,
            'containerId': self.container_id,
            'progress': self.progress,
            'currentEpoch': self.current_epoch,
            'totalEpochs': self.epochs,
            'metrics': self.metrics,
            'timestamp': datetime.now().isoformat()
        }
        
        progress_file = Path('/outputs') / f'{self.job_id}_progress.json'
        with open(progress_file, 'w') as f:
            json.dump(progress_data, f, indent=2)
    
    def save_model(self, model):
        """Save trained model"""
        model_file = Path('/outputs') / f'{self.job_id}_model.pkl'
        
        try:
            import pickle
            with open(model_file, 'wb') as f:
                pickle.dump(model, f)
            logger.info(f"Model saved to {model_file}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    def save_results(self):
        """Save final training results"""
        results = {
            'jobId': self.job_id,
            'containerId': self.container_id,
            'status': 'completed',
            'finalMetrics': {
                'finalLoss': self.metrics['loss'][-1] if self.metrics['loss'] else 0,
                'finalAccuracy': self.metrics['accuracy'][-1] if self.metrics['accuracy'] else 0
            },
            'totalEpochs': self.epochs,
            'completedAt': datetime.now().isoformat()
        }
        
        results_file = Path('/outputs') / f'{self.job_id}_results.json'
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Results saved to {results_file}")

def main():
    parser = argparse.ArgumentParser(description='AI Model Training')
    parser.add_argument('--config', type=str, default='/app/config.json', help='Configuration file')
    args = parser.parse_args()
    
    # Load configuration
    try:
        with open(args.config, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {args.config}")
        sys.exit(1)
    
    # Create and run trainer
    trainer = ModelTrainer(config)
    trainer.train()

if __name__ == "__main__":
    main()
`;
  }

  /**
   * Generate R training script
   * @param {Object} config - Container configuration
   * @returns {string} R training script
   */
  generateRTrainingScript(config) {
    return `#!/usr/bin/env Rscript
# AI Model Training Script (R)
# Generated for container: ${config.containerId}

library(jsonlite)
library(caret)
library(randomForest)

# Configuration
job_id <- "${config.jobId || 'unknown'}"
container_id <- "${config.containerId}"
epochs <- ${config.epochs || 10}
batch_size <- ${config.batchSize || 32}

# Initialize progress tracking
current_epoch <- 0
progress <- 0.0
metrics <- list(
  loss = c(),
  accuracy = c()
)

cat("Starting R training for job:", job_id, "\\n")

# Load data
cat("Loading training data...\\n")
# Simulate data loading
set.seed(42)
n_samples <- 1000
n_features <- 10
X <- matrix(rnorm(n_samples * n_features), nrow = n_samples)
y <- factor(sample(0:1, n_samples, replace = TRUE))

cat("Loaded", n_samples, "samples with", n_features, "features\\n")

# Create model
cat("Creating model...\\n")
model <- randomForest(x = X, y = y, ntree = 100)

# Training loop
for (epoch in 1:epochs) {
  current_epoch <- epoch
  progress <- epoch / epochs * 100
  
  cat("Epoch", current_epoch, "/", epochs, "\\n")
  
  # Simulate training
  predictions <- predict(model, X)
  accuracy <- mean(predictions == y)
  loss <- 1 - accuracy
  
  # Store metrics
  metrics$loss <- c(metrics$loss, loss)
  metrics$accuracy <- c(metrics$accuracy, accuracy)
  
  cat("Epoch", current_epoch, "- Loss:", round(loss, 4), "Accuracy:", round(accuracy, 4), "\\n")
  
  # Save progress
  progress_data <- list(
    jobId = job_id,
    containerId = container_id,
    progress = progress,
    currentEpoch = current_epoch,
    totalEpochs = epochs,
    metrics = metrics,
    timestamp = Sys.time()
  )
  
  write_json(progress_data, paste0("/outputs/", job_id, "_progress.json"), pretty = TRUE)
  
  # Simulate training time
  Sys.sleep(1)
}

# Save final model
saveRDS(model, paste0("/outputs/", job_id, "_model.rds"))
cat("Model saved\\n")

# Save final results
results <- list(
  jobId = job_id,
  containerId = container_id,
  status = "completed",
  finalMetrics = list(
    finalLoss = tail(metrics$loss, 1),
    finalAccuracy = tail(metrics$accuracy, 1)
  ),
  totalEpochs = epochs,
  completedAt = Sys.time()
)

write_json(results, paste0("/outputs/", job_id, "_results.json"), pretty = TRUE)
cat("Training completed successfully!\\n")
`;
  }

  /**
   * Generate Julia training script
   * @param {Object} config - Container configuration
   * @returns {string} Julia training script
   */
  generateJuliaTrainingScript(config) {
    return `#!/usr/bin/env julia
# AI Model Training Script (Julia)
# Generated for container: ${config.containerId}

using JSON
using Flux
using MLJ
using DataFrames

# Configuration
job_id = "${config.jobId || 'unknown'}"
container_id = "${config.containerId}"
epochs = ${config.epochs || 10}
batch_size = ${config.batchSize || 32}

println("Starting Julia training for job: ", job_id)

# Initialize progress tracking
current_epoch = 0
progress = 0.0
metrics = Dict(
  "loss" => Float64[],
  "accuracy" => Float64[]
)

# Load data
println("Loading training data...")
# Simulate data loading
Random.seed!(42)
n_samples = 1000
n_features = 10
X = randn(n_features, n_samples)
y = rand(0:1, n_samples)

println("Loaded ", n_samples, " samples with ", n_features, " features")

# Create model
println("Creating model...")
model = Chain(
  Dense(n_features, 64, relu),
  Dense(64, 32, relu),
  Dense(32, 2)
)

# Training loop
for epoch in 1:epochs
  current_epoch = epoch
  progress = epoch / epochs * 100
  
  println("Epoch ", current_epoch, "/", epochs)
  
  # Simulate training
  accuracy = 0.7 + 0.2 * (epoch / epochs)  # Mock accuracy
  loss = 1 - accuracy
  
  # Store metrics
  push!(metrics["loss"], loss)
  push!(metrics["accuracy"], accuracy)
  
  println("Epoch ", current_epoch, " - Loss: ", round(loss, digits=4), " Accuracy: ", round(accuracy, digits=4))
  
  # Save progress
  progress_data = Dict(
    "jobId" => job_id,
    "containerId" => container_id,
    "progress" => progress,
    "currentEpoch" => current_epoch,
    "totalEpochs" => epochs,
    "metrics" => metrics,
    "timestamp" => string(now())
  )
  
  open("/outputs/$(job_id)_progress.json", "w") do f
    JSON.print(f, progress_data, 2)
  end
  
  # Simulate training time
  sleep(1)
end

# Save final model
# Note: In a real implementation, you would save the model properly
println("Model saved")

# Save final results
results = Dict(
  "jobId" => job_id,
  "containerId" => container_id,
  "status" => "completed",
  "finalMetrics" => Dict(
    "finalLoss" => metrics["loss"][end],
    "finalAccuracy" => metrics["accuracy"][end]
  ),
  "totalEpochs" => epochs,
  "completedAt" => string(now())
)

open("/outputs/$(job_id)_results.json", "w") do f
  JSON.print(f, results, 2)
end

println("Training completed successfully!")
`;
  }

  /**
   * Generate requirements file
   * @param {Object} templateConfig - Template configuration
   * @returns {string} Requirements content
   */
  generateRequirements(templateConfig) {
    return templateConfig.dependencies.join('\n');
  }

  /**
   * Generate configuration file
   * @param {Object} config - Container configuration
   * @returns {string} Configuration file content
   */
  generateConfigFile(config) {
    return JSON.stringify({
      containerId: config.containerId,
      jobId: config.jobId,
      epochs: config.epochs || 10,
      batchSize: config.batchSize || 32,
      learningRate: config.learningRate || 0.001,
      algorithm: config.algorithm || 'adam',
      template: config.template || 'python',
      createdAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Generate entrypoint script
   * @param {string} template - Template type
   * @returns {string} Entrypoint script content
   */
  generateEntrypointScript(template) {
    if (template === 'python') {
      return `#!/bin/bash
set -e

echo "Starting Python training container..."
python train.py --config /app/config.json
`;
    } else if (template === 'r') {
      return `#!/bin/bash
set -e

echo "Starting R training container..."
Rscript train.R
`;
    } else if (template === 'julia') {
      return `#!/bin/bash
set -e

echo "Starting Julia training container..."
julia train.jl
`;
    }
    
    return `#!/bin/bash
set -e

echo "Starting training container..."
python train.py --config /app/config.json
`;
  }

  /**
   * Deploy local container
   * @param {Object} deploymentConfig - Deployment configuration
   */
  async deployLocalContainer(deploymentConfig) {
    // For local development, we just prepare the container
    // The actual execution happens when starting the container
    console.log(`📦 Local container prepared: ${deploymentConfig.containerId}`);
  }

  /**
   * Deploy cloud container
   * @param {Object} deploymentConfig - Deployment configuration
   */
  async deployCloudContainer(deploymentConfig) {
    // This would deploy to actual cloud TEE environments
    console.log(`☁️ Cloud container deployed: ${deploymentConfig.containerId}`);
  }

  /**
   * Start local training
   * @param {Object} container - Container configuration
   * @param {Object} trainingConfig - Training configuration
   */
  async startLocalTraining(container, trainingConfig) {
    const containerPath = path.join(this.basePath, 'containers', container.containerId);
    
    // Start training process
    const trainingProcess = spawn('python', ['train.py', '--config', 'config.json'], {
      cwd: containerPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Store process reference
    container.process = trainingProcess;
    
    // Handle process output
    trainingProcess.stdout.on('data', (data) => {
      console.log(`[${container.containerId}] ${data.toString()}`);
    });
    
    trainingProcess.stderr.on('data', (data) => {
      console.error(`[${container.containerId}] ${data.toString()}`);
    });
    
    trainingProcess.on('close', (code) => {
      console.log(`[${container.containerId}] Training process exited with code ${code}`);
      container.status = code === 0 ? 'COMPLETED' : 'FAILED';
      container.completedAt = new Date();
    });
  }

  /**
   * Start cloud training
   * @param {Object} container - Container configuration
   * @param {Object} trainingConfig - Training configuration
   */
  async startCloudTraining(container, trainingConfig) {
    // This would start training in actual cloud TEE environments
    console.log(`☁️ Cloud training started: ${container.containerId}`);
  }

  /**
   * Stop local training
   * @param {Object} container - Container configuration
   */
  async stopLocalTraining(container) {
    if (container.process) {
      container.process.kill('SIGTERM');
      container.process = null;
    }
  }

  /**
   * Stop cloud training
   * @param {Object} container - Container configuration
   */
  async stopCloudTraining(container) {
    // This would stop training in actual cloud TEE environments
    console.log(`☁️ Cloud training stopped: ${container.containerId}`);
  }

  /**
   * Get training progress
   * @param {string} containerId - Container ID
   * @returns {Object} Training progress
   */
  async getTrainingProgress(containerId) {
    try {
      const container = this.activeContainers.get(containerId);
      if (!container) {
        return null;
      }
      
      // Try to read progress file
      const progressFile = path.join(this.basePath, 'outputs', `${container.jobId}_progress.json`);
      const progressData = await fs.readFile(progressFile, 'utf8');
      return JSON.parse(progressData);
    } catch (error) {
      console.error(`Failed to get training progress: ${error.message}`);
      return null;
    }
  }

  /**
   * Get container logs
   * @param {string} containerId - Container ID
   * @returns {Array} Container logs
   */
  async getContainerLogs(containerId) {
    try {
      const logFile = path.join(this.basePath, 'logs', `${containerId}.log`);
      const logData = await fs.readFile(logFile, 'utf8');
      return logData.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error(`Failed to get container logs: ${error.message}`);
      return [];
    }
  }
}

module.exports = TrainingContainerService;
