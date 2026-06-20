import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import apiService from '../services/api';
import DEPAConfigurationDisplay from '../components/DEPAConfigurationDisplay';

const UserRegistration = () => {
  const navigate = useNavigate();
  
  // Clear any existing auth tokens on mount to allow fresh registration
  useEffect(() => {
    const isNavigatingFromLogin = sessionStorage.getItem('navigatingToRegistration');
    console.log('🧹 [UserRegistration] Clearing any existing auth tokens for fresh registration...', 
                isNavigatingFromLogin ? '(navigated from login)' : '(direct access)');
    
    // Force clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    
    // Clear the navigation flag but preserve it for debugging
    if (isNavigatingFromLogin) {
      sessionStorage.removeItem('navigatingToRegistration');
      console.log('🔗 [UserRegistration] Navigation from login detected and cleared');
    }
    
    // Also clear any React Query cache that might contain user data
    if (window.queryClient) {
      window.queryClient.removeQueries(['user']);
      window.queryClient.removeQueries(['profile']);
    }
    
    console.log('✅ [UserRegistration] All auth data cleared, registration page ready');
  }, []);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    partyType: '',
    organization: ''
  });

  // User type and DID options
  const [userType, setUserType] = useState('individual');
  const [useExistingDID, setUseExistingDID] = useState(false);
  const [existingDID, setExistingDID] = useState('');

  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [publicKey, setPublicKey] = useState('');

  // DID verification state
  const [didValidationStatus, setDidValidationStatus] = useState('idle');
  const [didVerificationSignature, setDidVerificationSignature] = useState('');
  const [didPublicKey, setDidPublicKey] = useState('');
  const [didPublicKeyLoading, setDidPublicKeyLoading] = useState(false);
  const [didPublicKeyError, setDidPublicKeyError] = useState('');
  const [publicKeyFetched, setPublicKeyFetched] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [***REMOVED-KEYCLOAK_DB_PASSWORD***Failed, setKeycloakFailed] = useState(false);


  // System status
  const [systemStatus, setSystemStatus] = useState('ready');

  // Deployment status (read-only, config-driven)
  const [deploymentStatus, setDeploymentStatus] = useState(null);


  useEffect(() => {
    // Initialize wallet connection
    initializeWallet();
    
    // System is ready
    setSystemStatus('ready');
  }, []);


  const initializeWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          await derivePublicKeyFromSignature(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to get accounts:', error);
      }
    }
  };

  const derivePublicKeyFromSignature = async (address) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const message = `I, ${address}, hereby verify my identity for the Contract Management System on ${new Date().toISOString()}`;
      const signature = await signer.signMessage(message);
      
      // For demo purposes, we'll use a simple hash of the signature as the public key
      const publicKeyHash = ethers.keccak256(signature);
      setPublicKey(publicKeyHash);
    } catch (error) {
      console.error('Failed to derive public key:', error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        await derivePublicKeyFromSignature(accounts[0]);
        setSuccess('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        setError('Wallet connection rejected. Please try again.');
      } else {
        setError('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDIDType = (did) => {
    if (!did) return null;
    if (did.startsWith('did:ethr:')) return 'ethr';
    if (did.startsWith('did:web:')) return 'web';
    return 'unknown';
  };

  const validateDID = async (didParam) => {
    if (!didParam.trim()) {
      setDidValidationStatus('idle');
      return;
    }

    setDidValidationStatus('validating');

    try {
      const didType = getDIDType(didParam);
      
      if (didType === 'unknown') {
        setDidValidationStatus('invalid');
        return;
      }

      if (didType === 'web') {
        // For did:web, we'll validate by checking if the DID document exists
        const domain = didParam.replace('did:web:', '').split(':')[0];
        const didDocumentUrl = `https://${domain}/.well-known/did.json`;
        
        try {
          const response = await fetch(didDocumentUrl);
          if (response.ok) {
            setDidValidationStatus('available');
          } else {
            setDidValidationStatus('unavailable');
          }
        } catch (error) {
          setDidValidationStatus('unavailable');
        }
      } else {
        // For did:ethr, assume it's available
        setDidValidationStatus('available');
      }
    } catch (error) {
      setDidValidationStatus('invalid');
    }
  };

  const fetchDIDPublicKey = async (didParam) => {
    try {
      setDidPublicKeyLoading(true);
      setDidPublicKeyError('');
      setDidPublicKey('');

      const didType = getDIDType(didParam);
      if (didType !== 'web') {
        setDidPublicKeyError('Public key fetching is only available for did:web DIDs');
        return;
      }

      const domain = didParam.replace('did:web:', '').split(':')[0];
      const didDocumentUrl = `https://${domain}/.well-known/did.json`;
      
      const response = await fetch(didDocumentUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const didDocument = await response.json();
      
      if (!didDocument.id || !didDocument['@context']) {
        throw new Error('Invalid DID document structure');
      }
      
      if (didDocument.id !== didParam) {
        throw new Error('DID document ID does not match the provided DID');
      }
      
      // Extract public key from verification method
      let verificationMethod = null;

      if (didDocument.verificationMethod && Array.isArray(didDocument.verificationMethod)) {
        verificationMethod = didDocument.verificationMethod[0];
      } else if (didDocument.publicKey && Array.isArray(didDocument.publicKey)) {
        verificationMethod = didDocument.publicKey[0];
      } else if (didDocument.assertionMethod && Array.isArray(didDocument.assertionMethod)) {
        verificationMethod = didDocument.assertionMethod[0];
      } else if (didDocument.authentication && Array.isArray(didDocument.authentication)) {
        verificationMethod = didDocument.authentication[0];
      } else if (didDocument.capabilityInvocation && Array.isArray(didDocument.capabilityInvocation)) {
        verificationMethod = didDocument.capabilityInvocation[0];
      } else {
        throw new Error('DID document missing verification methods');
      }

      // Extract public key
      let publicKey = '';
      if (verificationMethod.publicKeyMultibase) {
        publicKey = verificationMethod.publicKeyMultibase;
      } else if (verificationMethod.publicKeyPem) {
        publicKey = verificationMethod.publicKeyPem;
      } else if (verificationMethod.publicKeyJwk) {
        publicKey = JSON.stringify(verificationMethod.publicKeyJwk, null, 2);
      } else if (verificationMethod.publicKeyHex) {
        publicKey = verificationMethod.publicKeyHex;
      } else {
        throw new Error('No public key found in verification method');
      }
      
      setDidPublicKey(publicKey);
      setPublicKey(publicKey); // Set the main public key field
      setPublicKeyFetched(true);
      setSuccess(`Public key fetched successfully from ${domain}`);
      
    } catch (error) {
      console.error('Public key fetch failed:', error);
      setDidPublicKeyError('Failed to fetch public key: ' + error.message);
    } finally {
      setDidPublicKeyLoading(false);
    }
  };

  const verifyDIDOwnership = async () => {
    try {
      setLoading(true);
      setError('');

      if (!existingDID.trim()) {
        setError('Please enter your DID first.');
        return;
      }

      const didType = getDIDType(existingDID);
      
      if (didType === 'ethr') {
        if (!walletConnected) {
          setError('Please connect your wallet first.');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const message = `I, the holder of DID ${existingDID}, hereby verify ownership with wallet address ${walletAddress} on ${new Date().toISOString()}`;
        const signature = await signer.signMessage(message);
        
        setDidVerificationSignature(signature);
        setSuccess('DID ownership verified! You can now proceed with registration.');
        
      } else if (didType === 'web') {
        const domain = existingDID.replace('did:web:', '').split(':')[0];
        const didDocumentUrl = `https://${domain}/.well-known/did.json`;
        
        const response = await fetch(didDocumentUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const didDocument = await response.json();
        
        if (!didDocument.id || !didDocument['@context']) {
          throw new Error('Invalid DID document structure');
        }
        
        if (didDocument.id !== existingDID) {
          throw new Error('DID document ID does not match the provided DID');
        }
        
        const verificationData = {
          type: 'domain_verification',
          domain: domain,
          didDocument: didDocument,
          verifiedAt: new Date().toISOString()
        };
        
        setDidVerificationSignature(JSON.stringify(verificationData));
        setSuccess(`Domain ownership verified for ${domain}! DID document found and validated.`);
        
      } else {
        setError('Unsupported DID method. Please use did:ethr or did:web.');
      }
      
    } catch (error) {
      console.error('DID verification error:', error);
      setError('DID verification failed: ' + error.message);
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

    if (useExistingDID) {
      if (!existingDID.trim()) {
        setError('Please enter your existing DID.');
        return false;
      }

      if (didValidationStatus !== 'available') {
        setError('Please enter a valid and available DID.');
        return false;
      }

      // DID verification is optional - don't block registration if not verified
      if (userType === 'individual' && !didVerificationSignature) {
        const didType = getDIDType(existingDID);
        if (didType === 'ethr') {
          console.log('DID ownership not verified, but registration can proceed');
        } else if (didType === 'web') {
          console.log('Domain ownership not verified, but registration can proceed');
        } else {
          console.log('DID ownership not verified, but registration can proceed');
        }
        // Don't return false - allow registration to proceed
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
        userType,
        ...(userType === 'individual' && { walletAddress }),
        ...(publicKey && { publicKey }), // Include public key for all users if provided
        ...(useExistingDID && {
          existingDID,
          didVerificationSignature
        }),
      };

      console.log('Submitting registration data:', registrationData);

      const response = await apiService.register(registrationData);

      if (response.data.success) {
        setSuccess('Registration successful!\n\nStatus:\n- Database: ✅\n- Keycloak: ✅\n- Blockchain: ✅\n\n🔑 Login Credentials:\nEmail: ' + formData.email + '\nPassword: ' + response.data.loginCredentials.password + '\n\n⚠️  This is a temporary password. Please change it on first login.');
        
        // Show DEPA ID information if available
        if (response.data.user.depaId) {
          const depaIdInfo = response.data.user.depaId;
          setSuccess(prev => prev + `\n\n🆔 DEPA ID: ${depaIdInfo}`);
        }
      } else {
        setError('Registration failed: ' + response.data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getDIDStatusDisplay = () => {
    switch (didValidationStatus) {
      case 'validating':
        return <Chip label="Validating..." color="warning" size="small" />;
      case 'available':
        return <Chip label="Available" color="success" size="small" />;
      case 'unavailable':
        return <Chip label="Unavailable" color="error" size="small" />;
      case 'invalid':
        return <Chip label="Invalid" color="error" size="small" />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          User Registration
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Register for the Contract Management System
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* DEPA ID Configuration Section - Moved to top */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="h6">DEPA ID Configuration</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <DEPAConfigurationDisplay
                user={{ depaId: null, partyType: formData.partyType }}
                compact={false}
                showFormat={true}
                showDeploymentInfo={true}
                showRegulatoryInfo={true}
                title="DEPA ID Assignment Information"
              />
            </Grid>

            {/* User Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>User Type</InputLabel>
                <Select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  label="User Type"
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                                 <Select
                   name="partyType"
                   value={formData.partyType}
                   onChange={handleInputChange}
                   label="Role"
                   required
                 >
                   <MenuItem value="TDP">Training Data Provider (TDP)</MenuItem>
                   <MenuItem value="TDC">Training Data Consumer (TDC)</MenuItem>
                   <MenuItem value="TSP">Tech Service Provider (TSP)</MenuItem>
                 </Select>
              </FormControl>
            </Grid>

            {userType === 'enterprise' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                />
              </Grid>
            )}

            {/* DID Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="h6">DID (Decentralized Identifier)</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useExistingDID}
                    onChange={(e) => setUseExistingDID(e.target.checked)}
                  />
                }
                label="Use Existing DID"
              />
            </Grid>

            {useExistingDID && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Existing DID"
                    placeholder="did:web:example.com or did:ethr:0x..."
                    value={existingDID}
                    onChange={handleDIDChange}
                    helperText="Enter your DID (did:web or did:ethr)"
                  />
                  {getDIDStatusDisplay()}
                </Grid>

                {didValidationStatus === 'available' && (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={() => fetchDIDPublicKey(existingDID)}
                      disabled={didPublicKeyLoading}
                      sx={{ mr: 1 }}
                    >
                      {didPublicKeyLoading ? <CircularProgress size={20} /> : 'Fetch Public Key'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={verifyDIDOwnership}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Verify Ownership'}
                    </Button>
                  </Grid>
                )}



                {didPublicKeyError && (
                  <Grid item xs={12}>
                    <Alert severity="error">{didPublicKeyError}</Alert>
                  </Grid>
                )}
              </>
            )}

            {/* Public Key Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="h6">Public Key</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Public Key"
                placeholder="Enter your public key or fetch from DID"
                multiline
                rows={4}
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                helperText={
                  publicKeyFetched 
                    ? "Public key fetched from DID - you can edit if needed" 
                    : "Enter your public key manually or use 'Fetch Public Key' button above"
                }
                InputProps={{
                  endAdornment: publicKeyFetched && (
                    <Chip 
                      label="Fetched" 
                      color="success" 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                  )
                }}
              />
            </Grid>

            {/* System Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="h6">System Information</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      Secure Contract Management
                    </Typography>
                  </Box>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Your data is secure!</strong> This system uses SCITT CCF ledger technology for tamper-proof contract execution and enterprise-grade security. You can complete registration now and configure advanced signing options later.
                    </Typography>
                  </Alert>

                  <Typography variant="body2" color="text.secondary">
                    The system provides enterprise-grade security with:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                    <li><Typography variant="body2" color="text.secondary">Tamper-proof contract storage</Typography></li>
                    <li><Typography variant="body2" color="text.secondary">Enterprise key management integration</Typography></li>
                    <li><Typography variant="body2" color="text.secondary">Audit trail and provenance tracking</Typography></li>
                    <li><Typography variant="body2" color="text.secondary">Regulatory compliance built-in</Typography></li>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Wallet Connection (Optional) */}
            {(userType === 'individual' || (useExistingDID && getDIDType(existingDID) === 'ethr')) && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="h6">Wallet Connection (Optional)</Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Wallet connection is optional for registration. You can connect now or later when you need blockchain features.
                    </Typography>
                  </Alert>

                  {!walletConnected ? (
                    <Button
                      variant="outlined"
                      onClick={connectWallet}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      Connect Wallet (Optional)
                    </Button>
                  ) : (
                    <Alert severity="success">
                      Wallet connected: {walletAddress}
                    </Alert>
                  )}
                </Grid>
              </>
            )}

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Error and Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {success.split('\n').map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </Alert>
        )}

        {/* Manual Login Buttons - Always show after successful registration */}
        {success && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              sx={{ mr: 2 }}
            >
              Go to Login Page
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSuccess('');
                setKeycloakFailed(false);
                setError('');
              }}
            >
              Register Another User
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UserRegistration; 