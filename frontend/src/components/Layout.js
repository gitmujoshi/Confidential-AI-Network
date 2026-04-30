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
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Storage,
  Description,
  People,
  Notifications,
  AccountCircle,
  Logout,
  Add,
  Business,
  Security,
  Psychology,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated, isTDC, isTDP, isCCRP, deploymentStatus, isGlobalDEPAId, deploymentInfo, clearAuthData } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Fetch notifications
  const { data: notifications = [] } = useQuery(
    ['notifications', currentUser?.id],
    () => currentUser?.id ? api.get(`/api/notifications/${currentUser.id}`).then(res => res.data.notifications) : Promise.resolve([]),
    { 
      refetchInterval: 30000,
      enabled: !!currentUser?.id
    }
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    console.log('🚪 [Layout] Logging out...');
    
    // Use the proper UserContext method to clear all auth data
    await clearAuthData();
    
    // Navigate to login page
    navigate('/login');
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Datasets', icon: <Storage />, path: '/datasets' },
    { text: 'Contracts', icon: <Description />, path: '/contracts' },
    ...(isTDC ? [{ text: 'Training', icon: <Psychology />, path: '/tdc/training' }] : []),
    // CCRP-specific menu items (only for CCRP users, not AppAdmin)
    ...(currentUser?.partyType === 'CCRP' ? [
      { text: 'Environments', icon: <Security />, path: '/ccrp/environments' },
      { text: 'Infrastructure', icon: <Security />, path: '/ccrp/infrastructure' },
      { text: 'Cloud Credentials', icon: <Security />, path: '/ccrp/cloud-credentials' },
    ] : []),
    // Only show Users menu for AppAdmin
    ...(currentUser?.partyType === 'AppAdmin' ? [{ text: 'Users', icon: <People />, path: '/admin/users' }] : []),
    { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
    { text: 'Enterprise DID', icon: <Business />, path: '/enterprise-did' },
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'TDP': return 'info';
      case 'TDC': return 'success';
      case 'CCRP': return 'secondary';
      case 'AppAdmin': return 'warning';
      default: return 'default';
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
      {/* Logo/Brand */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: '1px solid rgba(148,163,184,0.25)',
          background:
            'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(124,58,237,0.06) 55%, rgba(255,255,255,0))',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Contract Manager
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Secure • Auditable • Role-based
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ px: 1.25, py: 1.25 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    px: 1.25,
                    border: isActive ? '1px solid rgba(37,99,235,0.25)' : '1px solid transparent',
                    bgcolor: isActive ? 'rgba(37,99,235,0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(37,99,235,0.10)' : 'rgba(148,163,184,0.10)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? 'text.primary' : 'text.secondary',
                      },
                    }}
                  />
                  {item.text === 'Notifications' && unreadCount > 0 && (
                    <Badge badgeContent={unreadCount} color="error" />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Quick Actions */}
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
            {/* Only TDC users can create contracts */}
            {isTDC && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  navigate('/contracts/create');
                  setMobileOpen(false);
                }}
                fullWidth
                size="small"
              >
                Create Contract
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Storage />}
              onClick={() => {
                navigate('/datasets');
                setMobileOpen(false);
              }}
              fullWidth
              size="small"
            >
              {isTDP ? 'My Datasets' : 'Browse Datasets'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(148,163,184,0.25)' }}>
        <Button
          size="small"
          onClick={handleLogout}
          startIcon={<Logout />}
          fullWidth
          color="inherit"
          sx={{ justifyContent: 'flex-start', color: 'text.secondary', '&:hover': { color: 'error.main' } }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  const renderUserInfo = () => {
    if (!currentUser) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {currentUser.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {currentUser.partyType || 'User'}
          </Typography>
          {/* Global DEPA ID Information */}
          {currentUser.depaId && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {isGlobalDEPAId ? '🌍' : '🆔'} {currentUser.depaId}
              </Typography>
              {isGlobalDEPAId && deploymentInfo && (
                <Chip
                  label={deploymentInfo.deploymentPrefix}
                  size="small"
                  variant="outlined"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
              )}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.75)',
          color: 'text.primary',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(148,163,184,0.25)',
          boxShadow: 'none',
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
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {navigationItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          {/* User Menu */}
          {currentUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              {/* Notifications */}
              <IconButton
                color="inherit"
                onClick={() => navigate('/notifications')}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              {/* User Avatar */}
              <IconButton
                onClick={() => navigate('/profile')}
                sx={{ p: 0.5 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {currentUser.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>

              {/* User Role */}
              <Chip
                label={currentUser.partyType}
                size="small"
                color={getRoleColor(currentUser.partyType)}
                variant="outlined"
              />

              {/* DEPA ID */}
              {currentUser.depaId && (
                <Chip
                  label={`DEPA: ${currentUser.depaId.split('-')[0]}-${currentUser.depaId.split('-')[1]}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    maxWidth: 160,
                    color: 'text.secondary',
                    borderColor: 'rgba(148,163,184,0.45)',
                    '& .MuiChip-label': { fontSize: '0.72rem', fontWeight: 600 },
                  }}
                  title={currentUser.depaId}
                />
              )}

              {/* Username */}
              <Typography
                variant="body2"
                sx={{
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                  fontWeight: 700,
                }}
              >
                {currentUser.name || currentUser.email}
              </Typography>

              {/* Logout Button */}
              <IconButton
                onClick={handleLogout}
                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                title="Logout"
              >
                <Logout />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(148,163,184,0.25)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(148,163,184,0.25)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          // xs: taller offset so wrapped AppBar + chips do not cover the first row of main content
          marginTop: { xs: '120px', sm: '80px' },
          minHeight: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 80px)' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 