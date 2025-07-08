import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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

const DirectTest = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);

  const testDirectApiCall = async () => {
    try {
      setLoading(true);
      setError('');
      setContracts([]);
      setApiResponse(null);

      console.log('🧪 [DirectTest] Starting direct API call...');
      
      // Get current user ID from localStorage or use test user ID
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No auth token found. Please login first.');
        return;
      }

      // Decode token to get user ID (simple approach)
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;
      
      console.log('🧪 [DirectTest] User ID from token:', userId);
      console.log('🧪 [DirectTest] Calling apiService.getContracts...');

      const result = await apiService.getContracts(userId);
      
      console.log('🧪 [DirectTest] API call completed');
      console.log('🧪 [DirectTest] Raw result:', result);
      console.log('🧪 [DirectTest] Result type:', typeof result);
      console.log('🧪 [DirectTest] Has contracts:', !!result?.contracts);
      console.log('🧪 [DirectTest] Contracts length:', result?.contracts?.length || 0);

      setApiResponse(result);
      
      if (result?.contracts) {
        setContracts(result.contracts);
        console.log('🧪 [DirectTest] Contracts set successfully:', result.contracts.length);
      } else {
        console.log('🧪 [DirectTest] No contracts found in response');
        setError('No contracts found in API response');
      }

    } catch (error) {
      console.error('🧪 [DirectTest] Error:', error);
      setError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Direct API Test
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Direct API Call
          </Typography>
          
          <Button
            variant="contained"
            onClick={testDirectApiCall}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Test Direct API Call'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {apiResponse && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                API Response Details
              </Typography>
              <Typography variant="body2" component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                {JSON.stringify(apiResponse, null, 2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {contracts.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Contracts Found ({contracts.length})
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contract ID</TableCell>
                    <TableCell>Dataset</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Model</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.contractId}</TableCell>
                      <TableCell>{contract.dataset?.name}</TableCell>
                      <TableCell>${contract.price}</TableCell>
                      <TableCell>{contract.status}</TableCell>
                      <TableCell>{contract.modelId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mt: 3, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            1. Make sure you're logged in to the main app
          </Typography>
          <Typography variant="body2" paragraph>
            2. Click "Test Direct API Call" to test the API directly
          </Typography>
          <Typography variant="body2" paragraph>
            3. Check the browser console for detailed logs
          </Typography>
          <Typography variant="body2">
            4. This bypasses React Query to isolate the API issue
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DirectTest; 