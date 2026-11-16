import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import apiService from '../../frontend/src/services/api';

const FIELDS = {
  Azure: [
    ['subscriptionId', 'Subscription ID'],
    ['resourceGroup', 'Resource group'],
    ['clusterName', 'AKS cluster name'],
    ['namespace', 'Namespace'],
    ['location', 'Region'],
    ['kubeconfigPath', 'Kubeconfig path'],
  ],
  GCP: [
    ['projectId', 'Project ID'],
    ['location', 'Location'],
    ['clusterName', 'GKE cluster name'],
    ['namespace', 'Namespace'],
    ['kubeconfigPath', 'Kubeconfig path'],
  ],
  AWS: [
    ['accountId', 'Account ID'],
    ['region', 'Region'],
    ['clusterName', 'EKS cluster name'],
    ['namespace', 'Namespace'],
    ['kubeconfigPath', 'Kubeconfig path'],
  ],
};

const emptyFor = (provider) => Object.fromEntries(FIELDS[provider].map(([key]) => [key, '']));

export default function InferenceDeployTargets() {
  const [provider, setProvider] = useState('Azure');
  const [accounts, setAccounts] = useState({ Azure: {}, GCP: {}, AWS: {} });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiService.getTdcInferenceAccounts();
        if (cancelled) return;
        setAccounts({
          Azure: data.accounts?.Azure || {},
          GCP: data.accounts?.GCP || {},
          AWS: data.accounts?.AWS || {},
        });
      } catch (e) {
        if (!cancelled) {
          toast.error(e.response?.data?.error || e.message || 'Failed to load deploy targets');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fields = FIELDS[provider];
  const current = { ...emptyFor(provider), ...(accounts[provider] || {}) };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await apiService.saveTdcInferenceAccount(provider, current);
      setAccounts((prev) => ({ ...prev, [provider]: data.account || current }));
      toast.success(`${provider} cluster saved`);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Failed to save cluster');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }} data-testid="inference-deploy-targets">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Deploy targets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These clusters belong to you, the TDC. Training still uses the TSP named on the contract.
          The kubeconfig path is a file on this API host. A missing path leaves the model undeployed.
        </Typography>
        <TextField
          select
          size="small"
          label="Cloud"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          sx={{ mb: 2, minWidth: 220 }}
          inputProps={{ 'data-testid': 'inference-account-provider' }}
        >
          <MenuItem value="Azure">Azure</MenuItem>
          <MenuItem value="GCP">GCP</MenuItem>
          <MenuItem value="AWS">AWS</MenuItem>
        </TextField>
        <Grid container spacing={2}>
          {fields.map(([key, label]) => (
            <Grid item xs={12} key={key}>
              <TextField
                fullWidth
                size="small"
                label={label}
                value={current[key] || ''}
                onChange={(e) =>
                  setAccounts((prev) => ({
                    ...prev,
                    [provider]: { ...emptyFor(provider), ...(prev[provider] || {}), [key]: e.target.value },
                  }))
                }
                inputProps={{ 'data-testid': `inference-account-${key}` }}
              />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={handleSave} disabled={saving} data-testid="inference-account-save">
            {saving ? 'Saving…' : `Save ${provider} cluster`}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
