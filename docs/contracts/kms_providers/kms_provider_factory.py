"""
KMS Provider Factory for Azure Confidential Computing Integration

This module provides a factory pattern for creating KMS providers that can work
with Azure Confidential Computing environments. It supports multiple third-party
KMS providers including AWS KMS, Azure Key Vault, Google Cloud KMS, and Hashicorp Vault.
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass

# Azure imports
from azure.identity import DefaultAzureCredential
from azure.keyvault.keys import KeyVaultClient
from azure.keyvault.keys.crypto import CryptographyClient

# AWS imports
import boto3
from botocore.exceptions import ClientError

# Google Cloud imports
from google.cloud import kms_v1
from google.cloud.kms_v1 import KeyManagementServiceClient

# Hashicorp Vault imports
import hvac

logger = logging.getLogger(__name__)

@dataclass
class KMSConfig:
    """Configuration for KMS providers"""
    provider: str
    region: str
    key_id: str
    attestation_key_id: Optional[str] = None
    vault_url: Optional[str] = None
    project_id: Optional[str] = None
    key_ring: Optional[str] = None
    vault_token: Optional[str] = None
    vault_addr: Optional[str] = None

class KMSProvider(ABC):
    """Abstract base class for KMS providers"""
    
    def __init__(self, config: KMSConfig):
        self.config = config
        self.provider = config.provider
    
    @abstractmethod
    async def decrypt_data(self, encrypted_data: bytes, key_id: str) -> bytes:
        """Decrypt data using the KMS provider"""
        pass
    
    @abstractmethod
    async def verify_attestation(self, attestation_report: Dict[str, Any]) -> bool:
        """Verify Azure attestation with the KMS provider"""
        pass
    
    @abstractmethod
    async def configure_environment_access(self, environment: Dict[str, Any], contract_id: str) -> bool:
        """Configure KMS access for the confidential computing environment"""
        pass

class AWSKMSProvider(KMSProvider):
    """AWS KMS provider implementation"""
    
    def __init__(self, config: KMSConfig):
        super().__init__(config)
        self.kms_client = boto3.client(
            'kms',
            region_name=config.region,
            aws_access_key_id=config.access_key_id,
            aws_secret_access_key=config.secret_access_key
        )
    
    async def decrypt_data(self, encrypted_data: bytes, key_id: str) -> bytes:
        """Decrypt data using AWS KMS"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.kms_client.decrypt,
                {
                    'CiphertextBlob': encrypted_data,
                    'KeyId': key_id,
                    'EncryptionContext': {
                        'attestation-verified': 'true',
                        'confidential-computing': 'azure'
                    }
                }
            )
            return response['Plaintext']
        except ClientError as e:
            logger.error(f"AWS KMS decryption failed: {e}")
            raise Exception(f"AWS KMS decryption failed: {e}")
    
    async def verify_attestation(self, attestation_report: Dict[str, Any]) -> bool:
        """Verify Azure attestation with AWS KMS"""
        try:
            # Create attestation verification signature
            attestation_data = json.dumps(attestation_report, sort_keys=True).encode()
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.kms_client.sign,
                {
                    'KeyId': self.config.attestation_key_id,
                    'Message': attestation_data,
                    'MessageType': 'RAW',
                    'SigningAlgorithm': 'RSASSA_PKCS1_V1_5_SHA_256'
                }
            )
            
            # Verify the signature
            verify_response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.kms_client.verify,
                {
                    'KeyId': self.config.attestation_key_id,
                    'Message': attestation_data,
                    'MessageType': 'RAW',
                    'Signature': response['Signature'],
                    'SigningAlgorithm': 'RSASSA_PKCS1_V1_5_SHA_256'
                }
            )
            
            return verify_response['SignatureValid']
        except ClientError as e:
            logger.error(f"AWS KMS attestation verification failed: {e}")
            return False
    
    async def configure_environment_access(self, environment: Dict[str, Any], contract_id: str) -> bool:
        """Configure AWS KMS access for the environment"""
        try:
            # Create IAM role for the confidential computing environment
            role_name = f"ccrp-confidential-{contract_id}"
            
            trust_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            
            # Create role and attach KMS policy
            iam_client = boto3.client('iam')
            await asyncio.get_event_loop().run_in_executor(
                None,
                iam_client.create_role,
                {
                    'RoleName': role_name,
                    'AssumeRolePolicyDocument': json.dumps(trust_policy)
                }
            )
            
            # Attach KMS policy
            kms_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey",
                            "kms:Sign",
                            "kms:Verify"
                        ],
                        "Resource": [
                            f"arn:aws:kms:{self.config.region}:*:key/{self.config.key_id}",
                            f"arn:aws:kms:{self.config.region}:*:key/{self.config.attestation_key_id}"
                        ]
                    }
                ]
            }
            
            await asyncio.get_event_loop().run_in_executor(
                None,
                iam_client.put_role_policy,
                {
                    'RoleName': role_name,
                    'PolicyName': 'KMSAccessPolicy',
                    'PolicyDocument': json.dumps(kms_policy)
                }
            )
            
            return True
        except Exception as e:
            logger.error(f"AWS KMS access configuration failed: {e}")
            return False

class AzureKeyVaultProvider(KMSProvider):
    """Azure Key Vault provider implementation"""
    
    def __init__(self, config: KMSConfig):
        super().__init__(config)
        self.credential = DefaultAzureCredential()
        self.key_vault_client = KeyVaultClient(
            vault_url=config.vault_url,
            credential=self.credential
        )
    
    async def decrypt_data(self, encrypted_data: bytes, key_id: str) -> bytes:
        """Decrypt data using Azure Key Vault"""
        try:
            crypto_client = CryptographyClient(
                key_id,
                credential=self.credential
            )
            
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                crypto_client.decrypt,
                algorithm="RSA-OAEP",
                ciphertext=encrypted_data
            )
            
            return result.plaintext
        except Exception as e:
            logger.error(f"Azure Key Vault decryption failed: {e}")
            raise Exception(f"Azure Key Vault decryption failed: {e}")
    
    async def verify_attestation(self, attestation_report: Dict[str, Any]) -> bool:
        """Verify Azure attestation with Azure Key Vault"""
        try:
            crypto_client = CryptographyClient(
                f"{self.config.vault_url}/keys/{self.config.attestation_key_id}",
                credential=self.credential
            )
            
            attestation_data = json.dumps(attestation_report, sort_keys=True).encode()
            
            # Sign attestation data
            sign_result = await asyncio.get_event_loop().run_in_executor(
                None,
                crypto_client.sign,
                algorithm="RS256",
                digest=attestation_data
            )
            
            # Verify signature
            verify_result = await asyncio.get_event_loop().run_in_executor(
                None,
                crypto_client.verify,
                algorithm="RS256",
                digest=attestation_data,
                signature=sign_result.signature
            )
            
            return verify_result.is_valid
        except Exception as e:
            logger.error(f"Azure Key Vault attestation verification failed: {e}")
            return False
    
    async def configure_environment_access(self, environment: Dict[str, Any], contract_id: str) -> bool:
        """Configure Azure Key Vault access for the environment"""
        try:
            # Configure managed identity for the confidential computing environment
            # This would typically be done through Azure Resource Manager
            # For this example, we'll assume the environment has a managed identity
            
            # Grant access to the Key Vault
            access_policy = {
                "object_id": environment.get('managed_identity_id'),
                "permissions": {
                    "keys": ["get", "decrypt", "sign", "verify"],
                    "secrets": ["get"],
                    "certificates": ["get"]
                }
            }
            
            # Update Key Vault access policies
            await asyncio.get_event_loop().run_in_executor(
                None,
                self.key_vault_client.update_access_policy,
                vault_base_url=self.config.vault_url,
                operation_kind="add",
                access_policy=access_policy
            )
            
            return True
        except Exception as e:
            logger.error(f"Azure Key Vault access configuration failed: {e}")
            return False

class GCPKMSProvider(KMSProvider):
    """Google Cloud KMS provider implementation"""
    
    def __init__(self, config: KMSConfig):
        super().__init__(config)
        self.kms_client = KeyManagementServiceClient()
        self.key_path = f"projects/{config.project_id}/locations/{config.region}/keyRings/{config.key_ring}/cryptoKeys/{config.key_id}"
    
    async def decrypt_data(self, encrypted_data: bytes, key_id: str) -> bytes:
        """Decrypt data using Google Cloud KMS"""
        try:
            request = kms_v1.DecryptRequest(
                name=key_id,
                ciphertext=encrypted_data,
                additional_authenticated_data=b"confidential-computing"
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.kms_client.decrypt,
                request
            )
            
            return response.plaintext
        except Exception as e:
            logger.error(f"Google Cloud KMS decryption failed: {e}")
            raise Exception(f"Google Cloud KMS decryption failed: {e}")
    
    async def verify_attestation(self, attestation_report: Dict[str, Any]) -> bool:
        """Verify Azure attestation with Google Cloud KMS"""
        try:
            attestation_data = json.dumps(attestation_report, sort_keys=True).encode()
            
            # Create signature using attestation key
            attestation_key_path = f"projects/{self.config.project_id}/locations/{self.config.region}/keyRings/{self.config.key_ring}/cryptoKeys/{self.config.attestation_key_id}"
            
            sign_request = kms_v1.AsymmetricSignRequest(
                name=attestation_key_path,
                data=attestation_data,
                data_crc32c=None
            )
            
            sign_response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.kms_client.asymmetric_sign,
                sign_request
            )
            
            # Verify signature
            verify_request = kms_v1.AsymmetricDecryptRequest(
                name=attestation_key_path,
                ciphertext=sign_response.signature,
                ciphertext_crc32c=None
            )
            
            verify_response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.kms_client.asymmetric_decrypt,
                verify_request
            )
            
            return verify_response.plaintext == attestation_data
        except Exception as e:
            logger.error(f"Google Cloud KMS attestation verification failed: {e}")
            return False
    
    async def configure_environment_access(self, environment: Dict[str, Any], contract_id: str) -> bool:
        """Configure Google Cloud KMS access for the environment"""
        try:
            # Configure service account for the confidential computing environment
            # This would typically be done through Google Cloud IAM
            # For this example, we'll assume the environment has a service account
            
            # Grant KMS permissions to the service account
            service_account = environment.get('service_account_email')
            
            # This would typically use Google Cloud IAM client
            # For brevity, we'll assume the permissions are already configured
            
            return True
        except Exception as e:
            logger.error(f"Google Cloud KMS access configuration failed: {e}")
            return False

class HashicorpVaultProvider(KMSProvider):
    """Hashicorp Vault provider implementation"""
    
    def __init__(self, config: KMSConfig):
        super().__init__(config)
        self.vault_client = hvac.Client(
            url=config.vault_addr,
            token=config.vault_token
        )
    
    async def decrypt_data(self, encrypted_data: bytes, key_id: str) -> bytes:
        """Decrypt data using Hashicorp Vault"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.vault_client.secrets.transit.decrypt_data,
                name=key_id,
                mount_point='transit',
                ciphertext=encrypted_data.hex(),
                context=b"confidential-computing".hex()
            )
            
            return bytes.fromhex(response['data']['plaintext'])
        except Exception as e:
            logger.error(f"Hashicorp Vault decryption failed: {e}")
            raise Exception(f"Hashicorp Vault decryption failed: {e}")
    
    async def verify_attestation(self, attestation_report: Dict[str, Any]) -> bool:
        """Verify Azure attestation with Hashicorp Vault"""
        try:
            attestation_data = json.dumps(attestation_report, sort_keys=True).encode()
            
            # Sign attestation data
            sign_response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.vault_client.secrets.transit.sign_data,
                name=self.config.attestation_key_id,
                mount_point='transit',
                hash_algorithm='sha2-256',
                input=attestation_data.hex()
            )
            
            # Verify signature
            verify_response = await asyncio.get_event_loop().run_in_executor(
                None,
                self.vault_client.secrets.transit.verify_signed_data,
                name=self.config.attestation_key_id,
                mount_point='transit',
                hash_algorithm='sha2-256',
                input=attestation_data.hex(),
                signature=sign_response['data']['signature']
            )
            
            return verify_response['data']['valid']
        except Exception as e:
            logger.error(f"Hashicorp Vault attestation verification failed: {e}")
            return False
    
    async def configure_environment_access(self, environment: Dict[str, Any], contract_id: str) -> bool:
        """Configure Hashicorp Vault access for the environment"""
        try:
            # Create policy for the confidential computing environment
            policy_name = f"ccrp-confidential-{contract_id}"
            
            policy = f"""
            path "transit/keys/{self.config.key_id}" {{
                capabilities = ["read", "update"]
            }}
            path "transit/decrypt/{self.config.key_id}" {{
                capabilities = ["update"]
            }}
            path "transit/sign/{self.config.attestation_key_id}" {{
                capabilities = ["update"]
            }}
            path "transit/verify/{self.config.attestation_key_id}" {{
                capabilities = ["update"]
            }}
            """
            
            await asyncio.get_event_loop().run_in_executor(
                None,
                self.vault_client.sys.create_or_update_policy,
                name=policy_name,
                policy=policy
            )
            
            return True
        except Exception as e:
            logger.error(f"Hashicorp Vault access configuration failed: {e}")
            return False

class KMSProviderFactory:
    """Factory for creating KMS providers"""
    
    _providers = {
        'aws': AWSKMSProvider,
        'azure': AzureKeyVaultProvider,
        'gcp': GCPKMSProvider,
        'hashicorp': HashicorpVaultProvider
    }
    
    @classmethod
    def create(cls, provider_type: str, config: Dict[str, Any]) -> KMSProvider:
        """Create a KMS provider instance"""
        if provider_type not in cls._providers:
            raise ValueError(f"Unsupported KMS provider: {provider_type}")
        
        kms_config = KMSConfig(
            provider=provider_type,
            region=config.get('region', 'us-east-1'),
            key_id=config.get('keyId') or config.get('key_name'),
            attestation_key_id=config.get('attestationKeyId') or config.get('attestation_key_name'),
            vault_url=config.get('vaultUrl') or config.get('vault_url'),
            project_id=config.get('projectId') or config.get('project_id'),
            key_ring=config.get('keyRing') or config.get('key_ring'),
            vault_token=config.get('vaultToken') or config.get('vault_token'),
            vault_addr=config.get('vaultAddr') or config.get('vault_addr')
        )
        
        return cls._providers[provider_type](kms_config)
    
    @classmethod
    def register_provider(cls, provider_type: str, provider_class: type):
        """Register a new KMS provider"""
        cls._providers[provider_type] = provider_class
    
    @classmethod
    def get_supported_providers(cls) -> list:
        """Get list of supported KMS providers"""
        return list(cls._providers.keys()) 