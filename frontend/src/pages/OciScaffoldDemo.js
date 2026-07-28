import React, { useState } from 'react';
import {
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
  PersonAdd as RegisterIcon,
  Inventory2 as CatalogIcon,
  Description as ContractIcon,
  Terminal as TerminalIcon,
  FactCheck as ProvenanceIcon,
  RocketLaunch as DeployIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  OCI_SHARED,
  OCI_E2E_PARTIES,
  OCI_TSP_ENV_MOCK,
  OCI_CATALOG_MOCK,
  OCI_CONTRACT_MOCK,
  OCI_TRAINING_JOB_MOCK,
  OCI_TRAINING_LOGS_MOCK,
  OCI_PROVENANCE_MOCK,
  OCI_INFERENCE_MOCK,
} from '../data/ociScaffoldMock';

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

function JsonBlock({ value, maxHeight = 360 }) {
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
        maxHeight,
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
        maxHeight: 420,
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

function SectionTitle({ children, subtitle }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {children}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

/**
 * Public OCI product-flow demo: registration → catalog → contract → train →
 * provenance → deploy & predict (same path as the Local lifecycle tour).
 */
const OciScaffoldDemo = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f2ec', pb: 6 }}>
      <Box sx={{ borderBottom: '1px solid #d4cfc4', bgcolor: '#fffcf6', py: 2 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ color: '#0a5c45', fontWeight: 700, letterSpacing: 1 }}>
                Confidential AI Network · OCI
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                From registration to a live prediction
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                Full multi-party path on OCI: onboard parties (Identity Domains + Vault), publish data,
                sign a Ricardian contract with confidential compute and OCI Vault KMS, train on OKE,
                review provenance, then deploy and run a prediction.
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
        <Paper sx={{ px: 2, pt: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<RegisterIcon />} iconPosition="start" label="1. Registration" />
            <Tab icon={<CatalogIcon />} iconPosition="start" label="2. Catalog" />
            <Tab icon={<ContractIcon />} iconPosition="start" label="3. Contract" />
            <Tab icon={<TerminalIcon />} iconPosition="start" label="4. Training" />
            <Tab icon={<ProvenanceIcon />} iconPosition="start" label="5. Provenance" />
            <Tab icon={<DeployIcon />} iconPosition="start" label="6. Deploy & predict" />
          </Tabs>
        </Paper>

        <TabPanel value={tab} index={0}>
          <SectionTitle subtitle="Each party registers as an enterprise org on OCI IAM Identity Domains, receives a DEPA ID, and (for signing parties) a Vault-backed key.">
            Party registration
          </SectionTitle>
          <Grid container spacing={2}>
            {OCI_E2E_PARTIES.map((p) => (
              <Grid item xs={12} md={4} key={p.role}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Chip label={p.role} color="primary" size="small" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      {p.label}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" gutterBottom>
                    {p.organization}
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '40%', border: 0, px: 0 }}>DEPA ID</TableCell>
                        <TableCell
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.72rem',
                            border: 0,
                            px: 0,
                            wordBreak: 'break-all',
                          }}
                        >
                          {p.depaId}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, border: 0, px: 0 }}>IdP</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', border: 0, px: 0 }}>{p.identityProvider}</TableCell>
                      </TableRow>
                      {p.cloudProvider && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, border: 0, px: 0 }}>Cloud</TableCell>
                          <TableCell sx={{ border: 0, px: 0 }}>
                            {p.cloudProvider} · {p.secretManager}
                          </TableCell>
                        </TableRow>
                      )}
                      {p.vaultOcid && (
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, border: 0, px: 0 }}>Vault</TableCell>
                          <TableCell
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.72rem',
                              border: 0,
                              px: 0,
                              wordBreak: 'break-all',
                            }}
                          >
                            {p.vaultOcid}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {p.dashboard}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              TSP confidential compute (offered after registration)
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
              <Chip size="small" label={OCI_SHARED.confidentialCompute.computeType} />
              <Chip size="small" label={OCI_SHARED.confidentialCompute.platform} />
              <Chip size="small" label={`ns=${OCI_SHARED.confidentialCompute.trainingNamespace}`} />
              <Chip size="small" label="OCI_VAULT" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {OCI_SHARED.confidentialCompute.spiffeId}
            </Typography>
          </Paper>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <SectionTitle subtitle="TDP publishes a dataset to Object Storage; TDC selects that dataset and a catalog model when creating the contract.">
            Dataset &amp; model catalog
          </SectionTitle>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dataset (TDP)
                </Typography>
                <JsonBlock value={OCI_CATALOG_MOCK.dataset} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Model (catalog)
                </Typography>
                <JsonBlock value={OCI_CATALOG_MOCK.model} />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <SectionTitle subtitle="TDC proposes terms, selects the OCI TSP, binds confidential-vm + OCI Vault KMS into environmentSpecs / kmsConfigs. TDP and TSP sign.">
            Contract creation &amp; signing
          </SectionTitle>
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
                  <TableCell>Title</TableCell>
                  <TableCell>{OCI_CONTRACT_MOCK.title}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>
                    <Chip label={OCI_CONTRACT_MOCK.status} color="success" size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>TSP</TableCell>
                  <TableCell>
                    {OCI_TSP_ENV_MOCK.tsp.displayName} ({OCI_CONTRACT_MOCK.tspCloudProvider} ·{' '}
                    {OCI_CONTRACT_MOCK.kmsConfigs.provider})
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Compute</TableCell>
                  <TableCell>
                    {OCI_CONTRACT_MOCK.environmentSpecs.infrastructure.computeType} ·{' '}
                    {OCI_CONTRACT_MOCK.environmentSpecs.infrastructure.okeCluster}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vault OCID</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {OCI_CONTRACT_MOCK.kmsConfigs.vaultOcid}
                  </TableCell>
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
          <Typography variant="subtitle2" gutterBottom>
            Bound environmentSpecs + kmsConfigs
          </Typography>
          <JsonBlock
            value={{
              environmentSpecs: OCI_CONTRACT_MOCK.environmentSpecs,
              kmsConfigs: OCI_CONTRACT_MOCK.kmsConfigs,
            }}
          />
          <Button
            sx={{ mt: 2 }}
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() => downloadJson(`${OCI_CONTRACT_MOCK.contractId}.json`, OCI_CONTRACT_MOCK)}
          >
            Download contract JSON
          </Button>
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <SectionTitle subtitle="After SIGNED, TDC starts an oci-oke-job. Logs show the same Vault OCID, SPIFFE ID, and Object Storage buckets as the contract.">
            Training, run logs
          </SectionTitle>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
              <Chip label={OCI_TRAINING_JOB_MOCK.status} color="success" size="small" />
              <Chip label={OCI_TRAINING_JOB_MOCK.executionMode} size="small" variant="outlined" />
              <Chip label={`region=${OCI_SHARED.region}`} size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 1 }}>
              {OCI_TRAINING_JOB_MOCK.jobId}
            </Typography>
            <JsonBlock value={OCI_TRAINING_JOB_MOCK.environmentSummary} maxHeight={240} />
          </Paper>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => downloadText(`${OCI_SHARED.jobId}-runner.log`, OCI_TRAINING_LOGS_MOCK)}
            >
              Download runner.log
            </Button>
            <Button variant="outlined" onClick={() => setTab(4)}>
              Open provenance
            </Button>
          </Stack>
          <LogBlock text={OCI_TRAINING_LOGS_MOCK} />
        </TabPanel>

        <TabPanel value={tab} index={4}>
          <SectionTitle subtitle="Contract audit bundle: environmentSpecs, kmsConfigs, and trainingJobs.environmentSummary carry TSP OCI Vault and confidential compute details.">
            Provenance report
          </SectionTitle>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{ bgcolor: '#0a5c45' }}
              onClick={() =>
                downloadJson(`${OCI_PROVENANCE_MOCK.contractId}-provenance-audit.json`, OCI_PROVENANCE_MOCK)
              }
            >
              Download provenance JSON
            </Button>
            <Button variant="outlined" onClick={() => setTab(5)}>
              Deploy &amp; predict
            </Button>
          </Stack>
          <JsonBlock value={OCI_PROVENANCE_MOCK} maxHeight={480} />
        </TabPanel>

        <TabPanel value={tab} index={5}>
          <SectionTitle subtitle="Register the trained artifact, deploy for inference on OKE, and run a prediction — same end state as the Local product tour.">
            Deploy &amp; test the model
          </SectionTitle>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Deployment
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>modelId</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {OCI_INFERENCE_MOCK.modelId}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>status</TableCell>
                      <TableCell>
                        <Chip label={OCI_INFERENCE_MOCK.status} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>runtime</TableCell>
                      <TableCell>{OCI_INFERENCE_MOCK.runtime}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>endpoint</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {OCI_INFERENCE_MOCK.endpoint}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Inference request
                </Typography>
                <JsonBlock value={OCI_INFERENCE_MOCK.request} maxHeight={120} />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Prediction result
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip label={OCI_INFERENCE_MOCK.prediction.label} color="success" />
                  <Typography variant="body2">
                    confidence {(OCI_INFERENCE_MOCK.prediction.confidence * 100).toFixed(0)}%
                  </Typography>
                </Stack>
                <JsonBlock value={OCI_INFERENCE_MOCK.prediction} maxHeight={160} />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Container>
    </Box>
  );
};

export default OciScaffoldDemo;
