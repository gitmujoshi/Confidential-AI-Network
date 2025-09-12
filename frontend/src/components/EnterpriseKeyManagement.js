/**
 * Enterprise Key Management Component
 * Handles registration and management of enterprise public keys
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

const EnterpriseKeyManagement = () => {
  const [enterpriseKeys, setEnterpriseKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [supportedAlgorithms, setSupportedAlgorithms] = useState([]);
  const [newKey, setNewKey] = useState({
    publicKey: '',
    algorithm: '',
    keyId: '',
    provider: '',
    metadata: {}
  });

  // Load enterprise keys and supported algorithms on component mount
  useEffect(() => {
    loadEnterpriseKeys();
    loadSupportedAlgorithms();
  }, []);

  const loadEnterpriseKeys = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/enterprise/keys');
      if (response.data.success) {
        setEnterpriseKeys(response.data.data);
      }
    } catch (error) {
      console.error('Error loading enterprise keys:', error);
      setError('Failed to load enterprise keys');
    } finally {
      setLoading(false);
    }
  };

  const loadSupportedAlgorithms = async () => {
    try {
      const response = await apiService.get('/api/enterprise/keys/supported-algorithms');
      if (response.data.success) {
        setSupportedAlgorithms(response.data.data);
      }
    } catch (error) {
      console.error('Error loading supported algorithms:', error);
    }
  };

  const handleRegisterKey = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await apiService.post('/api/enterprise/keys/register', newKey);

      if (response.data.success) {
        setSuccess('Enterprise key registered successfully!');
        setOpenDialog(false);
        setNewKey({
          publicKey: '',
          algorithm: '',
          keyId: '',
          provider: '',
          metadata: {}
        });
        loadEnterpriseKeys();
      }
    } catch (error) {
      console.error('Error registering enterprise key:', error);
      setError(error.response?.data?.error || 'Failed to register enterprise key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to deactivate this key?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.delete(`/api/enterprise/keys/${keyId}`);

      if (response.data.success) {
        setSuccess('Enterprise key deactivated successfully!');
        loadEnterpriseKeys();
      }
    } catch (error) {
      console.error('Error deactivating enterprise key:', error);
      setError(error.response?.data?.error || 'Failed to deactivate enterprise key');
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'azure':
        return <CloudIcon color="primary" />;
      case 'aws':
        return <CloudIcon color="warning" />;
      case 'gcp':
        return <CloudIcon color="info" />;
      case 'oci':
        return <CloudIcon color="secondary" />;
      default:
        return <KeyIcon />;
    }
  };

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'azure':
        return 'primary';
      case 'aws':
        return 'warning';
      case 'gcp':
        return 'info';
      case 'oci':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Enterprise Key Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Register New Key
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key ID</TableCell>
              <TableCell>Algorithm</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enterpriseKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <KeyIcon fontSize="small" />
                    <Typography variant="body2">{key.keyId}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={key.algorithm} size="small" />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getProviderIcon(key.provider)}
                    <Typography variant="body2" color={`${getProviderColor(key.provider)}.main`}>
                      {key.provider.toUpperCase()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Deactivate Key">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeactivateKey(key.keyId)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {enterpriseKeys.length === 0 && !loading && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No enterprise keys registered yet. Click "Register New Key" to get started.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Register New Key Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Register New Enterprise Key</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Key ID"
                value={newKey.keyId}
                onChange={(e) => setNewKey(prev => ({ ...prev, keyId: e.target.value }))}
                helperText="Unique identifier for this key in your KMS"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Algorithm</InputLabel>
                <Select
                  value={newKey.algorithm}
                  onChange={(e) => setNewKey(prev => ({ ...prev, algorithm: e.target.value }))}
                >
                  {supportedAlgorithms.map((algorithm) => (
                    <MenuItem key={algorithm} value={algorithm}>
                      {algorithm}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Cloud Provider</InputLabel>
                <Select
                  value={newKey.provider}
                  onChange={(e) => setNewKey(prev => ({ ...prev, provider: e.target.value }))}
                >
                  <MenuItem value="azure">Azure Key Vault</MenuItem>
                  <MenuItem value="aws">AWS KMS</MenuItem>
                  <MenuItem value="gcp">Google Cloud KMS</MenuItem>
                  <MenuItem value="oci">OCI Vault</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Public Key (PEM Format)"
                multiline
                rows={4}
                value={newKey.publicKey}
                onChange={(e) => setNewKey(prev => ({ ...prev, publicKey: e.target.value }))}
                helperText="Paste your public key in PEM format (-----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----)"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRegisterKey}
            disabled={loading || !newKey.keyId || !newKey.algorithm || !newKey.provider || !newKey.publicKey}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Registering...' : 'Register Key'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnterpriseKeyManagement;
