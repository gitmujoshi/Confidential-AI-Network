import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';
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
import OciScaffoldDemo from './pages/OciScaffoldDemo';
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
import TDCTraining from '../../training/ui/TDCTraining';
import TDCInference from '../../inference/ui/TDCInference';
import EnvironmentMarketplace from './pages/EnvironmentMarketplace';
import ScittCcfDashboard from './components/ScittCcfDashboard';
import CANJobs from './pages/CANJobs';
import AuditorAuditTree from './pages/AuditorAuditTree';
import AuditorDashboard from './pages/dashboards/AuditorDashboard';

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
// Visual language matches the marketing role dashboards: blue-violet header, white cards.
const theme = createTheme({
  shape: { borderRadius: 8 },
  palette: {
    mode: 'light',
    primary: {
      main: '#0d6efd',
      dark: '#0a58ca',
      light: '#6ea8fe',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3d4a5c',
      dark: '#243042',
      light: '#6b7789',
    },
    success: { main: '#0f6e56' },
    warning: { main: '#9a6700' },
    error: { main: '#b42318' },
    info: { main: '#0d6efd' },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#122033',
      secondary: '#5c6b7e',
    },
    divider: '#e3e8ef',
  },
  typography: {
    // Base 16px (MUI default is 14) — scales rem-based type for easier reading.
    fontSize: 16,
    htmlFontSize: 16,
    fontFamily:
      '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.15, fontSize: '2.75rem' },
    h2: { fontWeight: 750, letterSpacing: '-0.03em', lineHeight: 1.2, fontSize: '2.25rem' },
    h3: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.25, fontSize: '1.875rem' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, fontSize: '1.5rem' },
    h5: { fontWeight: 650, letterSpacing: '-0.015em', lineHeight: 1.35, fontSize: '1.25rem' },
    h6: { fontWeight: 650, letterSpacing: '-0.01em', lineHeight: 1.4, fontSize: '1.125rem' },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.0625rem' },
    subtitle2: { fontWeight: 600, letterSpacing: '-0.005em', fontSize: '0.9375rem' },
    body1: { fontSize: '1.0625rem', lineHeight: 1.7, letterSpacing: '-0.005em' },
    body2: { fontSize: '0.9375rem', lineHeight: 1.6, letterSpacing: '-0.005em' },
    button: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '0.9375rem' },
    caption: { fontSize: '0.8125rem', lineHeight: 1.5 },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.08em',
      fontSize: '0.75rem',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8f9fa',
          color: '#122033',
        },
        'html, body, #root': {
          height: '100%',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e3e8ef',
          color: '#122033',
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
          borderRadius: 12,
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
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
          borderColor: '#d5dde6',
          '&:hover': {
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.06)',
          },
        },
        sizeSmall: {
          borderRadius: 7,
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: false,
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
          borderColor: '#e3e8ef',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #dee2e6',
          backgroundColor: '#ffffff',
          color: '#212529',
          overflow: 'hidden',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginInline: 8,
          '&.Mui-selected': {
            backgroundColor: '#0d6efd',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#0a58ca',
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff',
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
          color: '#122033',
          backgroundColor: '#f7f9fb',
          borderBottom: '1px solid #e3e8ef',
          whiteSpace: 'nowrap',
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
          borderRadius: 12,
          border: '1px solid #e3e8ef',
          boxShadow: '0 24px 48px rgba(16, 24, 40, 0.16)',
          backgroundImage: 'none',
          maxHeight: 'min(880px, calc(100vh - 48px))',
          display: 'flex',
          flexDirection: 'column',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflow: 'auto',
          maxWidth: '100%',
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
          overflowY: 'auto',
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
      <Route path="/demo/oci-scaffolds" element={<OciScaffoldDemo />} />
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
              <Route path="/inference" element={<TDCInference />} />
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

      {/* Auditor — read-only contracts + Merkle audit trees */}
      <Route path="/auditor/*" element={
        <RoleProtectedRoute allowedRoles={['Auditor', 'AppAdmin']}>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/auditor/dashboard" replace />} />
              <Route path="/dashboard" element={<AuditorDashboard />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contracts/:contractId" element={<ContractDetail />} />
              <Route path="/contracts/:contractId/audit-tree" element={<AuditorAuditTree />} />
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
          <Box className="can-app-frame can-scroll">
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppRoutes />
            </Router>
          </Box>
          <Toaster position="top-right" />
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 