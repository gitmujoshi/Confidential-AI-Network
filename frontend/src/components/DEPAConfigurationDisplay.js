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
  Public as PublicIcon,
  Business as BusinessIcon
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
  showDeploymentInfo = true,
  title = "DEPA ID Configuration"
}) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDEPAConfiguration();
  }, []);

  const fetchDEPAConfiguration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [DEPAConfigurationDisplay] Fetching DEPA configuration...');
      const configResponse = await apiService.getDEPAConfiguration();

      console.log('🔍 [DEPAConfigurationDisplay] Config response:', configResponse);

      if (configResponse.success) {
        setConfig(configResponse.config);
        console.log('✅ [DEPAConfigurationDisplay] Config set successfully');
      } else {
        console.error('❌ [DEPAConfigurationDisplay] Config response not successful:', configResponse);
      }
    } catch (err) {
      console.error('❌ [DEPAConfigurationDisplay] Error fetching DEPA configuration:', err);
      setError('Failed to load DEPA configuration');
    } finally {
      setLoading(false);
    }
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

        {/* User DEPA ID (if available) */}
        {user?.depaId && (
          <Box sx={{ mb: compact ? 0 : 2 }}>
            {!compact && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>DEPA ID</strong>
              </Typography>
            )}
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                fontSize: compact ? '0.9rem' : '1rem',
                wordBreak: 'break-all',
                color: 'text.primary',
              }}
            >
              {user.depaId}
            </Typography>
          </Box>
        )}

        {/* Expanded deployment details (registration / admin only) */}
        {!compact && showDeploymentInfo && config && (
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
      </CardContent>
    </Card>
  );
};

export default DEPAConfigurationDisplay;
