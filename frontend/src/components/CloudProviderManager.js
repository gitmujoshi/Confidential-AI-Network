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
  Tooltip,
  TextField,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const AZURE_FIELDS = [
  ['subscriptionId', 'Subscription ID'],
  ['resourceGroup', 'Resource group'],
  ['clusterName', 'AKS cluster name'],
  ['namespace', 'Namespace'],
  ['location', 'Region'],
  ['storageAccount', 'Storage account'],
  ['keyVaultUri', 'Key Vault URI'],
  ['kubeconfigPath', 'Kubeconfig path'],
];

const GCP_FIELDS = [
  ['projectId', 'Project ID'],
  ['location', 'Location'],
  ['clusterName', 'GKE cluster name'],
  ['namespace', 'Namespace'],
  ['bucket', 'GCS bucket'],
  ['kubeconfigPath', 'Kubeconfig path'],
];

const emptyAccount = (provider) => {
  const fields = provider === 'Azure' ? AZURE_FIELDS : provider === 'GCP' ? GCP_FIELDS : [];
  return Object.fromEntries(fields.map(([key]) => [key, '']));
};

const CloudProviderManager = ({ userId, currentProviders = [], currentAccount = null, description = '' }) => {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(currentProviders[0] || '');
  const [newDescription, setNewDescription] = useState(description);
  const [account, setAccount] = useState(emptyAccount(currentProviders[0]));
  const [saved, setSaved] = useState(null);
  const queryClient = useQueryClient();

  const providers = saved?.cloudProviders || currentProviders;
  const accountBag = saved?.cloudAccount || currentAccount || {};
  const activeProvider = providers[0] || null;
  const activeAccount = (activeProvider && accountBag[activeProvider]) || null;

  useEffect(() => {
    setSelectedProvider(currentProviders[0] || '');
    setAccount(emptyAccount(currentProviders[0]));
  }, [currentProviders]);

  const availableProviders = [
    { value: 'Local', label: 'Local (Docker)', description: 'Local training execution (no cloud)' },
    { value: 'AWS', label: 'Amazon Web Services', description: 'Nitro Enclaves' },
    { value: 'Azure', label: 'Microsoft Azure', description: 'Confidential AKS pool' },
    { value: 'GCP', label: 'Google Cloud Platform', description: 'Confidential GKE pool' },
    { value: 'OCI', label: 'Oracle Cloud Infrastructure', description: 'Confidential Computing' }
  ];

  const updateProvidersMutation = useMutation(
    (data) => apiService.put(`/api/tsp/cloud-providers/${userId}`, data),
    {
      onSuccess: (response) => {
        const body = response.data || {};
        setSaved({
          cloudProviders: body.cloudProviders || [selectedProvider],
          cloudAccount: body.cloudAccount || null,
          description: body.description,
        });
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

  const openEditor = () => {
    const provider = activeProvider || '';
    setSelectedProvider(provider);
    setNewDescription(saved?.description ?? description);
    setAccount({ ...emptyAccount(provider), ...(accountBag[provider] || {}) });
    setOpen(true);
  };

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    setAccount({ ...emptyAccount(provider), ...(accountBag[provider] || {}) });
  };

  const handleSave = () => {
    if (!selectedProvider) {
      toast.error('Select a cloud provider');
      return;
    }
    const payload = {
      cloudProviders: [selectedProvider],
      description: newDescription,
    };
    if (selectedProvider === 'Azure' || selectedProvider === 'GCP') {
      payload.cloudAccount = { [selectedProvider]: account };
    }
    updateProvidersMutation.mutate(payload);
  };

  const clusterFields = selectedProvider === 'Azure' ? AZURE_FIELDS : selectedProvider === 'GCP' ? GCP_FIELDS : [];

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

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" className="font-medium">
              Cloud Provider
            </Typography>
            <Tooltip title="Edit cloud provider">
              <IconButton onClick={openEditor} color="primary" data-testid="edit-cloud-provider">
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

          {activeAccount && (activeAccount.clusterName || activeAccount.projectId) && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} data-testid="tsp-cluster-summary">
              {[activeAccount.clusterName, activeAccount.resourceGroup, activeAccount.projectId, activeAccount.location]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          )}

          {(saved?.description ?? description) && (
            <Typography variant="body2" color="text.secondary">
              {saved?.description ?? description}
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
            Select the single cloud platform you operate. Azure and GCP also name the existing cluster this TSP trains on.
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Available Cloud Providers</FormLabel>
            <RadioGroup
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
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

          {clusterFields.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {selectedProvider} cluster
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The kubeconfig path is a file on this TSP host. It is not stored on the contract.
              </Typography>
              <Grid container spacing={2}>
                {clusterFields.map(([key, label]) => (
                  <Grid item xs={12} key={key}>
                    <TextField
                      fullWidth
                      label={label}
                      value={account[key] || ''}
                      onChange={(e) => setAccount((prev) => ({ ...prev, [key]: e.target.value }))}
                      inputProps={{ 'data-testid': `tsp-account-${key}` }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

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
