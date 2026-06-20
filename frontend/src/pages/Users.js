import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Business,
  Person,
  Security,
  Email,
  Visibility,
  PersonAdd,
  Refresh,
  ViewList,
  ViewModule,
  Search,
  Sort,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const UserCard = ({ user, onUserClick }) => {
  const getPartyTypeIcon = (partyType) => {
    switch (partyType) {
      case 'TDP':
        return <Business />;
      case 'TDC':
        return <Person />;
      case 'TSP':
        return <Security />;
      default:
        return <Person />;
    }
  };

  const getPartyTypeColor = (partyType) => {
    switch (partyType) {
      case 'TDP':
        return 'primary';
      case 'TDC':
        return 'secondary';
      case 'TSP':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }
      }}
      onClick={() => onUserClick(user)}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ mr: 2, bgcolor: `${getPartyTypeColor(user.partyType)}.main` }}>
            {getPartyTypeIcon(user.partyType)}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="h6" component="h2">
              {user.name}
            </Typography>
            <Chip 
              label={user.partyType} 
              color={getPartyTypeColor(user.partyType)}
              size="small"
            />
          </Box>
        </Box>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          {user.description}
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Email fontSize="small" color="action" />
          <Typography variant="body2" fontSize="0.875rem">
            {user.email}
          </Typography>
        </Box>
        
        <Typography variant="body2" fontSize="0.75rem" color="textSecondary" fontFamily="monospace">
          {user.walletAddress}
        </Typography>
        
        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            Registered: {new Date(user.registrationDate).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

function Users() {
  const [partyTypeFilter, setPartyTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const queryClient = useQueryClient();

  const { data: usersResponse, isLoading, error, refetch } = useQuery(
    'users', 
    apiService.getUsers,
    {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      cacheTime: 0,
      retry: false,
      refetchInterval: false,
    }
  );

  // Ensure users is always an array
  const users = Array.isArray(usersResponse) ? usersResponse : [];

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesPartyType = !partyTypeFilter || user.partyType === partyTypeFilter;
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.description && user.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesPartyType && matchesSearch;
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

  const tdpUsers = users.filter(user => user.partyType === 'TDP');
  const tdcUsers = users.filter(user => user.partyType === 'TDC');
  const tspUsers = users.filter(user => user.partyType === 'TSP');

  const navigate = useNavigate();

  const handleUserClick = (user) => {
    // Navigate to user profile
    navigate(`/profile/${user.id}`);
  };

  const handleRegistration = () => {
    navigate('/user-registration');
  };

  const handleRefresh = async () => {
    try {
      // Clear the cache for this query
      queryClient.removeQueries('users');
      // Force a fresh fetch
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

  const getPartyTypeIcon = (partyType) => {
    switch (partyType) {
      case 'TDP':
        return <Business />;
      case 'TDC':
        return <Person />;
      case 'TSP':
        return <Security />;
      default:
        return <Person />;
    }
  };

  const getPartyTypeColor = (partyType) => {
    switch (partyType) {
      case 'TDP':
        return 'primary';
      case 'TDC':
        return 'secondary';
      case 'TSP':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="textSecondary">
          Loading users...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="error">
          Error loading users: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Users
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRegistration}
            startIcon={<PersonAdd />}
            sx={{ mr: 2 }}
          >
            Register New User
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleRefresh}
            startIcon={<Refresh />}
          >
            Refresh Users
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Business sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{tdpUsers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Training Data Providers
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
                <Person sx={{ mr: 2, color: 'secondary.main' }} />
                <Box>
                  <Typography variant="h4">{tdcUsers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Training Data Consumers
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
                  <Typography variant="h4">{tspUsers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tech Service Providers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Party Type Filter</InputLabel>
                <Select
                  value={partyTypeFilter}
                  label="Party Type Filter"
                  onChange={(e) => setPartyTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Party Types</MenuItem>
                  <MenuItem value="TDP">Training Data Providers</MenuItem>
                  <MenuItem value="TDC">Training Data Consumers</MenuItem>
                  <MenuItem value="TSP">Tech Service Providers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users..."
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
                {filteredAndSortedUsers.length} users
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Grid View */}
      {viewMode === 'grid' && (
        <Grid container spacing={3}>
          {filteredAndSortedUsers.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <UserCard user={user} onUserClick={handleUserClick} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Users Table View */}
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
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'partyType'}
                        direction={sortBy === 'partyType' ? sortOrder : 'asc'}
                        onClick={() => handleSort('partyType')}
                      >
                        Role
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>DEPA ID</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'registrationDate'}
                        direction={sortBy === 'registrationDate' ? sortOrder : 'asc'}
                        onClick={() => handleSort('registrationDate')}
                      >
                        Registered
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleUserClick(user)}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: `${getPartyTypeColor(user.partyType)}.main`
                            }}
                          >
                            {getPartyTypeIcon(user.partyType)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.partyType} 
                          size="small"
                          color={getPartyTypeColor(user.partyType)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                          {user.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                          {user.depaId || 'Not assigned'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(user.registrationDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Inactive'} 
                          size="small"
                          color={user.isActive ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(user);
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

      {filteredAndSortedUsers.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No users found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Users; 