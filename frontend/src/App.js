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
import DatasetDetail from './pages/DatasetDetail';
import AddDataset from './pages/AddDataset';
import Contracts from './pages/Contracts';
import ContractDetail from './pages/ContractDetail';
import CreateRicardianContract from './pages/CreateRicardianContract';
import Users from './pages/Users';
import TSP from './pages/TSP';
import Notifications from './pages/Notifications';
import UserRegistration from './pages/UserRegistration';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import FirstLoginWizard from './pages/FirstLoginWizard.simple';
import EnterpriseDIDManagement from './pages/EnterpriseDIDManagement';
import Profile from './pages/Profile';
import TestContracts from './pages/TestContracts';
import DirectTest from './pages/DirectTest';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import TSPAzureCredentials from './pages/TSPAzureCredentials';
import TSPCloudCredentials from './pages/TSPCloudCredentials';
import InfrastructureProvisioning from './pages/InfrastructureProvisioning';
import TrainingEnvironment from './pages/TrainingEnvironment';
import TDCModelUpload from './pages/TDCModelUpload';
import TDCTraining from './pages/TDCTraining';
import EnvironmentMarketplace from './pages/EnvironmentMarketplace';
import ScittCcfDashboard from './components/ScittCcfDashboard';
import CANJobs from './pages/CANJobs';

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
  const currentPath = window.location.pathname;
  
  // Check if user is intentionally navigating to registration
  const isNavigatingToRegistration = sessionStorage.getItem('navigatingToRegistration');
  
  console.log('🛣️ [PublicRoute] Route check:', { 
    currentPath, 
    user: user ? `${user.name} (${user.partyType})` : null, 
    isInitializing,
    isNavigatingToRegistration: !!isNavigatingToRegistration
  });
  
  // Show loading while initializing
  if (isInitializing) {
    console.log('⏳ [PublicRoute] Still initializing, showing loading...');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // If user is intentionally navigating to registration, allow it regardless of user state
  if (isNavigatingToRegistration && currentPath === '/register') {
    console.log('🔗 [PublicRoute] Allowing navigation to registration (from login button)');
    return children;
  }
  
  // Only redirect if we have a VALID authenticated user
  // Don't check localStorage token directly - let UserContext validate it
  if (user) {
    console.log('👤 [PublicRoute] Authenticated user detected:', user.name);
    // Check if user needs first-login setup
    if (user.firstLogin) {
      console.log('🔐 [PublicRoute] First-login user, allowing access to public routes');
      // Allow access to public routes for first-login users
      return children;
    }
    console.log('↩️ [PublicRoute] Redirecting authenticated user to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  // If no valid user, allow access to public routes (registration, login, etc.)
  console.log('✅ [PublicRoute] No authenticated user, allowing access to public route');
  return children;
};

// Create theme
const theme = createTheme({
  shape: { borderRadius: 12 },
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // blue-600
      dark: '#1e40af',
      light: '#60a5fa',
    },
    secondary: {
      main: '#7c3aed', // violet-600
    },
    success: { main: '#16a34a' }, // green-600
    warning: { main: '#f59e0b' }, // amber-500
    error: { main: '#dc2626' }, // red-600
    info: { main: '#0ea5e9' }, // sky-500
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // slate-900
      secondary: '#475569', // slate-600
    },
    divider: 'rgba(148, 163, 184, 0.35)',
  },
  typography: {
    fontFamily:
      '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    h1: { fontWeight: 800, letterSpacing: '-0.04em' },
    h2: { fontWeight: 800, letterSpacing: '-0.035em' },
    h3: { fontWeight: 750, letterSpacing: '-0.03em' },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.55,
    },
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'light',
        },
        body: {
          backgroundImage:
            'radial-gradient(1200px 600px at 10% 0%, rgba(37, 99, 235, 0.08), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(124, 58, 237, 0.06), transparent 55%)',
          backgroundRepeat: 'no-repeat',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.35)',
          color: '#0f172a',
          boxShadow: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          borderRadius: 16,
          border: '1px solid rgba(148, 163, 184, 0.25)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          paddingLeft: 14,
          paddingRight: 14,
        },
        containedPrimary: {
          boxShadow: '0 10px 22px rgba(37, 99, 235, 0.22)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(148, 163, 184, 0.35)',
          background:
            'linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(255, 255, 255, 1) 70%)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
        notchedOutline: {
          borderColor: 'rgba(148, 163, 184, 0.5)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#0f172a',
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
      <Route path="/" element={<LandingPage />} />
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
      <Route path="/app" element={
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
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/datasets/:datasetId" element={<DatasetDetail />} />
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
              <Route path="/datasets/add" element={<AddDataset />} />
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
              <Route path="/models/upload" element={<TDCModelUpload />} />
              <Route path="/marketplace" element={<EnvironmentMarketplace />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:contractId" element={<ContractDetail />} />
              <Route path="/training" element={<TDCTraining />} />
              <Route path="/payments" element={<div>TDC Payments</div>} />
            </Routes>
          </Layout>
        </RoleProtectedRoute>
      } />
      
      {/* Legacy CCRP URLs → TSP */}
      <Route path="/ccrp/*" element={<Navigate to="/tsp" replace />} />
      
      {/* TSP Routes */}
      <Route path="/tsp/*" element={
        <RoleProtectedRoute allowedRoles={['TSP', 'AppAdmin']}>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/tsp/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardSelector />} />
              <Route path="/environments" element={<div>TSP Environments</div>} />
              <Route path="/environments/:envId" element={<div>TSP Environment Details</div>} />
              <Route path="/azure-credentials" element={<TSPAzureCredentials />} />
              <Route path="/cloud-credentials" element={<TSPCloudCredentials />} />
              <Route path="/infrastructure" element={<InfrastructureProvisioning />} />
              <Route path="/training-environment" element={<TrainingEnvironment />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:contractId" element={<ContractDetail />} />
              <Route path="/attestation" element={<div>TSP Attestation</div>} />
              <Route path="/resources" element={<div>TSP Resources</div>} />
              <Route path="/analytics" element={<div>TSP Analytics</div>} />
              <Route path="/security" element={<div>TSP Security</div>} />
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
      <Route path="/datasets/:datasetId" element={
        <ProtectedRoute>
          <Layout>
            <DatasetDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/datasets/add" element={
        <ProtectedRoute>
          <Layout>
            <AddDataset />
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
        <RoleProtectedRoute allowedRoles={['TDC']}>
          <Layout>
            <CreateRicardianContract />
          </Layout>
        </RoleProtectedRoute>
      } />
      <Route path="/contracts/create-ricardian" element={
        <RoleProtectedRoute allowedRoles={['TDC']}>
          <Layout>
            <CreateRicardianContract />
          </Layout>
        </RoleProtectedRoute>
      } />
      <Route path="/tsp" element={
        <RoleProtectedRoute allowedRoles={['TSP', 'AppAdmin']}>
          <Layout>
            <TSP />
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

      <Route path="/can/jobs" element={
        <ProtectedRoute>
          <Layout>
            <CANJobs />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Test Routes */}
      <Route path="/test-contracts" element={<TestContracts />} />
      <Route path="/direct-test" element={<DirectTest />} />
      
      {/* Legacy route redirect */}
      <Route path="/user-registration" element={<Navigate to="/register" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
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