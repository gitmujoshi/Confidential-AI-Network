import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import { Wallet, ContentCopy, CheckCircle, Refresh, Info } from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';

// TODO: In production, these should be loaded from secure storage or user input
const testWallets = [
  {
    name: 'TDP Provider 1',
    role: 'TDP',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: process.env.REACT_APP_TDP_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
    description: 'Training Data Provider - Can create and manage datasets'
  },
  {
    name: 'TDC Consumer 1',
    role: 'TDC',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: process.env.REACT_APP_TDC_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
    description: 'Training Data Consumer - Can browse datasets and create contracts'
  },
  {
    name: 'TSP Provider 1',
    role: 'TSP',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: process.env.REACT_APP_CCRP_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
    description: 'Contract Compliance & Risk Provider - Can review and sign contracts'
  }
];

const WalletSwitcher = ({ open, onClose }) => {
  const { refreshUserData, isConnecting } = useUser();
  const [copiedAddress, setCopiedAddress] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleWalletSelect = async (wallet) => {
    console.log('🔄 [WalletSwitcher] Selected wallet:', wallet.name);
    setSelectedWallet(wallet);
    
    try {
      // Copy the private key to clipboard
      await navigator.clipboard.writeText(wallet.privateKey);
      setCopiedAddress(wallet.address);

      // Immediately try to detect the new account
      console.log('🔄 [WalletSwitcher] Attempting immediate account detection...');
      await refreshUserData();

    } catch (error) {
      console.error('❌ [WalletSwitcher] Failed to copy private key:', error);
      // Fallback: show the private key in the dialog
      setCopiedAddress(wallet.address);
    }
  };

  const handleCopyKey = async (wallet, event) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(wallet.privateKey);
      setCopiedAddress(wallet.address);
      setTimeout(() => setCopiedAddress(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 [WalletSwitcher] Manual refresh requested');
    setIsRefreshing(true);
    
    try {
      // Use the improved refresh function from UserContext
      await refreshUserData();
      console.log('✅ [WalletSwitcher] Refresh completed successfully');
    } catch (error) {
      console.error('❌ [WalletSwitcher] Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClose = () => {
    setCopiedAddress('');
    setSelectedWallet(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Wallet />
          <Typography variant="h6">Switch Wallet</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Select a test wallet to switch to that role. The private key will be copied to your clipboard.
          </Typography>
        </Alert>

        {selectedWallet && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{selectedWallet.name} selected!</strong> Private key copied to clipboard.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              Follow these steps:
            </Typography>
            <Box component="ol" sx={{ mt: 1, pl: 2 }}>
              <li>Open MetaMask</li>
              <li>If you see "duplicate account" error, the account is already imported</li>
              <li>Look for the account in your MetaMask account list</li>
              <li><strong>Click on the account</strong> to make it the active one</li>
              <li>Click "Refresh App" button below to update the interface</li>
            </Box>
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Note:</strong> If you get a "duplicate account" error, that's normal - the account is already imported. Just click on it in MetaMask to switch to it.
              </Typography>
            </Alert>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={isRefreshing || isConnecting}
              >
                {isRefreshing || isConnecting ? 'Refreshing...' : 'Refresh App'}
              </Button>
            </Box>
          </Alert>
        )}

        <List>
          {testWallets.map((wallet) => (
            <ListItem key={wallet.address} disablePadding>
              <ListItemButton
                onClick={() => handleWalletSelect(wallet)}
                sx={{
                  border: '1px solid',
                  borderColor: selectedWallet?.address === wallet.address ? 'success.main' : 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: selectedWallet?.address === wallet.address ? 'success.light' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {wallet.name}
                      </Typography>
                      <Chip
                        label={wallet.role}
                        size="small"
                        color={
                          wallet.role === 'TDP' ? 'primary' :
                          wallet.role === 'TDC' ? 'secondary' : 'success'
                        }
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        {wallet.address}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {wallet.description}
                      </Typography>
                    </Box>
                  }
                />
                <Box display="flex" alignItems="center" gap={1}>
                  {copiedAddress === wallet.address && (
                    <CheckCircle color="success" />
                  )}
                  <IconButton
                    size="small"
                    onClick={(e) => handleCopyKey(wallet, e)}
                    title="Copy private key"
                  >
                    <ContentCopy />
                  </IconButton>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box display="flex" alignItems="center" gap={1} sx={{ mt: 2 }}>
          <Info />
          <Typography variant="body2">
            <strong>Tip:</strong> If accounts are already imported, just click on them in MetaMask to switch. The "duplicate" error is normal and expected.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletSwitcher; 