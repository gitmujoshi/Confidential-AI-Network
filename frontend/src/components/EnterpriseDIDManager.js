import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
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
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Business,
  Domain,
  Security,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Refresh,
  Settings,
  VerifiedUser,
  Public,
  Lock,
  Speed
} from '@mui/icons-material';
import { apiService } from '../services/api';

const EnterpriseDIDManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Enterprise configuration
  const [enterpriseConfig, setEnterpriseConfig] = useState({
    allowedDomains: [],
    requireHttps: true,
    maxRedirects: 5,
    timeout: 10000
  });
  
  // DID validation
  const [didToValidate, setDidToValidate] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  
  // Cache statistics
  const [cacheStats, setCacheStats] = useState(null);
  const [loadingCache, setLoadingCache] = useState(false);

  // Load enterprise configuration
  useEffect(() => {
    loadEnterpriseConfig();
    loadCacheStats();
  }, []);

  const loadEnterpriseConfig = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEnterpriseDomains();
      if (response.data.success) {
        setEnterpriseConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to load enterprise config:', error);
      setError('Failed to load enterprise configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadCacheStats = async () => {
    try {
      setLoadingCache(true);
      const response = await apiService.getDIDCacheStats();
      if (response.data.success) {
        setCacheStats(response.data.cache);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setLoadingCache(false);
    }
  };

  const updateEnterpriseConfig = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.updateEnterpriseDomains(enterpriseConfig);
      if (response.data.success) {
        setSuccess('Enterprise configuration updated successfully');
        setEnterpriseConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to update enterprise config:', error);
      setError('Failed to update enterprise configuration');
    } finally {
      setLoading(false);
    }
  };

  const validateEnterpriseDID = async () => {
    if (!didToValidate.trim()) {
      setError('Please enter a DID to validate');
      return;
    }

    try {
      setValidating(true);
      setError('');
      setValidationResult(null);
      
      const response = await apiService.validateEnterpriseDID(encodeURIComponent(didToValidate));
      if (response.data.success) {
        setValidationResult(response.data);
      }
    } catch (error) {
      console.error('DID validation error:', error);
      setError('Failed to validate DID: ' + (error.response?.data?.error || error.message));
    } finally {
      setValidating(false);
    }
  };

  const clearCache = async () => {
    try {
      setLoadingCache(true);
      const response = await apiService.clearDIDCache();
      if (response.data.success) {
        setSuccess('DID cache cleared successfully');
        loadCacheStats(); // Reload stats
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setError('Failed to clear DID cache');
    } finally {
      setLoadingCache(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setEnterpriseConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getValidationStatusIcon = (isValid) => {
    return isValid ? <CheckCircle color="success" /> : <Error color="error" />;
  };

  const getEnterpriseStatusIcon = (isEnterprise) => {
    return isEnterprise ? <Business color="primary" /> : <Public color="action" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Business color="primary" />
        Enterprise DID Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage enterprise DID:web configurations, validate domains, and monitor DID resolution performance.
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
        {/* Enterprise Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings color="primary" />
                Enterprise Configuration
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Allowed Domains"
                  placeholder="company.com, partner.com"
                  value={enterpriseConfig.allowedDomains.join(', ')}
                  onChange={(e) => handleConfigChange('allowedDomains', e.target.value.split(',').map(d => d.trim()).filter(d => d))}
                  helperText="Comma-separated list of allowed domains for did:web"
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={enterpriseConfig.requireHttps}
                      onChange={(e) => handleConfigChange('requireHttps', e.target.checked)}
                    />
                  }
                  label="Require HTTPS for DID documents"
                />
                
                <TextField
                  fullWidth
                  type="number"
                  label="Max Redirects"
                  value={enterpriseConfig.maxRedirects}
                  onChange={(e) => handleConfigChange('maxRedirects', parseInt(e.target.value))}
                  helperText="Maximum number of redirects when resolving DIDs"
                  sx={{ mb: 2, mt: 2 }}
                />
                
                <TextField
                  fullWidth
                  type="number"
                  label="Timeout (ms)"
                  value={enterpriseConfig.timeout}
                  onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                  helperText="Timeout for DID resolution requests"
                />
              </Box>
              
              <Button
                variant="contained"
                onClick={updateEnterpriseConfig}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Settings />}
                fullWidth
              >
                Update Configuration
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* DID Validation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser color="primary" />
                DID Validation
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="DID to Validate"
                  placeholder="did:web:company.com:user:alice"
                  value={didToValidate}
                  onChange={(e) => setDidToValidate(e.target.value)}
                  helperText="Enter a DID to validate for enterprise use"
                  sx={{ mb: 2 }}
                />
                
                <Button
                  variant="outlined"
                  onClick={validateEnterpriseDID}
                  disabled={validating || !didToValidate.trim()}
                  startIcon={validating ? <CircularProgress size={20} /> : <CheckCircle />}
                  fullWidth
                >
                  Validate DID
                </Button>
              </Box>

              {validationResult && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getValidationStatusIcon(validationResult.isValid)}
                    <Typography variant="h6">
                      Validation Result
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Chip 
                        label={`Method: ${validationResult.method.toUpperCase()}`} 
                        color="primary" 
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Chip 
                        label={validationResult.isValid ? 'Valid' : 'Invalid'} 
                        color={validationResult.isValid ? 'success' : 'error'} 
                        size="small"
                      />
                    </Grid>
                  </Grid>
                  
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body2">
                        <Business sx={{ mr: 1, fontSize: 16 }} />
                        Enterprise Analysis
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            {getEnterpriseStatusIcon(validationResult.enterprise.isEnterprise)}
                          </ListItemIcon>
                          <ListItemText 
                            primary="Enterprise DID" 
                            secondary={validationResult.enterprise.isEnterprise ? 'Yes' : 'No'}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <Security />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Verification Methods" 
                            secondary={`${validationResult.enterprise.verificationMethods} methods found`}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <Domain />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Domain Restricted" 
                            secondary={validationResult.enterprise.domainRestricted ? 'Yes' : 'No'}
                          />
                        </ListItem>
                        
                        {validationResult.enterprise.hasServices && (
                          <ListItem>
                            <ListItemIcon>
                              <Info />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Services" 
                              secondary={validationResult.enterprise.serviceTypes.join(', ')}
                            />
                          </ListItem>
                        )}
                      </List>
                      
                      {validationResult.enterprise.recommendations.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="warning.main" gutterBottom>
                            <Warning sx={{ mr: 1, fontSize: 16 }} />
                            Recommendations
                          </Typography>
                          <List dense>
                            {validationResult.enterprise.recommendations.map((rec, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={rec} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed color="primary" />
                  DID Cache Statistics
                </Typography>
                <Box>
                  <Tooltip title="Refresh cache stats">
                    <IconButton onClick={loadCacheStats} disabled={loadingCache}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear cache">
                    <IconButton onClick={clearCache} disabled={loadingCache}>
                      <Lock />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              {loadingCache ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : cacheStats ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Entries</TableCell>
                        <TableCell align="right">{cacheStats.totalEntries}</TableCell>
                        <TableCell>Total cached DID documents</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Hit Rate</TableCell>
                        <TableCell align="right">{cacheStats.hitRate}%</TableCell>
                        <TableCell>Percentage of cache hits</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Response Time</TableCell>
                        <TableCell align="right">{cacheStats.avgResponseTime}ms</TableCell>
                        <TableCell>Average DID resolution time</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Cache Size</TableCell>
                        <TableCell align="right">{cacheStats.cacheSize} MB</TableCell>
                        <TableCell>Memory usage of cache</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No cache statistics available
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnterpriseDIDManager; 