import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Typography,
} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import VerifiedIcon from '@mui/icons-material/Verified';
import { huggingfaceHubUrl } from '../utils/huggingface';
import { apiService } from '../services/api';

/**
 * Detail panel for a dataset or model Hub reference (dev validation optional).
 */
export default function HuggingfaceCatalogPanel({ hfRef, title = 'Hugging Face Hub' }) {
  const [status, setStatus] = useState(null);
  const [validating, setValidating] = useState(false);
  const [devEnabled, setDevEnabled] = useState(null);

  if (!hfRef?.repoId) return null;

  const hubUrl = huggingfaceHubUrl(hfRef);

  const checkDevApi = async () => {
    try {
      const res = await apiService.getHuggingfaceDevStatus();
      setDevEnabled(Boolean(res?.enabled));
      return Boolean(res?.enabled);
    } catch {
      setDevEnabled(false);
      return false;
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setStatus(null);
    try {
      const enabled = devEnabled ?? (await checkDevApi());
      if (!enabled) {
        setStatus({
          severity: 'info',
          message:
            'Dev Hub API is off. Set HUGGINGFACE_INTEGRATION_ENABLED=true on the backend to validate repos from the UI.',
        });
        return;
      }
      const res = await apiService.validateHuggingfaceRepo(hfRef.repoType, hfRef.repoId);
      if (res?.success) {
        setStatus({ severity: 'success', message: `Hub repo verified: ${hfRef.repoId}` });
      } else {
        setStatus({ severity: 'warning', message: res?.error || 'Validation returned no match' });
      }
    } catch (e) {
      setStatus({
        severity: 'warning',
        message: e.response?.data?.error || e.message || 'Could not reach Hugging Face Hub',
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HubIcon fontSize="small" />
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Local Docker training downloads this reference at job time. Confidential uploads stay in CAN storage;
        this is a catalog pointer only.
      </Typography>
      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
        <strong>Repo:</strong>{' '}
        {hubUrl ? (
          <Link href={hubUrl} target="_blank" rel="noopener noreferrer">
            {hfRef.repoId}
          </Link>
        ) : (
          hfRef.repoId
        )}
        {hfRef.repoType === 'dataset' && (
          <>
            <br />
            <strong>Splits:</strong> {hfRef.splitTrain || 'train'} / {hfRef.splitTest || 'test'}
          </>
        )}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        startIcon={validating ? <CircularProgress size={16} /> : <VerifiedIcon />}
        onClick={handleValidate}
        disabled={validating}
        sx={{ mr: 1 }}
      >
        Validate on Hub (dev)
      </Button>
      {status && (
        <Alert severity={status.severity} sx={{ mt: 1 }}>
          {status.message}
        </Alert>
      )}
    </Box>
  );
}
