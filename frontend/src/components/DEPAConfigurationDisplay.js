import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Collapse,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

/**
 * DEPA Configuration Display Component
 * 
 * This component displays DEPA ID configuration information in a READ-ONLY format.
 * It should be used in:
 * - User registration page (to show what DEPA ID will be assigned)
 * - Profile page (to show current DEPA ID configuration)
 * - Dashboard pages (to show DEPA ID context)
 * 
 * The configuration is NEVER editable by users - it's set by system administrators
 * during deployment and cannot be changed by individual users.
 */
const DEPAConfigurationDisplay = ({ 
  user, 
  compact = false, 
  showFormat = true,
  showDeploymentInfo = true,
  showRegulatoryInfo = true,
  title = "DEPA ID Configuration",
  defaultExpanded = false
}) => {
  const [config, setConfig] = useState(null);
  const [formatExplanation, setFormatExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    fetchDEPAConfiguration();
  }, []);

  const fetchDEPAConfiguration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [DEPAConfigurationDisplay] Fetching DEPA configuration...');
      const [configResponse, formatResponse] = await Promise.all([
        apiService.get('/api/depa/configuration'),
        showFormat ? apiService.get('/api/depa/format-explanation') : Promise.resolve({ success: false })
      ]);

      console.log('🔍 [DEPAConfigurationDisplay] Config response:', configResponse);
      console.log('🔍 [DEPAConfigurationDisplay] Format response:', formatResponse);

      if (configResponse.success) {
        setConfig(configResponse.config);
        console.log('✅ [DEPAConfigurationDisplay] Config set successfully');
      } else {
        console.error('❌ [DEPAConfigurationDisplay] Config response not successful:', configResponse);
      }
      
      if (formatResponse.success) {
        setFormatExplanation(formatResponse.explanation);
        console.log('✅ [DEPAConfigurationDisplay] Format explanation set successfully');
      } else {
        console.log('ℹ️ [DEPAConfigurationDisplay] Format explanation not requested or failed');
      }
    } catch (err) {
      console.error('❌ [DEPAConfigurationDisplay] Error fetching DEPA configuration:', err);
      setError('Failed to load DEPA configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2">Loading DEPA configuration...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {title}
            </Typography>
          </Box>
          {!compact && (
            <IconButton onClick={handleExpandClick}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        {/* Read-Only Notice */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Read-Only Configuration:</strong> DEPA ID configuration is set by system administrators 
            during deployment and cannot be modified by users.
          </Typography>
        </Alert>

        {/* User DEPA ID (if available) */}
        {user?.depaId && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Your DEPA ID:</strong>
            </Typography>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                border: '1px solid', 
                borderColor: 'grey.300',
                borderRadius: 1
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: compact ? '0.9rem' : '1rem',
                  wordBreak: 'break-all',
                  color: 'text.primary'
                }}
              >
                {user.depaId}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Compact View */}
        {compact && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={config.prefix} 
              size="small" 
              variant="outlined"
              color="primary"
              icon={<PublicIcon />}
            />
            <Typography variant="caption" color="text.secondary">
              {config.region}, {config.country}
            </Typography>
            <Chip 
              label={config.jurisdiction} 
              size="small" 
              variant="outlined"
              color="secondary"
            />
          </Box>
        )}

        {/* Expanded View */}
        {!compact && (
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              {/* DEPA ID Format */}
              {showFormat && formatExplanation && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 1, fontSize: '1rem' }} />
                    DEPA ID Format
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Format:</strong> {formatExplanation.format}
                  </Typography>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50', 
                      border: '1px solid', 
                      borderColor: 'grey.300',
                      borderRadius: 1,
                      mb: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      Example: {formatExplanation.examples[0]}
                    </Typography>
                  </Paper>
                  <Grid container spacing={1}>
                    {formatExplanation.components.map((component, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>{component.name}:</strong> {component.description}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Deployment Configuration */}
              {showDeploymentInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1, fontSize: '1rem' }} />
                    Deployment Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Deployment ID:</strong> {config.deploymentId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Prefix:</strong> {config.prefix}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Region:</strong> {config.region}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Country:</strong> {config.country}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Jurisdiction:</strong> {config.jurisdiction}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Data Residency:</strong> {config.dataResidency}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Timezone:</strong> {config.timezone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Currency:</strong> {config.currency}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Regulatory Framework */}
              {showRegulatoryInfo && config.regulatoryFramework && config.regulatoryFramework.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ mr: 1, fontSize: '1rem' }} />
                    Regulatory Framework
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {config.regulatoryFramework.map((framework, index) => (
                      <Chip 
                        key={index}
                        label={framework} 
                        size="small" 
                        variant="outlined"
                        color="secondary"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Entity Types */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Supported Entity Types
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {config.entityTypes?.map((entityType, index) => (
                    <Chip 
                      key={index}
                      label={entityType} 
                      size="small" 
                      variant="filled"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};

export default DEPAConfigurationDisplay;
