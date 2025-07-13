import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
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
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Pending,
  Error,
  Person,
  Storage,
  Description,
  Security,
  Download,
  Visibility,
  ExpandMore,
  Payment,
  AttachMoney,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
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

function ContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isAuthenticated, isTDC, isTDP, isCCRP } = useUser();
  const [ccrpDialogOpen, setCcrpDialogOpen] = useState(false);
  const [selectedCcrp, setSelectedCcrp] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTDP, setSelectedTDP] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');

  // Fetch contract details
  const { data: contract, isLoading, error } = useQuery(
    ['contract', contractId],
    () => apiService.getContract(contractId)
  );

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

  // Fetch multi-TDP contract status
  const { data: multiTDPStatus } = useQuery(
    ['multi-tdp-status', contractId],
    () => apiService.getMultiTDPContractStatus(contractId),
    {
      enabled: !!contract?.datasets && contract.datasets.length > 1
    }
  );

  // Fetch payment summary
  const { data: paymentSummary } = useQuery(
    ['payment-summary', contractId],
    () => apiService.getPaymentSummary(contractId),
    {
      enabled: !!contract?.datasets && contract.datasets.length > 1
    }
  );

  // Fetch users for CCRP selection
  const { data: users = [] } = useQuery('users', apiService.getUsers);
  const { 
    data: ccrpUsers = [], 
    isLoading: ccrpLoading, 
    error: ccrpError 
  } = useQuery('ccrp-users', apiService.getCCRPUsers);

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

  // Check if this is a multi-TDP contract
  const isMultiTDPContract = contract?.datasets && contract.datasets.length > 1;

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
          const tdpDataset = contract.datasets.find(dataset => 
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
      dataset: contract.dataset,
      datasets: contract.datasets,
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
      
      // Ricardian contract fields
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
                  <Typography variant="h5" gutterBottom>
                    {contract.contractId}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
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

        {/* Multi-TDP Contract Information */}
        {isMultiTDPContract && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Multi-TDP Contract Details
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Dataset</TableCell>
                        <TableCell>TDP</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contract.datasets.map((dataset) => (
                        <TableRow key={dataset.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {dataset.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {dataset.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {dataset.tdp?.name || 'Unknown TDP'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {dataset.tdp?.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              ${dataset.price}
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
                              amount={dataset.price}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              {/* TDP Signing */}
                              {isTDP && (dataset.tdp?.id === currentUser.id || dataset.tdpId === currentUser.id) && 
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
                                    setSelectedTDP(dataset.tdp);
                                    setPaymentAmount(dataset.price.toString());
                                    setPaymentDialogOpen(true);
                                  }}
                                >
                                  Record Payment
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Single TDP Contract Information (Legacy Support) */}
        {!isMultiTDPContract && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contract Parties
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Person color="primary" />
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          Training Data Provider (TDP)
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {contract.tdp?.name}
                        </Typography>
                        <Typography variant="body2" fontSize="0.75rem" fontFamily="monospace">
                          {contract.tdp?.walletAddress}
                        </Typography>
                        <Chip 
                          label={contract.tdpSigned ? 'Signed' : 'Pending'} 
                          color={contract.tdpSigned ? 'success' : 'warning'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Person color="secondary" />
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          Training Data Consumer (TDC)
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {contract.tdc?.name}
                        </Typography>
                        <Typography variant="body2" fontSize="0.75rem" fontFamily="monospace">
                          {contract.tdc?.walletAddress}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  {contract.ccrp && (
                    <Grid item xs={12} md={4}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Person color="success" />
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            CCRP
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {contract.ccrp?.name}
                          </Typography>
                          <Typography variant="body2" fontSize="0.75rem" fontFamily="monospace">
                            {contract.ccrp?.walletAddress}
                          </Typography>
                          <Chip 
                            label={contract.ccrpSigned ? 'Signed' : 'Pending'} 
                            color={contract.ccrpSigned ? 'success' : 'warning'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Contract Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contract Details
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <StatusChip status={contract.status} />
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {contract.duration} days
                  </Typography>
                </Box>
                
                {!isMultiTDPContract && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Price
                    </Typography>
                    <Typography variant="body1">
                      ${contract.price}
                    </Typography>
                  </Box>
                )}
                
                {isMultiTDPContract && paymentSummary && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Price
                    </Typography>
                    <Typography variant="body1">
                      ${paymentSummary.totalAmount}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Paid: ${paymentSummary.paidAmount} | Pending: ${paymentSummary.pendingAmount}
                    </Typography>
                  </Box>
                )}
                
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(contract.createdAt), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Dataset Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dataset Information
              </Typography>
              
              {isMultiTDPContract ? (
                <List>
                  {contract.datasets.map((dataset) => (
                    <ListItem key={dataset.id}>
                      <ListItemIcon>
                        <Storage />
                      </ListItemIcon>
                      <ListItemText
                        primary={dataset.name}
                        secondary={`${dataset.description} | $${dataset.price}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box display="flex" alignItems="center" gap={2}>
                  <Storage color="primary" />
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {contract.dataset?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {contract.dataset?.description}
                    </Typography>
                    <Typography variant="body2" fontSize="0.75rem" color="textSecondary">
                      Category: {contract.dataset?.category} | Size: {contract.dataset?.size} MB
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

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
                <Typography variant="h6" gutterBottom>
                  Terms and Conditions
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {contract.termsAndConditions}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Ricardian Contract Details */}
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
                  Ricardian Contract Details
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
                            Ricardian Signature
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
                          <Typography variant="body2">View Training Parameters</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" sx={{ whiteSpace: 'pre-wrap' }}>
                            {(() => {
                              try {
                                const trainingParams = typeof contract.trainingParams === 'string' 
                                  ? JSON.parse(contract.trainingParams) 
                                  : contract.trainingParams;
                                return JSON.stringify(trainingParams, null, 2);
                              } catch (error) {
                                return contract.trainingParams;
                              }
                            })()}
                          </Typography>
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
                          <Typography variant="body2">View Environment Specs</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" sx={{ whiteSpace: 'pre-wrap' }}>
                            {(() => {
                              try {
                                const envSpecs = typeof contract.environmentSpecs === 'string' 
                                  ? JSON.parse(contract.environmentSpecs) 
                                  : contract.environmentSpecs;
                                return JSON.stringify(envSpecs, null, 2);
                              } catch (error) {
                                return contract.environmentSpecs;
                              }
                            })()}
                          </Typography>
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

                  {/* Multi-TDP Status (for Ricardian contracts) */}
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
                <Typography variant="body2" color="textSecondary">
                  This section shows all available contract fields for debugging purposes.
                </Typography>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="body2">View All Contract Data</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem" sx={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(contract, null, 2)}
                    </Typography>
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
            onClick={() => selectCcrpMutation.mutate({ ccrpId: parseInt(selectedCcrp) })}
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