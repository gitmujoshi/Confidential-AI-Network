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
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  TableSortLabel,
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
  ViewModule,
  ViewList,
  Description,
  Download,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { apiService } from '../services/api';
import { useUser } from '../contexts/UserContext';
import toast from 'react-hot-toast';

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

const ContractCard = ({ contract, onView, onEdit, onDelete, onDownloadContract, onDownloadLegalDocument }) => {
  // Check if this is a multi-TDP contract
  const isMultiTDPContract = contract?.datasets && contract.datasets.length > 1;
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Typography variant="h6" component="h2" gutterBottom fontFamily="monospace">
                  {contract.depaId || 'NULL'}
                </Typography>
          <Box display="flex" gap={1}>
            <StatusChip status={contract.status} />
            {isMultiTDPContract && (
              <Chip label="Multi-TDP" color="primary" size="small" />
            )}
          </Box>
        </Box>
        
        {isMultiTDPContract ? (
          // Multi-TDP contract display
          <>
            <Typography variant="body2" color="textSecondary" paragraph>
              <strong>Datasets:</strong> {contract.datasets.length} datasets
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={1} mb={2}>
              <Typography variant="body2" fontSize="0.75rem">
                <strong>TDC:</strong> {contract.tdc?.name}
              </Typography>
              {contract.ccrp && (
                <Typography variant="body2" fontSize="0.75rem">
                  <strong>CCRP:</strong> {contract.ccrp?.name}
                </Typography>
              )}
            </Box>
            
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip 
                label={`$${contract.datasets.reduce((sum, d) => sum + (d.price || 0), 0)}`} 
                size="small" 
                color="primary" 
              />
              <Chip label={`${contract.duration} days`} size="small" variant="outlined" />
              <Chip 
                label={`${contract.datasets.filter(d => d.tdpSigned).length}/${contract.datasets.length} signed`} 
                size="small" 
                variant="outlined"
                color={contract.datasets.filter(d => d.tdpSigned).length === contract.datasets.length ? 'success' : 'warning'}
              />
            </Box>
          </>
        ) : (
          // Single TDP contract display (legacy)
          <>
            <Typography variant="body2" color="textSecondary" paragraph>
              <strong>Dataset:</strong> {contract.dataset?.name || 'N/A'}
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={1} mb={2}>
              <Typography variant="body2" fontSize="0.75rem">
                <strong>TDP:</strong> {contract.tdp?.name}
              </Typography>
              <Typography variant="body2" fontSize="0.75rem">
                <strong>TDC:</strong> {contract.tdc?.name}
              </Typography>
              {contract.ccrp && (
                <Typography variant="body2" fontSize="0.75rem">
                  <strong>CCRP:</strong> {contract.ccrp?.name}
                </Typography>
              )}
            </Box>
            
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip label={`$${contract.price}`} size="small" color="primary" />
              <Chip label={`${contract.duration} days`} size="small" variant="outlined" />
            </Box>
          </>
        )}
        
        <Typography variant="body2" color="textSecondary" fontSize="0.75rem">
          Created: {format(new Date(contract.createdAt), 'MMM dd, yyyy')}
        </Typography>
      </CardContent>
      
      <CardActions>
        <Button size="small" onClick={() => onView(contract)}>
          View Details
        </Button>
        <Button size="small" onClick={() => onEdit(contract)} startIcon={<Edit />}>
          Edit
        </Button>
        <Button size="small" color="error" onClick={() => onDelete(contract)}>
          Delete
        </Button>
        <Button 
          size="small" 
          onClick={() => onDownloadContract(contract)}
          startIcon={<Download />}
        >
          Complete Contract
        </Button>
        {contract.legalDocument && (
          <Button 
            size="small" 
            onClick={() => onDownloadLegalDocument(contract)}
            startIcon={<Description />}
          >
            Legal Document
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const ContractRow = ({ contract, onView, onEdit, onDelete, onDownloadContract, onDownloadLegalDocument }) => {
  // Check if this is a multi-TDP contract
  const isMultiTDPContract = contract?.datasets && contract.datasets.length > 1;
  
  return (
    <TableRow hover>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="medium" fontFamily="monospace">
                    {contract.depaId || 'NULL'}
                  </Typography>
          {isMultiTDPContract && (
            <Chip label="Multi-TDP" color="primary" size="small" />
          )}
        </Box>
      </TableCell>
      <TableCell>
        {isMultiTDPContract ? (
          <Typography variant="body2">
            {contract.datasets.length} datasets
          </Typography>
        ) : (
          <Typography variant="body2">{contract.dataset?.name}</Typography>
        )}
      </TableCell>
      <TableCell>
        <Box display="flex" flexDirection="column" gap={0.5}>
          {isMultiTDPContract ? (
            <>
              <Typography variant="body2" fontSize="0.75rem">
                TDC: {contract.tdc?.name}
              </Typography>
              {contract.ccrp && (
                <Typography variant="body2" fontSize="0.75rem">
                  CCRP: {contract.ccrp?.name}
                </Typography>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {isMultiTDPContract 
            ? `$${contract.datasets.reduce((sum, d) => sum + (d.price || 0), 0)}`
            : `$${contract.price}`
          }
        </Typography>
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
          <Tooltip title="Download Complete Contract">
            <IconButton 
              size="small" 
              onClick={() => onDownloadContract(contract)}
              color="primary"
            >
              <Download />
            </IconButton>
          </Tooltip>
          {contract.legalDocument && (
            <Tooltip title="Download Legal Document">
              <IconButton 
                size="small" 
                onClick={() => onDownloadLegalDocument(contract)}
                color="secondary"
              >
                <Description />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

function Contracts() {
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
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

  // Filter contracts based on status
  const filteredContracts = contracts.filter(contract => {
    if (!statusFilter) return true;
    return contract.status === statusFilter;
  });

  // Sort filtered contracts
  const filteredAndSortedContracts = [...filteredContracts].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'contractId' || sortBy === 'dataset.name') {
      aValue = aValue?.toLowerCase() || '';
      bValue = bValue?.toLowerCase() || '';
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Debug logging for contracts
  console.log('🔍 [Contracts] Contracts data:', contracts);
  console.log('🔍 [Contracts] Loading state:', isLoading);
  console.log('🔍 [Contracts] Error state:', error);

  const handleView = (contract) => {
    setSelectedContract(contract);
    setViewDialogOpen(true);
  };

  const handleEdit = (contract) => {
    // Navigate to contract detail page with edit mode
    navigate(`/contracts/${contract.contractId}?edit=true`);
  };

  const handleDelete = (contract) => {
    // Implement delete functionality
    console.log('Delete contract:', contract);
  };

  const handleCreateContract = () => {
    navigate('/contracts/create');
  };

  const handleSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const saveContractLocally = async (contract) => {
    if (!contract) return;

    try {
      // Fetch complete contract data from API to get all details
      const completeContract = await apiService.getContract(contract.contractId);
      
      const contractData = {
        contractId: completeContract.contractId,
        status: completeContract.status,
        createdAt: completeContract.createdAt,
        updatedAt: completeContract.updatedAt,
        duration: completeContract.duration,
        price: completeContract.price,
        totalPrice: completeContract.totalPrice,
        termsAndConditions: completeContract.termsAndConditions,
        
        // Parties
        tdp: completeContract.tdp,
        tdc: completeContract.tdc,
        ccrp: completeContract.ccrp,
        
        // Dataset information
        dataset: completeContract.dataset,
        datasets: completeContract.datasets,
        contractDatasets: completeContract.contractDatasets,
        datasetCount: completeContract.datasetCount,
        tdpCount: completeContract.tdpCount,
        
        // Signatures and workflow
        tdpSigned: completeContract.tdpSigned,
        tdpSignedAt: completeContract.tdpSignedAt,
        ccrpSigned: completeContract.ccrpSigned,
        ccrpSignedAt: completeContract.ccrpSignedAt,
        tdpSignatures: completeContract.tdpSignatures,
        tdpPayments: completeContract.tdpPayments,
        multiTdpStatus: completeContract.multiTdpStatus,
        
        // Contract fields
        legalDocumentHash: completeContract.legalDocumentHash,
        ricardianSignature: completeContract.ricardianSignature,
        smartContractAddress: completeContract.smartContractAddress,
        smartContractNetwork: completeContract.smartContractNetwork,
        blockchainContractId: completeContract.blockchainContractId,
        legalDocument: completeContract.legalDocument,
        
        // Technical parameters
        trainingParams: completeContract.trainingParams,
        environmentSpecs: completeContract.environmentSpecs,
        kmsConfigs: completeContract.kmsConfigs,
        
        // Attestation and verification
        attestationVerified: completeContract.attestationVerified,
        attestationReport: completeContract.attestationReport,
        
        // Payment information
        paidAmount: completeContract.paidAmount,
        pendingAmount: completeContract.pendingAmount,
      };

      const blob = new Blob([JSON.stringify(contractData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${completeContract.contractId}_complete_contract.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Complete contract downloaded successfully!');
    } catch (error) {
      console.error('Error downloading complete contract:', error);
      toast.error('Failed to download complete contract. Please try again.');
    }
  };

  const saveLegalDocument = (contract) => {
    if (!contract.legalDocument) {
      toast.error('No legal document available to download.');
      return;
    }

    const legalDoc = typeof contract.legalDocument === 'string' 
      ? JSON.parse(contract.legalDocument) 
      : contract.legalDocument;

    const blob = new Blob([JSON.stringify(legalDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.contractId}_legal_document.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    toast.success('Legal document downloaded successfully!');
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

      {/* Filter and View Toggle - Only show if not loading and no error */}
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
              <Grid item xs={12} md={4}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, newViewMode) => {
                    if (newViewMode !== null) {
                      setViewMode(newViewMode);
                    }
                  }}
                  aria-label="view mode"
                  size="small"
                >
                  <ToggleButton value="grid" aria-label="grid view">
                    <ViewModule />
                  </ToggleButton>
                  <ToggleButton value="table" aria-label="table view">
                    <ViewList />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  {filteredAndSortedContracts.length} contracts
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Contracts Grid View */}
      {!isLoading && !error && viewMode === 'grid' && (
        <Grid container spacing={3}>
          {filteredAndSortedContracts.map((contract) => (
            <Grid item xs={12} sm={6} md={4} key={contract.id}>
              <ContractCard
                contract={contract}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDownloadContract={saveContractLocally}
                onDownloadLegalDocument={saveLegalDocument}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Contracts Table View */}
      {!isLoading && !error && viewMode === 'table' && (
        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'contractId'}
                        direction={sortBy === 'contractId' ? sortOrder : 'asc'}
                        onClick={() => handleSort('contractId')}
                      >
                        Contract ID (DEPA)
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'dataset.name'}
                        direction={sortBy === 'dataset.name' ? sortOrder : 'asc'}
                        onClick={() => handleSort('dataset.name')}
                      >
                        Dataset
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Parties</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'price'}
                        direction={sortBy === 'price' ? sortOrder : 'asc'}
                        onClick={() => handleSort('price')}
                      >
                        Price
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'duration'}
                        direction={sortBy === 'duration' ? sortOrder : 'asc'}
                        onClick={() => handleSort('duration')}
                      >
                        Duration
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'createdAt'}
                        direction={sortBy === 'createdAt' ? sortOrder : 'asc'}
                        onClick={() => handleSort('createdAt')}
                      >
                        Created
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedContracts.map((contract) => (
                    <ContractRow
                      key={contract.id}
                      contract={contract}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDownloadContract={saveContractLocally}
                      onDownloadLegalDocument={saveLegalDocument}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && filteredAndSortedContracts.length === 0 && (
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
                  <Typography variant="h6" gutterBottom fontFamily="monospace">
                    {selectedContract.depaId || 'NULL'}
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
                    <em>Not applicable</em>
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