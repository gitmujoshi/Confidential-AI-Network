/**
 * Environment Marketplace - Frontend Component
 * 
 * Marketplace interface where TDCs can discover and book training environments
 * offered by TSPs across multiple cloud providers.
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, Select, MenuItem, 
  FormControl, InputLabel, Chip, Rating, Pagination, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary,
  AccordionDetails, Tabs, Tab, Paper, Divider, Avatar, IconButton, Tooltip,
  Slider, Switch, FormControlLabel, Backdrop, Fade
} from '@mui/material';
import {
  Search as SearchIcon, FilterList as FilterIcon, Star as StarIcon,
  CloudQueue as CloudIcon, Security as SecurityIcon, Speed as SpeedIcon,
  Memory as MemoryIcon, Storage as StorageIcon, MonetizationOn as PriceIcon,
  Verified as VerifiedIcon, TrendingUp as TrendingIcon, BookmarkBorder as BookmarkIcon,
  ExpandMore as ExpandMoreIcon, Close as CloseIcon, Settings as SettingsIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import { useUser } from '../contexts/UserContext';
import toast from 'react-hot-toast';

const EnvironmentMarketplace = () => {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    provider: '',
    region: '',
    minPrice: 0,
    maxPrice: 100,
    minCpuCores: 1,
    minMemoryGB: 1,
    teeRequired: false,
    gpuRequired: false,
    certifications: []
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // UI state
  const [selectedOffering, setSelectedOffering] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    contractId: '',
    startDate: '',
    duration: 24,
    specialRequirements: []
  });

  // Fetch marketplace data
  const {
    data: marketplaceData,
    isLoading: isLoadingResults,
    error: searchError,
    refetch: refetchResults
  } = useQuery(
    ['marketplace-search', searchQuery, filters, sortBy, sortOrder, page],
    async () => {
      const params = new URLSearchParams({
        query: searchQuery,
        ...filters,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await apiService.get(`/api/marketplace/search?${params}`);
      return response.data.data;
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch categories
  const { data: categoriesData } = useQuery(
    'marketplace-categories',
    async () => {
      const response = await apiService.get('/api/marketplace/categories');
      return response.data.data.categories;
    },
    { staleTime: 30 * 60 * 1000 } // 30 minutes
  );

  // Fetch featured offerings
  const { data: featuredData } = useQuery(
    'marketplace-featured',
    async () => {
      const response = await apiService.get('/api/marketplace/featured?limit=6');
      return response.data.data.offerings;
    },
    { staleTime: 10 * 60 * 1000 } // 10 minutes
  );

  // Create booking mutation
  const createBookingMutation = useMutation(
    async (bookingData) => {
      const response = await apiService.post('/api/marketplace/bookings', bookingData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Booking request created successfully!');
        setBookingDialogOpen(false);
        setBookingForm({
          contractId: '',
          startDate: '',
          duration: 24,
          specialRequirements: []
        });
        queryClient.invalidateQueries('user-bookings');
      },
      onError: (error) => {
        toast.error(`Failed to create booking: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleSearch = (newQuery) => {
    setSearchQuery(newQuery);
    setPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPage(1);
  };

  const handleOfferingClick = async (offering) => {
    setSelectedOffering(offering);
    
    // Fetch detailed offering information
    try {
      const response = await apiService.get(`/api/marketplace/offerings/${offering.id}`);
      setSelectedOffering(response.data.data.offering);
    } catch (error) {
      console.error('Failed to fetch offering details:', error);
    }
  };

  const handleBookingSubmit = () => {
    if (!selectedOffering) return;

    const bookingData = {
      offeringId: selectedOffering.id,
      ...bookingForm
    };

    createBookingMutation.mutate(bookingData);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'compute-optimized': <SpeedIcon />,
      'memory-optimized': <MemoryIcon />,
      'gpu-accelerated': <SpeedIcon color="warning" />,
      'tee-secure': <SecurityIcon />,
      'cost-effective': <PriceIcon />,
      'specialized': <SettingsIcon />
    };
    return icons[category] || <CloudIcon />;
  };

  const getProviderColor = (provider) => {
    const colors = {
      'AWS': '#FF9900',
      'Azure': '#0078D4',
      'GCP': '#4285F4',
      'OCI': '#F80000'
    };
    return colors[provider] || '#666';
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🌐 Environment Marketplace
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Discover and book secure training environments from trusted providers worldwide
        </Typography>

        {/* Search Bar */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search environments by name, provider, or features..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="relevance">Relevance</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="popularity">Popularity</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ height: 56 }}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Filters Panel */}
        {showFilters && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Filters</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categoriesData && Object.entries(categoriesData).map(([key, category]) => (
                      <MenuItem key={key} value={key}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={filters.provider}
                    label="Provider"
                    onChange={(e) => handleFilterChange('provider', e.target.value)}
                  >
                    <MenuItem value="">All Providers</MenuItem>
                    <MenuItem value="AWS">AWS</MenuItem>
                    <MenuItem value="Azure">Microsoft Azure</MenuItem>
                    <MenuItem value="GCP">Google Cloud</MenuItem>
                    <MenuItem value="OCI">Oracle Cloud</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography gutterBottom>Price Range ($/hour)</Typography>
                <Slider
                  value={[filters.minPrice, filters.maxPrice]}
                  onChange={(e, newValue) => {
                    handleFilterChange('minPrice', newValue[0]);
                    handleFilterChange('maxPrice', newValue[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  step={0.5}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.teeRequired}
                      onChange={(e) => handleFilterChange('teeRequired', e.target.checked)}
                    />
                  }
                  label="TEE Required"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.gpuRequired}
                      onChange={(e) => handleFilterChange('gpuRequired', e.target.checked)}
                    />
                  }
                  label="GPU Required"
                />
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Content Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Environments" />
        <Tab label="Featured" />
        <Tab label="Categories" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Search Results */}
          {isLoadingResults ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : searchError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load marketplace results: {searchError.message}
            </Alert>
          ) : (
            <>
              {/* Results Summary */}
              {marketplaceData && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    {marketplaceData.metadata.resultStats.totalResults} environments found
                    {marketplaceData.metadata.resultStats.averagePrice > 0 && (
                      <> • Average: {formatPrice(marketplaceData.metadata.resultStats.averagePrice)}/hour</>
                    )}
                  </Typography>
                  
                  {marketplaceData.metadata.suggestions.length > 0 && (
                    <Alert severity="info" sx={{ maxWidth: 400 }}>
                      {marketplaceData.metadata.suggestions[0]}
                    </Alert>
                  )}
                </Box>
              )}

              {/* Offerings Grid */}
              <Grid container spacing={3}>
                {marketplaceData?.offerings.map((offering) => (
                  <Grid item xs={12} md={6} lg={4} key={offering.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                      onClick={() => handleOfferingClick(offering)}
                    >
                      <CardContent>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(offering.category)}
                            <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                              {offering.title}
                            </Typography>
                          </Box>
                          <IconButton size="small">
                            <BookmarkIcon />
                          </IconButton>
                        </Box>

                        {/* Provider and Location */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: getProviderColor(offering.specifications.provider),
                              fontSize: '0.75rem'
                            }}
                          >
                            {offering.specifications.provider.slice(0, 2)}
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            {offering.specifications.provider} • {offering.specifications.region}
                          </Typography>
                          {offering.specifications.teeSupported && (
                            <Chip 
                              icon={<SecurityIcon />} 
                              label="TEE" 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {/* Description */}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                          {offering.description.length > 100 
                            ? `${offering.description.substring(0, 100)}...`
                            : offering.description
                          }
                        </Typography>

                        {/* Specifications */}
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">CPU</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {offering.specifications.cpuCores} cores
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Memory</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {offering.specifications.memoryGB} GB
                            </Typography>
                          </Grid>
                          {offering.specifications.gpuCount > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">GPU</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {offering.specifications.gpuCount}x {offering.specifications.gpuType}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>

                        {/* Rating and Pricing */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={offering.metadata.rating} precision={0.1} readOnly size="small" />
                            <Typography variant="caption" color="text.secondary">
                              ({offering.metadata.bookings})
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              {formatPrice(offering.pricing.basePrice)}/hr
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {offering.pricing.model}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Tags */}
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {offering.metadata.tags.slice(0, 3).map((tag, index) => (
                            <Chip 
                              key={index} 
                              label={tag} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {offering.metadata.tags.length > 3 && (
                            <Chip 
                              label={`+${offering.metadata.tags.length - 3}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {marketplaceData?.pagination && marketplaceData.pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={marketplaceData.pagination.pages}
                    page={marketplaceData.pagination.page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {featuredData?.map((offering) => (
            <Grid item xs={12} md={6} lg={4} key={offering.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => handleOfferingClick(offering)}
              >
                <Chip
                  icon={<StarIcon />}
                  label="Featured"
                  color="warning"
                  size="small"
                  sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {offering.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {offering.description.substring(0, 120)}...
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Rating value={offering.metadata.rating} precision={0.1} readOnly />
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {formatPrice(offering.pricing.basePrice)}/hr
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {categoriesData && Object.entries(categoriesData).map(([key, category]) => (
            <Grid item xs={12} md={6} lg={4} key={key}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}
                onClick={() => {
                  handleFilterChange('category', key);
                  setActiveTab(0);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h4">{category.icon}</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {category.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {category.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {category.subcategories.map((sub, index) => (
                      <Chip key={index} label={sub} size="small" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Offering Details Dialog */}
      <Dialog
        open={!!selectedOffering}
        onClose={() => setSelectedOffering(null)}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
      >
        {selectedOffering && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight="bold">
                {selectedOffering.title}
              </Typography>
              <IconButton onClick={() => setSelectedOffering(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {/* Provider Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: getProviderColor(selectedOffering.specifications.provider) }}>
                  {selectedOffering.specifications.provider.slice(0, 2)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedOffering.specifications.provider}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedOffering.specifications.region} • {selectedOffering.specifications.instanceType}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {formatPrice(selectedOffering.pricing.basePrice)}/hr
                  </Typography>
                  <Rating value={selectedOffering.metadata.rating} precision={0.1} readOnly />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Description */}
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedOffering.description}
              </Typography>

              {/* Specifications */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Technical Specifications</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" gutterBottom>Compute</Typography>
                      <Typography>CPU: {selectedOffering.specifications.cpuCores} cores</Typography>
                      <Typography>Memory: {selectedOffering.specifications.memoryGB} GB</Typography>
                      <Typography>Storage: {selectedOffering.specifications.storageGB} GB</Typography>
                      {selectedOffering.specifications.gpuCount > 0 && (
                        <Typography>GPU: {selectedOffering.specifications.gpuCount}x {selectedOffering.specifications.gpuType}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" gutterBottom>Security & Compliance</Typography>
                      <Typography>TEE Support: {selectedOffering.specifications.teeSupported ? 'Yes' : 'No'}</Typography>
                      <Typography>Encryption at Rest: {selectedOffering.specifications.encryptionAtRest ? 'Yes' : 'No'}</Typography>
                      <Typography>Network Isolation: {selectedOffering.specifications.networkIsolation ? 'Yes' : 'No'}</Typography>
                      {selectedOffering.specifications.attestationType && (
                        <Typography>Attestation: {selectedOffering.specifications.attestationType}</Typography>
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Availability */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Availability & SLA</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography>Uptime: {selectedOffering.availability.uptime}</Typography>
                      <Typography>Provisioning: {selectedOffering.availability.provisioningTime}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography>Support: {selectedOffering.availability.supportLevel}</Typography>
                      <Typography>Max Jobs: {selectedOffering.availability.maxConcurrentJobs}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Similar Offerings */}
              {selectedOffering.similarOfferings && selectedOffering.similarOfferings.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Similar Environments</Typography>
                  <Grid container spacing={2}>
                    {selectedOffering.similarOfferings.map((similar) => (
                      <Grid item xs={12} sm={4} key={similar.id}>
                        <Card variant="outlined" sx={{ cursor: 'pointer' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {similar.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {similar.provider} • {formatPrice(similar.pricing.basePrice)}/hr
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setSelectedOffering(null)}>
                Close
              </Button>
              {currentUser?.partyType === 'TDC' && (
                <Button
                  variant="contained"
                  onClick={() => setBookingDialogOpen(true)}
                  disabled={createBookingMutation.isLoading}
                >
                  Request Booking
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Booking Dialog */}
      <Dialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Environment Booking</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Contract ID"
              value={bookingForm.contractId}
              onChange={(e) => setBookingForm(prev => ({ ...prev, contractId: e.target.value }))}
              sx={{ mb: 3 }}
              required
            />
            <TextField
              fullWidth
              label="Start Date"
              type="datetime-local"
              value={bookingForm.startDate}
              onChange={(e) => setBookingForm(prev => ({ ...prev, startDate: e.target.value }))}
              sx={{ mb: 3 }}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Duration (hours)"
              type="number"
              value={bookingForm.duration}
              onChange={(e) => setBookingForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              sx={{ mb: 3 }}
              inputProps={{ min: 1 }}
            />
            <TextField
              fullWidth
              label="Special Requirements (optional)"
              multiline
              rows={3}
              placeholder="Any special requirements or notes..."
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBookingSubmit}
            disabled={!bookingForm.contractId || !bookingForm.startDate || createBookingMutation.isLoading}
          >
            {createBookingMutation.isLoading ? <CircularProgress size={20} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnvironmentMarketplace;

