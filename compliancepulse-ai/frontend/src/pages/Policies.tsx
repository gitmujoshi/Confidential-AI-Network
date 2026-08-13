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
  Switch,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const policies = [
  {
    id: 'policy-001',
    name: 'Prevent Production Database Drops',
    description: 'Deny DROP TABLE operations in production',
    enabled: true,
    priority: 100,
    violations: 3,
    evaluations: 1240,
  },
  {
    id: 'policy-002',
    name: 'Cost Threshold Protection',
    description: 'Deny operations exceeding $100 cost threshold',
    enabled: true,
    priority: 90,
    violations: 5,
    evaluations: 856,
  },
  {
    id: 'policy-003',
    name: 'Low Confidence Prevention',
    description: 'Warn on low confidence operations',
    enabled: true,
    priority: 80,
    violations: 0,
    evaluations: 2130,
  },
  {
    id: 'policy-004',
    name: 'Agent Rate Limiting',
    description: 'Prevent rapid-fire tool invocations',
    enabled: false,
    priority: 70,
    violations: 0,
    evaluations: 0,
  },
  {
    id: 'policy-005',
    name: 'Prevent Credential Exposure',
    description: 'Deny tools that might expose credentials',
    enabled: true,
    priority: 95,
    violations: 1,
    evaluations: 645,
  },
];

export default function Policies() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">OPA Policies</Typography>
        <Button variant="contained" color="primary">
          Create New Policy
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Evaluations</TableCell>
              <TableCell>Violations</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {policy.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {policy.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={policy.priority} size="small" />
                </TableCell>
                <TableCell>{policy.evaluations.toLocaleString()}</TableCell>
                <TableCell>
                  {policy.violations > 0 ? (
                    <Chip label={policy.violations} color="error" size="small" />
                  ) : (
                    <Chip label="0" color="success" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Switch checked={policy.enabled} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <Delete />
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
