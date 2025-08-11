"""
ContractFlow Pro - Python Client SDK
Comprehensive SDK for interacting with the ContractFlow Pro API
"""

import requests
import json
from typing import Dict, List, Optional, Union, Any
from datetime import datetime
import time


class ContractFlowProSDK:
    """Main SDK class for ContractFlow Pro API interactions"""
    
    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            config = {}
        
        self.base_url = config.get('base_url', 'http://localhost:5001')
        self.api_base = f"{self.base_url}/api"
        self.token = config.get('token')
        self.timeout = config.get('timeout', 30)
        self.session = requests.Session()
        
        # Set default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'ContractFlowPro-Python-SDK/1.0.0'
        })
        
        # Set timeout
        self.session.timeout = self.timeout
    
    def set_token(self, token: str) -> None:
        """Set authentication token"""
        self.token = token
        if token:
            self.session.headers['Authorization'] = f'Bearer {token}'
        else:
            self.session.headers.pop('Authorization', None)
    
    def clear_token(self) -> None:
        """Clear authentication token"""
        self.token = None
        self.session.headers.pop('Authorization', None)
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None, 
                     params: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.api_base}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                error_data = e.response.json() if e.response.content else {}
                raise APIError(
                    status_code=e.response.status_code,
                    message=error_data.get('error', str(e)),
                    details=error_data.get('details')
                )
            else:
                raise APIError(status_code=0, message=str(e))
    
    # Health & System Methods
    def get_health(self) -> Dict[str, Any]:
        """Get system health status"""
        return self._make_request('GET', '/health')
    
    def get_api_status(self) -> Dict[str, Any]:
        """Get API status"""
        return self._make_request('GET', '/api/status')
    
    # Authentication Methods
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """User login"""
        data = {'email': email, 'password': password}
        response = self._make_request('POST', '/auth/login', data)
        
        if response.get('success') and response.get('token'):
            self.set_token(response['token'])
        
        return response
    
    def register(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """User registration"""
        return self._make_request('POST', '/auth/register', user_data)
    
    def get_profile(self) -> Dict[str, Any]:
        """Get current user profile"""
        return self._make_request('GET', '/auth/profile')
    
    def logout(self) -> Dict[str, Any]:
        """User logout"""
        self.clear_token()
        return {'success': True, 'message': 'Logged out successfully'}
    
    # Contract Management Methods
    def create_ricardian_contract(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Ricardian contract"""
        return self._make_request('POST', '/contracts/ricardian', contract_data)
    
    def get_contract(self, contract_id: str) -> Dict[str, Any]:
        """Get contract by ID"""
        return self._make_request('GET', f'/contracts/{contract_id}')
    
    def list_contracts(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """List contracts with optional filters"""
        return self._make_request('GET', '/contracts', params=params)
    
    def update_contract(self, contract_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update contract"""
        return self._make_request('PUT', f'/contracts/{contract_id}', update_data)
    
    def preview_contract(self, contract_data: Dict[str, Any]) -> Dict[str, Any]:
        """Preview contract without authentication"""
        return self._make_request('POST', '/contracts/ricardian/multi-tdp-preview-test', contract_data)
    
    # Dataset Management Methods
    def get_public_datasets(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get public datasets"""
        return self._make_request('GET', '/datasets/public', params=params)
    
    def search_datasets(self, query: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Search datasets"""
        params = {'q': query}
        if filters:
            params.update(filters)
        return self._make_request('GET', '/datasets/search', params=params)
    
    def get_tdp_datasets(self, user_id: str) -> Dict[str, Any]:
        """Get TDP user datasets"""
        return self._make_request('GET', f'/tdp/datasets/{user_id}')
    
    def create_dataset(self, dataset_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new dataset"""
        return self._make_request('POST', '/datasets', dataset_data)
    
    # Infrastructure & Cloud Methods
    def create_training_environment(self, environment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create training environment"""
        return self._make_request('POST', '/infrastructure/environments', environment_data)
    
    def get_environment(self, environment_id: str) -> Dict[str, Any]:
        """Get environment by ID"""
        return self._make_request('GET', f'/infrastructure/environments/{environment_id}')
    
    def list_environments(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """List environments"""
        return self._make_request('GET', '/infrastructure/environments', params=params)
    
    def destroy_environment(self, environment_id: str) -> Dict[str, Any]:
        """Destroy environment"""
        return self._make_request('DELETE', f'/infrastructure/environments/{environment_id}')
    
    def get_cloud_providers(self) -> Dict[str, Any]:
        """Get available cloud providers"""
        return self._make_request('GET', '/infrastructure/cloud-providers')
    
    def get_cloud_provider_details(self, provider: str) -> Dict[str, Any]:
        """Get cloud provider details"""
        return self._make_request('GET', f'/infrastructure/cloud-providers/{provider}')
    
    def estimate_costs(self, estimation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate environment costs"""
        return self._make_request('POST', '/infrastructure/cost-estimation', estimation_data)
    
    # Cloud Credentials Methods
    def store_cloud_credentials(self, credential_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store cloud provider credentials"""
        return self._make_request('POST', '/ccrp/cloud-credentials', credential_data)
    
    def get_cloud_credentials(self, user_id: str) -> Dict[str, Any]:
        """Get stored cloud credentials"""
        return self._make_request('GET', f'/ccrp/cloud-credentials/{user_id}')
    
    def validate_credentials(self, credential_id: str) -> Dict[str, Any]:
        """Validate cloud credentials"""
        return self._make_request('POST', f'/ccrp/cloud-credentials/{credential_id}/validate')
    
    def get_secret_managers(self) -> Dict[str, Any]:
        """Get available secret managers"""
        return self._make_request('GET', '/secret-managers')
    
    # Dashboard Methods
    def get_tdc_dashboard(self, user_id: str) -> Dict[str, Any]:
        """Get TDC dashboard"""
        return self._make_request('GET', f'/tdc/dashboard/{user_id}')
    
    def get_tdp_dashboard(self, user_id: str) -> Dict[str, Any]:
        """Get TDP dashboard"""
        return self._make_request('GET', f'/tdp/dashboard/{user_id}')
    
    def get_ccrp_dashboard(self, user_id: str) -> Dict[str, Any]:
        """Get CCRP dashboard"""
        return self._make_request('GET', f'/ccrp/dashboard/{user_id}')
    
    # Analytics Methods
    def get_contract_analytics(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get contract analytics"""
        return self._make_request('GET', '/analytics/contracts', params=params)
    
    # User Management Methods
    def list_users(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """List users"""
        return self._make_request('GET', '/users', params=params)
    
    def get_user(self, user_id: str) -> Dict[str, Any]:
        """Get user by ID"""
        return self._make_request('GET', f'/users/{user_id}')
    
    # Security & Compliance Methods
    def get_environment_security(self, environment_id: str) -> Dict[str, Any]:
        """Get environment security status"""
        return self._make_request('GET', f'/infrastructure/environments/{environment_id}/security')
    
    def get_compliance_report(self, environment_id: str) -> Dict[str, Any]:
        """Get compliance report"""
        return self._make_request('GET', f'/infrastructure/environments/{environment_id}/compliance')
    
    # Monitoring & Metrics Methods
    def get_environment_metrics(self, environment_id: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get environment metrics"""
        return self._make_request('GET', f'/infrastructure/environments/{environment_id}/metrics', params=params)
    
    # Utility Methods
    def is_authenticated(self) -> bool:
        """Check if user is authenticated"""
        try:
            self.get_profile()
            return True
        except APIError:
            return False
    
    def batch_create_contracts(self, contracts_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Batch create contracts"""
        results = []
        for data in contracts_data:
            try:
                result = self.create_ricardian_contract(data)
                results.append({'success': True, 'data': result})
            except Exception as e:
                results.append({'success': False, 'error': str(e)})
        return results
    
    def batch_get_contracts(self, contract_ids: List[str]) -> List[Dict[str, Any]]:
        """Batch get contracts"""
        results = []
        for contract_id in contract_ids:
            try:
                result = self.get_contract(contract_id)
                results.append({'success': True, 'data': result})
            except Exception as e:
                results.append({'success': False, 'error': str(e)})
        return results


class ContractManager:
    """Convenience class for contract operations"""
    
    def __init__(self, sdk: ContractFlowProSDK):
        self.sdk = sdk
    
    def create_ai_training_contract(self, dataset_ids: List[str], duration: int, 
                                  terms: str) -> Dict[str, Any]:
        """Create AI training contract with default settings"""
        contract_data = {
            'datasetSelections': [{'datasetId': id, 'individualPrice': 1000} for id in dataset_ids],
            'duration': duration,
            'termsAndConditions': terms,
            'contractType': 'AI_TRAINING',
            'privacyRequirements': {
                'differentialPrivacy': True,
                'maxPrivacyLoss': 0.1
            }
        }
        return self.sdk.create_ricardian_contract(contract_data)
    
    def get_active_contracts(self) -> Dict[str, Any]:
        """Get active contracts"""
        return self.sdk.list_contracts({'status': 'ACTIVE'})
    
    def get_contract_history(self) -> Dict[str, Any]:
        """Get completed contracts"""
        return self.sdk.list_contracts({'status': 'COMPLETED'})


class DatasetManager:
    """Convenience class for dataset operations"""
    
    def __init__(self, sdk: ContractFlowProSDK):
        self.sdk = sdk
    
    def search_by_category(self, category: str, max_price: Optional[float] = None) -> Dict[str, Any]:
        """Search datasets by category"""
        filters = {'category': category}
        if max_price:
            filters['priceMax'] = max_price
        return self.sdk.search_datasets('', filters)
    
    def get_affordable_datasets(self, budget: float) -> Dict[str, Any]:
        """Get datasets within budget"""
        return self.sdk.get_public_datasets({'priceMax': budget})


class InfrastructureManager:
    """Convenience class for infrastructure operations"""
    
    def __init__(self, sdk: ContractFlowProSDK):
        self.sdk = sdk
    
    def provision_azure_environment(self, contract_id: str, vm_size: str = 'Standard_D2s_v3') -> Dict[str, Any]:
        """Provision Azure training environment"""
        environment_data = {
            'contractId': contract_id,
            'cloudProvider': 'AZURE',
            'region': 'eastus',
            'vmSize': vm_size,
            'enableConfidentialComputing': True,
            'enableEncryption': True
        }
        return self.sdk.create_training_environment(environment_data)
    
    def provision_aws_environment(self, contract_id: str, instance_type: str = 't3.medium') -> Dict[str, Any]:
        """Provision AWS training environment"""
        environment_data = {
            'contractId': contract_id,
            'cloudProvider': 'AWS',
            'region': 'us-east-1',
            'vmSize': instance_type,
            'enableConfidentialComputing': True,
            'enableEncryption': True
        }
        return self.sdk.create_training_environment(environment_data)
    
    def monitor_environment(self, environment_id: str) -> Dict[str, Any]:
        """Get environment monitoring data"""
        return self.sdk.get_environment_metrics(environment_id, {'timeRange': '24h'})


class APIError(Exception):
    """Custom exception for API errors"""
    
    def __init__(self, status_code: int, message: str, details: Optional[Dict] = None):
        self.status_code = status_code
        self.message = message
        self.details = details
        super().__init__(self.message)
    
    def __str__(self):
        return f"API Error {self.status_code}: {self.message}"


# Example usage:
"""
from contractflow_pro_sdk import ContractFlowProSDK, ContractManager

# Initialize SDK
sdk = ContractFlowProSDK({
    'base_url': 'https://api.contractflowpro.com',
    'timeout': 30
})

# Login
response = sdk.login('user@example.com', 'password')
print(f"Login successful: {response['success']}")

# Use convenience classes
contract_manager = ContractManager(sdk)
contract = contract_manager.create_ai_training_contract(
    dataset_ids=['DS-001', 'DS-002'],
    duration=30,
    terms='Standard AI training terms'
)

print(f"Contract created: {contract['contract']['contractId']}")
""" 