import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  AlertTitle
} from '@mui/material';
import {
  Security,
  Cloud,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Refresh,
  Settings,
  VerifiedUser,
  Lock,
  Speed,
  Storage,
  Memory,
  NetworkCheck,
  MonetizationOn,
  Visibility,
  VisibilityOff,
  Add,
  Edit,
  Delete,
  CloudQueue,
  AccountBalance,
  Storage as StorageIcon,
  Business
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const CCRPCloudCredentials = () => {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('AZURE');
  const [credentials, setCredentials] = useState([]);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'

  // Form state for new/edit credential
  const [formData, setFormData] = useState({
    cloudProvider: 'AZURE',
    secretManager: 'VAULT',
    authMethod: 'SERVICE_PRINCIPAL',
    defaultLocation: 'eastus',
    defaultResourceGroupPrefix: 'training',
    defaultVMSize: 'Standard_D2s_v3',
    defaultStorageSku: 'Standard_LRS',
    defaultDatabaseSku: 'Basic',
    vnetAddressSpace: '10.0.0.0/16',
    privateSubnetPrefix: '10.0.1.0/24',
    publicSubnetPrefix: '10.0.2.0/24',
    enableEncryption: true,
    enableMonitoring: true,
    enableKeyVault: true,
    budgetLimit: '',
    alertThreshold: 0.8
  });

  // Cloud provider specific fields
  const [azureFields, setAzureFields] = useState({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: ''
  });

  const [awsFields, setAwsFields] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1'
  });

  const [gcpFields, setGcpFields] = useState({
    projectId: '',
    serviceAccountKey: ''
  });

  const [ociFields, setOciFields] = useState({
    compartmentId: '',
    userId: '',
    fingerprint: '',
    privateKey: ''
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/ccrp/cloud-credentials');
      setCredentials(response.data);
    } catch (error) {
      console.error('Error loading credentials:', error);
      setError('Failed to load cloud credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = () => {
    setDialogMode('add');
    setSelectedCredential(null);
    resetFormData();
    setDialogOpen(true);
  };

  const handleEditCredential = (credential) => {
    setDialogMode('edit');
    setSelectedCredential(credential);
    setFormData({
      cloudProvider: credential.cloudProvider,
      secretManager: credential.secretManager,
      authMethod: credential.authMethod,
      defaultLocation: credential.defaultLocation,
      defaultResourceGroupPrefix: credential.defaultResourceGroupPrefix,
      defaultVMSize: credential.defaultVMSize,
      defaultStorageSku: credential.defaultStorageSku,
      defaultDatabaseSku: credential.defaultDatabaseSku,
      vnetAddressSpace: credential.vnetAddressSpace,
      privateSubnetPrefix: credential.privateSubnetPrefix,
      publicSubnetPrefix: credential.publicSubnetPrefix,
      enableEncryption: credential.enableEncryption,
      enableMonitoring: credential.enableMonitoring,
      enableKeyVault: credential.enableKeyVault,
      budgetLimit: credential.budgetLimit || '',
      alertThreshold: credential.alertThreshold || 0.8
    });
    setDialogOpen(true);
  };

  const handleDeleteCredential = async (credentialId) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      try {
        await apiService.delete(`/api/ccrp/cloud-credentials/${credentialId}`);
        toast.success('Credential deleted successfully');
        loadCredentials();
      } catch (error) {
        console.error('Error deleting credential:', error);
        toast.error('Failed to delete credential');
      }
    }
  };

  const handleSaveCredential = async () => {
    try {
      setLoading(true);
      
      const credentialData = {
        ...formData,
        ccrpUserId: currentUser.id
      };

      if (dialogMode === 'add') {
        await apiService.post('/api/ccrp/cloud-credentials', credentialData);
        toast.success('Credential added successfully');
      } else {
        await apiService.put(`/api/ccrp/cloud-credentials/${selectedCredential.id}`, credentialData);
        toast.success('Credential updated successfully');
      }

      setDialogOpen(false);
      loadCredentials();
    } catch (error) {
      console.error('Error saving credential:', error);
      toast.error('Failed to save credential');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCredential = async (credential) => {
    try {
      setValidating(true);
      await apiService.post(`/api/ccrp/cloud-credentials/${credential.id}/validate`);
      toast.success('Credential validated successfully');
      loadCredentials();
    } catch (error) {
      console.error('Error validating credential:', error);
      toast.error('Credential validation failed');
    } finally {
      setValidating(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      cloudProvider: 'AZURE',
      secretManager: 'VAULT',
      authMethod: 'SERVICE_PRINCIPAL',
      defaultLocation: 'eastus',
      defaultResourceGroupPrefix: 'training',
      defaultVMSize: 'Standard_D2s_v3',
      defaultStorageSku: 'Standard_LRS',
      defaultDatabaseSku: 'Basic',
      vnetAddressSpace: '10.0.0.0/16',
      privateSubnetPrefix: '10.0.1.0/24',
      publicSubnetPrefix: '10.0.2.0/24',
      enableEncryption: true,
      enableMonitoring: true,
      enableKeyVault: true,
      budgetLimit: '',
      alertThreshold: 0.8
    });
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'AZURE':
        return <CloudQueue color="primary" />;
      case 'AWS':
        return <AccountBalance color="primary" />;
      case 'GCP':
        return <StorageIcon color="primary" />;
      case 'OCI':
        return <Business color="primary" />;
      default:
        return <Cloud color="primary" />;
    }
  };

  const getValidationStatusColor = (status) => {
    switch (status) {
      case 'VALID':
        return 'success';
      case 'INVALID':
        return 'error';
      case 'EXPIRED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getValidationStatusIcon = (status) => {
    switch (status) {
      case 'VALID':
        return <CheckCircle />;
      case 'INVALID':
        return <Error />;
      case 'EXPIRED':
        return <Warning />;
      default:
        return <Info />;
    }
  };

  const getProviderName = (provider) => {
    switch (provider) {
      case 'AZURE':
        return 'Microsoft Azure';
      case 'AWS':
        return 'Amazon Web Services';
      case 'GCP':
        return 'Google Cloud Platform';
      case 'OCI':
        return 'Oracle Cloud Infrastructure';
      default:
        return provider;
    }
  };

  if (!currentUser || currentUser.partyType !== 'CCRP') {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning">
          <AlertTitle>Access Restricted</AlertTitle>
          This page is only available for CCRP (Confidential Clean Room Provider) users.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
          Cloud Credentials Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your cloud provider credentials for training environment provisioning.
        </Typography>
      </Box>

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

      {/* Add Credential Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddCredential}
          disabled={loading}
        >
          Add Cloud Credential
        </Button>
      </Box>

      {/* Credentials List */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : credentials.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" align="center">
                  No cloud credentials found
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Add your first cloud credential to get started with training environment provisioning.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          credentials.map((credential) => (
            <Grid item xs={12} md={6} lg={4} key={credential.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    {getProviderIcon(credential.cloudProvider)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {getProviderName(credential.cloudProvider)}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Chip
                      icon={getValidationStatusIcon(credential.validationStatus)}
                      label={credential.validationStatus}
                      color={getValidationStatusColor(credential.validationStatus)}
                      size="small"
                    />
                    <Chip
                      label={credential.secretManager}
                      variant="outlined"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Location:</strong> {credential.defaultLocation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>VM Size:</strong> {credential.defaultVMSize}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Secret Name:</strong> {credential.secretName}
                  </Typography>

                  {credential.lastValidated && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Last Validated:</strong> {new Date(credential.lastValidated).toLocaleDateString()}
                    </Typography>
                  )}

                  <Box mt={2} display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => handleEditCredential(credential)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => handleValidateCredential(credential)}
                      disabled={validating}
                    >
                      Validate
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDeleteCredential(credential.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add/Edit Credential Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add Cloud Credential' : 'Edit Cloud Credential'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cloud Provider</InputLabel>
                <Select
                  value={formData.cloudProvider}
                  onChange={(e) => setFormData({ ...formData, cloudProvider: e.target.value })}
                >
                  <MenuItem value="AZURE">Microsoft Azure</MenuItem>
                  <MenuItem value="AWS">Amazon Web Services</MenuItem>
                  <MenuItem value="GCP">Google Cloud Platform</MenuItem>
                  <MenuItem value="OCI">Oracle Cloud Infrastructure</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Secret Manager</InputLabel>
                <Select
                  value={formData.secretManager}
                  onChange={(e) => setFormData({ ...formData, secretManager: e.target.value })}
                >
                  <MenuItem value="VAULT">HashiCorp Vault</MenuItem>
                  <MenuItem value="AWS_SECRETS">AWS Secrets Manager</MenuItem>
                  <MenuItem value="AZURE_KEYVAULT">Azure Key Vault</MenuItem>
                  <MenuItem value="GCP_SECRETS">Google Cloud Secret Manager</MenuItem>
                  <MenuItem value="OCI_VAULT">OCI Vault</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Location"
                value={formData.defaultLocation}
                onChange={(e) => setFormData({ ...formData, defaultLocation: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="VM Size"
                value={formData.defaultVMSize}
                onChange={(e) => setFormData({ ...formData, defaultVMSize: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableEncryption}
                    onChange={(e) => setFormData({ ...formData, enableEncryption: e.target.checked })}
                  />
                }
                label="Enable Encryption"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableMonitoring}
                    onChange={(e) => setFormData({ ...formData, enableMonitoring: e.target.checked })}
                  />
                }
                label="Enable Monitoring"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableKeyVault}
                    onChange={(e) => setFormData({ ...formData, enableKeyVault: e.target.checked })}
                  />
                }
                label="Enable Key Vault"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCredential} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CCRPCloudCredentials; 