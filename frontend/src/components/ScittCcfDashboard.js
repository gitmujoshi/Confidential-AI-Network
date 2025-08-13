import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  SwapHoriz as SwapHorizIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

const ScittCcfDashboard = () => {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [migrationMode, setMigrationMode] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [newMigrationMode, setNewMigrationMode] = useState('HYBRID');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        healthData,
        metricsData,
        migrationModeData,
        migrationStatusData,
        configData
      ] = await Promise.all([
        apiService.getScittCcfHealth(),
        apiService.getScittCcfMetrics(),
        apiService.getScittCcfMigrationMode(),
        apiService.getScittCcfMigrationStatus(),
        apiService.getScittCcfConfig()
      ]);

      setHealth(healthData);
      setMetrics(metricsData);
      setMigrationMode(migrationModeData);
      setMigrationStatus(migrationStatusData);
      setConfig(configData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load SCITT CCF dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleConfigUpdate = async () => {
    try {
      await apiService.updateScittCcfConfig(config);
      setConfigDialogOpen(false);
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMigrationModeChange = async () => {
    try {
      await apiService.setScittCcfMigrationMode(newMigrationMode);
      setMigrationDialogOpen(false);
      loadDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success.main';
      case 'unhealthy':
        return 'error.main';
      default:
        return 'warning.main';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          SCITT CCF Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Health Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {getHealthIcon(health?.status)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  System Health
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Status: <Chip label={health?.status} color={health?.status === 'healthy' ? 'success' : 'error'} />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last Check: {health?.timestamp}
              </Typography>
              {health?.scittCcf && (
                <Typography variant="body2" color="text.secondary">
                  Response Time: {health.scittCcf.responseTime}ms
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Migration Mode
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Current Mode: <Chip label={migrationMode?.mode} color="primary" />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {migrationMode?.description}
              </Typography>
              <Button
                size="small"
                startIcon={<SwapHorizIcon />}
                onClick={() => setMigrationDialogOpen(true)}
                sx={{ mt: 1 }}
              >
                Change Mode
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Metrics and Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              {metrics && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Total Claims: {metrics.totalClaims}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Contracts: {metrics.activeContracts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time: {metrics.averageResponseTime}ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime: {metrics.uptime}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Migration Status
              </Typography>
              {migrationStatus && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Total Contracts: {migrationStatus.totalContracts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Migrated: {migrationStatus.migratedContracts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending: {migrationStatus.pendingContracts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Progress: {migrationStatus.migrationProgress.toFixed(1)}%
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Configuration
            </Typography>
            <Button
              size="small"
              startIcon={<SettingsIcon />}
              onClick={() => setConfigDialogOpen(true)}
            >
              Edit Config
            </Button>
          </Box>
          {config && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Node URL: {config.nodeUrl}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  TEE Provider: {config.teeProvider?.type}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Enabled: {config.enabled ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Platform: {config.teeProvider?.platform}
                </Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update SCITT CCF Configuration</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Node URL"
            value={config?.nodeUrl || ''}
            onChange={(e) => setConfig({ ...config, nodeUrl: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>TEE Provider</InputLabel>
            <Select
              value={config?.teeProvider?.type || 'virtual'}
              onChange={(e) => setConfig({
                ...config,
                teeProvider: { ...config.teeProvider, type: e.target.value }
              })}
            >
              <MenuItem value="virtual">Virtual</MenuItem>
              <MenuItem value="snp">AMD SEV-SNP</MenuItem>
              <MenuItem value="sgx">Intel SGX</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfigUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Migration Mode Dialog */}
      <Dialog open={migrationDialogOpen} onClose={() => setMigrationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Migration Mode</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Migration Mode</InputLabel>
            <Select
              value={newMigrationMode}
              onChange={(e) => setNewMigrationMode(e.target.value)}
            >
              <MenuItem value="ETHEREUM_ONLY">Ethereum Only</MenuItem>
              <MenuItem value="SCITT_CCF_ONLY">SCITT CCF Only</MenuItem>
              <MenuItem value="HYBRID">Hybrid</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {newMigrationMode === 'ETHEREUM_ONLY' && 'Use only traditional Ethereum blockchain'}
            {newMigrationMode === 'SCITT_CCF_ONLY' && 'Use only SCITT CCF Ledger'}
            {newMigrationMode === 'HYBRID' && 'Use both SCITT CCF and Ethereum'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMigrationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMigrationModeChange} variant="contained">Change Mode</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScittCcfDashboard;
