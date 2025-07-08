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
} from '@mui/material';
import {
  Business,
  Person,
  Security,
  Email,
  Visibility,
  PersonAdd,
  Refresh,
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
      case 'CCRP':
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
      case 'CCRP':
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

  const filteredUsers = partyTypeFilter 
    ? users.filter(user => user.partyType === partyTypeFilter)
    : users;

  const tdpUsers = users.filter(user => user.partyType === 'TDP');
  const tdcUsers = users.filter(user => user.partyType === 'TDC');
  const ccrpUsers = users.filter(user => user.partyType === 'CCRP');

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
                  <Typography variant="h4">{ccrpUsers.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Confidential Clean Room Providers
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
            <Grid item xs={12} md={4}>
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
                  <MenuItem value="CCRP">Confidential Clean Room Providers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="textSecondary">
                Showing {filteredUsers.length} users • Click on any user to view their profile
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <Grid container spacing={3}>
        {filteredUsers.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <UserCard user={user} onUserClick={handleUserClick} />
          </Grid>
        ))}
      </Grid>

      {filteredUsers.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No users found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your filter criteria
          </Typography>
        </Box>
      )}

      {/* Detailed List View */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Users
          </Typography>
          <List>
            {users.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem 
                  button 
                  onClick={() => handleUserClick(user)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${user.partyType === 'TDP' ? 'primary' : user.partyType === 'TDC' ? 'secondary' : 'success'}.main` }}>
                      {user.partyType === 'TDP' ? <Business /> : user.partyType === 'TDC' ? <Person /> : <Security />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight="medium">
                          {user.name}
                        </Typography>
                        <Chip 
                          label={user.partyType} 
                          size="small"
                          color={user.partyType === 'TDP' ? 'primary' : user.partyType === 'TDC' ? 'secondary' : 'success'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {user.email}
                        </Typography>
                        <Typography variant="body2" fontSize="0.75rem" fontFamily="monospace">
                          {user.walletAddress}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user.description}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="view profile"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < users.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Users; 