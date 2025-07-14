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
  Checkbox,
  FormGroup,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const CloudProviderManager = ({ userId, currentProviders = [], description = '' }) => {
  const [open, setOpen] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState(currentProviders);
  const [newDescription, setNewDescription] = useState(description);
  const queryClient = useQueryClient();

  const availableProviders = [
    { value: 'AWS', label: 'Amazon Web Services', description: 'Nitro Enclaves' },
    { value: 'Azure', label: 'Microsoft Azure', description: 'SGX Enclaves' },
    { value: 'GCP', label: 'Google Cloud Platform', description: 'Confidential VMs' },
    { value: 'OCI', label: 'Oracle Cloud Infrastructure', description: 'Confidential Computing' }
  ];

  const updateProvidersMutation = useMutation(
    (data) => apiService.put(`/api/ccrp/cloud-providers/${userId}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ccrpDashboard');
        toast.success('Cloud providers updated successfully!');
        setOpen(false);
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.error || 'Failed to update cloud providers';
        toast.error(errorMsg);
      }
    }
  );

  const handleSave = () => {
    updateProvidersMutation.mutate({
      cloudProviders: selectedProviders,
      description: newDescription
    });
  };

  const handleProviderToggle = (provider) => {
    setSelectedProviders(prev => 
      prev.includes(provider)
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'AWS': return 'warning';
      case 'Azure': return 'info';
      case 'GCP': return 'error';
      case 'OCI': return 'success';
      default: return 'default';
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" className="font-medium">
              Cloud Providers
            </Typography>
            <Tooltip title="Edit cloud providers">
              <IconButton onClick={() => setOpen(true)} color="primary">
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {currentProviders.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {currentProviders.map((provider) => (
                <Chip
                  key={provider}
                  icon={<CloudIcon />}
                  label={provider}
                  color={getProviderColor(provider)}
                  variant="outlined"
                />
              ))}
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              No cloud providers configured. Click edit to add providers.
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
            Manage Cloud Providers
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the cloud providers you support for confidential computing environments.
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Available Cloud Providers</FormLabel>
            <FormGroup>
              {availableProviders.map((provider) => (
                <Box key={provider.value} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Checkbox
                    checked={selectedProviders.includes(provider.value)}
                    onChange={() => handleProviderToggle(provider.value)}
                    color="primary"
                  />
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1" className="font-medium">
                      {provider.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {provider.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </FormGroup>
          </FormControl>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Description (optional)
            </Typography>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe your cloud provider expertise..."
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
            disabled={updateProvidersMutation.isLoading}
          >
            {updateProvidersMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CloudProviderManager; 