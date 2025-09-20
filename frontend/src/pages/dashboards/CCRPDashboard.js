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
  Alert,
} from '@mui/material';
import {
  Security,
  Description,
  Memory,
  CheckCircle,
  Warning,
  Settings,
  Assessment,
  PlayArrow,
  Verified,
  Storage,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { apiService } from '../../services/api';
import CloudProviderManager from '../../components/CloudProviderManager';
import CCRPEnvironmentMonitoring from '../../components/CCRPEnvironmentMonitoring';

const CCRPDashboard = () => {
  const navigate = useNavigate();
  const { currentUser: user, isInitializing } = useUser();

  // Debug logging
  console.log('🔍 [CCRPDashboard] Current user:', user);

  // Fetch CCRP dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['ccrpDashboard', user?.id],
    async () => {
      console.log('🔍 [CCRPDashboard] Fetching dashboard for user ID:', user?.id);
      // Use available endpoints for now
      const [environmentsRes, contractsRes] = await Promise.all([
        apiService.get('/api/infrastructure/environments'),
        apiService.get('/api/contracts')
      ]);
      
      return {
        user: user,
        environments: environmentsRes.data.environments || [],
        activeContracts: contractsRes.data.contracts || [],
        resourceUtilization: { cpuUtilization: 0, memoryUtilization: 0 }, // Will be implemented later
        securityMetrics: { verifiedCount: 0 } // Will be implemented later
      };
    },
    {
      enabled: !!user?.id && !isInitializing, // Only run when user is authenticated and not initializing
      retry: 3,
      staleTime: 30000, // Consider data fresh for 30 seconds
    }
  );

  const ccrpUser = dashboardData?.user || {};
  const environments = dashboardData?.environments || [];
  const contracts = dashboardData?.activeContracts || [];
  const resources = dashboardData?.resourceUtilization || {};
  const attestation = dashboardData?.securityMetrics || {};

  // Calculate metrics
  const totalEnvironments = environments.length;
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const pendingContracts = contracts.filter(c => c.status.includes('PENDING')).length;
  const cpuUtilization = resources.cpuUtilization || 0;
  const memoryUtilization = resources.memoryUtilization || 0;
  const verifiedAttestations = attestation.verifiedCount || 0;

  // Get recent activities
  const recentEnvironments = environments.slice(0, 5);
  const recentContracts = contracts.slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getEnvironmentStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'success';
      case 'STARTING': return 'warning';
      case 'STOPPED': return 'error';
      case 'MAINTENANCE': return 'info';
      default: return 'default';
    }
  };

  // Show loading state when user is initializing or data is loading
  if (isInitializing || isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>
          {isInitializing ? 'Initializing user session...' : 'Loading CCRP dashboard...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ color: 'error.main' }}>
        Error loading CCRP dashboard: {error.message}
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
            Welcome to Your CCRP Dashboard
          </Typography>
          <Typography variant="body1" className="text-gray-600 mb-2">
            Provide secure computing environments for AI training. Monitor secure data processing 
            and ensure privacy and security compliance standards.
          </Typography>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<Settings />}
            onClick={() => navigate('/ccrp/infrastructure')}
          >
            Infrastructure
          </Button>
          <Button
            variant="outlined"
            startIcon={<Security />}
                          onClick={() => navigate('/ccrp/cloud-credentials')}
          >
            Azure Credentials
          </Button>
          <Button
            variant="outlined"
            startIcon={<PlayArrow />}
            onClick={() => navigate('/ccrp/training-environment')}
          >
            Training Environment
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {(cpuUtilization > 80 || memoryUtilization > 80) && (
        <Alert severity="warning" className="mb-4">
          <Typography variant="h6">Resource Alert</Typography>
          <Typography>
            High resource utilization detected. CPU: {cpuUtilization}%, Memory: {memoryUtilization}%
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
                    Active Environments
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {totalEnvironments}
                  </Typography>
                </div>
                <Security className="text-blue-600 text-3xl" />
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
                    Verified Attestations
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {verifiedAttestations}
                  </Typography>
                </div>
                <Verified className="text-purple-600 text-3xl" />
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
                    CPU Utilization
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {cpuUtilization}%
                  </Typography>
                </div>
                <Memory className="text-orange-600 text-3xl" />
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

      {/* Cloud Providers Management */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CloudProviderManager 
            userId={user.id}
            currentProviders={ccrpUser.cloudProviders || []}
            description={ccrpUser.description || ''}
          />
        </Grid>
      </Grid>

      {/* Resource Monitoring & Attestation Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Resource Monitoring
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  CPU Utilization
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={cpuUtilization} 
                      color={cpuUtilization > 80 ? 'error' : cpuUtilization > 60 ? 'warning' : 'success'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {cpuUtilization}%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Memory Utilization
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flex: 1, mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={memoryUtilization} 
                      color={memoryUtilization > 80 ? 'error' : memoryUtilization > 60 ? 'warning' : 'success'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {memoryUtilization}%
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => navigate('/ccrp/resources')}
                size="small"
              >
                Detailed Monitoring
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Attestation Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Verified Attestations
                </Typography>
                <Chip 
                  label={verifiedAttestations} 
                  color="success"
                  icon={<CheckCircle />}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Pending Verification
                </Typography>
                <Chip 
                  label={attestation.pendingCount || 0} 
                  color="warning"
                  icon={<Warning />}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Security Score
                </Typography>
                <Chip 
                  label={`${attestation.securityScore || 0}%`}
                  color="info"
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<Verified />}
                onClick={() => navigate('/ccrp/attestation')}
                size="small"
              >
                Manage Attestations
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        {/* Recent Environments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Recent Environments
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Environment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Resources</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEnvironments.map((env) => (
                      <TableRow key={env.id}>
                        <TableCell>{env.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={env.status} 
                            color={getEnvironmentStatusColor(env.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{env.resourceType}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate(`/ccrp/environments/${env.id}`)}
                          >
                            Manage
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

        {/* Recent Contracts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="font-medium mb-4">
                Recent Contract Executions
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Contract ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Environment</TableCell>
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
                            
                            {/* Global DEPA ID Field */}
                            {contract.depaId && (
                              <Box>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Global DEPA ID
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
                        <TableCell>{contract.environmentName || 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => navigate(`/ccrp/contracts/${contract.id}`)}
                          >
                            Monitor
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
              startIcon={<Settings />}
              onClick={() => navigate('/ccrp/environments/create')}
            >
              Create Environment
            </Button>
            <Button
              variant="contained"
              startIcon={<Description />}
              onClick={() => navigate('/ccrp/contracts')}
            >
              Monitor Contracts
            </Button>
            <Button
              variant="contained"
              startIcon={<Verified />}
              onClick={() => navigate('/ccrp/attestation')}
            >
              Manage Attestations
            </Button>
            <Button
              variant="contained"
              startIcon={<Assessment />}
              onClick={() => navigate('/ccrp/analytics')}
            >
              Performance Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<Security />}
              onClick={() => navigate('/ccrp/security')}
            >
              Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Environment Monitoring Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <CCRPEnvironmentMonitoring />
        </CardContent>
      </Card>
    </div>
  );
};

export default CCRPDashboard; 