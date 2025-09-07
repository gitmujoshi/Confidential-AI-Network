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
  Container,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
} from '@mui/material';
import { LockOutlined, ExpandMore, Code } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { setUser, checkTokenAuth, clearAuthData } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [devResetToken, setDevResetToken] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  // Clear stale authentication data on mount
  useEffect(() => {
    // Clear any stale authentication data immediately when Login component mounts
    console.log('🧹 [Login] Clearing stale authentication data on mount...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    
    // Don't check for token auth on login page - let user login fresh
    console.log('🔄 [Login] Ready for fresh login');
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Development: Get reset token for testing
  const handleGetDevResetToken = async () => {
    if (!formData.email) {
      setError('Please enter an email address first.');
      return;
    }

    try {
      setDevLoading(true);
      setError('');
      
      const response = await apiService.getDevResetToken(formData.email);
      
      if (response.data.success) {
        const { token, minutesRemaining } = response.data;
        setDevResetToken(token);
        setDevResetLink(`http://localhost:3000/reset-password?token=${token}`);
        setSuccess(`Reset token retrieved! Expires in ${minutesRemaining} minutes.`);
      }
    } catch (error) {
      console.error('Dev reset token error:', error);
      setError('Failed to get reset token: ' + (error.response?.data?.error || error.message));
    } finally {
      setDevLoading(false);
    }
  };

  // Traditional email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Clear any stale authentication data before login
      console.log('🧹 Clearing stale authentication data...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      sessionStorage.clear();

      const response = await apiService.login({
        email: formData.email,
        password: formData.password
      });

      // Handle both normal login (with accessToken) and first-login (requiresPasswordChange)
      if (response.data.accessToken || response.data.requiresPasswordChange) {
        const { user, accessToken, refreshToken, requiresPasswordChange } = response.data;
        
        // Only set tokens if they exist (normal login)
        if (accessToken) {
          localStorage.setItem('authToken', accessToken);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }
        
        // Set user from login response
        setUser(user);
        console.log('✅ Login successful, user set from login response:', user);
        
        // Check if user needs to change password (first login)
        if (requiresPasswordChange) {
          console.log('🔐 First login detected, redirecting to password change wizard');
          setSuccess('First login detected! Please set your new password...');
          
          setTimeout(() => {
            navigate('/first-login', { 
              state: { 
                user: user,
                temporaryPassword: formData.password // Pass temp password for reference
              }
            });
          }, 1000);
        } else {
          setSuccess('Login successful! Redirecting to dashboard...');
          
          // Wait for user state to be properly set before navigation
          setTimeout(() => {
            // Double-check that user is set in context
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (currentUser) {
              console.log('✅ User confirmed in localStorage, navigating to dashboard');
              navigate('/dashboard');
            } else {
              console.log('⚠️ User not in localStorage, navigating anyway');
              navigate('/dashboard');
            }
          }, 1000); // Reduced timeout to 1 second
        }
      } else {
        setError('Login failed: Invalid response from server.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <LockOutlined sx={{ color: 'white', fontSize: 28 }} />
          </Box>

          <Typography component="h1" variant="h4" gutterBottom>
            Contract Management
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Sign in to your account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Email/Password Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <TextField
              margin="normal"
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
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/register')}
            sx={{ mt: 1 }}
          >
            Don't have an account? Sign Up
          </Button>
          
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/forgot-password')}
            sx={{ mt: 1 }}
          >
            Forgot your password?
          </Button>

          {/* Development Only: Reset Token Feature */}
          {process.env.NODE_ENV === 'development' && (
            <Accordion sx={{ width: '100%', mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Code sx={{ fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Development: Get Reset Token
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    For testing password reset without email delivery
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={handleGetDevResetToken}
                    disabled={devLoading || !formData.email}
                    sx={{ mb: 2 }}
                  >
                    {devLoading ? 'Getting Token...' : 'Get Reset Token'}
                  </Button>

                  {devResetToken && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Reset Token:</strong>
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                          bgcolor: 'white',
                          p: 1,
                          borderRadius: 0.5,
                          border: '1px solid #ddd'
                        }}
                      >
                        {devResetToken}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        <strong>Complete Reset Link:</strong>
                      </Typography>
                      <Link 
                        href={devResetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                          display: 'block',
                          mt: 1
                        }}
                      >
                        {devResetLink}
                      </Link>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 