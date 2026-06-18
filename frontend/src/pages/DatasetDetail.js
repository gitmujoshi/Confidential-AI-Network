import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Storage,
  Person,
  Security,
  Lock,
  Verified,
  Warning,
  AttachMoney,
  CalendarToday,
  Description,
  Label,
  Visibility,
  Edit,
  Download,
  Upload,
  CloudUpload,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import HuggingfaceCatalogPanel from '../components/HuggingfaceCatalogPanel';
import HuggingfaceHubBadge from '../components/HuggingfaceHubBadge';
import { extractHfFromDataset } from '../utils/huggingface';

function DatasetDetail() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch dataset details
  const { data: dataset, isLoading, error, refetch } = useQuery(
    ['dataset', datasetId],
    () => apiService.getDataset(datasetId),
    {
      enabled: !!datasetId,
    }
  );

  const isOwner =
    currentUser &&
    dataset &&
    (currentUser.id === dataset.ownerId || currentUser.id === dataset.owner?.id);

  const handleUploadArtifacts = async () => {
    if (!dataset?.datasetId || uploadFiles.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      uploadFiles.forEach((f) => fd.append('files', f));
      fd.append('contentFormat', dataset.contentFormat || 'csv');
      await apiService.uploadDatasetArtifacts(dataset.datasetId, fd);
      await refetch();
      setUploadOpen(false);
      setUploadFiles([]);
      toast.success('Training files uploaded');
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load dataset details: {error.message}
      </Alert>
    );
  }

  if (!dataset) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        Dataset not found
      </Alert>
    );
  }

  const getConfidentialComputingColor = (required) => {
    return required ? 'warning' : 'success';
  };

  const getConfidentialComputingIcon = (required) => {
    return required ? <Security /> : <Storage />;
  };

  const getConfidentialComputingLabel = (required) => {
    return required ? 'Confidential Computing Required' : 'Standard Processing';
  };

  const hfDatasetRef = extractHfFromDataset(dataset);

  return (
    <Box sx={{ pt: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            {dataset.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
            {dataset.depaId || 'DEPA ID not assigned'}
          </Typography>
          {hfDatasetRef && (
            <Box sx={{ mt: 1 }}>
              <HuggingfaceHubBadge hfRef={hfDatasetRef} />
            </Box>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {dataset.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dataset Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip label={dataset.category} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body1">
                    {dataset.size} MB
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Record Count
                  </Typography>
                  <Typography variant="body1">
                    {dataset.recordCount?.toLocaleString() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Price
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${dataset.price}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Confidential Computing
                  </Typography>
                  <Chip
                    icon={getConfidentialComputingIcon(dataset.confidentialComputingRequired)}
                    label={getConfidentialComputingLabel(dataset.confidentialComputingRequired)}
                    color={getConfidentialComputingColor(dataset.confidentialComputingRequired)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={dataset.isActive ? 'Active' : 'Inactive'} 
                    color={dataset.isActive ? 'success' : 'error'}
                  />
                </Grid>
              </Grid>

              {hfDatasetRef && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <HuggingfaceCatalogPanel hfRef={hfDatasetRef} />
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
                Training artifacts
              </Typography>
              {dataset.physicalTrainingReady ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Ready for physical training (local Docker). Files:{' '}
                  {dataset.artifactFileCount ?? 0},{' '}
                  {(Number(dataset.artifactTotalBytes || 0) / (1024 * 1024)).toFixed(2)} MB
                  {dataset.artifactsUpdatedAt && (
                    <> · Updated {new Date(dataset.artifactsUpdatedAt).toLocaleString()}</>
                  )}
                  {hfDatasetRef && (
                    <> · Hub dataset <strong>{hfDatasetRef.repoId}</strong> is also available if files are omitted.</>
                  )}
                </Alert>
              ) : hfDatasetRef ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>Hub reference — local Docker training</AlertTitle>
                  No uploaded files yet. Local-docker jobs can load{' '}
                  <strong>{hfDatasetRef.repoId}</strong> from the Hugging Face Hub at run time (set{' '}
                  <code>HF_TOKEN</code> for gated repos).
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>Not ready for physical training</AlertTitle>
                  Upload at least one data file (e.g. CSV for tabular) so local-docker jobs use real data
                  instead of demo loaders.
                </Alert>
              )}
              {isOwner && currentUser?.partyType === 'TDP' && (
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => setUploadOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Add or replace training files
                </Button>
              )}

              {/* Tags */}
              {dataset.tags && dataset.tags.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    <Label sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {dataset.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </>
              )}

              {/* Data Classification */}
              {dataset.dataClassification && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Data Classification
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Classification Level
                      </Typography>
                      <Chip label={dataset.dataClassification} color="primary" />
                    </Grid>
                    {dataset.encryptionAlgorithm && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Encryption
                        </Typography>
                        <Typography variant="body2">
                          {dataset.encryptionAlgorithm}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

              {/* Compliance Requirements */}
              {dataset.complianceRequirements && dataset.complianceRequirements.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    <Verified sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Compliance Requirements
                  </Typography>
                  <List dense>
                    {dataset.complianceRequirements.map((requirement, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Verified fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText primary={requirement} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Owner Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                Owner Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="subtitle1">
                    {dataset.owner?.name || 'Unknown Owner'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataset.owner?.email || 'No email available'}
                  </Typography>
                </Box>
              </Box>
              {dataset.owner?.organization && (
                <Typography variant="body2" color="text.secondary">
                  Organization: {dataset.owner.organization}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Dataset Metadata */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                Metadata
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Created" 
                    secondary={new Date(dataset.createdAt).toLocaleDateString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Last Updated" 
                    secondary={new Date(dataset.updatedAt).toLocaleDateString()}
                  />
                </ListItem>
                {dataset.registrationDate && (
                  <ListItem>
                    <ListItemText 
                      primary="Registration Date" 
                      secondary={new Date(dataset.registrationDate).toLocaleDateString()}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {currentUser?.partyType === 'TDC' && (
                  <Button
                    variant="contained"
                    startIcon={<AttachMoney />}
                    fullWidth
                  >
                    Add to Contract
                  </Button>
                )}
                {currentUser?.partyType === 'TDP' && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    fullWidth
                  >
                    Edit Dataset
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  fullWidth
                >
                  Download Metadata
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  fullWidth
                >
                  View Raw Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Upload training files</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Replaces any previous files for this dataset. Use CSV for tabular (numeric features, integer label in the
            last column).
          </Typography>
          <Button variant="outlined" component="label" startIcon={<Upload />}>
            Choose files
            <input
              type="file"
              hidden
              multiple
              onChange={(e) => setUploadFiles(e.target.files ? Array.from(e.target.files) : [])}
            />
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            {uploadFiles.length} file(s) selected
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUploadArtifacts} variant="contained" disabled={uploading || uploadFiles.length === 0}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DatasetDetail;
