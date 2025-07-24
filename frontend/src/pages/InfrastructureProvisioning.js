import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Cloud,
  PlayArrow,
  Stop,
  Delete,
  Refresh,
  Settings,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Storage,
  Memory,
  NetworkCheck,
  Security,
  Speed,
  MonetizationOn,
  Timeline,
  Visibility,
  VisibilityOff,
  Build,
  Monitor,
  StorageOutlined,
  Computer,
  Router
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const InfrastructureProvisioning = () => {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logs, setLogs] = useState([]);

  // Provisioning form state
  const [provisionConfig, setProvisionConfig] = useState({
    environmentName: '',
    description: '',
    location: 'eastus',
    vmSize: 'Standard_D2s_v3',
    vmCount: 1,
    enableGPU: false,
    gpuType: 'V100',
    gpuCount: 1,
    enableDatabase: true,
    databaseSku: 'Basic',
    enableMonitoring: true,
    enableEncryption: true,
    budgetLimit: '',
    tags: {}
  });

  // Load environments
  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/ccrp/infrastructure/environments/${currentUser.id}`);
      if (response.data.success) {
        setEnvironments(response.data.environments);
      }
    } catch (error) {
      console.error('Failed to load environments:', error);
      setError('Failed to load infrastructure environments');
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async () => {
    try {
      setProvisioning(true);
      setError('');
      setSuccess('');

      const response = await apiService.post(`/api/ccrp/infrastructure/provision/${currentUser.id}`, {
        config: provisionConfig
      });

      if (response.data.success) {
        setSuccess('Infrastructure provisioning started successfully!');
        setProvisionDialogOpen(false);
        toast.success('Infrastructure provisioning started!');
        loadEnvironments(); // Refresh the list
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to start provisioning';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setProvisioning(false);
    }
  };

  const handleDestroy = async (environmentId) => {
    if (!window.confirm('Are you sure you want to destroy this environment? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.delete(`/api/ccrp/infrastructure/environments/${environmentId}`);
      
      if (response.data.success) {
        toast.success('Environment destroyed successfully!');
        loadEnvironments(); // Refresh the list
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to destroy environment';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (environment) => {
    setSelectedEnvironment(environment);
    setDetailsDialogOpen(true);
  };

  const handleViewLogs = async (environmentId) => {
    try {
      const response = await apiService.get(`/api/ccrp/infrastructure/environments/${environmentId}/logs`);
      if (response.data.success) {
        setLogs(response.data.logs);
        setLogsDialogOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROVISIONING': return 'warning';
      case 'RUNNING': return 'success';
      case 'STOPPED': return 'error';
      case 'DESTROYING': return 'error';
      case 'ERROR': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PROVISIONING': return <Build />;
      case 'RUNNING': return <CheckCircle />;
      case 'STOPPED': return <Stop />;
      case 'DESTROYING': return <Delete />;
      case 'ERROR': return <Error />;
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

  const gpuTypes = [
    'V100',
    'T4',
    'K80',
    'P100'
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
          Infrastructure Provisioning
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Provision and manage Azure infrastructure for training environments.
        </Typography>

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

        {/* Action Buttons */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => setProvisionDialogOpen(true)}
            startIcon={<PlayArrow />}
          >
            Provision New Environment
          </Button>
          
          <Button
            variant="outlined"
            onClick={loadEnvironments}
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
        </Box>

        {/* Environments List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Cloud sx={{ mr: 1, verticalAlign: 'middle' }} />
              Training Environments
            </Typography>
            
            {environments.length === 0 ? (
              <Alert severity="info">
                No training environments found. Click "Provision New Environment" to create one.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Environment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Resources</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {environments.map((env) => (
                      <TableRow key={env.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">{env.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {env.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(env.status)}
                            label={env.status}
                            color={getStatusColor(env.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{env.location}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {env.vmCount} VMs ({env.vmSize})
                            </Typography>
                            {env.gpuCount > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {env.gpuCount} {env.gpuType} GPUs
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            ${env.estimatedCost}/month
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(env.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(env)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="View Logs">
                              <IconButton
                                size="small"
                                onClick={() => handleViewLogs(env.id)}
                              >
                                <Timeline />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Destroy Environment">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDestroy(env.id)}
                                disabled={env.status === 'DESTROYING'}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Paper>

      {/* Provision Environment Dialog */}
      <Dialog open={provisionDialogOpen} onClose={() => setProvisionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Cloud />
            Provision New Training Environment
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Configuration */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Basic Configuration</Typography>
              
              <TextField
                fullWidth
                label="Environment Name"
                value={provisionConfig.environmentName}
                onChange={(e) => setProvisionConfig(prev => ({ ...prev, environmentName: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={provisionConfig.description}
                onChange={(e) => setProvisionConfig(prev => ({ ...prev, description: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Location</InputLabel>
                <Select
                  value={provisionConfig.location}
                  onChange={(e) => setProvisionConfig(prev => ({ ...prev, location: e.target.value }))}
                  label="Location"
                >
                  {locations.map(location => (
                    <MenuItem key={location} value={location}>{location}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Compute Configuration */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Compute Configuration</Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>VM Size</InputLabel>
                <Select
                  value={provisionConfig.vmSize}
                  onChange={(e) => setProvisionConfig(prev => ({ ...prev, vmSize: e.target.value }))}
                  label="VM Size"
                >
                  {vmSizes.map(size => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Number of VMs"
                type="number"
                value={provisionConfig.vmCount}
                onChange={(e) => setProvisionConfig(prev => ({ ...prev, vmCount: parseInt(e.target.value) }))}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, max: 10 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={provisionConfig.enableGPU}
                    onChange={(e) => setProvisionConfig(prev => ({ ...prev, enableGPU: e.target.checked }))}
                  />
                }
                label="Enable GPU"
                sx={{ mb: 2 }}
              />
              
              {provisionConfig.enableGPU && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>GPU Type</InputLabel>
                    <Select
                      value={provisionConfig.gpuType}
                      onChange={(e) => setProvisionConfig(prev => ({ ...prev, gpuType: e.target.value }))}
                      label="GPU Type"
                    >
                      {gpuTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Number of GPUs"
                    type="number"
                    value={provisionConfig.gpuCount}
                    onChange={(e) => setProvisionConfig(prev => ({ ...prev, gpuCount: parseInt(e.target.value) }))}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1, max: 8 }}
                  />
                </>
              )}
            </Grid>

            {/* Database Configuration */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Database Configuration</Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={provisionConfig.enableDatabase}
                    onChange={(e) => setProvisionConfig(prev => ({ ...prev, enableDatabase: e.target.checked }))}
                  />
                }
                label="Enable Database"
                sx={{ mb: 2 }}
              />
              
              {provisionConfig.enableDatabase && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Database SKU</InputLabel>
                  <Select
                    value={provisionConfig.databaseSku}
                    onChange={(e) => setProvisionConfig(prev => ({ ...prev, databaseSku: e.target.value }))}
                    label="Database SKU"
                  >
                    {databaseSkus.map(sku => (
                      <MenuItem key={sku} value={sku}>{sku}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            {/* Security & Monitoring */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Security & Monitoring</Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={provisionConfig.enableMonitoring}
                    onChange={(e) => setProvisionConfig(prev => ({ ...prev, enableMonitoring: e.target.checked }))}
                  />
                }
                label="Enable Monitoring"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={provisionConfig.enableEncryption}
                    onChange={(e) => setProvisionConfig(prev => ({ ...prev, enableEncryption: e.target.checked }))}
                  />
                }
                label="Enable Encryption"
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Monthly Budget Limit (USD)"
                type="number"
                value={provisionConfig.budgetLimit}
                onChange={(e) => setProvisionConfig(prev => ({ ...prev, budgetLimit: e.target.value }))}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProvisionDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProvision}
            disabled={provisioning || !provisionConfig.environmentName}
            startIcon={provisioning ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {provisioning ? 'Provisioning...' : 'Provision Environment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Environment Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Settings />
            Environment Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEnvironment && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Cloud /></ListItemIcon>
                    <ListItemText 
                      primary="Name" 
                      secondary={selectedEnvironment.name} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Info /></ListItemIcon>
                    <ListItemText 
                      primary="Description" 
                      secondary={selectedEnvironment.description} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Speed /></ListItemIcon>
                    <ListItemText 
                      primary="Status" 
                      secondary={
                        <Chip
                          icon={getStatusIcon(selectedEnvironment.status)}
                          label={selectedEnvironment.status}
                          color={getStatusColor(selectedEnvironment.status)}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Storage /></ListItemIcon>
                    <ListItemText 
                      primary="Location" 
                      secondary={selectedEnvironment.location} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Resources</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Computer /></ListItemIcon>
                    <ListItemText 
                      primary="Virtual Machines" 
                      secondary={`${selectedEnvironment.vmCount} x ${selectedEnvironment.vmSize}`} 
                    />
                  </ListItem>
                  {selectedEnvironment.gpuCount > 0 && (
                    <ListItem>
                      <ListItemIcon><Memory /></ListItemIcon>
                      <ListItemText 
                        primary="GPUs" 
                        secondary={`${selectedEnvironment.gpuCount} x ${selectedEnvironment.gpuType}`} 
                      />
                    </ListItem>
                  )}
                  {selectedEnvironment.enableDatabase && (
                    <ListItem>
                      <ListItemIcon><StorageOutlined /></ListItemIcon>
                      <ListItemText 
                        primary="Database" 
                        secondary={`SQL Database (${selectedEnvironment.databaseSku})`} 
                      />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemIcon><MonetizationOn /></ListItemIcon>
                    <ListItemText 
                      primary="Estimated Cost" 
                      secondary={`$${selectedEnvironment.estimatedCost}/month`} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Network & Security</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Router /></ListItemIcon>
                    <ListItemText 
                      primary="Virtual Network" 
                      secondary={selectedEnvironment.vnetName || 'Not configured'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Security /></ListItemIcon>
                    <ListItemText 
                      primary="Encryption" 
                      secondary={selectedEnvironment.enableEncryption ? 'Enabled' : 'Disabled'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Monitor /></ListItemIcon>
                    <ListItemText 
                      primary="Monitoring" 
                      secondary={selectedEnvironment.enableMonitoring ? 'Enabled' : 'Disabled'} 
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onClose={() => setLogsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Timeline />
            Environment Logs
          </Box>
        </DialogTitle>
        <DialogContent>
          {logs.length === 0 ? (
            <Alert severity="info">No logs available for this environment.</Alert>
          ) : (
            <List>
              {logs.map((log, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {log.level === 'ERROR' ? <Error color="error" /> :
                     log.level === 'WARNING' ? <Warning color="warning" /> :
                     log.level === 'SUCCESS' ? <CheckCircle color="success" /> :
                     <Info />}
                  </ListItemIcon>
                  <ListItemText
                    primary={log.message}
                    secondary={new Date(log.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InfrastructureProvisioning; 