import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Storage,
  Description,
  People,
  TrendingUp,
  Add,
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import DIDInfoCard from '../components/DIDInfoCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser: user } = useUser();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery('dashboard', async () => {
    const [datasetsRes, contractsRes, usersRes] = await Promise.all([
      apiService.get('/api/datasets/public'),
      apiService.get('/api/contracts'),
      apiService.get('/api/users')
    ]);

    return {
      datasets: datasetsRes.data.datasets || [],
      contracts: contractsRes.data.contracts || [],
      users: usersRes.data.users || []
    };
  });

  const datasets = dashboardData?.datasets || [];
  const contracts = dashboardData?.contracts || [];
  const users = dashboardData?.users || [];

  // Calculate metrics
  const totalDatasets = datasets.length;
  const totalContracts = contracts.length;
  const totalUsers = users.length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const pendingContracts = contracts.filter(c => c.status.includes('PENDING')).length;

  // Get recent activities
  const recentContracts = contracts.slice(0, 5);
  const recentDatasets = datasets.slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Typography>Loading dashboard...</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 mb-2">
            Dashboard
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Welcome back, {user?.name || 'User'}! Here's an overview of your contract management system.
          </Typography>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/contracts/create')}
          >
                          Create Contract
          </Button>
          <Button
            variant="outlined"
            startIcon={<Storage />}
            onClick={() => navigate('/datasets')}
          >
            Browse Datasets
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Total Datasets
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {totalDatasets}
                  </Typography>
                </div>
                <Storage className="text-blue-600 text-3xl" />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Total Contracts
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {totalContracts}
                  </Typography>
                </div>
                <Description className="text-green-600 text-3xl" />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Active Contracts
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {activeContracts}
                  </Typography>
                </div>
                <TrendingUp className="text-purple-600 text-3xl" />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {totalUsers}
                  </Typography>
                </div>
                <People className="text-orange-600 text-3xl" />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DID Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DIDInfoCard 
            did={user?.did}
            didSource={user?.didSource}
            didVerified={user?.didVerified}
            didVerificationMethod={user?.didVerificationMethod}
            isEnterprise={user?.did?.startsWith('did:web:')}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                User Profile
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Name
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {user?.name || 'Not provided'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {user?.email || 'Not provided'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Role
                </Typography>
                <Chip 
                  label={user?.partyType || 'Unknown'} 
                  color="primary" 
                  size="small"
                />
              </Box>
              {user?.organization && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Organization
                  </Typography>
                  <Typography variant="body1" className="font-medium">
                    {user.organization}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        {/* Recent Contracts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-medium">
                  Recent Contracts
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/contracts')}
                >
                  View All
                </Button>
              </div>
              
              {recentContracts.length > 0 ? (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Contract ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Parties</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentContracts.map((contract) => (
                        <TableRow key={contract.id} hover>
                          <TableCell>
                            <Typography variant="body2" className="font-medium">
                              #{contract.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={contract.status}
                              color={getStatusColor(contract.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" className="text-gray-600">
                              {contract.tdpName} → {contract.tdcName}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box className="text-center py-8">
                  <Typography color="textSecondary">
                    No contracts found
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/contracts/create')}
                    className="mt-2"
                  >
                    Create First Contract
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Datasets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-medium">
                  Recent Datasets
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/datasets')}
                >
                  View All
                </Button>
              </div>
              
              {recentDatasets.length > 0 ? (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Dataset</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentDatasets.map((dataset) => (
                        <TableRow key={dataset.id} hover>
                          <TableCell>
                            <Typography variant="body2" className="font-medium">
                              {dataset.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={dataset.category}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" className="font-medium">
                              ${dataset.price}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box className="text-center py-8">
                  <Typography color="textSecondary">
                    No datasets found
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/datasets')}
                    className="mt-2"
                  >
                    Browse Datasets
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                System Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Typography variant="h4" className="font-bold text-blue-600">
                      {pendingContracts}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Pending Contracts
                    </Typography>
                  </div>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Typography variant="h4" className="font-bold text-green-600">
                      {users.filter(u => u.partyType === 'TDP').length}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Data Providers
                    </Typography>
                  </div>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Typography variant="h4" className="font-bold text-purple-600">
                      {users.filter(u => u.partyType === 'TDC').length}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Data Consumers
                    </Typography>
                  </div>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Typography variant="h4" className="font-bold text-orange-600">
                      {users.filter(u => u.partyType === 'CCRP').length}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      CCR Providers
                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard; 