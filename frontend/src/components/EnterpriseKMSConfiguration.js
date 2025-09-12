import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Cloud as CloudIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import apiService from '../services/api';

const EnterpriseKMSConfiguration = ({ onConfigurationComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSecrets, setShowSecrets] = useState({});
  const [testResults, setTestResults] = useState({});
  const [expandedProvider, setExpandedProvider] = useState('');

  const [kmsConfig, setKmsConfig] = useState({
    provider: 'azure',
    credentials: {},
    keyId: '',
    region: '',
    vaultUrl: ''
  });

  const providers = [
    {
      id: 'azure',
      name: 'Azure Key Vault',
      icon: <CloudIcon />,
      description: 'Microsoft Azure Key Vault for secure key management',
      fields: [
        { key: 'vaultUrl', label: 'Vault URL', type: 'url', required: true, placeholder: 'https://your-vault.vault.azure.net/' },
        { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Your client secret' },
        { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }
      ]
    },
    {
      id: 'aws',
      name: 'AWS KMS',
      icon: <CloudIcon />,
      description: 'Amazon Web Services Key Management Service',
      fields: [
        { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true, placeholder: 'AKIAIOSFODNN7EXAMPLE' },
        { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true, placeholder: 'Your secret access key' },
        { key: 'region', label: 'Region', type: 'text', required: true, placeholder: 'us-east-1' }
      ]
    },
    {
      id: 'gcp',
      name: 'Google Cloud KMS',
      icon: <CloudIcon />,
      description: 'Google Cloud Platform Key Management Service',
      fields: [
        { key: 'projectId', label: 'Project ID', type: 'text', required: true, placeholder: 'your-project-id' },
        { key: 'location', label: 'Location', type: 'text', required: true, placeholder: 'us-central1' },
        { key: 'keyRing', label: 'Key Ring', type: 'text', required: true, placeholder: 'contract-management-keys' },
        { key: 'cryptoKey', label: 'Crypto Key', type: 'text', required: true, placeholder: 'signing-key' },
        { key: 'serviceAccountKey', label: 'Service Account Key (JSON)', type: 'textarea', required: true, placeholder: 'Paste your service account JSON key here' }
      ]
    },
    {
      id: 'oci',
      name: 'Oracle Cloud KMS',
      icon: <CloudIcon />,
      description: 'Oracle Cloud Infrastructure Key Management Service',
      fields: [
        { key: 'compartmentId', label: 'Compartment ID', type: 'text', required: true, placeholder: 'ocid1.compartment.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
        { key: 'vaultId', label: 'Vault ID', type: 'text', required: true, placeholder: 'ocid1.vault.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
        { key: 'userId', label: 'User ID', type: 'text', required: true, placeholder: 'ocid1.user.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
        { key: 'fingerprint', label: 'Fingerprint', type: 'text', required: true, placeholder: 'xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx' },
        { key: 'privateKey', label: 'Private Key (PEM)', type: 'textarea', required: true, placeholder: '-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----' },
        { key: 'region', label: 'Region', type: 'text', required: true, placeholder: 'us-ashburn-1' }
      ]
    }
  ];

  const handleProviderChange = (provider) => {
    setKmsConfig({
      provider,
      credentials: {},
      keyId: '',
      region: '',
      vaultUrl: ''
    });
    setError('');
    setSuccess('');
    setTestResults({});
  };

  const handleCredentialChange = (field, value) => {
    setKmsConfig(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [field]: value
      }
    }));
  };

  const handleKeyIdChange = (value) => {
    setKmsConfig(prev => ({
      ...prev,
      keyId: value
    }));
  };

  const toggleSecretVisibility = (field) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const testConnection = async (provider) => {
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      const providerConfig = providers.find(p => p.id === provider);
      const credentials = kmsConfig.credentials;
      
      // Validate required fields
      const missingFields = providerConfig.fields
        .filter(field => field.required && !credentials[field.key])
        .map(field => field.label);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Test connection
      const testData = {
        provider,
        credentials,
        keyId: kmsConfig.keyId,
        region: kmsConfig.region,
        vaultUrl: kmsConfig.vaultUrl
      };

      const response = await apiService.testKMSConnection(testData);
      
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: true,
          message: response.message || 'Connection successful',
          timestamp: new Date().toISOString()
        }
      }));

      setSuccess(`Successfully connected to ${providerConfig.name}`);
    } catch (error) {
      console.error('KMS connection test failed:', error);
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: false,
          message: error.message || 'Connection failed',
          timestamp: new Date().toISOString()
        }
      }));
      setError(`Failed to connect to ${providerConfig.name}: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const configuration = {
        provider: kmsConfig.provider,
        credentials: kmsConfig.credentials,
        keyId: kmsConfig.keyId,
        region: kmsConfig.region,
        vaultUrl: kmsConfig.vaultUrl,
        metadata: {
          configuredAt: new Date().toISOString(),
          provider: kmsConfig.provider
        }
      };

      // Save configuration
      await apiService.saveKMSConfiguration(configuration);
      
      setSuccess('KMS configuration saved successfully');
      
      if (onConfigurationComplete) {
        onConfigurationComplete(configuration);
      }
    } catch (error) {
      console.error('Failed to save KMS configuration:', error);
      setError(`Failed to save configuration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isConfigurationValid = () => {
    const providerConfig = providers.find(p => p.id === kmsConfig.provider);
    if (!providerConfig) return false;

    const hasRequiredFields = providerConfig.fields
      .filter(field => field.required)
      .every(field => kmsConfig.credentials[field.key]);

    return hasRequiredFields && kmsConfig.keyId;
  };

  const currentProvider = providers.find(p => p.id === kmsConfig.provider);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Enterprise KMS Configuration
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your cloud Key Management Service (KMS) for secure contract signing. 
        Your private keys will never be stored in our system - they remain in your secure cloud environment.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Cloud Provider
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Cloud Provider</InputLabel>
                <Select
                  value={kmsConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  label="Cloud Provider"
                >
                  {providers.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {provider.icon}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body1">{provider.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {provider.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Key ID"
                value={kmsConfig.keyId}
                onChange={(e) => handleKeyIdChange(e.target.value)}
                margin="normal"
                placeholder="Enter the ID of your signing key"
                helperText="The identifier of the key you want to use for signing"
              />

              {kmsConfig.provider === 'azure' && (
                <TextField
                  fullWidth
                  label="Vault URL"
                  value={kmsConfig.vaultUrl}
                  onChange={(e) => setKmsConfig(prev => ({ ...prev, vaultUrl: e.target.value }))}
                  margin="normal"
                  placeholder="https://your-vault.vault.azure.net/"
                />
              )}

              {(kmsConfig.provider === 'aws' || kmsConfig.provider === 'gcp' || kmsConfig.provider === 'oci') && (
                <TextField
                  fullWidth
                  label="Region"
                  value={kmsConfig.region}
                  onChange={(e) => setKmsConfig(prev => ({ ...prev, region: e.target.value }))}
                  margin="normal"
                  placeholder="us-east-1"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Credentials
              </Typography>
              
              {currentProvider?.fields.map((field) => (
                <Box key={field.key} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label={field.label}
                    type={field.type === 'password' && !showSecrets[field.key] ? 'password' : field.type === 'textarea' ? 'text' : field.type}
                    value={kmsConfig.credentials[field.key] || ''}
                    onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    multiline={field.type === 'textarea'}
                    rows={field.type === 'textarea' ? 4 : 1}
                    InputProps={{
                      endAdornment: field.type === 'password' && (
                        <IconButton
                          onClick={() => toggleSecretVisibility(field.key)}
                          edge="end"
                        >
                          {showSecrets[field.key] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      )
                    }}
                  />
                </Box>
              ))}

              <Button
                variant="outlined"
                onClick={() => testConnection(kmsConfig.provider)}
                disabled={testing || !isConfigurationValid()}
                startIcon={testing ? <CircularProgress size={20} /> : <SecurityIcon />}
                sx={{ mt: 2 }}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>

              {testResults[kmsConfig.provider] && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={testResults[kmsConfig.provider].success ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={testResults[kmsConfig.provider].message}
                    color={testResults[kmsConfig.provider].success ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSaveConfiguration}
          disabled={loading || !isConfigurationValid()}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Security Note:</strong> Your cloud credentials are encrypted and stored securely. 
          We never have access to your private keys - they remain in your cloud environment. 
          When signing contracts, we send the contract hash to your KMS for signing.
        </Typography>
      </Alert>
    </Box>
  );
};

export default EnterpriseKMSConfiguration;
