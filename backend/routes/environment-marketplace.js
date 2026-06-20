/**
 * Environment Marketplace API Routes
 * 
 * Provides endpoints for CCRPs to offer training environments
 * and TDCs to discover, compare, and book environments.
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const EnvironmentMarketplaceService = require('../services/environmentMarketplaceService');

// Initialize marketplace service
const marketplaceService = new EnvironmentMarketplaceService();

/**
 * Create a new marketplace offering (TSP only)
 * POST /api/marketplace/offerings
 */
router.post('/offerings',
  requireAuth,
  requireRole(['TSP', 'AppAdmin']),
  [
    body('title').isString().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
    body('description').isString().isLength({ min: 20, max: 1000 }).withMessage('Description must be 20-1000 characters'),
    body('category').isIn(['compute-optimized', 'memory-optimized', 'gpu-accelerated', 'tee-secure', 'cost-effective', 'specialized']).withMessage('Invalid category'),
    body('provider').isIn(['AWS', 'Azure', 'GCP', 'OCI']).withMessage('Invalid provider'),
    body('region').isString().notEmpty().withMessage('Region is required'),
    body('instanceType').isString().notEmpty().withMessage('Instance type is required'),
    body('cpuCores').isInt({ min: 1, max: 128 }).withMessage('CPU cores must be between 1 and 128'),
    body('memoryGB').isInt({ min: 1, max: 1024 }).withMessage('Memory must be between 1 and 1024 GB'),
    body('storageGB').isInt({ min: 10, max: 10000 }).withMessage('Storage must be between 10 and 10000 GB'),
    body('basePrice').isFloat({ min: 0.01, max: 1000 }).withMessage('Base price must be between $0.01 and $1000'),
    body('pricingModel').isIn(['hourly', 'fixed', 'usage-based']).withMessage('Invalid pricing model')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { user } = req;
      const offeringData = {
        ...req.body,
        tspId: user.id
      };

      const offering = await marketplaceService.createMarketplaceOffering(offeringData);

      res.status(201).json({
        success: true,
        message: 'Marketplace offering created successfully',
        data: { offering }
      });

    } catch (error) {
      console.error('❌ Failed to create marketplace offering:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create marketplace offering',
        error: error.message
      });
    }
  }
);

/**
 * Search marketplace offerings
 * GET /api/marketplace/search
 */
router.get('/search',
  requireAuth,
  [
    query('query').optional().isString().withMessage('Query must be a string'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('provider').optional().isString().withMessage('Provider must be a string'),
    query('region').optional().isString().withMessage('Region must be a string'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
    query('minCpuCores').optional().isInt({ min: 1 }).withMessage('Min CPU cores must be positive'),
    query('minMemoryGB').optional().isInt({ min: 1 }).withMessage('Min memory must be positive'),
    query('teeRequired').optional().isBoolean().withMessage('TEE required must be boolean'),
    query('gpuRequired').optional().isBoolean().withMessage('GPU required must be boolean'),
    query('sortBy').optional().isIn(['relevance', 'price', 'rating', 'performance', 'created', 'popularity']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const searchCriteria = req.query;
      const results = await marketplaceService.searchMarketplaceOfferings(searchCriteria);

      res.json({
        success: true,
        message: 'Marketplace search completed',
        data: results
      });

    } catch (error) {
      console.error('❌ Failed to search marketplace:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search marketplace',
        error: error.message
      });
    }
  }
);

/**
 * Get marketplace offering by ID
 * GET /api/marketplace/offerings/:offeringId
 */
router.get('/offerings/:offeringId',
  requireAuth,
  [
    param('offeringId').isString().notEmpty().withMessage('Offering ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { offeringId } = req.params;
      const { user } = req;

      const offering = await marketplaceService.getMarketplaceOffering(offeringId, user.id);

      res.json({
        success: true,
        message: 'Marketplace offering retrieved successfully',
        data: { offering }
      });

    } catch (error) {
      console.error('❌ Failed to get marketplace offering:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Marketplace offering not found'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get marketplace offering',
          error: error.message
        });
      }
    }
  }
);

/**
 * Update marketplace offering (TSP only - own offerings)
 * PUT /api/marketplace/offerings/:offeringId
 */
router.put('/offerings/:offeringId',
  requireAuth,
  requireRole(['TSP', 'AppAdmin']),
  [
    param('offeringId').isString().notEmpty().withMessage('Offering ID is required'),
    body('title').optional().isString().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
    body('description').optional().isString().isLength({ min: 20, max: 1000 }).withMessage('Description must be 20-1000 characters'),
    body('basePrice').optional().isFloat({ min: 0.01, max: 1000 }).withMessage('Base price must be between $0.01 and $1000'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { offeringId } = req.params;
      const { user } = req;
      const updateData = req.body;

      // Get existing offering to check ownership
      const existingOffering = await marketplaceService.getMarketplaceOffering(offeringId);
      
      if (existingOffering.tspId !== user.id && user.role !== 'AppAdmin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only update your own offerings'
        });
      }

      // Update offering (simplified - in full implementation would have updateMarketplaceOffering method)
      const updatedOffering = {
        ...existingOffering,
        ...updateData,
        metadata: {
          ...existingOffering.metadata,
          updatedAt: new Date()
        }
      };

      // Store updated offering
      marketplaceService.marketplaceOfferings.set(offeringId, updatedOffering);

      res.json({
        success: true,
        message: 'Marketplace offering updated successfully',
        data: { offering: updatedOffering }
      });

    } catch (error) {
      console.error('❌ Failed to update marketplace offering:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update marketplace offering',
        error: error.message
      });
    }
  }
);

/**
 * Create booking request (TDC only)
 * POST /api/marketplace/bookings
 */
router.post('/bookings',
  requireAuth,
  requireRole(['TDC', 'AppAdmin']),
  [
    body('offeringId').isString().notEmpty().withMessage('Offering ID is required'),
    body('contractId').isString().notEmpty().withMessage('Contract ID is required'),
    body('startDate').isISO8601().withMessage('Start date must be valid ISO date'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
    body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be positive'),
    body('specialRequirements').optional().isArray().withMessage('Special requirements must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { user } = req;
      const bookingData = {
        ...req.body,
        tdcId: user.id
      };

      const booking = await marketplaceService.createBookingRequest(bookingData);

      res.status(201).json({
        success: true,
        message: 'Booking request created successfully',
        data: { booking }
      });

    } catch (error) {
      console.error('❌ Failed to create booking request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking request',
        error: error.message
      });
    }
  }
);

/**
 * Get user's booking requests
 * GET /api/marketplace/bookings
 */
router.get('/bookings',
  requireAuth,
  [
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { user } = req;
      const { status, page = 1, limit = 20 } = req.query;

      // Get user's bookings (simplified implementation)
      const allBookings = Array.from(marketplaceService.bookingRequests?.values() || []);
      let userBookings = allBookings.filter(booking => 
        booking.tdcId === user.id || 
        (user.role === 'TSP' && marketplaceService.marketplaceOfferings.get(booking.offeringId)?.tspId === user.id)
      );

      // Apply status filter
      if (status) {
        userBookings = userBookings.filter(booking => booking.status === status);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedBookings = userBookings.slice(offset, offset + limit);

      res.json({
        success: true,
        message: 'Booking requests retrieved successfully',
        data: {
          bookings: paginatedBookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: userBookings.length,
            pages: Math.ceil(userBookings.length / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Failed to get booking requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get booking requests',
        error: error.message
      });
    }
  }
);

/**
 * Get marketplace categories
 * GET /api/marketplace/categories
 */
router.get('/categories',
  requireAuth,
  async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Marketplace categories retrieved successfully',
        data: {
          categories: marketplaceService.categories
        }
      });

    } catch (error) {
      console.error('❌ Failed to get marketplace categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get marketplace categories',
        error: error.message
      });
    }
  }
);

/**
 * Get marketplace statistics
 * GET /api/marketplace/stats
 */
router.get('/stats',
  requireAuth,
  [
    query('tspId').optional().isString().withMessage('TSP ID must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { user } = req;
      const { tspId } = req.query;

      // If TSP user, only show their stats unless they're admin
      const targetCcrpId = user.role === 'TSP' && !tspId ? user.id : tspId;

      const stats = await marketplaceService.getMarketplaceStatistics(targetCcrpId);

      res.json({
        success: true,
        message: 'Marketplace statistics retrieved successfully',
        data: { stats }
      });

    } catch (error) {
      console.error('❌ Failed to get marketplace statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get marketplace statistics',
        error: error.message
      });
    }
  }
);

/**
 * Get user's marketplace offerings (TSP only)
 * GET /api/marketplace/my-offerings
 */
router.get('/my-offerings',
  requireAuth,
  requireRole(['TSP', 'AppAdmin']),
  [
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { user } = req;
      const { status, page = 1, limit = 20 } = req.query;

      // Get user's offerings
      const allOfferings = Array.from(marketplaceService.marketplaceOfferings.values());
      let userOfferings = user.role === 'AppAdmin' 
        ? allOfferings 
        : allOfferings.filter(offering => offering.tspId === user.id);

      // Apply status filter
      if (status) {
        userOfferings = userOfferings.filter(offering => offering.metadata.status === status);
      }

      // Sort by creation date (newest first)
      userOfferings.sort((a, b) => new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt));

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedOfferings = userOfferings.slice(offset, offset + limit);

      res.json({
        success: true,
        message: 'User offerings retrieved successfully',
        data: {
          offerings: paginatedOfferings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: userOfferings.length,
            pages: Math.ceil(userOfferings.length / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Failed to get user offerings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user offerings',
        error: error.message
      });
    }
  }
);

/**
 * Get featured marketplace offerings
 * GET /api/marketplace/featured
 */
router.get('/featured',
  requireAuth,
  [
    query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { limit = 10 } = req.query;

      // Get featured offerings
      const allOfferings = Array.from(marketplaceService.marketplaceOfferings.values());
      const featuredOfferings = allOfferings
        .filter(offering => offering.metadata.featured && offering.metadata.status === 'ACTIVE')
        .sort((a, b) => b.metadata.rating - a.metadata.rating)
        .slice(0, limit);

      res.json({
        success: true,
        message: 'Featured offerings retrieved successfully',
        data: {
          offerings: featuredOfferings,
          count: featuredOfferings.length
        }
      });

    } catch (error) {
      console.error('❌ Failed to get featured offerings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured offerings',
        error: error.message
      });
    }
  }
);

/**
 * Get marketplace offering recommendations for user
 * GET /api/marketplace/recommendations
 */
router.get('/recommendations',
  requireAuth,
  requireRole(['TDC', 'AppAdmin']),
  [
    query('category').optional().isString().withMessage('Category must be a string'),
    query('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be positive'),
    query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { user } = req;
      const { category, budget, limit = 5 } = req.query;

      // Get active offerings
      const allOfferings = Array.from(marketplaceService.marketplaceOfferings.values())
        .filter(offering => offering.metadata.status === 'ACTIVE');

      let recommendations = allOfferings;

      // Apply category filter
      if (category) {
        recommendations = recommendations.filter(offering => offering.category === category);
      }

      // Apply budget filter
      if (budget) {
        recommendations = recommendations.filter(offering => offering.pricing.basePrice <= budget);
      }

      // Sort by relevance (rating + popularity)
      recommendations.sort((a, b) => {
        const scoreA = a.metadata.rating * 0.7 + (a.metadata.bookings / 10) * 0.3;
        const scoreB = b.metadata.rating * 0.7 + (b.metadata.bookings / 10) * 0.3;
        return scoreB - scoreA;
      });

      // Take top recommendations
      recommendations = recommendations.slice(0, limit);

      res.json({
        success: true,
        message: 'Recommendations retrieved successfully',
        data: {
          recommendations,
          criteria: { category, budget, limit }
        }
      });

    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations',
        error: error.message
      });
    }
  }
);

module.exports = router;

