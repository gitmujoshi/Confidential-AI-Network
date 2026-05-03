import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function CANJobs() {
  const [contractId, setContractId] = useState('');
  const [jobId, setJobId] = useState('');
  const [trainingStatus, setTrainingStatus] = useState('');
  const [trainingJob, setTrainingJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState('');

  const principalIds = useMemo(
    () => ({
      dp: 'did:can:dp:ui',
      mo: 'did:can:mo:ui',
      ccrp: 'did:can:ccrp:ui',
    }),
    []
  );

  async function canPost(url, data, principalId) {
    return apiService.post(url, data, {
      headers: { 'X-CAN-Principal-Id': principalId },
    });
  }

  async function canGet(url, principalId) {
    return apiService.get(url, {
      headers: { 'X-CAN-Principal-Id': principalId },
    });
  }

  async function handleCreateJob() {
    setLastError('');
    setTrainingStatus('');
    setTrainingJob(null);
    setJobId('');
    if (!contractId) {
      toast.error('Contract ID is required');
      return;
    }
    setBusy(true);
    try {
      const res = await canPost('/api/can/jcs/jobs', { contractId, ccrProvider: 'local' }, principalIds.dp);
      const createdJobId = res.data?.data?.job?.jobId;
      if (!createdJobId) throw new Error('Job id missing from response');
      setJobId(createdJobId);
      toast.success('CAN job created');
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e.message;
      setLastError(String(msg));
      toast.error(`Create job failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleKeyRelease(keyType) {
    if (!jobId) return toast.error('Create a job first');
    setBusy(true);
    setLastError('');
    try {
      const principal = keyType === 'DEK' ? principalIds.dp : principalIds.mo;
      await canPost(`/api/can/jcs/jobs/${jobId}/key-released`, { keyType }, principal);
      toast.success(`${keyType} released`);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      setLastError(String(msg));
      toast.error(`Key release failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleReleaseJob() {
    if (!jobId) return toast.error('Create a job first');
    setBusy(true);
    setLastError('');
    try {
      await canPost(`/api/can/jcs/jobs/${jobId}/release`, {}, principalIds.ccrp);
      toast.success('Job released to local CCRP');
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      setLastError(String(msg));
      toast.error(`Release failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function handlePollTraining() {
    if (!jobId) return toast.error('Create a job first');
    setBusy(true);
    setLastError('');
    setTrainingStatus('');
    setTrainingJob(null);
    try {
      const deadline = Date.now() + 30_000;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (Date.now() > deadline) throw new Error('Training did not complete within timeout');
        try {
          const res = await canGet(`/api/can/jcs/jobs/${jobId}/training`, principalIds.dp);
          const job = res.data?.data || null;
          const st = job?.status;
          if (st) setTrainingStatus(st);
          if (job) setTrainingJob(job);
          if (st === 'COMPLETED') break;
          if (st === 'FAILED') throw new Error(job?.errorMessage || 'Training failed');
        } catch (e) {
          // If not started yet, keep polling.
        }
        await sleep(400);
      }
      toast.success('Training completed');
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      setLastError(String(msg));
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        CAN Jobs (Local CCRP)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        UI helper for local end-to-end testing of CAN: create job → release keys → run local training → verify status.
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Contract ID"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              placeholder="e.g. RICARDIAN-..."
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" onClick={handleCreateJob} disabled={busy}>
                Create CAN Job
              </Button>
              <Button variant="outlined" onClick={() => handleKeyRelease('DEK')} disabled={busy || !jobId}>
                Release DEK (DP)
              </Button>
              <Button variant="outlined" onClick={() => handleKeyRelease('MEK')} disabled={busy || !jobId}>
                Release MEK (MO)
              </Button>
              <Button variant="outlined" onClick={handleReleaseJob} disabled={busy || !jobId}>
                Release Job (CCRP)
              </Button>
              <Button variant="outlined" onClick={handlePollTraining} disabled={busy || !jobId}>
                Wait for Training
              </Button>
            </Stack>

            <Divider />

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Job ID:
              </Typography>
              {jobId ? (
                <Chip data-testid="can-job-id" label={jobId} size="small" />
              ) : (
                <Chip data-testid="can-job-id" label="(none)" size="small" variant="outlined" />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Training:
              </Typography>
              {trainingStatus ? (
                <Chip
                  data-testid="can-training-status"
                  label={trainingStatus}
                  size="small"
                  color={trainingStatus === 'COMPLETED' ? 'success' : 'default'}
                />
              ) : (
                <Chip data-testid="can-training-status" label="(unknown)" size="small" variant="outlined" />
              )}
            </Stack>

            {trainingStatus === 'COMPLETED' && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Training results</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Metrics summary
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`accuracy: ${
                          trainingJob?.metadata?.results?.accuracy ?? trainingJob?.metadata?.results?.trainingResults?.accuracy ?? '—'
                        }`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`loss: ${
                          trainingJob?.metadata?.results?.loss ?? trainingJob?.metadata?.results?.trainingResults?.loss ?? '—'
                        }`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`epochs: ${
                          trainingJob?.metadata?.results?.epochsCompleted ??
                          trainingJob?.metadata?.results?.epochs ??
                          '—'
                        }`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="body2" color="text.secondary">
                      Raw results (JSON)
                    </Typography>
                    <Box
                      data-testid="can-training-results-json"
                      component="pre"
                      sx={{
                        fontSize: 12,
                        lineHeight: 1.45,
                        m: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        bgcolor: 'rgba(15, 23, 42, 0.03)',
                        border: '1px solid rgba(148,163,184,0.35)',
                        borderRadius: 2,
                        p: 1.5,
                        overflow: 'auto',
                        maxHeight: 320,
                      }}
                    >
                      {JSON.stringify(
                        trainingJob?.metadata?.results ??
                          trainingJob?.results ??
                          { note: 'No results payload found on this job' },
                        null,
                        2
                      )}
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            {lastError ? <Alert severity="error">{lastError}</Alert> : null}
            <Alert severity="info">
              This page uses CAN principal headers in-browser (dev-only). Production CAN uses certificate-based principal auth.
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

