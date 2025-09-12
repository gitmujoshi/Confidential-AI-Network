/**
 * Enterprise Signing Component
 * Handles contract signing with enterprise cloud KMS systems
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { apiService } from '../services/api';

const EnterpriseSigning = ({ contractId, onSigningComplete }) => {
  const [enterpriseKeys, setEnterpriseKeys] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [kmsConfig, setKmsConfig] = useState({
    provider: '',
    keyId: '',
    credentials: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [signingResult, setSigningResult] = useState(null);

  // Load enterprise keys on component mount
  useEffect(() => {
    loadEnterpriseKeys();
  }, []);

  const loadEnterpriseKeys = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/enterprise/keys');
      if (response.data.success) {
        setEnterpriseKeys(response.data.data);
      }
    } catch (error) {
      console.error('Error loading enterprise keys:', error);
      setError('Failed to load enterprise keys');
    } finally {
      setLoading(false);
    }
  };

  const handleKeySelection = (keyId) => {
    setSelectedKeyId(keyId);
    const selectedKey = enterpriseKeys.find(key => key.keyId === keyId);
    if (selectedKey) {
      setKmsConfig(prev => ({
        ...prev,
        provider: selectedKey.provider,
        keyId: selectedKey.keyId
      }));
    }
  };

  const handleKmsConfigChange = (field, value) => {
    if (field === 'credentials') {
      setKmsConfig(prev => ({
        ...prev,
        credentials: { ...prev.credentials, ...value }
      }));
    } else {
      setKmsConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSignContract = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await apiService.post('/api/enterprise/sign', {
        contractId,
        keyId: selectedKeyId,
        kmsConfig
      });

      if (response.data.success) {
        setSigningResult(response.data.data);
        setSuccess('Contract signed successfully!');
        setActiveStep(2);
        if (onSigningComplete) {
          onSigningComplete(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      setError(error.response?.data?.error || 'Failed to sign contract');
    } finally {
      setLoading(false);
    }
  };

  const getProviderCredentials = (provider) => {
    switch (provider) {
      case 'azure':
        return [
          { key: 'vaultUrl', label: 'Vault URL', type: 'url' },
          { key: 'clientId', label: 'Client ID', type: 'text' },
          { key: 'clientSecret', label: 'Client Secret', type: 'password' },
          { key: 'tenantId', label: 'Tenant ID', type: 'text' }
        ];
      case 'aws':
        return [
          { key: 'accessKeyId', label: 'Access Key ID', type: 'text' },
          { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
          { key: 'region', label: 'Region', type: 'text' }
        ];
      case 'gcp':
        return [
          { key: 'projectId', label: 'Project ID', type: 'text' },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'keyRing', label: 'Key Ring', type: 'text' },
          { key: 'cryptoKey', label: 'Crypto Key', type: 'text' },
          { key: 'serviceAccountKey', label: 'Service Account Key (JSON)', type: 'textarea' }
        ];
      case 'oci':
        return [
          { key: 'compartmentId', label: 'Compartment ID', type: 'text' },
          { key: 'vaultId', label: 'Vault ID', type: 'text' },
          { key: 'userId', label: 'User ID', type: 'text' },
          { key: 'fingerprint', label: 'Fingerprint', type: 'text' },
          { key: 'privateKey', label: 'Private Key (PEM)', type: 'textarea' },
          { key: 'region', label: 'Region', type: 'text' }
        ];
      default:
        return [];
    }
  };

  const steps = [
    'Select Enterprise Key',
    'Configure KMS',
    'Sign Contract'
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Enterprise Contract Signing
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        <Step>
          <StepLabel>Select Enterprise Key</StepLabel>
          <StepContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Enterprise Key</InputLabel>
              <Select
                value={selectedKeyId}
                onChange={(e) => handleKeySelection(e.target.value)}
                disabled={loading}
              >
                {enterpriseKeys.map((key) => (
                  <MenuItem key={key.keyId} value={key.keyId}>
                    <Box>
                      <Typography variant="body1">{key.keyId}</Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip label={key.algorithm} size="small" />
                        <Chip label={key.provider} size="small" color="primary" />
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedKeyId && (
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                sx={{ mt: 2 }}
              >
                Next: Configure KMS
              </Button>
            )}
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Configure KMS</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Configure your {kmsConfig.provider.toUpperCase()} KMS credentials
            </Typography>
            <Grid container spacing={2}>
              {getProviderCredentials(kmsConfig.provider).map((cred) => (
                <Grid item xs={12} key={cred.key}>
                  <TextField
                    fullWidth
                    label={cred.label}
                    type={cred.type === 'password' ? 'password' : 'text'}
                    multiline={cred.type === 'textarea'}
                    rows={cred.type === 'textarea' ? 3 : 1}
                    value={kmsConfig.credentials[cred.key] || ''}
                    onChange={(e) => handleKmsConfigChange('credentials', {
                      [cred.key]: e.target.value
                    })}
                    disabled={loading}
                  />
                </Grid>
              ))}
            </Grid>
            <Box display="flex" gap={2} mt={2}>
              <Button onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={!kmsConfig.credentials.vaultUrl && !kmsConfig.credentials.accessKeyId}
              >
                Next: Sign Contract
              </Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Sign Contract</StepLabel>
          <StepContent>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ready to Sign Contract
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Contract ID: {contractId}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Enterprise Key: {selectedKeyId}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  KMS Provider: {kmsConfig.provider.toUpperCase()}
                </Typography>
              </CardContent>
            </Card>
            <Box display="flex" gap={2} mt={2}>
              <Button onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSignContract}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Signing...' : 'Sign Contract'}
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {signingResult && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Signing Result
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Signature: {signingResult.signature?.signature?.substring(0, 50)}...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Algorithm: {signingResult.signature?.algorithm}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Signed At: {new Date(signingResult.signature?.signedAt).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EnterpriseSigning;
