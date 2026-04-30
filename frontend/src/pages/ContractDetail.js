import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Person,
  Storage,
  Edit,
  Save,
  Cancel,
  Visibility,
  Security,
  Payment,
  CheckCircle,
  Warning,
  Error,
  Info,
  ExpandLess,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Pending,
  AttachMoney,
  Download,
  Description,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { ethers } from 'ethers';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';
import { signES256, testSigningProcess } from '../utils/es256sign';

const StatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_TDP_APPROVAL':
      case 'PENDING_CCRP_APPROVAL':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle fontSize="small" />;
      case 'PENDING_TDP_APPROVAL':
      case 'PENDING_CCRP_APPROVAL':
        return <Pending fontSize="small" />;
      case 'COMPLETED':
        return <CheckCircle fontSize="small" />;
      case 'CANCELLED':
        return <Error fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Chip
      label={status.replace(/_/g, ' ')}
      color={getStatusColor(status)}
      size="medium"
      icon={getStatusIcon(status)}
    />
  );
};

const TDPStatusChip = ({ signed, signedAt }) => {
  if (signed) {
    return (
      <Chip
        label={`Signed ${format(new Date(signedAt), 'MMM dd, yyyy')}`}
        color="success"
        size="small"
        icon={<CheckCircle fontSize="small" />}
      />
    );
  }
  return (
    <Chip
      label="Pending"
      color="warning"
      size="small"
      icon={<Pending fontSize="small" />}
    />
  );
};

const PaymentStatusChip = ({ paid, paidAt, amount }) => {
  if (paid) {
    return (
      <Chip
        label={`Paid $${amount} ${format(new Date(paidAt), 'MMM dd, yyyy')}`}
        color="success"
        size="small"
        icon={<AttachMoney fontSize="small" />}
      />
    );
  }
  return (
    <Chip
      label={`Pending $${amount}`}
      color="warning"
      size="small"
      icon={<Payment fontSize="small" />}
    />
  );
};

// Custom JSON Tree Viewer Component
const JsonTreeView = ({ data, label = 'root', level = 0 }) => {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels
  
  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const getTypeIcon = (data) => {
    if (data === null || data === undefined) return <Error fontSize="small" color="error" />;
    if (typeof data === 'string') return <Typography fontSize="small" color="primary">"</Typography>;
    if (typeof data === 'number') return <Typography fontSize="small" color="success.main">#</Typography>;
    if (typeof data === 'boolean') return <Typography fontSize="small" color={data ? 'success.main' : 'error'}>⚡</Typography>;
    if (Array.isArray(data)) return <Typography fontSize="small" color="info.main">[]</Typography>;
    if (typeof data === 'object') return <Typography fontSize="small" color="warning.main">{}</Typography>;
    return <Info fontSize="small" color="text.secondary" />;
  };

  const renderValue = (data) => {
    if (data === null || data === undefined) {
      return (
        <Typography variant="body2" color="error" fontFamily="monospace">
          {data === null ? 'null' : 'undefined'}
        </Typography>
      );
    }

    if (typeof data === 'string') {
      return (
        <Typography variant="body2" color="primary" fontFamily="monospace">
          "{data.length > 50 ? data.substring(0, 50) + '...' : data}"
        </Typography>
      );
    }

    if (typeof data === 'number') {
      return (
        <Typography variant="body2" color="success.main" fontFamily="monospace">
          {data}
        </Typography>
      );
    }

    if (typeof data === 'boolean') {
      return (
        <Typography variant="body2" color={data ? 'success.main' : 'error'} fontFamily="monospace">
          {data.toString()}
        </Typography>
      );
    }

    if (Array.isArray(data)) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="info.main" fontFamily="monospace">
            Array({data.length})
          </Typography>
          {data.length > 0 && (
            <Chip 
              label={`${data.length} items`} 
              size="small" 
              color="info" 
              variant="outlined"
            />
          )}
        </Box>
      );
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="warning.main" fontFamily="monospace">
            Object({keys.length})
          </Typography>
          {keys.length > 0 && (
            <Chip 
              label={`${keys.length} keys`} 
              size="small" 
              color="warning" 
              variant="outlined"
            />
          )}
        </Box>
      );
    }

    return null;
  };

  const renderChildren = (data) => {
    if (Array.isArray(data)) {
      return data.map((item, index) => (
        <Box key={`${label}-${index}`} sx={{ ml: 3, borderLeft: '1px solid #e0e0e0', pl: 2 }}>
          <JsonTreeView data={item} label={`[${index}]`} level={level + 1} />
        </Box>
      ));
    }

    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      return keys.map((key) => (
        <Box key={`${label}-${key}`} sx={{ ml: 3, borderLeft: '1px solid #e0e0e0', pl: 2 }}>
          <JsonTreeView data={data[key]} label={key} level={level + 1} />
        </Box>
      ));
    }

    return null;
  };

  const hasChildren = (data) => {
    return (Array.isArray(data) && data.length > 0) || 
           (typeof data === 'object' && data !== null && Object.keys(data).length > 0);
  };

  return (
    <Box>
      <Box 
        display="flex" 
        alignItems="center" 
        gap={1} 
        sx={{ 
          cursor: hasChildren(data) ? 'pointer' : 'default',
          '&:hover': hasChildren(data) ? { backgroundColor: '#f5f5f5' } : {}
        }}
        onClick={hasChildren(data) ? handleToggle : undefined}
      >
        {hasChildren(data) && (
          <IconButton size="small" onClick={handleToggle}>
            {expanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
          </IconButton>
        )}
        {getTypeIcon(data)}
        <Typography variant="body2" color="textSecondary" fontWeight="medium">
          {label}:
        </Typography>
        {renderValue(data)}
      </Box>
      
      {expanded && hasChildren(data) && (
        <Box sx={{ mt: 1 }}>
          {renderChildren(data)}
        </Box>
      )}
    </Box>
  );
};

function ContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { currentUser, isAuthenticated, isTDC, isTDP, isCCRP } = useUser();
  const [ccrpDialogOpen, setCcrpDialogOpen] = useState(false);
  const [selectedCcrp, setSelectedCcrp] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTDP, setSelectedTDP] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    duration: '',
    termsAndConditions: '',
    ccrpId: '',
    ccrpCloudProvider: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch contract details
  const { data: contract, isLoading, error } = useQuery(
    ['contract', contractId],
    () => apiService.getContract(contractId)
  );

  // Get datasets for display (handle both old and new format)
  const displayDatasets = contract?.contractDatasets || contract?.datasetSelections || contract?.datasets || [];

  // Debug: Log contract data to see what Ricardian fields are present
  React.useEffect(() => {
    if (contract) {
      console.log('🔍 Contract data:', contract);
      console.log('🔍 Ricardian fields check:');
      console.log('  - legalDocumentHash:', contract.legalDocumentHash);
      console.log('  - smartContractAddress:', contract.smartContractAddress);
      console.log('  - ricardianSignature:', contract.ricardianSignature);
      console.log('  - trainingParams:', contract.trainingParams);
      console.log('  - environmentSpecs:', contract.environmentSpecs);
      console.log('  - kmsConfigs:', contract.kmsConfigs);
      console.log('  - attestationVerified:', contract.attestationVerified);
      console.log('  - attestationReport:', contract.attestationReport);
      console.log('  - multiTdpStatus:', contract.multiTdpStatus);
      console.log('  - totalPrice:', contract.totalPrice);
      console.log('  - datasetCount:', contract.datasetCount);
      console.log('  - tdpCount:', contract.tdpCount);
      console.log('  - contractDatasets:', contract.contractDatasets);
      console.log('  - tdpSignatures:', contract.tdpSignatures);
      console.log('  - tdpPayments:', contract.tdpPayments);
      
      const hasRicardianFields = (
        contract.legalDocumentHash || contract.smartContractAddress || contract.ricardianSignature || 
        contract.trainingParams || contract.environmentSpecs || contract.kmsConfigs || 
        contract.attestationVerified !== undefined || contract.attestationReport ||
        contract.multiTdpStatus || contract.totalPrice || contract.datasetCount || contract.tdpCount ||
        contract.contractDatasets || contract.tdpSignatures || contract.tdpPayments
      );
      console.log('🔍 Should show Ricardian section:', hasRicardianFields);
    }
  }, [contract]);

  // Check for edit parameter in URL and enter edit mode if present
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editParam = searchParams.get('edit');
    
    if (editParam === 'true' && contract && canEditContract()) {
      handleEditMode();
      // Remove the edit parameter from URL
      navigate(`/contracts/${contractId}`, { replace: true });
    }
  }, [contract, location.search]);

  // Fetch multi-TDP contract status
  const { data: multiTDPStatus } = useQuery(
    ['multi-tdp-status', contractId],
    () => apiService.getMultiTDPContractStatus(contractId),
    {
      enabled: !!displayDatasets && displayDatasets.length > 1
    }
  );

  // Contract update mutation
  const updateContractMutation = useMutation(
    (updateData) => apiService.updateContract(contractId, updateData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['contract', contractId]);
        setIsEditMode(false);
        toast.success('Contract updated successfully!');
      },
      onError: (error) => {
        console.error('Contract update error:', error);
        const errorMsg = error.response?.data?.error || 'Failed to update contract';
        setEditError(errorMsg);
        toast.error(errorMsg);
      },
    }
  );

  // Fetch payment summary
  const { data: paymentSummary } = useQuery(
    ['payment-summary', contractId],
    () => apiService.getPaymentSummary(contractId),
    {
      enabled: !!displayDatasets && displayDatasets.length > 1
    }
  );

  // Fetch users for CCRP selection
  const { data: users = [] } = useQuery('users', apiService.getUsers);
  
  // Manual CCRP users fetch to avoid React Query parameter injection
  const [ccrpUsersResponse, setCcrpUsersResponse] = React.useState(null);
  const [ccrpLoading, setCcrpLoading] = React.useState(true);
  const [ccrpError, setCcrpError] = React.useState(null);
  
  React.useEffect(() => {
    const fetchCcrpUsers = async () => {
      try {
        setCcrpLoading(true);
        const response = await apiService.getCCRPUsers();
        setCcrpUsersResponse(response);
        setCcrpError(null);
      } catch (error) {
        console.error('❌ CCRP users fetch error:', error);
        setCcrpError(error);
        setCcrpUsersResponse(null);
      } finally {
        setCcrpLoading(false);
      }
    };
    
    fetchCcrpUsers();
  }, []);
  
  const ccrpUsers = ccrpUsersResponse?.ccrpUsers || [];

  // Mutations
  const signContractMutation = useMutation(
    (data) => apiService.signContract(contractId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contract', contractId]);
        queryClient.invalidateQueries(['multi-tdp-status', contractId]);
        toast.success('Contract signed successfully');
      },
      onError: () => {
        toast.error('Failed to sign contract');
      },
    }
  );

  const signContractAsTDPMutation = useMutation(
    ({ tdpId, data }) => apiService.signContractAsTDP(contractId, tdpId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contract', contractId]);
        queryClient.invalidateQueries(['multi-tdp-status', contractId]);
        toast.success('Contract signed successfully as TDP');
      },
      onError: () => {
        toast.error('Failed to sign contract as TDP');
      },
    }
  );

  const recordPaymentMutation = useMutation(
    ({ tdpId, paymentData }) => apiService.recordPaymentForTDP(contractId, tdpId, paymentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['payment-summary', contractId]);
        setPaymentDialogOpen(false);
        setSelectedTDP(null);
        setPaymentAmount('');
        toast.success('Payment recorded successfully');
      },
      onError: () => {
        toast.error('Failed to record payment');
      },
    }
  );

  const selectCcrpMutation = useMutation(
    (data) => apiService.selectCCRP(contractId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contract', contractId]);
        setCcrpDialogOpen(false);
        toast.success('CCRP selected successfully');
      },
      onError: () => {
        toast.error('Failed to select CCRP');
      },
    }
  );

  const completeContractMutation = useMutation(
    (data) => apiService.completeContract(contractId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contract', contractId]);
        toast.success('Contract completed successfully');
      },
      onError: () => {
        toast.error('Failed to complete contract');
      },
    }
  );

  const cancelContractMutation = useMutation(
    (data) => apiService.cancelContract(contractId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contract', contractId]);
        toast.success('Contract cancelled successfully');
      },
      onError: () => {
        toast.error('Failed to cancel contract');
      },
    }
  );

  // Check if this is a multi-TDP contract (handle both old and new Ricardian format)
  const isMultiTDPContract = (displayDatasets && displayDatasets.length > 1);

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading contract details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load contract details: {error.message}
        </Alert>
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Contract not found.
        </Alert>
      </Box>
    );
  }

  const handleSignContract = async (partyType) => {
    setSigning(true);
    setSignError('');

    try {
      const signingData = await apiService.getContractSigningData(contractId);
      
      // Test signing process
      const testResult = await testSigningProcess(signingData.message);
      
      if (testResult.success) {
        const signature = testResult.signature;
        
        const signPayload = {
          signature,
          partyType,
          timestamp: new Date().toISOString(),
          walletAddress: currentUser.walletAddress,
          did: currentUser.did
        };

        if (partyType === 'TDP' && isMultiTDPContract) {
          // Find the TDP ID for the current user
          const tdpDataset = displayDatasets.find(dataset => 
            dataset.tdpId === currentUser.id || dataset.tdp?.id === currentUser.id
          );
          
          if (tdpDataset) {
            await signContractAsTDPMutation.mutateAsync({
              tdpId: tdpDataset.tdpId,
              data: signPayload
            });
          } else {
            setSignError('You are not a TDP for this contract');
          }
        } else {
          await signContractMutation.mutateAsync(signPayload);
        }
      } else {
        setSignError('Failed to generate signature');
      }
    } catch (error) {
      console.error('Signing error:', error);
      setSignError(error.message || 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  const handleCompleteContract = async () => {
    try {
      await completeContractMutation.mutateAsync({
        completedAt: new Date().toISOString(),
        completionNotes: 'Contract completed successfully'
      });
    } catch (error) {
      console.error('Complete contract error:', error);
    }
  };

  const handleCancelContract = async () => {
    try {
      await cancelContractMutation.mutateAsync({
        cancelledAt: new Date().toISOString(),
        cancellationReason: 'Contract cancelled by user'
      });
    } catch (error) {
      console.error('Cancel contract error:', error);
    }
  };

  // Edit mode handlers
  const handleEditMode = () => {
    if (!contract) return;
    
    setEditFormData({
      duration: contract.duration?.toString() || '',
      termsAndConditions: contract.termsAndConditions || '',
      ccrpId: contract.ccrpId?.toString() || '',
      ccrpCloudProvider: contract.ccrpCloudProvider || ''
    });
    setIsEditMode(true);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({
      duration: '',
      termsAndConditions: '',
      ccrpId: '',
      ccrpCloudProvider: ''
    });
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!contract) return;

    setEditLoading(true);
    setEditError('');

    try {
      const updateData = {};
      
      // Only include fields that have changed
      if (editFormData.duration !== contract.duration?.toString()) {
        updateData.duration = parseInt(editFormData.duration);
      }
      
      if (editFormData.termsAndConditions !== contract.termsAndConditions) {
        updateData.termsAndConditions = editFormData.termsAndConditions;
      }
      
      if (editFormData.ccrpId !== contract.ccrpId?.toString()) {
        updateData.ccrpId = editFormData.ccrpId ? parseInt(editFormData.ccrpId) : null;
      }
      
      if (editFormData.ccrpCloudProvider !== contract.ccrpCloudProvider) {
        updateData.ccrpCloudProvider = editFormData.ccrpCloudProvider;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateContractMutation.mutateAsync(updateData);
      } else {
        setIsEditMode(false);
        toast.info('No changes to save');
      }
    } catch (error) {
      console.error('Error saving contract:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // Check if contract can be edited
  const canEditContract = () => {
    if (!contract || !isTDC) return false;
    
    // Only TDC who created the contract can edit
    if (contract.tdcId !== currentUser?.id) return false;
    
    // Only pending contracts can be edited
    const editableStatuses = ['PENDING_TDP_APPROVAL', 'PENDING_ALL_TDP_APPROVAL'];
    const isEditableStatus = editableStatuses.includes(contract.status) || 
                            editableStatuses.includes(contract.multiTdpStatus);
    
    // Cannot edit if any party has signed
    const hasSignedParties = contract.tdpSigned || contract.ccrpSigned;
    
    return isEditableStatus && !hasSignedParties;
  };

  const handleRecordPayment = async () => {
    if (!selectedTDP || !paymentAmount) {
      toast.error('Please select TDP and enter payment amount');
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        tdpId: selectedTDP.id,
        paymentData: {
          amount: parseFloat(paymentAmount),
          paidAt: new Date().toISOString(),
          paymentMethod: 'bank_transfer',
          reference: `PAY-${Date.now()}`
        }
      });
    } catch (error) {
      console.error('Record payment error:', error);
    }
  };

  const saveContractLocally = () => {
    if (!contract) return;

    const contractData = {
      contractId: contract.contractId,
      status: contract.status,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      duration: contract.duration,
      price: contract.price,
      totalPrice: contract.totalPrice,
      termsAndConditions: contract.termsAndConditions,
      
      // Parties
      tdp: contract.tdp,
      tdc: contract.tdc,
      ccrp: contract.ccrp,
      
              // Dataset information
        dataset: displayDatasets[0],
              datasets: displayDatasets,
      contractDatasets: contract.contractDatasets,
      datasetCount: contract.datasetCount,
      tdpCount: contract.tdpCount,
      
      // Signatures and workflow
      tdpSigned: contract.tdpSigned,
      tdpSignedAt: contract.tdpSignedAt,
      ccrpSigned: contract.ccrpSigned,
      ccrpSignedAt: contract.ccrpSignedAt,
      tdpSignatures: contract.tdpSignatures,
      tdpPayments: contract.tdpPayments,
      multiTdpStatus: contract.multiTdpStatus,
      
      // Contract fields
      legalDocumentHash: contract.legalDocumentHash,
      ricardianSignature: contract.ricardianSignature,
      smartContractAddress: contract.smartContractAddress,
      smartContractNetwork: contract.smartContractNetwork,
      blockchainContractId: contract.blockchainContractId,
      legalDocument: contract.legalDocument,
      
      // Technical parameters
      trainingParams: contract.trainingParams,
      environmentSpecs: contract.environmentSpecs,
      kmsConfigs: contract.kmsConfigs,
      
      // Attestation and verification
      attestationVerified: contract.attestationVerified,
      attestationReport: contract.attestationReport,
      
      // Payment information
      paidAmount: paymentSummary?.paidAmount || 0,
      pendingAmount: paymentSummary?.pendingAmount || 0,
      totalAmount: paymentSummary?.totalAmount || 0,
      
      // Multi-TDP status information
      multiTdpStatus: multiTDPStatus,
    };

    const blob = new Blob([JSON.stringify(contractData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.contractId}_complete_contract.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Complete contract downloaded successfully!');
  };

  const saveLegalDocument = () => {
    if (!contract.legalDocument) {
      toast.error('No legal document available to download.');
      return;
    }

    const legalDoc = typeof contract.legalDocument === 'string' 
      ? JSON.parse(contract.legalDocument) 
      : contract.legalDocument;

    const blob = new Blob([JSON.stringify(legalDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.contractId}_legal_document.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Legal document downloaded successfully!');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contract Details
      </Typography>

      <Grid container spacing={3}>
        {/* Contract Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  {/* Contract ID Field */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" fontSize="0.75rem" gutterBottom>
                      Contract ID (Ricardian)
                    </Typography>
                    <Typography variant="h5" fontFamily="monospace" sx={{ 
                      backgroundColor: 'grey.100', 
                      padding: '12px 16px', 
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}>
                      {contract.contractId || 'NULL'}
                    </Typography>
                  </Box>
                  
                  {/* Global DEPA ID Field */}
                  {contract.depaId && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" fontSize="0.75rem" gutterBottom>
                        Global DEPA ID
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" sx={{ 
                        backgroundColor: 'primary.50', 
                        padding: '12px 16px', 
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: 'primary.200',
                        color: 'primary.700'
                      }}>
                        {contract.depaId}
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Created: {format(new Date(contract.createdAt), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                  {isMultiTDPContract && (
                    <Chip 
                      label="Multi-TDP Contract" 
                      color="primary" 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
                <StatusChip status={contract.status} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contract Datasets & TDPs Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contract Datasets & TDPs
              </Typography>
              
              {isMultiTDPContract ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Dataset</TableCell>
                        <TableCell>TDP</TableCell>
                        <TableCell>DEPA IDs</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayDatasets.map((dataset, index) => {
                        // Handle both old and new dataset formats
                        const datasetName = dataset.name || dataset.datasetName || `Dataset ${index + 1}`;
                        const datasetDescription = dataset.description || 'No description available';
                        const datasetCategory = dataset.category || 'Unknown';
                        const datasetSize = dataset.size || 0;
                        const datasetPrice = dataset.price || dataset.individualPrice || 0;
                        const tdpName = dataset.tdp?.name || dataset.tdpName || 'Unknown TDP';
                        const tdpEmail = dataset.tdp?.email || 'No email';
                        const tdpId = dataset.tdp?.id || dataset.tdpId;
                        const depaId = dataset.depaId || 'Not assigned';
                        const tdpDepaId = dataset.tdp?.depaId || 'Not assigned';
                        
                        return (
                          <TableRow key={dataset.id || index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {datasetName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {datasetDescription}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Category: {datasetCategory} | Size: {datasetSize} MB
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {tdpName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {tdpEmail}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption" fontFamily="monospace" fontSize="0.7rem">
                                  Dataset: {depaId}
                                </Typography>
                                <Typography variant="caption" fontFamily="monospace" fontSize="0.7rem">
                                  TDP: {tdpDepaId}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                ${datasetPrice}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TDPStatusChip 
                                signed={dataset.tdpSigned} 
                                signedAt={dataset.tdpSignedAt}
                              />
                            </TableCell>
                            <TableCell>
                              <PaymentStatusChip 
                                paid={dataset.paymentPaid}
                                paidAt={dataset.paymentPaidAt}
                                amount={datasetPrice}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                {/* TDP Signing */}
                                {isTDP && (tdpId === currentUser.id) && 
                                 !dataset.tdpSigned && contract.status === 'PENDING_TDP_APPROVAL' && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleSignContract('TDP')}
                                    disabled={signing}
                                  >
                                    {signing ? 'Signing...' : 'Sign'}
                                  </Button>
                                )}
                                
                                {/* TDC Payment Recording */}
                                {isTDC && contract.tdc?.id === currentUser.id && 
                                 dataset.tdpSigned && !dataset.paymentPaid && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                      setSelectedTDP({ id: tdpId, name: tdpName, email: tdpEmail });
                                      setPaymentAmount(datasetPrice.toString());
                                      setPaymentDialogOpen(true);
                                    }}
                                  >
                                    Record Payment
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box display="flex" alignItems="center" gap={2}>
                  <Storage color="primary" />
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {displayDatasets[0]?.name || displayDatasets[0]?.datasetName || 'Dataset'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {displayDatasets[0]?.description || 'No description available'}
                    </Typography>
                    <Typography variant="body2" fontSize="0.75rem" color="textSecondary">
                      Category: {displayDatasets[0]?.category || 'Unknown'} | Size: {displayDatasets[0]?.size || 0} MB
                    </Typography>
                    <Typography variant="caption" fontFamily="monospace" fontSize="0.7rem">
                      Dataset DEPA ID: {displayDatasets[0]?.depaId || 'Not assigned'}
                    </Typography>
                    <Typography variant="caption" fontFamily="monospace" fontSize="0.7rem">
                      TDP DEPA ID: {displayDatasets[0]?.tdp?.depaId || displayDatasets[0]?.tdpName || 'Not assigned'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Model Information */}
        {Array.isArray(contract.modelInfoList) && contract.modelInfoList.length > 0 ? (
          contract.modelInfoList.map((model, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Model Information
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {model.modelDepaId && (
                      <>
                        <Typography variant="body2" color="textSecondary">Model DEPA ID</Typography>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{model.modelDepaId}</Typography>
                      </>
                    )}
                    <Typography variant="body2" color="textSecondary">Model Name</Typography>
                    <Typography variant="body1">{model.modelName}</Typography>
                    <Typography variant="body2" color="textSecondary">Model Type</Typography>
                    <Typography variant="body1">{model.modelType}</Typography>
                    <Typography variant="body2" color="textSecondary">Architecture</Typography>
                    <Typography variant="body1">{model.architecture}</Typography>
                    <Typography variant="body2" color="textSecondary">Framework</Typography>
                    <Typography variant="body1">{model.framework}</Typography>
                    <Typography variant="body2" color="textSecondary">Parameters</Typography>
                    <Typography variant="body1">{model.parameters}</Typography>
                    <Typography variant="body2" color="textSecondary">Privacy Technique</Typography>
                    <Typography variant="body1">{model.privacyTechnique}</Typography>
                    <Typography variant="body2" color="textSecondary">Validation Metrics</Typography>
                    <Typography variant="body1">
                      {Array.isArray(model.validationMetrics) 
                        ? model.validationMetrics.join(', ') 
                        : typeof model.validationMetrics === 'object' 
                          ? Object.keys(model.validationMetrics).join(', ')
                          : model.validationMetrics || 'Not specified'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">Max Epochs</Typography>
                    <Typography variant="body1">{model.maxEpochs}</Typography>
                    <Typography variant="body2" color="textSecondary">Batch Size</Typography>
                    <Typography variant="body1">{model.batchSize}</Typography>
                    <Typography variant="body2" color="textSecondary">Learning Rate</Typography>
                    <Typography variant="body1">{model.learningRate}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : contract.modelInfo && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Model Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {contract.modelInfo.modelDepaId && (
                    <>
                      <Typography variant="body2" color="textSecondary">Model DEPA ID</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{contract.modelInfo.modelDepaId}</Typography>
                    </>
                  )}
                  <Typography variant="body2" color="textSecondary">Model Name</Typography>
                  <Typography variant="body1">{contract.modelInfo.modelName}</Typography>
                  <Typography variant="body2" color="textSecondary">Model Type</Typography>
                  <Typography variant="body1">{contract.modelInfo.modelType}</Typography>
                  <Typography variant="body2" color="textSecondary">Architecture</Typography>
                  <Typography variant="body1">{contract.modelInfo.architecture}</Typography>
                  <Typography variant="body2" color="textSecondary">Framework</Typography>
                  <Typography variant="body1">{contract.modelInfo.framework}</Typography>
                  <Typography variant="body2" color="textSecondary">Parameters</Typography>
                  <Typography variant="body1">{contract.modelInfo.parameters}</Typography>
                  <Typography variant="body2" color="textSecondary">Privacy Technique</Typography>
                  <Typography variant="body1">{contract.modelInfo.privacyTechnique}</Typography>
                  <Typography variant="body2" color="textSecondary">Validation Metrics</Typography>
                  <Typography variant="body1">
                    {Array.isArray(contract.modelInfo.validationMetrics) 
                      ? contract.modelInfo.validationMetrics.join(', ') 
                      : typeof contract.modelInfo.validationMetrics === 'object' 
                        ? Object.keys(contract.modelInfo.validationMetrics).join(', ')
                        : contract.modelInfo.validationMetrics || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Max Epochs</Typography>
                  <Typography variant="body1">{contract.modelInfo.maxEpochs}</Typography>
                  <Typography variant="body2" color="textSecondary">Batch Size</Typography>
                  <Typography variant="body1">{contract.modelInfo.batchSize}</Typography>
                  <Typography variant="body2" color="textSecondary">Learning Rate</Typography>
                  <Typography variant="body1">{contract.modelInfo.learningRate}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* CCRP Detail Card */}
        {contract.ccrp && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                    CCRP (Confidential Clean Room Provider) Details
                  </Typography>
                  {canEditContract() && (
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={isEditMode ? handleCancelEdit : handleEditMode}
                      variant={isEditMode ? "contained" : "outlined"}
                      color={isEditMode ? "secondary" : "primary"}
                    >
                      {isEditMode ? "Cancel Edit" : "Edit"}
                    </Button>
                  )}
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Provider Information
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Provider Name
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {contract.ccrp.name}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Email
                        </Typography>
                        <Typography variant="body2">
                          {contract.ccrp.email}
                        </Typography>
                      </Box>
                      
                      {contract.ccrp.description && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Description
                          </Typography>
                          <Typography variant="body2">
                            {contract.ccrp.description}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Wallet Address
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                          {contract.ccrp.walletAddress || 'Not provided'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Signing Status
                        </Typography>
                        <Chip 
                          label={contract.ccrpSigned ? 'Signed' : 'Pending'} 
                          color={contract.ccrpSigned ? 'success' : 'warning'}
                          size="small"
                        />
                        {contract.ccrpSignedAt && (
                          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                            Signed on: {format(new Date(contract.ccrpSignedAt), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      {contract.ccrpCloudProvider ? 'Cloud Provider Selected' : 'Cloud Provider Support'}
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      {contract.ccrpCloudProvider ? (
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Selected Cloud Provider
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                              label={contract.ccrpCloudProvider}
                              color="success"
                              variant="filled"
                              size="medium"
                            />
                          </Box>
                        </Box>
                      ) : contract.ccrp.cloudProviders && contract.ccrp.cloudProviders.length > 0 ? (
                        <Box>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Supported Cloud Providers
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {contract.ccrp.cloudProviders.map((provider) => (
                              <Chip
                                key={provider}
                                label={provider}
                                color="primary"
                                variant="outlined"
                                size="medium"
                              />
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            No cloud providers specified
                          </Typography>
                        </Box>
                      )}
                      
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Environment Type
                        </Typography>
                        <Typography variant="body2">
                          Confidential Computing Environment
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Security Level
                        </Typography>
                        <Typography variant="body2">
                          High (Encrypted data processing)
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                {/* TDP Actions */}
                {isTDP && !isMultiTDPContract && (contract.tdp?.walletAddress === currentUser?.walletAddress || contract.tdp?.did === currentUser?.did) && (
                  <>
                    {contract.status === 'PENDING_TDP_APPROVAL' && !contract.tdpSigned && (
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleSignContract('TDP')}
                        disabled={signing}
                      >
                        {signing ? 'Signing...' : 'Sign Contract as TDP'}
                      </Button>
                    )}
                  </>
                )}
                
                {/* TDC Actions */}
                {isTDC && contract.tdc?.walletAddress === currentUser?.walletAddress && (
                  <>
                    {/* Edit Contract Button */}
                    {canEditContract() && (
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleEditMode}
                        disabled={isEditMode}
                      >
                        Edit Contract
                      </Button>
                    )}
                    
                    {contract.status === 'PENDING_CCRP_APPROVAL' && !contract.ccrpId && (
                      <Button 
                        variant="contained" 
                        color="secondary"
                        onClick={() => setCcrpDialogOpen(true)}
                        disabled={selectCcrpMutation.isLoading}
                      >
                        Select CCRP
                      </Button>
                    )}
                    
                    {contract.status === 'ACTIVE' && (
                      <Button 
                        variant="contained" 
                        color="info"
                        onClick={() => handleCompleteContract()}
                        disabled={completeContractMutation.isLoading}
                      >
                        {completeContractMutation.isLoading ? 'Completing...' : 'Complete Contract'}
                      </Button>
                    )}
                  </>
                )}
                
                {/* CCRP Actions */}
                {isCCRP && contract.ccrp?.walletAddress === currentUser?.walletAddress && (
                  <>
                    {contract.status === 'PENDING_CCRP_APPROVAL' && contract.ccrpId && !contract.ccrpSigned && (
                      <Button 
                        variant="contained" 
                        color="success"
                        onClick={() => handleSignContract('CCRP')}
                        disabled={signing}
                      >
                        {signing ? 'Signing...' : 'Sign Contract as CCRP'}
                      </Button>
                    )}
                  </>
                )}
                
                {/* Cancel Contract (any party can cancel if not completed) */}
                {contract.status !== 'COMPLETED' && contract.status !== 'CANCELLED' && (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={() => handleCancelContract()}
                    disabled={cancelContractMutation.isLoading}
                  >
                    {cancelContractMutation.isLoading ? 'Cancelling...' : 'Cancel Contract'}
                  </Button>
                )}

                {/* Download Contract Documents */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => saveContractLocally()}
                  startIcon={<Download />}
                >
                  Download Complete Contract
                </Button>
                {contract.legalDocument && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => saveLegalDocument()}
                    startIcon={<Description />}
                  >
                    Download Legal Document
                  </Button>
                )}
              </Box>
              
              {signError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {signError}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Terms and Conditions */}
        {contract.termsAndConditions && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Terms and Conditions
                  </Typography>
                  {canEditContract() && !isEditMode && (
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={handleEditMode}
                      variant="outlined"
                    >
                      Edit
                    </Button>
                  )}
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {contract.termsAndConditions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Contract Details */}
        {(contract.legalDocumentHash || contract.smartContractAddress || contract.ricardianSignature || 
          contract.trainingParams || contract.environmentSpecs || contract.kmsConfigs || 
          contract.attestationVerified !== undefined || contract.attestationReport ||
          contract.multiTdpStatus || contract.totalPrice || contract.datasetCount || contract.tdpCount ||
          contract.contractDatasets || contract.tdpSignatures || contract.tdpPayments) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Contract Details
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Legal Document Information */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Legal Document
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {contract.legalDocumentHash && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Document Hash
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                            {contract.legalDocumentHash}
                          </Typography>
                        </Box>
                      )}
                      
                      {contract.ricardianSignature && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Contract Signature
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                            {contract.ricardianSignature}
                          </Typography>
                        </Box>
                      )}
                      
                      {contract.legalDocument && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Legal Document
                          </Typography>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="body2">View Legal Document</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" sx={{ whiteSpace: 'pre-wrap' }}>
                                {(() => {
                                  try {
                                    const legalDoc = typeof contract.legalDocument === 'string' 
                                      ? JSON.parse(contract.legalDocument) 
                                      : contract.legalDocument;
                                    return JSON.stringify(legalDoc, null, 2);
                                  } catch (error) {
                                    return contract.legalDocument;
                                  }
                                })()}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Smart Contract Information */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Smart Contract
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {contract.smartContractAddress && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Contract Address
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                            {contract.smartContractAddress}
                          </Typography>
                        </Box>
                      )}
                      
                      {contract.smartContractNetwork && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Network
                          </Typography>
                          <Typography variant="body1">
                            {contract.smartContractNetwork}
                          </Typography>
                        </Box>
                      )}
                      
                      {contract.blockchainContractId && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Blockchain Contract ID
                          </Typography>
                          <Typography variant="body1">
                            {contract.blockchainContractId}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Training Parameters */}
                  {contract.trainingParams && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Training Parameters
                      </Typography>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2">View/Edit Training Parameters</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {(() => {
                            try {
                              const trainingParams = typeof contract.trainingParams === 'string' 
                                ? JSON.parse(contract.trainingParams) 
                                : contract.trainingParams;
                              
                              return (
                                <Box sx={{ width: '100%' }}>
                                  <Grid container spacing={2}>
                                    {/* Privacy Parameters */}
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="h6" gutterBottom>
                                        Privacy Parameters
                                      </Typography>
                                      <TextField
                                        fullWidth
                                        label="Max Privacy Loss"
                                        type="number"
                                        value={trainingParams.maxPrivacyLoss || ''}
                                        onChange={(e) => {
                                          const updatedParams = { ...trainingParams, maxPrivacyLoss: parseFloat(e.target.value) };
                                          // Update the contract data
                                          if (contract.onTrainingParamsChange) {
                                            contract.onTrainingParamsChange(updatedParams);
                                          }
                                        }}
                                        margin="normal"
                                        InputProps={{ inputProps: { step: 0.01, min: 0, max: 1 } }}
                                      />
                                      <TextField
                                        fullWidth
                                        label="Min Accuracy"
                                        type="number"
                                        value={trainingParams.minAccuracy || ''}
                                        onChange={(e) => {
                                          const updatedParams = { ...trainingParams, minAccuracy: parseFloat(e.target.value) };
                                          if (contract.onTrainingParamsChange) {
                                            contract.onTrainingParamsChange(updatedParams);
                                          }
                                        }}
                                        margin="normal"
                                        InputProps={{ inputProps: { step: 0.01, min: 0, max: 1 } }}
                                      />
                                      <TextField
                                        fullWidth
                                        label="Max Training Runs"
                                        type="number"
                                        value={trainingParams.maxTrainingRuns || ''}
                                        onChange={(e) => {
                                          const updatedParams = { ...trainingParams, maxTrainingRuns: parseInt(e.target.value) };
                                          if (contract.onTrainingParamsChange) {
                                            contract.onTrainingParamsChange(updatedParams);
                                          }
                                        }}
                                        margin="normal"
                                        InputProps={{ inputProps: { min: 1, max: 100 } }}
                                        helperText="Maximum number of training runs permitted for this contract"
                                      />
                                    </Grid>

                                    {/* Differential Privacy */}
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="h6" gutterBottom>
                                        Differential Privacy
                                      </Typography>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={trainingParams.differentialPrivacy?.enabled || false}
                                            onChange={(e) => {
                                              const updatedParams = {
                                                ...trainingParams,
                                                differentialPrivacy: {
                                                  ...trainingParams.differentialPrivacy,
                                                  enabled: e.target.checked
                                                }
                                              };
                                              if (contract.onTrainingParamsChange) {
                                                contract.onTrainingParamsChange(updatedParams);
                                              }
                                            }}
                                          />
                                        }
                                        label="Enabled"
                                      />
                                      {trainingParams.differentialPrivacy?.enabled && (
                                        <>
                                          <TextField
                                            fullWidth
                                            label="Epsilon"
                                            type="number"
                                            value={trainingParams.differentialPrivacy?.epsilon || ''}
                                            onChange={(e) => {
                                              const updatedParams = {
                                                ...trainingParams,
                                                differentialPrivacy: {
                                                  ...trainingParams.differentialPrivacy,
                                                  epsilon: parseFloat(e.target.value)
                                                }
                                              };
                                              if (contract.onTrainingParamsChange) {
                                                contract.onTrainingParamsChange(updatedParams);
                                              }
                                            }}
                                            margin="normal"
                                            InputProps={{ inputProps: { step: 0.01, min: 0 } }}
                                          />
                                          <TextField
                                            fullWidth
                                            label="Delta"
                                            type="number"
                                            value={trainingParams.differentialPrivacy?.delta || ''}
                                            onChange={(e) => {
                                              const updatedParams = {
                                                ...trainingParams,
                                                differentialPrivacy: {
                                                  ...trainingParams.differentialPrivacy,
                                                  delta: parseFloat(e.target.value)
                                                }
                                              };
                                              if (contract.onTrainingParamsChange) {
                                                contract.onTrainingParamsChange(updatedParams);
                                              }
                                            }}
                                            margin="normal"
                                            InputProps={{ inputProps: { step: 1e-6, min: 0 } }}
                                          />
                                        </>
                                      )}
                                    </Grid>

                                    {/* Federated Learning */}
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="h6" gutterBottom>
                                        Federated Learning
                                      </Typography>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={trainingParams.federatedLearning?.enabled || false}
                                            onChange={(e) => {
                                              const updatedParams = {
                                                ...trainingParams,
                                                federatedLearning: {
                                                  ...trainingParams.federatedLearning,
                                                  enabled: e.target.checked
                                                }
                                              };
                                              if (contract.onTrainingParamsChange) {
                                                contract.onTrainingParamsChange(updatedParams);
                                              }
                                            }}
                                          />
                                        }
                                        label="Enabled"
                                      />
                                      {trainingParams.federatedLearning?.enabled && (
                                        <TextField
                                          fullWidth
                                          label="Communication Rounds"
                                          type="number"
                                          value={trainingParams.federatedLearning?.communicationRounds || ''}
                                          onChange={(e) => {
                                            const updatedParams = {
                                              ...trainingParams,
                                              federatedLearning: {
                                                ...trainingParams.federatedLearning,
                                                communicationRounds: parseInt(e.target.value)
                                              }
                                            };
                                            if (contract.onTrainingParamsChange) {
                                              contract.onTrainingParamsChange(updatedParams);
                                            }
                                          }}
                                          margin="normal"
                                          InputProps={{ inputProps: { min: 1 } }}
                                        />
                                      )}
                                    </Grid>

                                    {/* Secure Multi-Party Computation */}
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="h6" gutterBottom>
                                        Secure Multi-Party Computation
                                      </Typography>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={trainingParams.secureMultiPartyComputation?.enabled || false}
                                            onChange={(e) => {
                                              const updatedParams = {
                                                ...trainingParams,
                                                secureMultiPartyComputation: {
                                                  ...trainingParams.secureMultiPartyComputation,
                                                  enabled: e.target.checked
                                                }
                                              };
                                              if (contract.onTrainingParamsChange) {
                                                contract.onTrainingParamsChange(updatedParams);
                                              }
                                            }}
                                          />
                                        }
                                        label="Enabled"
                                      />
                                    </Grid>
                                  </Grid>
                                </Box>
                              );
                            } catch (error) {
                              return (
                                <Typography variant="body2" color="error">
                                  Error parsing training parameters: {error.message}
                                </Typography>
                              );
                            }
                          })()}
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* Environment Specifications */}
                  {contract.environmentSpecs && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Environment Specifications
                      </Typography>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2">View/Edit Environment Specs</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {(() => {
                            try {
                              const envSpecs = typeof contract.environmentSpecs === 'string' 
                                ? JSON.parse(contract.environmentSpecs) 
                                : contract.environmentSpecs;
                              
                              return (
                                <Box sx={{ width: '100%' }}>
                                  <Grid container spacing={2}>
                                    {/* Infrastructure */}
                                    {envSpecs.infrastructure && (
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom>
                                          Infrastructure
                                        </Typography>
                                        <TextField
                                          fullWidth
                                          label="Compute Type"
                                          value={envSpecs.infrastructure.computeType || ''}
                                          onChange={(e) => {
                                            const updatedSpecs = {
                                              ...envSpecs,
                                              infrastructure: {
                                                ...envSpecs.infrastructure,
                                                computeType: e.target.value
                                              }
                                            };
                                            if (contract.onEnvironmentSpecsChange) {
                                              contract.onEnvironmentSpecsChange(updatedSpecs);
                                            }
                                          }}
                                          margin="normal"
                                        />
                                        <TextField
                                          fullWidth
                                          label="Memory"
                                          value={envSpecs.infrastructure.memory || ''}
                                          onChange={(e) => {
                                            const updatedSpecs = {
                                              ...envSpecs,
                                              infrastructure: {
                                                ...envSpecs.infrastructure,
                                                memory: e.target.value
                                              }
                                            };
                                            if (contract.onEnvironmentSpecsChange) {
                                              contract.onEnvironmentSpecsChange(updatedSpecs);
                                            }
                                          }}
                                          margin="normal"
                                        />
                                        <TextField
                                          fullWidth
                                          label="Storage"
                                          value={envSpecs.infrastructure.storage || ''}
                                          onChange={(e) => {
                                            const updatedSpecs = {
                                              ...envSpecs,
                                              infrastructure: {
                                                ...envSpecs.infrastructure,
                                                storage: e.target.value
                                              }
                                            };
                                            if (contract.onEnvironmentSpecsChange) {
                                              contract.onEnvironmentSpecsChange(updatedSpecs);
                                            }
                                          }}
                                          margin="normal"
                                        />
                                      </Grid>
                                    )}

                                    {/* KMS Configuration */}
                                    {envSpecs.kms && (
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom>
                                          Key Management System
                                        </Typography>
                                        <TextField
                                          fullWidth
                                          label="Provider"
                                          value={envSpecs.kms.provider || ''}
                                          onChange={(e) => {
                                            const updatedSpecs = {
                                              ...envSpecs,
                                              kms: {
                                                ...envSpecs.kms,
                                                provider: e.target.value
                                              }
                                            };
                                            if (contract.onEnvironmentSpecsChange) {
                                              contract.onEnvironmentSpecsChange(updatedSpecs);
                                            }
                                          }}
                                          margin="normal"
                                        />
                                        <TextField
                                          fullWidth
                                          label="Key Vault"
                                          value={envSpecs.kms.keyVault || ''}
                                          onChange={(e) => {
                                            const updatedSpecs = {
                                              ...envSpecs,
                                              kms: {
                                                ...envSpecs.kms,
                                                keyVault: e.target.value
                                              }
                                            };
                                            if (contract.onEnvironmentSpecsChange) {
                                              contract.onEnvironmentSpecsChange(updatedSpecs);
                                            }
                                          }}
                                          margin="normal"
                                        />
                                      </Grid>
                                    )}

                                    {/* Security Configuration */}
                                    {envSpecs.security && (
                                      <Grid item xs={12}>
                                        <Typography variant="h6" gutterBottom>
                                          Security Configuration
                                        </Typography>
                                        <Grid container spacing={2}>
                                          <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                              Authentication
                                            </Typography>
                                            <TextField
                                              fullWidth
                                              label="Method"
                                              value={envSpecs.security.authentication?.method || ''}
                                              onChange={(e) => {
                                                const updatedSpecs = {
                                                  ...envSpecs,
                                                  security: {
                                                    ...envSpecs.security,
                                                    authentication: {
                                                      ...envSpecs.security.authentication,
                                                      method: e.target.value
                                                    }
                                                  }
                                                };
                                                if (contract.onEnvironmentSpecsChange) {
                                                  contract.onEnvironmentSpecsChange(updatedSpecs);
                                                }
                                              }}
                                              margin="normal"
                                            />
                                          </Grid>
                                          <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                              Authorization
                                            </Typography>
                                            <TextField
                                              fullWidth
                                              label="Model"
                                              value={envSpecs.security.authorization?.model || ''}
                                              onChange={(e) => {
                                                const updatedSpecs = {
                                                  ...envSpecs,
                                                  security: {
                                                    ...envSpecs.security,
                                                    authorization: {
                                                      ...envSpecs.security.authorization,
                                                      model: e.target.value
                                                    }
                                                  }
                                                };
                                                if (contract.onEnvironmentSpecsChange) {
                                                  contract.onEnvironmentSpecsChange(updatedSpecs);
                                                }
                                              }}
                                              margin="normal"
                                            />
                                          </Grid>
                                        </Grid>
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              );
                            } catch (error) {
                              return (
                                <Typography variant="body2" color="error">
                                  Error parsing environment specifications: {error.message}
                                </Typography>
                              );
                            }
                          })()}
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* KMS Configurations */}
                  {contract.kmsConfigs && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        KMS Configurations
                      </Typography>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2">View KMS Configs</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" sx={{ whiteSpace: 'pre-wrap' }}>
                            {(() => {
                              try {
                                const kmsConfigs = typeof contract.kmsConfigs === 'string' 
                                  ? JSON.parse(contract.kmsConfigs) 
                                  : contract.kmsConfigs;
                                return JSON.stringify(kmsConfigs, null, 2);
                              } catch (error) {
                                return contract.kmsConfigs;
                              }
                            })()}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* Attestation Information */}
                  {(contract.attestationVerified !== undefined || contract.attestationReport) && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Attestation Verification
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        {contract.attestationVerified !== undefined && (
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Verification Status
                            </Typography>
                            <Chip 
                              label={contract.attestationVerified ? 'Verified' : 'Not Verified'} 
                              color={contract.attestationVerified ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        )}
                        
                        {contract.attestationReport && (
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Attestation Report
                            </Typography>
                            <Accordion>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="body2">View Attestation Report</Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" sx={{ whiteSpace: 'pre-wrap' }}>
                                  {(() => {
                                    try {
                                      const attestationReport = typeof contract.attestationReport === 'string' 
                                        ? JSON.parse(contract.attestationReport) 
                                        : contract.attestationReport;
                                      return JSON.stringify(attestationReport, null, 2);
                                    } catch (error) {
                                      return contract.attestationReport;
                                    }
                                  })()}
                                </Typography>
                              </AccordionDetails>
                            </Accordion>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  )}

                  {/* Multi-TDP Status (for contracts) */}
                  {contract.multiTdpStatus && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Multi-TDP Status
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Status
                          </Typography>
                          <Chip 
                            label={contract.multiTdpStatus.replace(/_/g, ' ')} 
                            color={contract.multiTdpStatus === 'ACTIVE' ? 'success' : 
                                   contract.multiTdpStatus.includes('PENDING') ? 'warning' : 'default'}
                            size="small"
                          />
                        </Box>
                        
                        {contract.totalPrice && (
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Total Contract Value
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              ${contract.totalPrice}
                            </Typography>
                          </Box>
                        )}
                        
                        {contract.datasetCount && (
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Datasets Involved
                            </Typography>
                            <Typography variant="body1">
                              {contract.datasetCount} dataset{contract.datasetCount > 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        )}
                        
                        {contract.tdpCount && (
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              TDPs Involved
                            </Typography>
                            <Typography variant="body1">
                              {contract.tdpCount} TDP{contract.tdpCount > 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  )}

                  {/* All Selected TDPs and Datasets */}
                  {contract.contractDatasets && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        All Selected TDPs and Datasets
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Dataset</TableCell>
                              <TableCell>TDP</TableCell>
                              <TableCell>Price</TableCell>
                              <TableCell>Payment Status</TableCell>
                              <TableCell>Signature Status</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              try {
                                const datasets = typeof contract.contractDatasets === 'string' 
                                  ? JSON.parse(contract.contractDatasets) 
                                  : contract.contractDatasets;
                                
                                return datasets.map((dataset, index) => {
                                  // Get signature status for this TDP
                                  const tdpSignatures = contract.tdpSignatures ? 
                                    (typeof contract.tdpSignatures === 'string' 
                                      ? JSON.parse(contract.tdpSignatures) 
                                      : contract.tdpSignatures) : {};
                                  
                                  const tdpPayments = contract.tdpPayments ? 
                                    (typeof contract.tdpPayments === 'string' 
                                      ? JSON.parse(contract.tdpPayments) 
                                      : contract.tdpPayments) : {};
                                  
                                  const tdpSignature = tdpSignatures[dataset.tdpId] || {};
                                  const tdpPayment = tdpPayments[dataset.tdpId] || {};
                                  
                                  return (
                                    <TableRow key={index}>
                                      <TableCell>
                                        <Box>
                                          <Typography variant="body2" fontWeight="medium">
                                            {dataset.datasetName}
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary">
                                            ID: {dataset.datasetId}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Box>
                                          <Typography variant="body2" fontWeight="medium">
                                            {dataset.tdpName}
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary">
                                            ID: {dataset.tdpId}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                          ${dataset.individualPrice}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={tdpPayment.status || 'PENDING'} 
                                          color={tdpPayment.status === 'PAID' ? 'success' : 'warning'}
                                          size="small"
                                        />
                                        {tdpPayment.paidAt && (
                                          <Typography variant="caption" display="block" color="textSecondary">
                                            {format(new Date(tdpPayment.paidAt), 'MMM dd, yyyy')}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={tdpSignature.signed ? 'SIGNED' : 'PENDING'} 
                                          color={tdpSignature.signed ? 'success' : 'warning'}
                                          size="small"
                                        />
                                        {tdpSignature.signedAt && (
                                          <Typography variant="caption" display="block" color="textSecondary">
                                            {format(new Date(tdpSignature.signedAt), 'MMM dd, yyyy')}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Box display="flex" gap={1}>
                                          {/* TDP Signing Action */}
                                          {isTDP && currentUser.id === dataset.tdpId && 
                                           !tdpSignature.signed && contract.status === 'PENDING_TDP_APPROVAL' && (
                                            <Button
                                              variant="outlined"
                                              size="small"
                                              onClick={() => handleSignContract('TDP')}
                                              disabled={signing}
                                            >
                                              {signing ? 'Signing...' : 'Sign'}
                                            </Button>
                                          )}
                                          
                                          {/* TDC Payment Recording Action */}
                                          {isTDC && contract.tdc?.id === currentUser.id && 
                                           tdpSignature.signed && tdpPayment.status !== 'PAID' && (
                                            <Button
                                              variant="outlined"
                                              size="small"
                                              onClick={() => {
                                                setSelectedTDP({ id: dataset.tdpId, name: dataset.tdpName });
                                                setPaymentAmount(dataset.individualPrice.toString());
                                                setPaymentDialogOpen(true);
                                              }}
                                            >
                                              Record Payment
                                            </Button>
                                          )}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  );
                                });
                              } catch (error) {
                                console.error('Error parsing contractDatasets:', error);
                                return (
                                  <TableRow>
                                    <TableCell colSpan={6}>
                                      <Typography variant="body2" color="error">
                                        Error parsing dataset information
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            })()}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}

                  {/* TDP Signatures Summary */}
                  {contract.tdpSignatures && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        TDP Signatures Summary
                      </Typography>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2">View All TDP Signatures</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" sx={{ whiteSpace: 'pre-wrap' }}>
                            {(() => {
                              try {
                                const tdpSignatures = typeof contract.tdpSignatures === 'string' 
                                  ? JSON.parse(contract.tdpSignatures) 
                                  : contract.tdpSignatures;
                                return JSON.stringify(tdpSignatures, null, 2);
                              } catch (error) {
                                return contract.tdpSignatures;
                              }
                            })()}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* TDP Payments Summary */}
                  {contract.tdpPayments && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        TDP Payments Summary
                      </Typography>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="body2">View All TDP Payments</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" sx={{ whiteSpace: 'pre-wrap' }}>
                            {(() => {
                              try {
                                const tdpPayments = typeof contract.tdpPayments === 'string' 
                                  ? JSON.parse(contract.tdpPayments) 
                                  : contract.tdpPayments;
                                return JSON.stringify(tdpPayments, null, 2);
                              } catch (error) {
                                return contract.tdpPayments;
                              }
                            })()}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* Detailed Dataset and TDP Cards */}
                  {contract.contractDatasets && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Detailed Dataset and TDP Information
                      </Typography>
                      <Grid container spacing={2}>
                        {(() => {
                          try {
                            const datasets = typeof contract.contractDatasets === 'string' 
                              ? JSON.parse(contract.contractDatasets) 
                              : contract.contractDatasets;
                            
                            const tdpSignatures = contract.tdpSignatures ? 
                              (typeof contract.tdpSignatures === 'string' 
                                ? JSON.parse(contract.tdpSignatures) 
                                : contract.tdpSignatures) : {};
                            
                            const tdpPayments = contract.tdpPayments ? 
                              (typeof contract.tdpPayments === 'string' 
                                ? JSON.parse(contract.tdpPayments) 
                                : contract.tdpPayments) : {};
                            
                            return datasets.map((dataset, index) => {
                              const tdpSignature = tdpSignatures[dataset.tdpId] || {};
                              const tdpPayment = tdpPayments[dataset.tdpId] || {};
                              
                              return (
                                <Grid item xs={12} md={6} lg={4} key={index}>
                                  <Card variant="outlined">
                                    <CardContent>
                                      <Typography variant="h6" gutterBottom>
                                        Dataset {index + 1}
                                      </Typography>
                                      
                                      {/* Dataset Information */}
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="primary">
                                          Dataset Details
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                          {dataset.datasetName}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                          ID: {dataset.datasetId}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                          Price: <strong>${dataset.individualPrice}</strong>
                                        </Typography>
                                      </Box>
                                      
                                      {/* TDP Information */}
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="secondary">
                                          TDP Details
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                          {dataset.tdpName}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                          TDP ID: {dataset.tdpId}
                                        </Typography>
                                      </Box>
                                      
                                      {/* Status Information */}
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                          Status
                                        </Typography>
                                        <Box display="flex" gap={1} sx={{ mb: 1 }}>
                                          <Chip 
                                            label={tdpSignature.signed ? 'SIGNED' : 'PENDING'} 
                                            color={tdpSignature.signed ? 'success' : 'warning'}
                                            size="small"
                                          />
                                          <Chip 
                                            label={tdpPayment.status || 'PENDING'} 
                                            color={tdpPayment.status === 'PAID' ? 'success' : 'warning'}
                                            size="small"
                                          />
                                        </Box>
                                        {tdpSignature.signedAt && (
                                          <Typography variant="caption" display="block" color="textSecondary">
                                            Signed: {format(new Date(tdpSignature.signedAt), 'MMM dd, yyyy')}
                                          </Typography>
                                        )}
                                        {tdpPayment.paidAt && (
                                          <Typography variant="caption" display="block" color="textSecondary">
                                            Paid: {format(new Date(tdpPayment.paidAt), 'MMM dd, yyyy')}
                                          </Typography>
                                        )}
                                      </Box>
                                      
                                      {/* Actions */}
                                      <Box display="flex" gap={1} flexWrap="wrap">
                                        {/* TDP Signing Action */}
                                        {isTDP && currentUser.id === dataset.tdpId && 
                                         !tdpSignature.signed && contract.status === 'PENDING_TDP_APPROVAL' && (
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleSignContract('TDP')}
                                            disabled={signing}
                                          >
                                            {signing ? 'Signing...' : 'Sign'}
                                          </Button>
                                        )}
                                        
                                        {/* TDC Payment Recording Action */}
                                        {isTDC && contract.tdc?.id === currentUser.id && 
                                         tdpSignature.signed && tdpPayment.status !== 'PAID' && (
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                              setSelectedTDP({ id: dataset.tdpId, name: dataset.tdpName });
                                              setPaymentAmount(dataset.individualPrice.toString());
                                              setPaymentDialogOpen(true);
                                            }}
                                          >
                                            Record Payment
                                          </Button>
                                        )}
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            });
                          } catch (error) {
                            console.error('Error parsing contractDatasets for cards:', error);
                            return (
                              <Grid item xs={12}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Typography variant="body2" color="error">
                                      Error parsing dataset information
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          }
                        })()}
                      </Grid>
                    </Grid>
                  )}

                  {/* Contract Timestamps */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Contract Timeline
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Created
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(contract.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                        </Typography>
                      </Box>
                      
                      {contract.tdpSignedAt && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            TDP Signed
                          </Typography>
                          <Typography variant="body1">
                            {format(new Date(contract.tdpSignedAt), 'MMM dd, yyyy HH:mm:ss')}
                          </Typography>
                        </Box>
                      )}
                      
                      {contract.ccrpSignedAt && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            CCRP Signed
                          </Typography>
                          <Typography variant="body1">
                            {format(new Date(contract.ccrpSignedAt), 'MMM dd, yyyy HH:mm:ss')}
                          </Typography>
                        </Box>
                      )}
                      
                      {contract.updatedAt && contract.updatedAt !== contract.createdAt && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Last Updated
                          </Typography>
                          <Typography variant="body1">
                            {format(new Date(contract.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Fallback: Basic Contract Information (for debugging) */}
        {contract && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contract Debug Information
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  This section shows all available contract fields for debugging purposes.
                </Typography>
                
                {/* Search Box */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search contract data..."
                  variant="outlined"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Visibility sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Info color="primary" />
                      <Typography variant="body2">View All Contract Data</Typography>
                      <Chip 
                        label={`${Object.keys(contract).length} fields`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                      <Box sx={{ p: 1 }}>
                        <JsonTreeView data={contract} label="contract" />
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* CCRP Selection Dialog */}
      <Dialog open={ccrpDialogOpen} onClose={() => setCcrpDialogOpen(false)}>
        <DialogTitle>Select CCRP</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>CCRP</InputLabel>
            <Select
              value={selectedCcrp}
              onChange={(e) => setSelectedCcrp(e.target.value)}
              label="CCRP"
            >
              {ccrpUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCcrpDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => selectCcrpMutation.mutate({ ccrpId: selectedCcrp })}
            disabled={!selectedCcrp || selectCcrpMutation.isLoading}
          >
            Select
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Record Payment for TDP</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              TDP: {selectedTDP?.name}
            </Typography>
            <TextField
              fullWidth
              label="Payment Amount (USD)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRecordPayment}
            disabled={!paymentAmount || recordPaymentMutation.isLoading}
          >
            {recordPaymentMutation.isLoading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ContractDetail; 