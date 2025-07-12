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

const getSteps = (contract) => {
  const steps = [
    {
      label: 'Contract Created',
      description: 'TDC initiated contract with TDP',
      completed: true,
      icon: <Description />,
    },
    {
      label: 'TDP Approval',
      description: 'TDP reviews and signs contract',
      completed: contract.tdpSigned,
      icon: <Person />,
    },
    {
      label: 'CCRP Selection',
      description: 'TDC selects Confidential Clean Room Provider',
      completed: !!contract.ccrpId,
      icon: <Security />,
    },
    {
      label: 'CCRP Approval',
      description: 'CCRP reviews and signs contract',
      completed: contract.ccrpSigned,
      icon: <Security />,
    },
    {
      label: 'Contract Active',
      description: 'All parties can proceed with model training',
      completed: contract.status === 'ACTIVE' || contract.status === 'COMPLETED',
      icon: <CheckCircle />,
    },
  ];

  if (contract.status === 'COMPLETED') {
    steps.push({
      label: 'Contract Completed',
      description: 'Model training completed successfully',
      completed: true,
      icon: <CheckCircle />,
    });
  }

  return steps;
};

function ContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isAuthenticated, isTDC, isTDP, isCCRP } = useUser();
  const [ccrpDialogOpen, setCcrpDialogOpen] = useState(false);
  const [selectedCcrp, setSelectedCcrp] = useState('');

  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');

  // Fetch contract details
  const { data: contract, isLoading, error } = useQuery(
    ['contract', contractId],
    () => apiService.getContract(contractId)
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
        toast.success('Contract signed successfully');
      },
      onError: () => {
        toast.error('Failed to sign contract');
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



  const handleSignContract = async (partyType) => {
    setSigning(true);
    setSignError('');

    try {
      // Check if user has a DID for DID-based signing
      if (currentUser?.did && currentUser.did.startsWith('did:web:')) {
        // Use DID-based signing for did:web users
        await handleDIDBasedSigning(partyType);
      } else if (currentUser?.walletAddress) {
        // Use wallet-based signing for users with wallet addresses
        await handleWalletBasedSigning(partyType);
      } else {
        setSignError('No wallet address or DID found for signing. Please connect your wallet or verify your DID.');
        setSigning(false);
        return;
      }
      
      toast.success('Contract signed successfully!');
      queryClient.invalidateQueries(['contract', contractId]);
    } catch (err) {
      setSignError('Failed to sign contract: ' + (err?.message || 'Unknown error'));
    } finally {
      setSigning(false);
    }
  };

  const handleDIDBasedSigning = async (partyType) => {
    try {
      console.log('🔐 Using enterprise DID-based signing for:', currentUser.did);
      
      // Create a message to sign
      const message = `I, the holder of DID ${currentUser.did}, hereby sign contract ${contractId} as ${partyType} on ${new Date().toISOString()}`;
      
      // Use enterprise signing service instead of prompting for private key
      console.log('🏢 Using enterprise signing service...');
      
      const signingResponse = await apiService.signMessage({
        message: message,
        did: currentUser.did
      });
      
      if (!signingResponse.success) {
        throw new Error('Enterprise signing failed');
      }
      
      console.log('✅ Enterprise signing completed successfully');
      
      // Call backend to sign contract with DID
      await apiService.signContract(contractId, {
        did: currentUser.did,
        signature: signingResponse.signature,
        message: message,
        signatureType: 'DID'
      });
      
      console.log('✅ DID-based signing completed');
    } catch (error) {
      console.error('❌ DID-based signing failed:', error);
      throw error;
    }
  };

  const handleWalletBasedSigning = async (partyType) => {
    try {
      console.log('🔐 Using wallet-based signing for:', currentUser.walletAddress);
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed.');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get transaction data from backend
      const signingDataResponse = await apiService.getContractSigningData(contractId);
      const { signingData } = signingDataResponse;
      
      // Send transaction
      const tx = await signer.sendTransaction({
        to: signingData.to,
        data: signingData.data,
        value: signingData.value || 0,
        gasLimit: signingData.gasLimit || 100000,
      });
      await tx.wait();
      
      // Call backend to notify contract signed
      await apiService.signContract(contractId, {
        userWalletAddress: currentUser.walletAddress,
        signedTransaction: tx.hash,
        signatureType: 'WALLET'
      });
      
      console.log('✅ Wallet-based signing completed');
    } catch (error) {
      console.error('❌ Wallet-based signing failed:', error);
      throw error;
    }
  };

  const handleSelectCcrp = async () => {
    if (!selectedCcrp) {
      toast.error('Please select a CCRP');
      return;
    }
    
    try {
      // Send simple CCRP selection request
      await selectCcrpMutation.mutateAsync({
        ccrpId: parseInt(selectedCcrp)
      });
      
    } catch (error) {
      console.error('Error selecting CCRP:', error);
      toast.error('Failed to select CCRP: ' + error.message);
    }
  };

  const handleCompleteContract = () => {
    // TODO: Get private key from secure storage or user input
    const privateKey = process.env.REACT_APP_CCRP_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
    completeContractMutation.mutate({ privateKey });
  };

  const handleCancelContract = () => {
    // TODO: Get private key from secure storage or user input
    const privateKey = process.env.REACT_APP_CCRP_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
    cancelContractMutation.mutate({ privateKey });
  };

  // Download contract as JSON file
  const downloadContract = () => {
    if (!contract) return;
    
    const contractData = {
      contract: {
        contractId: contract.contractId,
        status: contract.status,
        price: contract.price,
        duration: contract.duration,
        termsAndConditions: contract.termsAndConditions,
        modelId: contract.modelId,
        tdpSigned: contract.tdpSigned,
        ccrpSigned: contract.ccrpSigned,
        tdpSignedAt: contract.tdpSignedAt,
        ccrpSignedAt: contract.ccrpSignedAt,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt
      },
      parties: {
        tdp: contract.tdp,
        tdc: contract.tdc,
        ccrp: contract.ccrp
      },
      dataset: contract.dataset,
      legalDocument: contract.legalDocument,
      legalDocumentHash: contract.legalDocumentHash,
      ricardianSignature: contract.ricardianSignature,
      smartContractAddress: contract.smartContractAddress,
      smartContractNetwork: contract.smartContractNetwork,
      environmentSpecs: contract.environmentSpecs,
      trainingParams: contract.trainingParams,
      kmsConfigs: contract.kmsConfigs,
      attestationVerified: contract.attestationVerified,
      attestationReport: contract.attestationReport,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(contractData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${contract.contractId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Contract downloaded successfully!');
  };

  // Download legal document separately
  const downloadLegalDocument = () => {
    if (!contract?.legalDocument) {
      toast.error('No legal document available for this contract');
      return;
    }
    
    const legalDoc = contract.legalDocument;
    const blob = new Blob([JSON.stringify(legalDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-document-${contract.contractId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Legal document downloaded successfully!');
  };

  // Download smart contract data
  const downloadSmartContractData = () => {
    if (!contract?.smartContractAddress) {
      toast.error('No smart contract data available for this contract');
      return;
    }
    
    const smartContractData = {
      address: contract.smartContractAddress,
      network: contract.smartContractNetwork,
      contractId: contract.contractId,
      legalDocumentHash: contract.legalDocumentHash,
      ricardianSignature: contract.ricardianSignature,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(smartContractData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-contract-${contract.contractId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Smart contract data downloaded successfully!');
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography>Loading contract details...</Typography>
      </Box>
    );
  }

  if (error || !contract) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error">Failed to load contract details</Typography>
        <Button onClick={() => navigate('/contracts')} sx={{ mt: 2 }}>
          Back to Contracts
        </Button>
      </Box>
    );
  }

  const steps = getSteps(contract);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Contract Details</Typography>
        <StatusChip status={contract.status} />
      </Box>

      <Grid container spacing={3}>
        {/* Contract Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {contract.contractId}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Dataset:</strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {contract.dataset?.name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Model ID:</strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <em>Not applicable</em>
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Price:</strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    ${contract.price}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Duration:</strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {contract.duration} days
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Terms & Conditions
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {contract.termsAndConditions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Contract Progress */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contract Progress
              </Typography>
              <Stepper orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={index} active={!step.completed} completed={step.completed}>
                    <StepLabel icon={step.icon}>
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="textSecondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Parties Information */}
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
                
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Security color="success" />
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        Confidential Clean Room Provider (CCRP)
                      </Typography>
                      {contract.ccrp ? (
                        <>
                          <Typography variant="body2" color="textSecondary">
                            {contract.ccrp.name}
                          </Typography>
                          <Typography variant="body2" fontSize="0.75rem" fontFamily="monospace">
                            {contract.ccrp.walletAddress}
                          </Typography>
                          <Chip 
                            label={contract.ccrpSigned ? 'Signed' : 'Pending'} 
                            color={contract.ccrpSigned ? 'success' : 'warning'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Not selected yet
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
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
                {isTDP && (contract.tdp?.walletAddress === currentUser?.walletAddress || contract.tdp?.did === currentUser?.did) && (
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
                
                <Button 
                  variant="outlined"
                  onClick={() => navigate('/contracts')}
                >
                  Back to Contracts
                </Button>
              </Box>
              {signError && <Alert severity="error" sx={{ mt: 2 }}>{signError}</Alert>}
            </CardContent>
          </Card>
        </Grid>

        {/* Download & Preview Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📄 Contract Documents & Downloads
              </Typography>
              
              {/* Download Buttons */}
              <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={downloadContract}
                  startIcon={<Download />}
                >
                  Download Complete Contract
                </Button>
                
                {contract.legalDocument && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={downloadLegalDocument}
                    startIcon={<Download />}
                  >
                    Download Legal Document
                  </Button>
                )}
                
                {contract.smartContractAddress && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={downloadSmartContractData}
                    startIcon={<Download />}
                  >
                    Download Smart Contract Data
                  </Button>
                )}
              </Box>

              {/* Contract Preview Sections */}
              {contract.legalDocument && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Visibility color="primary" />
                      <Typography variant="h6">
                        📋 Legal Document Preview
                      </Typography>
                    </Box>
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
                        {JSON.stringify(contract.legalDocument, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {contract.smartContractAddress && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Visibility color="secondary" />
                      <Typography variant="h6">
                        ⚡ Smart Contract Details
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Smart Contract Address:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {contract.smartContractAddress}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Network:</Typography>
                        <Typography variant="body2">
                          {contract.smartContractNetwork}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Legal Document Hash:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {contract.legalDocumentHash}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Ricardian Signature:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {contract.ricardianSignature}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {contract.environmentSpecs && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Storage color="info" />
                      <Typography variant="h6">
                        🏗️ Environment Specifications
                      </Typography>
                    </Box>
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
                        {JSON.stringify(contract.environmentSpecs, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {contract.trainingParams && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Description color="success" />
                      <Typography variant="h6">
                        🎯 Training Parameters
                      </Typography>
                    </Box>
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
                        {JSON.stringify(contract.trainingParams, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {contract.kmsConfigs && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Security color="warning" />
                      <Typography variant="h6">
                        🔐 KMS Configurations
                      </Typography>
                    </Box>
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
                        {JSON.stringify(contract.kmsConfigs, null, 2)}
                      </pre>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CCRP Selection Dialog */}
      <Dialog open={ccrpDialogOpen} onClose={() => setCcrpDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select CCRP</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Choose a Confidential Clean Room Provider for this contract:
          </Typography>

          <FormControl fullWidth>
            <InputLabel>CCRP</InputLabel>
            <Select
              value={selectedCcrp}
              label="CCRP"
              onChange={(e) => setSelectedCcrp(e.target.value)}
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
            variant="contained" 
            onClick={handleSelectCcrp}
            disabled={!selectedCcrp || selectCcrpMutation.isLoading}
          >
            Select CCRP
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ContractDetail; 