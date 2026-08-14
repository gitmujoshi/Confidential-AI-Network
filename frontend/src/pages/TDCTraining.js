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
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { useUser } from '../contexts/UserContext';
import apiService, { api } from '../services/api';
import toast from 'react-hot-toast';
import PrivacyMetricsPanel from '../components/PrivacyMetricsPanel';

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

export default function TDCTraining() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [jobsByContract, setJobsByContract] = useState({});
  const [startingId, setStartingId] = useState(null);
  const [pollJobId, setPollJobId] = useState(null);
  const [liveJob, setLiveJob] = useState(null);
  const [jobLogs, setJobLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  const [jsonViewerTitle, setJsonViewerTitle] = useState('');
  const [jsonViewerFilename, setJsonViewerFilename] = useState('');
  const [jsonViewerData, setJsonViewerData] = useState(null);
  const [jsonViewerLoading, setJsonViewerLoading] = useState(false);
  const [readinessByContract, setReadinessByContract] = useState({});

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
    let cancelled = false;
    const signed = contracts.filter((c) => c.status === 'SIGNED');
    if (signed.length === 0) {
      setReadinessByContract({});
      return undefined;
    }
    (async () => {
      const next = {};
      await Promise.all(
        signed.map(async (c) => {
          const cid = c.contractId;
          if (!cid) return;
          try {
            const data = await apiService.getTdcTrainingReadiness(cid);
            if (data?.readiness) next[cid] = data.readiness;
          } catch {
            // ignore per-contract errors (e.g. wrong role in mock env)
          }
        })
      );
      if (!cancelled) setReadinessByContract(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [contracts]);

  useEffect(() => {
    if (!pollJobId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const data = await apiService.getTdcTrainingJob(pollJobId);
        if (cancelled) return;
        setLiveJob(data.job);
        // Keep any loaded logs visible while polling; only clear when switching jobs.
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

  const triggerJsonDownload = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openJsonViewer = ({ title, filename, data }) => {
    setJsonViewerTitle(title);
    setJsonViewerFilename(filename);
    setJsonViewerData(data);
    setJsonViewerOpen(true);
  };

  const handleCopyJson = async () => {
    try {
      const txt = JSON.stringify(jsonViewerData, null, 2);
      await navigator.clipboard.writeText(txt);
      toast.success('Copied JSON');
    } catch (e) {
      toast.error('Copy failed');
    }
  };

  const handleDownloadJobProvenance = async () => {
    if (!liveJob?.jobId) return;
    try {
      const data = await apiService.getTdcTrainingProvenanceReport(liveJob.jobId);
      triggerJsonDownload(`${liveJob.jobId}-provenance-report.json`, data);
      toast.success('Downloaded job provenance report');
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Download failed');
    }
  };

  const handleViewJobProvenance = async () => {
    if (!liveJob?.jobId) return;
    setJsonViewerLoading(true);
    try {
      const data = await apiService.getTdcTrainingProvenanceReport(liveJob.jobId);
      openJsonViewer({
        title: 'Job provenance (JSON)',
        filename: `${liveJob.jobId}-provenance-report.json`,
        data,
      });
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Failed to load provenance');
    } finally {
      setJsonViewerLoading(false);
    }
  };

  const handleDownloadContractAudit = async () => {
    if (!liveJob?.contractId) return;
    try {
      const report = await apiService.getScittProvenanceReport(liveJob.contractId);
      triggerJsonDownload(`${liveJob.contractId}-provenance-audit.json`, report);
      toast.success('Downloaded contract audit bundle');
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Download failed');
    }
  };

  const handleViewContractAudit = async () => {
    if (!liveJob?.contractId) return;
    setJsonViewerLoading(true);
    try {
      const report = await apiService.getScittProvenanceReport(liveJob.contractId);
      openJsonViewer({
        title: 'Contract audit bundle (JSON)',
        filename: `${liveJob.contractId}-provenance-audit.json`,
        data: report,
      });
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Failed to load audit bundle');
    } finally {
      setJsonViewerLoading(false);
    }
  };

  const handleDownloadModelArtifact = async () => {
    if (!liveJob?.artifactDownloadUrl) {
      toast.error('No downloadable model artifact for this job');
      return;
    }
    try {
      const res = await api.get(liveJob.artifactDownloadUrl, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${liveJob.jobId}-model.bin`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded model artifact');
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Download failed');
    }
  };

  const handleViewJob = async (jobId) => {
    try {
      setPollJobId(null);
      setLiveJob(null);
      setJobLogs('');
      const data = await apiService.getTdcTrainingJob(jobId);
      setLiveJob(data.job);
      if (data.job?.contractId) await loadJobsForContract(data.job.contractId);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Failed to load job');
    }
  };

  const handleLoadLogs = async () => {
    if (!liveJob?.jobId) return;
    setLogsLoading(true);
    try {
      const txt = await apiService.getTdcTrainingJobLogs(liveJob.jobId);
      setJobLogs(typeof txt === 'string' ? txt : JSON.stringify(txt, null, 2));
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

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

  const handleDeployInference = async () => {
    if (!liveJob?.registeredModelId) return;
    setDeploying(true);
    try {
      const data = await apiService.deployTdcInferenceModel(liveJob.registeredModelId);
      const gate = data.governance;
      toast.success(
        gate && !gate.skipped
          ? `Deployed ${data.modelId} (Open-GMASE: ${gate.allow ? 'ALLOW' : 'DENY'})`
          : `Deployed ${data.modelId} for inference`
      );
      const refreshed = await apiService.getTdcTrainingJob(liveJob.jobId);
      setLiveJob(refreshed.job);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Deploy failed');
    } finally {
      setDeploying(false);
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
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Training &amp; models</Typography>
        <Button startIcon={<RefreshIcon />} onClick={loadContracts}>
          Refresh
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Run training for a <strong>signed</strong> contract. With{' '}
        <code>TRAINING_EXECUTION_MODE=local-docker</code> and uploaded dataset files, training uses your CSV data;
        otherwise the built-in trainer may fall back to demo datasets (see backend logs).
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Requirements: <code>environmentSpecs</code>, <code>trainingParams</code>,{' '}
        <code>tspCloudProvider</code>, non-empty <code>contractDatasets</code> and{' '}
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
        const showDetailForThisContract = Boolean(liveJob?.contractId && liveJob.contractId === cid);
        const readiness = readinessByContract[cid];
        return (
          <Card key={cid} sx={{ mb: 2 }}>
            <CardContent>
              {readiness?.warning && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {readiness.warning}
                </Alert>
              )}
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
                          <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
                            <Button size="small" onClick={() => handleViewJob(j.jobId)}>
                              View details
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setPollJobId(j.jobId);
                                setLiveJob(null);
                                setJobLogs('');
                              }}
                            >
                              Watch
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {showDetailForThisContract && liveJob && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Selected job detail
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>{liveJob.jobId}</strong> — {liveJob.status}
                    {liveJob.simulation && (
                      <Chip size="small" label="Simulated" sx={{ ml: 1 }} />
                    )}
                    {liveJob.executionMode && (
                      <Chip size="small" variant="outlined" label={liveJob.executionMode} sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  {liveJob.environmentSummary &&
                    (liveJob.environmentSummary.cloudProvider ||
                      liveJob.environmentSummary.kms ||
                      liveJob.environmentSummary.spiffeId) && (
                      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Environment (from contract)
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {[
                            liveJob.environmentSummary.cloudProvider &&
                              `cloud=${liveJob.environmentSummary.cloudProvider}`,
                            liveJob.environmentSummary.computeType &&
                              `compute=${liveJob.environmentSummary.computeType}`,
                            liveJob.environmentSummary.region &&
                              `region=${liveJob.environmentSummary.region}`,
                            liveJob.environmentSummary.trainingNamespace &&
                              `ns=${liveJob.environmentSummary.trainingNamespace}`,
                            (liveJob.environmentSummary.secretManager ||
                              liveJob.environmentSummary.kms?.provider) &&
                              `kms=${
                                liveJob.environmentSummary.secretManager ||
                                liveJob.environmentSummary.kms?.provider
                              }`,
                            (liveJob.environmentSummary.kms?.vaultOcid ||
                              liveJob.environmentSummary.kms?.keyVault) &&
                              `vault=${
                                liveJob.environmentSummary.kms?.vaultOcid ||
                                liveJob.environmentSummary.kms?.keyVault
                              }`,
                            liveJob.environmentSummary.spiffeId &&
                              `spiffe=${liveJob.environmentSummary.spiffeId}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                      </Paper>
                    )}
                  {typeof liveJob.progress === 'number' && (
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, liveJob.progress)}
                      sx={{ mb: 2 }}
                    />
                  )}

                  <PrivacyMetricsPanel
                    results={liveJob.results}
                    trainingConfig={liveJob.trainingConfig}
                    simulation={liveJob.simulation}
                    status={liveJob.status}
                  />

                  {(TERMINAL.has(liveJob.status) || liveJob.results) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Provenance &amp; artifacts (host / API — not only inside the trainer container)
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        <Button size="small" variant="outlined" onClick={handleViewJobProvenance} disabled={jsonViewerLoading}>
                          View job provenance
                        </Button>
                        <Button size="small" variant="outlined" onClick={handleDownloadJobProvenance}>
                          Download job provenance
                        </Button>
                        <Button size="small" variant="outlined" onClick={handleViewContractAudit} disabled={jsonViewerLoading}>
                          View contract audit bundle
                        </Button>
                        <Button size="small" variant="outlined" onClick={handleDownloadContractAudit}>
                          Download contract audit bundle
                        </Button>
                        {liveJob.artifactDownloadUrl && (
                          <Button size="small" variant="outlined" onClick={handleDownloadModelArtifact}>
                            Download model.bin
                          </Button>
                        )}
                        <Button size="small" variant="outlined" onClick={handleLoadLogs} disabled={logsLoading}>
                          {logsLoading ? 'Loading logs…' : 'View logs'}
                        </Button>
                      </Stack>
                      {liveJob.provenanceReportUrl && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          API: <code>{liveJob.provenanceReportUrl}</code> — on local-docker, the same JSON is also written
                          next to <code>metrics.json</code> as <code>provenance-report.json</code> under the run outputs
                          folder on the backend host.
                        </Typography>
                      )}
                    </Box>
                  )}

                  {jobLogs && (
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Job logs</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          component="pre"
                          sx={{
                            fontSize: 11,
                            overflow: 'auto',
                            m: 0,
                            maxHeight: 360,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {jobLogs}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
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
                        {liveJob.registeredModelId && liveJob.inferenceDeployment?.status !== 'DEPLOYED' && (
                          <Button
                            variant="contained"
                            color="secondary"
                            sx={{ mt: 2 }}
                            disabled={deploying}
                            onClick={handleDeployInference}
                          >
                            {deploying ? 'Deploying…' : 'Deploy for inference'}
                          </Button>
                        )}
                        {liveJob.inferenceDeployment?.status === 'DEPLOYED' && (
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
                            <Alert severity="info" sx={{ flex: 1 }}>
                              Inference deployed ({liveJob.inferenceDeployment.taskType}). Open the app to try predictions.
                            </Alert>
                            <Button
                              component={Link}
                              to={`/tdc/inference?modelId=${encodeURIComponent(liveJob.registeredModelId)}`}
                              variant="outlined"
                            >
                              Open inference app
                            </Button>
                          </Stack>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Paper>
              )}
            </CardContent>
          </Card>
        );
      })}

      {jsonViewerOpen && (
        <Paper
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            bgcolor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
          onClick={() => setJsonViewerOpen(false)}
          role="presentation"
        >
          <Paper
            onClick={(e) => e.stopPropagation()}
            sx={{ width: 'min(1000px, 100%)', maxHeight: 'min(80vh, 900px)', overflow: 'hidden' }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(148,163,184,0.35)',
              }}
            >
              <Box>
                <Typography variant="subtitle1">{jsonViewerTitle}</Typography>
                {jsonViewerFilename && (
                  <Typography variant="caption" color="text.secondary">
                    {jsonViewerFilename}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" gap={1} alignItems="center">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyJson}
                  disabled={!jsonViewerData}
                >
                  Copy
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => triggerJsonDownload(jsonViewerFilename || 'data.json', jsonViewerData)}
                  disabled={!jsonViewerData}
                >
                  Download
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<CloseIcon />}
                  onClick={() => setJsonViewerOpen(false)}
                >
                  Close
                </Button>
              </Stack>
            </Box>

            <Box sx={{ p: 2, overflow: 'auto', maxHeight: 'calc(80vh - 70px)' }}>
              <Box
                component="pre"
                sx={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {jsonViewerData ? JSON.stringify(jsonViewerData, null, 2) : 'No data'}
              </Box>
            </Box>
          </Paper>
        </Paper>
      )}
    </Container>
  );
}
