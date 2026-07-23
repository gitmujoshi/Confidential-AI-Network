import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Grid,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import VerifiedIcon from '@mui/icons-material/Verified';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ethers } from 'ethers';
import DEPAConfigurationDisplay from '../components/DEPAConfigurationDisplay';

const Profile = () => {
  const { currentUser, setUser, isInitializing, refreshAuth } = useUser();
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from URL params for editing other users
  
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    phoneNumber: '',
    website: '',
    location: '',
    description: '',
    did: '',
    didSource: '',
    didVerified: false,
    didVerificationMethod: '',
    publicKey: '',
    isActive: true,
    profileCompleted: false,
    emailVerified: false,
    onboardingStatus: ''
  });
  
  // Password update state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileUser, setProfileUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [authError, setAuthError] = useState(false);

  // DID verification state
  const [didValidationStatus, setDidValidationStatus] = useState('idle');
  const [didVerificationSignature, setDidVerificationSignature] = useState('');
  const [didPublicKey, setDidPublicKey] = useState('');
  const [didPublicKeyLoading, setDidPublicKeyLoading] = useState(false);
  const [didPublicKeyError, setDidPublicKeyError] = useState('');
  const [publicKeyFetched, setPublicKeyFetched] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Determine if we're editing another user's profile
  const isEditingOtherUser = userId && userId !== currentUser?.id?.toString();
  const canEdit = currentUser?.partyType === 'AppAdmin' || !isEditingOtherUser;

  useEffect(() => {
    // Check if user is logged in
    if (!isInitializing && !currentUser) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    // Load profile data
    const loadProfileData = async () => {
      try {
        setAuthError(false);
        let userData;
        
        if (isEditingOtherUser) {
          // Load other user's profile
          const response = await apiService.getUser(userId);
          userData = response.data;
          setProfileUser(userData);
        } else {
          // Load current user's profile
          const response = await apiService.get('/api/auth/profile');
          userData = response.data.user;
          setProfileUser(userData);
        }

        // Set form data
        setFormData({
          name: userData.name || '',
          organization: userData.organization || '',
          phoneNumber: userData.phoneNumber || '',
          website: userData.website || '',
          location: userData.location || '',
          description: userData.description || '',
          did: userData.did || '',
          didSource: userData.didSource || '',
          didVerified: userData.didVerified || false,
          didVerificationMethod: userData.didVerificationMethod || '',
          publicKey: userData.publicKey || '',
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          profileCompleted: userData.profileCompleted || false,
          emailVerified: userData.emailVerified || false,
          onboardingStatus: userData.onboardingStatus || ''
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        
        // Check if it's an authentication error
        if (error.response?.status === 401 || error.response?.status === 403) {
          setAuthError(true);
          setError('Authentication failed. Please refresh your session.');
        } else {
          setError('Failed to load profile data');
        }
      }
    };

    if (currentUser) {
      loadProfileData();
    }
  }, [currentUser, navigate, isInitializing, userId, isEditingOtherUser]);

  // Initialize wallet connection
  useEffect(() => {
    if (isEditing) {
      initializeWallet();
    }
  }, [isEditing]);

  const initializeWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
        }
      } catch (error) {
        console.error('Failed to get accounts:', error);
      }
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
      setFormData(prev => ({ ...prev, publicKey: publicKey }));
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

      if (!formData.did.trim()) {
        setError('Please enter your DID first.');
        return;
      }

      const didType = getDIDType(formData.did);
      
      if (didType === 'ethr') {
        if (!walletConnected) {
          setError('Please connect your wallet first.');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const message = `I, the holder of DID ${formData.did}, hereby verify ownership with wallet address ${walletAddress} on ${new Date().toISOString()}`;
        const signature = await signer.signMessage(message);
        
        setDidVerificationSignature(signature);
        setSuccess('DID ownership verified! You can now save your profile.');
        
      } else if (didType === 'web') {
        const domain = formData.did.replace('did:web:', '').split(':')[0];
        const didDocumentUrl = `https://${domain}/.well-known/did.json`;
        
        const response = await fetch(didDocumentUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const didDocument = await response.json();
        
        if (!didDocument.id || !didDocument['@context']) {
          throw new Error('Invalid DID document structure');
        }
        
        if (didDocument.id !== formData.did) {
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

  const getDIDStatusDisplay = () => {
    switch (didValidationStatus) {
      case 'validating':
        return <CircularProgress size={16} />;
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-validate DID when it changes
    if (name === 'did') {
      validateDID(value);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let response;
      
      // Prepare the data to send
      const updateData = { ...formData };
      
      // If DID was changed and verification signature exists, include it
      if (formData.did !== profileUser.did && didVerificationSignature) {
        updateData.didVerificationSignature = didVerificationSignature;
        updateData.didSource = 'USER_PROVIDED';
        updateData.didVerified = true;
        updateData.didVerificationMethod = getDIDType(formData.did) === 'ethr' ? 'SIGNATURE_VERIFICATION' : 'DOMAIN_VERIFICATION';
      }
      
      if (isEditingOtherUser) {
        // Update other user's profile (AppAdmin only)
        response = await apiService.put(`/api/users/${userId}`, updateData);
      } else {
        // Update current user's profile
        response = await apiService.updateProfile(updateData);
      }
      
      setSuccess('Profile updated successfully!');
      
      // Update the profile user data
      const updatedUser = response.data.user || response.data;
      setProfileUser(updatedUser);
      
      // If updating current user, also update the context
      if (!isEditingOtherUser) {
        setUser((prev) => ({ ...prev, ...updatedUser }));
      }
      
      // Reset DID verification state
      setDidVerificationSignature('');
      setDidPublicKey('');
      setDidPublicKeyError('');
      setPublicKeyFetched(false);
      
      setIsEditing(false);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    // Reset form data to original values
    if (profileUser) {
      setFormData({
        name: profileUser.name || '',
        organization: profileUser.organization || '',
        phoneNumber: profileUser.phoneNumber || '',
        website: profileUser.website || '',
        location: profileUser.location || '',
        description: profileUser.description || '',
        did: profileUser.did || '',
        didSource: profileUser.didSource || '',
        didVerified: profileUser.didVerified || false,
        didVerificationMethod: profileUser.didVerificationMethod || '',
        publicKey: profileUser.publicKey || '',
        isActive: profileUser.isActive !== undefined ? profileUser.isActive : true,
        profileCompleted: profileUser.profileCompleted || false,
        emailVerified: profileUser.emailVerified || false,
        onboardingStatus: profileUser.onboardingStatus || ''
      });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      // Call the password update API
      const response = await apiService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordSuccess(`Password updated successfully! ${response.data.note || ''}`);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      
      // Show a notification that the user might need to log in again
      if (response.data.note && response.data.note.includes('log in again')) {
        setTimeout(() => {
          if (window.confirm('For security reasons, you may need to log in again with your new password. Would you like to log out now?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('currentUser');
            window.location.href = '/login';
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Password update error:', error);
      setPasswordError(error.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Show loading spinner while checking user
  if (isInitializing) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error if no user
  if (!currentUser) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 8 }}>
          <Alert severity="error">
            Please log in to view profiles.
          </Alert>
        </Box>
      </Container>
    );
  }

  // Show authentication error with refresh option
  if (authError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 8 }}>
          <Alert 
            severity="error" 
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={async () => {
                  await refreshAuth();
                  setAuthError(false);
                  setError('');
                }}
              >
                Refresh Session
              </Button>
            }
          >
            Authentication failed. Please refresh your session or log in again.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!profileUser) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 8 }}>
          <Alert severity="info">
            Loading profile...
          </Alert>
        </Box>
      </Container>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={0} variant="outlined" sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              {isEditingOtherUser ? `Profile: ${profileUser.name}` : 'My Profile'}
            </Typography>
            {canEdit && !isEditing && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setIsEditing(true)}
                startIcon={<SettingsIcon />}
              >
                Edit Profile
              </Button>
            )}
          </Box>

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

          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Basic Information</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Email:</strong>
                    </Typography>
                    <Typography variant="body1">{profileUser.email}</Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Party Type:</strong>
                    </Typography>
                    <Chip 
                      label={profileUser.partyType} 
                      color="primary" 
                      size="small" 
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  {/* DEPA ID Configuration - Read Only */}
                  <Box sx={{ mb: 2 }}>
                    <DEPAConfigurationDisplay
                      user={profileUser}
                      compact={true}
                      showFormat={false}
                      showDeploymentInfo={false}
                      showRegulatoryInfo={false}
                      title="DEPA ID"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Registration Date:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(profileUser.registrationDate)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Last Login:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(profileUser.lastLoginAt)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* DID Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SecurityIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">DID Information</Typography>
                  </Box>
                  
                  {isEditing && (currentUser?.partyType === 'AppAdmin' || !isEditingOtherUser) ? (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>DID:</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            label="DID"
                            name="did"
                            value={formData.did}
                            onChange={handleInputChange}
                            fullWidth
                            size="small"
                            placeholder="did:web:example.com or did:ethr:0x..."
                            helperText="Enter your DID for verification"
                          />
                          {getDIDStatusDisplay()}
                        </Box>
                      </Box>

                      {/* DID Verification Actions */}
                      {formData.did && didValidationStatus === 'available' && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>DID Actions:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {getDIDType(formData.did) === 'web' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => fetchDIDPublicKey(formData.did)}
                                disabled={didPublicKeyLoading}
                                startIcon={didPublicKeyLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                              >
                                {didPublicKeyLoading ? 'Fetching...' : 'Fetch Public Key'}
                              </Button>
                            )}
                            
                            {getDIDType(formData.did) === 'ethr' && !walletConnected && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={connectWallet}
                                disabled={loading}
                              >
                                Connect Wallet
                              </Button>
                            )}
                            
                            <Button
                              size="small"
                              variant="contained"
                              onClick={verifyDIDOwnership}
                              disabled={loading || (getDIDType(formData.did) === 'ethr' && !walletConnected)}
                              startIcon={didVerificationSignature ? <VerifiedIcon /> : <HelpOutlineIcon />}
                            >
                              {didVerificationSignature ? 'Verified' : 'Verify Ownership'}
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* DID Verification Status */}
                      {didVerificationSignature && (
                        <Box sx={{ mb: 2 }}>
                          <Alert severity="success" sx={{ py: 0 }}>
                            <Typography variant="body2">
                              ✓ DID ownership verified successfully!
                            </Typography>
                          </Alert>
                        </Box>
                      )}

                      {/* Public Key Fetch Results */}
                      {didPublicKeyError && (
                        <Box sx={{ mb: 2 }}>
                          <Alert severity="error" sx={{ py: 0 }}>
                            <Typography variant="body2">
                              {didPublicKeyError}
                            </Typography>
                          </Alert>
                        </Box>
                      )}

                      {didPublicKey && (
                        <Box sx={{ mb: 2 }}>
                          <Alert severity="info" sx={{ py: 0 }}>
                            <Typography variant="body2">
                              ✓ Public key fetched from DID document
                            </Typography>
                          </Alert>
                        </Box>
                      )}

                      <FormControl fullWidth margin="normal">
                        <InputLabel>DID Source</InputLabel>
                        <Select
                          name="didSource"
                          value={formData.didSource}
                          onChange={handleInputChange}
                          label="DID Source"
                        >
                          <MenuItem value="SYSTEM_GENERATED">System Generated</MenuItem>
                          <MenuItem value="USER_PROVIDED">User Provided</MenuItem>
                          <MenuItem value="AUTO_VERIFIED">Auto Verified</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.didVerified}
                            onChange={(e) => setFormData(prev => ({ ...prev, didVerified: e.target.checked }))}
                            name="didVerified"
                          />
                        }
                        label="DID Verified"
                      />

                      <TextField
                        label="Verification Method"
                        name="didVerificationMethod"
                        value={formData.didVerificationMethod}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        placeholder="SIGNATURE_VERIFICATION, AUTO_VERIFIED, etc."
                      />

                      <TextField
                        label="Public Key"
                        name="publicKey"
                        value={formData.publicKey}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        multiline
                        rows={3}
                        placeholder="Enter public key or fetch from DID"
                        helperText={publicKeyFetched ? "Public key fetched from DID document" : "Enter public key manually or fetch from DID"}
                      />
                    </>
                  ) : (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>DID:</strong>
                        </Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          {profileUser.did || 'Not assigned'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>DID Source:</strong>
                        </Typography>
                        <Chip 
                          label={profileUser.didSource || 'Unknown'} 
                          color="secondary" 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>DID Verified:</strong>
                        </Typography>
                        <Chip 
                          label={profileUser.didVerified ? 'Verified' : 'Not Verified'} 
                          color={profileUser.didVerified ? 'success' : 'warning'} 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Verification Method:</strong>
                        </Typography>
                        <Typography variant="body1">
                          {profileUser.didVerificationMethod || 'None'}
                        </Typography>
                      </Box>

                      {profileUser.publicKey && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Public Key:</strong>
                          </Typography>
                          <Typography variant="body1" sx={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>
                            {profileUser.publicKey}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Status Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Account Status</Typography>
                  </Box>
                  
                  {isEditing && currentUser?.partyType === 'AppAdmin' ? (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            name="isActive"
                          />
                        }
                        label="Account Active"
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.emailVerified}
                            onChange={(e) => setFormData(prev => ({ ...prev, emailVerified: e.target.checked }))}
                            name="emailVerified"
                          />
                        }
                        label="Email Verified"
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.profileCompleted}
                            onChange={(e) => setFormData(prev => ({ ...prev, profileCompleted: e.target.checked }))}
                            name="profileCompleted"
                          />
                        }
                        label="Profile Completed"
                      />

                      <FormControl fullWidth margin="normal">
                        <InputLabel>Onboarding Status</InputLabel>
                        <Select
                          name="onboardingStatus"
                          value={formData.onboardingStatus}
                          onChange={handleInputChange}
                          label="Onboarding Status"
                        >
                          <MenuItem value="PENDING">Pending</MenuItem>
                          <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                          <MenuItem value="COMPLETED">Completed</MenuItem>
                        </Select>
                      </FormControl>

                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Registration Status:</strong>
                      </Typography>
                      <Chip 
                        label={profileUser.isRegistered ? 'Registered' : 'Not Registered'} 
                        color={profileUser.isRegistered ? 'success' : 'error'} 
                        size="small" 
                        sx={{ mt: 0.5 }}
                      />
                    </>
                  ) : (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Registration Status:</strong>
                        </Typography>
                        <Chip 
                          label={profileUser.isRegistered ? 'Registered' : 'Not Registered'} 
                          color={profileUser.isRegistered ? 'success' : 'error'} 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Account Active:</strong>
                        </Typography>
                        <Chip 
                          label={profileUser.isActive ? 'Active' : 'Inactive'} 
                          color={profileUser.isActive ? 'success' : 'error'} 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Email Verified:</strong>
                        </Typography>
                        <Chip 
                          label={profileUser.emailVerified ? 'Verified' : 'Not Verified'} 
                          color={profileUser.emailVerified ? 'success' : 'warning'} 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Profile Completed:</strong>
                        </Typography>
                        <Chip 
                          label={profileUser.profileCompleted ? 'Completed' : 'Incomplete'} 
                          color={profileUser.profileCompleted ? 'success' : 'warning'} 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Onboarding Status:</strong>
                        </Typography>
                        <Chip 
                          label={profileUser.onboardingStatus || 'Unknown'} 
                          color="info" 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Password Update Section */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SecurityIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Password Management</Typography>
                  </Box>
                  
                  {passwordError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {passwordError}
                    </Alert>
                  )}
                  
                  {passwordSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      {passwordSuccess}
                    </Alert>
                  )}

                  {!showPasswordForm ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setShowPasswordForm(true)}
                      startIcon={<SecurityIcon />}
                    >
                      Change Password
                    </Button>
                  ) : (
                    <Box component="form" onSubmit={handlePasswordUpdate}>
                      <TextField
                        label="Current Password"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        margin="normal"
                        required
                      />
                      
                      <TextField
                        label="New Password"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        margin="normal"
                        required
                        helperText="Password must be at least 8 characters long"
                      />
                      
                      <TextField
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        margin="normal"
                        required
                        error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                        helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== '' ? 'Passwords do not match' : ''}
                      />
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            });
                            setPasswordError('');
                            setPasswordSuccess('');
                          }}
                          disabled={passwordLoading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Editable Profile Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Profile Information</Typography>
                  </Box>

                  {isEditing ? (
                    <Box component="form" onSubmit={handleSave}>
                      <TextField
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        required
                      />
                      <TextField
                        label="Organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Phone Number"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                      />
                      <TextField
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        multiline
                        minRows={3}
                      />
                      
                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Name:</strong>
                        </Typography>
                        <Typography variant="body1">{profileUser.name}</Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Organization:</strong>
                        </Typography>
                        <Typography variant="body1">{profileUser.organization || 'Not specified'}</Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Phone Number:</strong>
                        </Typography>
                        <Typography variant="body1">{profileUser.phoneNumber || 'Not specified'}</Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Website:</strong>
                        </Typography>
                        <Typography variant="body1">
                          {profileUser.website ? (
                            <a href={profileUser.website} target="_blank" rel="noopener noreferrer">
                              {profileUser.website}
                            </a>
                          ) : (
                            'Not specified'
                          )}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Location:</strong>
                        </Typography>
                        <Typography variant="body1">{profileUser.location || 'Not specified'}</Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Description:</strong>
                        </Typography>
                        <Typography variant="body1">{profileUser.description || 'No description provided'}</Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile; 