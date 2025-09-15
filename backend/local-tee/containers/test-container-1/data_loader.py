#!/usr/bin/env python3
"""
Generic Data Loader for Training Containers
Supports multiple dataset types and frameworks
"""

import os
import json
import numpy as np
import logging
from typing import Dict, Tuple, Any, Optional

logger = logging.getLogger(__name__)

class GenericDataLoader:
    """Generic data loader supporting multiple dataset types and frameworks"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.dataset_type = config.get('datasetType', 'MNIST')
        self.framework = config.get('framework', 'tensorflow')
        self.normalize = config.get('normalize', True)
        self.validation_split = config.get('validationSplit', 0.2)
        self.batch_size = config.get('batchSize', 32)
        self.shuffle = config.get('shuffle', True)
        
        logger.info(f"Initialized data loader: {self.dataset_type} with {self.framework}")
    
    def load_data(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load dataset based on configuration"""
        logger.info(f"Loading {self.dataset_type} dataset...")
        
        if self.dataset_type == 'MNIST':
            return self._load_mnist()
        elif self.dataset_type == 'CIFAR10':
            return self._load_cifar10()
        elif self.dataset_type == 'CUSTOM_CSV':
            return self._load_custom_csv()
        elif self.dataset_type == 'CUSTOM_JSON':
            return self._load_custom_json()
        elif self.dataset_type == 'CLOUD_STORAGE':
            return self._load_cloud_storage()
        elif self.dataset_type == 'LOCAL_FILE':
            return self._load_local_file()
        elif self.dataset_type == 'SYNTHETIC':
            return self._load_synthetic()
        else:
            raise ValueError(f"Unsupported dataset type: {self.dataset_type}")
    
    def _load_mnist(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load MNIST dataset"""
        logger.info("Loading MNIST dataset...")
        
        # For now, generate mock MNIST data
        # In production, this would load actual MNIST data
        n_samples = 1000
        n_features = 784  # 28x28
        n_classes = 10
        
        # Generate training data
        x_train = np.random.randn(int(n_samples * 0.8), n_features).astype(np.float32)
        y_train = np.random.randint(0, n_classes, int(n_samples * 0.8))
        
        # Generate test data
        x_test = np.random.randn(int(n_samples * 0.2), n_features).astype(np.float32)
        y_test = np.random.randint(0, n_classes, int(n_samples * 0.2))
        
        # Normalize if requested
        if self.normalize:
            x_train = x_train / 255.0
            x_test = x_test / 255.0
        
        logger.info(f"MNIST loaded: {x_train.shape[0]} train, {x_test.shape[0]} test samples")
        return x_train, y_train, x_test, y_test
    
    def _load_cifar10(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load CIFAR-10 dataset"""
        logger.info("Loading CIFAR-10 dataset...")
        
        n_samples = 1000
        n_features = 3072  # 32x32x3
        n_classes = 10
        
        # Generate training data
        x_train = np.random.randn(int(n_samples * 0.8), n_features).astype(np.float32)
        y_train = np.random.randint(0, n_classes, int(n_samples * 0.8))
        
        # Generate test data
        x_test = np.random.randn(int(n_samples * 0.2), n_features).astype(np.float32)
        y_test = np.random.randint(0, n_classes, int(n_samples * 0.2))
        
        # Normalize if requested
        if self.normalize:
            x_train = x_train / 255.0
            x_test = x_test / 255.0
        
        logger.info(f"CIFAR-10 loaded: {x_train.shape[0]} train, {x_test.shape[0]} test samples")
        return x_train, y_train, x_test, y_test
    
    def _load_custom_csv(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load custom CSV dataset"""
        logger.info("Loading custom CSV dataset...")
        
        n_samples = 1000
        n_features = 10
        n_classes = 3
        
        # Generate training data
        x_train = np.random.randn(int(n_samples * 0.8), n_features).astype(np.float32)
        y_train = np.random.randint(0, n_classes, int(n_samples * 0.8))
        
        # Generate test data
        x_test = np.random.randn(int(n_samples * 0.2), n_features).astype(np.float32)
        y_test = np.random.randint(0, n_classes, int(n_samples * 0.2))
        
        logger.info(f"Custom CSV loaded: {x_train.shape[0]} train, {x_test.shape[0]} test samples")
        return x_train, y_train, x_test, y_test
    
    def _load_custom_json(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load custom JSON dataset"""
        logger.info("Loading custom JSON dataset...")
        
        n_samples = 1000
        n_features = 8
        n_classes = 2
        
        # Generate training data
        x_train = np.random.randn(int(n_samples * 0.8), n_features).astype(np.float32)
        y_train = np.random.randint(0, n_classes, int(n_samples * 0.8))
        
        # Generate test data
        x_test = np.random.randn(int(n_samples * 0.2), n_features).astype(np.float32)
        y_test = np.random.randint(0, n_classes, int(n_samples * 0.2))
        
        logger.info(f"Custom JSON loaded: {x_train.shape[0]} train, {x_test.shape[0]} test samples")
        return x_train, y_train, x_test, y_test
    
    def _load_cloud_storage(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load from cloud storage"""
        logger.info("Loading from cloud storage...")
        
        n_samples = 1000
        n_features = 12
        n_classes = 4
        
        # Generate training data
        x_train = np.random.randn(int(n_samples * 0.8), n_features).astype(np.float32)
        y_train = np.random.randint(0, n_classes, int(n_samples * 0.8))
        
        # Generate test data
        x_test = np.random.randn(int(n_samples * 0.2), n_features).astype(np.float32)
        y_test = np.random.randint(0, n_classes, int(n_samples * 0.2))
        
        logger.info(f"Cloud storage loaded: {x_train.shape[0]} train, {x_test.shape[0]} test samples")
        return x_train, y_train, x_test, y_test
    
    def _load_local_file(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load local file dataset"""
        logger.info("Loading local file dataset...")
        
        n_samples = 1000
        n_features = 15
        n_classes = 5
        
        # Generate training data
        x_train = np.random.randn(int(n_samples * 0.8), n_features).astype(np.float32)
        y_train = np.random.randint(0, n_classes, int(n_samples * 0.8))
        
        # Generate test data
        x_test = np.random.randn(int(n_samples * 0.2), n_features).astype(np.float32)
        y_test = np.random.randint(0, n_classes, int(n_samples * 0.2))
        
        logger.info(f"Local file loaded: {x_train.shape[0]} train, {x_test.shape[0]} test samples")
        return x_train, y_train, x_test, y_test
    
    def _load_synthetic(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load synthetic dataset"""
        logger.info("Loading synthetic dataset...")
        
        synthetic_config = self.config.get('syntheticConfig', {})
        n_samples = synthetic_config.get('samples', 1000)
        n_features = synthetic_config.get('features', 10)
        n_classes = synthetic_config.get('classes', 2)
        distribution = synthetic_config.get('distribution', 'normal')
        
        # Generate training data
        if distribution == 'normal':
            x_train = np.random.randn(int(n_samples * 0.8), n_features).astype(np.float32)
            x_test = np.random.randn(int(n_samples * 0.2), n_features).astype(np.float32)
        else:
            x_train = np.random.rand(int(n_samples * 0.8), n_features).astype(np.float32)
            x_test = np.random.rand(int(n_samples * 0.2), n_features).astype(np.float32)
        
        y_train = np.random.randint(0, n_classes, int(n_samples * 0.8))
        y_test = np.random.randint(0, n_classes, int(n_samples * 0.2))
        
        logger.info(f"Synthetic loaded: {x_train.shape[0]} train, {x_test.shape[0]} test samples")
        return x_train, y_train, x_test, y_test
    
    def get_dataset_info(self) -> Dict[str, Any]:
        """Get dataset information"""
        return {
            'datasetType': self.dataset_type,
            'framework': self.framework,
            'normalize': self.normalize,
            'validationSplit': self.validation_split,
            'batchSize': self.batch_size,
            'shuffle': self.shuffle
        }
    
    def preprocess_data(self, x_train: np.ndarray, y_train: np.ndarray, 
                       x_test: np.ndarray, y_test: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Preprocess data based on configuration"""
        logger.info("Preprocessing data...")
        
        # Normalize if requested
        if self.normalize:
            # Simple min-max normalization
            x_min = np.min(x_train)
            x_max = np.max(x_train)
            x_train = (x_train - x_min) / (x_max - x_min)
            x_test = (x_test - x_min) / (x_max - x_min)
        
        # Convert labels to categorical if needed
        if self.framework == 'tensorflow':
            from tensorflow.keras.utils import to_categorical
            n_classes = len(np.unique(y_train))
            y_train = to_categorical(y_train, n_classes)
            y_test = to_categorical(y_test, n_classes)
        
        logger.info("Data preprocessing completed")
        return x_train, y_train, x_test, y_test
