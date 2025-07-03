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
const ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
const db = require('../models');
const { 
  authenticateToken, 
  optionalAuth, 
  authRateLimit, 
  logAuthEvent 
} = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user with IAM integration
 */
router.post('/register', authRateLimit, logAuthEvent('REGISTER'), async (req, res) => {
  try {
    const { 
      walletAddress, 
      publicKey, 
      partyType, 
      name, 
      email, 
      description,
      organization,
      phoneNumber,
      website,
      location,
      password,
      existingDID,
      didVerificationSignature
    } = req.body;

    // Validate required fields
    if (!walletAddress || !publicKey || !partyType || !name || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, publicKey, partyType, name, email',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate wallet address format
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!walletRegex.test(walletAddress)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET_ADDRESS'
      });
    }

    // Validate public key format
    const publicKeyRegex = /^0x[a-fA-F0-9]{128}$/;
    if (!publicKeyRegex.test(publicKey)) {
      return res.status(400).json({ 
        error: 'Invalid public key format. Must be a 64-byte hex string starting with 0x',
        code: 'INVALID_PUBLIC_KEY'
      });
    }

    // Validate party type
    const validPartyTypes = ['TDP', 'TDC', 'CCRP'];
    if (!validPartyTypes.includes(partyType)) {
      return res.status(400).json({ 
        error: 'Invalid party type. Must be one of: TDP, TDC, CCRP',
        code: 'INVALID_PARTY_TYPE'
      });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({
      where: { walletAddress }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this wallet address already exists',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Check if email is already taken
    const existingEmail = await db.User.findOne({
      where: { email }
    });

    if (existingEmail) {
      return res.status(409).json({ 
        error: 'Email address is already registered',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Handle existing DID if provided
    let did = null;
    let didSource = 'SYSTEM_GENERATED';
    let didVerified = false;
    let didVerificationMethod = null;

    if (existingDID) {
      // Validate DID format
      const didRegex = /^did:[a-z]+:[a-zA-Z0-9._-]+$/;
      if (!didRegex.test(existingDID)) {
        return res.status(400).json({ 
          error: 'Invalid DID format',
          code: 'INVALID_DID_FORMAT'
        });
      }

      // Check if DID is already in use
      const existingDIDUser = await db.User.findOne({
        where: { did: existingDID }
      });

      if (existingDIDUser) {
        return res.status(409).json({ 
          error: 'DID is already registered by another user',
          code: 'DID_ALREADY_EXISTS'
        });
      }

      // Verify DID ownership if signature provided
      if (didVerificationSignature) {
        try {
          const isVerified = await verifyDIDOwnership(existingDID, walletAddress, didVerificationSignature);
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
    }

    // Create user in local database first
    const user = await db.User.create({
      walletAddress,
      publicKey,
      partyType,
      name,
      email,
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
      // Create user in Keycloak IAM
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser({
        email,
        name,
        walletAddress,
        partyType,
        publicKey,
        organization,
        phoneNumber,
        website,
        location,
        password
      });

      // Update local user with Keycloak ID
      await user.update({
        iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId,
        iamUsername: email,
        onboardingStatus: 'IN_PROGRESS'
      });

      // Send email verification
      await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.sendEmailVerification(***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId);

      // Create welcome notification
      await db.Notification.create({
        userId: user.id,
        type: 'USER_REGISTERED',
        title: 'Welcome to Contract Management',
        message: `Welcome ${name}! Your account has been successfully registered as a ${partyType}. Please complete your profile and verify your email.`,
        isRead: false,
        metadata: {
          partyType,
          registrationDate: new Date().toISOString(),
          onboardingStatus: 'IN_PROGRESS'
        }
      });

      console.log(`✅ User registered successfully: ${user.id} (Keycloak: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId})`);

      res.status(201).json({
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
          isRegistered: user.isRegistered,
          onboardingStatus: user.onboardingStatus,
          profileCompleted: user.profileCompleted,
          emailVerified: user.emailVerified
        },
        nextSteps: [
          'Verify your email address',
          'Complete your profile',
          'Connect your wallet'
        ]
      });

    } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
      // If Keycloak creation fails, delete the local user
      await user.destroy();
      console.error('❌ Keycloak user creation failed:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error);
      
      return res.status(500).json({ 
        error: 'Failed to create user in IAM system',
        code: 'IAM_CREATION_FAILED',
        details: ***REMOVED-KEYCLOAK_DB_PASSWORD***Error.message
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
      authUrl: `${***REMOVED-KEYCLOAK_DB_PASSWORD***Service.baseURL}/realms/${***REMOVED-KEYCLOAK_DB_PASSWORD***Service.realm}/protocol/openid-connect/auth?client_id=${***REMOVED-KEYCLOAK_DB_PASSWORD***Service.config.frontendClient}&response_type=code&scope=openid&redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}`
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
        await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.updateUser(localUser.iamUserId, {
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
      } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
        console.error('❌ Failed to update Keycloak user:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error);
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
    await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.sendEmailVerification(localUser.iamUserId);

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

    let ***REMOVED-KEYCLOAK_DB_PASSWORD***Status = null;
    if (localUser.iamUserId) {
      try {
        const statusResult = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getOnboardingStatus(localUser.iamUserId);
        ***REMOVED-KEYCLOAK_DB_PASSWORD***Status = statusResult;
      } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
        console.error('❌ Failed to get Keycloak onboarding status:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error);
      }
    }

    res.json({
      localStatus: {
        onboardingStatus: localUser.onboardingStatus,
        profileCompleted: localUser.profileCompleted,
        emailVerified: localUser.emailVerified
      },
      ***REMOVED-KEYCLOAK_DB_PASSWORD***Status: ***REMOVED-KEYCLOAK_DB_PASSWORD***Status,
      nextSteps: getNextSteps(localUser, ***REMOVED-KEYCLOAK_DB_PASSWORD***Status)
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
        await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.updateUser(localUser.iamUserId, {
          attributes: {
            onboardingCompleted: ['true'],
            onboardingCompletedAt: [new Date().toISOString()]
          }
        });
      } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
        console.error('❌ Failed to update Keycloak onboarding status:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error);
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
 * Verify user-provided DID ownership
 */
router.post('/verify-did', authenticateToken, logAuthEvent('VERIFY_DID'), async (req, res) => {
  try {
    const { did, signature } = req.body;
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

    // Validate DID format
    const didRegex = /^did:[a-z]+:[a-zA-Z0-9._-]+$/;
    if (!didRegex.test(did)) {
      return res.status(400).json({ 
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT'
      });
    }

    // Check if DID is already in use by another user
    const existingDIDUser = await db.User.findOne({
      where: { 
        did: did,
        id: { [db.Sequelize.Op.ne]: localUser.id }
      }
    });

    if (existingDIDUser) {
      return res.status(409).json({ 
        error: 'DID is already registered by another user',
        code: 'DID_ALREADY_EXISTS'
      });
    }

    // Verify DID ownership
    const isVerified = await verifyDIDOwnership(did, localUser.walletAddress, signature);
    
    if (isVerified) {
      // Update user with verified DID
      await localUser.update({
        did: did,
        didSource: 'USER_PROVIDED',
        didVerified: true,
        didVerificationMethod: 'SIGNATURE_VERIFICATION'
      });

      res.json({
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
 * Helper function to determine next steps for onboarding
 */
function getNextSteps(localUser, ***REMOVED-KEYCLOAK_DB_PASSWORD***Status) {
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

/**
 * Verify DID ownership using signature
 * @param {string} did - The DID to verify
 * @param {string} walletAddress - The wallet address claiming ownership
 * @param {string} signature - The signature proving ownership
 * @returns {Promise<boolean>} - Whether the DID ownership is verified
 */
async function verifyDIDOwnership(did, walletAddress, signature) {
  try {
    // Create verification message
    const message = `I, the holder of DID ${did}, hereby verify ownership with wallet address ${walletAddress} on ${new Date().toISOString()}`;
    
    // Hash the message
    const messageHash = require('crypto').createHash('sha256').update(message).digest('hex');
    
    // For now, we'll do a basic verification
    // In production, you would use a proper DID resolver and verification library
    console.log(`🔍 Verifying DID ownership: ${did} for wallet: ${walletAddress}`);
    console.log(`📝 Message: ${message}`);
    console.log(`🔐 Signature: ${signature}`);
    
    // TODO: Implement proper DID verification using a DID resolver
    // This is a placeholder implementation
    // In production, you would:
    // 1. Resolve the DID to get the DID document
    // 2. Extract verification methods
    // 3. Verify the signature against the public key in the DID document
    
    // For now, we'll assume the signature is valid if it's provided
    // This should be replaced with proper verification logic
    return signature && signature.length > 0;
    
  } catch (error) {
    console.error('❌ DID verification error:', error);
    throw new Error('DID verification failed: ' + error.message);
  }
}

module.exports = router; 