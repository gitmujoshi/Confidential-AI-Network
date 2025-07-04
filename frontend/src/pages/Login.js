import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await api.get('/auth/me');
          if (response.data.user) {
            setUser(response.data.user);
            navigate('/dashboard');
          }
        }
      } catch (error) {
        localStorage.removeItem('authToken');
      }
    };

    checkAuth();
  }, [navigate, setUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Use new backend response: accessToken and user
      if (response.data.accessToken) {
        const { user, accessToken } = response.data;
        localStorage.setItem('authToken', accessToken);
        setUser(user);
        setSuccess('Login successful! Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 2000);
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
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 