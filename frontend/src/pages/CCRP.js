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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary">
                Showing {filteredCCRPs.length} of {ccrpUsers.length} providers
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* CCRP Grid */}
      <Grid container spacing={3}>
        {filteredCCRPs.map((ccrp) => (
          <Grid item xs={12} sm={6} md={4} key={ccrp.id}>
            <CCRPCard ccrp={ccrp} onCCRPClick={handleCCRPClick} />
          </Grid>
        ))}
      </Grid>

      {filteredCCRPs.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No CCRP providers found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search criteria
          </Typography>
        </Box>
      )}

      {/* Detailed List View */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All CCRP Providers
          </Typography>
          <List>
            {ccrpUsers.map((ccrp, index) => (
              <React.Fragment key={ccrp.id}>
                <ListItem 
                  button 
                  onClick={() => handleCCRPClick(ccrp)}
                  sx={{ 
                    '&:hover': { bgcolor: 'action.hover' },
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'purple.600' }}>
                      <Security />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" className="font-medium">
                          {ccrp.name}
                        </Typography>
                        <Chip 
                          label={ccrp.isActive ? 'Active' : 'Inactive'} 
                          color={ccrp.isActive ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {ccrp.email}
                        </Typography>
                        {ccrp.description && (
                          <Typography variant="body2" color="textSecondary">
                            {ccrp.description}
                          </Typography>
                        )}
                        <Box display="flex" gap={1} mt={1}>
                          {ccrp.organization && (
                            <Chip label={ccrp.organization} size="small" variant="outlined" />
                          )}
                          {ccrp.location && (
                            <Chip label={ccrp.location} size="small" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < ccrpUsers.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CCRP; 