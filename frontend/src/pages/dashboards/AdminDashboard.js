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
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  People,
  Description,
  Storage,
  TrendingUp,
  Security,
  Warning,
  CheckCircle,
  Error,
  Visibility,
  Settings,
  Assessment,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { apiService } from '../../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser: user, isInitializing } = useUser();

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['adminDashboard', user?.id],
    async () => {
      const [usersRes, contractsRes, datasetsRes, breachesRes, complianceRes] = await Promise.all([
        apiService.get('/api/admin/users'),
        apiService.get('/api/admin/contracts'),
        apiService.get('/api/admin/datasets'),
        apiService.get('/api/admin/data-breaches'),
        apiService.get('/api/admin/compliance')
      ]);

      return {
        users: usersRes.data.users || [],
        contracts: contractsRes.data.contracts || [],
        datasets: datasetsRes.data.datasets || [],
        breaches: breachesRes.data.breaches || [],
        compliance: complianceRes.data.compliance || {}
      };
    },
    {
      enabled: !!user?.id && !isInitializing, // Only run when user is authenticated and not initializing
      retry: 3,
      staleTime: 30000, // Consider data fresh for 30 seconds
    }
  );

  const users = dashboardData?.users || [];
  const contracts = dashboardData?.contracts || [];
  const datasets = dashboardData?.datasets || [];
  const breaches = dashboardData?.breaches || [];
  const compliance = dashboardData?.compliance || {};

  // Calculate metrics
  const totalUsers = users.length;
  const totalContracts = contracts.length;
  const totalDatasets = datasets.length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const pendingContracts = contracts.filter(c => c.status.includes('PENDING')).length;
  const activeBreaches = breaches.filter(b => b.status !== 'RESOLVED').length;
  const complianceScore = compliance.score || 0;

  // Get recent activities
  const recentUsers = users.slice(0, 5);
  const recentContracts = contracts.slice(0, 5);
  const recentBreaches = breaches.slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getBreachSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  // Show loading state when user is initializing or data is loading
  if (isInitializing || isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>
          {isInitializing ? 'Initializing user session...' : 'Loading admin dashboard...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading admin dashboard: {error.message}
      </Alert>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 mb-2">
            System Administration Dashboard
          </Typography>
          <Typography variant="body1" className="text-gray-600 mb-2">
            Monitor system health, manage users, and ensure overall system security and compliance. 
            Complete audit trails and system analytics available.
          </Typography>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<People />}
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/admin/analytics')}
          >
            System Analytics
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {activeBreaches > 0 && (
        <Alert severity="warning" className="mb-4">
          <Typography variant="h6">System Alert</Typography>
          <Typography>
            {activeBreaches} active data breach{activeBreaches > 1 ? 'es' : ''} require{activeBreaches > 1 ? '' : 's'} attention.
          </Typography>
        </Alert>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3}>
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
                <People className="text-blue-600 text-3xl" />
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
                    Total Datasets
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {totalDatasets}
                  </Typography>
                </div>
                <Storage className="text-orange-600 text-3xl" />
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

      {/* Compliance & Security */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                DPDP Compliance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Compliance Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={complianceScore} 
                      color={complianceScore >= 80 ? 'success' : complianceScore >= 60 ? 'warning' : 'error'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {complianceScore}%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Data Breaches
                </Typography>
                <Chip 
                  label={activeBreaches} 
                  color={activeBreaches > 0 ? 'error' : 'success'}
                  icon={activeBreaches > 0 ? <Warning /> : <CheckCircle />}
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<Security />}
                onClick={() => navigate('/admin/compliance')}
                size="small"
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                System Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pending Contracts
                </Typography>
                <Chip 
                  label={pendingContracts} 
                  color={pendingContracts > 0 ? 'warning' : 'success'}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  User Registration Status
                </Typography>
                <Chip 
                  label={`${users.filter(u => u.isRegistered).length}/${totalUsers} Registered`}
                  color="info"
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={() => navigate('/admin/system')}
                size="small"
              >
                System Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Recent Users
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          <Chip label={user.partyType} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.isRegistered ? 'Registered' : 'Pending'} 
                            color={user.isRegistered ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate(`/profile/${user.id}`)}
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

        {/* Recent Data Breaches */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Recent Data Breaches
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentBreaches.map((breach) => (
                      <TableRow key={breach.id}>
                        <TableCell>{breach.breachType}</TableCell>
                        <TableCell>
                          <Chip 
                            label={breach.severity} 
                            color={getBreachSeverityColor(breach.severity)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={breach.status} 
                            color={breach.status === 'RESOLVED' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate(`/admin/breaches/${breach.id}`)}
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
              startIcon={<People />}
              onClick={() => navigate('/admin/users')}
            >
              Manage Users
            </Button>
            <Button
              variant="contained"
              startIcon={<Description />}
              onClick={() => navigate('/admin/contracts')}
            >
              View All Contracts
            </Button>
            <Button
              variant="contained"
              startIcon={<Security />}
              onClick={() => navigate('/admin/compliance')}
            >
              DPDP Compliance
            </Button>
            <Button
              variant="contained"
              startIcon={<Assessment />}
              onClick={() => navigate('/admin/analytics')}
            >
              System Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<Settings />}
              onClick={() => navigate('/admin/system')}
            >
              System Settings
            </Button>
            <Button
              variant="contained"
              startIcon={<StorageIcon />}
              onClick={() => navigate('/admin/scitt-ccf')}
            >
              SCITT CCF Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 