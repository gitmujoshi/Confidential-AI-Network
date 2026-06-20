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
 * MultiTSPSelector Component
 * 
 * A reusable component for selecting TSP providers with cloud provider filtering.
 * Supports filtering by cloud provider and visual selection interface.
 * 
 * Props:
 * - tspUsers: Array of available TSP users
 * - selectedTsp: Currently selected TSP ID
 * - selectedCloudProvider: Currently selected cloud provider filter
 * - onTspToggle: Function called when TSP is selected/deselected
 * - onCloudProviderChange: Function called when cloud provider filter changes
 * - disabled: Whether the selector is disabled
 */

const MultiTSPSelector = ({
  tspUsers = [],
  selectedTsp = '',
  selectedCloudProvider = '',
  onTspToggle,
  onCloudProviderChange,
  onTspCloudProviderSelect, // new callback
  tspCloudProviderSelections = {}, // { [tspId]: provider }
  disabled = false
}) => {
  // Filter TSP users by cloud provider
  const filteredTspUsers = tspUsers.filter(user => 
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

  // Get selection status for a TSP
  const getTspStatus = (tsp) => {
    const isSelected = String(selectedTsp) === String(tsp.id);
    
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
            Filter TSP providers by the cloud platforms they support
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

      {/* Available TSP Providers */}
      {!selectedTsp && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>No TSP Selected</AlertTitle>
          Select a TSP provider to handle confidential computing environments for your contract (optional).
        </Alert>
      )}
      
      <Grid container spacing={2}>
        {filteredTspUsers.map((tsp) => {
          const { status, message } = getTspStatus(tsp);
          const isSelected = String(selectedTsp) === String(tsp.id);
          const isDisabled = status === 'disabled';
          
          return (
            <Grid item xs={12} sm={6} md={4} key={tsp.id}>
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
                onClick={() => !disabled && onTspToggle(isSelected ? null : tsp.id)}
              >
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    {/* Checkbox for selection */}
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled || disabled}
                      onChange={() => !isDisabled && !disabled && onTspToggle(isSelected ? null : tsp.id)}
                      color="primary"
                      sx={{ mt: 0 }}
                    />
                    
                    {/* TSP content */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" gutterBottom>
                          {tsp.name}
                        </Typography>
                        {isSelected && (
                          <Chip label="Selected" color="primary" size="small" />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {tsp.description || 'Confidential computing environment provider'}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {tsp.email}
                      </Typography>
                      
                      {/* Cloud Provider */}
                      {tsp.cloudProviders?.[0] && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            Cloud Provider:
                          </Typography>
                          <Chip
                            icon={<Cloud />}
                            label={tsp.cloudProviders[0]}
                            color={getProviderColor(tsp.cloudProviders[0])}
                            variant="outlined"
                            size="small"
                          />
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

      {/* Selected TSP Summary - Moved below the list */}
      {selectedTsp && (() => {
        const selectedTspUser = tspUsers.find(u => u.id === parseInt(selectedTsp) || u.id === selectedTsp);
        if (!selectedTspUser) return null;
        const provider = selectedTspUser.cloudProviders?.[0];
        return (
          <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected TSP Provider
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
                      {selectedTspUser.name}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {selectedTspUser.email}
                    </Typography>
                    {provider && (
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={provider}
                          color={getProviderColor(provider)}
                          size="small"
                        />
                      </Box>
                    )}
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => onTspToggle(null)}
                      sx={{ color: 'white' }}
                      disabled={disabled}
                    >
                      <Remove />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        );
      })()}

      {/* No TSP providers available */}
      {filteredTspUsers.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>No TSP Providers Available</AlertTitle>
          {selectedCloudProvider 
            ? `No TSP providers found supporting ${selectedCloudProvider}. Try selecting a different cloud provider.`
            : 'No TSP providers are currently available.'
          }
        </Alert>
      )}
    </Box>
  );
};

export default MultiTSPSelector; 