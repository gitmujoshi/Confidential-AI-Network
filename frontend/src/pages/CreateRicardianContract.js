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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  Switch,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Verified as VerifiedIcon,
  Cloud as CloudIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';

/**
 * CreateRicardianContract Component
 * 
 * This component allows TDC (Training Data Consumer) users to create Ricardian contracts.
 * Ricardian contracts combine human-readable legal documents with machine-executable smart contracts.
 * 
 * Features:
 * - Legal document generation based on contract type
 * - Cryptographic hash creation for legal document
 * - Ricardian signature binding legal to smart contract
 * - Smart contract deployment
 * - Multi-KMS support for data encryption
 * - Azure Confidential Computing integration
 * 
 * Role-Based Access Control:
 * - ONLY TDC users can access this component
 * - TDP and CCRP users will see access denied message
 * 
 * Workflow:
 * 1. TDC selects contract type and dataset
 * 2. TDC configures contract parameters and environment specs
 * 3. TDC reviews legal document and smart contract details
 * 4. TDC creates Ricardian contract (TDP auto-signs)
 * 
 * Security:
 * - Wallet-based authentication required
 * - All blockchain interactions use MetaMask signing
 * - Private keys never transmitted to backend
 * - Cryptographic binding ensures integrity
 */

// Stepper steps for Ricardian contract creation process
const steps = [
  'Select Contract Type & Dataset',
  'Configure Contract & Environment',
  'Review Legal Document & Smart Contract',
  'Create Ricardian Contract'
];

function CreateRicardianContract() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isTDC, isAuthenticated } = useUser();
  
  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [selectedContractType, setSelectedContractType] = useState('AI_TRAINING');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedCcrp, setSelectedCcrp] = useState('');
  const [selectedAiModels, setSelectedAiModels] = useState([]); // Array of selected AI model IDs
  const [contractData, setContractData] = useState({
    price: '',
    duration: '',
    termsAndConditions: '',
  });
  const [environmentSpecs, setEnvironmentSpecs] = useState({
    infrastructure: {
      computeType: 'confidential-vm',
      memoryGB: 32,
      cpuCores: 8,
      gpuType: 'V100',
      gpuCount: 2
    },
    security: {
      attestationRequired: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      networkIsolation: true
    },
    kms: {
      provider: 'azure-key-vault',
      keyName: 'training-data-key',
      region: 'eastus'
    }
  });
  const [trainingParams, setTrainingParams] = useState({
    modelType: 'transformer',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
    maxEpochs: 100,
    batchSize: 32,
    learningRate: 0.001
  });
  const [legalDocument, setLegalDocument] = useState(null);
  const [smartContractData, setSmartContractData] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [contractCreationError, setContractCreationError] = useState(null);
  const [createdContract, setCreatedContract] = useState(null);

  // Fetch data
  const { data: datasetsResponse, isLoading: datasetsLoading } = useQuery('datasets', apiService.getDatasets);
  const { data: ccrpUsers = [] } = useQuery('ccrp-users', apiService.getCCRPUsers);
  const { data: supportedTypes = [] } = useQuery('contract-types', apiService.getSupportedContractTypes);
  const { data: aiModelsResponse, isLoading: aiModelsLoading } = useQuery('ai-models', apiService.getAIModels);
  
  // Get datasets and extract unique TDP users from dataset owners
  const datasets = datasetsResponse?.datasets || [];
  const tdpUsers = datasets
    .map(dataset => dataset.owner)
    .filter((owner, index, self) => 
      owner && self.findIndex(o => o.id === owner.id) === index
    );

  // Ricardian contract creation mutation
  const createRicardianContractMutation = useMutation(
    (data) => apiService.createRicardianContract(data),
    {
      onSuccess: (response) => {
        setContractCreationError(null);
        setCreatedContract(response);
        queryClient.invalidateQueries('contracts');
        toast.success('Ricardian contract created successfully!');
        // Don't navigate immediately, show the contract document first
      },
      onError: (error) => {
        console.error('Ricardian contract creation error:', error);
        let errorMsg = 'Failed to create Ricardian contract';
        if (error?.response?.data?.error) {
          errorMsg = error.response.data.error;
          if (error.response.data.stack) {
            errorMsg += '\n' + error.response.data.stack;
          }
        } else if (error?.message) {
          errorMsg = error.message;
        }
        setContractCreationError(errorMsg);
        toast.error('Failed to create Ricardian contract');
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
          Only TDC (Training Data Consumer) users can create Ricardian contracts. 
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
          Create Ricardian Contract
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
    if (activeStep === 0 && (!selectedContractType || !selectedDataset)) {
      toast.error('Please select both contract type and dataset');
      return;
    }
    
    if (activeStep === 1 && !isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (activeStep === 2) {
      // Generate preview of legal document and smart contract
      generatePreview();
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  /**
   * Handle previous step in the stepper
   */
  const handleBack = () => {
    setContractCreationError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  /**
   * Validate form data for contract creation
   * @returns {boolean} True if form is valid
   */
  const isFormValid = () => {
    return (
      contractData.price &&
      contractData.duration &&
      contractData.termsAndConditions
    );
  };

  /**
   * Generate preview of legal document and smart contract
   */
  const generatePreview = async () => {
    try {
      setIsGeneratingPreview(true);
      toast.loading('Generating legal document and smart contract preview...', { id: 'preview-generation' });
      
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This would typically call the backend to generate a preview
      // For now, we'll create mock data
      setLegalDocument({
        metadata: {
          contractId: 'PREVIEW-CONTRACT-ID',
          createdAt: new Date().toISOString(),
          legalDocumentHash: '0x' + 'a'.repeat(64),
          smartContractAddress: '0x' + 'b'.repeat(40),
          ricardianSignature: '0x' + 'c'.repeat(132)
        },
        legalDocument: {
          effectiveDate: new Date().toISOString().split('T')[0],
          expirationDate: new Date(Date.now() + contractData.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          parties: {
            dataProvider: {
              name: selectedDataset?.owner?.name || 'TDP Name',
              email: selectedDataset?.owner?.email || 'tdp@example.com',
              blockchainAddress: selectedDataset?.owner?.walletAddress || '0x...',
              did: selectedDataset?.owner?.did || 'did:web:example.com'
            },
            modelTrainer: {
              name: currentUser?.name || 'TDC Name',
              email: currentUser?.email || 'tdc@example.com',
              blockchainAddress: currentUser?.walletAddress || '0x...',
              did: currentUser?.did || 'did:web:example.com'
            }
          }
        }
      });

      setSmartContractData({
        address: '0x' + 'd'.repeat(40),
        network: 'goerli',
        contractId: Math.floor(Math.random() * 1000000),
        transactionHash: '0x' + 'e'.repeat(64)
      });
      
      toast.success('Preview generated successfully!', { id: 'preview-generation' });
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview', { id: 'preview-generation' });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  /**
   * Handle dataset selection
   */
  const handleDatasetSelect = (dataset) => {
    setSelectedDataset(dataset);
    console.log('Selected dataset:', dataset);
  };

  /**
   * Handle contract creation
   */
  const handleCreateRicardianContract = () => {
    if (!selectedDataset || !isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const contractPayload = {
      tdpId: selectedDataset.owner.id,
      datasetId: selectedDataset.datasetId,
      aiModelIds: selectedAiModels, // Include selected AI models
      price: parseFloat(contractData.price),
      duration: parseInt(contractData.duration),
      termsAndConditions: contractData.termsAndConditions,
      ccrpId: selectedCcrp || null,
      contractType: selectedContractType,
      environmentSpecs,
      trainingParams,
      kmsConfigs: environmentSpecs.kms
    };

    createRicardianContractMutation.mutate(contractPayload);
  };

  const saveContractLocally = () => {
    if (!createdContract) return;
    
    const contractData = {
      contract: createdContract.contract,
      legalDocument: createdContract.legalDocument,
      smartContractData: createdContract.smartContractData,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(contractData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ricardian-contract-${createdContract.contract.contractId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Contract document saved locally!');
  };

  const saveLegalDocument = () => {
    if (!createdContract?.legalDocument) return;
    
    const legalDoc = createdContract.legalDocument;
    const blob = new Blob([JSON.stringify(legalDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-document-${createdContract.contract.contractId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Legal document saved locally!');
  };

  /**
   * Render step content based on current step
   */
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Contract Type & Dataset
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contract Type
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Contract Type</InputLabel>
                      <Select
                        value={selectedContractType}
                        onChange={(e) => setSelectedContractType(e.target.value)}
                        label="Contract Type"
                      >
                        {supportedTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Ricardian contracts combine human-readable legal documents with machine-executable smart contracts.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Select Dataset
                    </Typography>
                    <Grid container spacing={2}>
                      {datasets.map((dataset) => (
                        <Grid item xs={12} key={dataset.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              cursor: 'pointer',
                              borderColor: selectedDataset?.id === dataset.id ? 'primary.main' : 'divider',
                              backgroundColor: selectedDataset?.id === dataset.id ? 'primary.50' : 'background.paper'
                            }}
                            onClick={() => handleDatasetSelect(dataset)}
                          >
                            <CardContent>
                              <Typography variant="h6">{dataset.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {dataset.description}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Owner: {dataset.owner?.name}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Category: {dataset.category}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Contract & Environment
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contract Details
                    </Typography>
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel>AI Models</InputLabel>
                      <Select
                        multiple
                        value={selectedAiModels}
                        onChange={(e) => setSelectedAiModels(e.target.value)}
                        label="AI Models"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((modelId) => {
                              const model = aiModelsResponse?.models?.find(m => m.id === modelId);
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
                        {aiModelsResponse?.models?.map((model) => (
                          <MenuItem key={model.id} value={model.id}>
                            <Checkbox checked={selectedAiModels.indexOf(model.id) > -1} />
                            <ListItemText 
                              primary={model.name}
                              secondary={`${model.type} - ${model.architecture}`}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                      <Typography variant="caption" color="text.secondary">
                        Select AI models to be used in this contract (optional)
                      </Typography>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Price (USD)"
                      type="number"
                      value={contractData.price}
                      onChange={(e) => setContractData({ ...contractData, price: e.target.value })}
                      margin="normal"
                    />
                    
                    <TextField
                      fullWidth
                      label="Duration (days)"
                      type="number"
                      value={contractData.duration}
                      onChange={(e) => setContractData({ ...contractData, duration: e.target.value })}
                      margin="normal"
                    />
                    
                    <TextField
                      fullWidth
                      label="Terms and Conditions"
                      multiline
                      rows={4}
                      value={contractData.termsAndConditions}
                      onChange={(e) => setContractData({ ...contractData, termsAndConditions: e.target.value })}
                      margin="normal"
                    />
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel>CCRP (Optional)</InputLabel>
                      <Select
                        value={selectedCcrp}
                        onChange={(e) => setSelectedCcrp(e.target.value)}
                        label="CCRP (Optional)"
                      >
                        <MenuItem value="">
                          <em>No CCRP selected</em>
                        </MenuItem>
                        {ccrpUsers.map((ccrp) => (
                          <MenuItem key={ccrp.id} value={ccrp.id}>
                            {ccrp.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Environment Specifications
                    </Typography>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          <StorageIcon sx={{ mr: 1 }} />
                          Infrastructure
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>Compute Type</InputLabel>
                              <Select
                                value={environmentSpecs.infrastructure.computeType}
                                onChange={(e) => setEnvironmentSpecs({
                                  ...environmentSpecs,
                                  infrastructure: {
                                    ...environmentSpecs.infrastructure,
                                    computeType: e.target.value
                                  }
                                })}
                                label="Compute Type"
                              >
                                <MenuItem value="confidential-vm">Confidential VM</MenuItem>
                                <MenuItem value="sgx-enclave">SGX Enclave</MenuItem>
                                <MenuItem value="sev-snp">SEV-SNP</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Memory (GB)"
                              type="number"
                              value={environmentSpecs.infrastructure.memoryGB}
                              onChange={(e) => setEnvironmentSpecs({
                                ...environmentSpecs,
                                infrastructure: {
                                  ...environmentSpecs.infrastructure,
                                  memoryGB: parseInt(e.target.value)
                                }
                              })}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="CPU Cores"
                              type="number"
                              value={environmentSpecs.infrastructure.cpuCores}
                              onChange={(e) => setEnvironmentSpecs({
                                ...environmentSpecs,
                                infrastructure: {
                                  ...environmentSpecs.infrastructure,
                                  cpuCores: parseInt(e.target.value)
                                }
                              })}
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          <SecurityIcon sx={{ mr: 1 }} />
                          Security
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={environmentSpecs.security.attestationRequired}
                              onChange={(e) => setEnvironmentSpecs({
                                ...environmentSpecs,
                                security: {
                                  ...environmentSpecs.security,
                                  attestationRequired: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Attestation Required"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={environmentSpecs.security.encryptionAtRest}
                              onChange={(e) => setEnvironmentSpecs({
                                ...environmentSpecs,
                                security: {
                                  ...environmentSpecs.security,
                                  encryptionAtRest: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Encryption at Rest"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={environmentSpecs.security.encryptionInTransit}
                              onChange={(e) => setEnvironmentSpecs({
                                ...environmentSpecs,
                                security: {
                                  ...environmentSpecs.security,
                                  encryptionInTransit: e.target.checked
                                }
                              })}
                            />
                          }
                          label="Encryption in Transit"
                        />
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          <KeyIcon sx={{ mr: 1 }} />
                          KMS Configuration
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormControl fullWidth>
                          <InputLabel>KMS Provider</InputLabel>
                          <Select
                            value={environmentSpecs.kms.provider}
                            onChange={(e) => setEnvironmentSpecs({
                              ...environmentSpecs,
                              kms: {
                                ...environmentSpecs.kms,
                                provider: e.target.value
                              }
                            })}
                            label="KMS Provider"
                          >
                            <MenuItem value="azure-key-vault">Azure Key Vault</MenuItem>
                            <MenuItem value="aws-kms">AWS KMS</MenuItem>
                            <MenuItem value="google-cloud-kms">Google Cloud KMS</MenuItem>
                            <MenuItem value="hashicorp-vault">Hashicorp Vault</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          label="Key Name"
                          value={environmentSpecs.kms.keyName}
                          onChange={(e) => setEnvironmentSpecs({
                            ...environmentSpecs,
                            kms: {
                              ...environmentSpecs.kms,
                              keyName: e.target.value
                            }
                          })}
                          margin="normal"
                        />
                      </AccordionDetails>
                    </Accordion>
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
              Review Legal Document & Smart Contract
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <DescriptionIcon sx={{ mr: 1 }} />
                      Legal Document Preview
                    </Typography>
                    
                    {isGeneratingPreview ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          Generating legal document...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Creating cryptographic binding and legal terms
                        </Typography>
                      </Box>
                    ) : legalDocument ? (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Contract ID: {legalDocument.metadata.contractId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Effective Date: {legalDocument.legalDocument.effectiveDate}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expiration Date: {legalDocument.legalDocument.expirationDate}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Parties:
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="Data Provider (TDP)"
                              secondary={legalDocument.legalDocument.parties.dataProvider.name}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Model Trainer (TDC)"
                              secondary={legalDocument.legalDocument.parties.modelTrainer.name}
                            />
                          </ListItem>
                        </List>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Cryptographic Binding:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          Hash: {legalDocument.metadata.legalDocumentHash}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          Signature: {legalDocument.metadata.ricardianSignature}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Click "Next" to generate preview
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <CodeIcon sx={{ mr: 1 }} />
                      Smart Contract Preview
                    </Typography>
                    
                    {isGeneratingPreview ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          Deploying smart contract...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Creating blockchain transaction and contract binding
                        </Typography>
                      </Box>
                    ) : smartContractData ? (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Contract Address: {smartContractData.address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Network: {smartContractData.network}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Contract ID: {smartContractData.contractId}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Features:
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <VerifiedIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Automated execution" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <SecurityIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Cryptographic binding" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <CloudIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Azure Confidential Computing" />
                          </ListItem>
                        </List>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Click "Next" to generate preview
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Create Ricardian Contract
            </Typography>
            {contractCreationError && (
              <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                <Typography variant="subtitle2">Contract Creation Error</Typography>
                <Typography variant="body2">{contractCreationError}</Typography>
              </Alert>
            )}
            {createdContract ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">✅ Contract Created Successfully!</Typography>
                  <Typography variant="body2">
                    Your Ricardian contract has been created and deployed to the blockchain.
                  </Typography>
                </Alert>
                
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📄 Contract Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Contract ID:</Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace' }}>
                          {createdContract.contract.contractId}
                        </Typography>
                        <Typography variant="subtitle2">Status:</Typography>
                        <Typography variant="body2" gutterBottom>
                          {createdContract.contract.status}
                        </Typography>
                        <Typography variant="subtitle2">Smart Contract Address:</Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace' }}>
                          {createdContract.smartContractData?.address}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Legal Document Hash:</Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {createdContract.contract.legalDocumentHash}
                        </Typography>
                        <Typography variant="subtitle2">Ricardian Signature:</Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {createdContract.contract.ricardianSignature}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={saveContractLocally}
                        startIcon={<DescriptionIcon />}
                      >
                        Download Complete Contract
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={saveLegalDocument}
                        startIcon={<DescriptionIcon />}
                      >
                        Download Legal Document
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/contracts/${createdContract.contract.contractId}`)}
                        startIcon={<VerifiedIcon />}
                      >
                        View in Contracts
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      📋 Complete Legal Document
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                      <pre style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.8rem', 
                        backgroundColor: '#f5f5f5', 
                        padding: '16px',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {JSON.stringify(createdContract.legalDocument, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      ⚡ Smart Contract Data
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                      <pre style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.8rem', 
                        backgroundColor: '#f5f5f5', 
                        padding: '16px',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {JSON.stringify(createdContract.smartContractData, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  This will create a Ricardian contract that combines human-readable legal documents 
                  with machine-executable smart contracts. The contract will be cryptographically 
                  bound and deployed to the blockchain.
                </Typography>
              </Alert>
            )}
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <DescriptionIcon sx={{ mr: 1 }} />
                      Legal Document Preview
                    </Typography>
                    {legalDocument ? (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Contract ID: {legalDocument.metadata.contractId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Effective Date: {legalDocument.legalDocument.effectiveDate}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expiration Date: {legalDocument.legalDocument.expirationDate}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Parties:
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="Data Provider (TDP)"
                              secondary={legalDocument.legalDocument.parties.dataProvider.name}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Model Trainer (TDC)"
                              secondary={legalDocument.legalDocument.parties.modelTrainer.name}
                            />
                          </ListItem>
                        </List>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Cryptographic Binding:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          Hash: {legalDocument.metadata.legalDocumentHash}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          Signature: {legalDocument.metadata.ricardianSignature}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No preview available. Go back and generate preview.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <CodeIcon sx={{ mr: 1 }} />
                      Smart Contract Preview
                    </Typography>
                    {smartContractData ? (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Contract Address: {smartContractData.address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Network: {smartContractData.network}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Contract ID: {smartContractData.contractId}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Features:
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <VerifiedIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Automated execution" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <SecurityIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Cryptographic binding" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <CloudIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Azure Confidential Computing" />
                          </ListItem>
                        </List>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No preview available. Go back and generate preview.
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contract Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Contract Type:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {selectedContractType.replace('_', ' ')}
                    </Typography>
                    
                    <Typography variant="subtitle2">Dataset:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {selectedDataset?.name}
                    </Typography>
                    
                    <Typography variant="subtitle2">Model ID:</Typography>
                    <Typography variant="body2" gutterBottom>
                      <em>Not applicable</em>
                    </Typography>
                    
                    <Typography variant="subtitle2">Price:</Typography>
                    <Typography variant="body2" gutterBottom>
                      ${contractData.price} USD
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Duration:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {contractData.duration} days
                    </Typography>
                    
                    <Typography variant="subtitle2">CCRP:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {selectedCcrp ? ccrpUsers.find(c => c.id === selectedCcrp)?.name : 'None selected'}
                    </Typography>
                    
                    <Typography variant="subtitle2">Environment:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {environmentSpecs.infrastructure.computeType}
                    </Typography>
                    
                    <Typography variant="subtitle2">KMS Provider:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {environmentSpecs.kms.provider}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleCreateRicardianContract}
                    disabled={createRicardianContractMutation.isLoading}
                    startIcon={createRicardianContractMutation.isLoading ? <CircularProgress size={20} /> : null}
                  >
                    {createRicardianContractMutation.isLoading ? 'Creating Contract...' : 'Create Ricardian Contract'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create Ricardian Contract
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create a Ricardian contract that combines human-readable legal documents with machine-executable smart contracts.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>
        {renderStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
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
              onClick={handleCreateRicardianContract}
              disabled={createRicardianContractMutation.isLoading}
            >
              Create Contract
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isGeneratingPreview}
              startIcon={isGeneratingPreview ? <CircularProgress size={20} /> : null}
            >
              {isGeneratingPreview ? 'Generating Preview...' : 'Next'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default CreateRicardianContract; 