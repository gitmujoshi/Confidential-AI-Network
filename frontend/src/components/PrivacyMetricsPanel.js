import React from 'react';
import { Alert, AlertTitle, Box, Chip, Grid, Paper, Typography } from '@mui/material';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';

function isDpRequested(trainingConfig) {
  if (!trainingConfig || typeof trainingConfig !== 'object') return false;
  const dp = trainingConfig.differentialPrivacy;
  if (dp && typeof dp === 'object' && dp.enabled) return true;
  const pt = String(trainingConfig.privacyTechnique || '').toLowerCase();
  return pt.includes('differential') || pt === 'dp' || pt === 'differential-privacy';
}

function formatNumber(value, digits = 4) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n < 0.001) return n.toExponential(2);
  return n.toFixed(digits).replace(/\.?0+$/, (m) => (m === '.' ? '' : m));
}

/**
 * Compact privacy metrics for TDC training job detail (contract terms + run results).
 */
export default function PrivacyMetricsPanel({ results, trainingConfig, simulation, status }) {
  const metrics = results?.privacyMetrics;
  const dpRequested = isDpRequested(trainingConfig);
  const dpConfig = trainingConfig?.differentialPrivacy || {};
  const terminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status);

  if (!dpRequested && !metrics) return null;

  if (metrics && typeof metrics === 'object') {
    const technique = metrics.technique || 'differential-privacy';
    const mechanism = metrics.mechanism || 'dp-sgd';
    const spentEpsilon = metrics.epsilon;
    const targetEpsilon = metrics.targetEpsilon ?? dpConfig.epsilon;
    const delta = metrics.delta ?? dpConfig.delta;

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderColor: 'secondary.light',
          bgcolor: 'rgba(156, 39, 176, 0.04)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <PrivacyTipIcon color="secondary" fontSize="small" />
          <Typography variant="subtitle1" component="h3">
            Privacy metrics
          </Typography>
          <Chip size="small" label={technique} color="secondary" variant="outlined" />
          {simulation && <Chip size="small" label="Simulated" variant="outlined" />}
        </Box>

        {simulation && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            Simulated run — ε below is placeholder, not Opacus DP-SGD.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Spent ε
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatNumber(spentEpsilon)}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Target ε (contract)
            </Typography>
            <Typography variant="body1">{formatNumber(targetEpsilon)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              δ
            </Typography>
            <Typography variant="body1">{formatNumber(delta, 6)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Mechanism
            </Typography>
            <Typography variant="body1">{mechanism}</Typography>
          </Grid>
          {metrics.maxGradNorm != null && (
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Max grad norm
              </Typography>
              <Typography variant="body1">{formatNumber(metrics.maxGradNorm, 2)}</Typography>
            </Grid>
          )}
          {metrics.noiseMultiplier != null && (
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Noise multiplier
              </Typography>
              <Typography variant="body1">{formatNumber(metrics.noiseMultiplier)}</Typography>
            </Grid>
          )}
        </Grid>

        {!simulation && results?.privacyEnhancedTraining && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Local-docker NLP trainer applied Opacus DP-SGD; values are recorded in{' '}
            <code>metrics.json</code> on the backend host.
          </Typography>
        )}
      </Paper>
    );
  }

  if (dpRequested && !terminal) {
    return (
      <Alert severity="info" icon={<PrivacyTipIcon />} sx={{ mb: 2 }}>
        <AlertTitle>Differential privacy enabled on contract</AlertTitle>
        Privacy metrics (spent ε, δ, mechanism) will appear here when the job completes. NLP
        local-docker runs use Opacus DP-SGD when the text trainer is selected.
      </Alert>
    );
  }

  if (dpRequested && terminal) {
    return (
      <Alert severity="warning" icon={<PrivacyTipIcon />} sx={{ mb: 2 }}>
        <AlertTitle>Privacy technique on contract</AlertTitle>
        Differential privacy was requested (target ε={formatNumber(dpConfig.epsilon)}), but this
        run did not return <code>privacyMetrics</code>. Use local-docker with an NLP contract for
        the Opacus demo path.
      </Alert>
    );
  }

  return null;
}
