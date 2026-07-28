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
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  OCI_SCAFFOLD_FLAGS,
  OCI_ONBOARDING_MOCK,
  OCI_TSP_ENV_MOCK,
  OCI_CONTRACT_MOCK,
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

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Public mock UI: OCI design scaffolds “all enabled” walkthrough —
 * onboarding (keys + Vault), confidential TSP env, contract, provenance.
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
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
                Architecture walkthrough with mock Vault OCIDs, confidential compute TSP environment,
                contract KMS/env specs, and a sample provenance report. No live tenancy required.
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
          Mock data only. Design map:{' '}
          <code>docs/deployment/OCI_DESIGN_COMPLETE.md</code>. Flip Terraform{' '}
          <code>enable_*</code> flags when you apply to a real compartment.
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
          <Typography variant="h6" gutterBottom>
            Party onboarding — signing key in OCI Vault
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            After Identity Domains SSO, the party receives a DEPA-aligned ID and a signing key
            backed by OCI Vault (design path: <code>SIGNING_KEY_BACKEND=oci-vault</code>).
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
          <Typography variant="h6" gutterBottom>
            TSP — confidential compute environment (OCI)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Tech Service Provider offers an isolated clean-room path on OKE with OCI Vault for
            secrets and SPIFFE identity for the training Job Service Account.
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
          <Typography variant="h6" gutterBottom>
            Contract — environmentSpecs + kmsConfigs (OCI Vault)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Ricardian contract binds confidential-vm compute, Object Storage buckets, and OCI Vault
            KMS refs used for DEK/MEK and signing.
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
                  <TableCell>KMS provider</TableCell>
                  <TableCell>{OCI_CONTRACT_MOCK.environmentSpecs.kms.provider}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>computeType</TableCell>
                  <TableCell>{OCI_CONTRACT_MOCK.environmentSpecs.infrastructure.computeType}</TableCell>
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
          <Typography variant="h6" gutterBottom>
            Provenance / audit report (mock)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Same shape as the live <code>getScittProvenanceReport</code> / job provenance viewers —
            signatures, training completion, and key-release notes with a mock digest.
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
          </Stack>
          <JsonBlock value={OCI_PROVENANCE_MOCK} />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default OciScaffoldDemo;
