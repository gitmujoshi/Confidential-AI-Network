import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Lock,
  Security,
  Visibility,
  Warning,
  Info,
  Key,
  Description,
  Person,
  Schedule
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { apiService } from '../../services/api';

const ContractSigning = ({ contractId, onSigningComplete }) => {
  const { currentUser } = useUser();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signingStep, setSigningStep] = useState(0);
  const [signingInProgress, setSigningInProgress] = useState(false);
  const [signingResult, setSigningResult] = useState(null);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);

  const steps = [
    'Review Contract',
    'Select Signing Key',
    'Confirm Signing',
    'Generate Signature',
    'Complete'
  ];

  useEffect(() => {
    loadContract();
    loadAvailableKeys();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const contractData = await apiService.getContract(contractId);
      setContract(contractData);
    } catch (err) {
      setError('Failed to load contract details');
      console.error('Error loading contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableKeys = async () => {
    try {
      const keys = await apiService.getUserKeys(currentUser.id);
      setAvailableKeys(keys.filter(key => key.keyStatus === 'active'));
    } catch (err) {
      console.error('Error loading keys:', err);
    }
  };

  const handleKeySelection = (key) => {
    setSelectedKey(key);
    setSigningStep(2);
  };

  const handleSigning = async () => {
    try {
      setSigningInProgress(true);
      setSigningStep(3);

      // Simulate signature generation process
      const signatureData = {
        contractId: contract.id,
        signerId: currentUser.id,
        keyId: selectedKey.id,
        timestamp: Date.now(),
        algorithm: 'ECDSA-P256'
      };

      // Call signing API
      const result = await apiService.signContract(signatureData);
      
      setSigningResult(result);
      setSigningStep(4);
      
      if (onSigningComplete) {
        onSigningComplete(result);
      }
    } catch (err) {
      setError('Failed to sign contract');
      console.error('Error signing contract:', err);
    } finally {
      setSigningInProgress(false);
    }
  };

  const getStepIcon = (step) => {
    if (step < signingStep) return <CheckCircle color="success" />;
    if (step === signingStep) return <CircularProgress size={20} />;
    return <Lock color="disabled" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!contract) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Contract not found
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Contract Signing
      </Typography>
      
      <Stepper activeStep={signingStep} orientation="vertical">
        {/* Step 1: Review Contract */}
        <Step>
          <StepLabel
            StepIconComponent={() => getStepIcon(0)}
            optional={<Typography variant="caption">Review contract details</Typography>}
          >
            Review Contract
          </StepLabel>
          <StepContent>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contract Details
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Description /></ListItemIcon>
                    <ListItemText 
                      primary="Contract ID" 
                      secondary={contract.contractId || contract.id} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Person /></ListItemIcon>
                    <ListItemText 
                      primary="Parties" 
                      secondary={`TDC: ${contract.tdc?.name}, TSP: ${contract.tsp?.name}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Schedule /></ListItemIcon>
                    <ListItemText 
                      primary="Created" 
                      secondary={new Date(contract.createdAt).toLocaleDateString()} 
                    />
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary">
                  {contract.description || 'No description available'}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setSigningStep(1)}
                    startIcon={<Visibility />}
                  >
                    Continue to Key Selection
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </StepContent>
        </Step>

        {/* Step 2: Select Signing Key */}
        <Step>
          <StepLabel
            StepIconComponent={() => getStepIcon(1)}
            optional={<Typography variant="caption">Choose your signing key</Typography>}
          >
            Select Signing Key
          </StepLabel>
          <StepContent>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Signing Keys
                </Typography>
                
                {availableKeys.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No signing keys available. Please generate a key first.
                  </Alert>
                ) : (
                  <List>
                    {availableKeys.map((key) => (
                      <ListItem
                        key={key.id}
                        button
                        onClick={() => handleKeySelection(key)}
                        selected={selectedKey?.id === key.id}
                        sx={{
                          border: '1px solid',
                          borderColor: selectedKey?.id === key.id ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemIcon><Key /></ListItemIcon>
                        <ListItemText
                          primary={`Key ID: ${key.keyId}`}
                          secondary={`Type: ${key.keyType} | Created: ${new Date(key.createdAt).toLocaleDateString()}`}
                        />
                        <Chip
                          label={key.keyStatus}
                          color={key.keyStatus === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Key />}
                    onClick={() => {/* Navigate to key management */}}
                  >
                    Manage Keys
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </StepContent>
        </Step>

        {/* Step 3: Confirm Signing */}
        <Step>
          <StepLabel
            StepIconComponent={() => getStepIcon(2)}
            optional={<Typography variant="caption">Confirm your signature</Typography>}
          >
            Confirm Signing
          </StepLabel>
          <StepContent>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Signing Confirmation
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    By signing this contract, you agree to all terms and conditions. 
                    This action is legally binding and cannot be undone.
                  </Typography>
                </Alert>
                
                <List>
                  <ListItem>
                    <ListItemIcon><Description /></ListItemIcon>
                    <ListItemText 
                      primary="Contract" 
                      secondary={contract.contractId || contract.id} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Key /></ListItemIcon>
                    <ListItemText 
                      primary="Signing Key" 
                      secondary={selectedKey?.keyId} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Person /></ListItemIcon>
                    <ListItemText 
                      primary="Signer" 
                      secondary={currentUser.name} 
                    />
                  </ListItem>
                </List>
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSigning}
                    disabled={signingInProgress}
                    startIcon={<Security />}
                    sx={{ mr: 1 }}
                  >
                    Sign Contract
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSigningStep(1)}
                    disabled={signingInProgress}
                  >
                    Back
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </StepContent>
        </Step>

        {/* Step 4: Generate Signature */}
        <Step>
          <StepLabel
            StepIconComponent={() => getStepIcon(3)}
            optional={<Typography variant="caption">Generating signature</Typography>}
          >
            Generate Signature
          </StepLabel>
          <StepContent>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body1">
                    Generating digital signature...
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  This process may take a few moments. Please do not close this window.
                </Typography>
              </CardContent>
            </Card>
          </StepContent>
        </Step>

        {/* Step 5: Complete */}
        <Step>
          <StepLabel
            StepIconComponent={() => getStepIcon(4)}
            optional={<Typography variant="caption">Signing complete</Typography>}
          >
            Complete
          </StepLabel>
          <StepContent>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="success.main">
                    Contract Successfully Signed!
                  </Typography>
                </Box>
                
                {signingResult && (
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText 
                        primary="Signature Generated" 
                        secondary={`Algorithm: ${signingResult.algorithm}`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Schedule /></ListItemIcon>
                      <ListItemText 
                        primary="Timestamp" 
                        secondary={new Date(signingResult.timestamp).toLocaleString()} 
                      />
                    </ListItem>
                    {signingResult.blockchainTxHash && (
                      <ListItem>
                        <ListItemIcon><Security /></ListItemIcon>
                        <ListItemText 
                          primary="Blockchain Transaction" 
                          secondary={signingResult.blockchainTxHash} 
                        />
                      </ListItem>
                    )}
                  </List>
                )}
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => window.location.reload()}
                    startIcon={<CheckCircle />}
                  >
                    Done
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </StepContent>
        </Step>
      </Stepper>
    </Box>
  );
};

export default ContractSigning;
