import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  CloudQueue as CloudIcon,
  Description as ContractIcon,
  FactCheck as ProvenanceIcon,
  Terminal as TerminalIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  OCI_SCAFFOLD_FLAGS,
  OCI_SHARED,
  OCI_ONBOARDING_MOCK,
  OCI_TSP_ENV_MOCK,
  OCI_CONTRACT_MOCK,
  OCI_TRAINING_JOB_MOCK,
  OCI_TRAINING_LOGS_MOCK,
  OCI_PROVENANCE_MOCK,
} from '../data/ociScaffoldMock';

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

function JsonBlock({ value }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        bgcolor: '#1c1d1b',
        color: '#e8e4da',
        borderRadius: 1,
        overflow: 'auto',
        fontSize: '0.78rem',
        lineHeight: 1.45,
        maxHeight: 420,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}

function LogBlock({ text }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        bgcolor: '#1c1d1b',
        color: '#c8e6c9',
        borderRadius: 1,
        overflow: 'auto',
        fontSize: '0.78rem',
        lineHeight: 1.5,
        maxHeight: 480,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      }}
    >
      {text}
    </Box>
  );
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Same TSP / Vault / confidential-compute chips on every product-flow tab. */
function SharedOciContextBanner() {
  const rows = [
    ['TSP', OCI_TSP_ENV_MOCK.tsp.displayName],
    ['Cloud / secret manager', `${OCI_SHARED.cloudProvider} · ${OCI_SHARED.secretManager}`],
    ['Compute', `${OCI_SHARED.confidentialCompute.computeType} · ${OCI_SHARED.confidentialCompute.platform}`],
    ['Vault OCID', OCI_SHARED.vault.vaultOcid],
    ['Master key', OCI_SHARED.vault.masterKeyOcid],
    ['SPIFFE', OCI_SHARED.confidentialCompute.spiffeId],
    ['Object Storage outputs', OCI_SHARED.objectStorage.outputs],
  ];
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fffcf6' }}>
      <Typography variant="subtitle2" gutterBottom sx={{ color: '#0a5c45', fontWeight: 700 }}>
        Shared OCI product-flow context (same refs on TSP → contract → logs → provenance)
      </Typography>
      <Table size="small">
        <TableBody>
          {rows.map(([k, v]) => (
            <TableRow key={k}>
              <TableCell sx={{ fontWeight: 600, width: '28%', border: 0, py: 0.4 }}>{k}</TableCell>
              <TableCell
                sx={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.78rem',
                  border: 0,
                  py: 0.4,
                  wordBreak: 'break-all',
                }}
              >
                {v}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

/**
 * Public mock UI: OCI design scaffolds “all enabled” walkthrough —
 * onboarding (keys + Vault), confidential TSP env, contract, training logs, provenance.
 */
const OciScaffoldDemo = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const flags = useMemo(() => Object.entries(OCI_SCAFFOLD_FLAGS), []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f2ec', pb: 6 }}>
      <Box
        sx={{
          borderBottom: '1px solid #d4cfc4',
          bgcolor: '#fffcf6',
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ color: '#0a5c45', fontWeight: 700, letterSpacing: 1 }}>
                Confidential AI Network · OCI mock
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                OCI scaffolds — all enabled
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                End-to-end mock product flow: TSP with OCI Vault KMS and confidential compute, bound into the
                Ricardian contract, echoed in training logs, and carried into the provenance audit report.
                No live tenancy required.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Button variant="outlined" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button variant="contained" onClick={() => navigate('/login')} sx={{ bgcolor: '#0a5c45' }}>
                Sign in to live app
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Mock data only — one shared context (<code>OCI_SHARED</code>) drives every tab. Design map:{' '}
          <code>docs/deployment/OCI_DESIGN_COMPLETE.md</code>.
        </Alert>

        <Paper sx={{ px: 2, pt: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<SecurityIcon />} iconPosition="start" label="Scaffolds" />
            <Tab icon={<VpnKeyIcon />} iconPosition="start" label="Onboarding · Keys & Vault" />
            <Tab icon={<CloudIcon />} iconPosition="start" label="TSP confidential env" />
            <Tab icon={<ContractIcon />} iconPosition="start" label="Contract" />
            <Tab icon={<TerminalIcon />} iconPosition="start" label="Training logs" />
            <Tab icon={<ProvenanceIcon />} iconPosition="start" label="Provenance" />
          </Tabs>
        </Paper>

        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>
            Opt-in scaffolds (shown as enabled)
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {flags.map(([key, val]) => (
              <Grid item key={key}>
                <Chip
                  label={`${key}=${String(val)}`}
                  color={val === true || (typeof val === 'string' && val !== 'false') ? 'success' : 'default'}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" color="text.secondary" paragraph>
            These mirror <code>deployment/oci/terraform</code> flags and{' '}
            <code>config/examples/config.oci.env.example</code>. In a real apply, defaults stay{' '}
            <code>false</code> until you opt in.
          </Typography>
          <JsonBlock value={OCI_SCAFFOLD_FLAGS} />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <SharedOciContextBanner />
          <Typography variant="h6" gutterBottom>
            Party onboarding — signing key in OCI Vault
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            After Identity Domains SSO, the party receives a DEPA-aligned ID and a signing key
            backed by the same OCI Vault OCID used later on the contract and provenance claims.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Party
                </Typography>
                <Table size="small">
                  <TableBody>
                    {Object.entries(OCI_ONBOARDING_MOCK.party).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ fontWeight: 600, width: '40%' }}>{k}</TableCell>
                        <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
                          {v}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Signing key
                </Typography>
                <Table size="small">
                  <TableBody>
                    {Object.entries(OCI_ONBOARDING_MOCK.signingKey).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ fontWeight: 600, width: '40%' }}>{k}</TableCell>
                        <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
                          {String(v)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  OCI Vault (platform)
                </Typography>
                <JsonBlock value={OCI_ONBOARDING_MOCK.vault} />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <SharedOciContextBanner />
          <Typography variant="h6" gutterBottom>
            TSP — confidential compute environment (OCI + OCI Vault)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Tech Service Provider offers an isolated clean-room path on OKE with OCI Vault for
            secrets/KMS and SPIFFE identity for the training Job Service Account. These values are
            copied into the contract <code>environmentSpecs</code> / <code>kmsConfigs</code>.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cloud credentials (OCI + OCI_VAULT)
                </Typography>
                <JsonBlock value={{ ...OCI_TSP_ENV_MOCK.tsp, ...OCI_TSP_ENV_MOCK.credentials }} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Confidential compute offering
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                  {OCI_TSP_ENV_MOCK.confidentialCompute.features.map((f) => (
                    <Chip key={f} label={f} size="small" />
                  ))}
                </Stack>
                <JsonBlock value={OCI_TSP_ENV_MOCK.confidentialCompute} />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <SharedOciContextBanner />
          <Typography variant="h6" gutterBottom>
            Contract — TSP OCI KMS + confidential compute bound in
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Ricardian contract binds <code>tspCloudProvider=OCI</code>, confidential-vm compute,
            Object Storage buckets, and OCI Vault KMS refs (same OCIDs as TSP / onboarding).
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>contractId</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {OCI_CONTRACT_MOCK.contractId}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>status</TableCell>
                  <TableCell>
                    <Chip label={OCI_CONTRACT_MOCK.status} color="success" size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>tspCloudProvider</TableCell>
                  <TableCell>{OCI_CONTRACT_MOCK.tspCloudProvider}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>KMS provider</TableCell>
                  <TableCell>
                    {OCI_CONTRACT_MOCK.kmsConfigs.provider} /{' '}
                    {OCI_CONTRACT_MOCK.environmentSpecs.kms.provider}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vault OCID</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {OCI_CONTRACT_MOCK.kmsConfigs.vaultOcid}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>computeType</TableCell>
                  <TableCell>{OCI_CONTRACT_MOCK.environmentSpecs.infrastructure.computeType}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>SPIFFE</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {OCI_CONTRACT_MOCK.environmentSpecs.infrastructure.spiffeId}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Full contract scaffold JSON
          </Typography>
          <JsonBlock value={OCI_CONTRACT_MOCK} />
          <Button
            sx={{ mt: 2 }}
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() => downloadJson(`${OCI_CONTRACT_MOCK.contractId}-scaffold.json`, OCI_CONTRACT_MOCK)}
          >
            Download contract JSON
          </Button>
        </TabPanel>

        <TabPanel value={tab} index={4}>
          <SharedOciContextBanner />
          <Typography variant="h6" gutterBottom>
            Training logs — same Vault / SPIFFE / buckets as the contract
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Simulated <code>oci-oke-job</code> runner output. Every OCID and SPIFFE ID matches the
            contract <code>environmentSpecs</code> and appears again in the provenance report.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Job summary
            </Typography>
            <JsonBlock value={OCI_TRAINING_JOB_MOCK} />
          </Paper>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => downloadText(`${OCI_SHARED.jobId}-runner.log`, OCI_TRAINING_LOGS_MOCK)}
            >
              Download runner.log
            </Button>
            <Button variant="outlined" onClick={() => setTab(5)}>
              Open provenance
            </Button>
          </Stack>
          <LogBlock text={OCI_TRAINING_LOGS_MOCK} />
        </TabPanel>

        <TabPanel value={tab} index={5}>
          <SharedOciContextBanner />
          <Typography variant="h6" gutterBottom>
            Provenance / audit report (mock)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Same shape as live <code>buildProvenanceAuditReport</code>:{' '}
            <code>contract.environmentSpecs</code>, <code>kmsConfigs</code>, and{' '}
            <code>trainingJobs[].environmentSummary</code> carry the TSP OCI Vault + confidential
            compute details from earlier tabs.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{ bgcolor: '#0a5c45' }}
              onClick={() =>
                downloadJson(
                  `${OCI_PROVENANCE_MOCK.contractId}-provenance-audit.json`,
                  OCI_PROVENANCE_MOCK
                )
              }
            >
              Download provenance JSON
            </Button>
            <Button variant="outlined" onClick={() => setTab(3)}>
              Back to contract
            </Button>
            <Button variant="outlined" onClick={() => setTab(4)}>
              Back to training logs
            </Button>
          </Stack>
          <JsonBlock value={OCI_PROVENANCE_MOCK} />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default OciScaffoldDemo;
