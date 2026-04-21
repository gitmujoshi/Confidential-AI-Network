import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  LinearProgress,
  Paper,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useUser } from '../contexts/UserContext';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

export default function TDCTraining() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [jobsByContract, setJobsByContract] = useState({});
  const [startingId, setStartingId] = useState(null);
  const [pollJobId, setPollJobId] = useState(null);
  const [liveJob, setLiveJob] = useState(null);
  const [registering, setRegistering] = useState(false);

  const loadContracts = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const data = await apiService.getContracts(currentUser.id, currentUser);
      const rows = data.contracts || data || [];
      setContracts(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const loadJobsForContract = async (contractId) => {
    try {
      const data = await apiService.listTdcTrainingJobs(contractId);
      setJobsByContract((prev) => ({
        ...prev,
        [contractId]: data.jobs || [],
      }));
    } catch (e) {
      console.warn('list jobs', contractId, e);
    }
  };

  useEffect(() => {
    const signed = contracts.filter((c) => c.status === 'SIGNED');
    signed.forEach((c) => {
      const cid = c.contractId;
      if (cid) loadJobsForContract(cid);
    });
  }, [contracts]);

  useEffect(() => {
    if (!pollJobId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const data = await apiService.getTdcTrainingJob(pollJobId);
        if (cancelled) return;
        setLiveJob(data.job);
        if (data.job?.contractId) await loadJobsForContract(data.job.contractId);
        if (TERMINAL.has(data.job?.status)) {
          setPollJobId(null);
          if (data.job?.status === 'COMPLETED') toast.success('Training finished');
          if (data.job?.status === 'FAILED') toast.error('Training failed');
        }
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollJobId]);

  const handleRegisterModel = async () => {
    if (!liveJob?.jobId) return;
    setRegistering(true);
    try {
      const data = await apiService.registerTdcTrainingModel(liveJob.jobId, {});
      toast.success(`Registered model ${data.modelId}`);
      const refreshed = await apiService.getTdcTrainingJob(liveJob.jobId);
      setLiveJob(refreshed.job);
      if (liveJob.contractId) await loadJobsForContract(liveJob.contractId);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleStart = async (contractId) => {
    setStartingId(contractId);
    try {
      const data = await apiService.startTdcTraining(contractId);
      toast.success('Training started');
      setLiveJob(data.job);
      setPollJobId(data.job?.jobId);
      await loadJobsForContract(contractId);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Failed to start training';
      toast.error(msg);
    } finally {
      setStartingId(null);
    }
  };

  const signedContracts = contracts.filter((c) => c.status === 'SIGNED');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Training &amp; models</Typography>
        <Button startIcon={<RefreshIcon />} onClick={loadContracts}>
          Refresh
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Run training for a <strong>signed</strong> contract. The platform records a{' '}
        <strong>container spec</strong> (image, CPU/RAM, GPU, command) and training parameters from
        the contract, then executes a job (simulated by default — see{' '}
        <code>TRAINING_SIMULATION_MODE</code> on the backend).
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Requirements: <code>environmentSpecs</code>, <code>trainingParams</code>,{' '}
        <code>ccrpCloudProvider</code>, non-empty <code>contractDatasets</code> and{' '}
        <code>aiModelIds</code> on the contract.
      </Alert>

      {signedContracts.length === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography>No signed contracts yet. Sign a contract on the Contracts page first.</Typography>
        </Paper>
      )}

      {signedContracts.map((c) => {
        const cid = c.contractId;
        const jobs = jobsByContract[cid] || [];
        return (
          <Card key={cid} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" flexWrap="wrap" justifyContent="space-between" gap={2}>
                <Box>
                  <Typography variant="h6">{c.title || cid}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cid}
                  </Typography>
                  <Button component={Link} to={`/tdc/contracts/${cid}`} size="small" sx={{ mt: 1 }}>
                    Open contract
                  </Button>
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    startIcon={
                      startingId === cid ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <PlayArrowIcon />
                      )
                    }
                    disabled={startingId === cid}
                    onClick={() => handleStart(cid)}
                  >
                    Start training
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Jobs for this contract
              </Typography>
              {jobs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No jobs yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Job ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobs.map((j) => (
                      <TableRow key={j.jobId}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{j.jobId}</TableCell>
                        <TableCell>
                          <Chip size="small" label={j.status} color={j.status === 'COMPLETED' ? 'success' : 'default'} />
                        </TableCell>
                        <TableCell>
                          {typeof j.progress === 'number' ? (
                            <LinearProgress variant="determinate" value={Math.min(100, j.progress)} sx={{ minWidth: 80 }} />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => { setPollJobId(j.jobId); setLiveJob(null); }}>
                            Watch
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}

      {liveJob && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Active job detail
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{liveJob.jobId}</strong> — {liveJob.status}
            {liveJob.simulation && (
              <Chip size="small" label="Simulated" sx={{ ml: 1 }} />
            )}
          </Typography>
          {typeof liveJob.progress === 'number' && (
            <LinearProgress variant="determinate" value={Math.min(100, liveJob.progress)} sx={{ mb: 2 }} />
          )}

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Container spec (runtime snapshot)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{ fontSize: 11, overflow: 'auto', m: 0 }}>
                {JSON.stringify(liveJob.containerSpec, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Training parameters (from contract)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="pre" sx={{ fontSize: 11, overflow: 'auto', m: 0 }}>
                {JSON.stringify(liveJob.trainingConfig, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>

          {liveJob.results && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Results &amp; artifact (for deployment / inference)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{ fontSize: 11, overflow: 'auto', m: 0 }}>
                  {JSON.stringify(liveJob.results, null, 2)}
                </Box>
                {liveJob.inference?.note && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {liveJob.inference.note}
                  </Typography>
                )}
                {liveJob.status === 'COMPLETED' && !liveJob.registeredModelId && (
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={registering}
                    onClick={handleRegisterModel}
                  >
                    {registering ? 'Registering…' : 'Register trained model for inference'}
                  </Button>
                )}
                {liveJob.registeredModelId && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Registered as AIModel <code>{liveJob.registeredModelId}</code> — usable in new contracts and
                    inference flows.
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </Paper>
      )}
    </Container>
  );
}
