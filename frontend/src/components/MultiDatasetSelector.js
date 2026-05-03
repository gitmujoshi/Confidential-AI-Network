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
  Security,
  Lock,
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
 * - Confidential computing requirement indicators
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
  const isSelected = (dataset) => selectedDatasets.some(d => d.id === dataset.id);
  const isDisabled = (dataset) => disabled || (!isSelected(dataset) && selectedDatasets.length >= maxDatasets);

  const handleDatasetToggle = (dataset) => {
    if (!isDisabled(dataset)) {
      onDatasetToggle(dataset);
    }
  };

  const handlePriceChange = (datasetId, price) => {
    onPriceChange(datasetId, price);
  };

  return (
    <Box>
      {/* Selection Summary */}
      {selectedDatasets.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Selected Datasets ({selectedDatasets.length}/{maxDatasets})</AlertTitle>
          {selectedDatasets.map((dataset, index) => (
            <Box key={dataset.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {dataset.name} - ${datasetPrices[dataset.id] || dataset.price}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleDatasetToggle(dataset)}
                disabled={disabled}
              >
                <Remove />
              </IconButton>
            </Box>
          ))}
        </Alert>
      )}

      {/* Dataset Grid */}
      <Grid container spacing={2}>
        {datasets.map((dataset) => {
          const selected = isSelected(dataset);
          const disabled = isDisabled(dataset);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={dataset.id}>
              <Card 
                sx={{ 
                  cursor: disabled && !selected ? 'not-allowed' : 'pointer',
                  opacity: disabled && !selected ? 0.6 : 1,
                  border: selected ? 2 : 1,
                  borderColor: selected ? 'primary.main' : 'divider',
                  '&:hover': {
                    borderColor: disabled && !selected ? 'divider' : 'primary.main',
                    boxShadow: disabled && !selected ? 'none' : 2
                  }
                }}
                onClick={() => handleDatasetToggle(dataset)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <Checkbox
                      checked={selected}
                      disabled={disabled}
                      size="small"
                      sx={{ mt: -0.5 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h6" sx={{ mb: 0.5 }}>
                        {dataset.name}
                      </Typography>
                      
                      {/* Confidential Computing Indicator */}
                      {dataset.confidentialComputingRequired && (
                        <Chip
                          icon={<Security />}
                          label="Confidential Computing Required"
                          color="warning"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      )}
                      {dataset.physicalTrainingReady === false && (
                        <Chip
                          label="No training files yet"
                          color="warning"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      )}
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {dataset.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Storage fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {dataset.category} • {dataset.size}MB • {dataset.recordCount.toLocaleString()} records
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {dataset.owner?.name || 'Unknown Owner'}
                        </Typography>
                      </Box>
                      
                      <Typography variant="subtitle1" color="primary" component="div" sx={{ mb: 1 }}>
                        ${dataset.price}
                      </Typography>
                      
                      {/* Price Input for Selected Datasets */}
                      {selected && (
                        <TextField
                          fullWidth
                          label="Custom Price"
                          type="number"
                          value={datasetPrices[dataset.id] || dataset.price}
                          onChange={(e) => handlePriceChange(dataset.id, e.target.value)}
                          disabled={disabled}
                          size="small"
                          sx={{ mb: 1 }}
                          InputProps={{
                            startAdornment: '$',
                          }}
                        />
                      )}
                      
                      {/* Tags */}
                      {dataset.tags && dataset.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {dataset.tags.slice(0, 3).map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {dataset.tags.length > 3 && (
                            <Chip
                              label={`+${dataset.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
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

      {/* No Datasets Message */}
      {datasets.length === 0 && (
        <Alert severity="info">
          <AlertTitle>No Datasets Available</AlertTitle>
          There are no datasets available for selection at this time.
        </Alert>
      )}

      {/* Selection Limit Warning */}
      {selectedDatasets.length >= maxDatasets && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>Selection Limit Reached</AlertTitle>
          You have selected the maximum number of datasets ({maxDatasets}). 
          Remove a dataset to select a different one.
        </Alert>
      )}
    </Box>
  );
};

export default MultiDatasetSelector; 