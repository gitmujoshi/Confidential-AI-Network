import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  AlertTitle,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Remove,
  Person,
  Storage,
  Add,
} from '@mui/icons-material';

/**
 * MultiDatasetSelector Component
 * 
 * A reusable component for selecting multiple datasets from different TDPs.
 * Supports up to 3 datasets with individual pricing.
 * 
 * Props:
 * - datasets: Array of available datasets
 * - selectedDatasets: Array of currently selected datasets
 * - datasetPrices: Object mapping dataset ID to price
 * - onDatasetToggle: Function called when dataset is selected/deselected
 * - onPriceChange: Function called when dataset price is changed
 * - maxDatasets: Maximum number of datasets allowed (default: 3)
 * 
 * Features:
 * - Visual dataset cards with selection state
 * - Individual pricing per dataset
 * - Selection limits and validation
 * - Clear visual feedback for disabled options
 */

const MultiDatasetSelector = ({
  datasets = [],
  selectedDatasets = [],
  datasetPrices = {},
  onDatasetToggle,
  onPriceChange,
  maxDatasets = 3,
  disabled = false
}) => {
  // Check if a dataset can be selected
  const canSelectDataset = (dataset) => {
    if (disabled) return false;
    
    const isSelected = selectedDatasets.some(d => d.id === dataset.id);
    if (isSelected) return true; // Can always deselect
    
    // Check if max datasets reached
    if (selectedDatasets.length >= maxDatasets) return false;
    
    return true;
  };

  // Debug logging
  console.log('🔍 MultiDatasetSelector Debug:', {
    totalDatasets: datasets.length,
    selectedCount: selectedDatasets.length,
    maxDatasets,
    selectedDatasets: selectedDatasets.map(d => ({ id: d.id, name: d.name, tdp: d.owner?.name }))
  });

  // Get selection status for a dataset
  const getDatasetStatus = (dataset) => {
    const isSelected = selectedDatasets.some(d => d.id === dataset.id);
    const canSelect = canSelectDataset(dataset);
    
    if (isSelected) {
      return { status: 'selected', message: 'Selected' };
    } else if (!canSelect) {
      if (selectedDatasets.length >= maxDatasets) {
        return { status: 'disabled', message: 'Max datasets reached' };
      } else {
        return { status: 'disabled', message: 'Not available' };
      }
    } else {
      return { status: 'available', message: 'Available' };
    }
  };

  return (
    <Box>
      {/* Selected Datasets Summary */}
      {selectedDatasets.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Selected Datasets ({selectedDatasets.length}/{maxDatasets})
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              {selectedDatasets.length === 1 
                ? '1 dataset selected' 
                : `${selectedDatasets.length} datasets selected`
              } - You can add more or proceed with current selection
            </Typography>
            <List dense>
              {selectedDatasets.map((dataset) => (
                <ListItem key={dataset.id}>
                  <ListItemIcon>
                    <Storage />
                  </ListItemIcon>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {dataset.name}
                    </Typography>
                    <Typography variant="caption" display="block">
                      TDP: {dataset.owner?.name} | Price: ${datasetPrices[dataset.id] || dataset.price}
                    </Typography>
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => onDatasetToggle(dataset)}
                      sx={{ color: 'white' }}
                      disabled={disabled}
                    >
                      <Remove />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Available Datasets */}
      {selectedDatasets.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>No Datasets Selected</AlertTitle>
          Use the checkboxes to select datasets. You can select 1 to 3 datasets from different TDPs.
        </Alert>
      )}
      
      <Grid container spacing={2}>
        {datasets.map((dataset) => {
          const { status, message } = getDatasetStatus(dataset);
          const isSelected = selectedDatasets.some(d => d.id === dataset.id);
          const isDisabled = status === 'disabled';
          
          return (
            <Grid item xs={12} sm={6} md={4} key={dataset.id}>
              <Card 
                sx={{ 
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  opacity: isDisabled ? 0.6 : 1,
                  position: 'relative',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    {/* Checkbox for selection */}
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && onDatasetToggle(dataset)}
                      color="primary"
                      sx={{ mt: 0 }}
                    />
                    
                    {/* Dataset content */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" gutterBottom>
                          {dataset.name}
                        </Typography>
                        {isSelected && (
                          <Chip label="Selected" color="primary" size="small" />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {dataset.description}
                      </Typography>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight="medium">
                          ${dataset.price}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {dataset.category}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="caption" color="textSecondary">
                          {dataset.owner?.name}
                        </Typography>
                      </Box>
                      
                      {isSelected && (
                        <TextField
                          fullWidth
                          size="small"
                          label="Custom Price (USD)"
                          type="number"
                          value={datasetPrices[dataset.id] || dataset.price}
                          onChange={(e) => onPriceChange(dataset.id, e.target.value)}
                          sx={{ mt: 2 }}
                          helperText="Adjust price for this dataset"
                          disabled={disabled}
                        />
                      )}
                      
                      {isDisabled && !isSelected && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          {message}
                        </Alert>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Selection Summary */}
      {selectedDatasets.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selection Summary
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="body2">
                  <strong>Total Datasets:</strong> {selectedDatasets.length}/{maxDatasets}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Price:</strong> ${selectedDatasets.reduce((sum, dataset) => 
                    sum + parseFloat(datasetPrices[dataset.id] || dataset.price || 0), 0).toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  <strong>Unique TDPs:</strong> {new Set(selectedDatasets.map(d => d.owner?.id)).size}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default MultiDatasetSelector; 