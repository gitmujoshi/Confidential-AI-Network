/**
 * User Preferences Component
 * 
 * Personalized configuration settings for individual users including
 * interface preferences, notification settings, and workflow customization.
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField, Button, Switch,
  FormControlLabel, Select, MenuItem, FormControl, InputLabel, Tabs, Tab,
  Alert, Divider, Chip, Avatar, Slider, RadioGroup, Radio, FormLabel,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Paper, Accordion, AccordionSummary, AccordionDetails, Badge
} from '@mui/material';
import {
  Person as PersonIcon, Notifications as NotificationsIcon, 
  Palette as PaletteIcon, Language as LanguageIcon, Security as SecurityIcon,
  Dashboard as DashboardIcon, ExpandMore as ExpandMoreIcon, Save as SaveIcon,
  Edit as EditIcon, Visibility as VisibilityIcon, Email as EmailIcon,
  Sms as SmsIcon, Phone as PhoneIcon, Schedule as ScheduleIcon,
  VolumeUp as VolumeUpIcon, Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon, Tune as TuneIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import { useUser } from '../contexts/UserContext';
import toast from 'react-hot-toast';

const UserPreferences = () => {
  const { currentUser, updateUserPreferences } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    profile: {
      displayName: currentUser?.name || '',
      email: currentUser?.email || '',
      timezone: 'UTC',
      language: 'en',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      currency: 'USD',
      profileVisibility: 'team'
    },
    interface: {
      theme: 'light',
      colorScheme: 'blue',
      fontSize: 'medium',
      compactMode: false,
      animationsEnabled: true,
      highContrast: false,
      showTooltips: true,
      keyboardShortcuts: true
    },
    dashboard: {
      defaultView: 'overview',
      widgetLayout: 'grid',
      autoRefresh: true,
      refreshInterval: 30,
      showWelcomeMessage: true,
      recentItemsLimit: 10,
      favoriteWidgets: ['contracts', 'monitoring', 'marketplace'],
      quickActions: ['create-contract', 'upload-model', 'view-stats']
    },
    notifications: {
      email: {
        enabled: true,
        frequency: 'immediate',
        types: {
          contractUpdates: true,
          systemAlerts: true,
          marketplaceActivity: false,
          trainingProgress: true,
          securityEvents: true,
          weeklyDigest: true
        }
      },
      push: {
        enabled: true,
        types: {
          urgentAlerts: true,
          contractDeadlines: true,
          trainingComplete: true,
          systemMaintenance: true
        }
      },
      inApp: {
        enabled: true,
        sound: true,
        desktop: false,
        position: 'top-right',
        duration: 5000
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
      passwordExpiry: 90,
      ipRestrictions: false,
      deviceTrust: true,
      biometricAuth: false,
      auditLogging: true
    },
    workflow: {
      autoSaveInterval: 5,
      confirmDestructiveActions: true,
      showProgressIndicators: true,
      bulkOperations: true,
      advancedFilters: false,
      experimentalFeatures: false,
      debugMode: false,
      powerUserMode: false
    }
  });

  // Fetch user preferences
  const { data: userPrefs, isLoading } = useQuery(
    ['user-preferences', currentUser?.id],
    async () => {
      const response = await apiService.get('/api/users/preferences');
      return response.data.data;
    },
    {
      enabled: !!currentUser,
      onSuccess: (data) => {
        if (data) {
          setPreferences(prev => ({ ...prev, ...data }));
        }
      }
    }
  );

  // Save preferences mutation
  const savePreferencesMutation = useMutation(
    async (prefsData) => {
      const response = await apiService.put('/api/users/preferences', prefsData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Preferences saved successfully');
        queryClient.invalidateQueries('user-preferences');
        // Update user context if needed
        updateUserPreferences?.(preferences);
      },
      onError: (error) => {
        toast.error(`Failed to save preferences: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handlePreferenceChange = (section, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleNestedPreferenceChange = (section, parentKey, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentKey]: {
          ...prev[section][parentKey],
          [key]: value
        }
      }
    }));
  };

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate(preferences);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prefs-tabpanel-${index}`}
      aria-labelledby={`prefs-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const PreferenceSection = ({ title, icon, children }) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );

  const ProfileTab = () => (
    <PreferenceSection title="Profile Settings" icon={<PersonIcon />}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Display Name"
            value={preferences.profile.displayName}
            onChange={(e) => handlePreferenceChange('profile', 'displayName', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            value={preferences.profile.email}
            onChange={(e) => handlePreferenceChange('profile', 'email', e.target.value)}
            disabled
            helperText="Contact admin to change email"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={preferences.profile.timezone}
              label="Timezone"
              onChange={(e) => handlePreferenceChange('profile', 'timezone', e.target.value)}
            >
              <MenuItem value="UTC">UTC</MenuItem>
              <MenuItem value="America/New_York">Eastern Time</MenuItem>
              <MenuItem value="America/Chicago">Central Time</MenuItem>
              <MenuItem value="America/Denver">Mountain Time</MenuItem>
              <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
              <MenuItem value="Europe/London">London</MenuItem>
              <MenuItem value="Europe/Paris">Paris</MenuItem>
              <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
              <MenuItem value="Asia/Singapore">Singapore</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Language</InputLabel>
            <Select
              value={preferences.profile.language}
              label="Language"
              onChange={(e) => handlePreferenceChange('profile', 'language', e.target.value)}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="de">German</MenuItem>
              <MenuItem value="zh">Chinese</MenuItem>
              <MenuItem value="ja">Japanese</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Date Format</InputLabel>
            <Select
              value={preferences.profile.dateFormat}
              label="Date Format"
              onChange={(e) => handlePreferenceChange('profile', 'dateFormat', e.target.value)}
            >
              <MenuItem value="YYYY-MM-DD">2024-03-15</MenuItem>
              <MenuItem value="MM/DD/YYYY">03/15/2024</MenuItem>
              <MenuItem value="DD/MM/YYYY">15/03/2024</MenuItem>
              <MenuItem value="DD MMM YYYY">15 Mar 2024</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select
              value={preferences.profile.currency}
              label="Currency"
              onChange={(e) => handlePreferenceChange('profile', 'currency', e.target.value)}
            >
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
              <MenuItem value="JPY">JPY (¥)</MenuItem>
              <MenuItem value="CAD">CAD (C$)</MenuItem>
              <MenuItem value="AUD">AUD (A$)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </PreferenceSection>
  );

  const InterfaceTab = () => (
    <>
      <PreferenceSection title="Appearance" icon={<PaletteIcon />}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Theme</FormLabel>
              <RadioGroup
                value={preferences.interface.theme}
                onChange={(e) => handlePreferenceChange('interface', 'theme', e.target.value)}
                row
              >
                <FormControlLabel 
                  value="light" 
                  control={<Radio />} 
                  label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LightModeIcon /> Light
                  </Box>}
                />
                <FormControlLabel 
                  value="dark" 
                  control={<Radio />} 
                  label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DarkModeIcon /> Dark
                  </Box>}
                />
                <FormControlLabel 
                  value="auto" 
                  control={<Radio />} 
                  label="Auto" 
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Color Scheme</InputLabel>
              <Select
                value={preferences.interface.colorScheme}
                label="Color Scheme"
                onChange={(e) => handlePreferenceChange('interface', 'colorScheme', e.target.value)}
              >
                <MenuItem value="blue">Blue</MenuItem>
                <MenuItem value="green">Green</MenuItem>
                <MenuItem value="purple">Purple</MenuItem>
                <MenuItem value="orange">Orange</MenuItem>
                <MenuItem value="red">Red</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Font Size</InputLabel>
              <Select
                value={preferences.interface.fontSize}
                label="Font Size"
                onChange={(e) => handlePreferenceChange('interface', 'fontSize', e.target.value)}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
                <MenuItem value="extra-large">Extra Large</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.interface.compactMode}
                    onChange={(e) => handlePreferenceChange('interface', 'compactMode', e.target.checked)}
                  />
                }
                label="Compact Mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.interface.animationsEnabled}
                    onChange={(e) => handlePreferenceChange('interface', 'animationsEnabled', e.target.checked)}
                  />
                }
                label="Animations"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.interface.highContrast}
                    onChange={(e) => handlePreferenceChange('interface', 'highContrast', e.target.checked)}
                  />
                }
                label="High Contrast"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.interface.showTooltips}
                    onChange={(e) => handlePreferenceChange('interface', 'showTooltips', e.target.checked)}
                  />
                }
                label="Show Tooltips"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.interface.keyboardShortcuts}
                    onChange={(e) => handlePreferenceChange('interface', 'keyboardShortcuts', e.target.checked)}
                  />
                }
                label="Keyboard Shortcuts"
              />
            </Box>
          </Grid>
        </Grid>
      </PreferenceSection>

      <PreferenceSection title="Dashboard Layout" icon={<DashboardIcon />}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Default View</InputLabel>
              <Select
                value={preferences.dashboard.defaultView}
                label="Default View"
                onChange={(e) => handlePreferenceChange('dashboard', 'defaultView', e.target.value)}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="contracts">Contracts</MenuItem>
                <MenuItem value="models">Models</MenuItem>
                <MenuItem value="marketplace">Marketplace</MenuItem>
                <MenuItem value="monitoring">Monitoring</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Auto Refresh Interval (seconds)"
              type="number"
              value={preferences.dashboard.refreshInterval}
              onChange={(e) => handlePreferenceChange('dashboard', 'refreshInterval', parseInt(e.target.value))}
              inputProps={{ min: 10, max: 300 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.dashboard.autoRefresh}
                    onChange={(e) => handlePreferenceChange('dashboard', 'autoRefresh', e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.dashboard.showWelcomeMessage}
                    onChange={(e) => handlePreferenceChange('dashboard', 'showWelcomeMessage', e.target.checked)}
                  />
                }
                label="Show Welcome Message"
              />
            </Box>
          </Grid>
        </Grid>
      </PreferenceSection>
    </>
  );

  const NotificationsTab = () => (
    <>
      <PreferenceSection title="Email Notifications" icon={<EmailIcon />}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notifications.email.enabled}
                  onChange={(e) => handleNestedPreferenceChange('notifications', 'email', 'enabled', e.target.checked)}
                />
              }
              label="Enable Email Notifications"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Email Frequency</InputLabel>
              <Select
                value={preferences.notifications.email.frequency}
                label="Email Frequency"
                onChange={(e) => handleNestedPreferenceChange('notifications', 'email', 'frequency', e.target.value)}
                disabled={!preferences.notifications.email.enabled}
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="hourly">Hourly Digest</MenuItem>
                <MenuItem value="daily">Daily Digest</MenuItem>
                <MenuItem value="weekly">Weekly Digest</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Email Types</Typography>
            <Grid container spacing={1}>
              {Object.entries(preferences.notifications.email.types).map(([type, enabled]) => (
                <Grid item xs={12} sm={6} md={4} key={type}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enabled}
                        onChange={(e) => handleNestedPreferenceChange('notifications', 'email', `types.${type}`, e.target.checked)}
                        disabled={!preferences.notifications.email.enabled}
                        size="small"
                      />
                    }
                    label={type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </PreferenceSection>

      <PreferenceSection title="In-App Notifications" icon={<NotificationsIcon />}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notifications.inApp.enabled}
                  onChange={(e) => handleNestedPreferenceChange('notifications', 'inApp', 'enabled', e.target.checked)}
                />
              }
              label="Enable In-App Notifications"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Notification Position</InputLabel>
              <Select
                value={preferences.notifications.inApp.position}
                label="Notification Position"
                onChange={(e) => handleNestedPreferenceChange('notifications', 'inApp', 'position', e.target.value)}
                disabled={!preferences.notifications.inApp.enabled}
              >
                <MenuItem value="top-right">Top Right</MenuItem>
                <MenuItem value="top-left">Top Left</MenuItem>
                <MenuItem value="bottom-right">Bottom Right</MenuItem>
                <MenuItem value="bottom-left">Bottom Left</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Display Duration (seconds)</Typography>
            <Slider
              value={preferences.notifications.inApp.duration / 1000}
              onChange={(e, value) => handleNestedPreferenceChange('notifications', 'inApp', 'duration', value * 1000)}
              disabled={!preferences.notifications.inApp.enabled}
              valueLabelDisplay="auto"
              min={2}
              max={10}
              step={1}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.inApp.sound}
                    onChange={(e) => handleNestedPreferenceChange('notifications', 'inApp', 'sound', e.target.checked)}
                    disabled={!preferences.notifications.inApp.enabled}
                  />
                }
                label="Sound"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.inApp.desktop}
                    onChange={(e) => handleNestedPreferenceChange('notifications', 'inApp', 'desktop', e.target.checked)}
                    disabled={!preferences.notifications.inApp.enabled}
                  />
                }
                label="Desktop Notifications"
              />
            </Box>
          </Grid>
        </Grid>
      </PreferenceSection>

      <PreferenceSection title="Quiet Hours" icon={<ScheduleIcon />}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.notifications.quietHours.enabled}
                  onChange={(e) => handleNestedPreferenceChange('notifications', 'quietHours', 'enabled', e.target.checked)}
                />
              }
              label="Enable Quiet Hours"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={preferences.notifications.quietHours.start}
              onChange={(e) => handleNestedPreferenceChange('notifications', 'quietHours', 'start', e.target.value)}
              disabled={!preferences.notifications.quietHours.enabled}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={preferences.notifications.quietHours.end}
              onChange={(e) => handleNestedPreferenceChange('notifications', 'quietHours', 'end', e.target.value)}
              disabled={!preferences.notifications.quietHours.enabled}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={preferences.notifications.quietHours.timezone}
                label="Timezone"
                onChange={(e) => handleNestedPreferenceChange('notifications', 'quietHours', 'timezone', e.target.value)}
                disabled={!preferences.notifications.quietHours.enabled}
              >
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="America/New_York">Eastern Time</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                <MenuItem value="Europe/London">London</MenuItem>
                <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </PreferenceSection>
    </>
  );

  const SecurityTab = () => (
    <PreferenceSection title="Security Preferences" icon={<SecurityIcon />}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Session Timeout (minutes)"
            type="number"
            value={preferences.security.sessionTimeout}
            onChange={(e) => handlePreferenceChange('security', 'sessionTimeout', parseInt(e.target.value))}
            inputProps={{ min: 5, max: 120 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Password Expiry (days)"
            type="number"
            value={preferences.security.passwordExpiry}
            onChange={(e) => handlePreferenceChange('security', 'passwordExpiry', parseInt(e.target.value))}
            inputProps={{ min: 30, max: 365 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.security.twoFactorEnabled}
                  onChange={(e) => handlePreferenceChange('security', 'twoFactorEnabled', e.target.checked)}
                />
              }
              label="Two-Factor Authentication"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.security.loginNotifications}
                  onChange={(e) => handlePreferenceChange('security', 'loginNotifications', e.target.checked)}
                />
              }
              label="Login Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.security.deviceTrust}
                  onChange={(e) => handlePreferenceChange('security', 'deviceTrust', e.target.checked)}
                />
              }
              label="Remember Trusted Devices"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.security.auditLogging}
                  onChange={(e) => handlePreferenceChange('security', 'auditLogging', e.target.checked)}
                />
              }
              label="Audit Logging"
            />
          </Box>
        </Grid>
      </Grid>
    </PreferenceSection>
  );

  const WorkflowTab = () => (
    <PreferenceSection title="Workflow Preferences" icon={<TuneIcon />}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Auto-save Interval (minutes)"
            type="number"
            value={preferences.workflow.autoSaveInterval}
            onChange={(e) => handlePreferenceChange('workflow', 'autoSaveInterval', parseInt(e.target.value))}
            inputProps={{ min: 1, max: 60 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.workflow.confirmDestructiveActions}
                  onChange={(e) => handlePreferenceChange('workflow', 'confirmDestructiveActions', e.target.checked)}
                />
              }
              label="Confirm Destructive Actions"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.workflow.showProgressIndicators}
                  onChange={(e) => handlePreferenceChange('workflow', 'showProgressIndicators', e.target.checked)}
                />
              }
              label="Show Progress Indicators"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.workflow.bulkOperations}
                  onChange={(e) => handlePreferenceChange('workflow', 'bulkOperations', e.target.checked)}
                />
              }
              label="Enable Bulk Operations"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.workflow.advancedFilters}
                  onChange={(e) => handlePreferenceChange('workflow', 'advancedFilters', e.target.checked)}
                />
              }
              label="Advanced Filters"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.workflow.experimentalFeatures}
                  onChange={(e) => handlePreferenceChange('workflow', 'experimentalFeatures', e.target.checked)}
                />
              }
              label="Experimental Features"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.workflow.powerUserMode}
                  onChange={(e) => handlePreferenceChange('workflow', 'powerUserMode', e.target.checked)}
                />
              }
              label="Power User Mode"
            />
          </Box>
        </Grid>
      </Grid>
    </PreferenceSection>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <PersonIcon sx={{ animation: 'spin 1s linear infinite' }} />
        <Typography sx={{ ml: 2 }}>Loading preferences...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          👤 User Preferences
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Customize your experience and personalize your workspace
        </Typography>
      </Box>

      {/* User Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
              {currentUser?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{currentUser?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser?.email} • {currentUser?.partyType}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date().toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePreferences}
                disabled={savePreferencesMutation.isLoading}
              >
                Save All Preferences
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Preferences Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Profile" />
        <Tab label="Interface" />
        <Tab label="Notifications" />
        <Tab label="Security" />
        <Tab label="Workflow" />
      </Tabs>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <ProfileTab />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <InterfaceTab />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <NotificationsTab />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <SecurityTab />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <WorkflowTab />
      </TabPanel>
    </Box>
  );
};

export default UserPreferences;

