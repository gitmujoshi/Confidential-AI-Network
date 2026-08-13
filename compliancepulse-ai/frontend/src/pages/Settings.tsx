import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';

export default function Settings() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* SPIFFE/SPIRE Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              SPIFFE/SPIRE Configuration
            </Typography>
            <TextField
              fullWidth
              label="Trust Domain"
              defaultValue="compliancepulse.ai"
              margin="normal"
            />
            <TextField
              fullWidth
              label="SPIRE Server Address"
              defaultValue="unix:///tmp/spire-server/socket"
              margin="normal"
            />
            <TextField
              fullWidth
              label="SVID TTL (seconds)"
              type="number"
              defaultValue="3600"
              margin="normal"
            />
            <Button variant="contained" sx={{ mt: 2 }}>
              Save Changes
            </Button>
          </Paper>
        </Grid>

        {/* OPA Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              OPA Configuration
            </Typography>
            <TextField
              fullWidth
              label="OPA Server URL"
              defaultValue="http://localhost:8181"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Policy Path"
              defaultValue="compliancepulse"
              margin="normal"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable Policy Enforcement"
              sx={{ mt: 2 }}
            />
            <Box>
              <Button variant="contained" sx={{ mt: 2 }}>
                Save Changes
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Audit Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Audit Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="GCP Project ID"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="BigQuery Dataset"
                  defaultValue="audit_logs"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="BigQuery Table"
                  defaultValue="tool_invocations"
                  margin="normal"
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable Audit Logging"
              sx={{ mt: 2 }}
            />
            <Box>
              <Button variant="contained" sx={{ mt: 2 }}>
                Save Changes
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Agent Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Agent Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Concurrent Agents"
                  type="number"
                  defaultValue="10"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Default Timeout (ms)"
                  type="number"
                  defaultValue="300000"
                  margin="normal"
                />
              </Grid>
            </Grid>
            <Button variant="contained" sx={{ mt: 2 }}>
              Save Changes
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
