import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Pending,
  Error,
  Person,
  Storage,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { apiService } from '../services/api';
import { useUser } from '../contexts/UserContext';

const StatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING_TDP_APPROVAL':
      case 'PENDING_CCRP_APPROVAL':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle fontSize="small" />;
      case 'PENDING_TDP_APPROVAL':
      case 'PENDING_CCRP_APPROVAL':
        return <Pending fontSize="small" />;
      case 'COMPLETED':
        return <CheckCircle fontSize="small" />;
      case 'CANCELLED':
        return <Error fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Chip
      label={status.replace(/_/g, ' ')}
      color={getStatusColor(status)}
      size="small"
      icon={getStatusIcon(status)}
    />
  );
};

const ContractRow = ({ contract, onView, onEdit, onDelete }) => (
  <TableRow hover>
    <TableCell>
      <Typography variant="body2" fontWeight="medium">
        {contract.contractId}
      </Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">{contract.dataset?.name}</Typography>
    </TableCell>
    <TableCell>
      <Box display="flex" flexDirection="column" gap={0.5}>
        <Typography variant="body2" fontSize="0.75rem">
          TDP: {contract.tdp?.name}
        </Typography>
        <Typography variant="body2" fontSize="0.75rem">
          TDC: {contract.tdc?.name}
        </Typography>
        {contract.ccrp && (
          <Typography variant="body2" fontSize="0.75rem">
            CCRP: {contract.ccrp?.name}
          </Typography>
        )}
      </Box>
    </TableCell>
    <TableCell>
      <Typography variant="body2">${contract.price}</Typography>
    </TableCell>
    <TableCell>
      <Typography variant="body2">{contract.duration} days</Typography>
    </TableCell>
    <TableCell>
      <StatusChip status={contract.status} />
    </TableCell>
    <TableCell>
      <Typography variant="body2" fontSize="0.75rem">
        {format(new Date(contract.createdAt), 'MMM dd, yyyy')}
      </Typography>
    </TableCell>
    <TableCell>
      <Box display="flex" gap={1}>
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => onView(contract)}>
            <Visibility />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Contract">
          <IconButton size="small" onClick={() => onEdit(contract)}>
            <Edit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Contract">
          <IconButton 
            size="small" 
            onClick={() => onDelete(contract)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>
    </TableCell>
  </TableRow>
);

function Contracts() {
  const [statusFilter, setStatusFilter] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useUser();

  // Debug logging
  console.log('🔍 [Contracts] Current user:', currentUser);
  console.log('🔍 [Contracts] Auth token:', localStorage.getItem('authToken'));

  // Fetch contracts for the current authenticated user
  const { data: contractsResponse, isLoading, error } = useQuery(
    ['contracts', currentUser?.id, statusFilter],
    async () => {
      if (!currentUser?.id) {
        throw new Error('No authenticated user');
      }
      console.log('🔍 [Contracts] Fetching contracts for user ID:', currentUser.id);
      console.log('🔍 [Contracts] Status filter:', statusFilter);
      
      const result = await apiService.getContracts(currentUser.id);
      console.log('🔍 [Contracts] Raw API response:', result);
      console.log('🔍 [Contracts] Response type:', typeof result);
      console.log('🔍 [Contracts] Has contracts property:', !!result?.contracts);
      console.log('🔍 [Contracts] Contracts length:', result?.contracts?.length || 0);
      
      return result;
    },
    {
      enabled: !!currentUser?.id, // Only fetch if user is authenticated
      retry: false,
      staleTime: 30000, // Cache for 30 seconds
      onSuccess: (data) => {
        console.log('✅ [Contracts] Contracts fetched successfully:', data);
        console.log('✅ [Contracts] Data structure:', {
          hasData: !!data,
          hasContracts: !!data?.contracts,
          hasDataContracts: !!data?.data?.contracts,
          contractsLength: data?.contracts?.length || data?.data?.contracts?.length || 0,
          fullResponse: data
        });
      },
      onError: (error) => {
        console.error('❌ [Contracts] Error fetching contracts:', error);
        console.error('❌ [Contracts] Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }
  );

  const contracts = contractsResponse?.contracts || [];

  // Debug logging for contracts
  console.log('🔍 [Contracts] Contracts data:', contracts);
  console.log('🔍 [Contracts] Loading state:', isLoading);
  console.log('🔍 [Contracts] Error state:', error);

  const handleView = (contract) => {
    setSelectedContract(contract);
    setViewDialogOpen(true);
  };

  const handleEdit = (contract) => {
    // Navigate to contract detail page
    navigate(`/contracts/${contract.contractId}`);
  };

  const handleDelete = (contract) => {
    // Implement delete functionality
    console.log('Delete contract:', contract);
  };

  const handleCreateContract = () => {
    navigate('/contracts/create');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Contracts</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreateContract}>
          Create Contract
        </Button>
      </Box>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Debug Information</Typography>
            <Typography variant="body2">
              <strong>Current User:</strong> {currentUser ? `${currentUser.name} (ID: ${currentUser.id})` : 'Not logged in'}
            </Typography>
            <Typography variant="body2">
              <strong>Auth Token:</strong> {localStorage.getItem('authToken') ? 'Present' : 'Missing'}
            </Typography>
            <Typography variant="body2">
              <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2">
              <strong>Error:</strong> {error ? error.message : 'None'}
            </Typography>
            <Typography variant="body2">
              <strong>Contracts Count:</strong> {contracts.length}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            Loading contracts...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="error">
            Error loading contracts
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            {error.message}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      )}

      {/* Filter - Only show if not loading and no error */}
      {!isLoading && !error && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="PENDING_TDP_APPROVAL">Pending TDP Approval</MenuItem>
                    <MenuItem value="PENDING_CCRP_APPROVAL">Pending CCRP Approval</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="body2" color="textSecondary">
                  Showing {contracts.length} contracts
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Contracts Table - Only show if not loading and no error */}
      {!isLoading && !error && (
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contract ID</TableCell>
                  <TableCell>Dataset</TableCell>
                  <TableCell>Parties</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map((contract) => (
                  <ContractRow
                    key={contract.id}
                    contract={contract}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {!isLoading && !error && contracts.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No contracts found
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Create your first contract to get started
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreateContract}>
            Create Contract
          </Button>
        </Box>
      )}

      {/* Contract Detail Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedContract && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Contract Details</Typography>
                <StatusChip status={selectedContract.status} />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedContract.contractId}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Dataset:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {selectedContract.dataset?.name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Model ID:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {selectedContract.modelId}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Price:</strong>
                  </Typography>
                  <Typography variant="body1">
                    ${selectedContract.price}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Duration:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {selectedContract.duration} days
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Parties:</strong>
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person fontSize="small" />
                      <Typography variant="body2">
                        <strong>TDP:</strong> {selectedContract.tdp?.name} ({selectedContract.tdp?.email})
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person fontSize="small" />
                      <Typography variant="body2">
                        <strong>TDC:</strong> {selectedContract.tdc?.name} ({selectedContract.tdc?.email})
                      </Typography>
                    </Box>
                    {selectedContract.ccrp && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" />
                        <Typography variant="body2">
                          <strong>CCRP:</strong> {selectedContract.ccrp?.name} ({selectedContract.ccrp?.email})
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Terms & Conditions:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedContract.termsAndConditions}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Created:</strong>
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedContract.createdAt), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>
                
                {selectedContract.tdpSignedAt && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>TDP Signed:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedContract.tdpSignedAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Grid>
                )}
                
                {selectedContract.ccrpSignedAt && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>CCRP Signed:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedContract.ccrpSignedAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setViewDialogOpen(false);
                  navigate(`/contracts/${selectedContract.contractId}`);
                }}
              >
                View Full Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default Contracts; 