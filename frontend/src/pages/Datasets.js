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
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { apiService } from '../services/api';

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

function Datasets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  // Fetch datasets and categories
  const { data: datasetsResponse, isLoading: datasetsLoading, error: datasetsError } = useQuery(
    ['datasets', searchTerm, selectedCategory],
    () => apiService.searchDatasets({ q: searchTerm, category: selectedCategory }),
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      cacheTime: 0,
    }
  );
  
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery('categories', apiService.getDatasetCategories);

  const datasets = datasetsResponse?.datasets || [];
  
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Datasets</Typography>
        <Button variant="contained" startIcon={<Add />}>
          Add Dataset
        </Button>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={4}>
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

      {/* Datasets Grid */}
      {datasetsLoading ? (
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
          {datasets.map((dataset) => (
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
      )}

      {!datasetsLoading && !datasetsError && datasets.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No datasets found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search criteria
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
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{selectedDataset.name}</Typography>
                <Chip label={`$${selectedDataset.price}`} color="primary" />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedDataset.description}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Category:</strong>
                  </Typography>
                  <Chip label={selectedDataset.category} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Size:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedDataset.size} MB
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Records:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedDataset.recordCount.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>License:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedDataset.license}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Provider:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedDataset.owner?.name}
                  </Typography>
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
                {selectedDataset.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Metadata:</strong>
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" fontSize="0.875rem">
                      {JSON.stringify(selectedDataset.metadata, null, 2)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              <Button variant="contained" onClick={() => {
                setViewDialogOpen(false);
                // Navigate to create contract with this dataset
              }}>
                Create Contract
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default Datasets; 