import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import CCRPCloudCredentials from '../src/pages/CCRPCloudCredentials';
import { UserProvider } from '../src/contexts/UserContext';

// Mock the API service
jest.mock('../src/services/api', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const mockCCRPUser = {
  id: 1,
  email: 'ccrp@example.com',
  partyType: 'CCRP',
  iamUserId: 'ccrp-iam-id',
  iamUsername: 'ccrp-user'
};

const mockCredentials = [
  {
    id: 1,
    cloudProvider: 'AZURE',
    secretName: 'azure-credentials-1',
    secretManager: 'VAULT',
    defaultLocation: 'eastus',
    defaultVMSize: 'Standard_D2s_v3',
    validationStatus: 'VALID',
    lastValidated: '2025-01-02T10:30:00.000Z',
    isActive: true
  },
  {
    id: 2,
    cloudProvider: 'AWS',
    secretName: 'aws-credentials-1',
    secretManager: 'AWS_SECRETS',
    defaultLocation: 'us-east-1',
    defaultVMSize: 't3.medium',
    validationStatus: 'PENDING',
    isActive: true
  },
  {
    id: 3,
    cloudProvider: 'GCP',
    secretName: 'gcp-credentials-1',
    secretManager: 'GCP_SECRETS',
    defaultLocation: 'us-central1',
    defaultVMSize: 'n1-standard-2',
    validationStatus: 'INVALID',
    isActive: true
  }
];

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
  );
};

describe('CCRPCloudCredentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render cloud credentials management page', () => {
      renderWithProviders(<CCRPCloudCredentials />);
      
      expect(screen.getByText('Cloud Credentials Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your cloud provider credentials for training environment provisioning.')).toBeInTheDocument();
    });

    test('should show add credential button', () => {
      renderWithProviders(<CCRPCloudCredentials />);
      
      expect(screen.getByText('Add Cloud Credential')).toBeInTheDocument();
    });

    test('should show empty state when no credentials exist', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: [] });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('No cloud credentials found')).toBeInTheDocument();
        expect(screen.getByText('Add your first cloud credential to get started with training environment provisioning.')).toBeInTheDocument();
      });
    });

    test('should display credentials when they exist', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: mockCredentials });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Azure')).toBeInTheDocument();
        expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
        expect(screen.getByText('Google Cloud Platform')).toBeInTheDocument();
      });
    });
  });

  describe('Credential Cards', () => {
    beforeEach(async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: mockCredentials });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Azure')).toBeInTheDocument();
      });
    });

    test('should display credential information correctly', () => {
      expect(screen.getByText('VALID')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('INVALID')).toBeInTheDocument();
      expect(screen.getByText('VAULT')).toBeInTheDocument();
      expect(screen.getByText('AWS_SECRETS')).toBeInTheDocument();
      expect(screen.getByText('GCP_SECRETS')).toBeInTheDocument();
    });

    test('should display credential details', () => {
      expect(screen.getByText('Location: eastus')).toBeInTheDocument();
      expect(screen.getByText('VM Size: Standard_D2s_v3')).toBeInTheDocument();
      expect(screen.getByText('Secret Name: azure-credentials-1')).toBeInTheDocument();
    });

    test('should show action buttons for each credential', () => {
      const editButtons = screen.getAllByText('Edit');
      const validateButtons = screen.getAllByText('Validate');
      const deleteButtons = screen.getAllByText('Delete');

      expect(editButtons.length).toBe(3);
      expect(validateButtons.length).toBe(3);
      expect(deleteButtons.length).toBe(3);
    });
  });

  describe('Add Credential Dialog', () => {
    test('should open add credential dialog when button is clicked', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: [] });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Add Cloud Credential')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Cloud Credential'));

      await waitFor(() => {
        expect(screen.getByText('Add Cloud Credential')).toBeInTheDocument();
      });
    });

    test('should display form fields in add dialog', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: [] });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Add Cloud Credential')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Cloud Credential'));

      await waitFor(() => {
        expect(screen.getByText('Cloud Provider')).toBeInTheDocument();
        expect(screen.getByText('Secret Manager')).toBeInTheDocument();
        expect(screen.getByText('Default Location')).toBeInTheDocument();
        expect(screen.getByText('VM Size')).toBeInTheDocument();
      });
    });

    test('should allow selecting cloud provider', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: [] });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Add Cloud Credential')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Cloud Credential'));

      await waitFor(() => {
        const cloudProviderSelect = screen.getByLabelText('Cloud Provider');
        fireEvent.mouseDown(cloudProviderSelect);
      });

      await waitFor(() => {
        expect(screen.getByText('Microsoft Azure')).toBeInTheDocument();
        expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
        expect(screen.getByText('Google Cloud Platform')).toBeInTheDocument();
        expect(screen.getByText('Oracle Cloud Infrastructure')).toBeInTheDocument();
      });
    });

    test('should allow selecting secret manager', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: [] });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Add Cloud Credential')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Cloud Credential'));

      await waitFor(() => {
        const secretManagerSelect = screen.getByLabelText('Secret Manager');
        fireEvent.mouseDown(secretManagerSelect);
      });

      await waitFor(() => {
        expect(screen.getByText('HashiCorp Vault')).toBeInTheDocument();
        expect(screen.getByText('AWS Secrets Manager')).toBeInTheDocument();
        expect(screen.getByText('Azure Key Vault')).toBeInTheDocument();
        expect(screen.getByText('Google Cloud Secret Manager')).toBeInTheDocument();
        expect(screen.getByText('OCI Vault')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Credential Dialog', () => {
    beforeEach(async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: mockCredentials });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Azure')).toBeInTheDocument();
      });
    });

    test('should open edit dialog when edit button is clicked', async () => {
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Cloud Credential')).toBeInTheDocument();
      });
    });

    test('should populate form with existing credential data', async () => {
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('eastus')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Standard_D2s_v3')).toBeInTheDocument();
      });
    });
  });

  describe('Credential Actions', () => {
    beforeEach(async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: mockCredentials });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Azure')).toBeInTheDocument();
      });
    });

    test('should call validate API when validate button is clicked', async () => {
      const { apiService } = require('../src/services/api');
      apiService.post.mockResolvedValue({ data: { valid: true } });

      const validateButtons = screen.getAllByText('Validate');
      fireEvent.click(validateButtons[0]);

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith('/api/ccrp/cloud-credentials/1/validate');
      });
    });

    test('should call delete API when delete button is clicked', async () => {
      const { apiService } = require('../src/services/api');
      apiService.delete.mockResolvedValue({});

      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this credential?');
        expect(apiService.delete).toHaveBeenCalledWith('/api/ccrp/cloud-credentials/1');
      });
    });

    test('should not call delete API when user cancels', async () => {
      const { apiService } = require('../src/services/api');
      apiService.delete.mockResolvedValue({});

      // Mock window.confirm to return false
      window.confirm = jest.fn(() => false);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this credential?');
        expect(apiService.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    test('should submit new credential successfully', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: [] });
      apiService.post.mockResolvedValue({ data: { id: 1, cloudProvider: 'AZURE' } });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Add Cloud Credential')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Cloud Credential'));

      await waitFor(() => {
        const cloudProviderSelect = screen.getByLabelText('Cloud Provider');
        fireEvent.mouseDown(cloudProviderSelect);
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Microsoft Azure'));
      });

      await waitFor(() => {
        const defaultLocationField = screen.getByLabelText('Default Location');
        fireEvent.change(defaultLocationField, { target: { value: 'eastus' } });
      });

      await waitFor(() => {
        const vmSizeField = screen.getByLabelText('VM Size');
        fireEvent.change(vmSizeField, { target: { value: 'Standard_D2s_v3' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith('/api/ccrp/cloud-credentials', expect.any(Object));
      });
    });

    test('should handle form submission errors', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: [] });
      apiService.post.mockRejectedValue(new Error('Failed to save credential'));

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Add Cloud Credential')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Cloud Credential'));

      await waitFor(() => {
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('should display error message when API call fails', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockRejectedValue(new Error('Failed to load credentials'));

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load cloud credentials')).toBeInTheDocument();
      });
    });

    test('should show loading state', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<CCRPCloudCredentials />);

      // Loading state should be shown initially
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Access Control', () => {
    test('should show access restricted message for non-CCRP users', () => {
      // Mock user context to return non-CCRP user
      jest.doMock('../src/contexts/UserContext', () => ({
        useUser: () => ({
          currentUser: { partyType: 'TDP' }
        })
      }));

      renderWithProviders(<CCRPCloudCredentials />);

      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.getByText('This page is only available for CCRP (Confidential Clean Room Provider) users.')).toBeInTheDocument();
    });

    test('should show access restricted message when no user', () => {
      // Mock user context to return no user
      jest.doMock('../src/contexts/UserContext', () => ({
        useUser: () => ({
          currentUser: null
        })
      }));

      renderWithProviders(<CCRPCloudCredentials />);

      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.getByText('This page is only available for CCRP (Confidential Clean Room Provider) users.')).toBeInTheDocument();
    });
  });

  describe('Validation Status Display', () => {
    test('should display correct validation status colors', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: mockCredentials });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        // VALID status should have success color
        const validChip = screen.getByText('VALID');
        expect(validChip).toHaveClass('MuiChip-colorSuccess');

        // PENDING status should have warning color
        const pendingChip = screen.getByText('PENDING');
        expect(pendingChip).toHaveClass('MuiChip-colorWarning');

        // INVALID status should have error color
        const invalidChip = screen.getByText('INVALID');
        expect(invalidChip).toHaveClass('MuiChip-colorError');
      });
    });
  });

  describe('Responsive Design', () => {
    test('should display credentials in grid layout', async () => {
      const { apiService } = require('../src/services/api');
      apiService.get.mockResolvedValue({ data: mockCredentials });

      renderWithProviders(<CCRPCloudCredentials />);

      await waitFor(() => {
        const credentialCards = screen.getAllByText(/Microsoft Azure|Amazon Web Services|Google Cloud Platform/);
        expect(credentialCards.length).toBe(3);
      });
    });
  });
}); 