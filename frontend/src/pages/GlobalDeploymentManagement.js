import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
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
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Cloud as CloudIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Public as PublicIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const GlobalDeploymentManagement = () => {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [jurisdictions, setJurisdictions] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);

  // Registration form state
  const [registrationForm, setRegistrationForm] = useState({
    deploymentId: '',
    prefix: '',
    region: '',
    country: '',
    jurisdiction: 'LOCAL',
    dataResidency: 'LOCAL',
    regulatoryFramework: [],
    timezone: 'UTC',
    currency: 'USD',
    language: 'en-US'
  });

  // Generation form state
  const [generationForm, setGenerationForm] = useState({
    entityType: 'TDC',
    deploymentPrefix: '',
    jurisdiction: ''
  });

  // Load data
  useEffect(() => {
    loadDeploymentData();
  }, []);

  const loadDeploymentData = async () => {
    try {
      setLoading(true);
      
      // Load deployment status
      const statusResponse = await apiService.get('/api/global-deployment/status');
      if (statusResponse.data.success) {
        setDeploymentStatus(statusResponse.data.data);
      }
      
      // Load jurisdictions
      const jurisdictionsResponse = await apiService.get('/api/global-deployment/jurisdictions');
      if (jurisdictionsResponse.data.success) {
        setJurisdictions(jurisdictionsResponse.data.data.jurisdictions);
      }
      
      // Load deployments
      const deploymentsResponse = await apiService.get('/api/global-deployment/deployments');
      if (deploymentsResponse.data.success) {
        setDeployments(deploymentsResponse.data.data.deployments);
      }
    } catch (error) {
      console.error('Failed to load deployment data:', error);
      toast.error('Failed to load deployment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDeployment = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.post('/api/global-deployment/register', registrationForm);
      
      if (response.data.success) {
        toast.success('Deployment registered successfully!');
        setRegisterDialogOpen(false);
        loadDeploymentData(); // Refresh data
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to register deployment';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGlobalDEPAId = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.post('/api/global-deployment/generate', generationForm);
      
      if (response.data.success) {
        const { globalDEPAId, verification } = response.data.data;
        toast.success(`Generated Global DEPA ID: ${globalDEPAId}`);
        
        // Show verification result
        if (verification.unique) {
          toast.success('✅ Verified globally unique');
        } else {
          toast.error(`❌ Not unique: ${verification.reason}`);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to generate global DEPA ID';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTestGeneration = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get('/api/global-deployment/test');
      
      if (response.data.success) {
        setTestResults(response.data.data);
        toast.success('Global DEPA ID generation test completed!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to test generation';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'error';
      default: return 'default';
    }
  };

  const getJurisdictionColor = (jurisdiction) => {
    switch (jurisdiction) {
      case 'US-Federal': return 'primary';
      case 'EU-GDPR': return 'secondary';
      case 'AP-Singapore': return 'warning';
      case 'CA-Federal': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Paper elevation={0} variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Global Deployment Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Manage multi-deployment configurations and global DEPA ID uniqueness across different countries and jurisdictions.
        </Typography>

        {/* Current Deployment Status */}
        {deploymentStatus && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <CloudIcon color="primary" />
                  <Typography variant="h6">Current Deployment</Typography>
                </Box>
                <Chip
                  label={deploymentStatus.currentDeployment.status || 'ACTIVE'}
                  color={getStatusColor(deploymentStatus.currentDeployment.status || 'ACTIVE')}
                  variant="outlined"
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Deployment ID:</strong> {deploymentStatus.currentDeployment.deploymentId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Prefix:</strong> {deploymentStatus.currentDeployment.prefix}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Region:</strong> {deploymentStatus.currentDeployment.region}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Country:</strong> {deploymentStatus.currentDeployment.country}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Jurisdiction:</strong> {deploymentStatus.currentDeployment.jurisdiction}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Data Residency:</strong> {deploymentStatus.currentDeployment.dataResidency}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Total Deployments:</strong> {deploymentStatus.totalDeployments}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => setRegisterDialogOpen(true)}
            startIcon={<AddIcon />}
            disabled={loading}
          >
            Register Deployment
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => setGenerateDialogOpen(true)}
            startIcon={<SettingsIcon />}
            disabled={loading}
          >
            Generate Global DEPA ID
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleTestGeneration}
            startIcon={<CheckCircleIcon />}
            disabled={loading}
          >
            Test Generation
          </Button>
          
          <Button
            variant="outlined"
            onClick={loadDeploymentData}
            startIcon={<RefreshIcon />}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Test Results */}
        {testResults && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              
              <Box display="flex" gap={2} mb={2}>
                <Chip label={`Total: ${testResults.totalTests}`} color="primary" />
                <Chip label={`Passed: ${testResults.passedTests}`} color="success" />
                <Chip label={`Failed: ${testResults.failedTests}`} color="error" />
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Entity Type</TableCell>
                      <TableCell>Generated DEPA ID</TableCell>
                      <TableCell>Valid</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(testResults.testResults).map(([entityType, result]) => (
                      <TableRow key={entityType}>
                        <TableCell>{entityType}</TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {result.generated}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {result.valid ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={result.success ? 'PASSED' : 'FAILED'}
                            color={result.success ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Registered Deployments */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Registered Deployments ({deployments.length})
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Deployment ID</TableCell>
                    <TableCell>Prefix</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Jurisdiction</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Registered</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deployments.map((deployment) => (
                    <TableRow key={deployment.prefix}>
                      <TableCell>{deployment.deploymentId}</TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {deployment.prefix}
                        </Typography>
                      </TableCell>
                      <TableCell>{deployment.region}</TableCell>
                      <TableCell>{deployment.country}</TableCell>
                      <TableCell>
                        <Chip
                          label={deployment.jurisdiction}
                          color={getJurisdictionColor(deployment.jurisdiction)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={deployment.status}
                          color={getStatusColor(deployment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(deployment.registeredAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Available Jurisdictions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Available Jurisdictions ({jurisdictions.length})
            </Typography>
            
            <Grid container spacing={2}>
              {jurisdictions.map((jurisdiction) => (
                <Grid item xs={12} md={6} key={jurisdiction.code}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <BusinessIcon color="primary" />
                        <Typography variant="subtitle1">
                          {jurisdiction.name}
                        </Typography>
                        <Chip
                          label={jurisdiction.code}
                          color={getJurisdictionColor(jurisdiction.code)}
                          size="small"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Data Residency:</strong> {jurisdiction.dataResidency}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Encryption Standards:</strong>
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                            {jurisdiction.encryptionStandards.map((standard) => (
                              <Chip key={standard} label={standard} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Audit Requirements:</strong>
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                            {jurisdiction.auditRequirements.map((requirement) => (
                              <Chip key={requirement} label={requirement} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>DEPA ID Format:</strong>
                          </Typography>
                          <Typography variant="caption" fontFamily="monospace" display="block" mt={1}>
                            {jurisdiction.depaIdFormat}
                          </Typography>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Register Deployment Dialog */}
        <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Register New Deployment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Deployment ID"
                  value={registrationForm.deploymentId}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, deploymentId: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prefix"
                  value={registrationForm.prefix}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, prefix: e.target.value }))}
                  required
                  helperText="Unique deployment prefix (e.g., US-EAST, EU-WEST)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Region"
                  value={registrationForm.region}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, region: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={registrationForm.country}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, country: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Jurisdiction</InputLabel>
                  <Select
                    value={registrationForm.jurisdiction}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, jurisdiction: e.target.value }))}
                    label="Jurisdiction"
                  >
                    <MenuItem value="LOCAL">Local</MenuItem>
                    <MenuItem value="US-Federal">US Federal</MenuItem>
                    <MenuItem value="EU-GDPR">EU GDPR</MenuItem>
                    <MenuItem value="AP-Singapore">AP Singapore</MenuItem>
                    <MenuItem value="CA-Federal">CA Federal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data Residency"
                  value={registrationForm.dataResidency}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, dataResidency: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timezone"
                  value={registrationForm.timezone}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, timezone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Currency"
                  value={registrationForm.currency}
                  onChange={(e) => setRegistrationForm(prev => ({ ...prev, currency: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRegisterDeployment} variant="contained" disabled={loading}>
              Register
            </Button>
          </DialogActions>
        </Dialog>

        {/* Generate Global DEPA ID Dialog */}
        <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Global DEPA ID</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={generationForm.entityType}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, entityType: e.target.value }))}
                    label="Entity Type"
                  >
                    <MenuItem value="TDC">Training Data Consumer (TDC)</MenuItem>
                    <MenuItem value="TDP">Training Data Provider (TDP)</MenuItem>
                    <MenuItem value="TSP">Tech Service Provider (TSP)</MenuItem>
                    <MenuItem value="CONTRACT">Contract</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Deployment Prefix (Optional)"
                  value={generationForm.deploymentPrefix}
                  onChange={(e) => setGenerationForm(prev => ({ ...prev, deploymentPrefix: e.target.value }))}
                  helperText="Leave empty to use current deployment prefix"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Jurisdiction (Optional)</InputLabel>
                  <Select
                    value={generationForm.jurisdiction}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, jurisdiction: e.target.value }))}
                    label="Jurisdiction (Optional)"
                  >
                    <MenuItem value="">None (Standard)</MenuItem>
                    <MenuItem value="US-Federal">US Federal</MenuItem>
                    <MenuItem value="EU-GDPR">EU GDPR</MenuItem>
                    <MenuItem value="AP-Singapore">AP Singapore</MenuItem>
                    <MenuItem value="CA-Federal">CA Federal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateGlobalDEPAId} variant="contained" disabled={loading}>
              Generate
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default GlobalDeploymentManagement; 