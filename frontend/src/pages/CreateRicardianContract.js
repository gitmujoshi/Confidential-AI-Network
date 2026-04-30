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
import ContractValidationService from '../services/contractValidationService';

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
  'Contract Details & Dataset Selection',
  'Configure Environment & CCRP',
  'Review Legal Document & Smart Contract'
];

const KeyValue = ({ label, value, mono = false }) => {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' }, gap: 1, py: 0.75 }}>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', letterSpacing: '0.08em', lineHeight: 1.4 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : undefined,
          wordBreak: 'break-word',
        }}
      >
        {value ?? '—'}
      </Typography>
    </Box>
  );
};

const TabPanel = ({ value, index, children }) => {
  if (value !== index) return null;
  return <Box sx={{ mt: 2 }}>{children}</Box>;
};

function CreateRicardianContract() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isTDC, isAuthenticated } = useUser();
  
  // Initialize validation service
  const validationService = new ContractValidationService();
  
  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [step1Tab, setStep1Tab] = useState(0);
  const [step2Tab, setStep2Tab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDatasets, setSelectedDatasets] = useState([]); // Array of selected datasets
  const [datasetPrices, setDatasetPrices] = useState({}); // Individual pricing per dataset
  const [selectedCcrp, setSelectedCcrp] = useState('');
  const [selectedCcrpCloudProviders, setSelectedCcrpCloudProviders] = useState({}); // { [ccrpId]: provider }
  const [selectedAiModels, setSelectedAiModels] = useState(''); // Single selected AI model ID
  const [selectedCloudProvider, setSelectedCloudProvider] = useState(''); // Add cloud provider filter
  const [contractData, setContractData] = useState({
    price: '',
    duration: '',
    termsAndConditions: '',
  });
  const [environmentSpecs, setEnvironmentSpecs] = useState({
    type: 'cloud',
    instanceType: '',
    cpu: '',
    memory: '',
    storage: '',
    gpu: '',
    notes: '',
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
      provider: '',
      keyId: '',
      algorithm: '',
      rotationPeriod: '',
      keyName: 'training-data-key',
      region: 'eastus'
    }
  });


  // State for CCRP users
  const [availableCcrpUsers, setAvailableCcrpUsers] = useState([]);

  // Load CCRP users when user is authenticated
  useEffect(() => {
    const loadCcrpUsers = async () => {
      if (!isAuthenticated) {
        console.log('⏳ User not authenticated yet, skipping CCRP loading...');
        return;
      }

      try {
        console.log('🔍 Loading CCRP users...');
        // Try /api/users/ccrp first (available to all authenticated users)
        let ccrpResponse;
        try {
          ccrpResponse = await apiService.get('/api/users/ccrp');
          console.log('📊 CCRP Response from /api/users/ccrp:', ccrpResponse);
          if (ccrpResponse.data && Array.isArray(ccrpResponse.data)) {
            console.log('✅ CCRP Users loaded:', ccrpResponse.data.length, 'users');
            setAvailableCcrpUsers(ccrpResponse.data);
          } else {
            console.warn('⚠️ CCRP Response data is not an array:', ccrpResponse.data);
            setAvailableCcrpUsers([]);
          }
        } catch (ccrpError) {
          console.warn('⚠️ /api/users/ccrp failed, trying /api/ccrp/all:', ccrpError.response?.data);
          // Fallback to /api/ccrp/all
          try {
            ccrpResponse = await apiService.get('/api/ccrp/all');
            console.log('📊 CCRP Response from /api/ccrp/all:', ccrpResponse);
            if (ccrpResponse.data && ccrpResponse.data.ccrpUsers && Array.isArray(ccrpResponse.data.ccrpUsers)) {
              console.log('✅ CCRP Users loaded from /api/ccrp/all:', ccrpResponse.data.ccrpUsers.length, 'users');
              setAvailableCcrpUsers(ccrpResponse.data.ccrpUsers);
            } else {
              console.warn('⚠️ CCRP /all Response data.ccrpUsers is not an array:', ccrpResponse.data);
              setAvailableCcrpUsers([]);
            }
          } catch (allError) {
            console.error('❌ Both CCRP endpoints failed:', allError);
            console.error('Error details:', allError.response?.data);
            setAvailableCcrpUsers([]);
          }
        }
      } catch (generalError) {
        console.error('❌ Failed to load CCRP users:', generalError);
        setAvailableCcrpUsers([]);
      }
    };

    loadCcrpUsers();
  }, [isAuthenticated]);

  // Handler functions for environment specs
  const handleEnvironmentSpecChange = (field, value) => {
    setEnvironmentSpecs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKmsConfigChange = (field, value) => {
    setEnvironmentSpecs(prev => ({
      ...prev,
      kms: {
        ...prev.kms,
        [field]: value
      }
    }));
  };

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
  const { data: datasetsResponse, isLoading: datasetsLoading } = useQuery('datasets', () => apiService.getDatasets({}, currentUser));
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

  // Contract creation mutation - Create contract first, then SCITT CCF claim
  const createRicardianContractMutation = useMutation(
    async (data) => {
      // First create the contract in the regular contracts table
      const contractResponse = await apiService.createRicardianContract(data);
      
      if (contractResponse?.contract?.contractId) {
        // Then create the SCITT CCF claim using the actual contract ID
        const scittData = {
          ...data,
          contractId: contractResponse.contract.contractId // Use the actual contract ID from the database
        };
        
        const scittResponse = await apiService.createScittCcfContract(scittData);
        return {
          ...contractResponse,
          scittCcf: scittResponse
        };
      }
      
      return contractResponse;
    },
    {
      onSuccess: (response) => {
        setContractCreationError(null);
        
        if (response?.contract?.contractId) {
          // Contract created successfully
          setCreatedContract({
            contract: {
              contractId: response.contract.contractId,
              claimId: response.scittCcf?.claimId,
              source: 'SCITT_CCF'
            },
            message: response.scittCcf?.message || 'Contract created successfully with SCITT CCF integration!'
          });
          queryClient.invalidateQueries('contracts');
          toast.success('Contract created successfully with SCITT CCF integration!');
          
          // Navigate to the newly created contract detail page
          navigate(`/contracts/${response.contract.contractId}`);
        } else {
          // Fallback to old format for backward compatibility
          setCreatedContract(response);
          queryClient.invalidateQueries('contracts');
          toast.success('Contract created successfully!');
          
          if (response?.contract?.contractId) {
            navigate(`/contracts/${response.contract.contractId}`);
          } else {
            setActiveStep(activeStep + 1);
          }
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
    
    if (activeStep === 1 && selectedDatasets.length === 0) {
      toast.error('Please select at least one dataset');
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
        contractType: 'AI_TRAINING',
        privacyRequirements: {
          maxPrivacyLoss: trainingParams.maxPrivacyLoss,
          minAccuracy: trainingParams.minAccuracy,
          differentialPrivacy: trainingParams.differentialPrivacy, // { enabled, epsilon, delta }
          federatedLearning: trainingParams.federatedLearning, // { enabled, communicationRounds }
          secureMultiPartyComputation: trainingParams.secureMultiPartyComputation, // { enabled }
        }
      };

      console.log('📝 Generating multi-TDP preview with payload:', previewPayload);
      
      // Call the multi-TDP preview API
      const previewResponse = await apiService.previewMultiTDPRicardianContract(previewPayload);
      
      console.log('📝 Preview response:', previewResponse);
      
      if (previewResponse.success) {
        // Normalize backend response shapes:
        // Some preview endpoints return `{ legalDocument, legalDocumentHash, smartContractData }` (no wrapper),
        // while others return `{ legalDocument: { legalDocument, metadata } }`.
        const rawLd = previewResponse.legalDocument;
        const normalizedLegalDocument =
          rawLd && typeof rawLd === 'object' && rawLd.metadata && rawLd.legalDocument
            ? rawLd
            : {
                legalDocument: rawLd,
                metadata: {
                  contractId:
                    previewResponse?.smartContractData?.contractId ??
                    rawLd?.contractId ??
                    `preview-${Date.now()}`,
                  legalDocumentHash: previewResponse.legalDocumentHash ?? rawLd?.legalDocumentHash ?? null,
                  ricardianSignature: rawLd?.ricardianSignature ?? 'preview',
                },
              };

        setLegalDocument(normalizedLegalDocument);
        setSmartContractData(previewResponse.smartContractData);
        console.log('✅ Preview data set:', {
          legalDocument: normalizedLegalDocument,
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
  const handleCreateContract = async () => {
    try {
      setContractCreationError(null);
      
      // Prepare contract data for regular contract creation API
      const selectedModel =
        selectedAiModels
          ? (aiModelsResponse?.models || []).find(
              (m) => m?.depaId === selectedAiModels || String(m?.id) === String(selectedAiModels)
            )
          : null;

      const contractPayload = {
        termsAndConditions: contractData.termsAndConditions || `Contract for ${selectedDatasets.map(d => d.name).join(', ')} - AI training contract using ${selectedDatasets.length} dataset(s)`,
        price: parseFloat(contractData.price) || 0,
        duration: parseInt(contractData.duration) || 90,
        datasetSelections: selectedDatasets.map(dataset => ({
          // Prefer DEPA ID for dataset selection (backend accepts depaId or datasetId)
          datasetId: dataset.depaId || dataset.datasetId,
          individualPrice: dataset.price || 0
        })),
        // Fix: Convert single selectedAiModels string to array
        // Prefer DEPA ID for model selection (backend accepts depaId or numeric id)
        aiModelIds: selectedAiModels ? [selectedAiModels] : [],
        // Pass the complete environmentSpecs object
        environmentSpecs: environmentSpecs || {
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
        },
        // Extract comprehensive training parameters from trainingEnvironment
        trainingParams: {
          // Core training parameters (match backend expectations)
          maxEpochs: trainingEnvironment?.trainingSpecifications?.training?.hyperparameters?.epochs || 100,
          batchSize: trainingEnvironment?.trainingSpecifications?.training?.hyperparameters?.batchSize || 32,
          learningRate: trainingEnvironment?.trainingSpecifications?.training?.hyperparameters?.learningRate || 0.001,
          // Model specifications
          modelType:
            selectedModel?.type ||
            trainingEnvironment?.trainingSpecifications?.modelType ||
            'Not specified',
          modelName:
            selectedModel?.name ||
            trainingEnvironment?.trainingSpecifications?.modelName ||
            'Not specified',
          framework:
            selectedModel?.framework ||
            trainingEnvironment?.trainingSpecifications?.architecture?.framework ||
            'Not specified',
          architecture:
            selectedModel?.architecture ||
            trainingEnvironment?.trainingSpecifications?.architecture?.model ||
            'Not specified',
          parameters:
            selectedModel?.parameters ||
            trainingEnvironment?.trainingSpecifications?.architecture?.parameters ||
            'Not specified',
          // Privacy techniques (match backend expectations)
          privacyTechnique:
            selectedModel?.privacyTechnique ||
            (Array.isArray(trainingEnvironment?.trainingSpecifications?.privacy?.techniques)
              ? trainingEnvironment.trainingSpecifications.privacy.techniques.join(', ')
              : 'Not specified'),
          // Validation metrics
          validationMetrics:
            selectedModel?.validationMetrics ||
            (trainingEnvironment?.trainingSpecifications?.training?.validation?.targetAccuracy
              ? [`Target Accuracy: ${trainingEnvironment.trainingSpecifications.training.validation.targetAccuracy}`]
              : []),
          // Privacy parameters
          maxPrivacyLoss: trainingEnvironment?.trainingSpecifications?.privacy?.maxPrivacyLoss || 'Not specified',
          minAccuracy: trainingEnvironment?.trainingSpecifications?.privacy?.minAccuracy || 'Not specified',
          // Use the explicit privacy params from the form (epsilon/delta live here).
          differentialPrivacy: trainingParams.differentialPrivacy || null,
          federatedLearning: trainingParams.federatedLearning || null,
          secureMultiPartyComputation: trainingParams.secureMultiPartyComputation || null,
          // Infrastructure specs from trainingEnvironment
          computeSpecs: {
            cpu: trainingEnvironment?.ccrpPlatform?.infrastructure?.compute?.specifications?.cpu || 'Not specified',
            memory: trainingEnvironment?.ccrpPlatform?.infrastructure?.compute?.specifications?.memory || 'Not specified',
            gpu: trainingEnvironment?.ccrpPlatform?.infrastructure?.compute?.specifications?.gpu || 'Not specified',
            storage: trainingEnvironment?.ccrpPlatform?.infrastructure?.compute?.specifications?.storage || 'Not specified'
          }
        },
        // Privacy requirements (kept separate from trainingParams; both are persisted into the Ricardian document)
        privacyRequirements: {
          maxPrivacyLoss: trainingParams.maxPrivacyLoss,
          minAccuracy: trainingParams.minAccuracy,
          differentialPrivacy: trainingParams.differentialPrivacy,
          federatedLearning: trainingParams.federatedLearning,
          secureMultiPartyComputation: trainingParams.secureMultiPartyComputation,
        },
        // Add KMS configurations from environmentSpecs
        kmsConfigs: environmentSpecs?.kms || {
          provider: 'azure-key-vault',
          keyName: 'training-data-key',
          region: 'eastus'
        },
        // Add CCRP ID if selected
        ccrpId: selectedCcrp || null
      };

      // Validate contract data using Value Objects
      console.log('🔍 Validating contract data with Value Objects...');
      const validation = validationService.validateContractForm(contractPayload);
      
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join(', ');
        console.error('❌ Contract validation failed:', validation.errors);
        setContractCreationError(`Validation failed: ${errorMessages}`);
        toast.error(`Validation failed: ${errorMessages}`);
        return;
      }

      console.log('✅ Contract validation passed with Value Objects');
      console.log('📝 Creating contract with SCITT CCF integration:', contractPayload);
      createRicardianContractMutation.mutate(contractPayload);
    } catch (error) {
      console.error('Contract creation error:', error);
      setContractCreationError(error.message);
      toast.error('Failed to create contract');
    }
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
    a.download = `ricardian-contract-${createdContract?.contract?.contractId ?? createdContract?.contractId ?? 'unknown'}.json`;
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
    a.download = `legal-document-${createdContract?.contract?.contractId ?? createdContract?.contractId ?? 'unknown'}.json`;
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
              selectedTemplate={selectedTemplate}
              onTemplateSelect={(template) => {
                setSelectedTemplate(template);
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
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 600, 
                fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                color: 'primary.main',
                mb: 3
              }}
            >
              Contract Details & Dataset Selection
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={9}>
                <Card elevation={0} sx={{ bgcolor: 'transparent', border: 'none', boxShadow: 'none' }}>
                  <Tabs
                    value={step1Tab}
                    onChange={(_, v) => setStep1Tab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      mb: 2,
                      '& .MuiTab-root': { textTransform: 'none', fontWeight: 700 },
                    }}
                  >
                    <Tab label="Contract" />
                    <Tab label="Privacy" />
                    <Tab label="Datasets" />
                    <Tab label="Advanced" />
                  </Tabs>
                </Card>

                <TabPanel value={step1Tab} index={0}>
              {/* Contract Details Section */}
              <Grid item xs={12}>
                <Card elevation={2} sx={{ mb: 3 }} id="cc-step1-contract">
                  <CardContent sx={{ p: 4 }}>
                    <Typography 
                      variant="h5" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                        color: 'text.primary',
                        mb: 3
                      }}
                    >
                      Contract Details
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Duration (days)"
                          type="number"
                          value={contractData.duration}
                          onChange={(e) => setContractData({ ...contractData, duration: e.target.value })}
                          helperText="Contract execution timeline in days"
                          sx={{ 
                            '& .MuiInputLabel-root': { 
                              fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                              fontWeight: 500 
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Terms and Conditions"
                          multiline
                          rows={4}
                          value={contractData.termsAndConditions}
                          onChange={(e) => setContractData({ ...contractData, termsAndConditions: e.target.value })}
                          helperText="Legal terms and conditions for the contract"
                          sx={{ 
                            '& .MuiInputLabel-root': { 
                              fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                              fontWeight: 500 
                            }
                          }}
                        />
                      </Grid>

                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
                </TabPanel>

                <TabPanel value={step1Tab} index={1}>
              {/* Privacy & Accuracy Requirements Section */}
              <Grid item xs={12}>
                <Card elevation={2} sx={{ mb: 3 }} id="cc-step1-privacy">
                  <CardContent sx={{ p: 4 }}>
                    <Typography 
                      variant="h5" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                        color: 'text.primary',
                        mb: 3
                      }}
                    >
                      Privacy & Accuracy Requirements
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
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
                          helperText="Differential privacy epsilon parameter (0.01-1.0, lower = more private)"
                          sx={{ 
                            '& .MuiInputLabel-root': { 
                              fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                              fontWeight: 500 
                            }
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
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
                          helperText="Minimum required model accuracy (50%-99.9%)"
                          sx={{ 
                            '& .MuiInputLabel-root': { 
                              fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                              fontWeight: 500 
                            }
                          }}
                        />
                      </Grid>

                      
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ 
                            fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                            fontWeight: 500 
                          }}>Privacy Technique</InputLabel>
                      <Select
                        value={trainingParams.differentialPrivacy.enabled ? 'differential-privacy' : 
                               trainingParams.federatedLearning.enabled ? 'federated-learning' :
                               trainingParams.secureMultiPartyComputation.enabled ? 'secure-mpc' : 'differential-privacy'}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setTrainingParams({
                            ...trainingParams,
                            differentialPrivacy: {
                              ...trainingParams.differentialPrivacy,
                              enabled: selected === 'differential-privacy'
                            },
                            federatedLearning: {
                              ...trainingParams.federatedLearning,
                              enabled: selected === 'federated-learning'
                            },
                            secureMultiPartyComputation: {
                              ...trainingParams.secureMultiPartyComputation,
                              enabled: selected === 'secure-mpc'
                            }
                          });
                        }}
                        label="Privacy Technique"
                      >
                        <MenuItem value="differential-privacy">
                          <ListItemText 
                            primary="Differential Privacy"
                            secondary="Adds noise to protect individual data"
                          />
                        </MenuItem>
                        <MenuItem value="federated-learning">
                          <ListItemText 
                            primary="Federated Learning"
                            secondary="Train model without sharing raw data"
                          />
                        </MenuItem>
                        <MenuItem value="secure-mpc">
                          <ListItemText 
                            primary="Secure Multi-Party Computation"
                            secondary="Compute on encrypted data"
                          />
                        </MenuItem>
                      </Select>
                          <Typography variant="caption" color="text.secondary">
                            Select the primary privacy-preserving technique to be used
                          </Typography>
                        </FormControl>
                      </Grid>
                    </Grid>

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
                </TabPanel>

                <TabPanel value={step1Tab} index={2}>
              {/* Dataset Selection Section */}
              <Grid item xs={12}>
                <Card elevation={2} id="cc-step1-datasets">
                  <CardContent sx={{ p: 4 }}>
                    <Typography 
                      variant="h5" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                        color: 'text.primary',
                        mb: 3
                      }}
                    >
                      Select Datasets (1-3)
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      paragraph
                      sx={{ 
                        fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                        mb: 3
                      }}
                    >
                      Choose 1 to 3 AI training datasets from any Training Data Providers (TDPs).
                      You can select multiple datasets from the same TDP if needed.
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
                </TabPanel>

                <TabPanel value={step1Tab} index={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card elevation={2}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                            Advanced (optional)
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <FormControl fullWidth>
                                <InputLabel>AI Model (optional)</InputLabel>
                                <Select
                                  value={selectedAiModels}
                                  onChange={(e) => setSelectedAiModels(e.target.value)}
                                  label="AI Model (optional)"
                                  renderValue={(selected) => {
                                    if (!selected) return 'Select an AI model (optional)';
                                    const model = aiModelsResponse?.models?.find(
                                      (m) => m.depaId === selected || String(m.id) === String(selected)
                                    );
                                    return model?.name || selected;
                                  }}
                                >
                                  <MenuItem value="">
                                    <ListItemText
                                      primary="No AI Model"
                                      secondary="Proceed without selecting an AI model"
                                    />
                                  </MenuItem>
                                  {(aiModelsResponse?.models || []).map((model) => (
                                    <MenuItem key={model.id} value={model.depaId || model.id}>
                                      <ListItemText
                                        primary={model.name}
                                        secondary={`${model.depaId ? `${model.depaId} • ` : ''}${model.type} - ${model.architecture}`}
                                      />
                                    </MenuItem>
                                  ))}
                                </Select>
                                <FormHelperText>
                                  Selecting a base model helps the platform build a reproducible container spec.
                                </FormHelperText>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Override total price (USD) (optional)"
                                type="number"
                                value={contractData.price}
                                onChange={(e) => setContractData({ ...contractData, price: e.target.value })}
                                helperText="If left blank, total is derived from dataset prices"
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </TabPanel>
              </Grid>

              {/* Live Summary + what’s missing */}
              <Grid item xs={12} md={3}>
                <Box sx={{ position: { md: 'sticky' }, top: { md: 96 }, alignSelf: 'flex-start' }}>
                  <Card elevation={2} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        Contract summary
                      </Typography>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip
                          size="small"
                          color={selectedDatasets.length ? 'primary' : 'default'}
                          label={`Datasets: ${selectedDatasets.length}/3`}
                        />
                        <Chip
                          size="small"
                          label={`Duration: ${contractData.duration || '—'} days`}
                          color={contractData.duration ? 'primary' : 'default'}
                        />
                        <Chip
                          size="small"
                          label={`AI Model: ${selectedAiModels ? 'Selected' : 'Optional'}`}
                          color={selectedAiModels ? 'primary' : 'default'}
                        />
                      </Box>

                      <Typography variant="subtitle2" color="text.secondary">
                        Estimated total (datasets)
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                        $
                        {(() => {
                          const sum = selectedDatasets.reduce((acc, d) => {
                            const v = Number(datasetPrices?.[d.id] ?? d.price ?? 0);
                            return acc + (Number.isFinite(v) ? v : 0);
                          }, 0);
                          return sum.toFixed(2);
                        })()}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Privacy
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          DP enabled:{' '}
                          <strong>{trainingParams?.differentialPrivacy?.enabled ? 'Yes' : 'No'}</strong>
                        </Typography>
                        {trainingParams?.differentialPrivacy?.enabled && (
                          <Typography variant="body2" color="text.secondary">
                            ε={trainingParams.differentialPrivacy.epsilon ?? '—'} δ={trainingParams.differentialPrivacy.delta ?? '—'}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Min accuracy: <strong>{Math.round((trainingParams?.minAccuracy ?? 0) * 100)}%</strong>
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {(() => {
                    const missing = [];
                    if (!selectedDatasets.length) missing.push('Select at least 1 dataset');
                    if (!selectedDatasets.every((d) => Number(datasetPrices?.[d.id]) > 0))
                      missing.push('Set a price for each selected dataset');
                    if (!contractData.duration) missing.push('Enter duration');
                    if (!contractData.termsAndConditions) missing.push('Enter terms & conditions');
                    if (trainingParams?.differentialPrivacy?.enabled) {
                      if (!(Number(trainingParams?.differentialPrivacy?.epsilon) > 0)) missing.push('DP epsilon');
                      const delta = Number(trainingParams?.differentialPrivacy?.delta);
                      if (!(delta > 0 && delta < 1)) missing.push('DP delta');
                    }
                    if (!missing.length) return null;
                    return (
                      <Alert severity="warning">
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          Required to continue
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, my: 0 }}>
                          {missing.map((m) => (
                            <li key={m}>
                              <Typography variant="body2">{m}</Typography>
                            </li>
                          ))}
                        </Box>
                      </Alert>
                    );
                  })()}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 600, 
                fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                color: 'primary.main',
                mb: 3
              }}
            >
              Configure Environment & CCRP
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Card elevation={0} sx={{ bgcolor: 'transparent', border: 'none', boxShadow: 'none' }}>
                  <Tabs
                    value={step2Tab}
                    onChange={(_, v) => setStep2Tab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      mb: 2,
                      '& .MuiTab-root': { textTransform: 'none', fontWeight: 700 },
                    }}
                  >
                    <Tab label="CCRP" />
                    <Tab label="Environment" />
                    <Tab label="KMS" />
                  </Tabs>
                </Card>

                <TabPanel value={step2Tab} index={0}>
                  <Card elevation={2} sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                          color: 'text.primary',
                          mb: 3,
                        }}
                      >
                        CCRP Selection (Required)
                      </Typography>

                      <Typography
                        variant="body1"
                        color="text.secondary"
                        paragraph
                        sx={{
                          fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                          mb: 3,
                        }}
                      >
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
                        <MultiCCRPSelector
                          ccrpUsers={availableCcrpUsers}
                          selectedCcrp={selectedCcrp}
                          onCcrpToggle={setSelectedCcrp}
                          selectedCloudProvider={selectedCloudProvider}
                          onCloudProviderChange={setSelectedCloudProvider}
                          onCcrpCloudProviderSelect={() => {}}
                          ccrpCloudProviderSelections={{}}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </TabPanel>

                <TabPanel value={step2Tab} index={1}>
                  <Card elevation={2}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                          color: 'text.primary',
                          mb: 3,
                        }}
                      >
                        Environment Specifications
                      </Typography>

                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Environment Type</InputLabel>
                            <Select
                              value={environmentSpecs.type}
                              onChange={(e) => handleEnvironmentSpecChange('type', e.target.value)}
                              label="Environment Type"
                            >
                              <MenuItem value="cloud">Cloud Environment</MenuItem>
                              <MenuItem value="on-premise">On-Premise</MenuItem>
                              <MenuItem value="hybrid">Hybrid</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Instance Type"
                            value={environmentSpecs.instanceType}
                            onChange={(e) => handleEnvironmentSpecChange('instanceType', e.target.value)}
                            placeholder="e.g., t3.large, Standard_D4s_v3"
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="CPU Requirements"
                            value={environmentSpecs.cpu}
                            onChange={(e) => handleEnvironmentSpecChange('cpu', e.target.value)}
                            placeholder="e.g., 4 cores"
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Memory Requirements"
                            value={environmentSpecs.memory}
                            onChange={(e) => handleEnvironmentSpecChange('memory', e.target.value)}
                            placeholder="e.g., 16 GB"
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Storage Requirements"
                            value={environmentSpecs.storage}
                            onChange={(e) => handleEnvironmentSpecChange('storage', e.target.value)}
                            placeholder="e.g., 100 GB SSD"
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>GPU Type</InputLabel>
                            <Select
                              value={environmentSpecs.gpu}
                              onChange={(e) => handleEnvironmentSpecChange('gpu', e.target.value)}
                              label="GPU Type"
                            >
                              <MenuItem value="">None</MenuItem>
                              <MenuItem value="nvidia-tesla-v100">NVIDIA Tesla V100</MenuItem>
                              <MenuItem value="nvidia-tesla-t4">NVIDIA Tesla T4</MenuItem>
                              <MenuItem value="nvidia-a100">NVIDIA A100</MenuItem>
                              <MenuItem value="nvidia-rtx-3080">NVIDIA RTX 3080</MenuItem>
                              <MenuItem value="amd-radeon-instinct">AMD Radeon Instinct</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Additional Environment Notes"
                            value={environmentSpecs.notes}
                            onChange={(e) => handleEnvironmentSpecChange('notes', e.target.value)}
                            multiline
                            rows={3}
                            placeholder="Any additional environment specifications or requirements..."
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </TabPanel>

                <TabPanel value={step2Tab} index={2}>
                  <Card elevation={2}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                          color: 'text.primary',
                          mb: 3,
                        }}
                      >
                        Key Management Service (KMS) Configuration
                      </Typography>

                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>KMS Provider</InputLabel>
                            <Select
                              value={environmentSpecs.kms?.provider || ''}
                              onChange={(e) => handleKmsConfigChange('provider', e.target.value)}
                              label="KMS Provider"
                            >
                              <MenuItem value="">None</MenuItem>
                              <MenuItem value="aws-kms">AWS KMS</MenuItem>
                              <MenuItem value="azure-keyvault">Azure Key Vault</MenuItem>
                              <MenuItem value="gcp-kms">Google Cloud KMS</MenuItem>
                              <MenuItem value="hashicorp-vault">HashiCorp Vault</MenuItem>
                              <MenuItem value="custom">Custom KMS</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Key ID/ARN"
                            value={environmentSpecs.kms?.keyId || ''}
                            onChange={(e) => handleKmsConfigChange('keyId', e.target.value)}
                            placeholder="KMS Key ID or ARN"
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Encryption Algorithm"
                            value={environmentSpecs.kms?.algorithm || ''}
                            onChange={(e) => handleKmsConfigChange('algorithm', e.target.value)}
                            placeholder="e.g., AES-256-GCM"
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Key Rotation Period (days)"
                            type="number"
                            value={environmentSpecs.kms?.rotationPeriod || ''}
                            onChange={(e) => handleKmsConfigChange('rotationPeriod', e.target.value)}
                            placeholder="e.g., 90"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </TabPanel>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ position: { md: 'sticky' }, top: { md: 96 }, alignSelf: 'flex-start' }}>
                  <Card elevation={2} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        Environment summary
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        CCRP: <strong>{selectedCcrp ? 'Selected' : '—'}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cloud provider: <strong>{selectedCloudProvider || environmentSpecs?.kms?.region ? (selectedCloudProvider || '—') : '—'}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        KMS provider: <strong>{environmentSpecs?.kms?.provider || '—'}</strong>
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Tip: keep this minimal—most fields are optional and can be expanded later.
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
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
                        {(() => {
                          const ld = legalDocument?.legalDocument ?? legalDocument;
                          const md = legalDocument?.metadata ?? {};
                          return (
                            <>
                              <KeyValue label="Contract ID" value={md.contractId ?? ld?.contractId} mono />
                              <KeyValue label="Effective date" value={ld?.effectiveDate} />
                              <KeyValue label="Expiration date" value={ld?.expirationDate} />
                            </>
                          );
                        })()}
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Parties:
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="Data Provider (TDP)"
                              secondary={
                                legalDocument?.legalDocument?.parties?.dataProvider?.name ??
                                legalDocument?.legalDocument?.parties?.dataProviders?.[0]?.name ??
                                legalDocument?.legalDocument?.parties?.dataProviders?.[0]?.email ??
                                legalDocument?.legalDocument?.parties?.dataProvider?.email ??
                                '—'
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Model Trainer (TDC)"
                              secondary={
                                legalDocument?.legalDocument?.parties?.modelTrainer?.name ??
                                legalDocument?.legalDocument?.parties?.modelTrainer?.email ??
                                '—'
                              }
                            />
                          </ListItem>
                        </List>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Cryptographic Binding:
                        </Typography>
                        <Box
                          sx={{
                            mt: 1,
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default',
                          }}
                        >
                          <KeyValue label="Hash" value={legalDocument?.metadata?.legalDocumentHash} mono />
                          <KeyValue label="Signature" value={legalDocument?.metadata?.ricardianSignature} mono />
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Generate preview to review document details
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
                        <KeyValue label="Contract address" value={smartContractData.address} mono />
                        <KeyValue label="Network" value={smartContractData.network} />
                        <KeyValue label="Contract ID" value={smartContractData.contractId} mono />
                        
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
                          Generate preview to review smart contract details
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Model Information */}
            {selectedAiModels && (
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Selected AI Model
                      </Typography>
                      

                      
                      <Grid container spacing={2}>
                        {(() => {
                          // Convert selectedAiModels to number for comparison
                          const selectedModelId = selectedAiModels;
                          const model = aiModelsResponse?.models?.find(m => m.id === selectedModelId);
                          

                          
                          if (!selectedAiModels) {
                            return (
                              <Grid item xs={12}>
                                <Alert severity="info">
                                  <Typography variant="body2">
                                    No AI model selected. Please go back to Step 3 and select an AI model.
                                  </Typography>
                                </Alert>
                              </Grid>
                            );
                          }
                          
                          if (!model) {
                            return (
                              <Grid item xs={12}>
                                <Alert severity="warning">
                                  <Typography variant="body2">
                                    No AI model found with ID: {selectedAiModels}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Available models: {aiModelsResponse?.models?.map(m => `${m.name} (ID: ${m.id})`).join(', ') || 'None'}
                                  </Typography>

                                </Alert>
                              </Grid>
                            );
                          }
                          
                          return (
                            <Grid item xs={12} md={6} key={selectedAiModels}>
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

      case 5:
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
                          {createdContract?.contract?.contractId ?? createdContract?.contractId ?? '—'}
                        </Typography>
                        <Typography variant="subtitle2">Status:</Typography>
                        <Typography variant="body2" gutterBottom>
                          {createdContract?.contract?.status ?? createdContract?.status ?? '—'}
                        </Typography>
                        <Typography variant="subtitle2">Smart Contract Address:</Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace' }}>
                          {createdContract.smartContractData?.address}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Legal Document Hash:</Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {createdContract?.contract?.legalDocumentHash ?? createdContract?.legalDocumentHash ?? '—'}
                        </Typography>
                        <Typography variant="subtitle2">Contract Signature:</Typography>
                        <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {createdContract?.contract?.ricardianSignature ?? createdContract?.ricardianSignature ?? '—'}
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
                        onClick={() => {
                          const id = createdContract?.contract?.contractId ?? createdContract?.contractId;
                          if (id) navigate(`/contracts/${id}`);
                        }}
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
                      Ricardian Contract
                    </Typography>
                    
                    <Typography variant="subtitle2">Dataset:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {selectedDatasets.map(ds => ds.name).join(', ')}
                    </Typography>
                    
                    <Typography variant="subtitle2">AI Model:</Typography>
                    <Typography variant="body2" gutterBottom>
                      {selectedAiModels 
                        ? (() => {
                            const model = aiModelsResponse?.models?.find(m => m.id === selectedAiModels);
                            return model?.name || selectedAiModels;
                          })()
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Create Contract
        </Typography>
        <Chip 
          label="SCITT CCF" 
          color="primary" 
          variant="outlined"
          icon={<VerifiedIcon />}
          size="small"
        />
      </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create a contract with SCITT CCF integration for enhanced provenance tracking and blockchain transparency.
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
            <>
              {!legalDocument && !smartContractData ? (
                <Button
                  variant="contained"
                  onClick={generatePreview}
                  disabled={isGeneratingPreview}
                  startIcon={isGeneratingPreview ? <CircularProgress size={20} /> : null}
                >
                  {isGeneratingPreview ? 'Generating Preview...' : 'Generate Preview'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleCreateContract}
                  disabled={createRicardianContractMutation.isLoading}
                >
                  {createRicardianContractMutation.isLoading
                    ? 'Creating SCITT CCF Contract...'
                    : 'Create SCITT CCF Contract'}
                </Button>
              )}
            </>
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