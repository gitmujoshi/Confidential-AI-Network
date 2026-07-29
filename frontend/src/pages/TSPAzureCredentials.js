import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Alert, AlertTitle } from '@mui/material';
import { Security } from '@mui/icons-material';

const TSPAzureCredentials = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new multi-cloud credentials page
    navigate('/tsp-cloud-credentials');
  }, [navigate]);

  return (
    <Container maxWidth={false}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
          Cloud Credentials Management
        </Typography>
        <Alert severity="info">
          <AlertTitle>Page Moved</AlertTitle>
          This page has been moved to support multi-cloud credentials. You will be redirected automatically.
        </Alert>
      </Box>
    </Container>
  );
};

export default TSPAzureCredentials;