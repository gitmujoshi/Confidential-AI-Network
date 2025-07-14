import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  CircularProgress,
  Chip,
  Checkbox,
  ListItemText,
  FormHelperText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';
import MultiDatasetSelector from '../components/MultiDatasetSelector';
import MultiCCRPSelector from '../components/MultiCCRPSelector';

/**
 * CreateContract Component - Multi-TDP Support
 * 
 * This component allows TDC (Training Data Consumer) users to create contracts by:
 * 1. Selecting up to 3 datasets from different TDPs
 * 2. Configuring contract details (price, duration, terms)
 * 3. Optionally selecting a CCRP (Confidential Clean Room Provider)
 * 4. Reviewing and creating the contract
 * 
 * Multi-TDP Features:
 * - Select up to 3 datasets from different TDPs
 * - Individual pricing per dataset
 * - TDP-specific signing and payment tracking
 * - Multi-TDP contract status monitoring
 * 
 * Role-Based Access Control:
 * - ONLY TDC users can access this component
 * - TDP and CCRP users will see access denied message
 * 
 * Workflow:
 * 1. TDC selects up to 3 datasets from different TDPs
 * 2. TDC configures contract parameters
 * 3. TDC optionally selects CCRP
 * 4. TDC reviews contract details
 * 5. TDC creates contract (all TDPs notified)
 * 
 * Security:
 * - Wallet-based authentication required
 * - All blockchain interactions use MetaMask signing
 * - Private keys never transmitted to backend
 */

// Stepper steps for contract creation process
const steps = [
  'Select Datasets (1-3)',
  'Configure Contract',
  'Review & Create'
];

function CreateContract() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isTDC, isAuthenticated } = useUser();
  
  // Component state - Updated for multi-TDP
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDatasets, setSelectedDatasets] = useState([]); // Array of selected datasets
  const [datasetPrices, setDatasetPrices] = useState({}); // Individual prices per dataset
  const [selectedCcrp, setSelectedCcrp] = useState('');
  const [selectedCloudProvider, setSelectedCloudProvider] = useState('');
  const [selectedAiModels, setSelectedAiModels] = useState([]); // Array of selected AI model IDs
  const [contractData, setContractData] = useState({
    duration: '',
    termsAndConditions: '',
  });
  
  // Add privacy parameters state
  const [privacyParams, setPrivacyParams] = useState({
    maxPrivacyLoss: 0.1,
    minAccuracy: 0.95,
    differentialPrivacy: {
      enabled: true,
      epsilon: 0.1,
      delta: 1e-5
    },
    federatedLearning: {
      enabled: true,
      aggregationMethod: 'secure-aggregation',
      communicationRounds: 100
    },
    secureMultiPartyComputation: {
      enabled: true,
      protocol: 'shamir-secret-sharing',
      threshold: 3
    }
  });

  // Fetch datasets, CCRP users, and AI models for dropdowns
  const { data: datasetsResponse, isLoading: datasetsLoading } = useQuery('datasets', apiService.getDatasets);
  const { data: aiModelsResponse, isLoading: aiModelsLoading } = useQuery('ai-models', apiService.getAIModels);
  
  // Manual CCRP users fetch to avoid React Query parameter injection
  const [ccrpUsersResponse, setCcrpUsersResponse] = React.useState(null);
  const [ccrpError, setCcrpError] = React.useState(null);
  
  React.useEffect(() => {
    const fetchCcrpUsers = async () => {
      try {
        console.log('🔍 Fetching CCRP users manually...');
        console.log('🔍 Auth token:', localStorage.getItem('authToken'));
        console.log('🔍 Current user:', currentUser);
        const response = await apiService.getCCRPUsers();
        console.log('✅ CCRP users fetched:', response);
        setCcrpUsersResponse(response);
        setCcrpError(null);
      } catch (error) {
        console.error('❌ CCRP users fetch error:', error);
        console.error('❌ Error response:', error.response?.data);
        setCcrpError(error);
        setCcrpUsersResponse(null);
      }
    };
    
    fetchCcrpUsers();
  }, [currentUser]);
  
  const ccrpUsers = ccrpUsersResponse?.ccrpUsers || [];
  
  // Debug CCRP users
  React.useEffect(() => {
    console.log('🔍 CCRP Users Response:', ccrpUsersResponse);
    console.log('🔍 CCRP Users:', ccrpUsers);
    console.log('🔍 CCRP Error:', ccrpError);
    console.log('🔍 Current User:', currentUser);
    console.log('🔍 Is Authenticated:', isAuthenticated);
  }, [ccrpUsersResponse, ccrpUsers, ccrpError, currentUser, isAuthenticated]);
  
  // Extract AI models from response
  const aiModels = aiModelsResponse?.models || [];
  
  // Get datasets and extract unique TDP users from dataset owners
  const datasets = datasetsResponse?.datasets || [];
  
  // Debug: Log the first dataset's owner when data changes
  React.useEffect(() => {
    if (datasets.length > 0) {
      console.log('📊 First dataset owner in useEffect:', datasets[0].owner);
      console.log('📊 First dataset owner name:', datasets[0].owner?.name);
      console.log('📊 Datasets response:', datasetsResponse);
    }
  }, [datasets, datasetsResponse]);

  // Debug: Monitor selectedDatasets state changes
  React.useEffect(() => {
    console.log('🔍 selectedDatasets state changed:', selectedDatasets);
    console.log('🔍 datasetPrices state changed:', datasetPrices);
  }, [selectedDatasets, datasetPrices]);

  const tdpUsers = datasets
    .map(dataset => dataset.owner)
    .filter((owner, index, self) => 
      owner && self.findIndex(o => o.id === owner.id) === index
    );

  // Contract creation mutation with React Query
  const createContractMutation = useMutation(
    (data) => apiService.createMultiTDPContract(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('contracts');
        toast.success('Multi-TDP contract created successfully!');
        navigate(`/contracts/${response.contract.contractId}`);
      },
      onError: (error) => {
        console.error('Contract creation error:', error);
        const errorMsg = error.response?.data?.error || 'Failed to create contract';
        toast.error(errorMsg);
      },
    }
  );

  // Role-based access control - only TDC can create contracts
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please log in to access this page.
        </Alert>
      </Box>
    );
  }

  if (!isTDC) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Only TDC (Training Data Consumer) users can create contracts. 
          Your role is: {currentUser?.partyType}
        </Alert>
      </Box>
    );
  }

  // Show loading state while fetching data
  if (datasetsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Multi-TDP Contract
        </Typography>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading datasets...
        </Typography>
      </Box>
    );
  }

  /**
   * Handle next step in the stepper
   * Validates current step before proceeding
   */
  const handleNext = () => {
    if (activeStep === 0 && selectedDatasets.length === 0) {
      toast.error('Please select at least one dataset');
      return;
    }
    
    if (activeStep === 0 && selectedDatasets.length > 3) {
      toast.error('You can only select up to 3 datasets');
      return;
    }
    
    if (activeStep === 1 && !isFormValid()) {
      toast.error('Please fill in all required fields and privacy requirements');
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  /**
   * Handle previous step in the stepper
   */
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  /**
   * Validate form data
   */
  const isFormValid = () => {
    // Check if at least one dataset is selected
    if (selectedDatasets.length === 0) {
      return false;
    }

    // Check if all selected datasets have prices
    const allDatasetsHavePrices = selectedDatasets.every(dataset => 
      datasetPrices[dataset.id] && parseFloat(datasetPrices[dataset.id]) > 0
    );

    if (!allDatasetsHavePrices) {
      return false;
    }

    // Check contract data
    if (!contractData.duration || !contractData.termsAndConditions) {
      return false;
    }

    // Check privacy requirements
    if (privacyParams.maxPrivacyLoss <= 0 || privacyParams.minAccuracy <= 0) {
      return false;
    }

    return true;
  };

  /**
   * Handle contract creation
   * Prepares contract data and calls API
   */
  const handleCreateContract = () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields and privacy requirements');
      return;
    }
    
    // Prepare datasets array with individual prices
    const datasetsWithPrices = selectedDatasets.map(dataset => ({
      datasetId: dataset.datasetId,
      tdpId: dataset.owner.id,
      price: parseFloat(datasetPrices[dataset.id]),
      datasetName: dataset.name,
      tdpName: dataset.owner.name
    }));
    
    const ccrpUser = ccrpUsers.find(user => user.id === parseInt(selectedCcrp));
    
    // Prepare contract payload for API
    const contractPayload = {
      datasets: datasetsWithPrices,
      aiModelIds: selectedAiModels, // Include selected AI models
      duration: parseInt(contractData.duration),
      termsAndConditions: contractData.termsAndConditions,
      ccrpId: ccrpUser ? ccrpUser.id : null, // Use user ID instead of wallet address
      tdcId: currentUser.id, // Use current user ID
      // Add privacy requirements
      privacyRequirements: {
        maxPrivacyLoss: privacyParams.maxPrivacyLoss,
        minAccuracy: privacyParams.minAccuracy,
        differentialPrivacy: privacyParams.differentialPrivacy,
        federatedLearning: privacyParams.federatedLearning,
        secureMultiPartyComputation: privacyParams.secureMultiPartyComputation
      }
    };
    
    console.log('📝 Creating multi-TDP contract with payload:', contractPayload);
    createContractMutation.mutate(contractPayload);
  };

  /**
   * Handle dataset selection/deselection
   * @param {Object} dataset - Selected dataset object
   */
  const handleDatasetToggle = (dataset) => {
    console.log('🔍 Toggling dataset:', dataset);
    console.log('🔍 Dataset owner info:', dataset.owner);
    
    const isSelected = selectedDatasets.some(d => d.id === dataset.id);
    
    if (isSelected) {
      // Remove dataset
      setSelectedDatasets(prev => prev.filter(d => d.id !== dataset.id));
      setDatasetPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[dataset.id];
        return newPrices;
      });
    } else {
      // Add dataset (check limit)
      if (selectedDatasets.length >= 3) {
        toast.error('You can only select up to 3 datasets');
        return;
      }
      
      // Check if TDP is already selected
      const tdpAlreadySelected = selectedDatasets.some(d => d.owner.id === dataset.owner.id);
      if (tdpAlreadySelected) {
        toast.error('You can only select one dataset per TDP');
        return;
      }
      
      setSelectedDatasets(prev => [...prev, dataset]);
      // Set default price to dataset's base price
      setDatasetPrices(prev => ({
        ...prev,
        [dataset.id]: dataset.price.toString()
      }));
    }
  };

  /**
   * Handle price change for a specific dataset
   * @param {number} datasetId - Dataset ID
   * @param {string} price - New price
   */
  const handlePriceChange = (datasetId, price) => {
    setDatasetPrices(prev => ({
      ...prev,
      [datasetId]: price
    }));
  };

  const handleCcrpToggle = (ccrpId) => {
    setSelectedCcrp(ccrpId);
  };

  const handleCloudProviderChange = (cloudProvider) => {
    setSelectedCloudProvider(cloudProvider);
  };

  // Manual test function for debugging
  const testCcrpApi = async () => {
    try {
      console.log('🧪 Testing CCRP API manually...');
      const response = await apiService.getCCRPUsers();
      console.log('✅ Manual CCRP API Response:', response);
    } catch (error) {
      console.error('❌ Manual CCRP API Error:', error);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Datasets (1-3 from Different TDPs)
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Choose 1 to 3 AI training datasets from different Training Data Providers (TDPs).
              Use the checkboxes to select datasets. Each dataset will have its own pricing and TDP.
            </Typography>
            
            <MultiDatasetSelector
              datasets={datasets}
              selectedDatasets={selectedDatasets}
              datasetPrices={datasetPrices}
              onDatasetToggle={handleDatasetToggle}
              onPriceChange={handlePriceChange}
              maxDatasets={3}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Contract Details
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Fill in the contract details and terms for your multi-TDP contract.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>AI Models</InputLabel>
                  <Select
                    multiple
                    value={selectedAiModels || []}
                    onChange={(e) => setSelectedAiModels(e.target.value)}
                    label="AI Models"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((modelId) => {
                          const model = aiModels?.find(m => m.id === modelId);
                          return (
                            <Chip 
                              key={modelId} 
                              label={model?.name || modelId} 
                              size="small" 
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {aiModels?.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        <Checkbox checked={(selectedAiModels || []).indexOf(model.id) > -1} />
                        <ListItemText 
                          primary={model.name}
                          secondary={`${model.type} - ${model.architecture}`}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select AI models to be used in this contract (optional)</FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  CCRP Provider Selection (Optional)
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Select a CCRP provider to handle confidential computing environments for your contract.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={testCcrpApi}
                  sx={{ mb: 2 }}
                >
                  Test CCRP API
                </Button>
                <MultiCCRPSelector
                  ccrpUsers={ccrpUsers}
                  selectedCcrp={selectedCcrp}
                  selectedCloudProvider={selectedCloudProvider}
                  onCcrpToggle={handleCcrpToggle}
                  onCloudProviderChange={handleCloudProviderChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration (days)"
                  type="number"
                  value={contractData.duration}
                  onChange={(e) => setContractData({ ...contractData, duration: e.target.value })}
                  placeholder="30"
                  helperText="Contract duration in days"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Terms and Conditions"
                  value={contractData.termsAndConditions}
                  onChange={(e) => setContractData({ ...contractData, termsAndConditions: e.target.value })}
                  placeholder="Enter contract terms and conditions..."
                  helperText="Detailed terms and conditions for the contract"
                />
              </Grid>
              
              {/* Privacy Requirements */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Privacy Requirements
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Privacy Loss"
                      type="number"
                      value={privacyParams.maxPrivacyLoss}
                      onChange={(e) => setPrivacyParams({ ...privacyParams, maxPrivacyLoss: parseFloat(e.target.value) })}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      helperText="Maximum allowed privacy loss (0-1)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Min Accuracy"
                      type="number"
                      value={privacyParams.minAccuracy}
                      onChange={(e) => setPrivacyParams({ ...privacyParams, minAccuracy: parseFloat(e.target.value) })}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      helperText="Minimum required accuracy (0-1)"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Contract Details
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Please review the contract details before creating the contract.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Selected Datasets
                    </Typography>
                    <MultiDatasetSelector
                      datasets={selectedDatasets}
                      selectedDatasets={selectedDatasets}
                      datasetPrices={datasetPrices}
                      onDatasetToggle={handleDatasetToggle}
                      onPriceChange={handlePriceChange}
                      maxDatasets={3}
                      disabled={true}
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contract Summary
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Total Price:</strong> ${selectedDatasets.reduce((sum, dataset) => 
                      sum + parseFloat(datasetPrices[dataset.id] || 0), 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Duration:</strong> {contractData.duration} days
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>AI Models:</strong> {selectedAiModels.length} selected
                    </Typography>
                    {selectedCcrp && (
                      <Typography variant="body2" paragraph>
                        <strong>CCRP:</strong> {ccrpUsers.find(u => u.id === parseInt(selectedCcrp))?.name}
                        {ccrpUsers.find(u => u.id === parseInt(selectedCcrp))?.cloudProviders && 
                         ccrpUsers.find(u => u.id === parseInt(selectedCcrp))?.cloudProviders.length > 0 && (
                          <span> ({ccrpUsers.find(u => u.id === parseInt(selectedCcrp))?.cloudProviders.join(', ')})</span>
                        )}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Privacy Requirements
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Max Privacy Loss:</strong> {privacyParams.maxPrivacyLoss}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Min Accuracy:</strong> {privacyParams.minAccuracy}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Differential Privacy:</strong> {privacyParams.differentialPrivacy.enabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Federated Learning:</strong> {privacyParams.federatedLearning.enabled ? 'Enabled' : 'Disabled'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> After creating the contract, all TDPs will be notified and must sign the contract before it becomes active. 
                {selectedCcrp && ' If CCRP is selected, they will also be notified and can sign the contract.'}
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New Multi-TDP Contract
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {renderStepContent(activeStep)}
          
          <Divider sx={{ my: 3 }} />
          
          <Box display="flex" justifyContent="space-between">
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleCreateContract}
                  disabled={createContractMutation.isLoading || !isFormValid()}
                >
                  {createContractMutation.isLoading ? 'Creating...' : 'Create Multi-TDP Contract'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateContract; 