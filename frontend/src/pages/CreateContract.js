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

/**
 * CreateContract Component
 * 
 * This component allows TDC (Training Data Consumer) users to create contracts by:
 * 1. Selecting a dataset from available datasets
 * 2. Configuring contract details (price, duration, terms)
 * 3. Optionally selecting a CCRP (Confidential Clean Room Provider)
 * 4. Reviewing and creating the contract
 * 
 * Role-Based Access Control:
 * - ONLY TDC users can access this component
 * - TDP and CCRP users will see access denied message
 * 
 * Workflow:
 * 1. TDC selects dataset (auto-selects TDP)
 * 2. TDC configures contract parameters
 * 3. TDC optionally selects CCRP
 * 4. TDC reviews contract details
 * 5. TDC creates contract (TDP auto-signs)
 * 
 * Security:
 * - Wallet-based authentication required
 * - All blockchain interactions use MetaMask signing
 * - Private keys never transmitted to backend
 */

// Stepper steps for contract creation process
const steps = [
  'Select Dataset',
  'Configure Contract',
  'Review & Create'
];

function CreateContract() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isTDC, isAuthenticated } = useUser();
  
  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedCcrp, setSelectedCcrp] = useState('');
  const [selectedAiModels, setSelectedAiModels] = useState([]); // Array of selected AI model IDs
  const [contractData, setContractData] = useState({
    price: '',
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
  const { data: ccrpUsers = [] } = useQuery('ccrp-users', apiService.getCCRPUsers);
  const { data: aiModelsResponse, isLoading: aiModelsLoading } = useQuery('ai-models', apiService.getAIModels);
  
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

  // Debug: Monitor selectedDataset state changes
  React.useEffect(() => {
    console.log('🔍 selectedDataset state changed:', selectedDataset);
    console.log('🔍 selectedDataset owner:', selectedDataset?.owner);
    console.log('🔍 selectedDataset owner name:', selectedDataset?.owner?.name);
  }, [selectedDataset]);
  const tdpUsers = datasets
    .map(dataset => dataset.owner)
    .filter((owner, index, self) => 
      owner && self.findIndex(o => o.id === owner.id) === index
    );

  // Contract creation mutation with React Query
  const createContractMutation = useMutation(
    (data) => apiService.createContract(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('contracts');
        toast.success('Contract created successfully!');
        navigate(`/contracts/${response.contract.contractId}`);
      },
      onError: () => {
        toast.error('Failed to create contract');
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
          Create New Contract
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
    if (activeStep === 0 && !selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }
    
    // Ensure dataset is selected when moving to step 1
    if (activeStep === 0 && !selectedDataset) {
      toast.error('Please select a dataset first');
      return;
    }
    
    if (activeStep === 0 && selectedDataset && !selectedDataset.owner) {
      toast.error('Could not determine dataset owner. Please try selecting the dataset again.');
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
   * Validate form data for contract creation
   * @returns {boolean} True if form is valid
   */
  const isFormValid = () => {
    // Basic validation
    const basicValid = (
      contractData.price &&
      contractData.duration &&
      contractData.termsAndConditions &&
      selectedDataset &&
      selectedDataset.owner
    );
    
    // Privacy validation
    const privacyValid = (
      privacyParams.maxPrivacyLoss >= 0.01 && privacyParams.maxPrivacyLoss <= 1.0 &&
      privacyParams.minAccuracy >= 0.5 && privacyParams.minAccuracy <= 0.999
    );

    // At least one privacy technique must be enabled
    const techniqueValid = (
      privacyParams.differentialPrivacy.enabled ||
      privacyParams.federatedLearning.enabled ||
      privacyParams.secureMultiPartyComputation.enabled
    );
    
    const isValid = basicValid && privacyValid && techniqueValid;
    
    if (!isValid) {
      console.log('❌ Form validation failed:', {
        price: !!contractData.price,
        duration: !!contractData.duration,
        termsAndConditions: !!contractData.termsAndConditions,
        selectedDataset: !!selectedDataset,
        datasetOwner: !!selectedDataset?.owner,
        privacyValid,
        techniqueValid
      });
    }
    
    return isValid;
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
    
    // Use dataset owner as TDP
    const tdpUser = selectedDataset.owner;
    const ccrpUser = ccrpUsers.find(user => user.id === parseInt(selectedCcrp));
    
    // Prepare contract payload for API
    const contractPayload = {
      tdpId: tdpUser.id, // Use dataset owner ID
      datasetId: selectedDataset.datasetId,
      aiModelIds: selectedAiModels, // Include selected AI models
      price: parseFloat(contractData.price),
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
    
    console.log('📝 Creating contract with payload:', contractPayload);
    createContractMutation.mutate(contractPayload);
  };

  /**
   * Handle dataset selection
   * @param {Object} dataset - Selected dataset object
   */
  const handleDatasetSelect = (dataset) => {
    console.log('🔍 Selected dataset:', dataset);
    console.log('🔍 Dataset owner info:', dataset.owner);
    
    setSelectedDataset(dataset);
    
    if (dataset.owner) {
      console.log('✅ Dataset owner found:', dataset.owner.name, 'for dataset:', dataset.name);
    } else {
      console.error('❌ Dataset has no owner information:', dataset);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a Dataset
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Choose the AI training dataset you want to use for your model.
            </Typography>
            
            <Grid container spacing={2}>
              {datasets.map((dataset) => (
                <Grid item xs={12} sm={6} md={4} key={dataset.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedDataset?.id === dataset.id ? 2 : 1,
                      borderColor: selectedDataset?.id === dataset.id ? 'primary.main' : 'divider',
                    }}
                    onClick={() => handleDatasetSelect(dataset)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {dataset.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {dataset.description}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight="medium">
                          ${dataset.price}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {dataset.category}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Contract Details
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Fill in the contract details and terms.
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
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Training Data Provider"
                  value={selectedDataset?.owner?.name || ''}
                  disabled
                  placeholder="Select a dataset to see the provider"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>CCRP (Optional)</InputLabel>
                  <Select
                    value={selectedCcrp}
                    label="CCRP (Optional)"
                    onChange={(e) => setSelectedCcrp(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select CCRP (optional)</em>
                    </MenuItem>
                    {ccrpUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price (USD)"
                  type="number"
                  value={contractData.price}
                  onChange={(e) => setContractData({ ...contractData, price: e.target.value })}
                  placeholder="5000"
                  helperText="Contract price in USD"
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
                  label="Terms & Conditions"
                  multiline
                  rows={6}
                  value={contractData.termsAndConditions}
                  onChange={(e) => setContractData({ ...contractData, termsAndConditions: e.target.value })}
                  placeholder="Enter the terms and conditions for this contract..."
                  helperText="Detailed terms and conditions for the contract"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Privacy & Accuracy Requirements
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Maximum Privacy Loss (ε)"
                          type="number"
                          inputProps={{ step: 0.01, min: 0.01, max: 1.0 }}
                          value={privacyParams.maxPrivacyLoss}
                          onChange={(e) => setPrivacyParams({ 
                            ...privacyParams, 
                            maxPrivacyLoss: parseFloat(e.target.value) 
                          })}
                          helperText="Differential privacy epsilon parameter (0.01-1.0, lower = more private)"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Minimum Accuracy (%)"
                          type="number"
                          inputProps={{ step: 0.1, min: 50, max: 99.9 }}
                          value={privacyParams.minAccuracy * 100}
                          onChange={(e) => setPrivacyParams({ 
                            ...privacyParams, 
                            minAccuracy: parseFloat(e.target.value) / 100 
                          })}
                          helperText="Minimum required model accuracy (50%-99.9%)"
                        />
                      </Grid>
                    </Grid>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Privacy Techniques</InputLabel>
                      <Select
                        multiple
                        value={[
                          privacyParams.differentialPrivacy.enabled && 'differential-privacy',
                          privacyParams.federatedLearning.enabled && 'federated-learning',
                          privacyParams.secureMultiPartyComputation.enabled && 'secure-mpc'
                        ].filter(Boolean)}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setPrivacyParams({
                            ...privacyParams,
                            differentialPrivacy: {
                              ...privacyParams.differentialPrivacy,
                              enabled: selected.includes('differential-privacy')
                            },
                            federatedLearning: {
                              ...privacyParams.federatedLearning,
                              enabled: selected.includes('federated-learning')
                            },
                            secureMultiPartyComputation: {
                              ...privacyParams.secureMultiPartyComputation,
                              enabled: selected.includes('secure-mpc')
                            }
                          });
                        }}
                        label="Privacy Techniques"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((technique) => (
                              <Chip 
                                key={technique} 
                                label={technique.replace('-', ' ')} 
                                size="small" 
                              />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="differential-privacy">
                          <Checkbox checked={privacyParams.differentialPrivacy.enabled} />
                          <ListItemText 
                            primary="Differential Privacy"
                            secondary="Adds noise to protect individual data"
                          />
                        </MenuItem>
                        <MenuItem value="federated-learning">
                          <Checkbox checked={privacyParams.federatedLearning.enabled} />
                          <ListItemText 
                            primary="Federated Learning"
                            secondary="Train model without sharing raw data"
                          />
                        </MenuItem>
                        <MenuItem value="secure-mpc">
                          <Checkbox checked={privacyParams.secureMultiPartyComputation.enabled} />
                          <ListItemText 
                            primary="Secure Multi-Party Computation"
                            secondary="Compute on encrypted data"
                          />
                        </MenuItem>
                      </Select>
                      <FormHelperText>Select privacy-preserving techniques to be used</FormHelperText>
                    </FormControl>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Privacy-Accuracy Trade-off:</strong> Lower privacy loss (ε) provides better privacy but may reduce model accuracy. 
                        Higher minimum accuracy requirements may limit privacy protection.
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>
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
              Please review all the details before creating the contract.
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Selected Dataset
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Name:</strong> {selectedDataset?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Category:</strong> {selectedDataset?.category}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Size:</strong> {selectedDataset?.size} MB
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Records:</strong> {selectedDataset?.recordCount?.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contract Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Model ID:</strong> <em>Not applicable</em>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Price:</strong> ${contractData.price}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Duration:</strong> {contractData.duration} days
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>TDP:</strong> {selectedDataset?.owner?.name || 'Not selected'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>CCRP:</strong> {selectedCcrp ? ccrpUsers.find(u => u.id === parseInt(selectedCcrp))?.name : 'Not selected'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Terms & Conditions
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {contractData.termsAndConditions}
                </Typography>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> After creating the contract, the TDP will be notified and must sign the contract before it becomes active. 
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
        Create New Contract
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
                  {createContractMutation.isLoading ? 'Creating...' : 'Create Contract'}
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