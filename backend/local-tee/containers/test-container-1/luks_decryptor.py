#!/usr/bin/env python3
"""
LUKS Decryptor for Training Environment

This module provides LUKS decryption capabilities within the TEE training container.
It handles the decryption of LUKS-encrypted datasets and models for training.
"""

import os
import json
import subprocess
import tempfile
import shutil
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LUKSDecryptor:
    """
    LUKS Decryptor for training environment
    
    This class handles the decryption of LUKS-encrypted files within the TEE.
    It communicates with the backend to get decryption keys and access tokens.
    """
    
    def __init__(self, backend_url: str, access_token: str):
        self.backend_url = backend_url
        self.access_token = access_token
        self.temp_dir = Path(os.environ.get('TRAINING_LUKS_TEMP_DIR', '/tmp/luks-training'))
        self.temp_dir.mkdir(exist_ok=True)
        
        # Check if LUKS tools are available
        self.luks_available = self._check_luks_availability()
        if not self.luks_available:
            logger.warning("LUKS tools not available, falling back to streaming decryption")
    
    def _check_luks_availability(self) -> bool:
        """Check if LUKS tools are available in the container"""
        try:
            result = subprocess.run(['cryptsetup', '--version'], 
                                  capture_output=True, text=True, check=True)
            logger.info(f"LUKS available: {result.stdout.strip()}")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("LUKS tools not available")
            return False
    
    def decrypt_file(self, encrypted_data: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """
        Decrypt a LUKS-encrypted file
        
        Args:
            encrypted_data: Encrypted data metadata from backend
            output_path: Path where decrypted file should be saved
            
        Returns:
            Dict with decryption result and metadata
        """
        try:
            if not self.luks_available:
                return self._fallback_decrypt(encrypted_data, output_path)
            
            # Extract LUKS container information
            container_path = encrypted_data.get('containerPath')
            if not container_path:
                raise ValueError("No container path in encrypted data")
            
            # Download LUKS container if it's a URL
            if container_path.startswith('http'):
                container_path = self._download_container(container_path)
            
            # Get decryption key from backend
            decryption_key = self._get_decryption_key(encrypted_data)
            
            # Decrypt the LUKS container
            decrypted_path = self._decrypt_luks_container(container_path, decryption_key)
            
            # Move decrypted file to output path
            shutil.move(decrypted_path, output_path)
            
            # Clean up temporary files
            self._cleanup_temp_files()
            
            logger.info(f"Successfully decrypted LUKS file to: {output_path}")
            
            return {
                'success': True,
                'method': 'luks',
                'output_path': output_path,
                'file_size': os.path.getsize(output_path)
            }
            
        except Exception as e:
            logger.error(f"LUKS decryption failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'method': 'luks'
            }
    
    def _download_container(self, container_url: str) -> str:
        """Download LUKS container from URL"""
        logger.info(f"Downloading LUKS container from: {container_url}")
        
        response = requests.get(container_url, headers={
            'Authorization': f'Bearer {self.access_token}'
        })
        response.raise_for_status()
        
        container_path = self.temp_dir / f"container_{os.getpid()}.luks"
        with open(container_path, 'wb') as f:
            f.write(response.content)
        
        logger.info(f"Downloaded container to: {container_path}")
        return str(container_path)
    
    def _get_decryption_key(self, encrypted_data: Dict[str, Any]) -> str:
        """
        Get decryption key from backend
        
        This would typically involve:
        1. Validating access token
        2. Requesting decryption key for the specific data
        3. Receiving encrypted key that can be decrypted with TEE attestation
        """
        # For now, we'll use a mock key
        # In production, this would make an API call to get the actual key
        logger.info("Getting decryption key from backend...")
        
        # Mock implementation - in production, this would be:
        # response = requests.post(f"{self.backend_url}/api/enhanced-encryption/get-decryption-key", 
        #                        headers={'Authorization': f'Bearer {self.access_token}'},
        #                        json={'encryptedData': encrypted_data})
        # return response.json()['key']
        
        return "mock-decryption-key-256-bits-long"
    
    def _decrypt_luks_container(self, container_path: str, password: str) -> str:
        """Decrypt LUKS container and extract the file"""
        logger.info(f"Decrypting LUKS container: {container_path}")
        
        # Create temporary key file
        key_file = self.temp_dir / f"key_{os.getpid()}.key"
        with open(key_file, 'w') as f:
            f.write(password)
        
        try:
            # Generate unique device name
            device_name = f"luks-training-{os.getpid()}"
            device_path = f"/dev/mapper/{device_name}"
            
            # Open LUKS container
            logger.info("Opening LUKS container...")
            subprocess.run([
                'cryptsetup', 'luksOpen',
                '--key-file', str(key_file),
                container_path,
                device_name
            ], check=True)
            
            try:
                # Create mount point
                mount_point = self.temp_dir / f"mount_{os.getpid()}"
                mount_point.mkdir(exist_ok=True)
                
                # Mount the decrypted container
                logger.info("Mounting decrypted container...")
                subprocess.run([
                    'mount', device_path, str(mount_point)
                ], check=True)
                
                try:
                    # Find the data file in the mounted container
                    data_files = [f for f in mount_point.iterdir() 
                                if f.is_file() and f.name != '.luks-metadata.json']
                    
                    if not data_files:
                        raise ValueError("No data file found in LUKS container")
                    
                    data_file = data_files[0]
                    logger.info(f"Found data file: {data_file}")
                    
                    # Create output path
                    output_path = self.temp_dir / f"decrypted_{os.getpid()}.dat"
                    
                    # Copy file from mounted container
                    shutil.copy2(data_file, output_path)
                    
                    # Read metadata if available
                    metadata_file = mount_point / '.luks-metadata.json'
                    if metadata_file.exists():
                        with open(metadata_file) as f:
                            metadata = json.load(f)
                        logger.info(f"Container metadata: {metadata}")
                    
                    return str(output_path)
                    
                finally:
                    # Unmount the container
                    logger.info("Unmounting container...")
                    subprocess.run(['umount', str(mount_point)], check=True)
                    shutil.rmtree(mount_point)
                
            finally:
                # Close LUKS container
                logger.info("Closing LUKS container...")
                subprocess.run(['cryptsetup', 'luksClose', device_name], check=True)
        
        finally:
            # Clean up key file
            if key_file.exists():
                key_file.unlink()
    
    def _fallback_decrypt(self, encrypted_data: Dict[str, Any], output_path: str) -> Dict[str, Any]:
        """
        Fallback to streaming decryption if LUKS is not available
        
        This would use the streaming decryption service as a fallback.
        """
        logger.info("Using fallback streaming decryption...")
        
        # This would integrate with the streaming decryption service
        # For now, return an error
        return {
            'success': False,
            'error': 'LUKS not available and fallback not implemented',
            'method': 'fallback'
        }
    
    def _cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            for file_path in self.temp_dir.glob('*'):
                if file_path.is_file():
                    file_path.unlink()
                elif file_path.is_dir():
                    shutil.rmtree(file_path)
        except Exception as e:
            logger.warning(f"Error during cleanup: {e}")
    
    def get_container_info(self, container_path: str) -> Dict[str, Any]:
        """Get information about a LUKS container"""
        if not self.luks_available:
            return {'error': 'LUKS not available'}
        
        try:
            result = subprocess.run([
                'cryptsetup', 'luksDump', container_path
            ], capture_output=True, text=True, check=True)
            
            # Parse LUKS dump output
            info = {'path': container_path}
            for line in result.stdout.split('\n'):
                if 'Cipher:' in line:
                    info['cipher'] = line.split(':')[1].strip()
                elif 'Hash spec:' in line:
                    info['hash'] = line.split(':')[1].strip()
                elif 'Key bits:' in line:
                    info['key_size'] = int(line.split(':')[1].strip())
            
            return info
            
        except subprocess.CalledProcessError as e:
            return {'error': f'Failed to get container info: {e.stderr}'}


def decrypt_training_data(encrypted_data: Dict[str, Any], 
                         backend_url: str, 
                         access_token: str,
                         output_path: str) -> Dict[str, Any]:
    """
    Convenience function to decrypt training data
    
    Args:
        encrypted_data: Encrypted data metadata
        backend_url: Backend API URL
        access_token: Access token for authentication
        output_path: Path to save decrypted data
        
    Returns:
        Decryption result
    """
    decryptor = LUKSDecryptor(backend_url, access_token)
    return decryptor.decrypt_file(encrypted_data, output_path)


if __name__ == "__main__":
    # Example usage
    encrypted_data = {
        'method': 'luks',
        'containerPath': '/path/to/container.luks',
        'dataType': 'TRAINING_DATA'
    }
    
    result = decrypt_training_data(
        encrypted_data=encrypted_data,
        backend_url=os.environ.get('TRAINING_BACKEND_URL'),
        access_token='your-access-token',
        output_path='/tmp/decrypted_data.dat'
    )
    
    print(f"Decryption result: {result}")
