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
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
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
  Build,
  Monitor,
  StorageOutlined,
  Computer,
  Router,
  Code,
  DataUsage,
  Assessment,
  Description,
  Terminal,
  CloudDownload,
  CloudUpload
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const TrainingEnvironment = () => {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trainingJobs, setTrainingJobs] = useState([]);
  const [containers, setContainers] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  // Deployment form state
  const [deployConfig, setDeployConfig] = useState({
    jobName: '',
    description: '',
    containerImage: 'mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest',
    environmentId: '',
    datasetIds: [],
    modelIds: [],
    command: 'python train.py',
    cpuCores: 2,
    memoryGB: 4,
    gpuCount: 0,
    gpuType: 'V100',
    environmentVariables: {},
    dataMounts: [],
    outputMounts: [],
    timeoutHours: 24,
    priority: 'normal'
  });

  const [environments, setEnvironments] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load training jobs
      const jobsResponse = await apiService.get(`/api/tsp/training/jobs/${currentUser.id}`);
      if (jobsResponse.data.success) {
        setTrainingJobs(jobsResponse.data.jobs);
      }
      
      // Load containers
      const containersResponse = await apiService.get(`/api/tsp/training/containers/${currentUser.id}`);
      if (containersResponse.data.success) {
        setContainers(containersResponse.data.containers);
      }
      
      // Load environments
      const environmentsResponse = await apiService.get(`/api/tsp/infrastructure/environments/${currentUser.id}`);
      if (environmentsResponse.data.success) {
        setEnvironments(environmentsResponse.data.environments.filter(env => env.status === 'RUNNING'));
      }
      
      // Load datasets
      const datasetsResponse = await apiService.getDatasets({}, currentUser);
      if (datasetsResponse.datasets) {
        setDatasets(datasetsResponse.datasets);
      }
      
      // Load models
      const modelsResponse = await apiService.get('/api/ai-models');
      const modelRows = modelsResponse.data?.models ?? modelsResponse.data;
      if (Array.isArray(modelRows)) {
        setModels(modelRows);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load training environment data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    try {
      setDeploying(true);
      setError('');
      setSuccess('');

      const response = await apiService.post(`/api/tsp/training/deploy/${currentUser.id}`, {
        config: deployConfig
      });

      if (response.data.success) {
        setSuccess('Training job deployment started successfully!');
        setDeployDialogOpen(false);
        toast.success('Training job deployment started!');
        loadData(); // Refresh the list
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to start deployment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDeploying(false);
    }
  };

  const handleStopJob = async (jobId) => {
    try {
      const response = await apiService.post(`/api/tsp/training/jobs/${jobId}/stop`);
      if (response.data.success) {
        toast.success('Training job stopped successfully!');
        loadData(); // Refresh the list
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to stop job';
      toast.error(errorMsg);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this training job? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.delete(`/api/tsp/training/jobs/${jobId}`);
      if (response.data.success) {
        toast.success('Training job deleted successfully!');
        loadData(); // Refresh the list
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete job';
      toast.error(errorMsg);
    }
  };

  const handleViewDetails = async (job) => {
    setSelectedJob(job);
    setDetailsDialogOpen(true);
  };

  const handleViewLogs = async (jobId) => {
    try {
      const response = await apiService.get(`/api/tsp/training/jobs/${jobId}/logs`);
      if (response.data.success) {
        setLogs(response.data.logs);
        setLogsDialogOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    }
  };

  const getJobStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'success';
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'STOPPED': return 'error';
      default: return 'default';
    }
  };

  const getJobStatusIcon = (status) => {
    switch (status) {
      case 'RUNNING': return <PlayArrow />;
      case 'PENDING': return <Build />;
      case 'COMPLETED': return <CheckCircle />;
      case 'FAILED': return <Error />;
      case 'STOPPED': return <Stop />;
      default: return <Info />;
    }
  };

  const getContainerStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'success';
      case 'STARTING': return 'warning';
      case 'STOPPED': return 'error';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  const getContainerStatusIcon = (status) => {
    switch (status) {
      case 'RUNNING': return <PlayArrow />;
      case 'STARTING': return <Build />;
      case 'STOPPED': return <Stop />;
      case 'FAILED': return <Error />;
      default: return <Info />;
    }
  };

  const gpuTypes = [
    'V100',
    'T4',
    'K80',
    'P100'
  ];

  const priorities = [
    'low',
    'normal',
    'high'
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
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Training Environment Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Deploy, monitor, and manage training containers and jobs on Azure infrastructure.
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
            onClick={() => setDeployDialogOpen(true)}
            startIcon={<PlayArrow />}
            disabled={environments.length === 0}
          >
            Deploy Training Job
          </Button>
          
          <Button
            variant="outlined"
            onClick={loadData}
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
        </Box>

        {environments.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            No running infrastructure environments found. Please provision an environment first.
          </Alert>
        )}

        {/* Tabs for Jobs and Containers */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Training Jobs" />
            <Tab label="Containers" />
          </Tabs>
        </Box>

        {/* Training Jobs Tab */}
        {activeTab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
                Training Jobs
              </Typography>
              
              {trainingJobs.length === 0 ? (
                <Alert severity="info">
                  No training jobs found. Click "Deploy Training Job" to create one.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Job Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Environment</TableCell>
                        <TableCell>Resources</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trainingJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">{job.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {job.description}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getJobStatusIcon(job.status)}
                              label={job.status}
                              color={getJobStatusColor(job.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{job.environmentName}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {job.cpuCores} CPU, {job.memoryGB}GB RAM
                              </Typography>
                              {job.gpuCount > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  {job.gpuCount} {job.gpuType} GPUs
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={job.progress || 0} 
                                  sx={{ height: 8, borderRadius: 5 }}
                                />
                              </Box>
                              <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {job.progress || 0}%
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {job.duration ? `${Math.floor(job.duration / 3600)}h ${Math.floor((job.duration % 3600) / 60)}m` : '-'}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(job)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              
                                            <Tooltip title="View Logs">
                <IconButton
                  size="small"
                  onClick={() => handleViewLogs(job.id)}
                >
                  <Description />
                </IconButton>
              </Tooltip>
                              
                              {job.status === 'RUNNING' && (
                                <Tooltip title="Stop Job">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleStopJob(job.id)}
                                  >
                                    <Stop />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title="Delete Job">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteJob(job.id)}
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
        )}

        {/* Containers Tab */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Computer sx={{ mr: 1, verticalAlign: 'middle' }} />
                Containers
              </Typography>
              
              {containers.length === 0 ? (
                <Alert severity="info">
                  No containers found. Containers will appear here when training jobs are deployed.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Container Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Image</TableCell>
                        <TableCell>Resources</TableCell>
                        <TableCell>IP Address</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {containers.map((container) => (
                        <TableRow key={container.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2">{container.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {container.jobName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getContainerStatusIcon(container.status)}
                              label={container.status}
                              color={getContainerStatusColor(container.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {container.image}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {container.cpuCores} CPU, {container.memoryGB}GB RAM
                              </Typography>
                              {container.gpuCount > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  {container.gpuCount} {container.gpuType} GPUs
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {container.ipAddress || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(container.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(container)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="View Logs">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewLogs(container.id)}
                                >
                                  <Description />
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
        )}
      </Paper>

      {/* Deploy Training Job Dialog */}
      <Dialog open={deployDialogOpen} onClose={() => setDeployDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Code />
            Deploy Training Job
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Configuration */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Basic Configuration</Typography>
              
              <TextField
                fullWidth
                label="Job Name"
                value={deployConfig.jobName}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, jobName: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={deployConfig.description}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, description: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={deployConfig.environmentId}
                  onChange={(e) => setDeployConfig(prev => ({ ...prev, environmentId: e.target.value }))}
                  label="Environment"
                  required
                >
                  {environments.map(env => (
                    <MenuItem key={env.id} value={env.id}>{env.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Container Image"
                value={deployConfig.containerImage}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, containerImage: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="Command"
                value={deployConfig.command}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, command: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />
            </Grid>

            {/* Resource Configuration */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Resource Configuration</Typography>
              
              <TextField
                fullWidth
                label="CPU Cores"
                type="number"
                value={deployConfig.cpuCores}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, cpuCores: parseInt(e.target.value) }))}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, max: 32 }}
              />
              
              <TextField
                fullWidth
                label="Memory (GB)"
                type="number"
                value={deployConfig.memoryGB}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, memoryGB: parseInt(e.target.value) }))}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, max: 256 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={deployConfig.gpuCount > 0}
                    onChange={(e) => setDeployConfig(prev => ({ 
                      ...prev, 
                      gpuCount: e.target.checked ? 1 : 0 
                    }))}
                  />
                }
                label="Enable GPU"
                sx={{ mb: 2 }}
              />
              
              {deployConfig.gpuCount > 0 && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>GPU Type</InputLabel>
                    <Select
                      value={deployConfig.gpuType}
                      onChange={(e) => setDeployConfig(prev => ({ ...prev, gpuType: e.target.value }))}
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
                    value={deployConfig.gpuCount}
                    onChange={(e) => setDeployConfig(prev => ({ ...prev, gpuCount: parseInt(e.target.value) }))}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1, max: 8 }}
                  />
                </>
              )}
            </Grid>

            {/* Data Configuration */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Data Configuration</Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Datasets</InputLabel>
                <Select
                  multiple
                  value={deployConfig.datasetIds}
                  onChange={(e) => setDeployConfig(prev => ({ ...prev, datasetIds: e.target.value }))}
                  label="Datasets"
                >
                  {datasets.map(dataset => (
                    <MenuItem key={dataset.id} value={dataset.id}>{dataset.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Models</InputLabel>
                <Select
                  multiple
                  value={deployConfig.modelIds}
                  onChange={(e) => setDeployConfig(prev => ({ ...prev, modelIds: e.target.value }))}
                  label="Models"
                >
                  {models.map(model => (
                    <MenuItem key={model.id} value={model.id}>{model.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Advanced Configuration */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Advanced Configuration</Typography>
              
              <TextField
                fullWidth
                label="Timeout (hours)"
                type="number"
                value={deployConfig.timeoutHours}
                onChange={(e) => setDeployConfig(prev => ({ ...prev, timeoutHours: parseInt(e.target.value) }))}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, max: 168 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={deployConfig.priority}
                  onChange={(e) => setDeployConfig(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  {priorities.map(priority => (
                    <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDeploy}
            disabled={deploying || !deployConfig.jobName || !deployConfig.environmentId}
            startIcon={deploying ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {deploying ? 'Deploying...' : 'Deploy Job'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Job/Container Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Settings />
            {selectedJob?.type === 'container' ? 'Container Details' : 'Job Details'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Code /></ListItemIcon>
                    <ListItemText 
                      primary="Name" 
                      secondary={selectedJob.name} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Info /></ListItemIcon>
                    <ListItemText 
                      primary="Description" 
                      secondary={selectedJob.description} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Speed /></ListItemIcon>
                    <ListItemText 
                      primary="Status" 
                      secondary={
                        <Chip
                          icon={selectedJob.type === 'container' ? getContainerStatusIcon(selectedJob.status) : getJobStatusIcon(selectedJob.status)}
                          label={selectedJob.status}
                          color={selectedJob.type === 'container' ? getContainerStatusColor(selectedJob.status) : getJobStatusColor(selectedJob.status)}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Computer /></ListItemIcon>
                    <ListItemText 
                      primary="Environment" 
                      secondary={selectedJob.environmentName} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Resources</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Memory /></ListItemIcon>
                    <ListItemText 
                      primary="CPU & Memory" 
                      secondary={`${selectedJob.cpuCores} CPU cores, ${selectedJob.memoryGB}GB RAM`} 
                    />
                  </ListItem>
                  {selectedJob.gpuCount > 0 && (
                    <ListItem>
                      <ListItemIcon><Memory /></ListItemIcon>
                      <ListItemText 
                        primary="GPUs" 
                        secondary={`${selectedJob.gpuCount} x ${selectedJob.gpuType}`} 
                      />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemIcon><Storage /></ListItemIcon>
                    <ListItemText 
                      primary="Container Image" 
                      secondary={selectedJob.containerImage} 
                    />
                  </ListItem>
                  {selectedJob.ipAddress && (
                    <ListItem>
                      <ListItemIcon><NetworkCheck /></ListItemIcon>
                      <ListItemText 
                        primary="IP Address" 
                        secondary={selectedJob.ipAddress} 
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
              
              {selectedJob.type === 'job' && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Training Progress</Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><Assessment /></ListItemIcon>
                      <ListItemText 
                        primary="Progress" 
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={selectedJob.progress || 0} 
                                sx={{ height: 8, borderRadius: 5 }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {selectedJob.progress || 0}%
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Timeline /></ListItemIcon>
                      <ListItemText 
                        primary="Duration" 
                        secondary={selectedJob.duration ? `${Math.floor(selectedJob.duration / 3600)}h ${Math.floor((selectedJob.duration % 3600) / 60)}m` : '-'} 
                      />
                    </ListItem>
                  </List>
                </Grid>
              )}
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
            <Description />
            Training Logs
          </Box>
        </DialogTitle>
        <DialogContent>
          {logs.length === 0 ? (
            <Alert severity="info">No logs available for this job/container.</Alert>
          ) : (
            <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', maxHeight: 400, overflow: 'auto' }}>
              {logs.map((log, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: log.level === 'ERROR' ? 'error.main' : 
                           log.level === 'WARNING' ? 'warning.main' : 
                           'text.primary' 
                  }}>
                    {log.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TrainingEnvironment; 