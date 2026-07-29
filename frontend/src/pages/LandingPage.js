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
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Security as SecurityIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
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
  const [depaConfigLoading, setDepaConfigLoading] = useState(true);
  const [depaConfigError, setDepaConfigError] = useState(null);

  useEffect(() => {
    // Fetch DEPA configuration for display
    fetchDEPAConfiguration();
  }, []);

  const fetchDEPAConfiguration = async () => {
    try {
      setDepaConfigLoading(true);
      setDepaConfigError(null);
      
      const response = await apiService.get('/api/depa/configuration');
      console.log('🔍 [LandingPage] DEPA config response:', response);
      
      if (response.data && response.data.success) {
        setDepaConfig(response.data.config);
        console.log('✅ [LandingPage] DEPA config loaded successfully');
      } else {
        setDepaConfigError('Failed to load configuration');
        console.error('❌ [LandingPage] DEPA config response not successful:', response);
      }
    } catch (error) {
      console.error('❌ [LandingPage] Error fetching DEPA configuration:', error);
      setDepaConfigError('Failed to load configuration');
    } finally {
      setDepaConfigLoading(false);
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
      description: 'DEPA-aligned entity IDs inspired by India’s iSPIRT Data Empowerment and Protection Architecture — for privacy compliance and clear party identification.'
    },
    {
      icon: <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Contract Management',
      description: 'Secure contract creation, negotiation, and execution with SCITT CCF Ledger integration.'
    },
    {
      icon: <PublicIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Multi-party Collaboration',
      description: 'Secure collaboration between TDCs, TDPs, and TSPs with role-based access control.'
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
    'Comprehensive audit logging and provenance tracking'
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage:
          'radial-gradient(1000px 480px at 80% -10%, rgba(11,107,203,0.08), transparent 50%)',
      }}
    >
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(145deg, #0b6bcb, #08498a)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              CA
            </Box>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 750, letterSpacing: '-0.02em' }}>
              Confidential AI Network
            </Typography>
          </Stack>
          <Button color="inherit" onClick={handleLogin} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Sign in
          </Button>
          <Button variant="contained" onClick={handleSignup}>
            Get started
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth={false} sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
              Multi-party confidential AI
            </Typography>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 800, letterSpacing: '-0.035em', mt: 1, maxWidth: 560 }}
            >
              Confidential AI Network
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4, fontWeight: 500, lineHeight: 1.6, maxWidth: 520 }}>
              Negotiate contracts, bind provenance with SCITT, and run privacy-preserving training across TDC, TDP, and TSP roles.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} onClick={handleSignup}>
                Create account
              </Button>
              <Button variant="outlined" size="large" onClick={handleLogin}>
                Sign in
              </Button>
              <Button variant="text" size="large" onClick={() => navigate('/demo/oci-scaffolds')}>
                OCI product tour
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                Deployment configuration
              </Typography>
              {depaConfigLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading deployment configuration...
                  </Typography>
                </Box>
              ) : depaConfigError ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Configuration unavailable
                  </Typography>
                </Box>
              ) : depaConfig ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Deployment ID</Typography>
                      <Typography variant="body2" fontWeight={600}>{depaConfig.deploymentId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Region</Typography>
                      <Typography variant="body2" fontWeight={600}>{depaConfig.region}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Country</Typography>
                      <Typography variant="body2" fontWeight={600}>{depaConfig.country}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Jurisdiction</Typography>
                      <Typography variant="body2" fontWeight={600}>{depaConfig.jurisdiction}</Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {depaConfig.regulatoryFramework?.map((framework, index) => (
                      <Chip key={index} label={framework} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" className="mono">
                    DEPA format: {depaConfig.depaIdFormat}
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
      <Box sx={{ py: 8, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
          <Typography variant="h4" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 750, mb: 1 }}>
            Built for regulated collaboration
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6, maxWidth: 560, mx: 'auto' }}>
            Enterprise workflows for identity, contracts, and confidential compute — without the dashboard clutter.
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', p: 1 }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
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
      <Container maxWidth={false} sx={{ py: 8, px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Why Choose Our Platform?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              Our contract management system is built with privacy and security at its core, 
              featuring DEPA-aligned IDs (India’s iSPIRT Data Empowerment and Protection Architecture)
              for secure entity identification and SCITT CCF Ledger 
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
            <Paper elevation={0} sx={{ p: 4, bgcolor: 'primary.50' }}>
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
                Tech Service Providers (TSPs).
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
        <Container maxWidth={false} sx={{ textAlign: 'center', px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
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
              endIcon={<ArrowForwardIcon />}
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
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
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
