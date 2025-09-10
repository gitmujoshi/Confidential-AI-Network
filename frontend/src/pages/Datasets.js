import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Pagination,
  IconButton,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search,
  Add,
  Storage,
  Person,
  Security,
  Lock,
  Verified,
  Warning,
  ViewList,
  ViewModule,
  Visibility,
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import { DATASET_CATEGORIES } from '../config/datasetConstraints';

function Datasets() {
  const navigate = useNavigate();
  const { currentUser: user } = useUser();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [domains, setDomains] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    loadDatasets();
    loadCategories();
    loadDomains();
  }, [page, searchTerm, selectedCategory, selectedDomain]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...(searchTerm && { q: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedDomain && { domain: selectedDomain })
      };

      const response = await apiService.getDatasets(params, user);
      setDatasets(response.datasets || []);
      setTotalPages(Math.ceil((response.total || 0) / 12));
    } catch (error) {
      console.error('Error loading datasets:', error);
      setError('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiService.getDatasetCategories();
      // Convert simple array to objects with value and label
      const categoryObjects = (response || []).map(category => ({
        value: category,
        label: category,
        description: getCategoryDescription(category),
        icon: getCategoryIcon(category)
      }));
      setCategories(categoryObjects);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to hardcoded categories
      setCategories(DATASET_CATEGORIES);
    }
  };

  const loadDomains = async () => {
    try {
      const response = await apiService.getDatasetDomains();
      // Convert simple array to objects with value and label
      const domainObjects = (response || []).map(domain => ({
        value: domain,
        label: domain,
        description: getDomainDescription(domain),
        icon: getDomainIcon(domain)
      }));
      setDomains(domainObjects);
    } catch (error) {
      console.error('Error loading domains:', error);
      // Fallback to hardcoded domains
      const fallbackDomains = [
        'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Technology',
        'Education', 'Government', 'Energy', 'Transportation', 'Agriculture', 'Media', 'Other'
      ];
      setDomains(fallbackDomains.map(domain => ({
        value: domain,
        label: domain,
        description: getDomainDescription(domain),
        icon: getDomainIcon(domain)
      })));
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setPage(1);
  };

  const handleDomainChange = (event) => {
    setSelectedDomain(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Filter and sort datasets
  const filteredAndSortedDatasets = datasets
    .filter(dataset => {
      const matchesSearch = !searchTerm || 
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dataset.tags && dataset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory = !selectedCategory || dataset.category === selectedCategory;
      const matchesDomain = !selectedDomain || dataset.domain === selectedDomain;
      return matchesSearch && matchesCategory && matchesDomain;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle null/undefined values
      if (!aValue) aValue = '';
      if (!bValue) bValue = '';
      
      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });


  // Helper functions for category metadata
  const getCategoryDescription = (category) => {
    const descriptions = {
      'Computer Vision': 'Images, videos, and visual data',
      'Natural Language Processing': 'Text, speech, and language data',
      'Tabular': 'Structured data in rows and columns',
      'Audio': 'Sound and audio data',
      'Multimodal': 'Combination of different data types',
      'Time Series': 'Data points indexed by time',
      'Graph': 'Network and relationship data'
    };
    return descriptions[category] || 'Dataset category';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Computer Vision': '🖼️',
      'Natural Language Processing': '📝',
      'Tabular': '📊',
      'Audio': '🎵',
      'Multimodal': '🔀',
      'Time Series': '📈',
      'Graph': '🕸️'
    };
    return icons[category] || '📁';
  };

  // Helper functions for domain metadata
  const getDomainDescription = (domain) => {
    const descriptions = {
      'Healthcare': 'Medical, pharmaceutical, and health-related data',
      'Finance': 'Banking, insurance, and financial services data',
      'Retail': 'Consumer goods, retail, and e-commerce data',
      'Manufacturing': 'Industrial, manufacturing, and supply chain data',
      'Technology': 'Software, IT, and technology sector data',
      'Education': 'Educational institutions and learning data',
      'Government': 'Government agencies and public sector data',
      'Energy': 'Energy, utilities, and environmental data',
      'Transportation': 'Transportation, logistics, and mobility data',
      'Agriculture': 'Agricultural, food production, and farming data',
      'Media': 'Media, entertainment, and content creation data',
      'Other': 'Other domains not specifically categorized'
    };
    return descriptions[domain] || 'Dataset domain';
  };

  const getDomainIcon = (domain) => {
    const icons = {
      'Healthcare': '🏥',
      'Finance': '🏦',
      'Retail': '🛒',
      'Manufacturing': '🏭',
      'Technology': '💻',
      'Education': '🎓',
      'Government': '🏛️',
      'Energy': '⚡',
      'Transportation': '🚚',
      'Agriculture': '🌾',
      'Media': '🎬',
      'Other': '📁'
    };
    return icons[domain] || '📁';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ pt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {user?.partyType === 'TDP' ? 'My Datasets' : 'Datasets'}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModule />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <ViewList />
            </ToggleButton>
          </ToggleButtonGroup>
          {user?.partyType === 'TDP' && (
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => navigate('/datasets/add')}
            >
              Add Dataset
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Role-based messaging */}
      {user?.partyType === 'TDP' && (
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary">
            Showing your datasets only. Other users can see your public datasets in the marketplace.
          </Typography>
        </Box>
      )}

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={handleCategoryChange}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {(Array.isArray(categories) ? categories : []).map((category) => (
                    <MenuItem key={category.value || category} value={category.value || category}>
                      {category.label || category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Domain</InputLabel>
                <Select
                  value={selectedDomain}
                  label="Domain"
                  onChange={handleDomainChange}
                >
                  <MenuItem value="">All Domains</MenuItem>
                  {(Array.isArray(domains) ? domains : []).map((domain) => (
                    <MenuItem key={domain.value || domain} value={domain.value || domain}>
                      {domain.label || domain}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedDomain('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Datasets Display */}
      {filteredAndSortedDatasets.length > 0 ? (
        <>
          {/* Datasets Grid View */}
          {viewMode === 'grid' && (
            <Grid container spacing={3}>
              {filteredAndSortedDatasets.map((dataset) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={dataset.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Dataset Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ flex: 1, mr: 1 }}>
                        <Typography variant="h6" component="div">
                          {dataset.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {dataset.depaId || 'NULL'}
                        </Typography>
                      </Box>
                      
                      {/* Domain Badge */}
                      {dataset.domain && (
                        <Chip
                          icon={<span>{getDomainIcon(dataset.domain)}</span>}
                          label={dataset.domain}
                          color="primary"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      )}
                    </Box>


                    {/* Dataset Description */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      {dataset.description}
                    </Typography>

                    {/* Dataset Metadata */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Storage fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {dataset.category} • {dataset.size}MB • {dataset.recordCount.toLocaleString()} records
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {dataset.owner?.name || 'Unknown Owner'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Price */}
                    <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                      ${dataset.price}
                    </Typography>

                    {/* Tags */}
                    {dataset.tags && dataset.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {dataset.tags.slice(0, 3).map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {dataset.tags.length > 3 && (
                          <Chip
                            label={`+${dataset.tags.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{ mt: 'auto' }}>
                      {user?.partyType === 'TDC' ? (
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          startIcon={<Add />}
                        >
                          Add to Contract
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/datasets/${dataset.datasetId}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            </Grid>
          )}

          {/* Datasets Table View */}
          {viewMode === 'table' && (
            <Card>
              <CardContent>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'name'}
                            direction={sortBy === 'name' ? sortOrder : 'asc'}
                            onClick={() => handleSort('name')}
                          >
                            Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'category'}
                            direction={sortBy === 'category' ? sortOrder : 'asc'}
                            onClick={() => handleSort('category')}
                          >
                            Category
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'price'}
                            direction={sortBy === 'price' ? sortOrder : 'asc'}
                            onClick={() => handleSort('price')}
                          >
                            Price
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Records</TableCell>
                        <TableCell>Domain</TableCell>
                        <TableCell>DEPA ID</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAndSortedDatasets.map((dataset) => (
                        <TableRow 
                          key={dataset.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/datasets/${dataset.datasetId}`)}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {dataset.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {dataset.description.length > 50 
                                  ? `${dataset.description.substring(0, 50)}...` 
                                  : dataset.description
                                }
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={dataset.category} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="body2">
                                {dataset.owner?.name || 'Unknown Owner'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h6" color="primary">
                              ${dataset.price}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {dataset.size}MB
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {dataset.recordCount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {dataset.domain ? (
                              <Chip
                                icon={<span>{getDomainIcon(dataset.domain)}</span>}
                                label={dataset.domain}
                                color="primary"
                                size="small"
                              />
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                Not specified
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                              {dataset.depaId || 'Not assigned'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/datasets/${dataset.datasetId}`);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Alert severity="info">
          <AlertTitle>No Datasets Found</AlertTitle>
          {searchTerm || selectedCategory || selectedDomain
            ? 'No datasets match your current filters. Try adjusting your search criteria.'
            : 'No datasets are available at this time.'
          }
        </Alert>
      )}

      {/* Statistics */}
      {filteredAndSortedDatasets.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dataset Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {filteredAndSortedDatasets.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Datasets
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {new Set(filteredAndSortedDatasets.map(d => d.domain).filter(Boolean)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique Domains
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {filteredAndSortedDatasets.filter(d => d.domain).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    With Domain Classification
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {new Set(filteredAndSortedDatasets.map(d => d.owner?.id)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique TDPs
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default Datasets; 