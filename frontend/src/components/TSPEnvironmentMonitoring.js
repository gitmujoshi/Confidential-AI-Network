import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Refresh,
  PlayArrow,
  Stop,
  Settings,
  Memory,
  Storage,
  NetworkCheck,
  Security,
  Verified,
  Speed,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Visibility,
  Edit,
  Delete,
  Add,
  CloudQueue,
  Timeline,
  Assessment
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { apiService } from '../services/api';
import { useUser } from '../contexts/UserContext';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const TSPEnvironmentMonitoring = () => {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [monitoringDialogOpen, setMonitoringDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch environments data
  const { data: environmentsData, isLoading: environmentsLoading, refetch: refetchEnvironments } = useQuery(
    ['tspEnvironments', currentUser?.id],
    async () => {
      const response = await apiService.get(`/api/tsp/infrastructure/environments/${currentUser.id}`);
      return response.data;
    },
    {
      enabled: !!currentUser?.id,
      refetchInterval: autoRefresh ? refreshInterval : false,
      staleTime: 10000
    }
  );

  // Fetch real-time metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery(
    ['environmentMetrics', selectedEnvironment?.id],
    async () => {
      if (!selectedEnvironment) return null;
      const response = await apiService.get(`/api/infrastructure/environments/${selectedEnvironment.id}/metrics`);
      return response.data;
    },
    {
      enabled: !!selectedEnvironment,
      refetchInterval: autoRefresh ? 10000 : false, // More frequent for metrics
      staleTime: 5000
    }
  );

  // Environment action mutations
  const environmentActionMutation = useMutation(
    async ({ environmentId, action, params = {} }) => {
      const response = await apiService.post(
        `/api/infrastructure/environments/${environmentId}/actions/${action}`,
        params
      );
      return response.data;
    },
    {
      onSuccess: (data, variables) => {
        toast.success(`Environment ${variables.action} completed successfully`);
        queryClient.invalidateQueries('tspEnvironments');
        setActionDialogOpen(false);
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.message || `Environment action failed`;
        toast.error(errorMsg);
      }
    }
  );

  const environments = environmentsData?.environments || [];

  // Calculate aggregate metrics
  const aggregateMetrics = environments.reduce((acc, env) => {
    acc.total += 1;
    if (env.status === 'ACTIVE') acc.active += 1;
    if (env.status === 'PROVISIONING') acc.provisioning += 1;
    if (env.status === 'ERROR') acc.error += 1;
    acc.totalCPU += env.resources?.cpuCores || 0;
    acc.totalMemory += env.resources?.memoryGB || 0;
    acc.totalStorage += env.resources?.storageGB || 0;
    return acc;
  }, { total: 0, active: 0, provisioning: 0, error: 0, totalCPU: 0, totalMemory: 0, totalStorage: 0 });

  // Chart configurations
  const resourceUsageChartData = {
    labels: environments.map(env => env.name.substring(0, 10)),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: environments.map(env => env.monitoring?.cpuUsage || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Memory Usage (%)',
        data: environments.map(env => env.monitoring?.memoryUsage || 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };

  const statusDistributionData = {
    labels: ['Active', 'Provisioning', 'Error', 'Stopped'],
    datasets: [{
      data: [
        aggregateMetrics.active,
        aggregateMetrics.provisioning,
        aggregateMetrics.error,
        aggregateMetrics.total - aggregateMetrics.active - aggregateMetrics.provisioning - aggregateMetrics.error
      ],
      backgroundColor: [
        '#4caf50',
        '#ff9800',
        '#f44336',
        '#9e9e9e'
      ]
    }]
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle color="success" />;
      case 'PROVISIONING': return <CircularProgress size={20} />;
      case 'ERROR': return <ErrorIcon color="error" />;
      case 'STOPPED': return <Stop color="disabled" />;
      default: return <Warning color="warning" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PROVISIONING': return 'warning';
      case 'ERROR': return 'error';
      case 'STOPPED': return 'default';
      default: return 'info';
    }
  };

  const handleEnvironmentAction = (environment, action) => {
    setSelectedEnvironment(environment);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const executeEnvironmentAction = () => {
    if (!selectedEnvironment || !actionType) return;

    environmentActionMutation.mutate({
      environmentId: selectedEnvironment.id,
      action: actionType
    });
  };

  const openEnvironmentMonitoring = (environment) => {
    setSelectedEnvironment(environment);
    setMonitoringDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Environment Monitoring & Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Refresh</InputLabel>
            <Select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              label="Refresh"
            >
              <MenuItem value={10000}>10s</MenuItem>
              <MenuItem value={30000}>30s</MenuItem>
              <MenuItem value={60000}>1m</MenuItem>
              <MenuItem value={300000}>5m</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetchEnvironments()}
            disabled={environmentsLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {aggregateMetrics.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Environments
                  </Typography>
                </Box>
                <CloudQueue sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {aggregateMetrics.active}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Environments
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4">
                    {aggregateMetrics.totalCPU}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total CPU Cores
                  </Typography>
                </Box>
                <Memory sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4">
                    {aggregateMetrics.totalMemory}GB
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Memory
                  </Typography>
                </Box>
                <Storage sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Usage Overview
              </Typography>
              {environments.length > 0 ? (
                <Line 
                  data={resourceUsageChartData}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              ) : (
                <Alert severity="info">No environment data available for charts</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Environment Status Distribution
              </Typography>
              {environments.length > 0 ? (
                <Doughnut 
                  data={statusDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false
                  }}
                  height={250}
                />
              ) : (
                <Alert severity="info">No environment data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Environments Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Environment Details
          </Typography>
          {environmentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : environments.length === 0 ? (
            <Alert severity="info">
              No environments found. Create your first environment to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Resources</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Security</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {environments.map((environment) => (
                    <TableRow key={environment.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {environment.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {environment.provider} • {environment.region}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(environment.status)}
                          label={environment.status}
                          color={getStatusColor(environment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={environment.type}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" display="block">
                            CPU: {environment.resources?.cpuCores || 0} cores
                          </Typography>
                          <Typography variant="caption" display="block">
                            Memory: {environment.resources?.memoryGB || 0}GB
                          </Typography>
                          <Typography variant="caption" display="block">
                            Storage: {environment.resources?.storageGB || 0}GB
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">CPU</Typography>
                            <Typography variant="caption">
                              {environment.monitoring?.cpuUsage || 0}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={environment.monitoring?.cpuUsage || 0}
                            sx={{ mb: 1 }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">Memory</Typography>
                            <Typography variant="caption">
                              {environment.monitoring?.memoryUsage || 0}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={environment.monitoring?.memoryUsage || 0}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {environment.security?.teeEnabled && (
                            <Tooltip title="TEE Enabled">
                              <Security color="success" fontSize="small" />
                            </Tooltip>
                          )}
                          {environment.security?.attestationVerified && (
                            <Tooltip title="Attestation Verified">
                              <Verified color="primary" fontSize="small" />
                            </Tooltip>
                          )}
                          {environment.security?.networkIsolated && (
                            <Tooltip title="Network Isolated">
                              <NetworkCheck color="info" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Monitoring">
                            <IconButton
                              size="small"
                              onClick={() => openEnvironmentMonitoring(environment)}
                            >
                              <Assessment />
                            </IconButton>
                          </Tooltip>
                          
                          {environment.status === 'ACTIVE' && (
                            <Tooltip title="Stop Environment">
                              <IconButton
                                size="small"
                                onClick={() => handleEnvironmentAction(environment, 'stop')}
                                color="error"
                              >
                                <Stop />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {environment.status === 'STOPPED' && (
                            <Tooltip title="Start Environment">
                              <IconButton
                                size="small"
                                onClick={() => handleEnvironmentAction(environment, 'start')}
                                color="success"
                              >
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Settings">
                            <IconButton
                              size="small"
                              onClick={() => handleEnvironmentAction(environment, 'configure')}
                            >
                              <Settings />
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

      {/* Environment Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Environment Action
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionType} the environment "{selectedEnvironment?.name}"?
          </Typography>
          {actionType === 'stop' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Stopping the environment will terminate all running training jobs.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={executeEnvironmentAction}
            variant="contained"
            disabled={environmentActionMutation.isLoading}
            startIcon={environmentActionMutation.isLoading ? <CircularProgress size={20} /> : null}
          >
            {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Environment Monitoring Dialog */}
      <Dialog
        open={monitoringDialogOpen}
        onClose={() => setMonitoringDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Environment Monitoring: {selectedEnvironment?.name}
        </DialogTitle>
        <DialogContent>
          {metricsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Resource Metrics
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">CPU Usage</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={metricsData?.cpuUsage || 0}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">
                        {metricsData?.cpuUsage || 0}% of {selectedEnvironment?.resources?.cpuCores || 0} cores
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">Memory Usage</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={metricsData?.memoryUsage || 0}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">
                        {metricsData?.memoryUsage || 0}% of {selectedEnvironment?.resources?.memoryGB || 0}GB
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Security Status
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Security color={selectedEnvironment?.security?.teeEnabled ? 'success' : 'disabled'} />
                        <Typography variant="body2">
                          TEE: {selectedEnvironment?.security?.teeEnabled ? 'Enabled' : 'Disabled'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Verified color={selectedEnvironment?.security?.attestationVerified ? 'success' : 'disabled'} />
                        <Typography variant="body2">
                          Attestation: {selectedEnvironment?.security?.attestationVerified ? 'Verified' : 'Pending'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NetworkCheck color={selectedEnvironment?.security?.networkIsolated ? 'success' : 'disabled'} />
                        <Typography variant="body2">
                          Network: {selectedEnvironment?.security?.networkIsolated ? 'Isolated' : 'Standard'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMonitoringDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TSPEnvironmentMonitoring;
