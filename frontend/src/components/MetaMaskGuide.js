import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Download,
  Extension,
  Security,
  CheckCircle,
} from '@mui/icons-material';

const MetaMaskGuide = ({ onInstallClick }) => {
  const steps = [
    {
      icon: <Download />,
      text: 'Download MetaMask from the official website',
      action: 'Visit metamask.io'
    },
    {
      icon: <Extension />,
      text: 'Install the browser extension',
      action: 'Add to your browser'
    },
    {
      icon: <Security />,
      text: 'Create or import a wallet',
      action: 'Set up your account'
    },
    {
      icon: <CheckCircle />,
      text: 'Connect to the application',
      action: 'Return and connect'
    }
  ];

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          MetaMask Required
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This application requires MetaMask to connect to the blockchain and manage your digital identity.
        </Alert>

        <Typography variant="body1" paragraph>
          MetaMask is a secure wallet that allows you to:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText 
              primary="Securely manage your digital identity"
              secondary="Your private keys never leave your device"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle />
            </ListItemIcon>
            <ListItemText 
              primary="Sign contracts and transactions"
              secondary="Approve actions with your digital signature"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Extension />
            </ListItemIcon>
            <ListItemText 
              primary="Connect to blockchain applications"
              secondary="Interact with smart contracts securely"
            />
          </ListItem>
        </List>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Installation Steps:
        </Typography>

        <List>
          {steps.map((step, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {step.icon}
              </ListItemIcon>
              <ListItemText 
                primary={step.text}
                secondary={step.action}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Download />}
            onClick={onInstallClick}
          >
            Install MetaMask
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => window.location.reload()}
          >
            I've Installed MetaMask
          </Button>
        </Box>

        <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center' }}>
          After installing MetaMask, refresh this page and try connecting again.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MetaMaskGuide; 