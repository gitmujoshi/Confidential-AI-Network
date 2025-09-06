import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  CorporateFare as CorporateFareIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { api } from '../services/api';

const ContractTemplateSelector = ({ 
  onTemplateSelect, 
  dataset, 
  userPreferences = {}, 
  showRecommendations = false,
  selectedTemplate = null // Add selectedTemplate prop
}) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedContractType, setSelectedContractType] = useState('');
  
  // Categories and contract types
  const categories = ['RESEARCH', 'COMMERCIAL', 'ENTERPRISE', 'CUSTOM'];
  const contractTypes = ['AI_TRAINING', 'BASIC', 'CUSTOM'];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (showRecommendations && dataset) {
      loadRecommendations();
    }
  }, [dataset, showRecommendations]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory, selectedContractType]);

  const loadTemplates = async () => {
          try {
        setLoading(true);
        const response = await api.get('/api/contract-templates');
        
        if (response.data.success) {
          setTemplates(response.data.data);
          setFilteredTemplates(response.data.data);
        } else {
          setError('Failed to load templates');
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setError('Failed to load contract templates');
      } finally {
        setLoading(false);
      }
  };

  const loadRecommendations = async () => {
    try {
      const response = await api.post('/api/contract-templates/recommendations', {
        dataset,
        userPreferences
      });
      
      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply contract type filter
    if (selectedContractType) {
      filtered = filtered.filter(template => template.contractType === selectedContractType);
    }

    setFilteredTemplates(filtered);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'RESEARCH':
        return <SchoolIcon />;
      case 'COMMERCIAL':
        return <BusinessIcon />;
      case 'ENTERPRISE':
        return <CorporateFareIcon />;
      case 'CUSTOM':
        return <BuildIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'RESEARCH':
        return 'primary';
      case 'COMMERCIAL':
        return 'success';
      case 'ENTERPRISE':
        return 'warning';
      case 'CUSTOM':
        return 'info';
      default:
        return 'default';
    }
  };

  const calculateTemplatePrice = (template, datasetPrice) => {
    const basePrice = parseFloat(template.basePrice) || 0;
    const multiplierPrice = parseFloat(datasetPrice || 0) * parseFloat(template.priceMultiplier || 1);
    return basePrice + multiplierPrice;
  };

  const handleTemplateSelect = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const renderTemplateCard = (template, isRecommendation = false) => {
    const datasetPrice = dataset?.price || 0;
    const templatePrice = calculateTemplatePrice(template, datasetPrice);
    const popularity = Math.min((template.usageCount || 0) / 10, 5);

    return (
              <Card 
          key={template.id} 
          sx={{ 
            mb: 2, 
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3
            },
            border: selectedTemplate?.id === template.id 
              ? '3px solid #1976d2' 
              : isRecommendation 
                ? '2px solid #1976d2' 
                : '1px solid #e0e0e0',
            backgroundColor: selectedTemplate?.id === template.id ? '#f3f8ff' : 'inherit',
            boxShadow: selectedTemplate?.id === template.id ? 4 : 1
          }}
          onClick={() => handleTemplateSelect(template)}
        >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" component="h3" gutterBottom>
                {template.name}
                {isRecommendation && (
                  <Chip 
                    label="Recommended" 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {getCategoryIcon(template.category)}
                <Chip 
                  label={template.category} 
                  color={getCategoryColor(template.category)} 
                  size="small" 
                />
                <Chip 
                  label={template.contractType} 
                  variant="outlined" 
                  size="small" 
                />
              </Box>
            </Box>
            <Box textAlign="right">
              <Typography variant="h6" color="primary">
                ${templatePrice.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {template.priceMultiplier}x multiplier
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={2}>
            {template.description}
          </Typography>

          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box display="flex" alignItems="center">
              <StarIcon color="primary" fontSize="small" />
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {popularity.toFixed(1)} ({template.usageCount} uses)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Duration: {template.standardDuration} days
            </Typography>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {(template.tags || []).map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                size="small" 
                variant="outlined" 
              />
            ))}
          </Box>

          {isRecommendation && recommendations.length > 0 && (
            <Box>
              <Typography variant="body2" color="primary" gutterBottom>
                Why recommended:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {recommendations
                  .find(rec => rec.template.id === template.id)
                  ?.reasons.map((reason, index) => (
                    <Chip 
                      key={index} 
                      label={reason} 
                      size="small" 
                      color="success" 
                      variant="outlined" 
                    />
                  ))}
              </Box>
            </Box>
          )}

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" color="primary">
                View Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Terms & Conditions:</strong>
              </Typography>
              <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
                {template.termsAndConditions}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" paragraph>
                <strong>Privacy Settings:</strong>
              </Typography>
              {template.privacySettings && (
                <Box>
                  <Typography variant="body2">
                    • Differential Privacy: {template.privacySettings.differentialPrivacy?.enabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Typography variant="body2">
                    • Federated Learning: {template.privacySettings.federatedLearning?.enabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Typography variant="body2">
                    • Data Retention: {template.privacySettings.dataRetention || 'Not specified'}
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" paragraph>
                <strong>Training Environment:</strong>
              </Typography>
              {template.trainingEnvironmentSpecs && (
                <Box>
                  <Typography variant="body2">
                    • Compute: {template.trainingEnvironmentSpecs.computeRequirements || 'Not specified'}
                  </Typography>
                  <Typography variant="body2">
                    • Security: {template.trainingEnvironmentSpecs.securityLevel || 'Not specified'}
                  </Typography>
                  <Typography variant="body2">
                    • Compliance: {template.trainingEnvironmentSpecs.compliance?.join(', ') || 'Not specified'}
                  </Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          <Box mt={2}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                handleTemplateSelect(template);
              }}
            >
              Select This Template
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Contract Template
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Choose a contract template that best fits your needs. Templates provide predefined terms, 
        pricing structures, and compliance settings.
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Templates"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, description, or tags..."
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Contract Type</InputLabel>
              <Select
                value={selectedContractType}
                label="Contract Type"
                onChange={(e) => setSelectedContractType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {contractTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedContractType('');
              }}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary">
            🎯 Recommended Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Based on your dataset and preferences, we recommend these templates:
          </Typography>
          {recommendations.slice(0, 3).map(recommendation => 
            renderTemplateCard(recommendation.template, true)
          )}
        </Box>
      )}

      {/* All Templates */}
      <Box>
        <Typography variant="h6" gutterBottom>
          All Available Templates ({filteredTemplates.length})
        </Typography>
        
        {filteredTemplates.length === 0 ? (
          <Alert severity="info">
            No templates match your current filters. Try adjusting your search criteria.
          </Alert>
        ) : (
          filteredTemplates.map(template => renderTemplateCard(template))
        )}
      </Box>
    </Box>
  );
};

export default ContractTemplateSelector; 