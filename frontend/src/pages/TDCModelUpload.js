import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Upload as UploadIcon,
  CloudUpload,
  Security,
  Verified,
  Info,
  ExpandMore,
  Check,
  Warning,
  Error as ErrorIcon,
  Visibility,
  Download,
  Delete,
  Edit
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import { AI_MODEL_TYPES, AI_MODEL_ARCHITECTURES } from '../config/tdcConstraints';
import toast from 'react-hot-toast';

const steps = [
  'Model Information',
  'Upload Model Files',
  'Encryption Configuration',
  'Security & Verification',
  'Review & Submit'
];

const TDCModelUpload = () => {
  const navigate = useNavigate();
  const { currentUser, isTDC } = useUser();
  const queryClient = useQueryClient();

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modelData, setModelData] = useState({
    name: '',
    description: '',
    type: '',
    architecture: '',
    framework: '',
    version: '',
    license: '',
    tags: [],
    isPublic: false,
    requiresApproval: true,
    intellectualPropertyProtection: true
  });

  const [modelFiles, setModelFiles] = useState({
    modelFile: null,
    configFile: null,
    documentationFile: null,
    checksumFile: null
  });

  const [encryptionConfig, setEncryptionConfig] = useState({
    encryptionEnabled: true,
    algorithm: 'AES-256-GCM',
    keyManagement: 'platform',
    customKeyId: '',
    teeRequired: true,
    accessControlList: []
  });

  const [securityConfig, setSecurityConfig] = useState({
    digitalSignature: true,
    provenanceTracking: true,
    auditLogging: true,
    integrityVerification: true,
    biasDetection: false,
    fairnessAssessment: false
  });

  const [validationResults, setValidationResults] = useState({
    modelStructure: { status: 'pending', message: '' },
    securityScan: { status: 'pending', message: '' },
    integrityCheck: { status: 'pending', message: '' },
    provenanceSetup: { status: 'pending', message: '' }
  });

  // File upload handlers
  const onModelFileDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setModelFiles(prev => ({ ...prev, modelFile: acceptedFiles[0] }));
      toast.success('Model file selected successfully');
    }
  };

  const onConfigFileDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setModelFiles(prev => ({ ...prev, configFile: acceptedFiles[0] }));
      toast.success('Configuration file selected successfully');
    }
  };

  const onDocumentationDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setModelFiles(prev => ({ ...prev, documentationFile: acceptedFiles[0] }));
      toast.success('Documentation file selected successfully');
    }
  };

  const onChecksumDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setModelFiles(prev => ({ ...prev, checksumFile: acceptedFiles[0] }));
      toast.success('Checksum file selected successfully');
    }
  };

  // Dropzone configurations
  const modelDropzone = useDropzone({
    onDrop: onModelFileDrop,
    accept: {
      'application/octet-stream': ['.pkl', '.h5', '.pt', '.pth', '.onnx', '.pb'],
      'application/zip': ['.zip'],
      'application/x-tar': ['.tar', '.tar.gz']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 * 1024 // 5GB
  });

  const configDropzone = useDropzone({
    onDrop: onConfigFileDrop,
    accept: {
      'application/json': ['.json'],
      'text/yaml': ['.yml', '.yaml'],
      'text/plain': ['.txt', '.cfg']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const documentationDropzone = useDropzone({
    onDrop: onDocumentationDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc', '.docx']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const checksumDropzone = useDropzone({
    onDrop: onChecksumDrop,
    accept: {
      'text/plain': ['.sha256', '.md5', '.txt'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 // 1MB
  });

  // Model upload mutation
  const uploadModelMutation = useMutation(
    async (formData) => {
      const response = await apiService.post('/api/ai-models/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      return response;
    },
    {
      onSuccess: (data) => {
        toast.success('AI model uploaded successfully!');
        queryClient.invalidateQueries('aiModels');
        navigate('/dashboard');
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.message || 'Failed to upload model';
        toast.error(errorMsg);
      }
    }
  );

  // Validation functions
  const validateModelStructure = async () => {
    if (!modelFiles.modelFile) {
      setValidationResults(prev => ({
        ...prev,
        modelStructure: { status: 'error', message: 'No model file selected' }
      }));
      return false;
    }

    try {
      setValidationResults(prev => ({
        ...prev,
        modelStructure: { status: 'loading', message: 'Validating model structure...' }
      }));

      // Simulate model structure validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setValidationResults(prev => ({
        ...prev,
        modelStructure: { status: 'success', message: 'Model structure is valid' }
      }));
      return true;
    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        modelStructure: { status: 'error', message: 'Model structure validation failed' }
      }));
      return false;
    }
  };

  const performSecurityScan = async () => {
    try {
      setValidationResults(prev => ({
        ...prev,
        securityScan: { status: 'loading', message: 'Performing security scan...' }
      }));

      // Simulate security scanning
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setValidationResults(prev => ({
        ...prev,
        securityScan: { status: 'success', message: 'No security threats detected' }
      }));
      return true;
    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        securityScan: { status: 'error', message: 'Security scan failed' }
      }));
      return false;
    }
  };

  const verifyIntegrity = async () => {
    try {
      setValidationResults(prev => ({
        ...prev,
        integrityCheck: { status: 'loading', message: 'Verifying file integrity...' }
      }));

      // Simulate integrity verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setValidationResults(prev => ({
        ...prev,
        integrityCheck: { status: 'success', message: 'File integrity verified' }
      }));
      return true;
    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        integrityCheck: { status: 'error', message: 'Integrity verification failed' }
      }));
      return false;
    }
  };

  const setupProvenance = async () => {
    try {
      setValidationResults(prev => ({
        ...prev,
        provenanceSetup: { status: 'loading', message: 'Setting up provenance tracking...' }
      }));

      // Simulate provenance setup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setValidationResults(prev => ({
        ...prev,
        provenanceSetup: { status: 'success', message: 'Provenance tracking configured' }
      }));
      return true;
    } catch (error) {
      setValidationResults(prev => ({
        ...prev,
        provenanceSetup: { status: 'error', message: 'Provenance setup failed' }
      }));
      return false;
    }
  };

  // Step navigation
  const handleNext = async () => {
    if (activeStep === 3) {
      // Run all validations on security step
      setLoading(true);
      const results = await Promise.all([
        validateModelStructure(),
        performSecurityScan(),
        verifyIntegrity(),
        setupProvenance()
      ]);
      setLoading(false);
      
      if (results.every(result => result)) {
        setActiveStep(prev => prev + 1);
      } else {
        toast.error('Please resolve validation issues before proceeding');
      }
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!modelFiles.modelFile) {
      toast.error('Please select a model file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      // Add model metadata
      formData.append('modelData', JSON.stringify(modelData));
      formData.append('encryptionConfig', JSON.stringify(encryptionConfig));
      formData.append('securityConfig', JSON.stringify(securityConfig));
      formData.append('userId', currentUser.id);

      // Add files
      if (modelFiles.modelFile) {
        formData.append('modelFile', modelFiles.modelFile);
      }
      if (modelFiles.configFile) {
        formData.append('configFile', modelFiles.configFile);
      }
      if (modelFiles.documentationFile) {
        formData.append('documentationFile', modelFiles.documentationFile);
      }
      if (modelFiles.checksumFile) {
        formData.append('checksumFile', modelFiles.checksumFile);
      }

      await uploadModelMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Model Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model Name"
                  value={modelData.name}
                  onChange={(e) => setModelData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Version"
                  value={modelData.version}
                  onChange={(e) => setModelData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="e.g., 1.0.0"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={modelData.description}
                  onChange={(e) => setModelData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Model Type</InputLabel>
                  <Select
                    value={modelData.type}
                    onChange={(e) => setModelData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {AI_MODEL_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Architecture</InputLabel>
                  <Select
                    value={modelData.architecture}
                    onChange={(e) => setModelData(prev => ({ ...prev, architecture: e.target.value }))}
                  >
                    {AI_MODEL_ARCHITECTURES.map(arch => (
                      <MenuItem key={arch.value} value={arch.value}>
                        {arch.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Framework"
                  value={modelData.framework}
                  onChange={(e) => setModelData(prev => ({ ...prev, framework: e.target.value }))}
                  placeholder="e.g., TensorFlow, PyTorch, ONNX"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="License"
                  value={modelData.license}
                  onChange={(e) => setModelData(prev => ({ ...prev, license: e.target.value }))}
                  placeholder="e.g., MIT, Apache 2.0, Commercial"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={modelData.intellectualPropertyProtection}
                      onChange={(e) => setModelData(prev => ({ 
                        ...prev, 
                        intellectualPropertyProtection: e.target.checked 
                      }))}
                    />
                  }
                  label="Enable Intellectual Property Protection (Recommended)"
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  When enabled, your model will be encrypted and only decrypted within verified TEE environments.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Model Files
            </Typography>
            
            {/* Main Model File */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Model File (Required)
                </Typography>
                <Box
                  {...modelDropzone.getRootProps()}
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: modelDropzone.isDragActive ? '#f5f5f5' : 'transparent'
                  }}
                >
                  <input {...modelDropzone.getInputProps()} />
                  <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                  {modelFiles.modelFile ? (
                    <Typography variant="body1" color="primary">
                      Selected: {modelFiles.modelFile.name}
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="body1">
                        Drag & drop your model file here, or click to select
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Supported: .pkl, .h5, .pt, .pth, .onnx, .pb, .zip, .tar
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Configuration File */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Configuration File (Optional)
                </Typography>
                <Box
                  {...configDropzone.getRootProps()}
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: configDropzone.isDragActive ? '#f5f5f5' : 'transparent'
                  }}
                >
                  <input {...configDropzone.getInputProps()} />
                  {modelFiles.configFile ? (
                    <Typography variant="body2" color="primary">
                      Selected: {modelFiles.configFile.name}
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      Model configuration (.json, .yml, .yaml)
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Documentation File */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Documentation (Optional)
                </Typography>
                <Box
                  {...documentationDropzone.getRootProps()}
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: documentationDropzone.isDragActive ? '#f5f5f5' : 'transparent'
                  }}
                >
                  <input {...documentationDropzone.getInputProps()} />
                  {modelFiles.documentationFile ? (
                    <Typography variant="body2" color="primary">
                      Selected: {modelFiles.documentationFile.name}
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      Model documentation (.pdf, .md, .txt, .doc)
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Checksum File */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Checksum File (Optional)
                </Typography>
                <Box
                  {...checksumDropzone.getRootProps()}
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: checksumDropzone.isDragActive ? '#f5f5f5' : 'transparent'
                  }}
                >
                  <input {...checksumDropzone.getInputProps()} />
                  {modelFiles.checksumFile ? (
                    <Typography variant="body2" color="primary">
                      Selected: {modelFiles.checksumFile.name}
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      File integrity verification (.sha256, .md5)
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Encryption Configuration
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Encryption protects your intellectual property and ensures only authorized TEE environments can access your model.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={encryptionConfig.encryptionEnabled}
                      onChange={(e) => setEncryptionConfig(prev => ({ 
                        ...prev, 
                        encryptionEnabled: e.target.checked 
                      }))}
                    />
                  }
                  label="Enable Model Encryption (Highly Recommended)"
                />
              </Grid>

              {encryptionConfig.encryptionEnabled && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Encryption Algorithm</InputLabel>
                      <Select
                        value={encryptionConfig.algorithm}
                        onChange={(e) => setEncryptionConfig(prev => ({ 
                          ...prev, 
                          algorithm: e.target.value 
                        }))}
                      >
                        <MenuItem value="AES-256-GCM">AES-256-GCM (Recommended)</MenuItem>
                        <MenuItem value="AES-256-CBC">AES-256-CBC</MenuItem>
                        <MenuItem value="ChaCha20-Poly1305">ChaCha20-Poly1305</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Key Management</InputLabel>
                      <Select
                        value={encryptionConfig.keyManagement}
                        onChange={(e) => setEncryptionConfig(prev => ({ 
                          ...prev, 
                          keyManagement: e.target.value 
                        }))}
                      >
                        <MenuItem value="platform">Platform Managed (Recommended)</MenuItem>
                        <MenuItem value="user">User Managed</MenuItem>
                        <MenuItem value="hsm">Hardware Security Module</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={encryptionConfig.teeRequired}
                          onChange={(e) => setEncryptionConfig(prev => ({ 
                            ...prev, 
                            teeRequired: e.target.checked 
                          }))}
                        />
                      }
                      label="Require Trusted Execution Environment (TEE)"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      When enabled, your model can only be decrypted within verified TEE environments.
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security & Verification
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Security Options
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securityConfig.digitalSignature}
                          onChange={(e) => setSecurityConfig(prev => ({ 
                            ...prev, 
                            digitalSignature: e.target.checked 
                          }))}
                        />
                      }
                      label="Digital Signature"
                    />
                    <br />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securityConfig.provenanceTracking}
                          onChange={(e) => setSecurityConfig(prev => ({ 
                            ...prev, 
                            provenanceTracking: e.target.checked 
                          }))}
                        />
                      }
                      label="Provenance Tracking"
                    />
                    <br />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securityConfig.auditLogging}
                          onChange={(e) => setSecurityConfig(prev => ({ 
                            ...prev, 
                            auditLogging: e.target.checked 
                          }))}
                        />
                      }
                      label="Audit Logging"
                    />
                    <br />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securityConfig.integrityVerification}
                          onChange={(e) => setSecurityConfig(prev => ({ 
                            ...prev, 
                            integrityVerification: e.target.checked 
                          }))}
                        />
                      }
                      label="Integrity Verification"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Validation Results
                    </Typography>
                    
                    {Object.entries(validationResults).map(([key, result]) => (
                      <Box key={key} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {result.status === 'loading' && <CircularProgress size={16} sx={{ mr: 1 }} />}
                          {result.status === 'success' && <Check color="success" sx={{ mr: 1 }} />}
                          {result.status === 'error' && <ErrorIcon color="error" sx={{ mr: 1 }} />}
                          {result.status === 'pending' && <Warning color="warning" sx={{ mr: 1 }} />}
                          
                          <Typography variant="body2">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {result.message}
                        </Typography>
                      </Box>
                    ))}

                    {loading && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Running security validations...
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Model Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Name:</Typography>
                    <Typography variant="body2">{modelData.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Type:</Typography>
                    <Typography variant="body2">{modelData.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Framework:</Typography>
                    <Typography variant="body2">{modelData.framework}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Version:</Typography>
                    <Typography variant="body2">{modelData.version}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Uploaded Files
                </Typography>
                {modelFiles.modelFile && (
                  <Chip 
                    icon={<Check />} 
                    label={`Model: ${modelFiles.modelFile.name}`} 
                    color="primary" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                )}
                {modelFiles.configFile && (
                  <Chip 
                    icon={<Check />} 
                    label={`Config: ${modelFiles.configFile.name}`} 
                    color="primary" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                )}
                {modelFiles.documentationFile && (
                  <Chip 
                    icon={<Check />} 
                    label={`Docs: ${modelFiles.documentationFile.name}`} 
                    color="primary" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                )}
                {modelFiles.checksumFile && (
                  <Chip 
                    icon={<Check />} 
                    label={`Checksum: ${modelFiles.checksumFile.name}`} 
                    color="primary" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Security Configuration
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {encryptionConfig.encryptionEnabled && (
                    <Chip icon={<Security />} label="Encryption Enabled" color="success" />
                  )}
                  {encryptionConfig.teeRequired && (
                    <Chip icon={<Verified />} label="TEE Required" color="success" />
                  )}
                  {securityConfig.digitalSignature && (
                    <Chip icon={<Security />} label="Digital Signature" color="primary" />
                  )}
                  {securityConfig.provenanceTracking && (
                    <Chip icon={<Security />} label="Provenance Tracking" color="primary" />
                  )}
                </Box>
              </CardContent>
            </Card>

            {uploadProgress > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Upload Progress: {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // Access control (must be after hooks are declared)
  if (!isTDC()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Only TDC (Training Data Consumer) users can upload AI models.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Upload AI Model
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Upload your AI model with enhanced security and intellectual property protection.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !modelFiles.modelFile}
                startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {loading ? 'Uploading...' : 'Upload Model'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TDCModelUpload;
