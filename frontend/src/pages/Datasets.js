import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';

function Datasets() {
  const { user } = useUser();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedConfidentialComputing, setSelectedConfidentialComputing] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadDatasets();
    loadCategories();
  }, [page, searchTerm, selectedCategory, selectedConfidentialComputing]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...(searchTerm && { q: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedConfidentialComputing && { confidentialComputingRequired: selectedConfidentialComputing })
      };

      const response = await apiService.getDatasets(params);
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
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
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

  const handleConfidentialComputingChange = (event) => {
    setSelectedConfidentialComputing(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getConfidentialComputingColor = (required) => {
    return required ? 'warning' : 'default';
  };

  const getConfidentialComputingIcon = (required) => {
    return required ? <Security /> : <Storage />;
  };

  const getConfidentialComputingLabel = (required) => {
    return required ? 'Confidential Computing Required' : 'Standard Processing';
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
        {user?.partyType === 'TDP' && (
          <Button variant="contained" startIcon={<Add />}>
            Add Dataset
          </Button>
        )}
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
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Confidential Computing</InputLabel>
                <Select
                  value={selectedConfidentialComputing}
                  label="Confidential Computing"
                  onChange={handleConfidentialComputingChange}
                >
                  <MenuItem value="">All Datasets</MenuItem>
                  <MenuItem value="true">Confidential Computing Required</MenuItem>
                  <MenuItem value="false">Standard Processing</MenuItem>
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
                  setSelectedConfidentialComputing('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Datasets Grid */}
      {datasets.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {datasets.map((dataset) => (
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
                      
                      {/* Confidential Computing Badge */}
                      <Tooltip title={getConfidentialComputingLabel(dataset.confidentialComputingRequired)}>
                        <Badge
                          badgeContent={dataset.confidentialComputingRequired ? 1 : 0}
                          color={getConfidentialComputingColor(dataset.confidentialComputingRequired)}
                        >
                          <IconButton size="small" disabled>
                            {getConfidentialComputingIcon(dataset.confidentialComputingRequired)}
                          </IconButton>
                        </Badge>
                      </Tooltip>
                    </Box>

                    {/* Confidential Computing Indicator */}
                    {dataset.confidentialComputingRequired && (
                      <Chip
                        icon={<Security />}
                        label="Confidential Computing Required"
                        color="warning"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}

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
          {searchTerm || selectedCategory || selectedConfidentialComputing
            ? 'No datasets match your current filters. Try adjusting your search criteria.'
            : 'No datasets are available at this time.'
          }
        </Alert>
      )}

      {/* Statistics */}
      {datasets.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dataset Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {datasets.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Datasets
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {datasets.filter(d => d.confidentialComputingRequired).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confidential Computing Required
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {datasets.filter(d => !d.confidentialComputingRequired).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Standard Processing
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {new Set(datasets.map(d => d.owner?.id)).size}
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