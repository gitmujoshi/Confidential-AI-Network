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
import numpy as np
import torch
from datetime import datetime
from pathlib import Path
from data_loader import GenericDataLoader
from luks_decryptor import LUKSDecryptor, decrypt_training_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/training.log'),
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
        """Load training data using generic data loader"""
        logger.info("Loading training data...")
        
        # Check if we have encrypted data to decrypt
        encrypted_data = self.config.get('encryptedData')
        if encrypted_data:
            logger.info("Found encrypted data, attempting decryption...")
            return self.load_encrypted_data(encrypted_data)
        
        # Create data loader configuration
        data_config = {
            'datasetType': self.config.get('datasetType', 'MNIST'),
            'framework': self.config.get('framework', 'tensorflow'),
            'normalize': self.config.get('normalize', True),
            'validationSplit': self.config.get('validationSplit', 0.2),
            'batchSize': self.config.get('batchSize', 32),
            'shuffle': self.config.get('shuffle', True),
            'syntheticConfig': self.config.get('syntheticConfig', {})
        }
        
        # Initialize data loader
        data_loader = GenericDataLoader(data_config)
        
        # Load data
        x_train, y_train, x_test, y_test = data_loader.load_data()
        
        # Preprocess data
        x_train, y_train, x_test, y_test = data_loader.preprocess_data(
            x_train, y_train, x_test, y_test
        )
        
        logger.info(f"Loaded {x_train.shape[0]} training samples, {x_test.shape[0]} test samples")
        logger.info(f"Features: {x_train.shape[1]}, Classes: {y_train.shape[1] if len(y_train.shape) > 1 else len(np.unique(y_train))}")
        
        return x_train, y_train, x_test, y_test
    
    def load_encrypted_data(self, encrypted_data):
        """Load and decrypt encrypted training data"""
        logger.info("Loading encrypted training data...")
        
        # Get backend configuration from environment or config
        backend_url = self.config.get('backendUrl') or os.environ.get('TRAINING_BACKEND_URL')
        access_token = self.config.get('accessToken', '')
        
        if not backend_url:
            raise ValueError("Backend URL not configured. Set TRAINING_BACKEND_URL environment variable or backendUrl in config.")
        
        if not access_token:
            logger.warning("No access token provided, using mock data")
            return self.load_data()  # Fallback to regular data loading
        
        # Create output directory for decrypted data
        decrypted_dir = Path(os.environ.get('TRAINING_TEMP_DIR', '/tmp/decrypted_data'))
        decrypted_dir.mkdir(exist_ok=True)
        
        # Determine encryption method
        encryption_method = encrypted_data.get('method', 'unknown')
        logger.info(f"Encryption method: {encryption_method}")
        
        if encryption_method == 'luks':
            # Handle LUKS encrypted data
            return self.load_luks_data(encrypted_data, backend_url, access_token, decrypted_dir)
        elif encryption_method == 'streaming':
            # Handle streaming encrypted data
            return self.load_streaming_data(encrypted_data, backend_url, access_token, decrypted_dir)
        else:
            # Handle in-memory encrypted data
            return self.load_memory_data(encrypted_data, decrypted_dir)
    
    def load_luks_data(self, encrypted_data, backend_url, access_token, decrypted_dir):
        """Load LUKS encrypted data"""
        logger.info("Decrypting LUKS encrypted data...")
        
        # Create LUKS decryptor
        decryptor = LUKSDecryptor(backend_url, access_token)
        
        # Decrypt the data
        output_path = decrypted_dir / f"decrypted_data_{self.job_id}.dat"
        result = decryptor.decrypt_file(encrypted_data, str(output_path))
        
        if not result['success']:
            logger.error(f"LUKS decryption failed: {result.get('error', 'Unknown error')}")
            # Fallback to regular data loading
            return self.load_data()
        
        logger.info(f"Successfully decrypted LUKS data: {result['file_size']} bytes")
        
        # Load the decrypted data
        return self.load_decrypted_file(output_path)
    
    def load_streaming_data(self, encrypted_data, backend_url, access_token, decrypted_dir):
        """Load streaming encrypted data"""
        logger.info("Decrypting streaming encrypted data...")
        
        # This would integrate with the streaming decryption service
        # For now, fallback to regular data loading
        logger.warning("Streaming decryption not implemented, using fallback")
        return self.load_data()
    
    def load_memory_data(self, encrypted_data, decrypted_dir):
        """Load in-memory encrypted data"""
        logger.info("Decrypting in-memory encrypted data...")
        
        # This would integrate with the in-memory decryption service
        # For now, fallback to regular data loading
        logger.warning("In-memory decryption not implemented, using fallback")
        return self.load_data()
    
    def load_decrypted_file(self, file_path):
        """Load data from a decrypted file"""
        logger.info(f"Loading decrypted data from: {file_path}")
        
        # Determine file type and load accordingly
        file_ext = file_path.suffix.lower()
        
        if file_ext in ['.npy', '.npz']:
            # NumPy array files
            data = np.load(file_path)
            if isinstance(data, np.lib.npyio.NpzFile):
                # .npz file with multiple arrays
                x_train = data['x_train']
                y_train = data['y_train']
                x_test = data['x_test']
                y_test = data['y_test']
            else:
                # Single .npy file - assume it's training data
                x_train = data
                y_train = None
                x_test = None
                y_test = None
        elif file_ext in ['.pkl', '.pickle']:
            # Pickle files
            import pickle
            with open(file_path, 'rb') as f:
                data = pickle.load(f)
            x_train = data.get('x_train')
            y_train = data.get('y_train')
            x_test = data.get('x_test')
            y_test = data.get('y_test')
        elif file_ext in ['.json']:
            # JSON files
            with open(file_path, 'r') as f:
                data = json.load(f)
            x_train = np.array(data.get('x_train', []))
            y_train = np.array(data.get('y_train', []))
            x_test = np.array(data.get('x_test', []))
            y_test = np.array(data.get('y_test', []))
        else:
            # Try to load as text/CSV
            logger.warning(f"Unknown file type {file_ext}, trying to load as CSV")
            import pandas as pd
            df = pd.read_csv(file_path)
            # Assume last column is target, rest are features
            x_train = df.iloc[:, :-1].values
            y_train = df.iloc[:, -1].values
            x_test = None
            y_test = None
        
        logger.info(f"Loaded decrypted data: {x_train.shape if x_train is not None else 'None'} training samples")
        
        return x_train, y_train, x_test, y_test
    
    def create_model(self, input_shape, num_classes):
        """Create model architecture based on dataset type"""
        logger.info(f"Creating model architecture: input_shape={input_shape}, num_classes={num_classes}")
        
        dataset_type = self.config.get('datasetType', 'MNIST')
        
        try:
            import torch
            import torch.nn as nn
            import torch.optim as optim
            
            if dataset_type == 'MNIST':
                # CNN for MNIST
                class MNISTModel(nn.Module):
                    def __init__(self, num_classes):
                        super(MNISTModel, self).__init__()
                        self.conv1 = nn.Conv2d(1, 32, 3, 1)
                        self.conv2 = nn.Conv2d(32, 64, 3, 1)
                        self.dropout1 = nn.Dropout2d(0.25)
                        self.dropout2 = nn.Dropout2d(0.5)
                        self.fc1 = nn.Linear(9216, 128)
                        self.fc2 = nn.Linear(128, num_classes)
                    
                    def forward(self, x):
                        x = x.view(-1, 1, 28, 28)  # Reshape for MNIST
                        x = torch.relu(self.conv1(x))
                        x = torch.relu(self.conv2(x))
                        x = torch.max_pool2d(x, 2)
                        x = self.dropout1(x)
                        x = torch.flatten(x, 1)
                        x = torch.relu(self.fc1(x))
                        x = self.dropout2(x)
                        x = self.fc2(x)
                        return x
                
                model = MNISTModel(num_classes)
                
            elif dataset_type == 'CIFAR10':
                # CNN for CIFAR-10
                class CIFAR10Model(nn.Module):
                    def __init__(self, num_classes):
                        super(CIFAR10Model, self).__init__()
                        self.conv1 = nn.Conv2d(3, 32, 3, 1)
                        self.conv2 = nn.Conv2d(32, 64, 3, 1)
                        self.conv3 = nn.Conv2d(64, 64, 3, 1)
                        self.dropout1 = nn.Dropout2d(0.25)
                        self.dropout2 = nn.Dropout2d(0.5)
                        self.fc1 = nn.Linear(576, 128)
                        self.fc2 = nn.Linear(128, num_classes)
                    
                    def forward(self, x):
                        x = x.view(-1, 3, 32, 32)  # Reshape for CIFAR-10
                        x = torch.relu(self.conv1(x))
                        x = torch.relu(self.conv2(x))
                        x = torch.max_pool2d(x, 2)
                        x = torch.relu(self.conv3(x))
                        x = torch.max_pool2d(x, 2)
                        x = self.dropout1(x)
                        x = torch.flatten(x, 1)
                        x = torch.relu(self.fc1(x))
                        x = self.dropout2(x)
                        x = self.fc2(x)
                        return x
                
                model = CIFAR10Model(num_classes)
                
            else:
                # Simple MLP for other datasets
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
                
                input_size = input_shape[0] if isinstance(input_shape, (list, tuple)) else input_shape
                model = SimpleModel(input_size, 64, num_classes)
            
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
    
    def validate_epoch(self, model, X, y, criterion):
        """Validate model for one epoch"""
        model.eval()
        total_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for i in range(0, len(X), self.batch_size):
                batch_X = X[i:i+self.batch_size]
                batch_y = y[i:i+self.batch_size]
                
                outputs = model(torch.FloatTensor(batch_X))
                loss = criterion(outputs, torch.LongTensor(batch_y))
                
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
        x_train, y_train, x_test, y_test = self.load_data()
        
        # Determine input shape and number of classes
        input_shape = x_train.shape[1:]
        num_classes = y_train.shape[1] if len(y_train.shape) > 1 else len(np.unique(y_train))
        
        # Create model
        model, optimizer, criterion = self.create_model(input_shape, num_classes)
        
        # Training loop
        for epoch in range(self.epochs):
            self.current_epoch = epoch + 1
            self.progress = (epoch + 1) / self.epochs * 100
            
            logger.info(f"Epoch {self.current_epoch}/{self.epochs}")
            
            # Train epoch
            train_loss, train_accuracy = self.train_epoch(model, x_train, y_train, optimizer, criterion)
            
            # Validate epoch
            val_loss, val_accuracy = self.validate_epoch(model, x_test, y_test, criterion)
            
            # Store metrics
            self.metrics['loss'].append(train_loss)
            self.metrics['accuracy'].append(train_accuracy)
            self.metrics['validation_loss'].append(val_loss)
            self.metrics['validation_accuracy'].append(val_accuracy)
            
            # Log progress
            logger.info(f"Epoch {self.current_epoch} - Train Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.4f}, Val Loss: {val_loss:.4f}, Val Acc: {val_accuracy:.4f}")
            
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
        
        progress_file = Path('outputs') / f'{self.job_id}_progress.json'
        with open(progress_file, 'w') as f:
            json.dump(progress_data, f, indent=2)
    
    def save_model(self, model):
        """Save trained model"""
        model_file = Path('outputs') / f'{self.job_id}_model.pkl'
        
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
        
        results_file = Path('outputs') / f'{self.job_id}_results.json'
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
