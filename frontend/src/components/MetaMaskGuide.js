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
  Info,
} from '@mui/icons-material';

const MetaMaskGuide = ({ onInstallClick, isOptional = true }) => {
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
          {isOptional ? 'Connect MetaMask (Optional)' : 'MetaMask Required'}
        </Typography>
        
        <Alert severity={isOptional ? "info" : "warning"} sx={{ mb: 3 }}>
          {isOptional ? (
            <>
              <strong>Blockchain connection is optional for registration.</strong> You can complete registration without connecting a wallet, but you'll need MetaMask later for contract signing and blockchain operations.
            </>
          ) : (
            'This application requires MetaMask to connect to the blockchain and manage your digital identity.'
          )}
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

        {isOptional && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Registration without blockchain:</strong> You can register with just your email and basic information. 
              Blockchain features will be available after you connect your wallet later.
            </Typography>
          </Alert>
        )}

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

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
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
          {isOptional && (
            <Button
              variant="text"
              size="large"
              onClick={() => window.history.back()}
            >
              Skip for Now
            </Button>
          )}
        </Box>

        <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center' }}>
          {isOptional 
            ? "You can install MetaMask now or skip and connect later when you need blockchain features."
            : "After installing MetaMask, refresh this page and try connecting again."
          }
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MetaMaskGuide; 