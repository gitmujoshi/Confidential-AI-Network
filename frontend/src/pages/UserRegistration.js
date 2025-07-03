import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import { PersonAddOutlined, AccountBalanceWallet, VerifiedUser } from '@mui/icons-material';
import { apiService } from '../services/api';

const UserRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [publicKey, setPublicKey] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    partyType: '',
    description: '',
    organization: '',
    phoneNumber: '',
    website: '',
    location: ''
  });

  // DID-related state
  const [useExistingDID, setUseExistingDID] = useState(false);
  const [existingDID, setExistingDID] = useState('');
  const [didVerificationSignature, setDidVerificationSignature] = useState('');

  const partyTypes = [
    {
      value: 'TDP',
      title: 'Training Data Provider',
      description: 'Dataset owners who can create and manage datasets'
    },
    {
      value: 'TDC',
      title: 'Training Data Consumer',
      description: 'Contract initiators who can create contracts'
    },
    {
      value: 'CCRP',
      title: 'Confidential Clean Room Provider',
      description: 'Compliance reviewers who sign contracts'
    }
  ];

  // Account name mapping - simplified
  const getAccountName = (address) => {
    if (!address) return 'Unknown';
    
    // Simple direct mapping
    switch (address.toLowerCase()) {
      case '0x70997970c51812dc3a010c7d01b50e0d17dc79c8':
        return 'TDC';
      case '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc':
        return 'TDP';
      case '0x90f79bf6eb2c4f870365e785982e1f101e93b906':
        return 'CCRP';
      case '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266':
        return 'TDP';
      default:
        return 'Unknown';
    }
  };

  // Simple wallet connection function - completely independent of UserContext
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      console.log('🔗 [Registration] Requesting accounts from MetaMask...');

      // Always request account access to get the current selection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('✅ [Registration] MetaMask returned accounts:', accounts);

      if (!accounts || accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask and try again.');
        return;
      }

      const selectedAddress = accounts[0];
      const accountName = getAccountName(selectedAddress);
      
      console.log('✅ [Registration] Selected address:', selectedAddress, 'Account name:', accountName);

      // Create a mock public key (in production, you'd get this from the wallet)
      const mockPublicKey = '0x' + 'a'.repeat(64) + 'b'.repeat(64);

      // Update state
      setWalletAddress(selectedAddress);
      setPublicKey(mockPublicKey);
      setWalletConnected(true);
      setSuccess(`Wallet connected! ${accountName} (${selectedAddress.slice(0, 6)}...${selectedAddress.slice(-4)})`);

    } catch (error) {
      console.error('❌ [Registration] Wallet connection error:', error);
      if (error.code === 4001) {
        setError('Connection rejected. Please connect your wallet to continue.');
      } else if (error.code === -32002) {
        setError('Connection request already pending. Please check MetaMask.');
      } else {
        setError('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get active account using official MetaMask API
  const getCurrentAccount = async () => {
    try {
      setLoading(true);
      setError('');

      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed.');
        return;
      }

      console.log('🔍 [Registration] Requesting active account via eth_requestAccounts...');

      // Official MetaMask method to get the active account
      // This shows popup and returns the user's current selection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('✅ [Registration] MetaMask returned accounts:', accounts);

      if (!accounts || accounts.length === 0) {
        setError('No accounts found. Please connect MetaMask first.');
        return;
      } else {
        setError('Accounts found = ' + accounts.length);
        return;
      }

      const activeAddress = accounts[0];
      const accountName = getAccountName(activeAddress);
      
      console.log('✅ [Registration] Active address:', activeAddress, 'Account name:', accountName);

      // Update the wallet address
      setWalletAddress(activeAddress);
      setWalletConnected(true);
      setSuccess(`Active account: ${accountName} (${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)})`);

    } catch (error) {
      console.error('❌ [Registration] Get active account error:', error);
      if (error.code === 4001) {
        setError('Account access rejected. Please connect your wallet.');
      } else if (error.code === -32002) {
        setError('Request already pending. Please check MetaMask.');
      } else {
        setError('Failed to get active account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get connected accounts without popup (for initial check)
  const getConnectedAccounts = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        return [];
      }

      // Get connected accounts without showing popup
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      console.log('🔍 [Registration] Connected accounts:', accounts);
      return accounts;
    } catch (error) {
      console.error('❌ [Registration] Get connected accounts error:', error);
      return [];
    }
  };

  // Simple account switching function
  const switchAccount = async () => {
    try {
      setLoading(true);
      setError('');

      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed.');
        return;
      }

      console.log('🔄 [Registration] Requesting account switch...');

      // Always request account access to get the current selection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('✅ [Registration] MetaMask returned accounts for switch:', accounts);

      if (!accounts || accounts.length === 0) {
        setError('No accounts selected.');
        return;
      }

      const selectedAddress = accounts[0];
      const accountName = getAccountName(selectedAddress);
      
      console.log('✅ [Registration] Switched to address:', selectedAddress, 'Account name:', accountName);

      // Update the wallet address
      setWalletAddress(selectedAddress);
      setSuccess(`Switched to: ${accountName} (${selectedAddress.slice(0, 6)}...${selectedAddress.slice(-4)})`);

    } catch (error) {
      console.error('❌ [Registration] Switch account error:', error);
      if (error.code === 4001) {
        setError('Account switch rejected.');
      } else {
        setError('Failed to switch account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // DID verification function
  const verifyDIDOwnership = async () => {
    try {
      setLoading(true);
      setError('');

      if (!existingDID.trim()) {
        setError('Please enter your DID first.');
        return;
      }

      if (!walletConnected) {
        setError('Please connect your wallet first.');
        return;
      }

      // Create verification message
      const message = `I, the holder of DID ${existingDID}, hereby verify ownership with wallet address ${walletAddress} on ${new Date().toISOString()}`;
      
      console.log('🔍 [Registration] Creating DID verification message:', message);

      // Request signature from MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });

      console.log('✅ [Registration] DID verification signature:', signature);

      setDidVerificationSignature(signature);
      setSuccess('DID ownership verified! You can now proceed with registration.');

    } catch (error) {
      console.error('❌ [Registration] DID verification error:', error);
      if (error.code === 4001) {
        setError('DID verification rejected. Please sign the message to verify ownership.');
      } else {
        setError('DID verification failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!walletConnected) {
      setError('Please connect your wallet first.');
      return false;
    }

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return false;
    }

    if (!formData.partyType) {
      setError('Please select your role.');
      return false;
    }

    // Validate DID if using existing DID
    if (useExistingDID) {
      if (!existingDID.trim()) {
        setError('Please enter your existing DID.');
        return false;
      }

      const didRegex = /^did:[a-z]+:[a-zA-Z0-9._-]+$/;
      if (!didRegex.test(existingDID)) {
        setError('Please enter a valid DID format (e.g., did:ethr:goerli:0x123...)');
        return false;
      }

      if (!didVerificationSignature) {
        setError('Please verify your DID ownership first.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const registrationData = {
        ...formData,
        walletAddress,
        publicKey,
        ...(useExistingDID && {
          existingDID,
          didVerificationSignature
        })
      };

      console.log('Submitting registration data:', registrationData);

      const response = await apiService.post('/auth/register', registrationData);

      if (response.data.success) {
        setSuccess('Registration successful! Please log in.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError('Registration failed: ' + error.response.data.message);
      } else if (error.message) {
        setError('Registration failed: ' + error.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Listen for MetaMask account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        console.log('🔄 [Registration] MetaMask accounts changed:', accounts);
        
        if (accounts.length > 0) {
          const newAddress = accounts[0];
          const accountName = getAccountName(newAddress);
          
          console.log('🔄 [Registration] Switching to:', accountName, newAddress);
          
          setWalletAddress(newAddress);
          setWalletConnected(true);
          setSuccess(`Switched to: ${accountName} (${newAddress.slice(0, 6)}...${newAddress.slice(-4)})`);
        } else {
          console.log('🔌 [Registration] MetaMask disconnected');
          setWalletAddress('');
          setWalletConnected(false);
          setSuccess('');
        }
      };

      const handleChainChanged = (chainId) => {
        console.log('🔄 [Registration] MetaMask chain changed:', chainId);
        window.location.reload();
      };

      const handleDisconnect = (error) => {
        console.log('🔌 [Registration] MetaMask disconnected:', error);
        setWalletAddress('');
        setWalletConnected(false);
        setSuccess('');
      };

      // Set up event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      // Cleanup on unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, []);

  // Get current account on component mount
  useEffect(() => {
    const initializeAccount = async () => {
      if (typeof window.ethereum !== 'undefined') {
        // First check if we have connected accounts without showing popup
        const connectedAccounts = await getConnectedAccounts();
        
        if (connectedAccounts.length > 0) {
          // We have connected accounts, use the first one
          const initialAddress = connectedAccounts[0];
          const accountName = getAccountName(initialAddress);
          
          console.log('✅ [Registration] Using connected account:', accountName, initialAddress);
          
          setWalletAddress(initialAddress);
          setWalletConnected(true);
          setSuccess(`Connected: ${accountName} (${initialAddress.slice(0, 6)}...${initialAddress.slice(-4)})`);
        } else {
          console.log('🔍 [Registration] No connected accounts found');
        }
      }
    };

    initializeAccount();
  }, []);

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
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
            <PersonAddOutlined sx={{ color: 'white', fontSize: 28 }} />
          </Box>

          <Typography component="h1" variant="h4" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Join the Contract Management System
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

          {/* Wallet Connection */}
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
                {loading ? <CircularProgress size={20} /> : 'Connect MetaMask'}
              </Button>
            ) : (
              <Box sx={{ width: '100%' }}>
                <Card sx={{ mb: 2, bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography variant="body1" color="success.dark" gutterBottom>
                      ✅ Wallet Connected
                    </Typography>
                    <Typography variant="h6" color="success.dark">
                      {getAccountName(walletAddress)} ({walletAddress.slice(0, 6)}...{walletAddress.slice(-4)})
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={switchAccount}
                        disabled={loading}
                        startIcon={<AccountBalanceWallet />}
                      >
                        Switch Account
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={getCurrentAccount}
                        disabled={loading}
                      >
                        Get Active Account
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Step 2: Account Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="party-type-label">Role</InputLabel>
                  <Select
                    labelId="party-type-label"
                    id="partyType"
                    name="partyType"
                    value={formData.partyType}
                    label="Role"
                    onChange={handleInputChange}
                  >
                    {partyTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box>
                          <Typography variant="body1">{type.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="organization"
                  label="Organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phoneNumber"
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="website"
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="location"
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 2 }}
              disabled={loading || !walletConnected}
            >
              {loading ? <CircularProgress size={20} /> : 'Create Account'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ mt: 1 }}
            >
              Already have an account? Sign in
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default UserRegistration; 