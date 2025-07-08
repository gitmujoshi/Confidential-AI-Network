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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: user, setUser } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [] } = useQuery(
    'notifications',
    () => api.get('/notifications').then(res => res.data.notifications),
    { refetchInterval: 30000 }
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/login');
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Datasets', icon: <Storage />, path: '/datasets' },
    { text: 'Contracts', icon: <Description />, path: '/contracts' },
    // Only show Users menu for AppAdmin
    ...(user?.partyType === 'AppAdmin' ? [{ text: 'Users', icon: <People />, path: '/users' }] : []),
    { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
    { text: 'Enterprise DID', icon: <Business />, path: '/enterprise-did' },
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'TDP': return 'bg-blue-100 text-blue-800';
      case 'TDC': return 'bg-green-100 text-green-800';
      case 'CCRP': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const drawer = (
    <div className="h-full bg-white">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200">
        <Typography variant="h6" className="font-bold text-gray-900">
          Contract Manager
        </Typography>
        <Typography variant="caption" className="text-gray-500">
          Secure & Transparent
        </Typography>
      </div>

      {/* User Profile */}
      {user && (
        <div 
          className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 bg-blue-600">
              {user.name?.charAt(0) || 'U'}
            </Avatar>
            <div className="flex-1 min-w-0">
              <Typography variant="subtitle2" className="font-medium text-gray-900 truncate">
                {user.name || 'User'}
              </Typography>
              <Chip
                label={user.partyType}
                size="small"
                className={`${getRoleColor(user.partyType)} text-xs`}
              />
            </div>
          </div>
          {user.email && (
            <div className="mt-2 text-xs text-gray-600 truncate">
              {user.email}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <List className="px-2 py-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding className="mb-1">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  className={`rounded-md ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <ListItemIcon className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                  {item.text === 'Notifications' && unreadCount > 0 && (
                    <Badge badgeContent={unreadCount} color="error" />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Quick Actions */}
        <div className="px-4 py-4">
          <Typography variant="subtitle2" className="text-gray-600 mb-3 font-medium">
            Quick Actions
          </Typography>
          <div className="space-y-2">
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => navigate('/contracts/create')}
              className="w-full justify-start"
              size="small"
            >
              Create Contract
            </Button>
            <Button
              variant="outlined"
              startIcon={<Storage />}
              onClick={() => navigate('/datasets')}
              className="w-full justify-start"
              size="small"
            >
              Browse Datasets
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          size="small"
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600"
          startIcon={<Logout />}
          fullWidth
        >
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'black',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
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
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <IconButton
                color="inherit"
                onClick={() => navigate('/notifications')}
                className="relative"
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              {/* User Avatar */}
              <IconButton
                onClick={() => navigate('/profile')}
                className="hover:bg-gray-100 rounded-full p-1"
              >
                <Avatar className="w-8 h-8 bg-blue-600">
                  {user.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>

              {/* User Role */}
              <Chip
                label={user.partyType}
                size="small"
                className={`${getRoleColor(user.partyType)} text-xs`}
              />

              {/* Logout Button */}
              <IconButton
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600"
                title="Logout"
              >
                <Logout />
              </IconButton>
            </div>
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

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 