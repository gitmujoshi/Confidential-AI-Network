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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { useUser } from '../contexts/UserContext';

const steps = [
  'Select Dataset',
  'Configure Contract',
  'Review & Create'
];

function CreateContract() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isTDC, isAuthenticated } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedTdp, setSelectedTdp] = useState('');
  const [selectedCcrp, setSelectedCcrp] = useState('');
  const [contractData, setContractData] = useState({
    modelId: '',
    price: '',
    duration: '',
    termsAndConditions: '',
  });

  // Fetch datasets and users
  const { data: datasetsResponse } = useQuery('datasets', apiService.getDatasets);
  const { data: users = [] } = useQuery('users', apiService.getUsers);
  
  const datasets = datasetsResponse?.datasets || [];
  const tdpUsers = users.filter(user => user.partyType === 'TDP');
  const ccrpUsers = users.filter(user => user.partyType === 'CCRP');

  // Create contract mutation
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

  // Role-based access control
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please connect your wallet to access this page.
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

  const handleNext = () => {
    if (activeStep === 0 && !selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }
    if (activeStep === 1 && !isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const isFormValid = () => {
    return (
      contractData.modelId &&
      contractData.price &&
      contractData.duration &&
      contractData.termsAndConditions &&
      selectedTdp
    );
  };



  const handleCreateContract = () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!currentUser?.walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }
    const tdpUser = tdpUsers.find(user => user.id === parseInt(selectedTdp));
    const ccrpUser = ccrpUsers.find(user => user.id === parseInt(selectedCcrp));
    const contractPayload = {
      tdpWalletAddress: tdpUser.walletAddress,
      datasetId: selectedDataset.datasetId,
      modelId: contractData.modelId,
      price: parseFloat(contractData.price),
      duration: parseInt(contractData.duration),
      termsAndConditions: contractData.termsAndConditions,
      ccrpWalletAddress: ccrpUser ? ccrpUser.walletAddress : null,
      tdcWalletAddress: currentUser.walletAddress, // Add TDC wallet address
    };
    createContractMutation.mutate(contractPayload);
  };

  const handleDatasetSelect = (dataset) => {
    setSelectedDataset(dataset);
    // Auto-select the TDP if dataset is selected
    const datasetOwner = tdpUsers.find(user => user.id === dataset.ownerId);
    if (datasetOwner) {
      setSelectedTdp(datasetOwner.id.toString());
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
                <TextField
                  fullWidth
                  label="Model ID"
                  value={contractData.modelId}
                  onChange={(e) => setContractData({ ...contractData, modelId: e.target.value })}
                  placeholder="e.g., GPT-4-FineTuned-v1"
                  helperText="Unique identifier for your AI model"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Training Data Provider</InputLabel>
                  <Select
                    value={selectedTdp}
                    label="Training Data Provider"
                    onChange={(e) => setSelectedTdp(e.target.value)}
                  >
                    {tdpUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                      <strong>Model ID:</strong> {contractData.modelId}
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
                      <strong>TDP:</strong> {tdpUsers.find(u => u.id === parseInt(selectedTdp))?.name}
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