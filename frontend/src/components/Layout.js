import React, { useMemo, useState } from 'react';
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
  Button,
  Chip,
  Avatar,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Storage,
  Description,
  People,
  Notifications,
  Logout,
  Security,
  Psychology,
  Biotech,
  Business,
  Add,
  CloudQueue,
  AccountTree,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';

const drawerWidth = 268;

const roleChipSx = (role) => {
  const map = {
    TDP: { bg: 'rgba(22, 78, 130, 0.12)', color: '#0e2c4b' },
    TDC: { bg: 'rgba(15, 110, 86, 0.12)', color: '#0f6e56' },
    TSP: { bg: 'rgba(61, 74, 92, 0.14)', color: '#243042' },
    CCRP: { bg: 'rgba(61, 74, 92, 0.14)', color: '#243042' },
    AppAdmin: { bg: 'rgba(180, 35, 24, 0.1)', color: '#8f1d16' },
    Auditor: { bg: 'rgba(13, 110, 253, 0.1)', color: '#0d6efd' },
  };
  const c = map[role] || { bg: 'rgba(100, 116, 139, 0.12)', color: '#475569' };
  return {
    bgcolor: c.bg,
    color: c.color,
    fontWeight: 700,
    height: 24,
    borderRadius: '6px',
    '& .MuiChip-label': { px: 1 },
  };
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isTDC, isTDP, clearAuthData } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifications = [] } = useQuery(
    ['notifications', currentUser?.id],
    () =>
      currentUser?.id
        ? api.get(`/api/notifications/${currentUser.id}`).then((res) => res.data.notifications)
        : Promise.resolve([]),
    {
      refetchInterval: 30000,
      enabled: !!currentUser?.id,
    }
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navigationItems = useMemo(
    () => [
      { text: 'Dashboard', icon: <Dashboard fontSize="small" />, path: '/dashboard' },
      { text: 'Datasets', icon: <Storage fontSize="small" />, path: '/datasets' },
      { text: 'Contracts', icon: <Description fontSize="small" />, path: '/contracts' },
      ...(isTDC
        ? [
            { text: 'Training', icon: <Psychology fontSize="small" />, path: '/tdc/training' },
            { text: 'Inference', icon: <Biotech fontSize="small" />, path: '/tdc/inference' },
            { text: 'CAN Jobs', icon: <Security fontSize="small" />, path: '/can/jobs' },
          ]
        : []),
      ...(currentUser?.partyType === 'TSP' || currentUser?.partyType === 'CCRP'
        ? [
            {
              text: 'Environments',
              icon: <CloudQueue fontSize="small" />,
              path: '/tsp/environments',
            },
            {
              text: 'Infrastructure',
              icon: <Security fontSize="small" />,
              path: '/tsp/infrastructure',
            },
            {
              text: 'Cloud Credentials',
              icon: <Security fontSize="small" />,
              path: '/tsp/cloud-credentials',
            },
          ]
        : []),
      ...(currentUser?.partyType === 'AppAdmin'
        ? [{ text: 'Users', icon: <People fontSize="small" />, path: '/admin/users' }]
        : []),
      ...(currentUser?.partyType === 'Auditor' || currentUser?.partyType === 'AppAdmin'
        ? [
            {
              text: 'Auditor',
              icon: <AccountTree fontSize="small" />,
              path: '/auditor/dashboard',
            },
          ]
        : []),
      {
        text: 'Notifications',
        icon: <Notifications fontSize="small" />,
        path: '/notifications',
      },
      {
        text: 'Enterprise DID',
        icon: <Business fontSize="small" />,
        path: '/enterprise-did',
      },
    ],
    [currentUser?.partyType, isTDC]
  );

  const pageTitle =
    navigationItems.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
      ?.text || 'Dashboard';

  const depaShort = currentUser?.depaId
    ? `${currentUser.depaId.split('-')[0]}-${currentUser.depaId.split('-')[1] || ''}`.replace(/-$/, '')
    : null;

  const handleLogout = async () => {
    await clearAuthData();
    navigate('/login');
  };

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        color: '#212529',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, flexShrink: 0 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              background: '#0d6efd',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 13,
              color: '#fff',
              letterSpacing: '-0.04em',
            }}
          >
            CA
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 750,
                fontSize: '0.95rem',
                letterSpacing: '-0.02em',
                color: '#212529',
                lineHeight: 1.2,
              }}
            >
              Confidential AI
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#6c757d', mt: 0.25 }}>
              Network Console
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box className="can-scroll" sx={{ px: 1.5, pb: 1, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Typography
          variant="overline"
          sx={{ px: 1.5, color: '#6c757d', display: 'block', mb: 0.5 }}
        >
          Navigate
        </Typography>
        <List disablePadding>
          {navigationItems.map((item) => {
            const isActive =
              location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => go(item.path)}
                  sx={{
                    py: 1,
                    px: 1.25,
                    color: isActive ? '#ffffff' : '#495057',
                    '&:hover': {
                      bgcolor: 'rgba(13, 110, 253, 0.08)',
                      color: '#0d6efd',
                    },
                    '&.Mui-selected': {
                      bgcolor: '#0d6efd',
                      color: '#ffffff',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#0a58ca', color: '#ffffff' },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? '#ffffff' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 650 : 500,
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
      </Box>

      <Box sx={{ flexShrink: 0, position: 'relative', zIndex: 1, bgcolor: '#ffffff', borderTop: '1px solid #dee2e6' }}>
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Typography variant="overline" sx={{ color: '#6c757d', display: 'block', mb: 1 }}>
            Quick actions
          </Typography>
          <Stack spacing={1}>
            {isTDC && (
              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={() => go('/contracts/create')}
                sx={{
                  justifyContent: 'flex-start',
                  bgcolor: '#0d6efd',
                  '&:hover': { bgcolor: '#0a58ca' },
                }}
              >
                Create contract
              </Button>
            )}
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<Storage />}
              onClick={() => go('/datasets')}
              sx={{
                justifyContent: 'flex-start',
                color: '#212529',
                borderColor: '#dee2e6',
                '&:hover': {
                  borderColor: '#0d6efd',
                  bgcolor: 'rgba(13, 110, 253, 0.06)',
                },
              }}
            >
              {isTDP ? 'My datasets' : 'Browse datasets'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ p: 2, mt: 1 }}>
          <Button
            fullWidth
            size="small"
            onClick={handleLogout}
            startIcon={<Logout fontSize="small" />}
            title="Logout"
            data-testid="logout-button"
            sx={{
              justifyContent: 'flex-start',
              color: '#495057',
              '&:hover': { color: '#b42318', bgcolor: 'rgba(180, 35, 24, 0.06)' },
            }}
          >
            Sign out
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ gap: { xs: 0.75, sm: 1.5 }, px: { xs: 1.5, sm: 3 }, minHeight: { xs: 64, sm: 72 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen((v) => !v)}
            sx={{ display: { md: 'none' }, mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ display: { xs: 'none', md: 'block' }, color: 'text.secondary', lineHeight: 1 }}
            >
              Workspace
            </Typography>
            <Typography
              variant="h6"
              component="div"
              noWrap
              sx={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              {pageTitle}
            </Typography>
          </Box>

          {currentUser && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Notifications">
                <IconButton
                  onClick={() => navigate('/notifications')}
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <Notifications fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Chip
                label={currentUser.partyType || 'User'}
                size="small"
                sx={{ ...roleChipSx(currentUser.partyType), display: { xs: 'none', sm: 'inline-flex' } }}
              />

              {depaShort && (
                <Chip
                  label={depaShort}
                  size="small"
                  variant="outlined"
                  title={currentUser.depaId}
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.7rem',
                    height: 24,
                    borderColor: 'divider',
                    color: 'text.secondary',
                  }}
                />
              )}

              <Tooltip title="Profile">
                <IconButton onClick={() => navigate('/profile')} sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'primary.main',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Typography
                variant="body2"
                sx={{
                  display: { xs: 'none', lg: 'block' },
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                {currentUser.name || currentUser.email}
              </Typography>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, maxWidth: '86vw' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        className="can-page-enter can-scroll"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          height: '100%',
          overflow: 'auto',
          pt: { xs: '80px', md: '88px' },
          px: { xs: 1.5, sm: 2.5, md: 4 },
          pb: 6,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default Layout;
