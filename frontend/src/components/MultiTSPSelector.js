import React from 'react';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  AlertTitle,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper,
} from '@mui/material';
import { Remove, Security, Cloud } from '@mui/icons-material';

/**
 * MultiTSPSelector — Stripe-like selectable provider rows (not nested card stacks).
 */
const MultiTSPSelector = ({
  tspUsers = [],
  selectedTsp = '',
  selectedCloudProvider = '',
  onTspToggle,
  onCloudProviderChange,
  onTspCloudProviderSelect,
  tspCloudProviderSelections = {},
  disabled = false,
}) => {
  const filteredTspUsers = tspUsers.filter(
    (user) => !selectedCloudProvider || user.cloudProviders?.includes(selectedCloudProvider)
  );

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'Local':
        return 'default';
      case 'AWS':
        return 'warning';
      case 'Azure':
        return 'info';
      case 'GCP':
        return 'error';
      case 'OCI':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <FormControl fullWidth size="small" sx={{ mb: 2.5, maxWidth: 360 }}>
        <InputLabel>Cloud Provider</InputLabel>
        <Select
          value={selectedCloudProvider}
          label="Cloud Provider"
          onChange={(e) => onCloudProviderChange(e.target.value)}
          disabled={disabled}
        >
          <MenuItem value="">
            <em>All cloud providers</em>
          </MenuItem>
          <MenuItem value="Local">Local (Docker)</MenuItem>
          <MenuItem value="AWS">AWS</MenuItem>
          <MenuItem value="Azure">Azure</MenuItem>
          <MenuItem value="GCP">GCP</MenuItem>
          <MenuItem value="OCI">OCI</MenuItem>
        </Select>
      </FormControl>

      {!selectedTsp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>No TSP selected</AlertTitle>
          Choose a training service provider for confidential compute (optional).
        </Alert>
      )}

      <Stack spacing={1.25}>
        {filteredTspUsers.map((tsp) => {
          const tspKey = tsp.depaId || tsp.id;
          const isSelected = String(selectedTsp) === String(tspKey);

          return (
            <Paper
              key={tsp.id}
              variant="outlined"
              data-testid={`tsp-card-${tspKey}`}
              data-tsp-email={tsp.email || ''}
              data-selected={isSelected ? 'true' : 'false'}
              onClick={() => !disabled && onTspToggle(tspKey)}
              sx={{
                p: 1.75,
                cursor: disabled ? 'default' : 'pointer',
                borderColor: isSelected ? 'primary.main' : 'divider',
                borderWidth: isSelected ? 1.5 : 1,
                bgcolor: isSelected ? 'rgba(11, 107, 203, 0.04)' : 'background.paper',
                transition: 'border-color 120ms ease, background-color 120ms ease',
                '&:hover': disabled
                  ? {}
                  : {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(11, 107, 203, 0.03)',
                    },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Checkbox
                  checked={isSelected}
                  disabled={disabled}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => !disabled && onTspToggle(isSelected ? null : tspKey)}
                  color="primary"
                  inputProps={{ 'aria-label': `Select TSP ${tsp.name}` }}
                  sx={{ mt: -0.5, p: 0.5 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 0.5 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      {tsp.name}
                    </Typography>
                    {isSelected && (
                      <Chip
                        label="Selected"
                        color="primary"
                        size="small"
                        data-testid="tsp-selected-chip"
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                    {tsp.description || 'Confidential computing environment provider'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1, fontFamily: '"IBM Plex Mono", monospace' }}
                  >
                    {tsp.email}
                  </Typography>
                  {tsp.cloudProviders?.[0] && (
                    <Chip
                      icon={<Cloud sx={{ fontSize: '16px !important' }} />}
                      label={tsp.cloudProviders[0]}
                      color={getProviderColor(tsp.cloudProviders[0])}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {selectedTsp &&
        (() => {
          const selectedTspUser = tspUsers.find(
            (u) =>
              (u.depaId && u.depaId === selectedTsp) ||
              u.id === parseInt(selectedTsp, 10) ||
              u.id === selectedTsp ||
              String(u.id) === String(selectedTsp)
          );
          if (!selectedTspUser) return null;
          const providers = selectedTspUser.cloudProviders || [];
          const selectedKey = selectedTspUser.depaId || selectedTspUser.id;
          return (
            <Paper
              variant="outlined"
              sx={{
                mt: 2.5,
                p: 2,
                bgcolor: '#0b1220',
                color: '#f8fafc',
                borderColor: 'transparent',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                Selected TSP
              </Typography>
              <List dense disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36, color: '#93c5fd' }}>
                    <Security fontSize="small" />
                  </ListItemIcon>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {selectedTspUser.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }} display="block">
                      {selectedTspUser.email}
                    </Typography>
                    {providers.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {providers.map((provider) => (
                          <Chip
                            key={provider}
                            label={provider}
                            color={getProviderColor(provider)}
                            size="small"
                            sx={{ mr: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => onTspToggle(null)}
                      sx={{ color: '#cbd5e1' }}
                      disabled={disabled}
                      aria-label="Clear TSP selection"
                    >
                      <Remove />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              {providers.length > 1 && (
                <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                  <InputLabel sx={{ color: '#94a3b8' }}>Select cloud provider</InputLabel>
                  <Select
                    value={tspCloudProviderSelections[selectedKey] || ''}
                    label="Select cloud provider"
                    onChange={(e) => onTspCloudProviderSelect(selectedKey, e.target.value)}
                    disabled={disabled}
                    sx={{
                      color: '#f8fafc',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(148,163,184,0.35)',
                      },
                    }}
                  >
                    {providers.map((provider) => (
                      <MenuItem key={provider} value={provider}>
                        {provider}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Paper>
          );
        })()}

      {filteredTspUsers.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>No TSP providers available</AlertTitle>
          {selectedCloudProvider
            ? `No providers support ${selectedCloudProvider}. Try another filter.`
            : 'No TSP providers are currently available.'}
        </Alert>
      )}
    </Box>
  );
};

export default MultiTSPSelector;
