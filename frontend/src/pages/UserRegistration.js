import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useMutation } from 'react-query';
import { apiService } from '../services/api';
import { ethers } from 'ethers';

const partyTypes = [
  { value: 'TDP', label: 'Trusted Data Provider' },
  { value: 'TDC', label: 'Trusted Data Consumer' },
  { value: 'CCRP', label: 'Certified Contract Review Party' },
];

const steps = ['Connect Wallet', 'User Information', 'Party Type Selection', 'Review & Register'];

const UserRegistration = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    walletAddress: '',
    publicKey: '',
    name: '',
    email: '',
    partyType: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [connecting, setConnecting] = useState(false);
  const [signatureError, setSignatureError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 0:
        if (!formData.walletAddress) {
          newErrors.walletAddress = 'Wallet connection is required';
        }
        if (!formData.publicKey) {
          newErrors.publicKey = 'Public key is required';
        }
        break;
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        break;
      case 2:
        if (!formData.partyType) {
          newErrors.partyType = 'Party type is required';
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Wallet connect and public key recovery
  const handleConnectWallet = async () => {
    setConnecting(true);
    setSignatureError('');
    try {
      if (!window.ethereum) {
        setSignatureError('MetaMask is not installed.');
        setConnecting(false);
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      // Ask user to sign a message
      const message = 'Registering for Contract Management';
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      await signer.signMessage(message);
      // For now, we'll use a placeholder public key since ethers v6 doesn't have recoverPublicKey
      // In a real implementation, you might want to use a different approach
      const publicKey = '0x' + '0'.repeat(64); // Placeholder
      setFormData((prev) => ({ ...prev, walletAddress, publicKey }));
      setActiveStep(1);
    } catch (err) {
      setSignatureError('Failed to connect wallet or recover public key.');
    } finally {
      setConnecting(false);
    }
  };

  // Registration mutation
  const mutation = useMutation(apiService.registerUser, {
    onSuccess: () => setActiveStep(4),
    onError: (error) => {
      setErrors({ api: error?.response?.data?.error || 'Registration failed' });
    },
  });

  const handleRegister = () => {
    mutation.mutate(formData);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Connect Your Wallet</Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Please connect your MetaMask wallet to continue registration. Your wallet address and public key will be used for secure authentication.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConnectWallet}
              disabled={connecting}
              sx={{ mt: 2 }}
            >
              {connecting ? <CircularProgress size={24} /> : 'Connect Wallet'}
            </Button>
            {formData.walletAddress && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Connected: <span style={{ fontFamily: 'monospace' }}>{formData.walletAddress}</span>
              </Alert>
            )}
            {signatureError && <Alert severity="error" sx={{ mt: 2 }}>{signatureError}</Alert>}
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>User Information</Typography>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              sx={{ mb: 2 }}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Select Your Role</Typography>
            <TextField
              select
              fullWidth
              label="Party Type"
              value={formData.partyType}
              onChange={(e) => handleInputChange('partyType', e.target.value)}
              error={!!errors.partyType}
              helperText={errors.partyType}
              sx={{ mb: 2 }}
            >
              {partyTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Your Information</Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">Wallet Address</Typography>
                <Typography variant="body2" fontFamily="monospace">{formData.walletAddress}</Typography>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>Public Key</Typography>
                <Typography variant="body2" fontFamily="monospace">{formData.publicKey}</Typography>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>Name</Typography>
                <Typography variant="body2">{formData.name}</Typography>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>Email</Typography>
                <Typography variant="body2">{formData.email}</Typography>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>Party Type</Typography>
                <Typography variant="body2">{partyTypes.find(t => t.value === formData.partyType)?.label}</Typography>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>Description</Typography>
                <Typography variant="body2">{formData.description}</Typography>
              </CardContent>
            </Card>
            {errors.api && <Alert severity="error" sx={{ mb: 2 }}>{errors.api}</Alert>}
            <Button variant="contained" color="primary" onClick={handleRegister} disabled={mutation.isLoading}>
              {mutation.isLoading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
          </Box>
        );
      case 4:
        return (
          <Box textAlign="center">
            <Typography variant="h6" color="success.main" gutterBottom>Registration Successful!</Typography>
            <Typography variant="body2">You can now use your wallet to sign contracts securely.</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label} completed={activeStep > index}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              {renderStepContent(index)}
              <Box sx={{ mb: 2 }}>
                <div>
                  {activeStep > 0 && activeStep < 4 && (
                    <Button onClick={handleBack} sx={{ mt: 1, mr: 1 }}>Back</Button>
                  )}
                  {activeStep < 3 && (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === 4 && renderStepContent(4)}
    </Box>
  );
};

export default UserRegistration; 