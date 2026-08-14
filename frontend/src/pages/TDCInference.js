import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import StopIcon from '@mui/icons-material/Stop';
import toast from 'react-hot-toast';
import apiService from '../services/api';

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (_) {
    return String(obj);
  }
}

export default function TDCInference() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [deployments, setDeployments] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('modelId') || '');
  const [inputText, setInputText] = useState('');
  const [predicting, setPredicting] = useState(false);
  const [undeploying, setUndeploying] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const selected = useMemo(
    () => deployments.find((d) => d.modelId === selectedId) || null,
    [deployments, selectedId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.listTdcInferenceDeployments();
      const rows = data.deployments || [];
      setDeployments(rows);
      if (!selectedId && rows[0]?.modelId) {
        setSelectedId(rows[0].modelId);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Failed to load deployments');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    const example = selected.inference?.exampleInput;
    setInputText(pretty(example || {}));
    if (selected.modelId !== searchParams.get('modelId')) {
      setSearchParams({ modelId: selected.modelId }, { replace: true });
    }
  }, [selected, searchParams, setSearchParams]);

  const handlePredict = async () => {
    if (!selectedId) return;
    setPredicting(true);
    setLastResult(null);
    try {
      let input;
      try {
        input = JSON.parse(inputText || '{}');
      } catch (_) {
        toast.error('Input must be valid JSON');
        return;
      }
      const data = await apiService.predictTdcInference(selectedId, input);
      setLastResult(data);
      toast.success(`Prediction: ${data.result?.label ?? data.result?.prediction}`);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const handleUndeploy = async () => {
    if (!selectedId) return;
    setUndeploying(true);
    try {
      await apiService.undeployTdcInferenceModel(selectedId);
      toast.success('Model undeployed');
      setLastResult(null);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Undeploy failed');
    } finally {
      setUndeploying(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Inference app
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run predictions against models you registered from completed training jobs and deployed for local inference.
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 2 }}>
        Flow: Training → <strong>Register trained model</strong> → <strong>Deploy for inference</strong> → try inputs here.
        See also <Link to="/tdc/training">Training</Link>.
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : deployments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              No deployed models yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete a local training job, register the model, then click <em>Deploy for inference</em> on the Training page.
            </Typography>
            <Button component={Link} to="/tdc/training" variant="contained">
              Go to Training
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <TextField
                select
                fullWidth
                label="Deployed model"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                sx={{ mb: 2 }}
              >
                {deployments.map((d) => (
                  <MenuItem key={d.modelId} value={d.modelId}>
                    {d.name} ({d.modelId}) — {d.inference?.taskType || d.type}
                  </MenuItem>
                ))}
              </TextField>

              {selected && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  <Chip label={`task: ${selected.inference?.taskType || 'unknown'}`} size="small" />
                  <Chip label={`type: ${selected.type}`} size="small" variant="outlined" />
                  <Chip label={selected.architecture} size="small" variant="outlined" />
                  <Chip label={`mode: ${selected.inference?.mode || 'docker'}`} size="small" variant="outlined" />
                </Stack>
              )}

              <Typography variant="subtitle2" gutterBottom>
                Request JSON
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='{"text":"..."} or {"features":[...]} or {"demo":true}'
                sx={{ fontFamily: 'monospace', mb: 2 }}
              />

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={predicting ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  disabled={predicting || !selectedId}
                  onClick={handlePredict}
                >
                  {predicting ? 'Running…' : 'Run prediction'}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<StopIcon />}
                  disabled={undeploying || !selectedId}
                  onClick={handleUndeploy}
                >
                  Undeploy
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {lastResult && (
            <Card data-testid="inference-result-card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Result
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Label: <strong>{lastResult.result?.label ?? '—'}</strong>
                  {lastResult.result?.prediction != null && (
                    <> (class {lastResult.result.prediction})</>
                  )}
                  {lastResult.latencyMs != null && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {' '}
                      · {lastResult.latencyMs} ms
                    </Typography>
                  )}
                </Typography>

                {lastResult.governance && !lastResult.governance.skipped && (
                  <Alert
                    data-testid="gmase-governance"
                    severity={lastResult.governance.allow ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Open-GMASE policy gate
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        color={lastResult.governance.allow ? 'success' : 'error'}
                        label={lastResult.governance.allow ? 'ALLOW' : 'DENY'}
                      />
                      {lastResult.governance.package && (
                        <Chip size="small" variant="outlined" label={lastResult.governance.package} />
                      )}
                      {lastResult.governance.auditId != null && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`audit #${lastResult.governance.auditId}`}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2">
                      {lastResult.governance.reason || 'Policy evaluated before inference ran.'}
                    </Typography>
                  </Alert>
                )}

                <Divider sx={{ my: 1 }} />
                <Box component="pre" sx={{ fontSize: 12, overflow: 'auto', m: 0 }}>
                  {pretty(lastResult)}
                </Box>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </Container>
  );
}
