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
const KeycloakService = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
const ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
const db = require('../models');
const tokenBlacklist = require('../tokenBlacklist');
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
const DIDService = require('../services/didService');
const didService = new DIDService();

/**
 * POST /api/auth/register
 * Register a new user with support for both did:ethr and did:web
 */
router.post('/register', logAuthEvent('REGISTER'), async (req, res) => {
  try {
    const {
      name,
      email,
      partyType,
      organization,
      description,
      phoneNumber,
      website,
      location,
      userType,
      walletAddress,
      publicKey,
      existingDID,
      didVerificationSignature,
      // Global DEPA ID options
      globalDEPAId,
      deploymentPrefix,
      jurisdiction
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
    if (!['TDP', 'TDC', 'CCRP', 'AppAdmin'].includes(partyType)) {
      return res.status(400).json({
        error: 'Invalid party type',
        code: 'INVALID_PARTY_TYPE',
        details: {
          valid: ['TDP', 'TDC', 'CCRP', 'AppAdmin'],
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

    // Check Keycloak configuration
    const isKeycloakEnabled = process.env.KEYCLOAK_ENABLED === 'true';
    
    // Handle existing DID if provided
    let did = null;
    let didSource = 'SYSTEM_GENERATED';
    let didVerified = false;
    let didVerificationMethod = null;
    let resolvedPublicKey = null;

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

      // Check if DID is available
      const didAvailability = await didService.isDIDAvailable(existingDID);
      if (!didAvailability.available) {
        return res.status(409).json({
          error: 'DID validation failed',
          code: 'DID_VALIDATION_FAILED',
          message: didAvailability.message
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
      
      // Resolve DID to fetch public key from host
      try {
        console.log(`🔍 Resolving DID to fetch public key: ${existingDID}`);
        const didResolution = await didService.resolveDID(existingDID);
        resolvedPublicKey = didService.extractPublicKey(didResolution.didDocument);
        
        if (resolvedPublicKey) {
          console.log(`✅ Public key extracted from DID: ${existingDID}`);
        } else {
          console.log(`⚠️ No public key found in DID document: ${existingDID}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to resolve DID for public key: ${error.message}`);
        // Continue with registration even if DID resolution fails
      }
      
      // Auto-verify user-provided DIDs if they're in valid format
      if (!didVerificationSignature) {
        didVerified = true;
        didVerificationMethod = 'AUTO_VERIFIED';
      }
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

    // --- TRANSACTION-BASED USER CREATION ---
    let ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = null;
    let ***REMOVED-KEYCLOAK_DB_PASSWORD***Success = false;
    let temporaryPassword = null;
    let dbUser = null;
    let dbSuccess = false;

    // Start database transaction
    const transaction = await db.sequelize.transaction();

    try {
      // Step 1: Try to create user in Keycloak first
      if (process.env.KEYCLOAK_ENABLED === 'true') {
        try {
          console.log('🔐 Creating user in Keycloak...');
          ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser({
            username: email,
            email: email,
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            enabled: true,
            emailVerified: false,
            credentials: [{
              type: 'password',
              value: temporaryPassword,
              temporary: true
            }],
            attributes: {
              partyType: [partyType],
              organization: [organization || ''],
              userType: [userType || 'individual']
            }
          });
          ***REMOVED-KEYCLOAK_DB_PASSWORD***Success = true;
          console.log('✅ Keycloak user created successfully');
        } catch (kcError) {
          console.error('❌ Keycloak user creation failed:', kcError);
          ***REMOVED-KEYCLOAK_DB_PASSWORD***Success = false;
          // Continue with database creation even if Keycloak fails
        }
      }

      // Step 2: Create user in database (only if Keycloak succeeded)
      try {
        // Generate DEPA ID for the user
        let depaId;
        
        if (globalDEPAId) {
          // Use global DEPA ID service for multi-deployment support
          const GlobalDEPAIdService = require('../services/globalDEPAIdService');
          const globalDEPAIdService = new GlobalDEPAIdService();
          
          if (jurisdiction) {
            // Generate jurisdiction-compliant DEPA ID
            depaId = globalDEPAIdService.generateJurisdictionCompliantDEPAId(
              globalDEPAIdService.getEntityType(partyType), 
              jurisdiction
            );
          } else {
            // Generate standard global DEPA ID
            depaId = globalDEPAIdService.generateGlobalUserDEPAId(partyType, deploymentPrefix);
          }
          
          console.log(`✅ Generated Global DEPA ID: ${depaId}`);
        } else {
          // Use standard DEPA ID service for backward compatibility
          const DEPAIdService = require('../services/depaIdService');
          const depaIdService = new DEPAIdService();
          depaId = depaIdService.generateUserDEPAId(partyType);
          
          console.log(`✅ Generated Standard DEPA ID: ${depaId}`);
        }
        
        dbUser = await db.User.create({
          walletAddress: isEnterprise ? null : walletAddress?.toLowerCase(),
          publicKey: resolvedPublicKey || publicKey || null, // Use resolved public key from DID, fallback to provided
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
          depaId, // Add DEPA ID
          isRegistered: true,
          registrationDate: new Date(),
          isActive: true,
          onboardingStatus: 'IN_PROGRESS',
          profileCompleted: false,
          emailVerified: false,
          iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***Result?.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId,
          iamUsername: email
        }, { transaction });
        dbSuccess = true;
        console.log('✅ Database user created successfully');
      } catch (dbError) {
        console.error('❌ Database user creation failed:', dbError);
        dbSuccess = false;
        throw dbError;
      }

      // Step 3: Create notification (within transaction)
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
          iamIntegrated: ***REMOVED-KEYCLOAK_DB_PASSWORD***Success
        }
      }, { transaction });

      // Step 4: Commit transaction if everything succeeded
      await transaction.commit();
      console.log(`✅ User registered successfully: ${dbUser.id} (Keycloak: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Result?.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId})`);

    } catch (transactionError) {
      // Rollback transaction on any unexpected error
      await transaction.rollback();
      console.error('❌ Transaction failed:', transactionError.message);
      return res.status(500).json({
        success: false,
        error: 'Registration transaction failed',
        code: 'TRANSACTION_FAILED',
        details: {
          db: false,
          ***REMOVED-KEYCLOAK_DB_PASSWORD***: false,
          blockchain: false,
          note: 'An unexpected error occurred during registration. Please try again.'
        },
        message: transactionError.message
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

    // --- TRIGGER EMAIL VERIFICATION (after successful transaction) ---
    try {
      await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.sendEmailVerification(***REMOVED-KEYCLOAK_DB_PASSWORD***Result?.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId);
    } catch (emailError) {
      console.warn('⚠️ Failed to trigger Keycloak email verification:', emailError.message);
    }

    // --- FINAL RESPONSE ---
    return res.json({
      success: true,
      details: {
        db: dbSuccess,
        ***REMOVED-KEYCLOAK_DB_PASSWORD***: ***REMOVED-KEYCLOAK_DB_PASSWORD***Success,
        blockchain: blockchainSuccess,
        note: isKeycloakEnabled ? blockchainNote : 'Registration successful without IAM integration. You can enable Keycloak later for enhanced authentication features.'
      },
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        partyType: dbUser.partyType,
        walletAddress: dbUser.walletAddress,
        publicKey: dbUser.publicKey,
        did: dbUser.did,
        didVerified: dbUser.didVerified,
        didSource: dbUser.didSource,
        depaId: dbUser.depaId, // Include DEPA ID in response
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
router.post('/login', logAuthEvent('LOGIN'), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Blacklist any existing tokens for this user to prevent stale token usage
    const existingUser = await db.User.findOne({ 
      where: { 
        email: email.toLowerCase(), 
        isActive: true 
      } 
    });

    if (existingUser) {
      console.log('🚫 Blacklisting any existing tokens for user:', existingUser.email);
      // In a real implementation, you'd blacklist specific tokens
      // For now, we'll rely on the new token generation to invalidate old ones
    }

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Keycloak authentication only
    if (process.env.KEYCLOAK_ENABLED !== 'true') {
      return res.status(500).json({
        error: 'Keycloak authentication is required but not enabled',
        code: 'KEYCLOAK_NOT_ENABLED'
      });
    }

    try {
      console.log('🔐 Attempting Keycloak authentication for:', email);
      
      const tokenResponse = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUserWithPassword(email, password);
      
      // Update last login timestamp in local DB
      const user = await db.User.findOne({ where: { email: email.toLowerCase(), isActive: true } });
      if (user) {
        await user.update({ lastLoginAt: new Date() });
      }
      
      console.log('✅ Keycloak authentication successful for:', email);
      
      return res.json({
        message: 'Login successful',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        user: {
          email: email,
          name: user?.name || 'User',
          partyType: user?.partyType || 'User',
          depaId: user?.depaId || null
        }
      });
      
    } catch (kcError) {
      console.error('❌ Keycloak authentication failed:', kcError);
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTHENTICATION_FAILED',
        details: 'Invalid credentials or user not found in Keycloak'
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
 * POST /api/auth/logout
 * Logout user and blacklist current token
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Blacklist the current token
      tokenBlacklist.blacklistToken(token);
      console.log('🚫 Token blacklisted during logout');
    }

    res.json({
      message: 'Logout successful',
      code: 'LOGOUT_SUCCESS'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Try Keycloak token refresh first
    if (process.env.KEYCLOAK_ENABLED === 'true') {
      try {
        const tokenResponse = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.refreshToken(refreshToken);
        
        return res.json({
          message: 'Token refreshed successfully',
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresIn: tokenResponse.expires_in,
          user: {
            email: req.user?.email || 'User',
            name: req.user?.name || 'User',
            partyType: req.user?.partyType || 'User'
          }
        });
      } catch (kcError) {
        console.error('❌ Keycloak token refresh failed:', kcError);
        return res.status(401).json({
          error: 'Token refresh failed',
          code: 'REFRESH_FAILED',
          details: 'Refresh token is invalid or expired'
        });
      }
    }

    // If Keycloak is disabled, return error
    return res.status(400).json({
      error: 'Token refresh not supported',
      code: 'REFRESH_NOT_SUPPORTED',
      details: 'Keycloak is not enabled'
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/update-password
 * Update user password
 */
router.post('/update-password', authenticateToken, logAuthEvent('UPDATE_PASSWORD'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const localUser = req.user.localUser;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'New password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Keycloak password update only
    if (process.env.KEYCLOAK_ENABLED !== 'true') {
      return res.status(500).json({
        error: 'Keycloak authentication is required but not enabled',
        code: 'KEYCLOAK_NOT_ENABLED'
      });
    }

    if (!localUser.iamUserId) {
      return res.status(400).json({
        error: 'User not configured for Keycloak authentication',
        code: 'USER_NOT_IN_KEYCLOAK'
      });
    }

    try {
      // Verify current password with Keycloak
      await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUserWithPassword(localUser.email, currentPassword);
      
      // Update password in Keycloak
      await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.updateUserPassword(localUser.iamUserId, newPassword);
      
      console.log('✅ Password updated in Keycloak successfully');
      
      return res.json({
        message: 'Password updated successfully',
        success: true,
        note: 'Password updated in Keycloak. You may need to log in again with your new password for security.'
      });
    } catch (kcError) {
      console.error('❌ Keycloak password update failed:', kcError);
      return res.status(401).json({
        error: 'Current password is incorrect or Keycloak update failed',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

  } catch (error) {
    console.error('❌ Password update error:', error);
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
        depaId: localUser.depaId
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

    // Send email verification (with fallback support)
    const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.sendEmailVerification(localUser.iamUserId);

    res.json({
      message: result.message || 'Email verification sent successfully',
      email: localUser.email,
      method: result.method || '***REMOVED-KEYCLOAK_DB_PASSWORD***'
    });

  } catch (error) {
    console.error('❌ Send email verification error:', error);
    res.status(500).json({ 
      error: 'Failed to send email verification',
      code: 'EMAIL_VERIFICATION_FAILED',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/verify-email/:token
 * Verify email with token
 */
router.get('/verify-email/:token', logAuthEvent('VERIFY_EMAIL_TOKEN'), async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Find user with this verification token
    const user = await db.User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          [db.Sequelize.Op.gt]: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    // Mark email as verified
    await user.update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

    // Create notification
    await db.Notification.create({
      userId: user.id,
      type: 'EMAIL_VERIFIED',
      title: 'Email Verified',
      message: `Your email address ${user.email} has been successfully verified.`,
      isRead: false,
      metadata: {
        verificationDate: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      email: user.email
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      code: 'VERIFICATION_FAILED',
      details: error.message
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
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', logAuthEvent('FORGOT_PASSWORD'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Find user by email
    const user = await db.User.findOne({
      where: { email: email.toLowerCase(), isActive: true }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
        email: email.toLowerCase()
      });
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpiry
    });

    // Try to send reset email via Keycloak first
    let emailSent = false;
    if (user.iamUserId) {
      try {
        await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.sendPasswordResetEmail(user.iamUserId);
        emailSent = true;
        console.log('✅ Password reset email sent via Keycloak');
      } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
        console.warn('⚠️ Failed to send password reset via Keycloak:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error.message);
      }
    }

    // Fallback: Send email via local email service
    if (!emailSent) {
      try {
        const EmailService = require('../services/emailService');
        const emailService = new EmailService();
        
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        await emailService.sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl: resetUrl,
          expiryTime: '1 hour'
        });
        
        emailSent = true;
        console.log('✅ Password reset email sent via local service');
      } catch (emailError) {
        console.error('❌ Failed to send password reset email:', emailError.message);
      }
    }

    // Create notification
    await db.Notification.create({
      userId: user.id,
      type: 'PASSWORD_RESET_REQUESTED',
      title: 'Password Reset Requested',
      message: `A password reset was requested for your account. If you didn't request this, please ignore this notification.`,
      isRead: false,
      metadata: {
        requestTime: new Date().toISOString(),
        emailSent: emailSent,
        resetTokenExpiry: resetTokenExpiry.toISOString()
      }
    });

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
      email: email.toLowerCase(),
      note: emailSent ? 'Reset email sent successfully' : 'Reset token generated but email delivery failed'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      error: 'Failed to process password reset request',
      code: 'PASSWORD_RESET_FAILED',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', logAuthEvent('RESET_PASSWORD'), async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token and new password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Find user with valid reset token
    const user = await db.User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [db.Sequelize.Op.gt]: new Date() // Token not expired
        },
        isActive: true
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Update password in Keycloak if IAM user exists
    let ***REMOVED-KEYCLOAK_DB_PASSWORD***Updated = false;
    if (user.iamUserId) {
      try {
        await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.updateUserPassword(user.iamUserId, newPassword);
        ***REMOVED-KEYCLOAK_DB_PASSWORD***Updated = true;
        console.log('✅ Password updated in Keycloak');
      } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
        console.error('❌ Failed to update password in Keycloak:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error.message);
        // Continue with local update even if Keycloak fails
      }
    }

    // Clear reset token and update user
    await user.update({
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: new Date()
    });

    // Create notification
    await db.Notification.create({
      userId: user.id,
      type: 'PASSWORD_RESET_COMPLETED',
      title: 'Password Reset Completed',
      message: `Your password has been successfully reset. If you didn't perform this action, please contact support immediately.`,
      isRead: false,
      metadata: {
        resetTime: new Date().toISOString(),
        ***REMOVED-KEYCLOAK_DB_PASSWORD***Updated: ***REMOVED-KEYCLOAK_DB_PASSWORD***Updated
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      note: ***REMOVED-KEYCLOAK_DB_PASSWORD***Updated ? 'Password updated in both local system and IAM' : 'Password updated in local system only'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      error: 'Failed to reset password',
      code: 'PASSWORD_RESET_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/verify-reset-token
 * Verify if reset token is valid
 */
router.get('/verify-reset-token/:token', logAuthEvent('VERIFY_RESET_TOKEN'), async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Reset token is required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Find user with valid reset token
    const user = await db.User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [db.Sequelize.Op.gt]: new Date() // Token not expired
        },
        isActive: true
      },
      attributes: ['id', 'email', 'name', 'passwordResetExpires']
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Calculate time remaining
    const timeRemaining = Math.max(0, user.passwordResetExpires.getTime() - Date.now());
    const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));

    res.json({
      success: true,
      valid: true,
      email: user.email,
      name: user.name,
      expiresAt: user.passwordResetExpires,
      minutesRemaining: minutesRemaining
    });

  } catch (error) {
    console.error('❌ Verify reset token error:', error);
    res.status(500).json({
      error: 'Failed to verify reset token',
      code: 'TOKEN_VERIFICATION_ERROR',
      details: error.message
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
 * DEVELOPMENT ONLY: Get reset token for testing
 * This endpoint should be removed in production
 */
router.get('/dev/reset-token/:email', async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }

    const { email } = req.params;

    // Find user with valid reset token
    const user = await db.User.findOne({
      where: {
        email: email.toLowerCase(),
        passwordResetToken: {
          [db.Sequelize.Op.ne]: null
        },
        passwordResetExpires: {
          [db.Sequelize.Op.gt]: new Date() // Token not expired
        },
        isActive: true
      },
      attributes: ['id', 'email', 'passwordResetToken', 'passwordResetExpires'],
      order: [['updatedAt', 'DESC']]
    });

    if (!user || !user.passwordResetToken) {
      return res.status(404).json({
        error: 'No valid reset token found for this email',
        note: 'Request a password reset first using /api/auth/forgot-password'
      });
    }

    // Calculate time remaining
    const timeRemaining = Math.max(0, user.passwordResetExpires.getTime() - Date.now());
    const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));

    res.json({
      success: true,
      token: user.passwordResetToken,
      email: user.email,
      expiresAt: user.passwordResetExpires,
      minutesRemaining: minutesRemaining,
      note: 'This endpoint is for development testing only'
    });

  } catch (error) {
    console.error('❌ Get dev reset token error:', error);
    res.status(500).json({
      error: 'Failed to get reset token',
      code: 'DEV_TOKEN_ERROR',
      details: error.message
    });
  }
});

module.exports = router; 