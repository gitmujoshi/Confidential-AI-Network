import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
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
  IconButton,
} from '@mui/material';
import {
  Security,
  Business,
  LocationOn,
  Language,
  Phone,
  Email,
  Search,
  FilterList,
  ViewModule,
  ViewList,
  Visibility,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const TSPCard = ({ tsp, onTSPClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'INACTIVE': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }
      }}
      onClick={() => onTSPClick(tsp)}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'purple.600', mr: 2 }}>
            <Security />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" className="font-medium">
              {tsp.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {tsp.email}
            </Typography>
          </Box>
          <Chip 
            label="TSP" 
            color="primary" 
            size="small"
            variant="outlined"
          />
        </Box>

        {tsp.description && (
          <Typography variant="body2" color="textSecondary" mb={2}>
            {tsp.description}
          </Typography>
        )}

        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {tsp.organization && (
            <Chip
              icon={<Business />}
              label={tsp.organization}
              size="small"
              variant="outlined"
            />
          )}
          {tsp.location && (
            <Chip
              icon={<LocationOn />}
              label={tsp.location}
              size="small"
              variant="outlined"
            />
          )}
          {tsp.website && (
            <Chip
              icon={<Language />}
              label="Website"
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                window.open(tsp.website, '_blank');
              }}
            />
          )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="textSecondary">
            ID: {tsp.id}
          </Typography>
          <Chip
            label={tsp.isActive ? 'Active' : 'Inactive'}
            color={tsp.isActive ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

function TSP() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  // Manual TSP users fetch to avoid React Query parameter injection
  const [tspUsersResponse, setTspUsersResponse] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  const fetchTspUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTSPUsers();
      setTspUsersResponse(response);
      setError(null);
    } catch (error) {
      console.error('❌ TSP users fetch error:', error);
      setError(error);
      setTspUsersResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  React.useEffect(() => {
    fetchTspUsers();
  }, [fetchTspUsers]);
  
  const tspUsers = tspUsersResponse?.tspUsers || [];

  // Filter TSP users based on search and status
  const filteredTsps = tspUsers.filter(tsp => {
    const matchesSearch = !searchTerm || 
      tsp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tsp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tsp.description && tsp.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && tsp.isActive) ||
      (statusFilter === 'inactive' && !tsp.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Sort filtered CCRPs
  const filteredAndSortedTsps = [...filteredTsps].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'name' || sortBy === 'email') {
      aValue = aValue?.toLowerCase() || '';
      bValue = bValue?.toLowerCase() || '';
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const activeTsps = tspUsers.filter(tsp => tsp.isActive);
  const inactiveTsps = tspUsers.filter(tsp => !tsp.isActive);

  const handleTSPClick = (tsp) => {
    // Navigate to TSP profile or details page
    navigate(`/profile/${tsp.id}`);
  };

  const handleRefresh = async () => {
    try {
      await fetchTspUsers();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  const handleSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="textSecondary">
          Loading TSP providers...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="error">
          Error loading TSP providers: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Tech Service Providers
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleRefresh}
          startIcon={<FilterList />}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Security sx={{ mr: 2, color: 'purple.main' }} />
                <Box>
                  <Typography variant="h4">{tspUsers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total TSP Providers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Security sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4">{activeTsps.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Providers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Security sx={{ mr: 2, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4">{inactiveTsps.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Inactive Providers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and View Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search TSP providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
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
              <Typography variant="body2" color="textSecondary">
                {filteredAndSortedTsps.length} providers
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* TSP Grid View */}
      {viewMode === 'grid' && (
        <Grid container spacing={3}>
          {filteredAndSortedTsps.map((tsp) => (
            <Grid item xs={12} sm={6} md={4} key={tsp.id}>
              <TSPCard tsp={tsp} onTSPClick={handleTSPClick} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* TSP Table View */}
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
                        active={sortBy === 'email'}
                        direction={sortBy === 'email' ? sortOrder : 'asc'}
                        onClick={() => handleSort('email')}
                      >
                        Email
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedTsps.map((tsp) => (
                    <TableRow 
                      key={tsp.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleTSPClick(tsp)}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: 'purple.600'
                            }}
                          >
                            <Security />
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {tsp.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tsp.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {tsp.organization || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {tsp.location || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                          {tsp.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tsp.isActive ? 'Active' : 'Inactive'} 
                          size="small"
                          color={tsp.isActive ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTSPClick(tsp);
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

      {filteredAndSortedTsps.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No TSP providers found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default TSP; 