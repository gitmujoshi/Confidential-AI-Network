import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  AccountTree,
  Visibility,
  Description,
  Search,
  FactCheck,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { apiService } from '../../services/api';

/**
 * Auditor dashboard — list contracts and open Merkle audit trees + contract review.
 */
const AuditorDashboard = () => {
  const navigate = useNavigate();
  const { currentUser: user, isInitializing } = useUser();
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery(
    ['auditorContracts', user?.id],
    () => apiService.getAuditorContracts({ limit: 100 }),
    {
      enabled: !!user?.id && !isInitializing,
      staleTime: 15000,
    }
  );

  const contracts = data?.contracts || [];
  const filtered = contracts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(c.contractId || '').toLowerCase().includes(q) ||
      String(c.status || '').toLowerCase().includes(q) ||
      String(c.tdcName || '').toLowerCase().includes(q) ||
      String(c.depaId || '').toLowerCase().includes(q)
    );
  });

  if (isInitializing || isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading auditor workspace…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load contracts: {error.message || String(error)}
      </Alert>
    );
  }

  return (
    <Box sx={{ pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Auditor workspace
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            Review Ricardian contracts and inspect Merkle audit trees when a model misbehaves.
            Read-only — you cannot sign, train, or change party assignments.
          </Typography>
        </Box>
        <Chip icon={<FactCheck />} label="Auditor" color="primary" variant="outlined" />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Pick a contract → open the <strong>audit tree</strong> (root + leaf inclusion proofs) or the
        full <strong>contract</strong> record the training was based on.
      </Alert>

      <TextField
        size="small"
        placeholder="Search by contract ID, status, TDC…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, minWidth: 320 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Contract</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>TDC</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No contracts found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.contractId} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {c.contractId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={c.status || '—'} />
                  </TableCell>
                  <TableCell>{c.tdcName || c.tdcId || '—'}</TableCell>
                  <TableCell>
                    {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<AccountTree />}
                      onClick={() => navigate(`/auditor/contracts/${c.contractId}/audit-tree`)}
                      sx={{ mr: 1 }}
                    >
                      Audit tree
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Description />}
                      onClick={() => navigate(`/auditor/contracts/${c.contractId}`)}
                    >
                      Contract
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Button
          variant="text"
          startIcon={<Visibility />}
          onClick={() => navigate('/auditor/contracts')}
        >
          Browse all contracts
        </Button>
      </Box>
    </Box>
  );
};

export default AuditorDashboard;
