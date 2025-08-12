/**
 * Differential Privacy Manager Component
 * Manages differential privacy settings and operations
 */

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
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Grid,
  Paper,
  Divider,
  CircularProgress,
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
  Security,
  Analytics,
  History,
  Refresh,
  PlayArrow,
  Stop,
  Settings,
  Info,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { api } from '../services/api';

const DifferentialPrivacyManager = ({ contractId, onPrivacyChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Privacy settings
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [epsilon, setEpsilon] = useState(0.1);
  const [delta, setDelta] = useState(1e-5);
  const [mechanism, setMechanism] = useState('laplace');
  const [clipNorm, setClipNorm] = useState(1.0);
  
  // Privacy budget
  const [privacyBudget, setPrivacyBudget] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  
  // Operation history
  const [operations, setOperations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Test data
  const [testData, setTestData] = useState([1, 2, 3, 4, 5]);
  const [testQueryType, setTestQueryType] = useState('AVERAGE');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (contractId) {
      loadPrivacyBudget();
      loadOperationHistory();
      loadAnalytics();
    }
  }, [contractId]);

  /**
   * Load privacy budget information
   */
  const loadPrivacyBudget = async () => {
    if (!contractId) return;
    
    setBudgetLoading(true);
    try {
      const response = await api.get(`/dp/budget/${contractId}`);
      setPrivacyBudget(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load privacy budget:', err);
      setError('Failed to load privacy budget');
    } finally {
      setBudgetLoading(false);
    }
  };

  /**
   * Load operation history
   */
  const loadOperationHistory = async () => {
    if (!contractId) return;
    
    setHistoryLoading(true);
    try {
      const response = await api.get(`/dp/history/${contractId}`);
      setOperations(response.data.data.rows || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load operation history:', err);
      setError('Failed to load operation history');
    } finally {
      setHistoryLoading(false);
    }
  };

  /**
   * Load analytics
   */
  const loadAnalytics = async () => {
    if (!contractId) return;
    
    setAnalyticsLoading(true);
    try {
      const response = await api.get(`/dp/analytics/${contractId}`);
      setAnalytics(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  /**
   * Test differential privacy
   */
  const testDifferentialPrivacy = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.post('/dp/test', {
        data: testData,
        query: { type: testQueryType },
        privacyParams: {
          epsilon: parseFloat(epsilon),
          delta: parseFloat(delta),
          mechanism: mechanism
        }
      });
      
      setTestResult(response.data.data);
      setSuccess('Differential privacy test completed successfully');
      
      // Refresh data
      loadPrivacyBudget();
      loadOperationHistory();
      loadAnalytics();
      
    } catch (err) {
      console.error('DP test failed:', err);
      setError(err.response?.data?.error || 'DP test failed');
    } finally {
      setTesting(false);
    }
  };

  /**
   * Reset privacy budget
   */
  const resetPrivacyBudget = async () => {
    if (!contractId) return;
    
    setLoading(true);
    try {
      await api.post(`/dp/budget/${contractId}/reset`, {
        reason: 'Manual reset from UI'
      });
      
      setSuccess('Privacy budget reset successfully');
      loadPrivacyBudget();
      loadOperationHistory();
      loadAnalytics();
      
    } catch (err) {
      console.error('Failed to reset budget:', err);
      setError('Failed to reset privacy budget');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle privacy settings change
   */
  const handlePrivacyChange = () => {
    if (onPrivacyChange) {
      onPrivacyChange({
        enabled: privacyEnabled,
        epsilon: parseFloat(epsilon),
        delta: parseFloat(delta),
        mechanism,
        clipNorm: parseFloat(clipNorm)
      });
    }
  };

  /**
   * Get mechanism description
   */
  const getMechanismDescription = (mech) => {
    const descriptions = {
      laplace: 'Laplace mechanism for continuous data',
      gaussian: 'Gaussian mechanism for continuous data with better utility',
      exponential: 'Exponential mechanism for discrete selection',
      geometric: 'Geometric mechanism for integer-valued queries'
    };
    return descriptions[mech] || 'Unknown mechanism';
  };

  /**
   * Get query type description
   */
  const getQueryTypeDescription = (type) => {
    const descriptions = {
      COUNT: 'Count queries (e.g., number of records)',
      SUM: 'Sum queries (e.g., total value)',
      AVERAGE: 'Average queries (e.g., mean value)',
      GRADIENT: 'Gradient queries (e.g., machine learning)',
      HISTOGRAM: 'Histogram queries (e.g., distribution)',
      PERCENTILE: 'Percentile queries (e.g., median)',
      TRAINING_DATA: 'Training data queries (e.g., feature vectors)'
    };
    return descriptions[type] || 'Unknown query type';
  };

  /**
   * Format privacy budget status
   */
  const getBudgetStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'WARNING': return 'warning';
      case 'EXHAUSTED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Security sx={{ mr: 2, color: 'primary.main' }} />
        Differential Privacy Manager
      </Typography>

      {/* Error and Success Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Privacy Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Settings sx={{ mr: 1 }} />
                Privacy Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={privacyEnabled}
                    onChange={(e) => setPrivacyEnabled(e.target.checked)}
                  />
                }
                label="Enable Differential Privacy"
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Epsilon (ε)"
                    type="number"
                    value={epsilon}
                    onChange={(e) => setEpsilon(e.target.value)}
                    inputProps={{ step: 0.01, min: 0.001, max: 10 }}
                    helperText="Privacy parameter (lower = more private)"
                    disabled={!privacyEnabled}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Delta (δ)"
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    inputProps={{ step: 1e-6, min: 1e-10, max: 0.1 }}
                    helperText="Privacy parameter (lower = more private)"
                    disabled={!privacyEnabled}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth disabled={!privacyEnabled}>
                    <InputLabel>Mechanism</InputLabel>
                    <Select
                      value={mechanism}
                      onChange={(e) => setMechanism(e.target.value)}
                      label="Mechanism"
                    >
                      <MenuItem value="laplace">Laplace</MenuItem>
                      <MenuItem value="gaussian">Gaussian</MenuItem>
                      <MenuItem value="exponential">Exponential</MenuItem>
                      <MenuItem value="geometric">Geometric</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Clip Norm"
                    type="number"
                    value={clipNorm}
                    onChange={(e) => setClipNorm(e.target.value)}
                    inputProps={{ step: 0.1, min: 0.1, max: 10 }}
                    helperText="Gradient clipping norm"
                    disabled={!privacyEnabled}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <Info sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  {getMechanismDescription(mechanism)}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handlePrivacyChange}
                  disabled={!privacyEnabled}
                  startIcon={<CheckCircle />}
                >
                  Apply Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy Budget */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1 }} />
                Privacy Budget
                <IconButton onClick={loadPrivacyBudget} disabled={budgetLoading} size="small" sx={{ ml: 1 }}>
                  <Refresh />
                </IconButton>
              </Typography>
              
              {budgetLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : privacyBudget ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={privacyBudget.budget?.budgetStatus || 'UNKNOWN'}
                      color={getBudgetStatusColor(privacyBudget.budget?.budgetStatus)}
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Initial Epsilon</Typography>
                      <Typography variant="h6">{privacyBudget.budget?.epsilon?.initial || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Remaining Epsilon</Typography>
                      <Typography variant="h6" color="primary">
                        {privacyBudget.budget?.epsilon?.remaining || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Initial Delta</Typography>
                      <Typography variant="h6">{privacyBudget.budget?.delta?.initial || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Remaining Delta</Typography>
                      <Typography variant="h6" color="primary">
                        {privacyBudget.budget?.delta?.remaining || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={resetPrivacyBudget}
                      disabled={loading}
                      startIcon={<Refresh />}
                      color="warning"
                    >
                      Reset Budget
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">No privacy budget found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Test Differential Privacy */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PlayArrow sx={{ mr: 1 }} />
                Test Differential Privacy
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Test Data"
                    value={testData.join(', ')}
                    onChange={(e) => setTestData(e.target.value.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x)))}
                    helperText="Comma-separated numbers"
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Query Type</InputLabel>
                    <Select
                      value={testQueryType}
                      onChange={(e) => setTestQueryType(e.target.value)}
                      label="Query Type"
                    >
                      <MenuItem value="COUNT">Count</MenuItem>
                      <MenuItem value="SUM">Sum</MenuItem>
                      <MenuItem value="AVERAGE">Average</MenuItem>
                      <MenuItem value="GRADIENT">Gradient</MenuItem>
                      <MenuItem value="HISTOGRAM">Histogram</MenuItem>
                      <MenuItem value="PERCENTILE">Percentile</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {getQueryTypeDescription(testQueryType)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Button
                    variant="contained"
                    onClick={testDifferentialPrivacy}
                    disabled={testing || !privacyEnabled}
                    startIcon={testing ? <CircularProgress size={20} /> : <PlayArrow />}
                    fullWidth
                  >
                    {testing ? 'Testing...' : 'Test DP'}
                  </Button>
                </Grid>
              </Grid>
              
              {testResult && (
                <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>Test Results:</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Original Data</Typography>
                      <Typography variant="body1">{testData.join(', ')}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">DP Protected Result</Typography>
                      <Typography variant="body1">
                        {Array.isArray(testResult.result) ? testResult.result.join(', ') : testResult.result}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Mechanism</Typography>
                      <Typography variant="body1">{testResult.privacyMetrics.mechanism}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Sensitivity</Typography>
                      <Typography variant="body1">{testResult.privacyMetrics.sensitivity}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Operation History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1 }} />
                Operation History
                <IconButton onClick={loadOperationHistory} disabled={historyLoading} size="small" sx={{ ml: 1 }}>
                  <Refresh />
                </IconButton>
              </Typography>
              
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : operations.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Operation</TableCell>
                        <TableCell>Mechanism</TableCell>
                        <TableCell>Epsilon</TableCell>
                        <TableCell>Delta</TableCell>
                        <TableCell>Sensitivity</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {operations.slice(0, 10).map((op, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(op.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{op.operationType}</TableCell>
                          <TableCell>{op.mechanism}</TableCell>
                          <TableCell>{op.epsilon}</TableCell>
                          <TableCell>{op.delta}</TableCell>
                          <TableCell>{op.sensitivity}</TableCell>
                          <TableCell>
                            <Chip
                              label={op.success ? 'Success' : 'Failed'}
                              color={op.success ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No operations found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics */}
        {analytics && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Analytics sx={{ mr: 1 }} />
                  Privacy Analytics
                  <IconButton onClick={loadAnalytics} disabled={analyticsLoading} size="small" sx={{ ml: 1 }}>
                    <Refresh />
                  </IconButton>
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {analytics.operations?.total || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Operations
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {analytics.operations?.successRate || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Success Rate
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {analytics.performance?.avgExecutionTime?.toFixed(2) || 0}ms
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Execution Time
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DifferentialPrivacyManager; 