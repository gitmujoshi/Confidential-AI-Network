import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Switch,
  FormHelperText,
  Autocomplete,
  CircularProgress,
  InputAdornment,
  Tooltip,
  IconButton,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  Upload,
  Info,
  Security,
  AttachMoney,
  Storage,
  Dataset as DatasetIcon,
  Label,
  Visibility,
  VisibilityOff,
  Lock,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import {
  DATA_CLASSIFICATIONS,
  ENCRYPTION_ALGORITHMS,
  DATA_RESIDENCY_REGIONS,
  PROCESSING_LOCATIONS,
  PRIVACY_TECHNIQUES,
  QUALITY_METRICS,
  COMPLIANCE_REQUIREMENTS,
  DATASET_CATEGORIES,
  getConstraintsByClassification,
  validateProcessingLocation,
  getRecommendedValues
} from '../config/datasetConstraints';

// Dataset categories are now imported from config/datasetConstraints.js

// All constraint arrays are now imported from config/datasetConstraints.js

const steps = [
  'Basic Information',
  'Data Details',
  'Privacy & Security',
  'Security & Compliance',
  'Quality & Compliance',
  'Training files',
  'Review & Submit'
];

function AddDataset() {
  const navigate = useNavigate();
  const { currentUser: user } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    category: '',
    tags: [],
    newTag: '',
    
    // Data Details
    size: '',
    recordCount: '',
    format: '',
    source: '',
    collectionMethod: '',
    updateFrequency: '',
    retentionPeriod: '',
    
    // Privacy & Security
    privacyTechniques: [],
    confidentialComputingRequired: false,
    dataAnonymizationLevel: '',
    accessRestrictions: '',
    encryptionRequired: false,
    
    // Security & Compliance
    dataClassification: 'INTERNAL',
    secureEnclaveRequired: false,
    attestationRequired: false,
    encryptionAlgorithm: 'AES-256-GCM',
    encryptionAtRest: true,
    encryptionInTransit: true,
    dataResidencyRegion: '',
    processingLocation: '',
    crossBorderTransferAllowed: false,
    attestationPolicy: {},
    accessControlPolicy: {},
    retentionPolicy: {},
    auditConfiguration: {},
    
    // Quality & Compliance
    qualityMetrics: [],
    complianceRequirements: [],
    dataGovernance: '',
    auditTrail: false,
    
    // Additional
    pricing: '',
    license: '',
    contactInfo: ''
  });

  const [errors, setErrors] = useState({});
  const [artifactFiles, setArtifactFiles] = useState([]);
  const [artifactContentFormat, setArtifactContentFormat] = useState('csv');

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.get('/api/datasets/categories/list');
        setCategories(response.data || DATASET_CATEGORIES);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories(DATASET_CATEGORIES);
      }
    };
    loadCategories();
  }, []);

  // Role-based access control
  if (user && user.partyType !== 'TDP') {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Access Denied</AlertTitle>
          Only Training Data Providers (TDP) can add datasets.
        </Alert>
      </Box>
    );
  }

  // If no user, show loading
  if (!user) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) newErrors.name = 'Dataset name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 1: // Data Details
        if (!formData.size.trim()) newErrors.size = 'Dataset size is required';
        if (!formData.recordCount.trim()) newErrors.recordCount = 'Record count is required';
        if (!formData.format.trim()) newErrors.format = 'Data format is required';
        break;
      case 2: // Privacy & Security
        if (formData.privacyTechniques.length === 0) {
          newErrors.privacyTechniques = 'At least one privacy technique is required';
        }
        break;
      case 5: // Training files — optional
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    try {
      // Generate a unique dataset ID
      const datasetId = `DATASET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const sizeMb = parseInt(String(formData.size).replace(/[^\d]/g, ''), 10);
      const datasetData = {
        // Required fields for backend API
        datasetId: datasetId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        size: Number.isFinite(sizeMb) && sizeMb > 0 ? sizeMb : 1,
        recordCount: formData.recordCount || 1000, // Default record count if not provided
        price: parseFloat(formData.pricing) || 0, // Convert pricing to number
        license: formData.license,
        ownerId: user.id,
        
        // Optional fields
        tags: formData.tags,
        metadata: {
          format: formData.format,
          source: formData.source,
          collectionMethod: formData.collectionMethod,
          updateFrequency: formData.updateFrequency,
          retentionPeriod: formData.retentionPeriod,
          privacyTechniques: formData.privacyTechniques,
          dataAnonymizationLevel: formData.dataAnonymizationLevel,
          accessRestrictions: formData.accessRestrictions,
          qualityMetrics: formData.qualityMetrics,
          complianceRequirements: formData.complianceRequirements,
          dataGovernance: formData.dataGovernance,
          contactInfo: formData.contactInfo
        },
        isPublic: true,
        confidentialComputingRequired: formData.confidentialComputingRequired,
        encryptionRequired: formData.encryptionRequired,
        auditTrail: formData.auditTrail,
        
        // Security and compliance fields
        data_classification: formData.dataClassification,
        secure_enclave_required: formData.secureEnclaveRequired,
        attestation_required: formData.attestationRequired,
        encryption_algorithm: formData.encryptionAlgorithm,
        encryption_at_rest: formData.encryptionAtRest,
        encryption_in_transit: formData.encryptionInTransit,
        data_residency_region: formData.dataResidencyRegion,
        processing_location: formData.processingLocation,
        cross_border_transfer_allowed: formData.crossBorderTransferAllowed,
        attestation_policy: formData.attestationPolicy,
        access_control_policy: formData.accessControlPolicy,
        retention_policy: formData.retentionPolicy,
        audit_configuration: formData.auditConfiguration
      };

      console.log('📤 Sending dataset data:', datasetData);

      const response = await apiService.post('/api/datasets', datasetData);
      const body = response?.data ?? response;
      const created = body?.dataset ?? body;
      const catalogDatasetId = created?.datasetId;

      if (artifactFiles.length > 0 && catalogDatasetId) {
        const fd = new FormData();
        artifactFiles.forEach((f) => fd.append('files', f));
        fd.append('contentFormat', artifactContentFormat || 'csv');
        await apiService.uploadDatasetArtifacts(catalogDatasetId, fd);
      }

      console.log('✅ Dataset creation response:', body);

      toast.success('Dataset created successfully!');
      navigate('/datasets');
    } catch (error) {
      console.error('Failed to create dataset:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to create dataset: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dataset Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.category} required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="License"
                value={formData.license}
                onChange={(e) => handleInputChange('license', e.target.value)}
                placeholder="e.g., MIT, Apache 2.0, Commercial"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Add Tag"
                  value={formData.newTag}
                  onChange={(e) => handleInputChange('newTag', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  sx={{ minWidth: 200 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddTag}
                  disabled={!formData.newTag.trim()}
                >
                  Add Tag
                </Button>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dataset Size"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                error={!!errors.size}
                helperText={errors.size || "e.g., 1GB, 10,000 records"}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Record Count"
                type="number"
                value={formData.recordCount}
                onChange={(e) => handleInputChange('recordCount', e.target.value)}
                error={!!errors.recordCount}
                helperText={errors.recordCount || "Number of records in the dataset"}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data Format"
                value={formData.format}
                onChange={(e) => handleInputChange('format', e.target.value)}
                error={!!errors.format}
                helperText={errors.format || "e.g., CSV, JSON, Parquet, Images"}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Data Source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="e.g., Internal database, External API, Manual collection"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Collection Method"
                value={formData.collectionMethod}
                onChange={(e) => handleInputChange('collectionMethod', e.target.value)}
                placeholder="e.g., Automated scraping, Survey, Sensor data"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Update Frequency"
                value={formData.updateFrequency}
                onChange={(e) => handleInputChange('updateFrequency', e.target.value)}
                placeholder="e.g., Daily, Weekly, Monthly, On-demand"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Retention Period"
                value={formData.retentionPeriod}
                onChange={(e) => handleInputChange('retentionPeriod', e.target.value)}
                placeholder="e.g., 1 year, 5 years, Indefinite"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.privacyTechniques} required>
                <InputLabel>Privacy Techniques *</InputLabel>
                <Select
                  multiple
                  value={formData.privacyTechniques}
                  onChange={(e) => handleInputChange('privacyTechniques', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {PRIVACY_TECHNIQUES.map((technique) => (
                    <MenuItem key={technique.value} value={technique.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip 
                          label={technique.recommended ? 'Recommended' : ''} 
                          size="small" 
                          color="primary" 
                          sx={{ mr: 1, display: technique.recommended ? 'block' : 'none' }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {technique.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {technique.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Category: {technique.category}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select privacy techniques to protect sensitive data during processing
                </FormHelperText>
                {errors.privacyTechniques && <FormHelperText error>{errors.privacyTechniques}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.confidentialComputingRequired}
                    onChange={(e) => handleInputChange('confidentialComputingRequired', e.target.checked)}
                  />
                }
                label="Confidential Computing Required"
              />
              <FormHelperText>
                Enable if the dataset requires confidential computing environment for processing
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data Anonymization Level"
                value={formData.dataAnonymizationLevel}
                onChange={(e) => handleInputChange('dataAnonymizationLevel', e.target.value)}
                placeholder="e.g., Low, Medium, High, Complete"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Access Restrictions"
                value={formData.accessRestrictions}
                onChange={(e) => handleInputChange('accessRestrictions', e.target.value)}
                placeholder="e.g., IP whitelist, Time-based, Role-based"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.encryptionRequired}
                    onChange={(e) => handleInputChange('encryptionRequired', e.target.checked)}
                  />
                }
                label="Encryption Required"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Security & Compliance Configuration
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Data Classification *</InputLabel>
                <Select
                  value={formData.dataClassification}
                  onChange={(e) => {
                    const classification = e.target.value;
                    handleInputChange('dataClassification', classification);
                    
                    // Auto-apply recommended settings based on classification
                    const recommended = getRecommendedValues(classification);
                    if (recommended.secureEnclaveRequired !== undefined) {
                      handleInputChange('secureEnclaveRequired', recommended.secureEnclaveRequired);
                    }
                    if (recommended.attestationRequired !== undefined) {
                      handleInputChange('attestationRequired', recommended.attestationRequired);
                    }
                    if (recommended.encryptionRequired !== undefined) {
                      handleInputChange('encryptionRequired', recommended.encryptionRequired);
                    }
                  }}
                >
                  {DATA_CLASSIFICATIONS.map((classification) => (
                    <MenuItem key={classification.value} value={classification.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography sx={{ mr: 1 }}>{classification.icon}</Typography>
                        <Box>
                          <Typography variant="body2" fontWeight="bold" color={classification.color}>
                            {classification.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {classification.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Classification determines security requirements and access controls
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Encryption Algorithm *</InputLabel>
                <Select
                  value={formData.encryptionAlgorithm}
                  onChange={(e) => handleInputChange('encryptionAlgorithm', e.target.value)}
                >
                  {ENCRYPTION_ALGORITHMS.map((algorithm) => (
                    <MenuItem key={algorithm.value} value={algorithm.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Chip 
                          label={algorithm.recommended ? 'Recommended' : ''} 
                          size="small" 
                          color="primary" 
                          sx={{ mr: 1, display: algorithm.recommended ? 'block' : 'none' }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {algorithm.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {algorithm.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Security: {algorithm.security} | Performance: {algorithm.performance}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Choose encryption algorithm based on security and performance requirements
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Data Residency Region *</InputLabel>
                <Select
                  value={formData.dataResidencyRegion}
                  onChange={(e) => handleInputChange('dataResidencyRegion', e.target.value)}
                >
                  {DATA_RESIDENCY_REGIONS.map((region) => (
                    <MenuItem key={region.value} value={region.value}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {region.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {region.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Compliance: {region.compliance.join(', ')}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Geographic region where data must be stored
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Processing Location *</InputLabel>
                <Select
                  value={formData.processingLocation}
                  onChange={(e) => handleInputChange('processingLocation', e.target.value)}
                  error={formData.dataResidencyRegion && formData.processingLocation && 
                         !validateProcessingLocation(formData.dataResidencyRegion, formData.processingLocation)}
                >
                  {PROCESSING_LOCATIONS
                    .filter(location => 
                      !formData.dataResidencyRegion || 
                      location.allowedFor.includes(formData.dataResidencyRegion)
                    )
                    .map((location) => (
                    <MenuItem key={location.value} value={location.value}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {location.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {location.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {formData.dataResidencyRegion && formData.processingLocation && 
                   !validateProcessingLocation(formData.dataResidencyRegion, formData.processingLocation) 
                   ? 'Processing location must be compatible with data residency region'
                   : 'Allowed geographic regions for data processing'
                  }
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Security Requirements
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.secureEnclaveRequired}
                      onChange={(e) => handleInputChange('secureEnclaveRequired', e.target.checked)}
                      disabled={formData.dataClassification === 'PUBLIC' || formData.dataClassification === 'INTERNAL'}
                    />
                  }
                  label="Secure Enclave Required"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.attestationRequired}
                      onChange={(e) => handleInputChange('attestationRequired', e.target.checked)}
                      disabled={formData.dataClassification === 'PUBLIC' || formData.dataClassification === 'INTERNAL'}
                    />
                  }
                  label="Attestation Required"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.encryptionAtRest}
                      onChange={(e) => handleInputChange('encryptionAtRest', e.target.checked)}
                    />
                  }
                  label="Encryption at Rest"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.encryptionInTransit}
                      onChange={(e) => handleInputChange('encryptionInTransit', e.target.checked)}
                    />
                  }
                  label="Encryption in Transit"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.crossBorderTransferAllowed}
                      onChange={(e) => handleInputChange('crossBorderTransferAllowed', e.target.checked)}
                    />
                  }
                  label="Cross-Border Transfer Allowed"
                />
              </Stack>
              <FormHelperText>
                Security requirements are automatically set based on data classification
              </FormHelperText>
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Quality Metrics</InputLabel>
                <Select
                  multiple
                  value={formData.qualityMetrics}
                  onChange={(e) => handleInputChange('qualityMetrics', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {QUALITY_METRICS.map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {metric.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {metric.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Category: {metric.category}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select quality metrics to measure dataset reliability and accuracy
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Compliance Requirements</InputLabel>
                <Select
                  multiple
                  value={formData.complianceRequirements}
                  onChange={(e) => handleInputChange('complianceRequirements', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {COMPLIANCE_REQUIREMENTS.map((requirement) => (
                    <MenuItem key={requirement.value} value={requirement.value}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {requirement.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {requirement.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Region: {requirement.region} | Category: {requirement.category}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select applicable compliance requirements for your dataset
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Data Governance"
                value={formData.dataGovernance}
                onChange={(e) => handleInputChange('dataGovernance', e.target.value)}
                placeholder="Describe data governance policies and procedures"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.auditTrail}
                    onChange={(e) => handleInputChange('auditTrail', e.target.checked)}
                  />
                }
                label="Audit Trail Required"
              />
            </Grid>
          </Grid>
        );

      case 5:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Training files (recommended)</AlertTitle>
                Upload real data files so local Docker training (<code>TRAINING_EXECUTION_MODE=local-docker</code>)
                can train on your CSV instead of built-in demo datasets. Tabular datasets: numeric columns plus an
                integer label in the <strong>last column</strong>.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Artifact format hint</InputLabel>
                <Select
                  value={artifactContentFormat}
                  label="Artifact format hint"
                  onChange={(e) => setArtifactContentFormat(e.target.value)}
                >
                  <MenuItem value="csv">CSV (tabular)</MenuItem>
                  <MenuItem value="image_folder">Image folder (future)</MenuItem>
                  <MenuItem value="parquet">Parquet (future)</MenuItem>
                </Select>
                <FormHelperText>Used by the local trainer to pick loaders.</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" startIcon={<Upload />}>
                Choose files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => {
                    const list = e.target.files ? Array.from(e.target.files) : [];
                    setArtifactFiles(list);
                  }}
                />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {artifactFiles.length === 0
                  ? 'No files selected — you can upload later from the dataset detail page.'
                  : `${artifactFiles.length} file(s), ${artifactFiles.reduce((s, f) => s + (f.size || 0), 0)} bytes total`}
              </Typography>
              {artifactFiles.length > 0 && (
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {artifactFiles.map((f) => (
                    <Typography key={f.name + f.size} variant="caption" display="block">
                      {f.name} ({Math.round((f.size || 0) / 1024)} KB)
                    </Typography>
                  ))}
                </Stack>
              )}
            </Grid>
          </Grid>
        );

      case 6:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Dataset Summary
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Name:</strong> {formData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Category:</strong> {formData.category}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Size:</strong> {formData.size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Records:</strong> {formData.recordCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Format:</strong> {formData.format}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Training files:</strong>{' '}
                  {artifactFiles.length > 0
                    ? `${artifactFiles.length} file(s) queued for upload`
                    : 'None (optional)'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Privacy Techniques:</strong> {formData.privacyTechniques.join(', ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Confidential Computing:</strong> {formData.confidentialComputingRequired ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Data Classification:</strong> {formData.dataClassification}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Secure Enclave Required:</strong> {formData.secureEnclaveRequired ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Attestation Required:</strong> {formData.attestationRequired ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Encryption Algorithm:</strong> {formData.encryptionAlgorithm}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Data Residency:</strong> {formData.dataResidencyRegion || 'Not specified'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pricing (Optional)"
                value={formData.pricing}
                onChange={(e) => handleInputChange('pricing', e.target.value)}
                placeholder="e.g., $100/month, Free, Contact for pricing"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Information"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                placeholder="Email or phone for inquiries"
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add New Dataset
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create a new dataset for sharing with training data consumers.
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/datasets')}
              >
                Cancel
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                >
                  {loading ? 'Creating...' : 'Create Dataset'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AddDataset;