import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';

const auditEvents = [
  {
    id: 'evt-001',
    timestamp: '2024-01-15 14:32:15',
    eventType: 'TOOL_INVOCATION',
    agentId: 'agent-001',
    action: 'invoke:execute_sql',
    result: 'denied',
    violations: ['DROP TABLE operations not allowed in production'],
  },
  {
    id: 'evt-002',
    timestamp: '2024-01-15 14:30:45',
    eventType: 'POLICY_EVALUATION',
    agentId: 'agent-002',
    action: 'evaluate:http_request',
    result: 'success',
    violations: [],
  },
  {
    id: 'evt-003',
    timestamp: '2024-01-15 14:28:12',
    eventType: 'SVID_ISSUED',
    agentId: 'agent-003',
    action: 'svid:issued',
    result: 'success',
    violations: [],
  },
  {
    id: 'evt-004',
    timestamp: '2024-01-15 14:25:33',
    eventType: 'TOOL_INVOCATION',
    agentId: 'agent-001',
    action: 'invoke:llm_inference',
    result: 'denied',
    violations: ['Operation exceeds cost threshold: $120.50 > $100'],
  },
  {
    id: 'evt-005',
    timestamp: '2024-01-15 14:20:08',
    eventType: 'AGENT_REGISTERED',
    agentId: 'agent-004',
    action: 'register',
    result: 'success',
    violations: [],
  },
];

export default function AuditTrail() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Audit Trail
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Event Type"
              defaultValue="all"
              size="small"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="TOOL_INVOCATION">Tool Invocation</MenuItem>
              <MenuItem value="POLICY_EVALUATION">Policy Evaluation</MenuItem>
              <MenuItem value="SVID_ISSUED">SVID Issued</MenuItem>
              <MenuItem value="AGENT_REGISTERED">Agent Registered</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Result"
              defaultValue="all"
              size="small"
            >
              <MenuItem value="all">All Results</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="denied">Denied</MenuItem>
              <MenuItem value="failure">Failure</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Agent ID"
              placeholder="Filter by agent..."
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Agent ID</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Result</TableCell>
              <TableCell>Violations</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {event.timestamp}
                </TableCell>
                <TableCell>
                  <Chip label={event.eventType} size="small" variant="outlined" />
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {event.agentId}
                </TableCell>
                <TableCell>{event.action}</TableCell>
                <TableCell>
                  <Chip
                    label={event.result}
                    color={
                      event.result === 'success'
                        ? 'success'
                        : event.result === 'denied'
                        ? 'error'
                        : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {event.violations.length > 0 ? (
                    <Typography variant="caption" color="error">
                      {event.violations[0]}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
