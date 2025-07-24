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
  TableRow
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
  VisibilityOff
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const CCRPAzureCredentials = () => {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);

  // Form state
  const [credentials, setCredentials] = useState({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    authMethod: 'SERVICE_PRINCIPAL'
  });

  const [config, setConfig] = useState({
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

  const [currentCredentials, setCurrentCredentials] = useState(null);
  const [validationStatus, setValidationStatus] = useState('PENDING');

  // Load existing credentials
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/ccrp/azure-credentials/${currentUser.id}`);
      if (response.data.success) {
        const creds = response.data.credentials;
        setCurrentCredentials(creds);
        setValidationStatus(creds.validationStatus);
        
        // Populate form with existing data
        setCredentials({
          subscriptionId: creds.subscriptionId || '',
          tenantId: creds.tenantId || '',
          clientId: creds.clientId || '',
          clientSecret: creds.clientSecret || '',
          authMethod: creds.authMethod || 'SERVICE_PRINCIPAL'
        });

        setConfig({
          defaultLocation: creds.defaultLocation || 'eastus',
          defaultResourceGroupPrefix: creds.defaultResourceGroupPrefix || 'training',
          defaultVMSize: creds.defaultVMSize || 'Standard_D2s_v3',
          defaultStorageSku: creds.defaultStorageSku || 'Standard_LRS',
          defaultDatabaseSku: creds.defaultDatabaseSku || 'Basic',
          vnetAddressSpace: creds.vnetAddressSpace || '10.0.0.0/16',
          privateSubnetPrefix: creds.privateSubnetPrefix || '10.0.1.0/24',
          publicSubnetPrefix: creds.publicSubnetPrefix || '10.0.2.0/24',
          enableEncryption: creds.enableEncryption !== false,
          enableMonitoring: creds.enableMonitoring !== false,
          enableKeyVault: creds.enableKeyVault !== false,
          budgetLimit: creds.budgetLimit || '',
          alertThreshold: creds.alertThreshold || 0.8
        });
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setError('Failed to load existing credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await apiService.post(`/api/ccrp/azure-credentials/${currentUser.id}`, {
        credentials,
        config
      });

      if (response.data.success) {
        setSuccess('Azure credentials saved successfully!');
        setCurrentCredentials(response.data.credentials);
        setValidationStatus('PENDING');
        toast.success('Azure credentials saved successfully!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save credentials';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      setError('');
      setSuccess('');

      const response = await apiService.post(`/api/ccrp/azure-credentials/${currentUser.id}/validate`);
      
      if (response.data.success) {
        setValidationStatus('VALID');
        setSuccess('Azure credentials validated successfully!');
        toast.success('Azure credentials validated successfully!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to validate credentials';
      setError(errorMsg);
      setValidationStatus('INVALID');
      toast.error(errorMsg);
    } finally {
      setValidating(false);
    }
  };

  const handleTestConnectivity = async () => {
    try {
      setTestDialogOpen(true);
      setTestResults(null);

      const response = await apiService.post(`/api/ccrp/azure-credentials/${currentUser.id}/test`);
      
      if (response.data.success) {
        setTestResults(response.data.results);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to test connectivity';
      setTestResults({ error: errorMsg });
    }
  };

  const getValidationStatusColor = (status) => {
    switch (status) {
      case 'VALID': return 'success';
      case 'INVALID': return 'error';
      case 'EXPIRED': return 'warning';
      default: return 'default';
    }
  };

  const getValidationStatusIcon = (status) => {
    switch (status) {
      case 'VALID': return <CheckCircle />;
      case 'INVALID': return <Error />;
      case 'EXPIRED': return <Warning />;
      default: return <Info />;
    }
  };

  const vmSizes = [
    'Standard_D2s_v3',
    'Standard_D4s_v3',
    'Standard_D8s_v3',
    'Standard_NC6s_v3',
    'Standard_NC12s_v3',
    'Standard_NC24s_v3'
  ];

  const locations = [
    'eastus',
    'westus',
    'westus2',
    'centralus',
    'northeurope',
    'westeurope',
    'southeastasia',
    'eastasia'
  ];

  const storageSkus = [
    'Standard_LRS',
    'Standard_GRS',
    'Standard_RAGRS',
    'Premium_LRS'
  ];

  const databaseSkus = [
    'Basic',
    'Standard',
    'Premium'
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Azure Credentials Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Configure your Azure credentials and default infrastructure settings for training environment provisioning.
        </Typography>

        {/* Status Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Cloud color="primary" />
                <Typography variant="h6">Azure Credentials Status</Typography>
              </Box>
              <Chip
                icon={getValidationStatusIcon(validationStatus)}
                label={validationStatus}
                color={getValidationStatusColor(validationStatus)}
                variant="outlined"
              />
            </Box>
            
            {currentCredentials && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last validated: {currentCredentials.lastValidated ? 
                    new Date(currentCredentials.lastValidated).toLocaleString() : 'Never'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Azure Credentials */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Azure Credentials
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subscription ID"
                      value={credentials.subscriptionId}
                      onChange={(e) => setCredentials(prev => ({ ...prev, subscriptionId: e.target.value }))}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tenant ID"
                      value={credentials.tenantId}
                      onChange={(e) => setCredentials(prev => ({ ...prev, tenantId: e.target.value }))}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Client ID"
                      value={credentials.clientId}
                      onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Client Secret"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.clientSecret}
                      onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                      required
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Authentication Method</InputLabel>
                      <Select
                        value={credentials.authMethod}
                        onChange={(e) => setCredentials(prev => ({ ...prev, authMethod: e.target.value }))}
                        label="Authentication Method"
                      >
                        <MenuItem value="SERVICE_PRINCIPAL">Service Principal</MenuItem>
                        <MenuItem value="MANAGED_IDENTITY">Managed Identity</MenuItem>
                        <MenuItem value="AZURE_CLI">Azure CLI</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Default Configuration */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Default Configuration
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Default Location</InputLabel>
                      <Select
                        value={config.defaultLocation}
                        onChange={(e) => setConfig(prev => ({ ...prev, defaultLocation: e.target.value }))}
                        label="Default Location"
                      >
                        {locations.map(location => (
                          <MenuItem key={location} value={location}>{location}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Resource Group Prefix"
                      value={config.defaultResourceGroupPrefix}
                      onChange={(e) => setConfig(prev => ({ ...prev, defaultResourceGroupPrefix: e.target.value }))}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Default VM Size</InputLabel>
                      <Select
                        value={config.defaultVMSize}
                        onChange={(e) => setConfig(prev => ({ ...prev, defaultVMSize: e.target.value }))}
                        label="Default VM Size"
                      >
                        {vmSizes.map(size => (
                          <MenuItem key={size} value={size}>{size}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Storage SKU</InputLabel>
                      <Select
                        value={config.defaultStorageSku}
                        onChange={(e) => setConfig(prev => ({ ...prev, defaultStorageSku: e.target.value }))}
                        label="Storage SKU"
                      >
                        {storageSkus.map(sku => (
                          <MenuItem key={sku} value={sku}>{sku}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Database SKU</InputLabel>
                      <Select
                        value={config.defaultDatabaseSku}
                        onChange={(e) => setConfig(prev => ({ ...prev, defaultDatabaseSku: e.target.value }))}
                        label="Database SKU"
                      >
                        {databaseSkus.map(sku => (
                          <MenuItem key={sku} value={sku}>{sku}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Security & Monitoring Settings */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
              Security & Monitoring Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Security Features</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableEncryption}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableEncryption: e.target.checked }))}
                    />
                  }
                  label="Enable Encryption"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableKeyVault}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableKeyVault: e.target.checked }))}
                    />
                  }
                  label="Enable Key Vault"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Monitoring & Cost</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableMonitoring}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableMonitoring: e.target.checked }))}
                    />
                  }
                  label="Enable Monitoring"
                />
                <TextField
                  fullWidth
                  label="Monthly Budget Limit (USD)"
                  type="number"
                  value={config.budgetLimit}
                  onChange={(e) => setConfig(prev => ({ ...prev, budgetLimit: e.target.value }))}
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Cloud />}
          >
            {loading ? 'Saving...' : 'Save Credentials'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleValidate}
            disabled={validating || !currentCredentials}
            startIcon={validating ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {validating ? 'Validating...' : 'Validate Credentials'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleTestConnectivity}
            disabled={!currentCredentials}
            startIcon={<NetworkCheck />}
          >
            Test Connectivity
          </Button>
        </Box>
      </Paper>

      {/* Test Results Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <NetworkCheck />
            Azure Connectivity Test Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {testResults ? (
            testResults.error ? (
              <Alert severity="error">
                <Typography variant="h6">Test Failed</Typography>
                <Typography>{testResults.error}</Typography>
              </Alert>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>Test Results</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(testResults).map(([service, result]) => (
                        <TableRow key={service}>
                          <TableCell>{service}</TableCell>
                          <TableCell>
                            <Chip
                              label={result.success ? 'Success' : 'Failed'}
                              color={result.success ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{result.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CCRPAzureCredentials; 