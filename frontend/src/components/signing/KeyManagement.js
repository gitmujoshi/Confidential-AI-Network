import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Grid
} from '@mui/material';
import {
  Key,
  Add,
  Delete,
  Visibility,
  Lock,
  LockOpen,
  Security,
  Warning,
  CheckCircle,
  Info,
  Download,
  Upload
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { apiService } from '../../services/api';

const KeyManagement = () => {
  const { currentUser } = useUser();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newKeyType, setNewKeyType] = useState('ECDSA-P256');
  const [importKeyData, setImportKeyData] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const userKeys = await apiService.getUserKeys(currentUser.id);
      setKeys(userKeys);
    } catch (err) {
      setError('Failed to load keys');
      console.error('Error loading keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateNewKey = async () => {
    try {
      setGenerating(true);
      const keyData = {
        userId: currentUser.id,
        keyType: newKeyType,
        algorithm: newKeyType
      };
      
      const newKey = await apiService.generateUserKey(keyData);
      setKeys([...keys, newKey]);
      setSuccess('New key generated successfully');
      setGenerateDialogOpen(false);
    } catch (err) {
      setError('Failed to generate key');
      console.error('Error generating key:', err);
    } finally {
      setGenerating(false);
    }
  };

  const importKey = async () => {
    try {
      const keyData = {
        userId: currentUser.id,
        keyData: importKeyData,
        keyType: newKeyType
      };
      
      const importedKey = await apiService.importUserKey(keyData);
      setKeys([...keys, importedKey]);
      setSuccess('Key imported successfully');
      setImportDialogOpen(false);
      setImportKeyData('');
    } catch (err) {
      setError('Failed to import key');
      console.error('Error importing key:', err);
    }
  };

  const deleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this key? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteUserKey(keyId);
      setKeys(keys.filter(key => key.id !== keyId));
      setSuccess('Key deleted successfully');
    } catch (err) {
      setError('Failed to delete key');
      console.error('Error deleting key:', err);
    }
  };

  const exportKey = async (keyId) => {
    try {
      const keyData = await apiService.exportUserKey(keyId);
      const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `key-${keyId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export key');
      console.error('Error exporting key:', err);
    }
  };

  const getKeyStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'revoked': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const getKeyTypeIcon = (keyType) => {
    switch (keyType) {
      case 'ECDSA-P256': return <Security />;
      case 'RSA-2048': return <Lock />;
      default: return <Key />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Key Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Import Key
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate New Key
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Signing Keys
          </Typography>
          
          {keys.length === 0 ? (
            <Alert severity="info">
              <Typography variant="body2">
                No signing keys found. Generate a new key to start signing contracts.
              </Typography>
            </Alert>
          ) : (
            <List>
              {keys.map((key) => (
                <React.Fragment key={key.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getKeyTypeIcon(key.keyType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">
                            {key.keyId}
                          </Typography>
                          <Chip
                            label={key.keyStatus}
                            color={getKeyStatusColor(key.keyStatus)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Type: {key.keyType} | Created: {new Date(key.createdAt).toLocaleDateString()}
                          </Typography>
                          {key.lastUsedAt && (
                            <Typography variant="caption" color="text.secondary">
                              Last used: {new Date(key.lastUsedAt).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Export Key">
                          <IconButton
                            size="small"
                            onClick={() => exportKey(key.id)}
                            disabled={key.keyStatus !== 'active'}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Key">
                          <IconButton
                            size="small"
                            onClick={() => deleteKey(key.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Generate New Key Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New Signing Key</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Key Type</InputLabel>
              <Select
                value={newKeyType}
                label="Key Type"
                onChange={(e) => setNewKeyType(e.target.value)}
              >
                <MenuItem value="ECDSA-P256">ECDSA P-256 (Recommended)</MenuItem>
                <MenuItem value="RSA-2048">RSA 2048-bit</MenuItem>
                <MenuItem value="RSA-4096">RSA 4096-bit</MenuItem>
              </Select>
            </FormControl>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                A new signing key will be generated and stored securely on your device. 
                Make sure to backup your key after generation.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={generateNewKey}
            variant="contained"
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} /> : <Add />}
          >
            {generating ? 'Generating...' : 'Generate Key'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Key Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Signing Key</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Key Type</InputLabel>
              <Select
                value={newKeyType}
                label="Key Type"
                onChange={(e) => setNewKeyType(e.target.value)}
              >
                <MenuItem value="ECDSA-P256">ECDSA P-256</MenuItem>
                <MenuItem value="RSA-2048">RSA 2048-bit</MenuItem>
                <MenuItem value="RSA-4096">RSA 4096-bit</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Key Data (JSON format)"
              value={importKeyData}
              onChange={(e) => setImportKeyData(e.target.value)}
              placeholder="Paste your exported key data here..."
              sx={{ mb: 2 }}
            />
            
            <Alert severity="warning">
              <Typography variant="body2">
                Only import keys from trusted sources. Imported keys will be encrypted and stored securely.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={importKey}
            variant="contained"
            disabled={!importKeyData.trim()}
            startIcon={<Upload />}
          >
            Import Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KeyManagement;
