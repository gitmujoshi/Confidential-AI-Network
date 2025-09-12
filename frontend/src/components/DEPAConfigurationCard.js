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
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

const DEPAConfigurationCard = ({ user, compact = false }) => {
  const [config, setConfig] = useState(null);
  const [formatExplanation, setFormatExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (user?.depaId) {
      fetchDEPAConfiguration();
    }
  }, [user]);

  const fetchDEPAConfiguration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [configResponse, formatResponse] = await Promise.all([
        apiService.get('/api/depa/configuration'),
        apiService.get('/api/depa/format-explanation')
      ]);

      if (configResponse.success) {
        setConfig(configResponse.config);
      }
      
      if (formatResponse.success) {
        setFormatExplanation(formatResponse.explanation);
      }
    } catch (err) {
      console.error('Error fetching DEPA configuration:', err);
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

  if (!config || !user?.depaId) {
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
              {compact ? 'DEPA ID' : 'DEPA ID Configuration'}
            </Typography>
          </Box>
          {!compact && (
            <IconButton onClick={handleExpandClick}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        {/* User DEPA ID */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Your DEPA ID:</strong>
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontFamily: 'monospace', 
              fontSize: compact ? '0.9rem' : '1rem',
              wordBreak: 'break-all',
              bgcolor: 'grey.100',
              p: 1,
              borderRadius: 1
            }}
          >
            {user.depaId}
          </Typography>
        </Box>

        {/* Compact View */}
        {compact && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={config.prefix} 
              size="small" 
              variant="outlined"
              color="primary"
            />
            <Typography variant="caption" color="text.secondary">
              {config.region}, {config.country}
            </Typography>
          </Box>
        )}

        {/* Expanded View */}
        {!compact && (
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              {/* DEPA ID Format */}
              {formatExplanation && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 1, fontSize: '1rem' }} />
                    DEPA ID Format
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Format:</strong> {formatExplanation.format}
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      Example: {formatExplanation.examples[0]}
                    </Typography>
                  </Box>
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
              <Typography variant="subtitle2" gutterBottom>
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

              {/* Regulatory Framework */}
              {config.regulatoryFramework && config.regulatoryFramework.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Regulatory Framework:</strong>
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
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};

export default DEPAConfigurationCard;
