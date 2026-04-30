import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  AlertTitle,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Remove,
  Security,
  Cloud,
  Add,
} from '@mui/icons-material';

/**
 * MultiCCRPSelector Component
 * 
 * A reusable component for selecting CCRP providers with cloud provider filtering.
 * Supports filtering by cloud provider and visual selection interface.
 * 
 * Props:
 * - ccrpUsers: Array of available CCRP users
 * - selectedCcrp: Currently selected CCRP ID
 * - selectedCloudProvider: Currently selected cloud provider filter
 * - onCcrpToggle: Function called when CCRP is selected/deselected
 * - onCloudProviderChange: Function called when cloud provider filter changes
 * - disabled: Whether the selector is disabled
 */

const MultiCCRPSelector = ({
  ccrpUsers = [],
  selectedCcrp = '',
  selectedCloudProvider = '',
  onCcrpToggle,
  onCloudProviderChange,
  onCcrpCloudProviderSelect, // new callback
  ccrpCloudProviderSelections = {}, // { [ccrpId]: provider }
  disabled = false
}) => {
  // Filter CCRP users by cloud provider
  const filteredCcrpUsers = ccrpUsers.filter(user => 
    !selectedCloudProvider || user.cloudProviders?.includes(selectedCloudProvider)
  );

  // Get cloud provider color
  const getProviderColor = (provider) => {
    switch (provider) {
      case 'Local': return 'default';
      case 'AWS': return 'warning';
      case 'Azure': return 'info';
      case 'GCP': return 'error';
      case 'OCI': return 'success';
      default: return 'default';
    }
  };

  // Get selection status for a CCRP
  const getCcrpStatus = (ccrp) => {
    const ccrpKey = ccrp.depaId || ccrp.id;
    const isSelected = selectedCcrp === ccrpKey;
    
    if (isSelected) {
      return { status: 'selected', message: 'Selected' };
    } else {
      return { status: 'available', message: 'Available' };
    }
  };

  return (
    <Box>
      {/* Cloud Provider Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cloud Provider Filter
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Filter CCRP providers by the cloud platforms they support
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Cloud Provider</InputLabel>
            <Select
              value={selectedCloudProvider}
              label="Cloud Provider"
              onChange={(e) => onCloudProviderChange(e.target.value)}
              disabled={disabled}
            >
              <MenuItem value="">
                <em>All Cloud Providers</em>
              </MenuItem>
              <MenuItem value="Local">Local (Docker)</MenuItem>
              <MenuItem value="AWS">AWS - Amazon Web Services</MenuItem>
              <MenuItem value="Azure">Azure - Microsoft Azure</MenuItem>
              <MenuItem value="GCP">GCP - Google Cloud Platform</MenuItem>
              <MenuItem value="OCI">OCI - Oracle Cloud Infrastructure</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Available CCRP Providers */}
      {!selectedCcrp && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>No CCRP Selected</AlertTitle>
          Select a CCRP provider to handle confidential computing environments for your contract (optional).
        </Alert>
      )}
      
      <Grid container spacing={2}>
        {filteredCcrpUsers.map((ccrp) => {
          const { status, message } = getCcrpStatus(ccrp);
          const ccrpKey = ccrp.depaId || ccrp.id;
          const isSelected = selectedCcrp === ccrpKey;
          const isDisabled = status === 'disabled';
          
          return (
            <Grid item xs={12} sm={6} md={4} key={ccrp.id}>
              <Card 
                sx={{ 
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  opacity: isDisabled ? 0.6 : 1,
                  position: 'relative',
                  cursor: disabled ? 'default' : 'pointer',
                  '&:hover': disabled ? {} : {
                    borderColor: 'primary.main',
                    boxShadow: 2
                  }
                }}
                onClick={() => !disabled && onCcrpToggle(isSelected ? null : ccrpKey)}
              >
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    {/* Checkbox for selection */}
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled || disabled}
                      onChange={() => !isDisabled && !disabled && onCcrpToggle(isSelected ? null : ccrpKey)}
                      color="primary"
                      sx={{ mt: 0 }}
                    />
                    
                    {/* CCRP content */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" gutterBottom>
                          {ccrp.name}
                        </Typography>
                        {isSelected && (
                          <Chip label="Selected" color="primary" size="small" />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {ccrp.description || 'Confidential computing environment provider'}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {ccrp.email}
                      </Typography>
                      
                      {/* Cloud Providers */}
                      {ccrp.cloudProviders && ccrp.cloudProviders.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Supported Cloud Providers:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {ccrp.cloudProviders.map((provider) => (
                              <Chip
                                key={provider}
                                icon={<Cloud />}
                                label={provider}
                                color={getProviderColor(provider)}
                                variant="outlined"
                                size="small"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Selected CCRP Summary - Moved below the list */}
      {selectedCcrp && (() => {
        const selectedCcrpUser = ccrpUsers.find(u => (u.depaId && u.depaId === selectedCcrp) || u.id === selectedCcrp);
        if (!selectedCcrpUser) return null;
        const providers = selectedCcrpUser.cloudProviders || [];
        const selectedKey = selectedCcrpUser.depaId || selectedCcrpUser.id;
        return (
          <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected CCRP Provider
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                Your chosen confidential computing environment provider
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedCcrpUser.name}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {selectedCcrpUser.email}
                    </Typography>
                    {providers.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {providers.map((provider) => (
                          <Chip
                            key={provider}
                            label={provider}
                            color={getProviderColor(provider)}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => onCcrpToggle(null)}
                      sx={{ color: 'white' }}
                      disabled={disabled}
                    >
                      <Remove />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              {/* Cloud provider selection if multiple */}
              {providers.length > 1 && (
                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Cloud Provider</InputLabel>
                    <Select
                      value={ccrpCloudProviderSelections[selectedKey] || ''}
                      label="Select Cloud Provider"
                      onChange={e => onCcrpCloudProviderSelect(selectedKey, e.target.value)}
                      disabled={disabled}
                    >
                      {providers.map((provider) => (
                        <MenuItem key={provider} value={provider}>{provider}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* No CCRP providers available */}
      {filteredCcrpUsers.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>No CCRP Providers Available</AlertTitle>
          {selectedCloudProvider 
            ? `No CCRP providers found supporting ${selectedCloudProvider}. Try selecting a different cloud provider.`
            : 'No CCRP providers are currently available.'
          }
        </Alert>
      )}
    </Box>
  );
};

export default MultiCCRPSelector; 