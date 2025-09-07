import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert
} from '@mui/material';

const FirstLoginWizardSimple = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Simple validation
  const isValid = passwordData.newPassword && 
                  passwordData.newPassword === passwordData.confirmPassword &&
                  passwordData.newPassword.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('Please ensure passwords match and are at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.firstLoginPassword({
        email: currentUser.email,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Password updated successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Password update error:', error);
      setError(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  // Don't render if no user or user doesn't need first login
  if (!currentUser) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (!currentUser.firstLogin) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Redirecting to dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            First Login Setup
          </Typography>
          
          <Typography variant="body1" paragraph align="center">
            Welcome! Please set a new password to secure your account.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              margin="normal"
              required
              helperText="At least 8 characters"
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading || !isValid}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default FirstLoginWizardSimple;
