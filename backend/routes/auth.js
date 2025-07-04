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
    if (!name || !email || !partyType) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS',
        details: {
          required: ['name', 'email', 'partyType'],
          provided: Object.keys(req.body)
        }
      });
    }

    // Validate party type
    if (!['TDP', 'TDC', 'CCRP'].includes(partyType)) {
      return res.status(400).json({
        error: 'Invalid party type',
        code: 'INVALID_PARTY_TYPE',
        details: {
          valid: ['TDP', 'TDC', 'CCRP'],
          provided: partyType
        }
      });
    }
    
    // All party types (TDP, TDC, CCRP) are enterprise users and don't require wallet fields
    const isEnterprise = true; // All supported party types are enterprise users
    
        // For now, we don't require wallet fields for any party type
    // If you need wallet fields for specific party types, add logic here
    
    // Only validate wallet address if it's provided (for future individual users)
    if (walletAddress && !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET_ADDRESS'
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
        if (isEnterprise) {
          // For enterprise users, generate a web-based DID using their domain or email
          const domain = email.split('@')[1] || 'example.com';
          did = `did:web:${domain}:user:${email.split('@')[0]}`;
          didVerified = true;
          didVerificationMethod = 'SYSTEM_GENERATED';
        } else {
          // For individual users, generate DID using wallet address
          did = didService.createSystemDID(walletAddress, 'goerli'); // Default to Goerli for development
          didVerified = true;
          didVerificationMethod = 'SYSTEM_GENERATED';
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Failed to generate system DID: ' + error.message,
          code: 'DID_GENERATION_FAILED'
        });
      }
    }

    // --- KEYCLOAK USER CREATION FIRST ---
    let ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = null;
    let ***REMOVED-KEYCLOAK_DB_PASSWORD***Success = false;
    let temporaryPassword = null;
    try {
      ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser({
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
      ***REMOVED-KEYCLOAK_DB_PASSWORD***Success = true;
      temporaryPassword = ***REMOVED-KEYCLOAK_DB_PASSWORD***Result.temporaryPassword;
    } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
      console.error('❌ Failed to create user in Keycloak:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error.message);
      // Instead of returning, proceed to DB creation
      ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = { ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId: null };
      ***REMOVED-KEYCLOAK_DB_PASSWORD***Success = false;
    }

    // --- LOCAL USER CREATION ---
    let dbUser = null;
    let dbSuccess = false;
    try {
      dbUser = await db.User.create({
        walletAddress: isEnterprise ? null : walletAddress?.toLowerCase(),
        publicKey: isEnterprise ? null : publicKey,
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
        onboardingStatus: 'IN_PROGRESS',
        profileCompleted: false,
        emailVerified: false,
        iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId,
        iamUsername: email
      });
      dbSuccess = true;
    } catch (dbError) {
      console.error('❌ Failed to create user in DB:', dbError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user in database',
        code: 'DB_CREATE_FAILED',
        details: {
          db: false,
          ***REMOVED-KEYCLOAK_DB_PASSWORD***: ***REMOVED-KEYCLOAK_DB_PASSWORD***Success,
          blockchain: false,
          note: ***REMOVED-KEYCLOAK_DB_PASSWORD***Success ? 'User created in Keycloak but not in DB.' : 'User not created in DB or Keycloak.'
        },
        message: dbError.message
      });
    }

    // --- BLOCKCHAIN REGISTRATION (optional) ---
    let blockchainSuccess = false;
    let blockchainNote = 'Blockchain registration is optional and not required for account creation. You can connect to blockchain later when you need to sign contracts or perform blockchain operations.';
    
    // Check if blockchain service is available and enabled
    try {
      const BlockchainService = require('../services/blockchainService');
      const blockchainInstance = new BlockchainService();
      const isBlockchainAvailable = await blockchainInstance.isConnected();
      
      if (isBlockchainAvailable) {
        blockchainNote = 'Blockchain is available but registration on-chain is optional. You can register on blockchain later when needed.';
      } else {
        blockchainNote = 'Blockchain is not currently available, but this won\'t prevent registration. You can connect to blockchain later when you need to sign contracts.';
      }
    } catch (bcError) {
      blockchainNote = 'Blockchain service is not configured. Registration works without blockchain - you can connect later when needed.';
    }

    // --- TRIGGER EMAIL VERIFICATION ---
    try {
      await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.sendEmailVerification(***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId);
    } catch (emailError) {
      console.warn('⚠️ Failed to trigger Keycloak email verification:', emailError.message);
    }

    // --- NOTIFICATION ---
    await db.Notification.create({
      userId: dbUser.id,
      type: 'USER_REGISTERED',
      title: 'Welcome to Contract Management',
      message: `Welcome ${name}! Your account has been successfully registered as a ${partyType}. Please complete your profile and verify your email.`,
      isRead: false,
      metadata: {
        partyType,
        registrationDate: new Date().toISOString(),
        onboardingStatus: 'IN_PROGRESS',
        did: did,
        didSource: didSource,
        iamIntegrated: true
      }
    });

    console.log(`✅ User registered successfully: ${dbUser.id} (Keycloak: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId})`);

    // --- FINAL RESPONSE ---
    return res.json({
      success: true,
      details: {
        db: dbSuccess,
        ***REMOVED-KEYCLOAK_DB_PASSWORD***: ***REMOVED-KEYCLOAK_DB_PASSWORD***Success,
        blockchain: blockchainSuccess,
        note: blockchainNote
      },
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        partyType: dbUser.partyType,
        walletAddress: dbUser.walletAddress,
        isRegistered: dbUser.isRegistered,
        onboardingStatus: dbUser.onboardingStatus,
        profileCompleted: dbUser.profileCompleted,
        emailVerified: dbUser.emailVerified
      },
      loginCredentials: temporaryPassword ? {
        email: dbUser.email,
        password: temporaryPassword,
        note: 'Use these credentials to log in. This is a temporary password that should be changed on first login.'
      } : null,
      nextSteps: [
        'Use the provided credentials to log in',
        'Change your password on first login',
        'Complete your profile',
        'Connect your wallet (optional - can be done later)'
      ]
    });

  } catch (error) {
    const errorId = `REG-${Date.now()}`;
    console.error(`[${errorId}] ❌ Registration error:`, {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({
      error: 'Registration failed. Please contact support with the error ID below.',
      code: 'INTERNAL_ERROR',
      errorId,
      details: error.message
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

    // Authenticate with Keycloak using Resource Owner Password Credentials grant
    try {
      const tokenResponse = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUserWithPassword(email, password);
      // Optionally, fetch user info from Keycloak
      const userInfo = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getUserInfo(tokenResponse.access_token);
      // Optionally, update last login timestamp in local DB
      const user = await db.User.findOne({ where: { email: email.toLowerCase(), isActive: true } });
      if (user) {
        await user.update({ lastLoginAt: new Date() });
      }
      return res.json({
        message: 'Login successful',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        user: userInfo
      });
    } catch (kcError) {
      console.log('⚠️ Keycloak authentication failed, falling back to local authentication for testing');
      
      // Fallback: Check local database for user (for testing when Keycloak is not available)
      const user = await db.User.findOne({ where: { email: email.toLowerCase(), isActive: true } });
      
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          details: 'User not found in local database'
        });
      }
      
      // For testing: Accept any password when Keycloak is not available
      // In production, this should be removed and only Keycloak authentication should be used
      
      // Update last login timestamp
      await user.update({ lastLoginAt: new Date() });
      
      // Generate a mock token for testing
      const mockToken = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          walletAddress: user.walletAddress,
          partyType: user.partyType,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      return res.json({
        message: 'Login successful (local fallback)',
        accessToken: mockToken,
        refreshToken: null,
        expiresIn: 24 * 60 * 60,
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
        }
      });
    }
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

module.exports = router; 