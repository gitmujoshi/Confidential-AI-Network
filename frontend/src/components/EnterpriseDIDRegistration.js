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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper
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
  VerifiedUser,
  Public,
  Lock,
  CorporateFare,
  Person
} from '@mui/icons-material';
import { apiService } from '../services/api';

const EnterpriseDIDRegistration = ({ onDIDChange, onValidationChange }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Enterprise information
  const [enterpriseInfo, setEnterpriseInfo] = useState({
    organizationName: '',
    domain: '',
    department: '',
    role: '',
    employeeId: '',
    isEnterpriseUser: false
  });
  
  // DID information
  const [didInfo, setDidInfo] = useState({
    did: '',
    method: 'web',
    domain: '',
    path: '',
    userIdentifier: ''
  });
  
  // Validation states
  const [domainValidated, setDomainValidated] = useState(false);
  const [didValidated, setDidValidated] = useState(false);
  const [didAvailable, setDidAvailable] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Load supported DID methods
  const [supportedMethods, setSupportedMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);

  useEffect(() => {
    loadSupportedMethods();
  }, []);

  const loadSupportedMethods = async () => {
    try {
      setLoadingMethods(true);
      const response = await apiService.getSupportedDIDMethods();
      if (response.data.success) {
        setSupportedMethods(response.data.methods);
      }
    } catch (error) {
      console.error('Failed to load supported methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleEnterpriseInfoChange = (field, value) => {
    setEnterpriseInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate DID when domain changes
    if (field === 'domain' && value) {
      const newDid = `did:web:${value}:employees:${enterpriseInfo.employeeId || 'user'}`;
      setDidInfo(prev => ({
        ...prev,
        domain: value,
        did: newDid
      }));
    }
    
    // Auto-generate DID when employee ID changes
    if (field === 'employeeId' && value && enterpriseInfo.domain) {
      const newDid = `did:web:${enterpriseInfo.domain}:employees:${value}`;
      setDidInfo(prev => ({
        ...prev,
        userIdentifier: value,
        did: newDid
      }));
    }
  };

  const validateDomain = async () => {
    if (!enterpriseInfo.domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Test domain accessibility
      const testDid = `did:web:${enterpriseInfo.domain}`;
      const response = await apiService.validateEnterpriseDID(encodeURIComponent(testDid));
      
      if (response.data.success) {
        setDomainValidated(true);
        setSuccess('Domain validated successfully');
        setValidationResult(response.data);
        
        // Auto-generate DID
        const newDid = `did:web:${enterpriseInfo.domain}:employees:${enterpriseInfo.employeeId || 'user'}`;
        setDidInfo(prev => ({
          ...prev,
          did: newDid,
          domain: enterpriseInfo.domain
        }));
        
        setActiveStep(1);
      } else {
        setError('Domain validation failed');
      }
    } catch (error) {
      console.error('Domain validation error:', error);
      setError('Failed to validate domain: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const checkDIDAvailability = async () => {
    if (!didInfo.did.trim()) {
      setError('Please enter a DID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.checkDIDAvailability(encodeURIComponent(didInfo.did));
      
      if (response.data.success) {
        setDidAvailable(response.data.available);
        if (response.data.available) {
          setSuccess('DID is available for registration');
          setDidValidated(true);
          setActiveStep(2);
        } else {
          setError('DID is already registered');
        }
      }
    } catch (error) {
      console.error('DID availability check error:', error);
      setError('Failed to check DID availability: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const validateEnterpriseDID = async () => {
    if (!didInfo.did.trim()) {
      setError('Please enter a DID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.validateEnterpriseDID(encodeURIComponent(didInfo.did));
      
      if (response.data.success) {
        setValidationResult(response.data);
        setDidValidated(true);
        setSuccess('Enterprise DID validated successfully');
        
        // Notify parent component
        if (onDIDChange) {
          onDIDChange(didInfo.did);
        }
        if (onValidationChange) {
          onValidationChange(response.data);
        }
        
        setActiveStep(3);
      } else {
        setError('Enterprise DID validation failed');
      }
    } catch (error) {
      console.error('Enterprise DID validation error:', error);
      setError('Failed to validate enterprise DID: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setEnterpriseInfo({
      organizationName: '',
      domain: '',
      department: '',
      role: '',
      employeeId: '',
      isEnterpriseUser: false
    });
    setDidInfo({
      did: '',
      method: 'web',
      domain: '',
      path: '',
      userIdentifier: ''
    });
    setDomainValidated(false);
    setDidValidated(false);
    setDidAvailable(false);
    setValidationResult(null);
    setError('');
    setSuccess('');
  };

  const steps = [
    {
      label: 'Enterprise Information',
      description: 'Enter your organization details and domain',
      icon: <Business />
    },
    {
      label: 'DID Generation',
      description: 'Generate and validate your enterprise DID',
      icon: <VerifiedUser />
    },
    {
      label: 'DID Validation',
      description: 'Validate your DID for enterprise use',
      icon: <Security />
    },
    {
      label: 'Confirmation',
      description: 'Review and confirm your enterprise DID',
      icon: <CheckCircle />
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Business color="primary" />
        Enterprise DID Registration
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Register with an enterprise DID:web for enhanced security and organizational control.
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

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={() => step.icon}
              optional={index === 3 ? (
                <Typography variant="caption">Complete</Typography>
              ) : null}
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {step.description}
              </Typography>
              
              {/* Step 1: Enterprise Information */}
              {index === 0 && (
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Organization Name"
                        value={enterpriseInfo.organizationName}
                        onChange={(e) => handleEnterpriseInfoChange('organizationName', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Domain"
                        placeholder="company.com"
                        value={enterpriseInfo.domain}
                        onChange={(e) => handleEnterpriseInfoChange('domain', e.target.value)}
                        required
                        helperText="Your organization's web domain"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        value={enterpriseInfo.department}
                        onChange={(e) => handleEnterpriseInfoChange('department', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={enterpriseInfo.role}
                        onChange={(e) => handleEnterpriseInfoChange('role', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Employee ID"
                        value={enterpriseInfo.employeeId}
                        onChange={(e) => handleEnterpriseInfoChange('employeeId', e.target.value)}
                        helperText="Used to generate your unique DID"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={enterpriseInfo.isEnterpriseUser}
                            onChange={(e) => handleEnterpriseInfoChange('isEnterpriseUser', e.target.checked)}
                          />
                        }
                        label="I am registering as an enterprise user"
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={validateDomain}
                      disabled={loading || !enterpriseInfo.domain.trim()}
                      startIcon={loading ? <CircularProgress size={20} /> : <Domain />}
                    >
                      Validate Domain
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 2: DID Generation */}
              {index === 1 && (
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Generated DID"
                        value={didInfo.did}
                        onChange={(e) => setDidInfo(prev => ({ ...prev, did: e.target.value }))}
                        helperText="Your enterprise DID (can be customized)"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Domain"
                        value={didInfo.domain}
                        disabled
                        helperText="Organization domain"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="User Identifier"
                        value={didInfo.userIdentifier}
                        onChange={(e) => setDidInfo(prev => ({ 
                          ...prev, 
                          userIdentifier: e.target.value,
                          did: `did:web:${didInfo.domain}:employees:${e.target.value}`
                        }))}
                        helperText="Your unique identifier"
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={checkDIDAvailability}
                      disabled={loading || !didInfo.did.trim()}
                      startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                    >
                      Check Availability
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 3: DID Validation */}
              {index === 2 && (
                <Box sx={{ mb: 2 }}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        DID: {didInfo.did}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Chip 
                            label={`Method: ${didInfo.method.toUpperCase()}`} 
                            color="primary" 
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Chip 
                            label={didAvailable ? 'Available' : 'Taken'} 
                            color={didAvailable ? 'success' : 'error'} 
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  <Button
                    variant="contained"
                    onClick={validateEnterpriseDID}
                    disabled={loading || !didAvailable}
                    startIcon={loading ? <CircularProgress size={20} /> : <Security />}
                    fullWidth
                  >
                    Validate for Enterprise Use
                  </Button>
                </Box>
              )}

              {/* Step 4: Confirmation */}
              {index === 3 && validationResult && (
                <Box sx={{ mb: 2 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Enterprise DID Confirmed
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                            {didInfo.did}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Chip 
                            label="Enterprise Validated" 
                            color="success" 
                            icon={<Business />}
                          />
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Chip 
                            label={`${validationResult.enterprise.verificationMethods} Verification Methods`} 
                            color="primary" 
                            icon={<Security />}
                          />
                        </Grid>
                      </Grid>
                      
                      {validationResult.enterprise.recommendations.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="warning.main" gutterBottom>
                            <Warning sx={{ mr: 1, fontSize: 16 }} />
                            Recommendations
                          </Typography>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {validationResult.enterprise.recommendations.map((rec, idx) => (
                              <li key={idx}>
                                <Typography variant="body2" color="text.secondary">
                                  {rec}
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={loading}
                  >
                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      
      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
          <Typography>All steps completed - you&apos;re finished</Typography>
          <Button onClick={handleReset} sx={{ mt: 1 }}>
            Reset
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default EnterpriseDIDRegistration; 