import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Storage,
  Description,
  People,
  TrendingUp,
  Notifications,
  CheckCircle,
  Pending,
  Error,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { apiService } from '../services/api';
import { useUser } from '../contexts/UserContext';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const StatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_TDP_APPROVAL':
      case 'PENDING_CCRP_APPROVAL':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle fontSize="small" />;
      case 'PENDING_TDP_APPROVAL':
      case 'PENDING_CCRP_APPROVAL':
        return <Pending fontSize="small" />;
      case 'COMPLETED':
        return <CheckCircle fontSize="small" />;
      case 'CANCELLED':
        return <Error fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Chip
      label={status.replace(/_/g, ' ')}
      color={getStatusColor(status)}
      size="small"
      icon={getStatusIcon(status)}
    />
  );
};

function Dashboard() {
  const { currentUser, isAuthenticated, isTDC, isTDP, isCCRP } = useUser();
  
  // Fetch dashboard data
  const { data: datasetStats } = useQuery('datasetStats', apiService.getDatasetStats);
  const { data: users } = useQuery('users', apiService.getUsers);
  const { data: contracts } = useQuery(
    ['contracts', currentUser?.id], 
    () => apiService.getContracts(currentUser?.id || 1, { limit: 5 }),
    { enabled: !!currentUser?.id }
  );
  const { data: notifications } = useQuery(
    ['notifications', currentUser?.id], 
    () => apiService.getNotifications(currentUser?.id || 1, { limit: 5 }),
    { enabled: !!currentUser?.id }
  );
  const { data: blockchainStatus } = useQuery('blockchainStatus', apiService.getBlockchainStatus);

  // Role-based welcome message
  const getWelcomeMessage = () => {
    if (!isAuthenticated) {
      return 'Welcome to AI Training Data Contract Management';
    }
    
    switch (currentUser?.partyType) {
      case 'TDC':
        return `Welcome, ${currentUser.name}! As a Training Data Consumer, you can browse datasets and create contracts.`;
      case 'TDP':
        return `Welcome, ${currentUser.name}! As a Training Data Provider, you can manage your datasets and review contract requests.`;
      case 'CCRP':
        return `Welcome, ${currentUser.name}! As a Confidential Clean Room Provider, you can review and sign contracts.`;
      default:
        return `Welcome, ${currentUser.name}!`;
    }
  };

  // Role-based stats
  const getRoleBasedStats = () => {
    const baseStats = [
      {
        title: 'Total Datasets',
        value: datasetStats?.totalDatasets || 0,
        icon: <Storage />,
        color: 'primary',
      },
      {
        title: 'Active Contracts',
        value: contracts?.contracts?.filter(c => c.status === 'ACTIVE').length || 0,
        icon: <Description />,
        color: 'success',
      },
      {
        title: 'Unread Notifications',
        value: notifications?.notifications?.filter(n => !n.isRead).length || 0,
        icon: <Notifications />,
        color: 'warning',
      },
    ];

    // Add role-specific stats
    if (isTDC) {
      baseStats.splice(1, 0, {
        title: 'My Contracts',
        value: contracts?.contracts?.length || 0,
        icon: <Description />,
        color: 'info',
      });
    } else if (isTDP) {
      baseStats.splice(1, 0, {
        title: 'My Datasets',
        value: datasetStats?.myDatasets || 0,
        icon: <Storage />,
        color: 'info',
      });
    } else if (isCCRP) {
      baseStats.splice(1, 0, {
        title: 'Pending Approvals',
        value: contracts?.contracts?.filter(c => c.status === 'PENDING_CCRP_APPROVAL').length || 0,
        icon: <Pending />,
        color: 'info',
      });
    }

    return baseStats;
  };

  const stats = getRoleBasedStats();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
        {getWelcomeMessage()}
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Contracts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Contracts
              </Typography>
              <List>
                {contracts?.contracts?.map((contract, index) => (
                  <React.Fragment key={contract.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary={contract.contractId}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {contract.dataset?.name} • ${contract.price}
                            </Typography>
                            <StatusChip status={contract.status} />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < contracts.contracts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Notifications
              </Typography>
              <List>
                {notifications?.notifications?.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Notifications />
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < notifications.notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Blockchain Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Blockchain Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={blockchainStatus?.connected ? 'Connected' : 'Disconnected'}
                      color={blockchainStatus?.connected ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Contract Address:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {blockchainStatus?.contractAddress || 'Not deployed'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Last Block:
                  </Typography>
                  <Typography variant="body2">
                    {blockchainStatus?.lastBlock || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 