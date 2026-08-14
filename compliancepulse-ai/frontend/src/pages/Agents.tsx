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
  Button,
} from '@mui/material';
import { Visibility, PlayArrow, Stop } from '@mui/icons-material';

const agents = [
  {
    id: 'agent-001',
    name: 'Orchestrator Primary',
    type: 'Orchestrator',
    status: 'active',
    spiffeId: 'spiffe://compliancepulse.ai/workload/ns/prod/sa/orchestrator/agent-001',
    lastActive: '2 minutes ago',
    tasksCompleted: 156,
  },
  {
    id: 'agent-002',
    name: 'Triage Alpha',
    type: 'Triage',
    status: 'active',
    spiffeId: 'spiffe://compliancepulse.ai/workload/ns/prod/sa/triage/agent-002',
    lastActive: '1 minute ago',
    tasksCompleted: 342,
  },
  {
    id: 'agent-003',
    name: 'Forensic Beta',
    type: 'Forensic',
    status: 'active',
    spiffeId: 'spiffe://compliancepulse.ai/workload/ns/prod/sa/forensic/agent-003',
    lastActive: '5 minutes ago',
    tasksCompleted: 89,
  },
  {
    id: 'agent-004',
    name: 'Remediation Gamma',
    type: 'Remediation',
    status: 'inactive',
    spiffeId: 'spiffe://compliancepulse.ai/workload/ns/prod/sa/remediation/agent-004',
    lastActive: '2 hours ago',
    tasksCompleted: 45,
  },
];

export default function Agents() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">AI Agents</Typography>
        <Button variant="contained" color="primary">
          Register New Agent
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>SPIFFE ID</TableCell>
              <TableCell>Last Active</TableCell>
              <TableCell>Tasks Completed</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>{agent.name}</TableCell>
                <TableCell>
                  <Chip label={agent.type} color="primary" size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={agent.status}
                    color={agent.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {agent.spiffeId}
                  </Typography>
                </TableCell>
                <TableCell>{agent.lastActive}</TableCell>
                <TableCell>{agent.tasksCompleted}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    color={agent.status === 'active' ? 'error' : 'success'}
                  >
                    {agent.status === 'active' ? <Stop /> : <PlayArrow />}
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
