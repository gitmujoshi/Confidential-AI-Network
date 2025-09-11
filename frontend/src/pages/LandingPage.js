import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Security as SecurityIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DEPAConfigurationDisplay from '../components/DEPAConfigurationDisplay';
import apiService from '../services/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [depaConfig, setDepaConfig] = useState(null);

  useEffect(() => {
    // Fetch DEPA configuration for display
    fetchDEPAConfiguration();
  }, []);

  const fetchDEPAConfiguration = async () => {
    try {
      const response = await apiService.get('/api/depa/configuration');
      if (response.success) {
        setDepaConfig(response.config);
      }
    } catch (error) {
      console.error('Error fetching DEPA configuration:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/register');
  };

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'DEPA ID Management',
      description: 'Decentralized Entity Provider Architecture IDs for privacy compliance and entity identification.'
    },
    {
      icon: <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Contract Management',
      description: 'Secure contract creation, negotiation, and execution with SCITT CCF Ledger integration.'
    },
    {
      icon: <PublicIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Multi-party Collaboration',
      description: 'Secure collaboration between TDCs, TDPs, and CCRPs with role-based access control.'
    },
    {
      icon: <LocationIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Regulatory Framework Support',
      description: 'Configuration support for SOX, FedRAMP, CCPA and other regulatory frameworks.'
    }
  ];

  const benefits = [
    'Privacy-preserving entity identification',
    'Regulatory framework configuration',
    'Multi-party collaboration platform',
    'SCITT CCF Ledger-based contract execution',
    'Role-based access control',
    'Audit trail and provenance tracking'
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 'bold' }}>
            Contract Management System
          </Typography>
          <Button
            color="primary"
            variant="outlined"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{ mr: 2 }}
          >
            Login
          </Button>
          <Button
            color="primary"
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleSignup}
          >
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Secure Contract Management
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
              Privacy-compliant contract management with DEPA ID integration and SCITT CCF Ledger for TDCs, TDPs, and CCRPs
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={handleSignup}
                sx={{ px: 4, py: 1.5 }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleLogin}
                sx={{ px: 4, py: 1.5 }}
              >
                Sign In
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                Current Deployment Configuration
              </Typography>
              {depaConfig ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Deployment ID:</strong><br />
                        {depaConfig.deploymentId}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Region:</strong><br />
                        {depaConfig.region}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Country:</strong><br />
                        {depaConfig.country}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Jurisdiction:</strong><br />
                        {depaConfig.jurisdiction}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {depaConfig.regulatoryFramework?.map((framework, index) => (
                      <Chip key={index} label={framework} size="small" variant="outlined" color="secondary" />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>DEPA ID Format:</strong> {depaConfig.depaIdFormat}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading deployment configuration...
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            Key Features
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card elevation={2} sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Why Choose Our Platform?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              Our contract management system is built with privacy and security at its core, 
              featuring DEPA ID integration for secure entity identification and SCITT CCF Ledger 
              for tamper-proof contract execution with configurable regulatory framework support.
            </Typography>
            <Box>
              {benefits.map((benefit, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 2, fontSize: 20 }} />
                  <Typography variant="body1">{benefit}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, bgcolor: 'primary.50' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                DEPA ID & SCITT CCF Ledger
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Each entity in our system receives a unique DEPA ID that follows the format:
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'white', 
                  border: '1px solid', 
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  mb: 2
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {depaConfig?.depaIdFormat || 'US-EAST-{ENTITY_TYPE}-{UUID}'}
                </Typography>
              </Paper>
              <Typography variant="body2" color="text.secondary" paragraph>
                This ensures privacy compliance and provides a standardized way to identify 
                Training Data Consumers (TDCs), Training Data Providers (TDPs), and 
                Confidential Clean Room Providers (CCRPs).
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>SCITT CCF Ledger:</strong> All contracts are executed on a tamper-proof 
                SCITT (Supply Chain Integrity, Transparency, and Trust) CCF (Confidential 
                Computing Framework) Ledger, ensuring immutable contract records and 
                regulatory compliance.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={handleSignup}
                sx={{ mt: 2 }}
              >
                Get Your DEPA ID
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Join our secure contract management platform and get your DEPA ID today.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<PersonAddIcon />}
              onClick={handleSignup}
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
                px: 4, 
                py: 1.5 
              }}
            >
              Create Account
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleLogin}
              sx={{ 
                borderColor: 'white', 
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                px: 4, 
                py: 1.5 
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.100', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Contract Management System
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure, privacy-compliant contract management with DEPA ID integration.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button color="primary" onClick={handleLogin}>
                  Login
                </Button>
                <Button color="primary" onClick={handleSignup}>
                  Sign Up
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            © 2024 Contract Management System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
