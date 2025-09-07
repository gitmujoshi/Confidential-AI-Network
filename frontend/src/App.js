import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Import token manager for automatic token cleaning
import './utils/tokenManager';

// Contexts
import { UserProvider, useUser } from './contexts/UserContext';

// Components
import Layout from './components/Layout';
import DashboardSelector from './components/dashboards/DashboardSelector';
import Datasets from './pages/Datasets';
import Contracts from './pages/Contracts';
import ContractDetail from './pages/ContractDetail';
import CreateRicardianContract from './pages/CreateRicardianContract';
import Users from './pages/Users';
import CCRP from './pages/CCRP';
import Notifications from './pages/Notifications';
import UserRegistration from './pages/UserRegistration';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FirstLoginWizard from './pages/FirstLoginWizard.simple';
import EnterpriseDIDManagement from './pages/EnterpriseDIDManagement';
import Profile from './pages/Profile';
import TestContracts from './pages/TestContracts';
import DirectTest from './pages/DirectTest';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import CCRPAzureCredentials from './pages/CCRPAzureCredentials';
import CCRPCloudCredentials from './pages/CCRPCloudCredentials';
import InfrastructureProvisioning from './pages/InfrastructureProvisioning';
import TrainingEnvironment from './pages/TrainingEnvironment';
import ScittCcfDashboard from './components/ScittCcfDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser: user, isInitializing } = useUser();
  const token = localStorage.getItem('authToken');
  
  // Show loading while initializing
  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // If token exists but no user yet, show loading
  if (token && !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Authenticating...</div>
      </div>
    );
  }
  
  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser: user, isInitializing } = useUser();
  const token = localStorage.getItem('authToken');
  
  // Show loading while initializing
  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // If user is authenticated, redirect to dashboard
  // BUT: Don't redirect if user needs first-login setup
  if (user || token) {
    // Check if user needs first-login setup
    if (user && user.firstLogin) {
      // Allow access to public routes for first-login users
      return children;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <UserRegistration />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      } />
      <Route path="/reset-password" element={
        <PublicRoute>
          <ResetPassword />
        </PublicRoute>
      } />
      
      <Route path="/first-login" element={<FirstLoginWizard />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Navigate to="/dashboard" replace />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Role-Based Dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <DashboardSelector />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <RoleProtectedRoute allowedRoles={['AppAdmin']}>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardSelector />} />
              <Route path="/users" element={<Users />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/analytics" element={<div>Admin Analytics</div>} />
              <Route path="/compliance" element={<div>DPDP Compliance</div>} />
              <Route path="/system" element={<div>System Settings</div>} />
<Route path="/scitt-ccf" element={<ScittCcfDashboard />} />
<Route path="/breaches/:breachId" element={<div>Data Breach Details</div>} />
            </Routes>
          </Layout>
        </RoleProtectedRoute>
      } />
      
      {/* TDP Routes */}
      <Route path="/tdp/*" element={
        <RoleProtectedRoute allowedRoles={['TDP']}>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/tdp/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardSelector />} />
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/datasets/:datasetId" element={<div>TDP Dataset Details</div>} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:contractId" element={<ContractDetail />} />
              <Route path="/payments" element={<div>TDP Payments</div>} />
              <Route path="/analytics" element={<div>TDP Analytics</div>} />
            </Routes>
          </Layout>
        </RoleProtectedRoute>
      } />
      
      {/* TDC Routes */}
      <Route path="/tdc/*" element={
        <RoleProtectedRoute allowedRoles={['TDC']}>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/tdc/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardSelector />} />
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/datasets/:datasetId" element={<div>TDC Dataset Details</div>} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:contractId" element={<ContractDetail />} />
              <Route path="/training" element={<div>TDC Training Progress</div>} />
              <Route path="/payments" element={<div>TDC Payments</div>} />
            </Routes>
          </Layout>
        </RoleProtectedRoute>
      } />
      
      {/* CCRP Routes */}
      <Route path="/ccrp/*" element={
        <RoleProtectedRoute allowedRoles={['CCRP', 'AppAdmin']}>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/ccrp/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardSelector />} />
              <Route path="/environments" element={<div>CCRP Environments</div>} />
              <Route path="/environments/:envId" element={<div>CCRP Environment Details</div>} />
              <Route path="/azure-credentials" element={<CCRPAzureCredentials />} />
              <Route path="/cloud-credentials" element={<CCRPCloudCredentials />} />
              <Route path="/infrastructure" element={<InfrastructureProvisioning />} />
              <Route path="/training-environment" element={<TrainingEnvironment />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:contractId" element={<ContractDetail />} />
              <Route path="/attestation" element={<div>CCRP Attestation</div>} />
              <Route path="/resources" element={<div>CCRP Resources</div>} />
              <Route path="/analytics" element={<div>CCRP Analytics</div>} />
              <Route path="/security" element={<div>CCRP Security</div>} />
            </Routes>
          </Layout>
        </RoleProtectedRoute>
      } />
      
      {/* Shared Routes (accessible to all authenticated users) */}
      <Route path="/datasets" element={
        <ProtectedRoute>
          <Layout>
            <Datasets />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/contracts" element={
        <ProtectedRoute>
          <Layout>
            <Contracts />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/contracts/:contractId" element={
        <ProtectedRoute>
          <Layout>
            <ContractDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/contracts/create" element={
        <ProtectedRoute>
          <Layout>
            <CreateRicardianContract />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/contracts/create-ricardian" element={
        <ProtectedRoute>
          <Layout>
            <CreateRicardianContract />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/ccrp" element={
        <RoleProtectedRoute allowedRoles={['CCRP', 'AppAdmin']}>
          <Layout>
            <CCRP />
          </Layout>
        </RoleProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Layout>
            <Notifications />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/enterprise-did" element={
        <ProtectedRoute>
          <Layout>
            <EnterpriseDIDManagement />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile/:userId" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Test Routes */}
      <Route path="/test-contracts" element={<TestContracts />} />
      <Route path="/direct-test" element={<DirectTest />} />
      
      {/* Legacy route redirect */}
      <Route path="/user-registration" element={<Navigate to="/register" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
          </Router>
          <Toaster position="top-right" />
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 