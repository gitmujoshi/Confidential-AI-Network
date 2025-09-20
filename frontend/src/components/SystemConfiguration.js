/**
 * System Configuration Component
 * 
 * Centralized configuration management for system-wide settings,
 * environment parameters, and user preferences.
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField, Button, Switch,
  FormControlLabel, Select, MenuItem, FormControl, InputLabel, Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails, Alert, Divider, Chip,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Slider
} from '@mui/material';
import {
  Settings as SettingsIcon, Security as SecurityIcon, Cloud as CloudIcon,
  ExpandMore as ExpandMoreIcon, Edit as EditIcon, Save as SaveIcon,
  Refresh as RefreshIcon, Warning as WarningIcon, CheckCircle as CheckIcon,
  Storage as StorageIcon, Network as NetworkIcon, MonitorHeart as MonitorIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import { useUser } from '../contexts/UserContext';
import toast from 'react-hot-toast';

const SystemConfiguration = () => {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [editingSection, setEditingSection] = useState(null);
  
  // Configuration state
  const [config, setConfig] = useState({
    system: {
      environment: 'development',
      logLevel: 'info',
      debugMode: false,
      maintenanceMode: false,
      maxConcurrentJobs: 10,
      sessionTimeout: 30,
      autoBackup: true,
      backupInterval: 24
    },
    security: {
      twoFactorRequired: false,
      passwordMinLength: 8,
      sessionSecurityLevel: 'standard',
      encryptionAtRest: true,
      auditLogging: true,
      tokenExpiration: 15,
      maxLoginAttempts: 5,
      ipWhitelisting: false
    },
    cloud: {
      defaultProvider: 'AWS',
      autoScaling: true,
      costOptimization: true,
      multiRegionDeployment: false,
      loadBalancing: true,
      cdnEnabled: true,
      storageEncryption: true,
      networkIsolation: true
    },
    tee: {
      defaultAttestationLevel: 'hardware',
      requireAttestation: true,
      crossCloudVerification: false,
      teeProviders: ['AWS', 'Azure', 'GCP'],
      attestationTimeout: 30,
      keyRotationInterval: 30,
      memoryEncryption: true,
      networkEncryption: true
    },
    marketplace: {
      featuredLimit: 10,
      searchResultsLimit: 20,
      autoApproveBookings: false,
      priceUpdateInterval: 60,
      demandBasedPricing: false,
      qualityScore: true,
      providerVerification: true,
      userRatings: true
    },
    monitoring: {
      realTimeMetrics: true,
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        networkLatency: 100
      },
      retentionPeriod: 30,
      notificationChannels: ['email', 'dashboard'],
      healthCheckInterval: 5,
      performanceAnalytics: true
    }
  });

  // Fetch current configuration
  const { data: currentConfig, isLoading } = useQuery(
    'system-configuration',
    async () => {
      try {
        const response = await apiService.get('/api/system/configuration');
        return response.data.data;
      } catch (error) {
        // Return default config if API not available
        return config;
      }
    },
    {
      onSuccess: (data) => {
        if (data) {
          setConfig(data);
        }
      }
    }
  );

  // Save configuration mutation
  const saveConfigMutation = useMutation(
    async (configData) => {
      const response = await apiService.put('/api/system/configuration', configData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Configuration saved successfully');
        queryClient.invalidateQueries('system-configuration');
        setEditingSection(null);
      },
      onError: (error) => {
        toast.error(`Failed to save configuration: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleConfigChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleNestedConfigChange = (section, parentKey, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentKey]: {
          ...prev[section][parentKey],
          [key]: value
        }
      }
    }));
  };

  const handleSaveSection = (section) => {
    saveConfigMutation.mutate({
      section,
      configuration: config[section]
    });
  };

  const getConfigurationStatus = () => {
    const criticalIssues = [];
    const warnings = [];

    // Check security settings
    if (!config.security.twoFactorRequired) {
      warnings.push('Two-factor authentication is disabled');
    }
    if (config.security.passwordMinLength < 8) {
      criticalIssues.push('Password minimum length is too low');
    }

    // Check TEE settings
    if (!config.tee.requireAttestation) {
      criticalIssues.push('TEE attestation is disabled');
    }

    // Check monitoring
    if (!config.monitoring.realTimeMetrics) {
      warnings.push('Real-time monitoring is disabled');
    }

    return { criticalIssues, warnings };
  };

  const status = getConfigurationStatus();

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const ConfigurationSection = ({ title, section, icon, children, criticalSettings = [] }) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
            {criticalSettings.some(setting => !config[section]?.[setting]) && (
              <Chip icon={<WarningIcon />} label="Attention Required" color="warning" size="small" />
            )}
          </Box>
          <Box>
            <IconButton 
              onClick={() => setEditingSection(editingSection === section ? null : section)}
              color={editingSection === section ? 'primary' : 'default'}
            >
              <EditIcon />
            </IconButton>
            {editingSection === section && (
              <IconButton 
                onClick={() => handleSaveSection(section)}
                color="primary"
                disabled={saveConfigMutation.isLoading}
              >
                <SaveIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );

  const SystemSettings = () => (
    <ConfigurationSection 
      title="System Settings" 
      section="system" 
      icon={<SettingsIcon />}
      criticalSettings={['maintenanceMode']}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Environment</InputLabel>
            <Select
              value={config.system.environment}
              label="Environment"
              onChange={(e) => handleConfigChange('system', 'environment', e.target.value)}
              disabled={editingSection !== 'system'}
            >
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="production">Production</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Log Level</InputLabel>
            <Select
              value={config.system.logLevel}
              label="Log Level"
              onChange={(e) => handleConfigChange('system', 'logLevel', e.target.value)}
              disabled={editingSection !== 'system'}
            >
              <MenuItem value="debug">Debug</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="warn">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Max Concurrent Jobs"
            type="number"
            value={config.system.maxConcurrentJobs}
            onChange={(e) => handleConfigChange('system', 'maxConcurrentJobs', parseInt(e.target.value))}
            disabled={editingSection !== 'system'}
            inputProps={{ min: 1, max: 100 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Session Timeout (minutes)"
            type="number"
            value={config.system.sessionTimeout}
            onChange={(e) => handleConfigChange('system', 'sessionTimeout', parseInt(e.target.value))}
            disabled={editingSection !== 'system'}
            inputProps={{ min: 5, max: 120 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.system.debugMode}
                  onChange={(e) => handleConfigChange('system', 'debugMode', e.target.checked)}
                  disabled={editingSection !== 'system'}
                />
              }
              label="Debug Mode"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.system.maintenanceMode}
                  onChange={(e) => handleConfigChange('system', 'maintenanceMode', e.target.checked)}
                  disabled={editingSection !== 'system'}
                />
              }
              label="Maintenance Mode"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.system.autoBackup}
                  onChange={(e) => handleConfigChange('system', 'autoBackup', e.target.checked)}
                  disabled={editingSection !== 'system'}
                />
              }
              label="Auto Backup"
            />
          </Box>
        </Grid>
      </Grid>
    </ConfigurationSection>
  );

  const SecuritySettings = () => (
    <ConfigurationSection 
      title="Security Configuration" 
      section="security" 
      icon={<SecurityIcon />}
      criticalSettings={['encryptionAtRest', 'auditLogging']}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Password Min Length"
            type="number"
            value={config.security.passwordMinLength}
            onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
            disabled={editingSection !== 'security'}
            inputProps={{ min: 6, max: 20 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Token Expiration (minutes)"
            type="number"
            value={config.security.tokenExpiration}
            onChange={(e) => handleConfigChange('security', 'tokenExpiration', parseInt(e.target.value))}
            disabled={editingSection !== 'security'}
            inputProps={{ min: 5, max: 60 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Session Security Level</InputLabel>
            <Select
              value={config.security.sessionSecurityLevel}
              label="Session Security Level"
              onChange={(e) => handleConfigChange('security', 'sessionSecurityLevel', e.target.value)}
              disabled={editingSection !== 'security'}
            >
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="maximum">Maximum</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Max Login Attempts"
            type="number"
            value={config.security.maxLoginAttempts}
            onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
            disabled={editingSection !== 'security'}
            inputProps={{ min: 3, max: 10 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.twoFactorRequired}
                  onChange={(e) => handleConfigChange('security', 'twoFactorRequired', e.target.checked)}
                  disabled={editingSection !== 'security'}
                />
              }
              label="Require Two-Factor Authentication"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.encryptionAtRest}
                  onChange={(e) => handleConfigChange('security', 'encryptionAtRest', e.target.checked)}
                  disabled={editingSection !== 'security'}
                />
              }
              label="Encryption at Rest"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.auditLogging}
                  onChange={(e) => handleConfigChange('security', 'auditLogging', e.target.checked)}
                  disabled={editingSection !== 'security'}
                />
              }
              label="Audit Logging"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.security.ipWhitelisting}
                  onChange={(e) => handleConfigChange('security', 'ipWhitelisting', e.target.checked)}
                  disabled={editingSection !== 'security'}
                />
              }
              label="IP Whitelisting"
            />
          </Box>
        </Grid>
      </Grid>
    </ConfigurationSection>
  );

  const TEESettings = () => (
    <ConfigurationSection 
      title="TEE Configuration" 
      section="tee" 
      icon={<SecurityIcon />}
      criticalSettings={['requireAttestation', 'memoryEncryption']}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Default Attestation Level</InputLabel>
            <Select
              value={config.tee.defaultAttestationLevel}
              label="Default Attestation Level"
              onChange={(e) => handleConfigChange('tee', 'defaultAttestationLevel', e.target.value)}
              disabled={editingSection !== 'tee'}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="software">Software</MenuItem>
              <MenuItem value="hardware">Hardware</MenuItem>
              <MenuItem value="enhanced">Enhanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Attestation Timeout (seconds)"
            type="number"
            value={config.tee.attestationTimeout}
            onChange={(e) => handleConfigChange('tee', 'attestationTimeout', parseInt(e.target.value))}
            disabled={editingSection !== 'tee'}
            inputProps={{ min: 10, max: 120 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Key Rotation Interval (days)"
            type="number"
            value={config.tee.keyRotationInterval}
            onChange={(e) => handleConfigChange('tee', 'keyRotationInterval', parseInt(e.target.value))}
            disabled={editingSection !== 'tee'}
            inputProps={{ min: 1, max: 90 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.tee.requireAttestation}
                  onChange={(e) => handleConfigChange('tee', 'requireAttestation', e.target.checked)}
                  disabled={editingSection !== 'tee'}
                />
              }
              label="Require Attestation"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.tee.crossCloudVerification}
                  onChange={(e) => handleConfigChange('tee', 'crossCloudVerification', e.target.checked)}
                  disabled={editingSection !== 'tee'}
                />
              }
              label="Cross-Cloud Verification"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.tee.memoryEncryption}
                  onChange={(e) => handleConfigChange('tee', 'memoryEncryption', e.target.checked)}
                  disabled={editingSection !== 'tee'}
                />
              }
              label="Memory Encryption"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.tee.networkEncryption}
                  onChange={(e) => handleConfigChange('tee', 'networkEncryption', e.target.checked)}
                  disabled={editingSection !== 'tee'}
                />
              }
              label="Network Encryption"
            />
          </Box>
        </Grid>
      </Grid>
    </ConfigurationSection>
  );

  const MonitoringSettings = () => (
    <ConfigurationSection 
      title="Monitoring Configuration" 
      section="monitoring" 
      icon={<MonitorIcon />}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>Alert Thresholds</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography gutterBottom>CPU Usage (%)</Typography>
              <Slider
                value={config.monitoring.alertThresholds.cpuUsage}
                onChange={(e, value) => handleNestedConfigChange('monitoring', 'alertThresholds', 'cpuUsage', value)}
                disabled={editingSection !== 'monitoring'}
                valueLabelDisplay="auto"
                min={50}
                max={100}
                step={5}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography gutterBottom>Memory Usage (%)</Typography>
              <Slider
                value={config.monitoring.alertThresholds.memoryUsage}
                onChange={(e, value) => handleNestedConfigChange('monitoring', 'alertThresholds', 'memoryUsage', value)}
                disabled={editingSection !== 'monitoring'}
                valueLabelDisplay="auto"
                min={50}
                max={100}
                step={5}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography gutterBottom>Disk Usage (%)</Typography>
              <Slider
                value={config.monitoring.alertThresholds.diskUsage}
                onChange={(e, value) => handleNestedConfigChange('monitoring', 'alertThresholds', 'diskUsage', value)}
                disabled={editingSection !== 'monitoring'}
                valueLabelDisplay="auto"
                min={60}
                max={100}
                step={5}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography gutterBottom>Network Latency (ms)</Typography>
              <Slider
                value={config.monitoring.alertThresholds.networkLatency}
                onChange={(e, value) => handleNestedConfigChange('monitoring', 'alertThresholds', 'networkLatency', value)}
                disabled={editingSection !== 'monitoring'}
                valueLabelDisplay="auto"
                min={50}
                max={500}
                step={10}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Health Check Interval (minutes)"
            type="number"
            value={config.monitoring.healthCheckInterval}
            onChange={(e) => handleConfigChange('monitoring', 'healthCheckInterval', parseInt(e.target.value))}
            disabled={editingSection !== 'monitoring'}
            inputProps={{ min: 1, max: 60 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Data Retention Period (days)"
            type="number"
            value={config.monitoring.retentionPeriod}
            onChange={(e) => handleConfigChange('monitoring', 'retentionPeriod', parseInt(e.target.value))}
            disabled={editingSection !== 'monitoring'}
            inputProps={{ min: 7, max: 365 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.monitoring.realTimeMetrics}
                  onChange={(e) => handleConfigChange('monitoring', 'realTimeMetrics', e.target.checked)}
                  disabled={editingSection !== 'monitoring'}
                />
              }
              label="Real-time Metrics"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.monitoring.performanceAnalytics}
                  onChange={(e) => handleConfigChange('monitoring', 'performanceAnalytics', e.target.checked)}
                  disabled={editingSection !== 'monitoring'}
                />
              }
              label="Performance Analytics"
            />
          </Box>
        </Grid>
      </Grid>
    </ConfigurationSection>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} />
        <Typography sx={{ ml: 2 }}>Loading configuration...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          ⚙️ System Configuration
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage system-wide settings, security policies, and monitoring parameters
        </Typography>
      </Box>

      {/* Status Overview */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Configuration Status</Typography>
          <Grid container spacing={2}>
            {status.criticalIssues.length > 0 && (
              <Grid item xs={12} md={6}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Critical Issues</Typography>
                  {status.criticalIssues.map((issue, index) => (
                    <Typography key={index} variant="body2">• {issue}</Typography>
                  ))}
                </Alert>
              </Grid>
            )}
            {status.warnings.length > 0 && (
              <Grid item xs={12} md={6}>
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>Warnings</Typography>
                  {status.warnings.map((warning, index) => (
                    <Typography key={index} variant="body2">• {warning}</Typography>
                  ))}
                </Alert>
              </Grid>
            )}
            {status.criticalIssues.length === 0 && status.warnings.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="success" icon={<CheckIcon />}>
                  All configuration settings are optimal
                </Alert>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="System" />
        <Tab label="Security" />
        <Tab label="TEE" />
        <Tab label="Monitoring" />
      </Tabs>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <SystemSettings />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <SecuritySettings />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <TEESettings />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <MonitoringSettings />
      </TabPanel>
    </Box>
  );
};

export default SystemConfiguration;

