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
  Payment,
  TrendingUp,
  Add,
  Visibility,
  CheckCircle,
  Pending,
  MonetizationOn,
  Assessment,
  Security,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { apiService } from '../../services/api';

const TDPDashboard = () => {
  const navigate = useNavigate();
  const { currentUser: user, isInitializing } = useUser();

  // Fetch TDP dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['tdpDashboard', user?.id],
    async () => {
      const [datasetsRes, contractsRes] = await Promise.all([
        apiService.getDatasets({}, user), // Use proper getDatasets with user context
        apiService.getContracts(user.id, user) // Use proper getContracts with user context
      ]);

      return {
        datasets: datasetsRes.datasets || [],
        contracts: contractsRes.contracts || [],
        payments: { totalRevenue: 0, pendingAmount: 0 }, // Will be implemented later
        analytics: {} // Will be implemented later
      };
    },
    {
      enabled: !!user?.id && !isInitializing, // Only run when user is authenticated and not initializing
      retry: 3,
      staleTime: 30000, // Consider data fresh for 30 seconds
    }
  );

  const datasets = dashboardData?.datasets || [];
  const contracts = dashboardData?.contracts || [];
  const payments = dashboardData?.payments || {};
  const analytics = dashboardData?.analytics || {};

  // Calculate metrics
  const totalDatasets = datasets.length;
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const pendingContracts = contracts.filter(c => c.status.includes('PENDING')).length;
  const totalRevenue = payments.totalRevenue || 0;
  const pendingPayments = payments.pendingAmount || 0;

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
          {isInitializing ? 'Initializing user session...' : 'Loading TDP dashboard...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ color: 'error.main' }}>
        Error loading TDP dashboard: {error.message}
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
            Welcome to Your TDP Dashboard
          </Typography>
          <Typography variant="body1" className="text-gray-600 mb-2">
            Manage your datasets, respond to contract requests, and track your revenue. 
            All your datasets have unique DEPA IDs for compliance tracking.
          </Typography>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/datasets/add')}
          >
            Create Dataset
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/tdp/analytics')}
          >
            View Analytics
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
                    My Datasets
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
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {formatCurrency(totalRevenue)}
                  </Typography>
                </div>
                <MonetizationOn className="text-purple-600 text-3xl" />
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
                    Pending Payments
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {formatCurrency(pendingPayments)}
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

      {/* Revenue & Analytics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Revenue Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This Month
                </Typography>
                <Typography variant="h5" className="font-bold text-green-600">
                  {formatCurrency(analytics.monthlyRevenue || 0)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Month
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(analytics.lastMonthRevenue || 0)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Growth Rate
                </Typography>
                <Chip 
                  label={`${analytics.growthRate || 0}%`}
                  color={analytics.growthRate > 0 ? 'success' : 'error'}
                  icon={analytics.growthRate > 0 ? <TrendingUp /> : null}
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<Payment />}
                onClick={() => navigate('/tdp/payments')}
                size="small"
              >
                View All Payments
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Contract Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Contracts
                </Typography>
                <Chip 
                  label={activeContracts} 
                  color="success"
                  icon={<CheckCircle />}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pending Contracts
                </Typography>
                <Chip 
                  label={pendingContracts} 
                  color="warning"
                  icon={<Pending />}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Success Rate
                </Typography>
                <Chip 
                  label={`${analytics.successRate || 0}%`}
                  color="info"
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<Description />}
                onClick={() => navigate('/tdp/contracts')}
                size="small"
              >
                View All Contracts
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
                Recent Contract Requests
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
                        <TableCell>{formatCurrency(contract.price)}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate(`/tdp/contracts/${contract.id}`)}
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

        {/* My Datasets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                My Datasets
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
                    {recentDatasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell>{dataset.name}</TableCell>
                        <TableCell>
                          <Chip label={dataset.category} size="small" />
                        </TableCell>
                        <TableCell>{formatCurrency(dataset.price)}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate(`/tdp/datasets/${dataset.id}`)}
                          >
                            Edit
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
              onClick={() => navigate('/datasets/add')}
            >
              Create Dataset
            </Button>
            <Button
              variant="contained"
              startIcon={<Description />}
              onClick={() => navigate('/tdp/contracts')}
            >
              View Contracts
            </Button>
            <Button
              variant="contained"
              startIcon={<Payment />}
              onClick={() => navigate('/tdp/payments')}
            >
              Payment History
            </Button>
            <Button
              variant="contained"
              startIcon={<Assessment />}
              onClick={() => navigate('/tdp/analytics')}
            >
              Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<Storage />}
              onClick={() => navigate('/datasets')}
            >
              Manage Datasets
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TDPDashboard; 