import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  VerifiedUser,
  Business,
  Public,
  Security,
  CheckCircle,
  Error,
  Warning,
  Info,
  ContentCopy
} from '@mui/icons-material';

const DIDInfoCard = ({ did, didSource, didVerified, didVerificationMethod, isEnterprise = false }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'web':
        return <Business color="primary" />;
      case 'ethr':
        return <Public color="primary" />;
      default:
        return <VerifiedUser color="primary" />;
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'web':
        return 'primary';
      case 'ethr':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'USER_PROVIDED':
        return 'success';
      case 'SYSTEM_GENERATED':
        return 'info';
      case 'ENTERPRISE_GENERATED':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getVerificationIcon = (verified) => {
    return verified ? <CheckCircle color="success" /> : <Error color="error" />;
  };

  const getVerificationColor = (verified) => {
    return verified ? 'success' : 'error';
  };

  const parseDID = (didString) => {
    if (!didString) return null;
    
    const parts = didString.split(':');
    if (parts.length >= 3) {
      return {
        method: parts[1],
        identifier: parts.slice(2).join(':'),
        full: didString
      };
    }
    return null;
  };

  const parsedDID = parseDID(did);

  if (!did) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUser color="action" />
            Digital Identity
          </Typography>
          <Alert severity="info">
            No DID associated with this account
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getMethodIcon(parsedDID?.method)}
            Digital Identity
            {isEnterprise && (
              <Chip 
                label="Enterprise" 
                size="small" 
                color="primary" 
                icon={<Business />}
              />
            )}
          </Typography>
          <Tooltip title="Copy DID">
            <IconButton 
              size="small" 
              onClick={() => copyToClipboard(did)}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* DID Display */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Decentralized Identifier
          </Typography>
          <Box sx={{ 
            p: 1.5, 
            bgcolor: 'grey.50', 
            borderRadius: 1, 
            border: '1px solid',
            borderColor: 'grey.200',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            wordBreak: 'break-all'
          }}>
            {did}
          </Box>
        </Box>

        {/* DID Information Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Method
            </Typography>
            <Chip 
              label={parsedDID?.method?.toUpperCase() || 'Unknown'} 
              color={getMethodColor(parsedDID?.method)}
              size="small"
              icon={getMethodIcon(parsedDID?.method)}
            />
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Source
            </Typography>
            <Chip 
              label={didSource?.replace('_', ' ') || 'Unknown'} 
              color={getSourceColor(didSource)}
              size="small"
            />
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Verification Status
            </Typography>
            <Chip 
              label={didVerified ? 'Verified' : 'Not Verified'} 
              color={getVerificationColor(didVerified)}
              size="small"
              icon={getVerificationIcon(didVerified)}
            />
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Verification Method
            </Typography>
            <Chip 
              label={didVerificationMethod?.replace('_', ' ') || 'None'} 
              variant="outlined"
              size="small"
              icon={<Security />}
            />
          </Grid>
        </Grid>

        {/* Enterprise-specific information */}
        {isEnterprise && parsedDID?.method === 'web' && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business color="primary" />
              Enterprise Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Domain
                </Typography>
                <Chip 
                  label={parsedDID.identifier.split(':')[0]} 
                  color="primary" 
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              {parsedDID.identifier.includes(':') && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    User Path
                  </Typography>
                  <Chip 
                    label={parsedDID.identifier.split(':').slice(1).join(':')} 
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* DID Method Information */}
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="action" />
            DID Method Information
          </Typography>
          
          {parsedDID?.method === 'web' ? (
            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>did:web</strong> - Web-based DIDs hosted on your organization's domain.
                Provides enterprise-grade identity management with domain control.
              </Typography>
            </Alert>
          ) : parsedDID?.method === 'ethr' ? (
            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>did:ethr</strong> - Ethereum-based DIDs using blockchain addresses.
                Provides decentralized identity with cryptographic verification.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 1 }}>
              <Typography variant="body2">
                Unknown DID method. Please verify your DID format.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Recommendations */}
        {!didVerified && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning">
              <Typography variant="body2">
                Your DID is not verified. Please complete the verification process to ensure full functionality.
              </Typography>
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DIDInfoCard; 