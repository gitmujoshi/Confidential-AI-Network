import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  ExpandMore,
  ExpandLess,
  Verified,
  Description,
  ContentCopy,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';

/**
 * Auditor Merkle audit tree inspector for a contract.
 */
const AuditorAuditTree = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const { data, isLoading, error, refetch } = useQuery(
    ['auditorAuditTree', contractId],
    () => apiService.getAuditorAuditTree(contractId),
    { enabled: !!contractId, staleTime: 10000 }
  );

  const merkle = data?.merkle;
  const contract = data?.contract;

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const verifyLeaf = async (leaf) => {
    if (!merkle?.published) {
      toast.error('This audit root is not sealed yet');
      return;
    }
    if (!leaf?.proof || leaf.proof.error) {
      toast.error('No proof available for this leaf');
      return;
    }
    setVerifyingId(leaf.nodeId);
    try {
      const res = await apiService.verifyAuditorMerkleProof({
        contractId,
        nodeId: leaf.nodeId,
      });
      setVerifyResult(res.verification);
      if (res.verification?.isValid) {
        toast.success('Inclusion proof valid');
      } else {
        toast.error(res.verification?.error || 'Proof invalid');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Verify failed');
    } finally {
      setVerifyingId(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', pt: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Building Merkle audit tree…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ pt: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/auditor/dashboard')}>
          Back
        </Button>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.response?.data?.error || error.message || 'Failed to load audit tree'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/auditor/dashboard')} sx={{ mb: 2 }}>
        Back to auditor workspace
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Merkle audit tree
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Contract <code>{contractId}</code>
        {contract?.status ? ` · ${contract.status}` : ''}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {merkle?.published ? 'Published root' : 'Unsealed root'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}
            >
              {merkle?.rootHash || '—'}
            </Typography>
            {merkle?.rootHash && (
              <IconButton size="small" onClick={() => copy(merkle.rootHash)}>
                <ContentCopy fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {merkle?.hashAlgorithm} · {merkle?.nodeCount} leaves
            {merkle?.publishedAt ? ` · sealed ${new Date(merkle.publishedAt).toLocaleString()}` : ' · not sealed'}
            {' · '}
            {merkle?.treeId}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="caption" color="text.secondary">
            Evidence counts
          </Typography>
          <Typography variant="body2">
            Jobs: {data?.provenanceSummary?.trainingJobCount ?? 0}
          </Typography>
          <Typography variant="body2">
            SCITT claims: {data?.provenanceSummary?.scittClaimCount ?? 0}
          </Typography>
          <Typography variant="body2">
            Models: {data?.provenanceSummary?.registeredModelCount ?? 0}
          </Typography>
          <Button
            size="small"
            startIcon={<Description />}
            sx={{ mt: 1 }}
            onClick={() => navigate(`/auditor/contracts/${contractId}`)}
          >
            Open contract
          </Button>
        </Paper>
      </Stack>

      <Alert severity="info" sx={{ mb: 2 }}>
        {merkle?.published
          ? 'Verify checks this leaf against the root sealed when training evidence was recorded. A later edit to the database record is reported separately from the proof result.'
          : 'This tree is computed from the current records. The root is sealed once a completed training job is available.'}
      </Alert>

      {verifyResult && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }} data-testid="audit-verify-result">
          <Alert
            severity={verifyResult.isValid ? 'success' : 'error'}
            sx={{ mb: 2 }}
            onClose={() => setVerifyResult(null)}
          >
            {verifyResult.isValid ? 'Inclusion proof valid' : verifyResult.error || 'Proof invalid'}
          </Alert>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {verifyResult.leaf?.kind || 'leaf'} · {verifyResult.leaf?.summary || verifyResult.nodeId}
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Leaf hash: {verifyResult.leaf?.dataHash || verifyResult.targetHash || '—'}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Calculated root: {verifyResult.calculatedRoot || '—'}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Published root: {verifyResult.publishedRoot || verifyResult.expectedRoot || '—'}
            </Typography>
            <Typography variant="body2">
              Checked: {verifyResult.verifiedAt ? new Date(verifyResult.verifiedAt).toLocaleString() : '—'}
            </Typography>
            <Typography variant="body2">
              Current database record:{' '}
              {verifyResult.currentRecordMatches
                ? 'matches the sealed leaf'
                : 'differs from the sealed leaf'}
            </Typography>
          </Stack>
          {verifyResult.leaf?.payload && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Sealed leaf contents
              </Typography>
              <pre
                style={{
                  margin: '8px 0 0',
                  fontSize: 11,
                  overflow: 'auto',
                  maxHeight: 240,
                }}
              >
                {JSON.stringify(verifyResult.leaf.payload, null, 2)}
              </pre>
            </Box>
          )}
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>#</TableCell>
              <TableCell>Kind</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell>Leaf hash</TableCell>
              <TableCell align="right">Verify</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(merkle?.leaves || []).map((leaf) => {
              const open = !!expanded[leaf.nodeId];
              return (
                <React.Fragment key={leaf.nodeId}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [leaf.nodeId]: !prev[leaf.nodeId] }))
                        }
                      >
                        {open ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{leaf.position}</TableCell>
                    <TableCell>
                      <Chip size="small" label={leaf.kind} />
                    </TableCell>
                    <TableCell>
                      {leaf.summary}
                      {leaf.currentRecordMatches === false && (
                        <Chip size="small" color="warning" label="record changed" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                      >
                        {leaf.dataHash?.slice(0, 16)}…
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Verified />}
                        disabled={verifyingId === leaf.nodeId}
                        onClick={() => verifyLeaf(leaf)}
                      >
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                      <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="caption" color="text.secondary">
                            Inclusion proof
                          </Typography>
                          <pre
                            style={{
                              margin: '8px 0 0',
                              fontSize: 11,
                              overflow: 'auto',
                              maxHeight: 240,
                            }}
                          >
                            {JSON.stringify(leaf.proof, null, 2)}
                          </pre>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Button sx={{ mt: 2 }} onClick={() => refetch()}>
        Rebuild tree
      </Button>
    </Box>
  );
};

export default AuditorAuditTree;
