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
  LinearProgress,
} from '@mui/material';
import {
  Storage,
  Description,
  Add,
  TrendingUp,
  Payment,
  Search,
  PlayArrow,
  CheckCircle,
  Pending,
  Assessment,
  Security,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { apiService } from '../../services/api';

const TDCDashboard = () => {
  const navigate = useNavigate();
  const { currentUser: user, isInitializing } = useUser();

  // Fetch TDC dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['tdcDashboard', user?.id],
    async () => {
      // Ensure we have a valid user
      if (!user || !user.id) {
        throw new Error('User not available');
      }

      console.log('🔍 TDC Dashboard - User:', user);

      try {
        const [datasetsRes, contractsRes] = await Promise.all([
          apiService.getDatasets({}, user), // Use proper getDatasets with user context
          apiService.getContracts(user.id, user) // Use proper getContracts with user context
        ]);

        return {
          datasets: datasetsRes.datasets || [],
          contracts: contractsRes.contracts || [],
          training: [], // Will be implemented later
          payments: { totalSpent: 0 } // Will be implemented later
        };
      } catch (error) {
        console.error('❌ TDC Dashboard API Error:', error);
        throw error;
      }
    },
    {
      enabled: !!user?.id && !isInitializing, // Only run when user is authenticated and not initializing
      retry: 3,
      staleTime: 30000, // Consider data fresh for 30 seconds
      onError: (error) => {
        console.error('❌ TDC Dashboard Error:', error);
      }
    }
  );

  const datasets = dashboardData?.datasets || [];
  const contracts = dashboardData?.contracts || [];
  const training = dashboardData?.training || [];
  const payments = dashboardData?.payments || {};

  // Calculate metrics
  const totalDatasets = datasets.length;
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const pendingContracts = contracts.filter(c => c.status.includes('PENDING')).length;
  const totalSpent = payments.totalSpent || 0;
  const activeTraining = training.filter(t => t.status === 'ACTIVE').length;

  // Get recent activities
  const recentContracts = contracts.slice(0, 5);
  const recentTraining = training.slice(0, 5);
  const popularDatasets = datasets.slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Show loading state when user is initializing or data is loading
  if (isInitializing || isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>
          {isInitializing ? 'Initializing user session...' : 'Loading TDC dashboard...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ color: 'error.main' }}>
        Error loading TDC dashboard: {error.message}
      </Box>
    );
  }

  // Show message if user is not authenticated
  if (!user?.id) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Please log in to view your dashboard
        </Typography>
      </Box>
    );
  }

  return (
    <div className="space-y-6" style={{ paddingTop: '16px' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 mb-2">
            Welcome to Your TDC Dashboard
          </Typography>
          <Typography variant="body1" className="text-gray-600 mb-2">
            Browse available datasets, create training contracts, and monitor your AI training progress. 
            All contracts ensure DPDP compliance with privacy-preserving techniques.
          </Typography>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/tdc/contracts/create')}
          >
            Create Contract
          </Button>
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={() => navigate('/tdc/datasets')}
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
                    Available Datasets
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
                    My Contracts
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
                    Active Training
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {activeTraining}
                  </Typography>
                </div>
                <PlayArrow className="text-purple-600 text-3xl" />
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
                    Total Spent
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {formatCurrency(totalSpent)}
                  </Typography>
                </div>
                <Payment className="text-orange-600 text-3xl" />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DEPA ID Card */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Your DEPA ID
                  </Typography>
                  <Typography variant="h6" className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {user?.depaId || 'Not assigned'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Digital Personal Data Protection ID for privacy compliance
                  </Typography>
                </div>
                <Security className="text-indigo-600 text-3xl" />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Training Progress & Cost Analytics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Training Progress
              </Typography>
              {recentTraining.length > 0 ? (
                <Box>
                  {recentTraining.map((training) => (
                    <Box key={training.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {training.modelName}
                        </Typography>
                        <Chip 
                          label={training.status} 
                          color={getStatusColor(training.status)}
                          size="small"
                        />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={training.progress || 0} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {training.progress || 0}% Complete
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active training sessions
                </Typography>
              )}
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => navigate('/tdc/training')}
                size="small"
                sx={{ mt: 2 }}
              >
                View All Training
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Cost Analytics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This Month
                </Typography>
                <Typography variant="h5" className="font-bold text-red-600">
                  {formatCurrency(payments.monthlySpent || 0)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Month
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(payments.lastMonthSpent || 0)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Contract Value
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(payments.averageContractValue || 0)}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Payment />}
                onClick={() => navigate('/tdc/payments')}
                size="small"
              >
                Payment History
              </Button>
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
              <Typography variant="h6" className="font-medium mb-4">
                Recent Contracts
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Contract ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <Box sx={{ minWidth: '180px' }}>
                            {/* Contract ID Field */}
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="textSecondary" display="block">
                                Contract ID (Ricardian)
                              </Typography>
                              <Typography variant="body2" fontFamily="monospace" fontWeight="medium" sx={{ 
                                backgroundColor: 'grey.100', 
                                padding: '4px 8px', 
                                borderRadius: '3px',
                                border: '1px solid',
                                borderColor: 'grey.300',
                                fontSize: '0.75rem'
                              }}>
                                {contract.contractId || 'NULL'}
                              </Typography>
                            </Box>
                            
                            {/* DEPA ID Field */}
                            {contract.depaId && (
                              <Box>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  DEPA ID
                                </Typography>
                                <Typography variant="caption" fontFamily="monospace" sx={{ 
                                  backgroundColor: 'primary.50', 
                                  padding: '4px 8px', 
                                  borderRadius: '3px',
                                  border: '1px solid',
                                  borderColor: 'primary.200',
                                  color: 'primary.700',
                                  fontSize: '0.7rem'
                                }}>
                                  {contract.depaId}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={contract.status} 
                            color={getStatusColor(contract.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(contract.totalPrice || contract.price)}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate(`/tdc/contracts/${contract.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Popular Datasets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Popular Datasets
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dataset</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {popularDatasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell>{dataset.name}</TableCell>
                        <TableCell>
                          <Chip label={dataset.category} size="small" />
                        </TableCell>
                        <TableCell>{formatCurrency(dataset.price)}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate(`/tdc/datasets/${dataset.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" className="font-medium mb-4">
            Quick Actions
          </Typography>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/tdc/contracts/create')}
            >
              Create Contract
            </Button>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={() => navigate('/tdc/datasets')}
            >
              Browse Datasets
            </Button>
            <Button
              variant="contained"
              startIcon={<Description />}
              onClick={() => navigate('/tdc/contracts')}
            >
              My Contracts
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => navigate('/tdc/training')}
            >
              Training Progress
            </Button>
            <Button
              variant="contained"
              startIcon={<Payment />}
              onClick={() => navigate('/tdc/payments')}
            >
              Payment History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TDCDashboard; 