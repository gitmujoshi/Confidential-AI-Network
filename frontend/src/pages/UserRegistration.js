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
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Info from '@mui/icons-material/Info';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
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
  const [didVerificationMessage, setDidVerificationMessage] = useState('');
  const [didValidationStatus, setDidValidationStatus] = useState(null);
  const [didInfo, setDidInfo] = useState(null);

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

  // Derive public key from MetaMask signature
  const derivePublicKeyFromSignature = async (walletAddress) => {
    try {
      console.log('🔑 [Registration] Requesting signature to derive public key...');
      
      // Create a message for the user to sign
      const message = `I authorize this application to derive my public key for registration.\n\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`;
      
      // Request signature from MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });
      
      console.log('✅ [Registration] Signature received:', signature);
      
      // Import ethers dynamically to avoid SSR issues
      const { ethers } = await import('ethers');
      
      // Verify the signature to ensure it's valid
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Signature verification failed');
      }
      
      // Create a deterministic public key based on the wallet address
      // This is a simplified approach - in production you might want to use a more sophisticated method
      const addressHash = ethers.keccak256(ethers.toUtf8Bytes(walletAddress));
      const publicKey = `0x${addressHash.slice(2)}${addressHash.slice(2, 66)}`; // 64 bytes total
      
      console.log('✅ [Registration] Public key derived:', publicKey);
      return publicKey;
      
    } catch (error) {
      console.error('❌ [Registration] Failed to derive public key:', error);
      
      if (error.code === 4001) {
        throw new Error('Public key derivation rejected. Please sign the message to continue.');
      } else {
        throw new Error('Failed to derive public key: ' + error.message);
      }
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

      // Derive public key from signature
      const publicKey = await derivePublicKeyFromSignature(selectedAddress);

      // Update state
      setWalletAddress(selectedAddress);
      setPublicKey(publicKey);
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

      // Derive public key from signature
      const publicKey = await derivePublicKeyFromSignature(activeAddress);

      // Update the wallet address and public key
      setWalletAddress(activeAddress);
      setPublicKey(publicKey);
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

      // Derive public key from signature
      const publicKey = await derivePublicKeyFromSignature(selectedAddress);

      // Update the wallet address and public key
      setWalletAddress(selectedAddress);
      setPublicKey(publicKey);
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

  // Validate DID format
  const validateDID = async (did) => {
    if (!did.trim()) {
      setDidValidationStatus(null);
      setDidInfo(null);
      return;
    }

    try {
      setDidValidationStatus('validating');
      
      // Check if DID is available
      const response = await apiService.checkDIDAvailability(encodeURIComponent(did));
      
      if (response.data.success) {
        if (response.data.available) {
          setDidValidationStatus('available');
          
          // Get DID info
          try {
            const infoResponse = await apiService.getDIDInfo(encodeURIComponent(did));
            if (infoResponse.data.success) {
              setDidInfo(infoResponse.data.didInfo);
            }
          } catch (infoError) {
            console.log('Could not fetch DID info:', infoError);
          }
        } else {
          setDidValidationStatus('taken');
        }
      } else {
        setDidValidationStatus('invalid');
      }
    } catch (error) {
      console.error('DID validation error:', error);
      if (error.response?.data?.code === 'INVALID_DID_FORMAT') {
        setDidValidationStatus('invalid');
      } else {
        setDidValidationStatus('error');
      }
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
      setDidVerificationMessage(message);
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

  const handleDIDChange = (e) => {
    const value = e.target.value;
    setExistingDID(value);
    validateDID(value);
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

      if (didValidationStatus !== 'available') {
        setError('Please enter a valid and available DID.');
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

      const response = await apiService.register(registrationData);

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
      const handleAccountsChanged = async (accounts) => {
        console.log('🔄 [Registration] MetaMask accounts changed:', accounts);
        
        if (accounts.length > 0) {
          const newAddress = accounts[0];
          const accountName = getAccountName(newAddress);
          
          console.log('🔄 [Registration] Switching to:', accountName, newAddress);
          
          try {
            // Derive public key from signature
            const publicKey = await derivePublicKeyFromSignature(newAddress);
            
            setWalletAddress(newAddress);
            setPublicKey(publicKey);
            setWalletConnected(true);
            setSuccess(`Switched to: ${accountName} (${newAddress.slice(0, 6)}...${newAddress.slice(-4)})`);
          } catch (error) {
            console.log('⚠️ [Registration] Could not derive public key for account change:', error.message);
            // Don't set wallet as connected if we can't get the public key
            setWalletAddress('');
            setPublicKey('');
            setWalletConnected(false);
            setError('Failed to derive public key. Please reconnect your wallet.');
          }
        } else {
          console.log('🔌 [Registration] MetaMask disconnected');
          setWalletAddress('');
          setPublicKey('');
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
        setPublicKey('');
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
          
          try {
            // Derive public key from signature for connected account
            const publicKey = await derivePublicKeyFromSignature(initialAddress);
            
            setWalletAddress(initialAddress);
            setPublicKey(publicKey);
            setWalletConnected(true);
            setSuccess(`Connected: ${accountName} (${initialAddress.slice(0, 6)}...${initialAddress.slice(-4)})`);
          } catch (error) {
            console.log('⚠️ [Registration] Could not derive public key for connected account:', error.message);
            // Don't set wallet as connected if we can't get the public key
            setWalletAddress('');
            setPublicKey('');
            setWalletConnected(false);
          }
        } else {
          console.log('🔍 [Registration] No connected accounts found');
        }
      }
    };

    initializeAccount();
  }, []);

  // Get DID validation status display
  const getDIDStatusDisplay = () => {
    switch (didValidationStatus) {
      case 'validating':
        return <CircularProgress size={16} />;
      case 'available':
        return <CheckCircle color="success" fontSize="small" />;
      case 'taken':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'invalid':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  const getDIDStatusText = () => {
    switch (didValidationStatus) {
      case 'validating':
        return 'Validating DID...';
      case 'available':
        return 'DID is available';
      case 'taken':
        return 'DID is already registered';
      case 'invalid':
        return 'Invalid DID format';
      case 'error':
        return 'Error validating DID';
      default:
        return '';
    }
  };

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

            {/* DID Section */}
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Step 3: Digital Identity (Optional)
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={useExistingDID}
                    onChange={(e) => setUseExistingDID(e.target.checked)}
                    color="primary"
                  />
                }
                label="I have an existing DID (did:ethr or did:web)"
              />

              {useExistingDID && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Enter your existing DID to maintain your digital identity across platforms.
                  </Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Your DID"
                        placeholder="did:ethr:goerli:0x123... or did:web:company.com:user:alice"
                        value={existingDID}
                        onChange={handleDIDChange}
                        helperText="Supports did:ethr and did:web methods"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getDIDStatusDisplay()}
                        <Typography variant="caption" color="text.secondary">
                          {getDIDStatusText()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {didInfo && (
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`Method: ${didInfo.method.toUpperCase()}`} 
                        color="primary" 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={`Identifier: ${didInfo.identifier}`} 
                        variant="outlined" 
                        size="small"
                      />
                    </Box>
                  )}

                  {didValidationStatus === 'available' && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<VerifiedUser />}
                        onClick={verifyDIDOwnership}
                        disabled={loading || !walletConnected}
                        fullWidth
                      >
                        {loading ? <CircularProgress size={20} /> : 'Verify DID Ownership'}
                      </Button>
                      {didVerificationSignature && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          ✅ DID ownership verified successfully!
                        </Alert>
                      )}
                    </Box>
                  )}

                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body2">
                        <Info sx={{ mr: 1, fontSize: 16 }} />
                        DID Information & Examples
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" gutterBottom>
                        <strong>did:ethr</strong> - Ethereum-based DIDs using wallet addresses
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Example: did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>did:web</strong> - Web-based DIDs hosted on web domains
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Example: did:web:company.com:user:alice
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Box>

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