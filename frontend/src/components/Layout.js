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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';

const drawerWidth = 268;

const roleChipSx = (role) => {
  const map = {
    TDP: { bg: 'rgba(11, 107, 203, 0.12)', color: '#08498a' },
    TDC: { bg: 'rgba(15, 118, 110, 0.12)', color: '#0f766e' },
    TSP: { bg: 'rgba(51, 65, 85, 0.14)', color: '#334155' },
    CCRP: { bg: 'rgba(51, 65, 85, 0.14)', color: '#334155' },
    AppAdmin: { bg: 'rgba(185, 28, 28, 0.1)', color: '#991b1b' },
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
        bgcolor: '#0b1220',
        color: '#e2e8f0',
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
              background: 'linear-gradient(145deg, #0b6bcb 0%, #08498a 100%)',
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
                color: '#f8fafc',
                lineHeight: 1.2,
              }}
            >
              Confidential AI
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.25 }}>
              Network Console
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, pb: 1, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Typography
          variant="overline"
          sx={{ px: 1.5, color: '#64748b', display: 'block', mb: 0.5 }}
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
                    color: isActive ? '#f8fafc' : '#94a3b8',
                    '&:hover': {
                      bgcolor: 'rgba(148, 163, 184, 0.08)',
                      color: '#f1f5f9',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'rgba(11, 107, 203, 0.22)',
                      color: '#f8fafc',
                      '&:hover': { bgcolor: 'rgba(11, 107, 203, 0.28)' },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? '#93c5fd' : 'inherit',
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

      <Box sx={{ flexShrink: 0, position: 'relative', zIndex: 1, bgcolor: '#0b1220' }}>
        <Box sx={{ px: 2, pt: 1 }}>
          <Typography variant="overline" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
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
                  bgcolor: '#0b6bcb',
                  '&:hover': { bgcolor: '#08498a' },
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
                color: '#cbd5e1',
                borderColor: 'rgba(148, 163, 184, 0.28)',
                '&:hover': {
                  borderColor: 'rgba(148, 163, 184, 0.5)',
                  bgcolor: 'rgba(148, 163, 184, 0.06)',
                },
              }}
            >
              {isTDP ? 'My datasets' : 'Browse datasets'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ p: 2, mt: 1, borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <Button
            fullWidth
            size="small"
            onClick={handleLogout}
            startIcon={<Logout fontSize="small" />}
            title="Logout"
            data-testid="logout-button"
            sx={{
              justifyContent: 'flex-start',
              color: '#94a3b8',
              '&:hover': { color: '#fecaca', bgcolor: 'rgba(185, 28, 28, 0.12)' },
            }}
          >
            Sign out
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ gap: 1.5, px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen((v) => !v)}
            sx={{ display: { sm: 'none' } }}
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
                sx={roleChipSx(currentUser.partyType)}
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

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        className="can-page-enter"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          pt: { xs: 10, sm: 9 },
          px: { xs: 2, sm: 3, md: 4 },
          pb: 4,
          minHeight: '100vh',
        }}
      >
        <Box sx={{ maxWidth: 1280, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default Layout;
