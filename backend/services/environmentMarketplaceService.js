/**
 * Environment Marketplace Service
 * 
 * Manages the marketplace where CCRPs can offer training environments
 * and TDCs can discover, compare, and select environments for AI training.
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class EnvironmentMarketplaceService {
  constructor() {
    this.marketplaceOfferings = new Map();
    this.searchIndex = new Map();
    this.categoryIndex = new Map();
    this.providerIndex = new Map();
    this.priceIndex = new Map();
    
    // Initialize marketplace categories
    this.initializeCategories();
  }

  initializeCategories() {
    this.categories = {
      'compute-optimized': {
        name: 'Compute Optimized',
        description: 'High-performance CPU environments for compute-intensive training',
        icon: '🚀',
        subcategories: ['CPU-intensive', 'Parallel Processing', 'High Frequency']
      },
      'memory-optimized': {
        name: 'Memory Optimized',
        description: 'High-memory environments for large model training',
        icon: '🧠',
        subcategories: ['Large Memory', 'In-Memory Processing', 'Big Data']
      },
      'gpu-accelerated': {
        name: 'GPU Accelerated',
        description: 'GPU-powered environments for deep learning and neural networks',
        icon: '⚡',
        subcategories: ['NVIDIA Tesla', 'AMD Instinct', 'Multi-GPU']
      },
      'tee-secure': {
        name: 'TEE Secure',
        description: 'Trusted Execution Environments for confidential AI training',
        icon: '🔒',
        subcategories: ['SGX', 'SEV', 'Nitro Enclaves', 'Confidential VMs']
      },
      'cost-effective': {
        name: 'Cost Effective',
        description: 'Budget-friendly environments for development and testing',
        icon: '💰',
        subcategories: ['Spot Instances', 'Reserved', 'Free Tier']
      },
      'specialized': {
        name: 'Specialized',
        description: 'Custom environments for specific AI workloads',
        icon: '🎯',
        subcategories: ['Computer Vision', 'NLP', 'Reinforcement Learning', 'Edge AI']
      }
    };
  }

  /**
   * Create a new marketplace offering
   * @param {Object} offeringData - Environment offering details
   * @returns {Object} Created marketplace offering
   */
  async createMarketplaceOffering(offeringData) {
    try {
      const offeringId = `offering_${Date.now()}_${uuidv4().slice(0, 8)}`;

      const offering = {
        id: offeringId,
        ccrpId: offeringData.ccrpId,
        title: offeringData.title,
        description: offeringData.description,
        category: offeringData.category,
        subcategory: offeringData.subcategory,
        
        // Environment specifications
        specifications: {
          provider: offeringData.provider, // AWS, Azure, GCP, OCI
          region: offeringData.region,
          instanceType: offeringData.instanceType,
          cpuCores: offeringData.cpuCores,
          memoryGB: offeringData.memoryGB,
          storageGB: offeringData.storageGB,
          gpuType: offeringData.gpuType,
          gpuCount: offeringData.gpuCount || 0,
          networkBandwidth: offeringData.networkBandwidth,
          teeSupported: offeringData.teeSupported || false,
          attestationType: offeringData.attestationType,
          encryptionAtRest: offeringData.encryptionAtRest || true,
          networkIsolation: offeringData.networkIsolation || true
        },

        // Pricing model
        pricing: {
          model: offeringData.pricingModel, // 'hourly', 'fixed', 'usage-based'
          basePrice: offeringData.basePrice,
          currency: offeringData.currency || 'USD',
          minimumCommitment: offeringData.minimumCommitment,
          discounts: offeringData.discounts || [],
          includedServices: offeringData.includedServices || []
        },

        // Availability and SLA
        availability: {
          regions: offeringData.availableRegions || [offeringData.region],
          maxConcurrentJobs: offeringData.maxConcurrentJobs || 1,
          provisioningTime: offeringData.provisioningTime || '5-10 minutes',
          uptime: offeringData.uptime || '99.9%',
          supportLevel: offeringData.supportLevel || 'Standard'
        },

        // Compliance and certifications
        compliance: {
          certifications: offeringData.certifications || [],
          regulations: offeringData.regulations || [],
          dataResidency: offeringData.dataResidency || [],
          auditLogs: offeringData.auditLogs !== false
        },

        // Marketplace metadata
        metadata: {
          status: 'ACTIVE',
          featured: offeringData.featured || false,
          tags: offeringData.tags || [],
          searchKeywords: this.generateSearchKeywords(offeringData),
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: offeringData.expiresAt,
          views: 0,
          bookings: 0,
          rating: 0,
          reviews: []
        },

        // Contact and support
        contact: {
          supportEmail: offeringData.supportEmail,
          supportPhone: offeringData.supportPhone,
          documentationUrl: offeringData.documentationUrl,
          demoAvailable: offeringData.demoAvailable || false
        }
      };

      // Store offering
      this.marketplaceOfferings.set(offeringId, offering);

      // Update search indices
      this.updateSearchIndices(offering);

      console.log(`✅ Created marketplace offering: ${offering.title} (${offeringId})`);
      return offering;

    } catch (error) {
      console.error('❌ Failed to create marketplace offering:', error);
      throw error;
    }
  }

  /**
   * Search marketplace offerings
   * @param {Object} searchCriteria - Search and filter criteria
   * @returns {Object} Search results with offerings and metadata
   */
  async searchMarketplaceOfferings(searchCriteria = {}) {
    try {
      let offerings = Array.from(this.marketplaceOfferings.values());

      // Apply filters
      offerings = this.applyFilters(offerings, searchCriteria);

      // Apply sorting
      offerings = this.applySorting(offerings, searchCriteria.sortBy, searchCriteria.sortOrder);

      // Apply pagination
      const pagination = this.applyPagination(offerings, searchCriteria.page, searchCriteria.limit);

      // Generate search metadata
      const metadata = this.generateSearchMetadata(offerings, searchCriteria);

      return {
        offerings: pagination.items,
        pagination: pagination.pagination,
        metadata,
        filters: this.getAvailableFilters(offerings),
        categories: this.categories
      };

    } catch (error) {
      console.error('❌ Failed to search marketplace offerings:', error);
      throw error;
    }
  }

  /**
   * Get marketplace offering by ID
   * @param {string} offeringId - Offering ID
   * @param {string} userId - User ID (for analytics)
   * @returns {Object} Marketplace offering with detailed information
   */
  async getMarketplaceOffering(offeringId, userId = null) {
    try {
      const offering = this.marketplaceOfferings.get(offeringId);

      if (!offering) {
        throw new Error(`Marketplace offering not found: ${offeringId}`);
      }

      // Track view
      if (userId) {
        offering.metadata.views++;
        offering.metadata.updatedAt = new Date();
      }

      // Add dynamic pricing if applicable
      const dynamicPricing = await this.calculateDynamicPricing(offering);

      // Add availability status
      const availabilityStatus = await this.checkRealTimeAvailability(offering);

      // Add similar offerings
      const similarOfferings = await this.findSimilarOfferings(offering, 3);

      return {
        ...offering,
        dynamicPricing,
        availabilityStatus,
        similarOfferings: similarOfferings.map(o => ({
          id: o.id,
          title: o.title,
          provider: o.specifications.provider,
          pricing: o.pricing,
          rating: o.metadata.rating
        }))
      };

    } catch (error) {
      console.error('❌ Failed to get marketplace offering:', error);
      throw error;
    }
  }

  /**
   * Create a booking request for an environment
   * @param {Object} bookingData - Booking request details
   * @returns {Object} Booking request
   */
  async createBookingRequest(bookingData) {
    try {
      const bookingId = `booking_${Date.now()}_${uuidv4().slice(0, 8)}`;

      const booking = {
        id: bookingId,
        offeringId: bookingData.offeringId,
        tdcId: bookingData.tdcId,
        contractId: bookingData.contractId,
        
        // Booking details
        requirements: {
          startDate: new Date(bookingData.startDate),
          endDate: bookingData.endDate ? new Date(bookingData.endDate) : null,
          duration: bookingData.duration,
          estimatedCost: bookingData.estimatedCost,
          specialRequirements: bookingData.specialRequirements || []
        },

        // Booking status
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        rejectedAt: null,
        reason: null,

        // Communication
        messages: [],
        negotiations: []
      };

      // Store booking
      if (!this.bookingRequests) {
        this.bookingRequests = new Map();
      }
      this.bookingRequests.set(bookingId, booking);

      // Update offering booking count
      const offering = this.marketplaceOfferings.get(bookingData.offeringId);
      if (offering) {
        offering.metadata.bookings++;
        offering.metadata.updatedAt = new Date();
      }

      console.log(`✅ Created booking request: ${bookingId} for offering: ${bookingData.offeringId}`);
      return booking;

    } catch (error) {
      console.error('❌ Failed to create booking request:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics and analytics
   * @param {string} ccrpId - CCRP ID (optional, for provider-specific stats)
   * @returns {Object} Marketplace statistics
   */
  async getMarketplaceStatistics(ccrpId = null) {
    try {
      const offerings = Array.from(this.marketplaceOfferings.values());
      const filteredOfferings = ccrpId ? 
        offerings.filter(o => o.ccrpId === ccrpId) : 
        offerings;

      const stats = {
        overview: {
          totalOfferings: filteredOfferings.length,
          activeOfferings: filteredOfferings.filter(o => o.metadata.status === 'ACTIVE').length,
          totalProviders: new Set(filteredOfferings.map(o => o.ccrpId)).size,
          totalViews: filteredOfferings.reduce((sum, o) => sum + o.metadata.views, 0),
          totalBookings: filteredOfferings.reduce((sum, o) => sum + o.metadata.bookings, 0)
        },

        categories: this.calculateCategoryStats(filteredOfferings),
        providers: this.calculateProviderStats(filteredOfferings),
        pricing: this.calculatePricingStats(filteredOfferings),
        performance: this.calculatePerformanceStats(filteredOfferings),
        
        trends: {
          popularCategories: this.getPopularCategories(filteredOfferings),
          topRatedOfferings: this.getTopRatedOfferings(filteredOfferings, 5),
          priceTrends: this.analyzePriceTrends(filteredOfferings),
          demandTrends: this.analyzeDemandTrends(filteredOfferings)
        }
      };

      return stats;

    } catch (error) {
      console.error('❌ Failed to get marketplace statistics:', error);
      throw error;
    }
  }

  /**
   * Apply filters to offerings
   * @private
   */
  applyFilters(offerings, criteria) {
    let filtered = offerings;

    // Text search
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      filtered = filtered.filter(offering => 
        offering.title.toLowerCase().includes(query) ||
        offering.description.toLowerCase().includes(query) ||
        offering.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
        offering.metadata.searchKeywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (criteria.category) {
      filtered = filtered.filter(offering => offering.category === criteria.category);
    }

    // Provider filter
    if (criteria.provider) {
      filtered = filtered.filter(offering => offering.specifications.provider === criteria.provider);
    }

    // Price range filter
    if (criteria.minPrice || criteria.maxPrice) {
      filtered = filtered.filter(offering => {
        const price = offering.pricing.basePrice;
        return (!criteria.minPrice || price >= criteria.minPrice) &&
               (!criteria.maxPrice || price <= criteria.maxPrice);
      });
    }

    // Resource filters
    if (criteria.minCpuCores) {
      filtered = filtered.filter(offering => offering.specifications.cpuCores >= criteria.minCpuCores);
    }

    if (criteria.minMemoryGB) {
      filtered = filtered.filter(offering => offering.specifications.memoryGB >= criteria.minMemoryGB);
    }

    if (criteria.teeRequired) {
      filtered = filtered.filter(offering => offering.specifications.teeSupported === true);
    }

    if (criteria.gpuRequired) {
      filtered = filtered.filter(offering => offering.specifications.gpuCount > 0);
    }

    // Region filter
    if (criteria.region) {
      filtered = filtered.filter(offering => 
        offering.availability.regions.includes(criteria.region)
      );
    }

    // Certification filter
    if (criteria.certifications && criteria.certifications.length > 0) {
      filtered = filtered.filter(offering =>
        criteria.certifications.some(cert => 
          offering.compliance.certifications.includes(cert)
        )
      );
    }

    // Status filter
    if (criteria.status) {
      filtered = filtered.filter(offering => offering.metadata.status === criteria.status);
    }

    return filtered;
  }

  /**
   * Apply sorting to offerings
   * @private
   */
  applySorting(offerings, sortBy = 'relevance', sortOrder = 'desc') {
    const sortFunctions = {
      'relevance': (a, b) => b.metadata.views - a.metadata.views,
      'price': (a, b) => a.pricing.basePrice - b.pricing.basePrice,
      'rating': (a, b) => b.metadata.rating - a.metadata.rating,
      'performance': (a, b) => (b.specifications.cpuCores + b.specifications.memoryGB) - 
                              (a.specifications.cpuCores + a.specifications.memoryGB),
      'created': (a, b) => new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt),
      'popularity': (a, b) => b.metadata.bookings - a.metadata.bookings
    };

    const sortFn = sortFunctions[sortBy] || sortFunctions['relevance'];
    offerings.sort(sortFn);

    if (sortOrder === 'asc') {
      offerings.reverse();
    }

    return offerings;
  }

  /**
   * Apply pagination
   * @private
   */
  applyPagination(offerings, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const items = offerings.slice(offset, offset + limit);

    return {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: offerings.length,
        pages: Math.ceil(offerings.length / limit),
        hasNext: offset + limit < offerings.length,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Generate search keywords for an offering
   * @private
   */
  generateSearchKeywords(offeringData) {
    const keywords = [];

    // Add provider and region
    keywords.push(offeringData.provider, offeringData.region);

    // Add instance type
    if (offeringData.instanceType) {
      keywords.push(offeringData.instanceType);
    }

    // Add GPU type if applicable
    if (offeringData.gpuType) {
      keywords.push(offeringData.gpuType, 'gpu', 'graphics');
    }

    // Add TEE keywords if supported
    if (offeringData.teeSupported) {
      keywords.push('tee', 'trusted', 'confidential', 'secure', 'enclave');
    }

    // Add resource-based keywords
    if (offeringData.cpuCores >= 16) {
      keywords.push('high-performance', 'compute-intensive');
    }

    if (offeringData.memoryGB >= 64) {
      keywords.push('high-memory', 'large-scale');
    }

    // Add pricing keywords
    if (offeringData.basePrice < 1) {
      keywords.push('budget', 'cost-effective', 'affordable');
    } else if (offeringData.basePrice > 10) {
      keywords.push('premium', 'high-performance', 'enterprise');
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Update search indices
   * @private
   */
  updateSearchIndices(offering) {
    // Category index
    if (!this.categoryIndex.has(offering.category)) {
      this.categoryIndex.set(offering.category, []);
    }
    this.categoryIndex.get(offering.category).push(offering.id);

    // Provider index
    if (!this.providerIndex.has(offering.specifications.provider)) {
      this.providerIndex.set(offering.specifications.provider, []);
    }
    this.providerIndex.get(offering.specifications.provider).push(offering.id);

    // Price index (price ranges)
    const priceRange = this.getPriceRange(offering.pricing.basePrice);
    if (!this.priceIndex.has(priceRange)) {
      this.priceIndex.set(priceRange, []);
    }
    this.priceIndex.get(priceRange).push(offering.id);

    // Search keyword index
    offering.metadata.searchKeywords.forEach(keyword => {
      if (!this.searchIndex.has(keyword)) {
        this.searchIndex.set(keyword, []);
      }
      this.searchIndex.get(keyword).push(offering.id);
    });
  }

  /**
   * Calculate category statistics
   * @private
   */
  calculateCategoryStats(offerings) {
    const stats = {};
    
    Object.keys(this.categories).forEach(categoryKey => {
      const categoryOfferings = offerings.filter(o => o.category === categoryKey);
      stats[categoryKey] = {
        count: categoryOfferings.length,
        averagePrice: categoryOfferings.length > 0 
          ? categoryOfferings.reduce((sum, o) => sum + o.pricing.basePrice, 0) / categoryOfferings.length 
          : 0,
        totalViews: categoryOfferings.reduce((sum, o) => sum + o.metadata.views, 0),
        totalBookings: categoryOfferings.reduce((sum, o) => sum + o.metadata.bookings, 0)
      };
    });

    return stats;
  }

  /**
   * Calculate provider statistics
   * @private
   */
  calculateProviderStats(offerings) {
    const providers = ['AWS', 'Azure', 'GCP', 'OCI'];
    const stats = {};

    providers.forEach(provider => {
      const providerOfferings = offerings.filter(o => o.specifications.provider === provider);
      stats[provider] = {
        count: providerOfferings.length,
        averagePrice: providerOfferings.length > 0
          ? providerOfferings.reduce((sum, o) => sum + o.pricing.basePrice, 0) / providerOfferings.length
          : 0,
        regions: [...new Set(providerOfferings.flatMap(o => o.availability.regions))].length
      };
    });

    return stats;
  }

  /**
   * Calculate pricing statistics
   * @private
   */
  calculatePricingStats(offerings) {
    const prices = offerings.map(o => o.pricing.basePrice);
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      median: this.calculateMedian(prices),
      distribution: {
        'under-1': prices.filter(p => p < 1).length,
        '1-5': prices.filter(p => p >= 1 && p < 5).length,
        '5-10': prices.filter(p => p >= 5 && p < 10).length,
        'over-10': prices.filter(p => p >= 10).length
      }
    };
  }

  /**
   * Calculate performance statistics
   * @private
   */
  calculatePerformanceStats(offerings) {
    const cpuCores = offerings.map(o => o.specifications.cpuCores);
    const memory = offerings.map(o => o.specifications.memoryGB);
    const storage = offerings.map(o => o.specifications.storageGB);

    return {
      cpu: {
        min: Math.min(...cpuCores),
        max: Math.max(...cpuCores),
        average: cpuCores.reduce((sum, cores) => sum + cores, 0) / cpuCores.length
      },
      memory: {
        min: Math.min(...memory),
        max: Math.max(...memory),
        average: memory.reduce((sum, mem) => sum + mem, 0) / memory.length
      },
      storage: {
        min: Math.min(...storage),
        max: Math.max(...storage),
        average: storage.reduce((sum, stor) => sum + stor, 0) / storage.length
      },
      teeSupported: offerings.filter(o => o.specifications.teeSupported).length,
      gpuAccelerated: offerings.filter(o => o.specifications.gpuCount > 0).length
    };
  }

  /**
   * Helper methods
   * @private
   */
  getPriceRange(price) {
    if (price < 1) return 'budget';
    if (price < 5) return 'standard';
    if (price < 10) return 'premium';
    return 'enterprise';
  }

  calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  async calculateDynamicPricing(offering) {
    // Simplified dynamic pricing - in reality would consider demand, availability, etc.
    const basePricing = offering.pricing;
    const demandMultiplier = Math.random() * 0.2 + 0.9; // 0.9 - 1.1x
    
    return {
      ...basePricing,
      dynamicPrice: Math.round(basePricing.basePrice * demandMultiplier * 100) / 100,
      demandLevel: demandMultiplier > 1.05 ? 'high' : demandMultiplier < 0.95 ? 'low' : 'normal',
      validUntil: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };
  }

  async checkRealTimeAvailability(offering) {
    // Simulate real-time availability check
    return {
      available: Math.random() > 0.1, // 90% availability
      estimatedProvisioningTime: offering.availability.provisioningTime,
      nextAvailableSlot: Math.random() > 0.8 ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null,
      currentUtilization: Math.floor(Math.random() * 80) + 10 // 10-90%
    };
  }

  async findSimilarOfferings(offering, limit = 3) {
    const allOfferings = Array.from(this.marketplaceOfferings.values());
    
    // Calculate similarity score based on category, provider, and specifications
    const scored = allOfferings
      .filter(o => o.id !== offering.id && o.metadata.status === 'ACTIVE')
      .map(o => ({
        ...o,
        similarityScore: this.calculateSimilarityScore(offering, o)
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return scored;
  }

  calculateSimilarityScore(offering1, offering2) {
    let score = 0;
    
    // Category match
    if (offering1.category === offering2.category) score += 30;
    
    // Provider match
    if (offering1.specifications.provider === offering2.specifications.provider) score += 20;
    
    // Similar performance (CPU cores within 50%)
    const cpuDiff = Math.abs(offering1.specifications.cpuCores - offering2.specifications.cpuCores);
    const cpuAvg = (offering1.specifications.cpuCores + offering2.specifications.cpuCores) / 2;
    if (cpuDiff / cpuAvg < 0.5) score += 20;
    
    // Similar memory (within 50%)
    const memDiff = Math.abs(offering1.specifications.memoryGB - offering2.specifications.memoryGB);
    const memAvg = (offering1.specifications.memoryGB + offering2.specifications.memoryGB) / 2;
    if (memDiff / memAvg < 0.5) score += 15;
    
    // TEE support match
    if (offering1.specifications.teeSupported === offering2.specifications.teeSupported) score += 10;
    
    // Price similarity (within 25%)
    const priceDiff = Math.abs(offering1.pricing.basePrice - offering2.pricing.basePrice);
    const priceAvg = (offering1.pricing.basePrice + offering2.pricing.basePrice) / 2;
    if (priceDiff / priceAvg < 0.25) score += 5;
    
    return score;
  }

  getPopularCategories(offerings) {
    const categoryBookings = {};
    offerings.forEach(offering => {
      categoryBookings[offering.category] = (categoryBookings[offering.category] || 0) + offering.metadata.bookings;
    });
    
    return Object.entries(categoryBookings)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, bookings]) => ({ category, bookings }));
  }

  getTopRatedOfferings(offerings, limit) {
    return offerings
      .filter(o => o.metadata.rating > 0)
      .sort((a, b) => b.metadata.rating - a.metadata.rating)
      .slice(0, limit)
      .map(o => ({
        id: o.id,
        title: o.title,
        rating: o.metadata.rating,
        provider: o.specifications.provider,
        price: o.pricing.basePrice
      }));
  }

  analyzePriceTrends(offerings) {
    // Simplified price trend analysis
    const categoryPrices = {};
    offerings.forEach(offering => {
      if (!categoryPrices[offering.category]) {
        categoryPrices[offering.category] = [];
      }
      categoryPrices[offering.category].push(offering.pricing.basePrice);
    });

    const trends = {};
    Object.entries(categoryPrices).forEach(([category, prices]) => {
      trends[category] = {
        averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
        priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
        trend: Math.random() > 0.5 ? 'increasing' : 'stable' // Simulated
      };
    });

    return trends;
  }

  analyzeDemandTrends(offerings) {
    // Simplified demand analysis
    const totalBookings = offerings.reduce((sum, o) => sum + o.metadata.bookings, 0);
    const totalViews = offerings.reduce((sum, o) => sum + o.metadata.views, 0);

    return {
      conversionRate: totalViews > 0 ? ((totalBookings / totalViews) * 100).toFixed(2) : 0,
      averageBookingsPerOffering: offerings.length > 0 ? (totalBookings / offerings.length).toFixed(1) : 0,
      trendDirection: Math.random() > 0.6 ? 'increasing' : 'stable', // Simulated
      peakDemandCategory: this.getPopularCategories(offerings)[0]?.category || 'N/A'
    };
  }

  getAvailableFilters(offerings) {
    return {
      categories: [...new Set(offerings.map(o => o.category))],
      providers: [...new Set(offerings.map(o => o.specifications.provider))],
      regions: [...new Set(offerings.flatMap(o => o.availability.regions))],
      priceRanges: [
        { label: 'Under $1/hour', value: 'under-1' },
        { label: '$1-5/hour', value: '1-5' },
        { label: '$5-10/hour', value: '5-10' },
        { label: 'Over $10/hour', value: 'over-10' }
      ],
      certifications: [...new Set(offerings.flatMap(o => o.compliance.certifications))],
      features: [
        { label: 'TEE Support', value: 'tee' },
        { label: 'GPU Acceleration', value: 'gpu' },
        { label: 'High Memory', value: 'high-memory' },
        { label: 'High Performance', value: 'high-performance' }
      ]
    };
  }

  generateSearchMetadata(offerings, criteria) {
    return {
      searchQuery: criteria.query || '',
      appliedFilters: {
        category: criteria.category,
        provider: criteria.provider,
        priceRange: criteria.minPrice || criteria.maxPrice ? 
          `${criteria.minPrice || 0}-${criteria.maxPrice || 'max'}` : null,
        features: []
      },
      resultStats: {
        totalResults: offerings.length,
        averagePrice: offerings.length > 0 
          ? (offerings.reduce((sum, o) => sum + o.pricing.basePrice, 0) / offerings.length).toFixed(2)
          : 0,
        priceRange: offerings.length > 0 ? {
          min: Math.min(...offerings.map(o => o.pricing.basePrice)),
          max: Math.max(...offerings.map(o => o.pricing.basePrice))
        } : null
      },
      searchTime: Date.now(),
      suggestions: this.generateSearchSuggestions(criteria, offerings)
    };
  }

  generateSearchSuggestions(criteria, offerings) {
    const suggestions = [];

    // If no results, suggest broader search
    if (offerings.length === 0) {
      suggestions.push('Try removing some filters to see more results');
      suggestions.push('Browse popular categories to discover alternatives');
    }

    // If many results, suggest refinement
    if (offerings.length > 50) {
      suggestions.push('Try adding more specific filters to narrow your search');
      suggestions.push('Sort by price or rating to find the best match');
    }

    // Category suggestions
    if (!criteria.category) {
      const popularCategories = this.getPopularCategories(Array.from(this.marketplaceOfferings.values()));
      if (popularCategories.length > 0) {
        suggestions.push(`Try browsing ${popularCategories[0].category} environments`);
      }
    }

    return suggestions;
  }
}

module.exports = EnvironmentMarketplaceService;

