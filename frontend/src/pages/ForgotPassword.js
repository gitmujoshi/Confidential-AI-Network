import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  CircularProgress,
  Link,
  Chip,
  Divider,
} from '@mui/material';
import { EmailOutlined, ContentCopy, Launch } from '@mui/icons-material';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [emailDeliveryFailed, setEmailDeliveryFailed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setResetToken('');
      setResetLink('');
      setEmailDeliveryFailed(false);

      const response = await apiService.forgotPassword(email);
      
      // Check if email delivery failed
      const note = response.data.note || '';
      const emailFailed = note.includes('email delivery failed') || 
                         note.includes('email delivery failed') ||
                         note.includes('Reset token generated but email delivery failed');
      
      if (emailFailed) {
        setEmailDeliveryFailed(true);
        // Try to get the reset token for display
        try {
          const tokenResponse = await fetch(`http://localhost:5001/api/auth/dev/reset-token/${email}`);
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            setResetToken(tokenData.token);
            setResetLink(`${window.location.origin}/reset-password?token=${tokenData.token}`);
          }
        } catch (tokenError) {
          console.log('Could not get reset token for display');
        }
      }
      
      // For development mode, always try to get the reset token
      if (process.env.NODE_ENV === 'development' && !emailFailed) {
        try {
          const tokenResponse = await fetch(`http://localhost:5001/api/auth/dev/reset-token/${email}`);
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            setResetToken(tokenData.token);
            setResetLink(`${window.location.origin}/reset-password?token=${tokenData.token}`);
          }
        } catch (tokenError) {
          console.log('Could not get reset token for development display');
        }
      }
      
      setSuccess(response.data.message || 'Password reset email sent successfully!');
      setEmail('');
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.response?.data?.error || 'Failed to send password reset email. Please try again.');
      // In development, try to fetch the reset token even if the API call failed
      if (process.env.NODE_ENV === 'development') {
        try {
          const tokenResponse = await fetch(`http://localhost:5001/api/auth/dev/reset-token/${email}`);
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            setResetToken(tokenData.token);
            setResetLink(`${window.location.origin}/reset-password?token=${tokenData.token}`);
          }
        } catch (tokenError) {
          console.log('Could not get reset token for development display after error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const shouldShowResetLink = () => {
    return (process.env.NODE_ENV === 'development' && resetLink) || 
           (emailDeliveryFailed && resetLink);
  };

  const getResetLinkTitle = () => {
    if (emailDeliveryFailed) {
      return '📧 Email Delivery Failed - Reset Link Available';
    }
    return '🛠️ Development Mode - Reset Link Generated';
  };

  const getResetLinkDescription = () => {
    if (emailDeliveryFailed) {
      return 'Since email delivery is not configured, here\'s your password reset link:';
    }
    return 'Since email delivery is not configured, here\'s your password reset link:';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', py: 4 }}>
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
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
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
            <EmailOutlined sx={{ color: 'white', fontSize: 28 }} />
          </Box>

          <Typography component="h1" variant="h4" gutterBottom>
            Forgot Password
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom align="center">
            Enter your email address and we'll send you a link to reset your password.
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

          {/* Show Reset Link when email delivery fails or in development */}
          {shouldShowResetLink() && (
            <Box sx={{ width: '100%', mb: 3, p: 2, bgcolor: emailDeliveryFailed ? 'warning.light' : 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color={emailDeliveryFailed ? 'warning.dark' : 'primary'} gutterBottom>
                {getResetLinkTitle()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {getResetLinkDescription()}
              </Typography>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Reset Token:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip 
                    label={resetToken.substring(0, 20) + '...'} 
                    variant="outlined" 
                    size="small"
                    sx={{ fontFamily: 'monospace' }}
                  />
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(resetToken)}
                    startIcon={<ContentCopy />}
                    variant="outlined"
                  >
                    Copy Token
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Complete Reset Link:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Link
                    href={resetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: 'primary.main'
                    }}
                  >
                    {resetLink}
                  </Link>
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(resetLink)}
                    startIcon={<ContentCopy />}
                    variant="outlined"
                  >
                    Copy Link
                  </Button>
                  <Button
                    size="small"
                    onClick={() => window.open(resetLink, '_blank')}
                    startIcon={<Launch />}
                    variant="contained"
                    color="primary"
                  >
                    Open Reset Page
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {emailDeliveryFailed 
                    ? '⚠️ Email delivery failed, but you can use this link to reset your password.'
                    : '⚠️ This is for development testing only. In production, users would receive this link via email.'
                  }
                </Typography>
              </Box>
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !email}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </Box>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
            sx={{ mt: 1 }}
            disabled={loading}
          >
            Back to Login
          </Button>
        </Paper>
      </Box>
    </Container>
    </Box>
  );
};

export default ForgotPassword; 