#!/usr/bin/env python3
"""
AI Model Training Script
Generated for container: test-container-1
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
