import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Sample data
const policyEvaluations = [
  { time: '00:00', allowed: 45, denied: 5 },
  { time: '04:00', allowed: 32, denied: 3 },
  { time: '08:00', allowed: 78, denied: 12 },
  { time: '12:00', allowed: 95, denied: 8 },
  { time: '16:00', allowed: 110, denied: 15 },
  { time: '20:00', allowed: 67, denied: 6 },
];

const agentActivity = [
  { name: 'Orchestrator', value: 45 },
  { name: 'Triage', value: 89 },
  { name: 'Forensic', value: 34 },
  { name: 'Remediation', value: 23 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Agents</Typography>
              </Box>
              <Typography variant="h3">12</Typography>
              <Chip label="+2 today" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Policy Approvals</Typography>
              </Box>
              <Typography variant="h3">847</Typography>
              <Chip label="98.2%" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Policy Violations</Typography>
              </Box>
              <Typography variant="h3">15</Typography>
              <Chip label="-5 today" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Investigations</Typography>
              </Box>
              <Typography variant="h3">3</Typography>
              <Chip label="2 critical" color="error" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Policy Evaluations (24h)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={policyEvaluations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="allowed"
                  stroke="#2e7d32"
                  strokeWidth={2}
                  name="Allowed"
                />
                <Line
                  type="monotone"
                  dataKey="denied"
                  stroke="#d32f2f"
                  strokeWidth={2}
                  name="Denied"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Agent Activity
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agentActivity}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {agentActivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Security Events
            </Typography>
            <Box>
              {[
                {
                  time: '2 minutes ago',
                  event: 'Policy violation detected',
                  severity: 'warning',
                  agent: 'agent-001',
                },
                {
                  time: '15 minutes ago',
                  event: 'Critical investigation initiated',
                  severity: 'error',
                  agent: 'orchestrator',
                },
                {
                  time: '1 hour ago',
                  event: 'Remediation completed',
                  severity: 'success',
                  agent: 'remediation-001',
                },
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    py: 2,
                    borderBottom: index < 2 ? '1px solid #eee' : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      {item.event}
                    </Typography>
                    <Chip
                      label={item.severity}
                      color={item.severity as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.time} • Agent: {item.agent}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
