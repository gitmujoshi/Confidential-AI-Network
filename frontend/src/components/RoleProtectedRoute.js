import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Box, Typography, Button } from '@mui/material';
import { Security, Home } from '@mui/icons-material';

const RoleProtectedRoute = ({ children, allowedRoles, fallbackPath = '/dashboard' }) => {
  const { currentUser: user } = useUser();
  const token = localStorage.getItem('authToken');
  
  // Check if user is authenticated
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (user && !allowedRoles.includes(user.partyType)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          p: 4
        }}
      >
        <Security sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have permission to access this page. 
          Required roles: {allowedRoles.join(', ')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your current role: {user?.partyType || 'Unknown'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Home />}
          onClick={() => window.location.href = fallbackPath}
        >
          Go to Dashboard
        </Button>
      </Box>
    );
  }
  
  return children;
};

export default RoleProtectedRoute; 