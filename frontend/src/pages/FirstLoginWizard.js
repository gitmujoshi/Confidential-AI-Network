import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';

const FirstLoginWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, refreshAuth } = useUser();
  
  // Form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(0);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  // Steps for the wizard
  const steps = ['Welcome', 'Change Password', 'Complete Setup'];

  // Get temporary password from login response or location state
  const temporaryPassword = location.state?.temporaryPassword || '';

  // Validate password strength
  const validatePasswordStrength = (password) => {
    const strength = {
      hasLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordStrength(strength);
    return Object.values(strength).every(Boolean);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    // Validate new password strength
    if (field === 'newPassword') {
      validatePasswordStrength(value);
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!passwordData.currentPassword) {
      setError('Please enter your current (temporary) password');
      return false;
    }
    
    if (!passwordData.newPassword) {
      setError('Please enter a new password');
      return false;
    }
    
    if (!validatePasswordStrength(passwordData.newPassword)) {
      setError('New password does not meet security requirements');
      return false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('New password must be different from your current password');
      return false;
    }
    
    return true;
  };

  const handlePasswordUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Password updated successfully!');
      setStep(2); // Move to completion step

      // Refresh user context to update firstLogin status
      setTimeout(async () => {
        await refreshAuth();
        navigate('/dashboard', { 
          state: { 
            message: 'Welcome! Your account setup is complete.',
            firstLoginCompleted: true 
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Password update error:', error);
      setError(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // For now, don't allow skipping - password change is required
    setError('Password change is required for security. Please set a new password to continue.');
  };

  const renderWelcomeStep = () => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Welcome to Contract Management!
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Hi {currentUser?.name}! This is your first time logging in as a {currentUser?.partyType}.
        </Typography>
        <Typography variant="body1" paragraph>
          For security reasons, you need to change your temporary password before accessing the system.
        </Typography>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          Next Steps:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <LockIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Change Your Password" 
              secondary="Set a secure password that meets our security requirements"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Access Your Dashboard" 
              secondary="Start using the Contract Management platform"
            />
          </ListItem>
        </List>
        <Button 
          variant="contained" 
          size="large" 
          onClick={() => setStep(1)}
          sx={{ mt: 2 }}
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );

  const renderPasswordForm = () => (
    <Card>
      <CardContent sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Set Your New Password
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" paragraph>
          Create a secure password to protect your account
        </Typography>

        <Box component="form" sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Current (Temporary) Password"
            type={showPasswords.current ? "text" : "password"}
            value={passwordData.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            margin="normal"
            required
            placeholder={temporaryPassword ? "Enter the temporary password provided" : "Enter your current password"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('current')}>
                    {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="New Password"
            type={showPasswords.new ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('new')}>
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Password Strength Indicator */}
          {passwordData.newPassword && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Password Requirements:
              </Typography>
              <List dense>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.hasLength ? <CheckIcon color="success" fontSize="small" /> : <LockIcon color="disabled" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="At least 8 characters" 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      color: passwordStrength.hasLength ? 'success.main' : 'text.secondary'
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.hasUppercase ? <CheckIcon color="success" fontSize="small" /> : <LockIcon color="disabled" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Uppercase letter" 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      color: passwordStrength.hasUppercase ? 'success.main' : 'text.secondary'
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.hasLowercase ? <CheckIcon color="success" fontSize="small" /> : <LockIcon color="disabled" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Lowercase letter" 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      color: passwordStrength.hasLowercase ? 'success.main' : 'text.secondary'
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.hasNumber ? <CheckIcon color="success" fontSize="small" /> : <LockIcon color="disabled" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Number" 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      color: passwordStrength.hasNumber ? 'success.main' : 'text.secondary'
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {passwordStrength.hasSpecial ? <CheckIcon color="success" fontSize="small" /> : <LockIcon color="disabled" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Special character (!@#$%^&*)" 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      color: passwordStrength.hasSpecial ? 'success.main' : 'text.secondary'
                    }}
                  />
                </ListItem>
              </List>
            </Box>
          )}

          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPasswords.confirm ? "text" : "password"}
            value={passwordData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('confirm')}>
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handlePasswordUpdate}
              disabled={loading || !validatePasswordStrength(passwordData.newPassword)}
              fullWidth
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : 'Update Password'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderCompletionStep = () => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Setup Complete!
        </Typography>
        <Typography variant="body1" paragraph>
          Your password has been successfully updated. You're now ready to use the Contract Management platform.
        </Typography>
        <LinearProgress variant="determinate" value={100} sx={{ mt: 2, mb: 3 }} />
        <Typography variant="body2" color="textSecondary">
          Redirecting to your dashboard...
        </Typography>
      </CardContent>
    </Card>
  );

  // Redirect if user is not logged in or doesn't need first login
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  if (!currentUser.firstLogin) {
    navigate('/dashboard');
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ overflow: 'hidden' }}>
          {/* Progress Stepper */}
          <Box sx={{ px: 3, pt: 3 }}>
            <Stepper activeStep={step} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step Content */}
          <Box sx={{ p: 3 }}>
            {step === 0 && renderWelcomeStep()}
            {step === 1 && renderPasswordForm()}
            {step === 2 && renderCompletionStep()}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default FirstLoginWizard;
