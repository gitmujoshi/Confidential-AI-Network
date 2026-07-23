import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
// Visual language: Stripe Dashboard + Linear — calm surfaces, sharp type, restrained chrome.
const theme = createTheme({
  shape: { borderRadius: 10 },
  palette: {
    mode: 'light',
    primary: {
      main: '#0b6bcb',
      dark: '#08498a',
      light: '#3b8dd9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#334155',
      dark: '#1e293b',
      light: '#64748b',
    },
    success: { main: '#0f766e' },
    warning: { main: '#b45309' },
    error: { main: '#b91c1c' },
    info: { main: '#0369a1' },
    background: {
      default: '#f4f6f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#0b1220',
      secondary: '#64748b',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.15 },
    h2: { fontWeight: 750, letterSpacing: '-0.03em', lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25 },
    h4: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
    h5: { fontWeight: 650, letterSpacing: '-0.015em', lineHeight: 1.35 },
    h6: { fontWeight: 650, letterSpacing: '-0.01em', lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 600, letterSpacing: '-0.005em' },
    body1: { lineHeight: 1.65, letterSpacing: '-0.005em' },
    body2: { lineHeight: 1.55, letterSpacing: '-0.005em' },
    button: { fontWeight: 600, letterSpacing: '-0.01em' },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.08em',
      fontSize: '0.7rem',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f4f6f9',
          backgroundImage:
            'radial-gradient(900px 420px at 0% -10%, rgba(11, 107, 203, 0.06), transparent 55%), linear-gradient(180deg, #f7f8fb 0%, #f4f6f9 40%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'saturate(180%) blur(12px)',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          color: '#0b1220',
          boxShadow: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 60,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: 12,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          backgroundImage: 'none',
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
          borderRadius: 8,
          paddingLeft: 16,
          paddingRight: 16,
          fontWeight: 600,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
          },
        },
        outlined: {
          borderColor: 'rgba(15, 23, 42, 0.12)',
        },
        sizeSmall: {
          borderRadius: 7,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: 'rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          backgroundColor: '#0b1220',
          color: '#e2e8f0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginInline: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(11, 107, 203, 0.18)',
            '&:hover': {
              backgroundColor: 'rgba(11, 107, 203, 0.24)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
        },
        notchedOutline: {
          borderColor: 'rgba(15, 23, 42, 0.12)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 550,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#0b1220',
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontWeight: 600,
          '&.Mui-active': { fontWeight: 700 },
          '&.Mui-completed': { fontWeight: 600 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        PaperProps: {
          elevation: 0,
        },
      },
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.14)',
          backgroundImage: 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontSize: '1.125rem',
          paddingTop: 20,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: '20px !important',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(15, 23, 42, 0.06)',
          gap: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.12)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2,
          borderRadius: 1,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 44,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 500,
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

/** Preserve subpaths when migrating legacy /ccrp/* URLs to /tsp/*. */
function LegacyCcrpToTspRedirect() {
  const { pathname, search, hash } = useLocation();
  const rest = pathname.replace(/^\/ccrp/, '') || '';
  return <Navigate to={`/tsp${rest}${search}${hash}`} replace />;
}

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
      
      {/* Legacy CCRP URLs → TSP (preserve subpath, e.g. /ccrp/dashboard → /tsp/dashboard) */}
      <Route path="/ccrp/*" element={<LegacyCcrpToTspRedirect />} />
      
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