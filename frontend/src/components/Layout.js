import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Storage,
  Description,
  People,
  Notifications,
  AccountCircle,
  Settings,
  Logout,
  Add,
  Wallet,
  Refresh,
  BugReport,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { useUser } from '../contexts/UserContext';
import MetaMaskGuide from './MetaMaskGuide';
import WalletSwitcher from './WalletSwitcher';

const drawerWidth = 240;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showMetaMaskGuide, setShowMetaMaskGuide] = useState(false);
  const [walletSwitcherOpen, setWalletSwitcherOpen] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, walletAddress, isConnecting, connectWallet, disconnectWallet, refreshUserData, isTDC, isAuthenticated, isTDP, isCCRP, isInitializing, detectAndSetCurrentAccount, checkWalletConnection } = useUser();

  // Role-based menu items
  const getMenuItems = () => {
    const baseItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/' },
      { text: 'Datasets', icon: <Storage />, path: '/datasets' },
      { text: 'Contracts', icon: <Description />, path: '/contracts' },
      { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
    ];

    // Only TDC can create contracts
    if (isTDC) {
      baseItems.splice(3, 0, { text: 'Create Contract', icon: <Add />, path: '/contracts/create' });
    }

    // Admin features (show for all authenticated users for now)
    if (isAuthenticated) {
      baseItems.push({ text: 'Users', icon: <People />, path: '/users' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  // Fetch notifications count
  const { data: notificationsCount = 0 } = useQuery(
    ['notificationsCount', currentUser?.id],
    () => api.get(`/api/notifications/${currentUser?.id || 1}?limit=1`).then(res => res.data.total),
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      enabled: !!currentUser?.id
    }
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleConnectWallet = async () => {
    console.log('🔗 [Layout] Connect wallet button clicked');
    try {
      console.log('🔗 [Layout] Calling connectWallet from UserContext...');
      await connectWallet();
      console.log('✅ [Layout] Wallet connected successfully in Layout');
    } catch (error) {
      console.error('❌ [Layout] Failed to connect wallet:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to connect wallet';
      
      if (error.code === 'METAMASK_NOT_INSTALLED') {
        console.log('🔗 [Layout] MetaMask not installed, showing guide');
        setShowMetaMaskGuide(true);
        return;
      } else if (error.message.includes('No accounts found')) {
        errorMessage = 'Please unlock MetaMask and try again.';
      } else if (error.message.includes('User rejected')) {
        errorMessage = 'Wallet connection was cancelled.';
      } else {
        errorMessage = error.message || 'Failed to connect wallet';
      }
      
      // You can add a toast notification here if you have a notification system
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    disconnectWallet();
    handleProfileMenuClose();
    navigate('/');
  };

  const handleRefresh = async () => {
    console.log('🔄 [Layout] Manual refresh triggered');
    await refreshUserData();
  };

  const handleDebug = async () => {
    await detectAndSetCurrentAccount();
    setShowDebugDialog(true);
  };

  const handleCheckConnection = async () => {
    console.log('🔍 [Layout] Check connection button clicked');
    await checkWalletConnection();
  };

  const handleForceRefresh = async () => {
    console.log('🔄 [Layout] Force refresh button clicked');
    await refreshUserData();
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (isInitializing) {
      return { icon: <Refresh sx={{ animation: 'spin 1s linear infinite' }} />, color: 'warning', text: 'Initializing...' };
    }
    if (isConnecting) {
      return { icon: <Refresh sx={{ animation: 'spin 1s linear infinite' }} />, color: 'warning', text: 'Connecting...' };
    }
    if (!walletAddress) {
      return { icon: <Error />, color: 'error', text: 'No Wallet' };
    }
    if (!currentUser) {
      return { icon: <Warning />, color: 'warning', text: 'Wallet Not Registered' };
    }
    return { icon: <CheckCircle />, color: 'success', text: currentUser.partyType };
  };

  const status = getStatusIndicator();

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Contract Manager
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* User Info Section */}
      <Box sx={{ p: 2 }}>
        {!isAuthenticated ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please connect your wallet to access the system
            </Alert>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Wallet />}
              onClick={handleConnectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Connected as:
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ wordBreak: 'break-all', mb: 1 }}>
              {walletAddress}
            </Typography>
            {currentUser && (
              <Box>
                <Chip 
                  label={currentUser.name} 
                  size="small" 
                  sx={{ mb: 1 }}
                />
                <Chip 
                  label={currentUser.partyType} 
                  color={
                    isTDP ? 'primary' :
                    isTDC ? 'secondary' : 'success'
                  }
                  size="small" 
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        )}
      </Box>
      
      <Divider />
      
      {/* Navigation Menu */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              disabled={!isAuthenticated}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {item.text === 'Notifications' && notificationsCount > 0 && (
                <Badge badgeContent={notificationsCount} color="error" />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AI Training Data Contract Management
          </Typography>
          
          {!isAuthenticated ? (
            <Button
              color="inherit"
              startIcon={<Wallet />}
              onClick={handleConnectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Status Indicator */}
              <Tooltip title={`${status.text} - ${walletAddress || 'No wallet connected'}`}>
                <Chip
                  icon={status.icon}
                  label={status.text}
                  color={status.color}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>

              {/* Debug Button */}
              <Tooltip title="Debug Wallet Connection">
                <IconButton color="inherit" onClick={handleDebug}>
                  <BugReport />
                </IconButton>
              </Tooltip>

              {/* Check Connection Button */}
              <Tooltip title="Check Wallet Connection">
                <IconButton color="inherit" onClick={handleCheckConnection}>
                  <Refresh />
                </IconButton>
              </Tooltip>

              {/* Force Refresh Button */}
              <Tooltip title="Force Refresh User Data">
                <IconButton color="inherit" onClick={handleForceRefresh}>
                  <Refresh sx={{ transform: 'scaleX(-1)' }} />
                </IconButton>
              </Tooltip>

              {currentUser && (
                <Chip 
                  label={currentUser.partyType} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ 
                    color: 'white',
                    borderColor: 'white',
                    '& .MuiChip-label': {
                      color: 'white'
                    }
                  }}
                />
              )}
              <Button
                color="inherit"
                size="small"
                onClick={() => setWalletSwitcherOpen(true)}
                sx={{ 
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Switch Wallet
              </Button>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="primary-search-account-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
            </Box>
          )}
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            {currentUser && (
              <MenuItem disabled>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body2">{currentUser.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {currentUser.email}
                  </Typography>
                </Box>
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleCheckConnection}>
              <ListItemIcon>
                <Refresh fontSize="small" />
              </ListItemIcon>
              Check Connection
            </MenuItem>
            <MenuItem onClick={handleForceRefresh}>
              <ListItemIcon>
                <Refresh fontSize="small" sx={{ transform: 'scaleX(-1)' }} />
              </ListItemIcon>
              Force Refresh
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Disconnect Wallet
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {showMetaMaskGuide ? (
          <MetaMaskGuide 
            onInstallClick={() => window.open('https://metamask.io/download/', '_blank')}
          />
        ) : (
          children
        )}
        <WalletSwitcher 
          open={walletSwitcherOpen}
          onClose={() => setWalletSwitcherOpen(false)}
          onWalletSelect={(wallet) => {
            console.log('Selected wallet:', wallet);
            setWalletSwitcherOpen(false);
            // The user will need to manually switch in MetaMask and refresh
          }}
        />
      </Box>

      {/* Debug Dialog */}
      <Dialog open={showDebugDialog} onClose={() => setShowDebugDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <BugReport />
            <Typography variant="h6">Wallet Connection Debug</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Current Status</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>MetaMask Account:</strong> {walletAddress || 'Not connected'}</Typography>
              <Typography><strong>User Detected:</strong> {currentUser ? 'Yes' : 'No'}</Typography>
              {currentUser && (
                <>
                  <Typography><strong>User Name:</strong> {currentUser.name}</Typography>
                  <Typography><strong>User Role:</strong> {currentUser.partyType}</Typography>
                  <Typography><strong>User ID:</strong> {currentUser.id}</Typography>
                  <Typography><strong>Registered:</strong> {currentUser.isRegistered ? 'Yes' : 'No'}</Typography>
                </>
              )}
              <Typography><strong>Role Flags:</strong></Typography>
              <Box sx={{ ml: 2 }}>
                <Typography>• TDC: {isTDC ? 'Yes' : 'No'}</Typography>
                <Typography>• TDP: {isTDP ? 'Yes' : 'No'}</Typography>
                <Typography>• CCRP: {isCCRP ? 'Yes' : 'No'}</Typography>
              </Box>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Troubleshooting Tips:</strong>
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Make sure MetaMask is unlocked and connected to localhost:8545</li>
              <li>Verify the correct account is active in MetaMask</li>
              <li>If switching accounts, use the "Refresh App" button in the wallet switcher</li>
              <li>Check that the account is registered in the backend database</li>
            </Box>
          </Alert>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={isConnecting}
            >
              {isConnecting ? 'Refreshing...' : 'Refresh User Data'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowDebugDialog(false)}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Layout; 