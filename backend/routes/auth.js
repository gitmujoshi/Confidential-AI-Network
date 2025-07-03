/**
 * Authentication Routes
 * 
 * This module handles all authentication-related endpoints including:
 * - User registration with IAM integration
 * - Login and token management
 * - Profile management
 * - Onboarding workflow
 * - Email verification
 * 
 * Features:
 * - Keycloak IAM integration
 * - Multi-step user onboarding
 * - Email verification
 * - Profile completion
 * - Role assignment
 */

const express = require('express');
const router = express.Router();
const keycloakService = require('../services/keycloakService');
const db = require('../models');
const { 
  authenticateToken, 
  optionalAuth, 
  authRateLimit, 
  logAuthEvent 
} = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
const didService = require('../services/didService');

/**
 * POST /api/auth/register
 * Register a new user with support for both did:ethr and did:web
 */
router.post('/register', authRateLimit, logAuthEvent('REGISTER'), async (req, res) => {
  try {
    const {
      name,
      email,
      partyType,
      walletAddress,
      publicKey,
      description,
      organization,
      phoneNumber,
      website,
      location,
      existingDID,
      didVerificationSignature
    } = req.body;

    // Validate required fields
    if (!name || !email || !partyType || !walletAddress || !publicKey) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS',
        details: {
          required: ['name', 'email', 'partyType', 'walletAddress', 'publicKey'],
          provided: Object.keys(req.body)
        }
      });
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET_ADDRESS'
      });
    }

    // Validate party type
    const validPartyTypes = ['TDP', 'TDC', 'CCRP'];
    if (!validPartyTypes.includes(partyType)) {
      return res.status(400).json({
        error: 'Invalid party type',
        code: 'INVALID_PARTY_TYPE',
        details: {
          valid: validPartyTypes,
          provided: partyType
        }
      });
    }

    // Check if wallet address is already registered
    const existingWallet = await db.User.findOne({
      where: { walletAddress: walletAddress.toLowerCase() }
    });

    if (existingWallet) {
      return res.status(409).json({
        error: 'Wallet address is already registered',
        code: 'WALLET_ALREADY_EXISTS',
        details: {
          existingUser: {
            name: existingWallet.name,
            email: existingWallet.email,
            partyType: existingWallet.partyType,
            isRegistered: existingWallet.isRegistered
          },
          message: 'This wallet is already registered. Please login instead or use a different wallet address.'
        }
      });
    }

    // Check if email is already registered
    const existingEmail = await db.User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingEmail) {
      return res.status(409).json({
        error: 'Email address is already registered',
        code: 'EMAIL_ALREADY_EXISTS',
        details: {
          existingUser: {
            name: existingEmail.name,
            walletAddress: existingEmail.walletAddress,
            partyType: existingEmail.partyType,
            isRegistered: existingEmail.isRegistered
          },
          message: 'This email is already registered. Please login instead or use a different email address.'
        }
      });
    }

    // Handle existing DID if provided
    let did = null;
    let didSource = 'SYSTEM_GENERATED';
    let didVerified = false;
    let didVerificationMethod = null;

    if (existingDID) {
      // Validate DID format using the DID service
      if (!didService.validateDIDFormat(existingDID)) {
        return res.status(400).json({
          error: 'Invalid DID format',
          code: 'INVALID_DID_FORMAT',
          details: {
            supported: didService.supportedMethods,
            provided: existingDID
          }
        });
      }

      // Check if DID is already in use
      const isAvailable = await didService.isDIDAvailable(existingDID, db);
      if (!isAvailable) {
        return res.status(409).json({
          error: 'DID is already registered by another user',
          code: 'DID_ALREADY_EXISTS'
        });
      }

      // Verify DID ownership if signature provided
      if (didVerificationSignature) {
        try {
          // Create verification message
          const message = `I, the holder of DID ${existingDID}, hereby verify ownership with wallet address ${walletAddress} on ${new Date().toISOString()}`;
          
          // Verify DID ownership using the DID service
          const isVerified = await didService.verifyDIDOwnership(
            existingDID, 
            walletAddress, 
            didVerificationSignature, 
            message
          );
          
          if (isVerified) {
            didVerified = true;
            didVerificationMethod = 'SIGNATURE_VERIFICATION';
          } else {
            return res.status(400).json({
              error: 'DID ownership verification failed',
              code: 'DID_VERIFICATION_FAILED'
            });
          }
        } catch (error) {
          return res.status(400).json({
            error: 'DID verification error: ' + error.message,
            code: 'DID_VERIFICATION_ERROR'
          });
        }
      }

      did = existingDID;
      didSource = 'USER_PROVIDED';
    } else {
      // Generate system DID for the user
      try {
        did = didService.createSystemDID(walletAddress, 'goerli'); // Default to Goerli for development
        didVerified = true;
        didVerificationMethod = 'SYSTEM_GENERATED';
      } catch (error) {
        return res.status(400).json({
          error: 'Failed to generate system DID: ' + error.message,
          code: 'DID_GENERATION_FAILED'
        });
      }
    }

    // Create user in local database first
    const user = await db.User.create({
      walletAddress: walletAddress.toLowerCase(),
      publicKey,
      partyType,
      name,
      email: email.toLowerCase(),
      description: description || '',
      organization: organization || '',
      phoneNumber: phoneNumber || '',
      website: website || '',
      location: location || '',
      did,
      didSource,
      didVerified,
      didVerificationMethod,
      isRegistered: true,
      registrationDate: new Date(),
      isActive: true,
      onboardingStatus: 'PENDING',
      profileCompleted: false,
      emailVerified: false
    });

    try {
      // Create user in Keycloak IAM (optional for development)
      let keycloakResult = null;
      try {
        keycloakResult = await keycloakService.createUser({
          email,
          name,
          walletAddress,
          partyType,
          publicKey,
          organization,
          phoneNumber,
          website,
          location
        });

        // Update local user with Keycloak ID
        await user.update({
          iamUserId: keycloakResult.keycloakUserId,
          iamUsername: email,
          onboardingStatus: 'IN_PROGRESS'
        });

        // Send email verification
        await keycloakService.sendEmailVerification(keycloakResult.keycloakUserId);
      } catch (keycloakError) {
        console.warn('⚠️ Keycloak integration not available, continuing with local registration only:', keycloakError.message);
        
        // Update user to indicate no IAM integration
        await user.update({
          onboardingStatus: 'COMPLETED', // Skip IAM onboarding
          profileCompleted: true // Mark as completed since no IAM
        });
      }

      // Create welcome notification
      await db.Notification.create({
        userId: user.id,
        type: 'USER_REGISTERED',
        title: 'Welcome to Contract Management',
        message: `Welcome ${name}! Your account has been successfully registered as a ${partyType}.${keycloakResult ? ' Please complete your profile and verify your email.' : ''}`,
        isRead: false,
        metadata: {
          partyType,
          registrationDate: new Date().toISOString(),
          onboardingStatus: keycloakResult ? 'IN_PROGRESS' : 'COMPLETED',
          did: did,
          didSource: didSource,
          iamIntegrated: !!keycloakResult
        }
      });

      console.log(`✅ User registered successfully: ${user.id}${keycloakResult ? ` (Keycloak: ${keycloakResult.keycloakUserId})` : ' (Local only)'}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          partyType: user.partyType,
          walletAddress: user.walletAddress,
          publicKey: user.publicKey,
          did: user.did,
          didSource: user.didSource,
          didVerified: user.didVerified,
          didVerificationMethod: user.didVerificationMethod,
          isRegistered: user.isRegistered,
          onboardingStatus: user.onboardingStatus,
          profileCompleted: user.profileCompleted,
          emailVerified: user.emailVerified
        },
        nextSteps: keycloakResult ? [
          'Verify your email address',
          'Complete your profile',
          'Connect your wallet'
        ] : [
          'Your account is ready to use',
          'Connect your wallet',
          'Start creating contracts'
        ]
      });

    } catch (error) {
      // If any other error occurs, delete the local user
      await user.destroy();
      console.error('❌ Registration error:', error);
      
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and get access token
 */
router.post('/login', authRateLimit, logAuthEvent('LOGIN'), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user in local database
    const user = await db.User.findOne({
      where: { email, isActive: true }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login timestamp
    await user.update({ lastLoginAt: new Date() });

    // Return user info (actual token will be obtained from Keycloak frontend)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        partyType: user.partyType,
        walletAddress: user.walletAddress,
        isRegistered: user.isRegistered,
        onboardingStatus: user.onboardingStatus,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified
      },
      authUrl: `${keycloakService.baseURL}/realms/${keycloakService.realm}/protocol/openid-connect/auth?client_id=${keycloakService.config.frontendClient}&response_type=code&scope=openid&redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}`
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, logAuthEvent('GET_PROFILE'), async (req, res) => {
  try {
    const localUser = req.user.localUser;

    res.json({
      user: {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        partyType: localUser.partyType,
        walletAddress: localUser.walletAddress,
        publicKey: localUser.publicKey,
        description: localUser.description,
        organization: localUser.organization,
        phoneNumber: localUser.phoneNumber,
        website: localUser.website,
        location: localUser.location,
        isRegistered: localUser.isRegistered,
        onboardingStatus: localUser.onboardingStatus,
        profileCompleted: localUser.profileCompleted,
        emailVerified: localUser.emailVerified,
        registrationDate: localUser.registrationDate,
        lastLoginAt: localUser.lastLoginAt
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, logAuthEvent('UPDATE_PROFILE'), async (req, res) => {
  try {
    const localUser = req.user.localUser;
    const { 
      name, 
      description, 
      organization, 
      phoneNumber, 
      website, 
      location 
    } = req.body;

    // Update local user
    await localUser.update({
      name: name || localUser.name,
      description: description || localUser.description,
      organization: organization || localUser.organization,
      phoneNumber: phoneNumber || localUser.phoneNumber,
      website: website || localUser.website,
      location: location || localUser.location,
      profileCompleted: true
    });

    // Update user in Keycloak if IAM user exists
    if (localUser.iamUserId) {
      try {
        await keycloakService.updateUser(localUser.iamUserId, {
          name: localUser.name,
          attributes: {
            walletAddress: [localUser.walletAddress],
            partyType: [localUser.partyType],
            publicKey: [localUser.publicKey],
            organization: [localUser.organization || ''],
            phoneNumber: [localUser.phoneNumber || ''],
            website: [localUser.website || ''],
            location: [localUser.location || ''],
            profileCompleted: ['true']
          }
        });
      } catch (keycloakError) {
        console.error('❌ Failed to update Keycloak user:', keycloakError);
        // Continue with local update even if Keycloak fails
      }
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        partyType: localUser.partyType,
        walletAddress: localUser.walletAddress,
        description: localUser.description,
        organization: localUser.organization,
        phoneNumber: localUser.phoneNumber,
        website: localUser.website,
        location: localUser.location,
        profileCompleted: localUser.profileCompleted
      }
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Send email verification
 */
router.post('/verify-email', authenticateToken, logAuthEvent('SEND_EMAIL_VERIFICATION'), async (req, res) => {
  try {
    const localUser = req.user.localUser;

    if (!localUser.iamUserId) {
      return res.status(400).json({ 
        error: 'User not integrated with IAM system',
        code: 'IAM_NOT_INTEGRATED'
      });
    }

    // Send email verification
    await keycloakService.sendEmailVerification(localUser.iamUserId);

    res.json({
      message: 'Email verification sent successfully',
      email: localUser.email
    });

  } catch (error) {
    console.error('❌ Send email verification error:', error);
    res.status(500).json({ 
      error: 'Failed to send email verification',
      code: 'EMAIL_VERIFICATION_FAILED'
    });
  }
});

/**
 * GET /api/auth/onboarding-status
 * Get user onboarding status
 */
router.get('/onboarding-status', authenticateToken, logAuthEvent('GET_ONBOARDING_STATUS'), async (req, res) => {
  try {
    const localUser = req.user.localUser;

    let keycloakStatus = null;
    if (localUser.iamUserId) {
      try {
        const statusResult = await keycloakService.getOnboardingStatus(localUser.iamUserId);
        keycloakStatus = statusResult;
      } catch (keycloakError) {
        console.error('❌ Failed to get Keycloak onboarding status:', keycloakError);
      }
    }

    res.json({
      localStatus: {
        onboardingStatus: localUser.onboardingStatus,
        profileCompleted: localUser.profileCompleted,
        emailVerified: localUser.emailVerified
      },
      keycloakStatus: keycloakStatus,
      nextSteps: getNextSteps(localUser, keycloakStatus)
    });

  } catch (error) {
    console.error('❌ Get onboarding status error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/complete-onboarding
 * Mark onboarding as completed
 */
router.post('/complete-onboarding', authenticateToken, logAuthEvent('COMPLETE_ONBOARDING'), async (req, res) => {
  try {
    const localUser = req.user.localUser;

    // Check if profile is completed
    if (!localUser.profileCompleted) {
      return res.status(400).json({ 
        error: 'Profile must be completed before finishing onboarding',
        code: 'PROFILE_INCOMPLETE'
      });
    }

    // Update onboarding status
    await localUser.update({
      onboardingStatus: 'COMPLETED'
    });

    // Update Keycloak if IAM user exists
    if (localUser.iamUserId) {
      try {
        await keycloakService.updateUser(localUser.iamUserId, {
          attributes: {
            onboardingCompleted: ['true'],
            onboardingCompletedAt: [new Date().toISOString()]
          }
        });
      } catch (keycloakError) {
        console.error('❌ Failed to update Keycloak onboarding status:', keycloakError);
      }
    }

    // Create completion notification
    await db.Notification.create({
      userId: localUser.id,
      type: 'ONBOARDING_COMPLETED',
      title: 'Onboarding Completed',
      message: `Congratulations ${localUser.name}! Your onboarding is complete. You can now use all features of the platform.`,
      isRead: false,
      metadata: {
        completionDate: new Date().toISOString()
      }
    });

    res.json({
      message: 'Onboarding completed successfully',
      onboardingStatus: 'COMPLETED'
    });

  } catch (error) {
    console.error('❌ Complete onboarding error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticateToken, logAuthEvent('LOGOUT'), async (req, res) => {
  try {
    // In a real implementation, you might want to invalidate the token
    // For now, we just log the logout event
    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/verify-did
 * Verify user-provided DID ownership (supports both did:ethr and did:web)
 */
router.post('/verify-did', authenticateToken, logAuthEvent('VERIFY_DID'), async (req, res) => {
  try {
    const { did, signature, message } = req.body;
    const localUser = req.user.localUser;

    if (!did) {
      return res.status(400).json({
        error: 'DID is required',
        code: 'DID_REQUIRED'
      });
    }

    if (!signature) {
      return res.status(400).json({
        error: 'Signature is required for DID verification',
        code: 'SIGNATURE_REQUIRED'
      });
    }

    if (!message) {
      return res.status(400).json({
        error: 'Message is required for DID verification',
        code: 'MESSAGE_REQUIRED'
      });
    }

    // Validate DID format using the DID service
    if (!didService.validateDIDFormat(did)) {
      return res.status(400).json({
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        details: {
          supported: didService.supportedMethods,
          provided: did
        }
      });
    }

    // Check if DID is already in use by another user
    const isAvailable = await didService.isDIDAvailable(did, db);
    if (!isAvailable) {
      return res.status(409).json({
        error: 'DID is already registered by another user',
        code: 'DID_ALREADY_EXISTS'
      });
    }

    // Verify DID ownership using the DID service
    const isVerified = await didService.verifyDIDOwnership(
      did, 
      localUser.walletAddress, 
      signature, 
      message
    );
    
    if (isVerified) {
      // Update user with verified DID
      await localUser.update({
        did: did,
        didSource: 'USER_PROVIDED',
        didVerified: true,
        didVerificationMethod: 'SIGNATURE_VERIFICATION'
      });

      res.json({
        success: true,
        message: 'DID verified and linked successfully',
        did: did,
        didVerified: true,
        didSource: 'USER_PROVIDED'
      });
    } else {
      res.status(400).json({
        error: 'DID ownership verification failed',
        code: 'DID_VERIFICATION_FAILED'
      });
    }

  } catch (error) {
    console.error('❌ DID verification error:', error);
    res.status(500).json({
      error: 'DID verification failed',
      code: 'DID_VERIFICATION_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/did-info
 * Get user's DID information
 */
router.get('/did-info', authenticateToken, logAuthEvent('GET_DID_INFO'), async (req, res) => {
  try {
    const localUser = req.user.localUser;

    res.json({
      success: true,
      did: localUser.did,
      didSource: localUser.didSource,
      didVerified: localUser.didVerified,
      didVerificationMethod: localUser.didVerificationMethod,
      walletAddress: localUser.walletAddress,
      publicKey: localUser.publicKey
    });

  } catch (error) {
    console.error('❌ Get DID info error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/wallet
 * Login with wallet authentication
 */
router.post('/wallet', authRateLimit, logAuthEvent('WALLET_LOGIN'), async (req, res) => {
  try {
    const { walletAddress, signature, nonce } = req.body;

    if (!walletAddress || !signature || !nonce) {
      return res.status(400).json({
        error: 'Wallet address, signature, and nonce are required',
        code: 'MISSING_WALLET_CREDENTIALS'
      });
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET_ADDRESS'
      });
    }

    // Find user by wallet address
    const user = await db.User.findOne({
      where: { 
        walletAddress: walletAddress.toLowerCase(),
        isActive: true 
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please register first.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify signature
    try {
      const message = `Sign this message to authenticate with Contract Management System. Nonce: ${nonce}`;
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }
    } catch (signatureError) {
      return res.status(401).json({
        error: 'Signature verification failed',
        code: 'SIGNATURE_VERIFICATION_FAILED'
      });
    }

    // Update last login timestamp
    await user.update({ lastLoginAt: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        walletAddress: user.walletAddress,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        partyType: user.partyType,
        walletAddress: user.walletAddress,
        isRegistered: user.isRegistered,
        onboardingStatus: user.onboardingStatus,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified
      },
      token
    });

  } catch (error) {
    console.error('❌ Wallet login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/auth/nonce/:walletAddress
 * Get nonce for wallet authentication
 */
router.get('/nonce/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET_ADDRESS'
      });
    }

    // Generate a random nonce
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    res.json({
      nonce,
      walletAddress: walletAddress.toLowerCase()
    });

  } catch (error) {
    console.error('❌ Get nonce error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Helper function to determine next steps for onboarding
 */
function getNextSteps(localUser, keycloakStatus) {
  const steps = [];

  if (!localUser.emailVerified) {
    steps.push('Verify your email address');
  }

  if (!localUser.profileCompleted) {
    steps.push('Complete your profile information');
  }

  if (localUser.onboardingStatus === 'PENDING' || localUser.onboardingStatus === 'IN_PROGRESS') {
    steps.push('Complete the onboarding process');
  }

  if (localUser.onboardingStatus === 'COMPLETED' && !localUser.emailVerified) {
    steps.push('Verify your email to access all features');
  }

  return steps;
}

module.exports = router; 