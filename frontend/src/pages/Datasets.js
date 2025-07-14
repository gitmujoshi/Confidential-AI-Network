import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Visibility,
  Edit,
  Delete,
  ViewModule,
  ViewList,
  Storage,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { apiService } from '../services/api';
import { useUser } from '../contexts/UserContext';

const DatasetCard = ({ dataset, onView, onEdit, onDelete }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography variant="h6" component="h2" gutterBottom>
          {dataset.name}
        </Typography>
        <Chip label={`$${dataset.price}`} color="primary" size="small" />
      </Box>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        {dataset.description}
      </Typography>
      
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <Chip label={dataset.category} size="small" variant="outlined" />
        <Chip label={`${dataset.size} MB`} size="small" variant="outlined" />
        <Chip label={`${dataset.recordCount.toLocaleString()} records`} size="small" variant="outlined" />
      </Box>
      
      <Typography variant="body2" color="textSecondary">
        <strong>License:</strong> {dataset.license}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        <strong>Provider:</strong> {dataset.owner?.name}
      </Typography>
    </CardContent>
    
    <CardActions>
      <Button size="small" startIcon={<Visibility />} onClick={() => onView(dataset)}>
        View Details
      </Button>
      <Button size="small" startIcon={<Edit />} onClick={() => onEdit(dataset)}>
        Edit
      </Button>
      <Button 
        size="small" 
        startIcon={<Delete />} 
        onClick={() => onDelete(dataset)}
        color="error"
      >
        Delete
      </Button>
    </CardActions>
  </Card>
);

const DatasetRow = ({ dataset, onView, onEdit, onDelete }) => (
  <TableRow hover>
    <TableCell>
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          <Storage />
        </Avatar>
        <Typography variant="body2" fontWeight="medium">
          {dataset.name}
        </Typography>
      </Box>
    </TableCell>
    <TableCell>
      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
        {dataset.description}
      </Typography>
    </TableCell>
    <TableCell>
      <Chip label={dataset.category} size="small" variant="outlined" />
    </TableCell>
    <TableCell>
      <Typography variant="body2">{dataset.owner?.name}</Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">${dataset.price}</Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">{dataset.size} MB</Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">{dataset.recordCount.toLocaleString()}</Typography>
    </TableCell>
    <TableCell>
      <Chip label={dataset.license} size="small" />
    </TableCell>
    <TableCell>
      <Box display="flex" gap={1}>
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => onView(dataset)}>
            <Visibility />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Dataset">
          <IconButton size="small" onClick={() => onEdit(dataset)}>
            <Edit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Dataset">
          <IconButton 
            size="small" 
            onClick={() => onDelete(dataset)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>
    </TableCell>
  </TableRow>
);

function Datasets() {
  const { currentUser: user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  // Role-based dataset fetching
  const getDatasetsQuery = () => {
    if (!user) {
      // Not logged in - show public datasets
      return {
        queryKey: ['datasets', 'public', searchTerm, selectedCategory],
        queryFn: async () => {
          const response = await apiService.searchDatasets({ q: searchTerm, category: selectedCategory });
          return response;
        },
        enabled: true
      };
    }

    // Role-based API calls
    switch (user.partyType) {
      case 'TDP':
        // TDP users see only their own datasets
        return {
          queryKey: ['datasets', 'tdp', user.id, searchTerm, selectedCategory],
          queryFn: async () => {
            const response = await apiService.get(`/api/tdp/datasets/${user.id}`);
            return response.data; // Extract the data from the response
          },
          enabled: !!user.id
        };
      case 'TDC':
      case 'CCRP':
      case 'AppAdmin':
        // TDC, CCRP, and Admin users see all public datasets
        return {
          queryKey: ['datasets', 'public', searchTerm, selectedCategory],
          queryFn: async () => {
            const response = await apiService.searchDatasets({ q: searchTerm, category: selectedCategory });
            return response;
          },
          enabled: true
        };
      default:
        // Fallback to public datasets
        return {
          queryKey: ['datasets', 'public', searchTerm, selectedCategory],
          queryFn: async () => {
            const response = await apiService.searchDatasets({ q: searchTerm, category: selectedCategory });
            return response;
          },
          enabled: true
        };
    }
  };

  const queryConfig = getDatasetsQuery();
  
  // Fetch datasets and categories
  const { data: datasetsResponse, isLoading: datasetsLoading, error: datasetsError } = useQuery(
    queryConfig.queryKey,
    queryConfig.queryFn,
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      cacheTime: 0,
      enabled: queryConfig.enabled
    }
  );
  
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery('categories', apiService.getDatasetCategories);

  const datasets = datasetsResponse?.datasets || [];
  


  // Sort datasets
  const sortedDatasets = [...datasets].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'name' || sortBy === 'description' || sortBy === 'category') {
      aValue = aValue?.toLowerCase() || '';
      bValue = bValue?.toLowerCase() || '';
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  const handleView = (dataset) => {
    setSelectedDataset(dataset);
    setViewDialogOpen(true);
  };

  const handleEdit = (dataset) => {
    // Implement edit functionality
    console.log('Edit dataset:', dataset);
  };

  const handleDelete = (dataset) => {
    // Implement delete functionality
    console.log('Delete dataset:', dataset);
  };

  const handleSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  return (
    <Box>
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setSelectedCategory(e.target.value)}
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
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newViewMode) => {
                  if (newViewMode !== null) {
                    setViewMode(newViewMode);
                  }
                }}
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
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Datasets Grid View */}
      {viewMode === 'grid' && (
        datasetsLoading ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary">
              Loading datasets...
            </Typography>
          </Box>
        ) : datasetsError ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="error">
              Error loading datasets: {datasetsError.message}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {sortedDatasets.map((dataset) => (
              <Grid item xs={12} sm={6} md={4} key={dataset.id}>
                <DatasetCard
                  dataset={dataset}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* Datasets Table View */}
      {viewMode === 'table' && (
        datasetsLoading ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary">
              Loading datasets...
            </Typography>
          </Box>
        ) : datasetsError ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="error">
              Error loading datasets: {datasetsError.message}
            </Typography>
          </Box>
        ) : (
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
                          active={sortBy === 'description'}
                          direction={sortBy === 'description' ? sortOrder : 'asc'}
                          onClick={() => handleSort('description')}
                        >
                          Description
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
                      <TableCell>Provider</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'price'}
                          direction={sortBy === 'price' ? sortOrder : 'asc'}
                          onClick={() => handleSort('price')}
                        >
                          Price
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'size'}
                          direction={sortBy === 'size' ? sortOrder : 'asc'}
                          onClick={() => handleSort('size')}
                        >
                          Size
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'recordCount'}
                          direction={sortBy === 'recordCount' ? sortOrder : 'asc'}
                          onClick={() => handleSort('recordCount')}
                        >
                          Records
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>License</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedDatasets.map((dataset) => (
                      <DatasetRow
                        key={dataset.id}
                        dataset={dataset}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )
      )}

      {!datasetsLoading && !datasetsError && sortedDatasets.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No datasets found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}

      {/* Dataset Detail Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedDataset && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Storage />
                </Avatar>
                <Typography variant="h6">{selectedDataset.name}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body1" paragraph>
                    {selectedDataset.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Category:</strong>
                  </Typography>
                  <Chip label={selectedDataset.category} size="small" />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Price:</strong>
                  </Typography>
                  <Typography variant="body1">${selectedDataset.price}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Size:</strong>
                  </Typography>
                  <Typography variant="body1">{selectedDataset.size} MB</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Records:</strong>
                  </Typography>
                  <Typography variant="body1">{selectedDataset.recordCount.toLocaleString()}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>License:</strong>
                  </Typography>
                  <Typography variant="body1">{selectedDataset.license}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Provider:</strong>
                  </Typography>
                  <Typography variant="body1">{selectedDataset.owner?.name}</Typography>
                </Grid>
                
                {selectedDataset.tags && selectedDataset.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Tags:</strong>
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {selectedDataset.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              <Button variant="contained" onClick={() => handleEdit(selectedDataset)}>
                Edit Dataset
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default Datasets; 