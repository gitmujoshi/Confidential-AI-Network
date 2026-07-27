import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Stack,
  Divider,
} from '@mui/material';
import { ExpandMore, Code, ArrowForward } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [devResetToken, setDevResetToken] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  const [devLoading, setDevLoading] = useState(false);
  const [oidcConfig, setOidcConfig] = useState(null);

  useEffect(() => {
    const clearStaleTokens = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await apiService.get('/api/auth/profile');
          if (response.data.user) {
            navigate('/dashboard');
            return;
          }
        } catch (_) {
          // stale token
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
      }
    };
    clearStaleTokens();

    const loadOidc = async () => {
      try {
        const res = await apiService.get('/api/auth/oidc/config');
        setOidcConfig(res.data);
      } catch (_) {
        setOidcConfig({ provider: 'keycloak', loginMode: 'password' });
      }
    };
    loadOidc();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || !oidcConfig || oidcConfig.provider !== 'oci-iam') return;

    const finishOidc = async () => {
      try {
        setLoading(true);
        setError('');
        const redirectUri =
          oidcConfig.redirectUri || `${window.location.origin}/login`;
        const response = await apiService.post('/api/auth/oidc/callback', {
          code,
          redirectUri,
        });
        if (response.data.accessToken) {
          localStorage.setItem('authToken', response.data.accessToken);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          setUser(response.data.user);
          window.history.replaceState({}, document.title, '/login');
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => navigate('/dashboard'), 800);
        }
      } catch (err) {
        setError(
          'OCI Identity login failed: ' +
            (err.response?.data?.error || err.message)
        );
      } finally {
        setLoading(false);
      }
    };
    finishOidc();
  }, [oidcConfig, navigate, setUser]);

  const handleOidcLogin = () => {
    if (oidcConfig?.authorizationUrl) {
      window.location.href = oidcConfig.authorizationUrl;
      return;
    }
    setError(
      'OCI Identity Domains is not fully configured (missing domain URL, client id, or redirect URI).'
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetDevResetToken = async () => {
    if (!formData.email.trim()) {
      setError('Please enter an email address first.');
      return;
    }
    try {
      setDevLoading(true);
      setError('');
      const response = await apiService.getDevResetToken(formData.email.trim());
      if (response.data.success) {
        const { token, minutesRemaining } = response.data;
        setDevResetToken(token);
        setDevResetLink(`http://localhost:3000/reset-password?token=${token}`);
        setSuccess(`Reset token retrieved! Expires in ${minutesRemaining} minutes.`);
      }
    } catch (err) {
      setError('Failed to get reset token: ' + (err.response?.data?.error || err.message));
    } finally {
      setDevLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      sessionStorage.clear();

      const response = await apiService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.data.accessToken || response.data.requiresPasswordChange) {
        const { user, accessToken, refreshToken, requiresPasswordChange } = response.data;
        if (accessToken) {
          localStorage.setItem('authToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        }
        setUser(user);
        if (requiresPasswordChange) {
          setSuccess('First login detected! Please set your new password...');
          setTimeout(() => {
            navigate('/first-login', {
              state: { user, temporaryPassword: formData.password },
            });
          }, 1000);
        } else {
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => navigate('/dashboard'), 800);
        }
      } else {
        setError('Login failed: Invalid response from server.');
      }
    } catch (err) {
      setError('Login failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
      }}
    >
      {/* Brand panel — Stripe-style split auth */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: '#e2e8f0',
          background:
            'radial-gradient(900px 500px at 10% 0%, rgba(11,107,203,0.35), transparent 55%), linear-gradient(160deg, #0b1220 0%, #111827 55%, #0b1220 100%)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(145deg, #0b6bcb, #08498a)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              color: '#fff',
            }}
          >
            CA
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 750, letterSpacing: '-0.02em' }}>
              Confidential AI Network
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Secure multi-party contract console
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ maxWidth: 440 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 750,
              letterSpacing: '-0.03em',
              mb: 2,
              color: '#f8fafc',
              fontSize: { md: '2.35rem', lg: '2.6rem' },
            }}
          >
            Contracts, provenance, and confidential training — in one place.
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Sign in to manage datasets, negotiate Ricardian contracts, and run
            privacy-preserving training across TDC, TDP, and TSP roles.
          </Typography>
        </Box>

        <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
          Built for regulated AI collaboration · DEPA · SCITT
        </Typography>
      </Box>

      {/* Form panel */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5 },
          bgcolor: '#f4f6f9',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 4 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Welcome back
          </Typography>
          <Typography component="h1" variant="h4" sx={{ mt: 0.5, mb: 0.5, fontWeight: 750 }}>
            Contract Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {oidcConfig?.provider === 'oci-iam'
              ? 'Sign in with OCI IAM Identity Domains'
              : 'Sign in to your account'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {oidcConfig?.provider === 'oci-iam' ? (
            <Button
              fullWidth
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{ mt: 1, mb: 1.5, py: 1.15 }}
              disabled={loading}
              onClick={handleOidcLogin}
            >
              {loading ? 'Signing in…' : 'Sign in with OCI IAM'}
            </Button>
          ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="dense"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleInputChange}
              required
              sx={{ mb: 1.5 }}
            />
            <TextField
              margin="dense"
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{ mt: 2.5, mb: 1.5, py: 1.15 }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={1}
            sx={{ mt: 1.5 }}
          >
            <Button
              fullWidth={false}
              variant="text"
              onClick={() => navigate('/forgot-password')}
              sx={{ justifyContent: 'flex-start', color: 'text.secondary', px: 0 }}
            >
              Forgot your password?
            </Button>
            <Button
              variant="text"
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('currentUser');
                sessionStorage.clear();
                sessionStorage.setItem('navigatingToRegistration', 'true');
                setTimeout(() => navigate('/register'), 100);
              }}
              sx={{ fontWeight: 600, px: 0 }}
            >
              Don't have an account? Sign Up
            </Button>
          </Stack>

          {process.env.NODE_ENV === 'development' && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Accordion
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Code sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Dev: reset token
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={handleGetDevResetToken}
                    disabled={devLoading || !formData.email}
                    sx={{ mb: 2 }}
                  >
                    {devLoading ? 'Getting token…' : 'Get reset token'}
                  </Button>
                  {devResetToken && (
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Token
                      </Typography>
                      <Typography
                        variant="body2"
                        className="mono"
                        sx={{ fontSize: '0.72rem', wordBreak: 'break-all' }}
                      >
                        {devResetToken}
                      </Typography>
                      {devResetLink && (
                        <Link href={devResetLink} variant="caption" sx={{ mt: 1, display: 'inline-block' }}>
                          Open reset link
                        </Link>
                      )}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
