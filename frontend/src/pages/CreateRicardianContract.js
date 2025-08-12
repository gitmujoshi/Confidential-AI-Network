import React, { useState, useEffect } from 'react';
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
  FormHelperText,
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
import MultiDatasetSelector from '../components/MultiDatasetSelector';
import MultiCCRPSelector from '../components/MultiCCRPSelector';
import ContractTemplateSelector from '../components/ContractTemplateSelector';

/**
 * CreateRicardianContract Component
 * 
 * This component allows TDC (Training Data Consumer) users to create contracts.
 * Contracts combine human-readable legal documents with machine-executable smart contracts.
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
 * 4. TDC creates contract (TDP auto-signs)
 * 
 * Security:
 * - Wallet-based authentication required
 * - All blockchain interactions use MetaMask signing
 * - Private keys never transmitted to backend
 * - Cryptographic binding ensures integrity
 */

// Stepper steps for contract creation process
const steps = [
  'Select Contract Template',
  'Select Contract Type & Datasets (1-3)',
  'Configure Contract & Environment',
  'Review Legal Document & Smart Contract',
  'Create Contract'
];

function CreateRicardianContract() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isTDC, isAuthenticated } = useUser();
  
  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [selectedContractType, setSelectedContractType] = useState('AI_TRAINING');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDatasets, setSelectedDatasets] = useState([]); // Array of selected datasets
  const [datasetPrices, setDatasetPrices] = useState({}); // Individual pricing per dataset
  const [selectedCcrp, setSelectedCcrp] = useState('');
  const [selectedCcrpCloudProviders, setSelectedCcrpCloudProviders] = useState({}); // { [ccrpId]: provider }
  const [selectedAiModels, setSelectedAiModels] = useState([]); // Array of selected AI model IDs
  const [selectedCloudProvider, setSelectedCloudProvider] = useState(''); // Add cloud provider filter
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

  // Multi-deployment support
  const [enableGlobalDEPAId, setEnableGlobalDEPAId] = useState(false);
  const [deploymentPrefix, setDeploymentPrefix] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [availableJurisdictions, setAvailableJurisdictions] = useState([]);
  const [deploymentStatus, setDeploymentStatus] = useState(null);

  // Load deployment data on mount
  useEffect(() => {
    const loadDeploymentData = async () => {
      try {
        // Load jurisdictions
        const jurisdictionsResponse = await apiService.get('/api/global-deployment/jurisdictions');
        if (jurisdictionsResponse.data.success) {
          setAvailableJurisdictions(jurisdictionsResponse.data.data.jurisdictions);
        }
        
        // Load deployment status
        const statusResponse = await apiService.get('/api/global-deployment/status');
        if (statusResponse.data.success) {
          setDeploymentStatus(statusResponse.data.data);
          // Set default deployment prefix
          setDeploymentPrefix(statusResponse.data.data.currentDeployment.prefix);
        }
      } catch (error) {
        console.warn('Failed to load deployment data:', error);
        // Continue without global features
      }
    };

    loadDeploymentData();
  }, []);

  // Add comprehensive training environment specifications
  const [trainingEnvironment, setTrainingEnvironment] = useState({
    ccrpPlatform: {
      provider: '',
      platform: 'PRIVATE_CLOUD',
      infrastructure: {
        compute: {
          type: 'DEDICATED_SERVERS',
          specifications: {
            cpu: '64 cores (AMD EPYC 7763)',
            memory: '512 GB DDR4 ECC',
            gpu: '8x NVIDIA A100 (80GB each)',
            storage: '10 TB NVMe SSD',
            network: '100 Gbps dedicated'
          },
          isolation: 'PHYSICAL_SEPARATION',
          location: 'ON_PREMISE_SECURE_FACILITY'
        },
        storage: {
          type: 'ENCRYPTED_STORAGE',
          encryption: 'AES-256-XTS',
          keyManagement: 'HSM_PROTECTED',
          backup: 'AIR_GAPPED_BACKUP',
          redundancy: '3X_REPLICATION'
        },
        network: {
          type: 'PRIVATE_NETWORK',
          isolation: 'VPN_ONLY_ACCESS',
          firewall: 'NEXT_GEN_FIREWALL',
          monitoring: '24X7_SURVEILLANCE',
          bandwidth: '100 Gbps dedicated'
        }
      },
      security: {
        authentication: {
          method: 'MULTI_FACTOR_AUTH',
          factors: ['SMART_CARD', 'BIOMETRIC', 'PIN'],
          sessionTimeout: '4 hours',
          maxAttempts: 3
        },
        authorization: {
          model: 'ROLE_BASED_ACCESS',
          roles: ['DATA_SCIENTIST', 'SYSTEM_ADMIN', 'AUDITOR'],
          principle: 'LEAST_PRIVILEGE'
        },
        monitoring: {
          logging: 'COMPREHENSIVE_AUDIT_LOG',
          alerting: 'REAL_TIME_ALERTS',
          analytics: 'BEHAVIOR_ANALYTICS',
          retention: '7 years'
        },
        compliance: {
          standards: ['ISO_27001', 'SOC_2', 'HIPAA', 'GDPR', 'DPDP_2023'],
          certifications: ['FEDRAMP', 'HITRUST'],
          audits: 'QUARTERLY_SECURITY_AUDITS'
        }
      }
    },
    trainingSpecifications: {
      modelType: 'DIAGNOSTIC_AI_MODEL',
      architecture: {
        type: 'DEEP_LEARNING',
        framework: 'TensorFlow 2.12',
        model: 'Transformer-based classifier',
        parameters: '500M parameters',
        inputSize: '512x512x3 (medical images)',
        outputClasses: 15
      },
      training: {
        algorithm: 'Federated Learning',
        privacyTechniques: [
          'DIFFERENTIAL_PRIVACY',
          'SECURE_MULTIPARTY_COMPUTATION',
          'HOMOMORPHIC_ENCRYPTION'
        ],
        hyperparameters: {
          learningRate: 0.001,
          batchSize: 32,
          epochs: 100,
          optimizer: 'Adam',
          lossFunction: 'Categorical Crossentropy'
        },
        validation: {
          method: '5_FOLD_CROSS_VALIDATION',
          metrics: ['Precision', 'Recall', 'F1-Score', 'AUC-ROC'],
          targetAccuracy: 0.95
        }
      },
      dataProcessing: {
        preprocessing: [
          'IMAGE_NORMALIZATION',
          'DATA_AUGMENTATION',
          'FEATURE_EXTRACTION'
        ],
        privacy: [
          'DATA_ANONYMIZATION',
          'K_ANONYMITY',
          'DIFFERENTIAL_PRIVACY'
        ],
        quality: [
          'DATA_VALIDATION',
          'OUTLIER_DETECTION',
          'MISSING_DATA_HANDLING'
        ]
      }
    },
    deployment: {
      environment: 'ISOLATED_CONTAINER',
      orchestration: 'Kubernetes',
      scaling: 'AUTO_SCALING',
      monitoring: 'PROMETHEUS_GRAFANA',
      backup: 'AUTOMATED_BACKUP'
    }
  });

  // Add compliance specifications
  const [complianceSpecs, setComplianceSpecs] = useState({
    regulations: [
      {
        name: 'DPDP_2023',
        status: 'COMPLIANT',
        requirements: [
          'Data minimization implemented',
          'Purpose limitation enforced',
          'Retention period set to 90 days',
          'Consent management in place',
          'Data subject rights implemented'
        ]
      },
      {
        name: 'HIPAA',
        status: 'COMPLIANT',
        requirements: [
          'PHI de-identification implemented',
          'Access controls enforced',
          'Audit logging maintained',
          'Breach notification procedures',
          'Business associate agreements'
        ]
      },
      {
        name: 'GDPR',
        status: 'COMPLIANT',
        requirements: [
          'Right to erasure implemented',
          'Data portability supported',
          'Privacy by design applied',
          'DPO contact information',
          'Cross-border transfer safeguards'
        ]
      },
      {
        name: 'ISO_27001',
        status: 'COMPLIANT',
        requirements: [
          'Information security management',
          'Risk assessment completed',
          'Security controls implemented',
          'Regular security audits',
          'Incident response procedures'
        ]
      }
    ]
  });

  // Add training parameters state
  const [trainingParams, setTrainingParams] = useState({
    maxPrivacyLoss: 0.1,
    minAccuracy: 0.85,
    maxTrainingRuns: 5, // Maximum number of training runs permitted
    differentialPrivacy: {
      enabled: true,
      epsilon: 0.1,
      delta: 1e-5
    },
    federatedLearning: {
      enabled: true,
      communicationRounds: 100
    },
    secureMultiPartyComputation: {
      enabled: false
    }
  });
  const [legalDocument, setLegalDocument] = useState(null);
  const [smartContractData, setSmartContractData] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [contractCreationError, setContractCreationError] = useState(null);
  const [createdContract, setCreatedContract] = useState(null);

  // Fetch data
  const { data: datasetsResponse, isLoading: datasetsLoading } = useQuery('datasets', apiService.getDatasets);
  const { data: supportedTypes = [] } = useQuery('contract-types', apiService.getSupportedContractTypes);
  const { data: aiModelsResponse, isLoading: aiModelsLoading } = useQuery('ai-models', apiService.getAIModels);
  
  // Manual CCRP users fetch to avoid React Query parameter injection
  const [ccrpUsersResponse, setCcrpUsersResponse] = React.useState(null);
  
  React.useEffect(() => {
    const fetchCcrpUsers = async () => {
      try {
        const response = await apiService.getCCRPUsers();
        setCcrpUsersResponse(response);
      } catch (error) {
        console.error('❌ CCRP users fetch error:', error);
        setCcrpUsersResponse(null);
      }
    };
    
    fetchCcrpUsers();
  }, []);
  
  const ccrpUsers = ccrpUsersResponse?.ccrpUsers || [];
  
  // Get datasets and extract unique TDP users from dataset owners
  const datasets = datasetsResponse?.datasets || [];
  const tdpUsers = datasets
    .map(dataset => dataset.owner)
    .filter((owner, index, self) => 
      owner && self.findIndex(o => o.id === owner.id) === index
    );

  // Contract creation mutation
  const createRicardianContractMutation = useMutation(
    (data) => apiService.createRicardianContract(data), // Use contract creation
    {
      onSuccess: (response) => {
        setContractCreationError(null);
        setCreatedContract(response);
        queryClient.invalidateQueries('contracts');
        toast.success('Contract created successfully!');
        
        // Navigate to the newly created contract detail page
        if (response?.contract?.contractId) {
          navigate(`/contracts/${response.contract.contractId}`);
        } else {
          // Fallback: Move to the next step to show the contract document
          setActiveStep(activeStep + 1);
        }
      },
      onError: (error) => {
        console.error('Contract creation error:', error);
        let errorMsg = 'Failed to create contract';
        if (error?.response?.data?.error) {
          errorMsg = error.response.data.error;
          if (error.response.data.details) {
            errorMsg += '\n' + error.response.data.details;
          }
        } else if (error?.message) {
          errorMsg = error.message;
        }
        setContractCreationError(errorMsg);
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
          Create Contract
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
   */
  const handleNext = () => {
    if (activeStep === 0 && !selectedTemplate) {
      toast.error('Please select a contract template before proceeding');
      return;
    }
    
    if (activeStep === 1 && (!selectedContractType || selectedDatasets.length === 0)) {
      toast.error('Please select both contract type and at least one dataset');
      return;
    }
    
    if (activeStep === 1 && selectedDatasets.length > 3) {
      toast.error('You can only select up to 3 datasets');
      return;
    }
    
    if (activeStep === 2 && !isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
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

    return true;
  };

  /**
   * Generate preview of legal document and smart contract
   */
  const generatePreview = async () => {
    if (selectedDatasets.length === 0) {
      toast.error('Please select at least one dataset');
      return;
    }

    setIsGeneratingPreview(true);
    toast.loading('Generating preview...', { id: 'preview-generation' });

    try {
      // Prepare dataset selections for the preview API
      const datasetSelections = selectedDatasets.map(dataset => ({
        datasetId: dataset.datasetId,
        individualPrice: parseFloat(datasetPrices[dataset.id])
      }));

      const previewPayload = {
        datasetSelections,
        duration: parseInt(contractData.duration),
        termsAndConditions: contractData.termsAndConditions,
        contractType: selectedContractType,
        privacyRequirements: {
          maxPrivacyLoss: trainingParams.maxPrivacyLoss,
          minAccuracy: trainingParams.minAccuracy,
          differentialPrivacy: trainingParams.differentialPrivacy,
          federatedLearning: trainingParams.federatedLearning,
          secureMultiPartyComputation: trainingParams.secureMultiPartyComputation
        }
      };

      console.log('📝 Generating multi-TDP preview with payload:', previewPayload);
      
      // Call the multi-TDP preview API
      const previewResponse = await apiService.previewMultiTDPRicardianContract(previewPayload);
      
      console.log('📝 Preview response:', previewResponse);
      
      if (previewResponse.success) {
        setLegalDocument(previewResponse.legalDocument);
        setSmartContractData(previewResponse.smartContractData);
        console.log('✅ Preview data set:', {
          legalDocument: previewResponse.legalDocument,
          smartContractData: previewResponse.smartContractData
        });
        toast.success('Preview generated successfully!', { id: 'preview-generation' });
      } else {
        throw new Error('Preview generation failed');
      }
    } catch (error) {
      console.error('❌ Error generating preview:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(`Failed to generate preview: ${error.message}`, { id: 'preview-generation' });
    } finally {
      setIsGeneratingPreview(false);
    }
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

  /**
   * Handle contract creation
   */
  const handleCreateRicardianContract = () => {
    if (selectedDatasets.length === 0 || !isFormValid()) {
      toast.error('Please fill in all required fields and select at least one dataset');
      return;
    }

    // Prepare dataset selections array for the backend
    const datasetSelections = selectedDatasets.map(dataset => ({
      datasetId: dataset.datasetId,
      individualPrice: parseFloat(datasetPrices[dataset.id])
    }));
    
    console.log('🔍 Selected datasets:', selectedDatasets.map(d => ({ 
      id: d.id, 
      datasetId: d.datasetId, 
      name: d.name,
      price: datasetPrices[d.id]
    })));
    console.log('🔍 Dataset selections for backend:', datasetSelections);
    
    const ccrpUser = ccrpUsers.find(user => user.id === parseInt(selectedCcrp));
    
    const contractPayload = {
      datasetSelections, // Array of {datasetId, individualPrice} objects
      duration: parseInt(contractData.duration),
      termsAndConditions: contractData.termsAndConditions,
      ccrpId: ccrpUser ? ccrpUser.id : null,
      // Add privacy requirements
      privacyRequirements: {
        maxPrivacyLoss: trainingParams.maxPrivacyLoss,
        minAccuracy: trainingParams.minAccuracy,
        differentialPrivacy: trainingParams.differentialPrivacy,
        federatedLearning: trainingParams.federatedLearning,
        secureMultiPartyComputation: trainingParams.secureMultiPartyComputation
      },
      // Add comprehensive training environment specifications
      trainingEnvironment,
      // Add compliance specifications
      complianceSpecs,
      // Add AI model IDs if selected
      aiModelIds: selectedAiModels.length > 0 ? selectedAiModels : null,
      // Add environment specifications
      environmentSpecs,
      // Add training parameters
      trainingParams,
      // Add global DEPA ID options
      ...(enableGlobalDEPAId && {
        globalDEPAId: true,
        deploymentPrefix: deploymentPrefix || undefined,
        jurisdiction: selectedJurisdiction || undefined
      })
    };

    console.log('📝 Creating multi-TDP contract with payload:', contractPayload);
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
              Select Contract Template
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Choose a contract template that best fits your needs. Templates provide predefined terms, 
              pricing structures, and compliance settings.
            </Typography>

            {selectedTemplate && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Selected Template:</strong> {selectedTemplate.name} - {selectedTemplate.description}
              </Alert>
            )}

            <ContractTemplateSelector
              onTemplateSelect={(template) => {
                setSelectedTemplate(template);
                setSelectedContractType(template.contractType);
                // Pre-fill some fields based on template
                if (template.standardDuration) {
                  setContractData(prev => ({
                    ...prev,
                    duration: template.standardDuration.toString()
                  }));
                }
                if (template.termsAndConditions) {
                  setContractData(prev => ({
                    ...prev,
                    termsAndConditions: template.termsAndConditions
                  }));
                }
              }}
              dataset={selectedDatasets[0]} // Use first dataset for recommendations
              userPreferences={{
                category: selectedTemplate?.category,
                duration: parseInt(contractData.duration) || 90,
                budget: 1000 // Default budget
              }}
              showRecommendations={true}
            />
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Contract Type & Datasets (1-3)
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
                        {(supportedTypes || []).map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Contracts combine human-readable legal documents with machine-executable smart contracts.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Global DEPA ID Configuration
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={enableGlobalDEPAId}
                          onChange={(e) => setEnableGlobalDEPAId(e.target.checked)}
                        />
                      }
                      label="Enable Global DEPA ID"
                    />
                    
                    {enableGlobalDEPAId && (
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Deployment Prefix"
                              value={deploymentPrefix}
                              onChange={(e) => setDeploymentPrefix(e.target.value)}
                              helperText="Leave empty to use current deployment prefix"
                              placeholder={deploymentStatus?.currentDeployment?.prefix || 'LOCAL'}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Jurisdiction (Optional)</InputLabel>
                              <Select
                                value={selectedJurisdiction}
                                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                                label="Jurisdiction (Optional)"
                              >
                                <MenuItem value="">None (Standard)</MenuItem>
                                {availableJurisdictions.map((jurisdiction) => (
                                  <MenuItem key={jurisdiction.code} value={jurisdiction.code}>
                                    {jurisdiction.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                        
                        {selectedJurisdiction && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Compliance:</strong> {availableJurisdictions.find(j => j.code === selectedJurisdiction)?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Data residency: {availableJurisdictions.find(j => j.code === selectedJurisdiction)?.dataResidency}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Select Datasets (1-3 from Any TDPs)
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Choose 1 to 3 AI training datasets from any Training Data Providers (TDPs).
                      You can select multiple datasets from the same TDP if needed.
                      Use the checkboxes to select datasets. Each dataset will have its own pricing.
                    </Typography>
                    
                    <MultiDatasetSelector
                      datasets={datasets}
                      selectedDatasets={selectedDatasets}
                      datasetPrices={datasetPrices}
                      onDatasetToggle={handleDatasetToggle}
                      onPriceChange={handlePriceChange}
                      maxDatasets={3}
                    />
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
                        {(aiModelsResponse?.models || []).map((model) => (
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
                      helperText="Total contract cost in USD"
                    />
                    
                    <TextField
                      fullWidth
                      label="Duration (days)"
                      type="number"
                      value={contractData.duration}
                      onChange={(e) => setContractData({ ...contractData, duration: e.target.value })}
                      margin="normal"
                      helperText="Contract execution timeline in days"
                    />
                    
                    <TextField
                      fullWidth
                      label="Terms and Conditions"
                      multiline
                      rows={4}
                      value={contractData.termsAndConditions}
                      onChange={(e) => setContractData({ ...contractData, termsAndConditions: e.target.value })}
                      margin="normal"
                      helperText="Legal terms and conditions for the contract"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Privacy & Accuracy Requirements
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Maximum Privacy Loss (ε)"
                      type="number"
                      inputProps={{ step: 0.01, min: 0.01, max: 1.0 }}
                      value={trainingParams.maxPrivacyLoss}
                      onChange={(e) => setTrainingParams({ 
                        ...trainingParams, 
                        maxPrivacyLoss: parseFloat(e.target.value) 
                      })}
                      margin="normal"
                      helperText="Differential privacy epsilon parameter (0.01-1.0, lower = more private)"
                    />
                    
                    <TextField
                      fullWidth
                      label="Minimum Accuracy (%)"
                      type="number"
                      inputProps={{ step: 0.1, min: 50, max: 99.9 }}
                      value={trainingParams.minAccuracy * 100}
                      onChange={(e) => setTrainingParams({ 
                        ...trainingParams, 
                        minAccuracy: parseFloat(e.target.value) / 100 
                      })}
                      margin="normal"
                      helperText="Minimum required model accuracy (50%-99.9%)"
                    />

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Privacy Techniques</InputLabel>
                      <Select
                        multiple
                        value={[
                          trainingParams.differentialPrivacy.enabled && 'differential-privacy',
                          trainingParams.federatedLearning.enabled && 'federated-learning',
                          trainingParams.secureMultiPartyComputation.enabled && 'secure-mpc'
                        ].filter(Boolean)}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setTrainingParams({
                            ...trainingParams,
                            differentialPrivacy: {
                              ...trainingParams.differentialPrivacy,
                              enabled: selected.includes('differential-privacy')
                            },
                            federatedLearning: {
                              ...trainingParams.federatedLearning,
                              enabled: selected.includes('federated-learning')
                            },
                            secureMultiPartyComputation: {
                              ...trainingParams.secureMultiPartyComputation,
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
                          <Checkbox checked={trainingParams.differentialPrivacy.enabled} />
                          <ListItemText 
                            primary="Differential Privacy"
                            secondary="Adds noise to protect individual data"
                          />
                        </MenuItem>
                        <MenuItem value="federated-learning">
                          <Checkbox checked={trainingParams.federatedLearning.enabled} />
                          <ListItemText 
                            primary="Federated Learning"
                            secondary="Train model without sharing raw data"
                          />
                        </MenuItem>
                        <MenuItem value="secure-mpc">
                          <Checkbox checked={trainingParams.secureMultiPartyComputation.enabled} />
                          <ListItemText 
                            primary="Secure Multi-Party Computation"
                            secondary="Compute on encrypted data"
                          />
                        </MenuItem>
                      </Select>
                      <Typography variant="caption" color="text.secondary">
                        Select privacy-preserving techniques to be used
                      </Typography>
                    </FormControl>

                    {trainingParams.differentialPrivacy.enabled && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Differential Privacy Settings
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Epsilon (ε)"
                              type="number"
                              inputProps={{ step: 0.01, min: 0.01, max: 1.0 }}
                              value={trainingParams.differentialPrivacy.epsilon}
                              onChange={(e) => setTrainingParams({
                                ...trainingParams,
                                differentialPrivacy: {
                                  ...trainingParams.differentialPrivacy,
                                  epsilon: parseFloat(e.target.value)
                                }
                              })}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Delta (δ)"
                              type="number"
                              inputProps={{ step: 1e-6, min: 1e-6, max: 1e-3 }}
                              value={trainingParams.differentialPrivacy.delta}
                              onChange={(e) => setTrainingParams({
                                ...trainingParams,
                                differentialPrivacy: {
                                  ...trainingParams.differentialPrivacy,
                                  delta: parseFloat(e.target.value)
                                }
                              })}
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {trainingParams.federatedLearning.enabled && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Federated Learning Settings
                        </Typography>
                        <TextField
                          fullWidth
                          label="Communication Rounds"
                          type="number"
                          inputProps={{ min: 10, max: 1000 }}
                          value={trainingParams.federatedLearning.communicationRounds}
                          onChange={(e) => setTrainingParams({
                            ...trainingParams,
                            federatedLearning: {
                              ...trainingParams.federatedLearning,
                              communicationRounds: parseInt(e.target.value)
                            }
                          })}
                          size="small"
                          margin="normal"
                        />
                      </Box>
                    )}

                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Privacy-Accuracy Trade-off:</strong> Lower privacy loss (ε) provides better privacy but may reduce model accuracy. 
                        Higher minimum accuracy requirements may limit privacy protection.
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      CCRP Selection (Optional)
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" paragraph>
                      All CCRPs are displayed below. Use the cloud provider filter to find CCRPs that support specific cloud services.
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>Filter by Cloud Provider</InputLabel>
                          <Select
                            value={selectedCloudProvider}
                            onChange={(e) => setSelectedCloudProvider(e.target.value)}
                            label="Filter by Cloud Provider"
                          >
                            <MenuItem value="">
                              <em>All Cloud Providers</em>
                            </MenuItem>
                            <MenuItem value="AWS">AWS</MenuItem>
                            <MenuItem value="Azure">Azure</MenuItem>
                            <MenuItem value="GCP">GCP</MenuItem>
                            <MenuItem value="OCI">OCI</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Available CCRPs:
                      </Typography>
                      
                      {ccrpUsers.length === 0 ? (
                        <Alert severity="info">
                          No CCRPs available at the moment.
                        </Alert>
                      ) : (
                        <MultiCCRPSelector
                          ccrpUsers={ccrpUsers}
                          selectedCcrp={selectedCcrp}
                          selectedCloudProvider={selectedCloudProvider}
                          onCcrpToggle={setSelectedCcrp}
                          onCloudProviderChange={setSelectedCloudProvider}
                          onCcrpCloudProviderSelect={(ccrpId, provider) => setSelectedCcrpCloudProviders(prev => ({ ...prev, [ccrpId]: provider }))}
                          ccrpCloudProviderSelections={selectedCcrpCloudProviders}
                        />
                      )}
                      
                      {selectedCcrp && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Selected CCRP:</strong> {ccrpUsers.find(c => c.id === selectedCcrp)?.name}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Select a Confidential Clean Room Provider for secure training environment (optional)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Environment Specifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Define the computing infrastructure where this contract will be executed. 
                      This includes the general hosting environment, security configurations, and platform requirements.
                    </Typography>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          <StorageIcon sx={{ mr: 1 }} />
                          Infrastructure
                        </Typography>
                      </AccordionSummary>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Configure the general computing infrastructure including compute resources, 
                        storage, and network requirements for contract execution.
                      </Typography>
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
                                <MenuItem value="confidential-vm">Confidential VM - Secure virtual machine with encryption</MenuItem>
                                <MenuItem value="sgx-enclave">SGX Enclave - Intel SGX secure enclave for confidential computing</MenuItem>
                                <MenuItem value="sev-snp">SEV-SNP - AMD Secure Encrypted Virtualization with Secure Nested Paging</MenuItem>
                              </Select>
                              <FormHelperText>
                                Choose the type of secure computing environment for your contract
                              </FormHelperText>
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
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Set up security controls including encryption, access controls, 
                        and compliance requirements for data protection.
                      </Typography>
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
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Configure key management services for encryption and secure key storage.
                      </Typography>
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

              {/* Training Environment Specifications */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Training Environment Specifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Configure AI training parameters and privacy-preserving techniques. 
                      This section defines how the AI models will be trained while protecting data privacy.
                    </Typography>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          <StorageIcon sx={{ mr: 1 }} />
                          Infrastructure Specifications
                        </Typography>
                      </AccordionSummary>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Configure specialized computing resources for AI model training, 
                        including GPU/TPU requirements and privacy-preserving compute resources.
                      </Typography>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="CPU Specification"
                              value={trainingEnvironment.ccrpPlatform.infrastructure.compute.specifications.cpu}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                ccrpPlatform: {
                                  ...trainingEnvironment.ccrpPlatform,
                                  infrastructure: {
                                    ...trainingEnvironment.ccrpPlatform.infrastructure,
                                    compute: {
                                      ...trainingEnvironment.ccrpPlatform.infrastructure.compute,
                                      specifications: {
                                        ...trainingEnvironment.ccrpPlatform.infrastructure.compute.specifications,
                                        cpu: e.target.value
                                      }
                                    }
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Memory Specification"
                              value={trainingEnvironment.ccrpPlatform.infrastructure.compute.specifications.memory}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                ccrpPlatform: {
                                  ...trainingEnvironment.ccrpPlatform,
                                  infrastructure: {
                                    ...trainingEnvironment.ccrpPlatform.infrastructure,
                                    compute: {
                                      ...trainingEnvironment.ccrpPlatform.infrastructure.compute,
                                      specifications: {
                                        ...trainingEnvironment.ccrpPlatform.infrastructure.compute.specifications,
                                        memory: e.target.value
                                      }
                                    }
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="GPU Specification"
                              value={trainingEnvironment.ccrpPlatform.infrastructure.compute.specifications.gpu}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                ccrpPlatform: {
                                  ...trainingEnvironment.ccrpPlatform,
                                  infrastructure: {
                                    ...trainingEnvironment.ccrpPlatform.infrastructure,
                                    compute: {
                                      ...trainingEnvironment.ccrpPlatform.infrastructure.compute,
                                      specifications: {
                                        ...trainingEnvironment.ccrpPlatform.infrastructure.compute.specifications,
                                        gpu: e.target.value
                                      }
                                    }
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Storage Specification"
                              value={trainingEnvironment.ccrpPlatform.infrastructure.compute.specifications.storage}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                ccrpPlatform: {
                                  ...trainingEnvironment.ccrpPlatform,
                                  infrastructure: {
                                    ...trainingEnvironment.ccrpPlatform.infrastructure,
                                    compute: {
                                      ...trainingEnvironment.ccrpPlatform.infrastructure.compute,
                                      specifications: {
                                        ...trainingEnvironment.ccrpPlatform.infrastructure.compute.specifications,
                                        storage: e.target.value
                                      }
                                    }
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          <CodeIcon sx={{ mr: 1 }} />
                          Training Specifications
                        </Typography>
                      </AccordionSummary>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Define AI model architecture, training parameters, and privacy-preserving 
                        techniques for secure model training.
                      </Typography>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Model Type"
                              value={trainingEnvironment.trainingSpecifications.modelType}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                trainingSpecifications: {
                                  ...trainingEnvironment.trainingSpecifications,
                                  modelType: e.target.value
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Framework"
                              value={trainingEnvironment.trainingSpecifications.architecture.framework}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                trainingSpecifications: {
                                  ...trainingEnvironment.trainingSpecifications,
                                  architecture: {
                                    ...trainingEnvironment.trainingSpecifications.architecture,
                                    framework: e.target.value
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Model Architecture"
                              value={trainingEnvironment.trainingSpecifications.architecture.model}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                trainingSpecifications: {
                                  ...trainingEnvironment.trainingSpecifications,
                                  architecture: {
                                    ...trainingEnvironment.trainingSpecifications.architecture,
                                    model: e.target.value
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Parameters"
                              value={trainingEnvironment.trainingSpecifications.architecture.parameters}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                trainingSpecifications: {
                                  ...trainingEnvironment.trainingSpecifications,
                                  architecture: {
                                    ...trainingEnvironment.trainingSpecifications.architecture,
                                    parameters: e.target.value
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Learning Rate"
                              type="number"
                              inputProps={{ step: 0.0001, min: 0.0001, max: 1.0 }}
                              value={trainingEnvironment.trainingSpecifications.training.hyperparameters.learningRate}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                trainingSpecifications: {
                                  ...trainingEnvironment.trainingSpecifications,
                                  training: {
                                    ...trainingEnvironment.trainingSpecifications.training,
                                    hyperparameters: {
                                      ...trainingEnvironment.trainingSpecifications.training.hyperparameters,
                                      learningRate: parseFloat(e.target.value)
                                    }
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Batch Size"
                              type="number"
                              inputProps={{ min: 1, max: 1024 }}
                              value={trainingEnvironment.trainingSpecifications.training.hyperparameters.batchSize}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                trainingSpecifications: {
                                  ...trainingEnvironment.trainingSpecifications,
                                  training: {
                                    ...trainingEnvironment.trainingSpecifications.training,
                                    hyperparameters: {
                                      ...trainingEnvironment.trainingSpecifications.training.hyperparameters,
                                      batchSize: parseInt(e.target.value)
                                    }
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Epochs"
                              type="number"
                              inputProps={{ min: 1, max: 1000 }}
                              value={trainingEnvironment.trainingSpecifications.training.hyperparameters.epochs}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                trainingSpecifications: {
                                  ...trainingEnvironment.trainingSpecifications,
                                  training: {
                                    ...trainingEnvironment.trainingSpecifications.training,
                                    hyperparameters: {
                                      ...trainingEnvironment.trainingSpecifications.training.hyperparameters,
                                      epochs: parseInt(e.target.value)
                                    }
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Target Accuracy"
                              type="number"
                              inputProps={{ step: 0.01, min: 0.5, max: 1.0 }}
                              value={trainingEnvironment.trainingSpecifications.training.validation.targetAccuracy}
                              onChange={(e) => setTrainingEnvironment({
                                ...trainingEnvironment,
                                trainingSpecifications: {
                                  ...trainingEnvironment.trainingSpecifications,
                                  training: {
                                    ...trainingEnvironment.trainingSpecifications.training,
                                    validation: {
                                      ...trainingEnvironment.trainingSpecifications.training.validation,
                                      targetAccuracy: parseFloat(e.target.value)
                                    }
                                  }
                                }
                              })}
                              margin="normal"
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          <SecurityIcon sx={{ mr: 1 }} />
                          Compliance Requirements
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Select compliance standards that must be met:
                        </Typography>
                        {complianceSpecs.regulations.map((regulation, index) => (
                          <FormControlLabel
                            key={regulation.name}
                            control={
                              <Checkbox
                                checked={regulation.status === 'COMPLIANT'}
                                onChange={(e) => {
                                  const updatedRegulations = [...complianceSpecs.regulations];
                                  updatedRegulations[index] = {
                                    ...regulation,
                                    status: e.target.checked ? 'COMPLIANT' : 'NOT_COMPLIANT'
                                  };
                                  setComplianceSpecs({
                                    ...complianceSpecs,
                                    regulations: updatedRegulations
                                  });
                                }}
                              />
                            }
                            label={`${regulation.name} - ${regulation.status}`}
                          />
                        ))}
                      </AccordionDetails>
                    </Accordion>
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
            
            {/* Model Information */}
            {selectedAiModels.length > 0 && (
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Selected AI Models
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedAiModels.map((modelId) => {
                          const model = aiModelsResponse?.models?.find(m => m.id === modelId);
                          if (!model) return null;
                          
                          return (
                            <Grid item xs={12} md={6} key={modelId}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="h6" gutterBottom>
                                    {model.name}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary" paragraph>
                                    {model.description}
                                  </Typography>
                                  <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">
                                        Type
                                      </Typography>
                                      <Typography variant="body2">
                                        {model.type}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">
                                        Architecture
                                      </Typography>
                                      <Typography variant="body2">
                                        {model.architecture}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">
                                        Parameters
                                      </Typography>
                                      <Typography variant="body2">
                                        {model.parameters}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">
                                        Framework
                                      </Typography>
                                      <Typography variant="body2">
                                        {model.framework}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">
                                        Privacy Technique
                                      </Typography>
                                      <Typography variant="body2">
                                        {model.privacyTechnique}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">
                                        Max Epochs
                                      </Typography>
                                      <Typography variant="body2">
                                        {model.maxEpochs}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">
                                        Batch Size
                                      </Typography>
                                      <Typography variant="body2">
                                        {model.batchSize}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">
                                        Learning Rate
                                      </Typography>
                                      <Typography variant="body2">
                                        {model.learningRate}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                  {model.validationMetrics && model.validationMetrics.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="caption" color="textSecondary">
                                        Validation Metrics
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                        {model.validationMetrics.map((metric, index) => (
                                          <Chip
                                            key={index}
                                            label={metric}
                                            size="small"
                                            variant="outlined"
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Create Contract
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
                    Your contract has been created and deployed to the blockchain.
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
                        <Typography variant="subtitle2">Contract Signature:</Typography>
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
                  This will create a contract that combines human-readable legal documents 
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
                      {selectedDatasets.map(ds => ds.name).join(', ')}
                    </Typography>
                    
                    <Typography variant="subtitle2">AI Models:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {selectedAiModels.length > 0 
                        ? selectedAiModels.map(modelId => {
                            const model = aiModelsResponse?.models?.find(m => m.id === modelId);
                            return model?.name || modelId;
                          }).join(', ')
                        : 'None selected'
                      }
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
                      {selectedCcrp ? ccrpUsers.find(c => c.id === parseInt(selectedCcrp))?.name : 'None selected'}
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
                  {!createdContract ? (
                    null
                  ) : (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Contract created successfully! You can now download the contract documents.
                    </Alert>
                  )}
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
              Create Contract
            </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create a contract that combines human-readable legal documents with machine-executable smart contracts.
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
          {activeStep === steps.length - 1 && !createdContract ? (
            <Button
              variant="contained"
              onClick={handleCreateRicardianContract}
              disabled={createRicardianContractMutation.isLoading}
            >
              {createRicardianContractMutation.isLoading ? 'Creating Contract...' : 'Create Contract'}
            </Button>
          ) : activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isGeneratingPreview}
              startIcon={isGeneratingPreview ? <CircularProgress size={20} /> : null}
            >
              {isGeneratingPreview ? 'Generating Preview...' : 'Next'}
            </Button>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

// Add a simple error boundary wrapper for the component
function ErrorBoundary({ children }) {
  const [error, setError] = useState(null);
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Something went wrong.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error.message}
        </Typography>
      </Box>
    );
  }
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {React.cloneElement(children, { onError: setError })}
    </React.Suspense>
  );
}

// Wrap the main export with the error boundary
export default function WrappedCreateRicardianContract(props) {
  return (
    <ErrorBoundary>
      <CreateRicardianContract {...props} />
    </ErrorBoundary>
  );
} 