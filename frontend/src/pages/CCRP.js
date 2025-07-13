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

const CCRPCard = ({ ccrp, onCCRPClick }) => {
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
      onClick={() => onCCRPClick(ccrp)}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'purple.600', mr: 2 }}>
            <Security />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" className="font-medium">
              {ccrp.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {ccrp.email}
            </Typography>
          </Box>
          <Chip 
            label="CCRP" 
            color="primary" 
            size="small"
            variant="outlined"
          />
        </Box>

        {ccrp.description && (
          <Typography variant="body2" color="textSecondary" mb={2}>
            {ccrp.description}
          </Typography>
        )}

        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {ccrp.organization && (
            <Chip
              icon={<Business />}
              label={ccrp.organization}
              size="small"
              variant="outlined"
            />
          )}
          {ccrp.location && (
            <Chip
              icon={<LocationOn />}
              label={ccrp.location}
              size="small"
              variant="outlined"
            />
          )}
          {ccrp.website && (
            <Chip
              icon={<Language />}
              label="Website"
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                window.open(ccrp.website, '_blank');
              }}
            />
          )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="textSecondary">
            ID: {ccrp.id}
          </Typography>
          <Chip
            label={ccrp.isActive ? 'Active' : 'Inactive'}
            color={ccrp.isActive ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

function CCRP() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  const { data: ccrpUsers = [], isLoading, error, refetch } = useQuery(
    'ccrp-users', 
    apiService.getCCRPUsers,
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      cacheTime: 0,
      retry: false,
      refetchInterval: false,
    }
  );

  // Filter CCRP users based on search and status
  const filteredCCRPs = ccrpUsers.filter(ccrp => {
    const matchesSearch = !searchTerm || 
      ccrp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ccrp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ccrp.description && ccrp.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && ccrp.isActive) ||
      (statusFilter === 'inactive' && !ccrp.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Sort filtered CCRPs
  const filteredAndSortedCCRPs = [...filteredCCRPs].sort((a, b) => {
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

  const activeCCRPs = ccrpUsers.filter(ccrp => ccrp.isActive);
  const inactiveCCRPs = ccrpUsers.filter(ccrp => !ccrp.isActive);

  const handleCCRPClick = (ccrp) => {
    // Navigate to CCRP profile or details page
    navigate(`/profile/${ccrp.id}`);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
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
          Loading CCRP providers...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="error">
          Error loading CCRP providers: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Confidential Clean Room Providers
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
                  <Typography variant="h4">{ccrpUsers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total CCRP Providers
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
                  <Typography variant="h4">{activeCCRPs.length}</Typography>
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
                  <Typography variant="h4">{inactiveCCRPs.length}</Typography>
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
                placeholder="Search CCRP providers..."
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
                {filteredAndSortedCCRPs.length} providers
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* CCRP Grid View */}
      {viewMode === 'grid' && (
        <Grid container spacing={3}>
          {filteredAndSortedCCRPs.map((ccrp) => (
            <Grid item xs={12} sm={6} md={4} key={ccrp.id}>
              <CCRPCard ccrp={ccrp} onCCRPClick={handleCCRPClick} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* CCRP Table View */}
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
                  {filteredAndSortedCCRPs.map((ccrp) => (
                    <TableRow 
                      key={ccrp.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleCCRPClick(ccrp)}
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
                            {ccrp.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {ccrp.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {ccrp.organization || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {ccrp.location || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                          {ccrp.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={ccrp.isActive ? 'Active' : 'Inactive'} 
                          size="small"
                          color={ccrp.isActive ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCCRPClick(ccrp);
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

      {filteredAndSortedCCRPs.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No CCRP providers found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default CCRP; 