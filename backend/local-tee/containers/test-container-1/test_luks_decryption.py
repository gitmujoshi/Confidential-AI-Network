#!/usr/bin/env python3
"""
Test script for LUKS decryption in training environment

This script demonstrates how the training code would decrypt LUKS-encrypted files.
"""

import os
import sys
import json
import tempfile
import numpy as np
from pathlib import Path
from luks_decryptor import LUKSDecryptor, decrypt_training_data

def create_test_data():
    """Create test data for encryption/decryption testing"""
    print("Creating test data...")
    
    # Create sample MNIST-like data
    x_train = np.random.rand(1000, 784).astype(np.float32)
    y_train = np.random.randint(0, 10, 1000)
    x_test = np.random.rand(200, 784).astype(np.float32)
    y_test = np.random.randint(0, 10, 200)
    
    # Save as NumPy arrays
    data = {
        'x_train': x_train,
        'y_train': y_train,
        'x_test': x_test,
        'y_test': y_test
    }
    
    return data

def test_luks_decryptor():
    """Test LUKS decryptor functionality"""
    print("Testing LUKS decryptor...")
    
    # Create test data
    test_data = create_test_data()
    
    # Save test data to temporary file
    with tempfile.NamedTemporaryFile(suffix='.npz', delete=False) as f:
        np.savez(f, **test_data)
        test_file_path = f.name
    
    print(f"Created test data file: {test_file_path}")
    print(f"File size: {os.path.getsize(test_file_path)} bytes")
    
    # Create mock encrypted data metadata
    encrypted_data = {
        'method': 'luks',
        'containerPath': test_file_path,  # In real scenario, this would be a LUKS container
        'dataType': 'TRAINING_DATA',
        'originalSize': os.path.getsize(test_file_path),
        'algorithm': 'LUKS',
        'cipher': 'aes-xts-plain64',
        'hash': 'sha256',
        'keySize': 256
    }
    
    # Test LUKS decryptor
    decryptor = LUKSDecryptor(
        backend_url='http://localhost:5001',
        access_token='test-token'
    )
    
    print(f"LUKS available: {decryptor.luks_available}")
    
    # Test decryption (this will fail in test environment without LUKS)
    output_path = '/tmp/test_decrypted_data.npz'
    
    try:
        result = decryptor.decrypt_file(encrypted_data, output_path)
        print(f"Decryption result: {result}")
        
        if result['success']:
            # Load and verify decrypted data
            decrypted_data = np.load(output_path)
            print(f"Decrypted data keys: {list(decrypted_data.keys())}")
            print(f"Decrypted x_train shape: {decrypted_data['x_train'].shape}")
            print(f"Decrypted y_train shape: {decrypted_data['y_train'].shape}")
            
            # Clean up
            os.unlink(output_path)
        else:
            print(f"Decryption failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"Decryption error: {e}")
    
    # Clean up test file
    os.unlink(test_file_path)

def test_training_integration():
    """Test training integration with encrypted data"""
    print("Testing training integration...")
    
    # Create mock training configuration with encrypted data
    config = {
        'jobId': 'test-job-123',
        'containerId': 'test-container-1',
        'epochs': 5,
        'batchSize': 32,
        'learningRate': 0.001,
        'backendUrl': 'http://localhost:5001',
        'accessToken': 'test-token',
        'encryptedData': {
            'method': 'luks',
            'containerPath': '/tmp/mock-dataset.luks',
            'dataType': 'TRAINING_DATA'
        }
    }
    
    # Save configuration
    config_path = '/tmp/test_config.json'
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"Created test configuration: {config_path}")
    
    # Test configuration loading
    with open(config_path, 'r') as f:
        loaded_config = json.load(f)
    
    print(f"Loaded configuration: {loaded_config['jobId']}")
    print(f"Encrypted data method: {loaded_config['encryptedData']['method']}")
    
    # Clean up
    os.unlink(config_path)

def test_fallback_mechanisms():
    """Test fallback mechanisms when LUKS is not available"""
    print("Testing fallback mechanisms...")
    
    # Test with LUKS not available
    decryptor = LUKSDecryptor('http://localhost:5001', 'test-token')
    
    if not decryptor.luks_available:
        print("LUKS not available, testing fallback...")
        
        encrypted_data = {
            'method': 'luks',
            'containerPath': '/tmp/nonexistent.luks',
            'dataType': 'TRAINING_DATA'
        }
        
        result = decryptor.decrypt_file(encrypted_data, '/tmp/test_output.dat')
        print(f"Fallback result: {result}")
    
    # Test with different encryption methods
    methods = ['luks', 'streaming', 'memory']
    
    for method in methods:
        encrypted_data = {
            'method': method,
            'containerPath': '/tmp/test.luks',
            'dataType': 'TRAINING_DATA'
        }
        
        print(f"Testing method: {method}")
        # In real implementation, this would call appropriate decryption method
        print(f"  Method {method} would be handled by appropriate decryptor")

def main():
    """Main test function"""
    print("=== LUKS Decryption Test Suite ===")
    print()
    
    # Test 1: LUKS decryptor functionality
    test_luks_decryptor()
    print()
    
    # Test 2: Training integration
    test_training_integration()
    print()
    
    # Test 3: Fallback mechanisms
    test_fallback_mechanisms()
    print()
    
    print("=== Test Suite Complete ===")

if __name__ == "__main__":
    main()
