/**
 * Users Routes
 * 
 * This module handles user management endpoints for AppAdmin users.
 * AppAdmin can view and update user profiles, manage user status, etc.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, logAuthEvent } = require('../middleware/auth');
const { normalizeTspCloudProviders } = require('../utils/tspCloudProviders');
const { isTspPartyType } = require('../utils/partyTypes');
const { Op } = require('sequelize');
const db = require('../models');

/**
 * GET /api/users
 * Get all users (AppAdmin only)
 */
router.get('/', authenticateToken, logAuthEvent('GET_ALL_USERS'), async (req, res) => {
  try {
    const localUser = req.user.localUser;

    // Check if user is AppAdmin
    if (localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. AppAdmin privileges required.',
        code: 'ACCESS_DENIED'
      });
    }

    const users = await db.User.findAll({
      where: { isActive: true },
      attributes: [
        'id', 'name', 'email', 'partyType', 'walletAddress', 'publicKey',
        'description', 'isRegistered', 'registrationDate', 'createdAt',
        'did', 'didSource', 'didVerified', 'didVerificationMethod',
        'onboardingStatus', 'profileCompleted', 'emailVerified', 'isActive',
        'depaId', 'cloudProviders'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });

  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

async function listActiveTspUsers(_req, res) {
  try {
    const tspUsers = await db.User.findAll({
      where: {
        partyType: { [Op.in]: ['TSP', 'CCRP'] },
        isActive: true,
      },
      attributes: [
        'id', 'name', 'email', 'partyType', 'organization', 'description',
        'website', 'location', 'did', 'walletAddress', 'isActive', 'cloudProviders',
      ],
      order: [['name', 'ASC']],
    });
    res.json(tspUsers);
  } catch (error) {
    console.error('❌ Get TSP users error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/users/tsp
 * Get all TSP users (available to all authenticated users)
 */
router.get('/tsp', authenticateToken, logAuthEvent('GET_TSP_USERS'), listActiveTspUsers);
router.get('/ccrp', authenticateToken, logAuthEvent('GET_TSP_USERS_LEGACY'), listActiveTspUsers);

/**
 * GET /api/users/wallet/:walletAddress
 * Get user by wallet address
 */
router.get('/wallet/:walletAddress', authenticateToken, logAuthEvent('GET_USER_BY_WALLET'), async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress;

    const user = await db.User.findOne({
      where: { 
        walletAddress: walletAddress,
        isActive: true 
      },
      attributes: [
        'id', 'name', 'email', 'partyType', 'walletAddress', 'publicKey',
        'description', 'organization', 'phoneNumber', 'website', 'location',
        'isRegistered', 'registrationDate', 'createdAt', 'updatedAt',
        'did', 'didSource', 'didVerified', 'didVerificationMethod',
        'onboardingStatus', 'profileCompleted', 'emailVerified', 'isActive',
        'lastLoginAt'
      ]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json(user);

  } catch (error) {
    console.error('❌ Get user by wallet error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/users/:id
 * Get specific user by ID (AppAdmin only)
 */
router.get('/:id', authenticateToken, logAuthEvent('GET_USER_BY_ID'), async (req, res) => {
  try {
    const localUser = req.user.localUser;
    const userId = parseInt(req.params.id);

    // Check if user is AppAdmin
    if (localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. AppAdmin privileges required.',
        code: 'ACCESS_DENIED'
      });
    }

    const user = await db.User.findOne({
      where: { id: userId, isActive: true },
      attributes: [
        'id', 'name', 'email', 'partyType', 'walletAddress', 'publicKey',
        'description', 'organization', 'phoneNumber', 'website', 'location',
        'isRegistered', 'registrationDate', 'createdAt', 'updatedAt',
        'did', 'didSource', 'didVerified', 'didVerificationMethod',
        'onboardingStatus', 'profileCompleted', 'emailVerified', 'isActive',
        'lastLoginAt'
      ]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json(user);

  } catch (error) {
    console.error('❌ Get user by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user by ID (AppAdmin only)
 */
router.put('/:id', authenticateToken, logAuthEvent('UPDATE_USER_BY_ID'), async (req, res) => {
  try {
    const localUser = req.user.localUser;
    const userId = parseInt(req.params.id);
    const updateData = req.body;

    // Check if user is AppAdmin
    if (localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. AppAdmin privileges required.',
        code: 'ACCESS_DENIED'
      });
    }

    // Find the user to update
    const userToUpdate = await db.User.findOne({
      where: { id: userId, isActive: true }
    });

    if (!userToUpdate) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Define allowed fields for AppAdmin to update
    const allowedFields = [
      'name', 'description', 'organization', 'phoneNumber', 'website', 'location',
      'did', 'didSource', 'didVerified', 'didVerificationMethod',
      'publicKey', 'isActive', 'profileCompleted', 'emailVerified', 'onboardingStatus',
      'cloudProviders'
    ];

    // Filter update data to only include allowed fields
    const filteredUpdateData = {};
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    if (filteredUpdateData.cloudProviders !== undefined) {
      if (!isTspPartyType(userToUpdate.partyType)) {
        return res.status(400).json({
          error: 'cloudProviders can only be set for TSP users',
          code: 'INVALID_PARTY_TYPE',
        });
      }
      const normalized = normalizeTspCloudProviders(filteredUpdateData.cloudProviders);
      if (!normalized.ok) {
        return res.status(400).json({
          error: normalized.error,
          code: 'INVALID_CLOUD_PROVIDERS',
        });
      }
      filteredUpdateData.cloudProviders = normalized.value;
    }

    // Update the user
    await userToUpdate.update(filteredUpdateData);

    // Reload user data
    await userToUpdate.reload();

    res.json({
      message: 'User updated successfully',
      user: {
        id: userToUpdate.id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        partyType: userToUpdate.partyType,
        did: userToUpdate.did,
        didSource: userToUpdate.didSource,
        didVerified: userToUpdate.didVerified,
        publicKey: userToUpdate.publicKey,
        isActive: userToUpdate.isActive,
        profileCompleted: userToUpdate.profileCompleted,
        emailVerified: userToUpdate.emailVerified,
        onboardingStatus: userToUpdate.onboardingStatus,
        cloudProviders: userToUpdate.cloudProviders
      }
    });

  } catch (error) {
    console.error('❌ Update user by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
});

/**
 * DELETE /api/users/:id
 * Soft delete user by ID (AppAdmin only)
 */
router.delete('/:id', authenticateToken, logAuthEvent('DELETE_USER_BY_ID'), async (req, res) => {
  try {
    const localUser = req.user.localUser;
    const userId = parseInt(req.params.id);

    // Check if user is AppAdmin
    if (localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. AppAdmin privileges required.',
        code: 'ACCESS_DENIED'
      });
    }

    // Prevent AppAdmin from deleting themselves
    if (userId === localUser.id) {
      return res.status(400).json({
        error: 'Cannot delete your own account',
        code: 'SELF_DELETE_NOT_ALLOWED'
      });
    }

    const userToDelete = await db.User.findOne({
      where: { id: userId, isActive: true }
    });

    if (!userToDelete) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Soft delete by setting isActive to false
    await userToDelete.update({ isActive: false });

    res.json({
      message: 'User deleted successfully',
      userId: userId
    });

  } catch (error) {
    console.error('❌ Delete user by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 