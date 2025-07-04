import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { Business } from '@mui/icons-material';
import EnterpriseDIDManager from '../components/EnterpriseDIDManager';

const EnterpriseDIDManagement = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Business color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                Enterprise DID Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage enterprise DID:web configurations, validate domains, and monitor DID resolution performance.
              </Typography>
            </Box>
          </Box>
        </Paper>
        
        <EnterpriseDIDManager />
      </Box>
    </Container>
  );
};

export default EnterpriseDIDManagement; 