import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import { Warning, CheckCircle, Error } from '@mui/icons-material';

const investigations = [
  {
    id: 'case-001',
    title: 'Suspicious Outbound Network Activity',
    severity: 'critical',
    status: 'investigating',
    createdAt: '2024-01-15 14:00:00',
    assignedAgents: ['Triage', 'Forensic'],
    findings: 3,
    requiresHumanReview: true,
  },
  {
    id: 'case-002',
    title: 'Multiple Failed Authentication Attempts',
    severity: 'high',
    status: 'investigating',
    createdAt: '2024-01-15 13:30:00',
    assignedAgents: ['Triage', 'Forensic', 'Remediation'],
    findings: 5,
    requiresHumanReview: false,
  },
  {
    id: 'case-003',
    title: 'Unusual Process Execution Pattern',
    severity: 'medium',
    status: 'resolved',
    createdAt: '2024-01-15 12:00:00',
    assignedAgents: ['Triage', 'Forensic'],
    findings: 2,
    requiresHumanReview: false,
  },
];

const timeline = [
  { time: '14:32', event: 'Forensic analysis completed', status: 'completed' },
  { time: '14:15', event: 'Triage analysis completed', status: 'completed' },
  { time: '14:05', event: 'Orchestrator assigned agents', status: 'completed' },
  { time: '14:00', event: 'Investigation initiated', status: 'completed' },
];

export default function Investigations() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">G-MASE Investigations</Typography>
        <Button variant="contained" color="primary">
          Start New Investigation
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Active Cases */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Cases
            </Typography>
            {investigations
              .filter((inv) => inv.status === 'investigating')
              .map((inv) => (
                <Card key={inv.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
                    >
                      <Typography variant="h6">{inv.title}</Typography>
                      <Chip
                        label={inv.severity}
                        color={
                          inv.severity === 'critical'
                            ? 'error'
                            : inv.severity === 'high'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Case ID: {inv.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created: {inv.createdAt}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Findings: {inv.findings}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Agents: {inv.assignedAgents.join(', ')}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button variant="outlined" size="small">
                        View Details
                      </Button>
                      {inv.requiresHumanReview && (
                        <Button variant="contained" size="small" color="warning">
                          Review Required
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resolved Cases
            </Typography>
            {investigations
              .filter((inv) => inv.status === 'resolved')
              .map((inv) => (
                <Card key={inv.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                    >
                      <Typography variant="body1">{inv.title}</Typography>
                      <Chip label="Resolved" color="success" size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {inv.id} • {inv.createdAt} • {inv.findings} findings
                    </Typography>
                  </CardContent>
                </Card>
              ))}
          </Paper>
        </Grid>

        {/* Investigation Timeline */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Case Timeline (case-001)
            </Typography>
            <Timeline position="right">
              {timeline.map((item, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent color="text.secondary">
                    {item.time}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    {index < timeline.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body2">{item.event}</Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
