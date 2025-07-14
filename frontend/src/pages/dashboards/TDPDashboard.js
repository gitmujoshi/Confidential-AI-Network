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
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { apiService } from '../../services/api';

const TDPDashboard = () => {
  const navigate = useNavigate();
  const { currentUser: user } = useUser();

  // Fetch TDP dashboard data
  const { data: dashboardData, isLoading, error } = useQuery('tdpDashboard', async () => {
    const [datasetsRes, contractsRes, paymentsRes, analyticsRes] = await Promise.all([
      apiService.get(`/api/tdp/datasets/${user.id}`),
      apiService.get(`/api/tdp/contracts/${user.id}`),
      apiService.get(`/api/tdp/payments/${user.id}`),
      apiService.get(`/api/tdp/analytics/${user.id}`)
    ]);

    return {
      datasets: datasetsRes.data.datasets || [],
      contracts: contractsRes.data.contracts || [],
      payments: paymentsRes.data.payments || {},
      analytics: analyticsRes.data.analytics || {}
    };
  });

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

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading TDP dashboard...</Typography>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 mb-2">
            TDP Dashboard
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Manage your datasets and track contract performance
          </Typography>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/tdp/datasets/create')}
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
                        <TableCell>{contract.contractId}</TableCell>
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
              onClick={() => navigate('/tdp/datasets/create')}
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
              onClick={() => navigate('/tdp/datasets')}
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