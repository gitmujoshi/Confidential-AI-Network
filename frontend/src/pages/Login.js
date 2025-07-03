import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { LockOutlined, AccountBalanceWallet } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
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

  // Connect MetaMask wallet
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const walletAddress = accounts[0];

      setWalletAddress(walletAddress);
      setWalletConnected(true);
      setSuccess(`Wallet connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);

    } catch (error) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        setError('Connection rejected. Please connect your wallet to continue.');
      } else {
        setError('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Login with wallet
  const loginWithWallet = async () => {
    try {
      setLoading(true);
      setError('');

      if (!walletConnected) {
        setError('Please connect your wallet first.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get nonce from backend
      const nonceResponse = await api.get(`/auth/nonce/${walletAddress}`);
      const nonce = nonceResponse.data.nonce;

      // Sign message
      const signer = await provider.getSigner();
      const message = `Sign this message to authenticate with Contract Management System. Nonce: ${nonce}`;
      const signature = await signer.signMessage(message);

      // Authenticate with backend
      const authResponse = await api.post('/auth/wallet', {
        walletAddress,
        signature,
        nonce
      });

      if (authResponse.data.success) {
        const { user, token } = authResponse.data;
        
        localStorage.setItem('authToken', token);
        setUser(user);
        
        setSuccess('Login successful! Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Wallet login error:', error);
      if (error.response?.status === 404) {
        setError('User not found. Please register first with this wallet address.');
      } else {
        setError('Login failed: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Traditional email/password login (fallback)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('Traditional login is not available. Please use MetaMask wallet login.');
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
            Sign in with your wallet
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

          {/* Wallet Connection Section */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 1: Connect Your Wallet
            </Typography>
            
            {!walletConnected ? (
              <Button
                variant="outlined"
                startIcon={<AccountBalanceWallet />}
                onClick={connectWallet}
                disabled={loading}
                fullWidth
                sx={{ py: 2 }}
              >
                Connect MetaMask
              </Button>
            ) : (
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography variant="body1" color="success.dark" gutterBottom>
                    ✅ Wallet Connected
                  </Typography>
                  <Typography variant="h6" color="success.dark">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Login with Wallet */}
          {walletConnected && (
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Step 2: Sign In
              </Typography>
              <Button
                variant="contained"
                onClick={loginWithWallet}
                disabled={loading}
                fullWidth
                sx={{ py: 2 }}
              >
                {loading ? 'Signing In...' : 'Sign In with Wallet'}
              </Button>
            </Box>
          )}

          <Divider sx={{ width: '100%', my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Traditional Login (Disabled) */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Traditional login is not available. Please use MetaMask wallet login.
            </Typography>
            
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled
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
              disabled
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={true}
            >
              Sign In (Disabled)
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