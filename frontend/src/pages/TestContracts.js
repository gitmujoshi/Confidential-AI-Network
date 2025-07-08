import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { apiService } from '../services/api';

const TestContracts = () => {
  const [email, setEmail] = useState('tdcuser@example.com');
  const [password, setPassword] = useState('T8g#d4&Y@n$y');
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.login({ email, password });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('authToken', accessToken);
      setToken(accessToken);
      setUser(userData);
      
      console.log('✅ Login successful:', userData);
    } catch (error) {
      console.error('❌ Login failed:', error);
      setError('Login failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGetContracts = async () => {
    if (!user?.id) {
      setError('Please login first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.getContracts(user.id);
      setContracts(response.data.contracts || []);
      
      console.log('✅ Contracts fetched:', response.data);
    } catch (error) {
      console.error('❌ Failed to fetch contracts:', error);
      setError('Failed to fetch contracts: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setContracts([]);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Contracts Test Page
      </Typography>

      {/* Login Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Authentication Test
          </Typography>
          
          {!token ? (
            <Box>
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button
                variant="contained"
                onClick={handleLogin}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Login'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" gutterBottom>
                ✅ Logged in as: {user?.name} (ID: {user?.id})
              </Typography>
              <Button variant="outlined" onClick={handleLogout} sx={{ mr: 2 }}>
                Logout
              </Button>
              <Button
                variant="contained"
                onClick={handleGetContracts}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Get Contracts'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Contracts Display */}
      {contracts.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Contracts ({contracts.length})
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contract ID</TableCell>
                    <TableCell>Dataset</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.contractId}</TableCell>
                      <TableCell>{contract.dataset?.name}</TableCell>
                      <TableCell>${contract.price}</TableCell>
                      <TableCell>{contract.status}</TableCell>
                      <TableCell>
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card sx={{ mt: 3, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            1. Click "Login" to authenticate with the test user
          </Typography>
          <Typography variant="body2" paragraph>
            2. Click "Get Contracts" to fetch contracts for the user
          </Typography>
          <Typography variant="body2" paragraph>
            3. You should see 3 contracts displayed in the table
          </Typography>
          <Typography variant="body2">
            4. Check the browser console for detailed logs
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestContracts; 