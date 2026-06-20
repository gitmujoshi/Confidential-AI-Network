import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const CloudProviderManager = ({ userId, currentProviders = [], description = '' }) => {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(currentProviders[0] || '');
  const [newDescription, setNewDescription] = useState(description);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedProvider(currentProviders[0] || '');
  }, [currentProviders]);

  const availableProviders = [
    { value: 'Local', label: 'Local (Docker)', description: 'Local training execution (no cloud)' },
    { value: 'AWS', label: 'Amazon Web Services', description: 'Nitro Enclaves' },
    { value: 'Azure', label: 'Microsoft Azure', description: 'SGX Enclaves' },
    { value: 'GCP', label: 'Google Cloud Platform', description: 'Confidential VMs' },
    { value: 'OCI', label: 'Oracle Cloud Infrastructure', description: 'Confidential Computing' }
  ];

  const updateProvidersMutation = useMutation(
    (data) => apiService.put(`/api/tsp/cloud-providers/${userId}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tspDashboard');
        toast.success('Cloud provider updated successfully!');
        setOpen(false);
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.error || 'Failed to update cloud provider';
        toast.error(errorMsg);
      }
    }
  );

  const handleSave = () => {
    if (!selectedProvider) {
      toast.error('Select a cloud provider');
      return;
    }
    updateProvidersMutation.mutate({
      cloudProviders: [selectedProvider],
      description: newDescription
    });
  };

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

  const activeProvider = currentProviders[0] || null;

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" className="font-medium">
              Cloud Provider
            </Typography>
            <Tooltip title="Edit cloud provider">
              <IconButton onClick={() => setOpen(true)} color="primary">
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {activeProvider ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                icon={<CloudIcon />}
                label={activeProvider}
                color={getProviderColor(activeProvider)}
                variant="outlined"
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              No cloud provider configured. Click edit to select your platform.
            </Alert>
          )}

          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudIcon />
            Manage Cloud Provider
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the single cloud platform you operate for confidential computing (TSP/TSP).
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Available Cloud Providers</FormLabel>
            <RadioGroup
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              {availableProviders.map((provider) => (
                <FormControlLabel
                  key={provider.value}
                  value={provider.value}
                  control={<Radio color="primary" />}
                  label={
                    <Box>
                      <Typography variant="body1" className="font-medium">
                        {provider.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {provider.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', mb: 1 }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Description (optional)
            </Typography>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe your confidential computing environment..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={updateProvidersMutation.isLoading || !selectedProvider}
          >
            {updateProvidersMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CloudProviderManager;
