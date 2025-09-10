/**
 * Constraints Management Admin Page
 * 
 * This component provides a comprehensive interface for managing
 * constraint categories, fields, and values through the admin UI.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Stack,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';

const ConstraintsManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'category', 'field', 'value'
  const [dialogMode, setDialogMode] = useState(''); // 'create', 'edit', 'view'
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/admin/constraints/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load constraint categories');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (type, mode, data = {}) => {
    setDialogType(type);
    setDialogMode(mode);
    setFormData(data);
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({});
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (dialogType === 'category') {
      if (!formData.categoryKey) newErrors.categoryKey = 'Category key is required';
      if (!formData.name) newErrors.name = 'Name is required';
    } else if (dialogType === 'field') {
      if (!formData.fieldKey) newErrors.fieldKey = 'Field key is required';
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.fieldType) newErrors.fieldType = 'Field type is required';
    } else if (dialogType === 'value') {
      if (!formData.valueKey) newErrors.valueKey = 'Value key is required';
      if (!formData.label) newErrors.label = 'Label is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      const endpoint = getEndpoint();
      let response;
      
      if (dialogMode === 'create') {
        response = await apiService.post(endpoint, formData);
        toast.success(`${dialogType} created successfully`);
      } else {
        response = await apiService.put(`${endpoint}/${formData.id}`, formData);
        toast.success(`${dialogType} updated successfully`);
      }
      
      handleCloseDialog();
      loadCategories();
    } catch (error) {
      console.error(`Error saving ${dialogType}:`, error);
      toast.error(`Failed to save ${dialogType}`);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      const endpoint = getEndpoint(type);
      await apiService.delete(`${endpoint}/${id}`);
      toast.success(`${type} deleted successfully`);
      loadCategories();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const getEndpoint = (type = dialogType) => {
    const endpoints = {
      category: '/api/admin/constraints/categories',
      field: '/api/admin/constraints/fields',
      value: '/api/admin/constraints/values'
    };
    return endpoints[type];
  };

  const renderCategoryDialog = () => (
    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {dialogMode === 'create' ? 'Create' : 'Edit'} Constraint Category
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category Key"
              value={formData.categoryKey || ''}
              onChange={(e) => handleInputChange('categoryKey', e.target.value)}
              error={!!errors.categoryKey}
              helperText={errors.categoryKey}
              disabled={dialogMode === 'edit'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Icon"
              value={formData.icon || ''}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              placeholder="e.g., 📊"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Color"
              value={formData.color || ''}
              onChange={(e) => handleInputChange('color', e.target.value)}
              placeholder="e.g., #2196F3"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Display Order"
              value={formData.displayOrder || 0}
              onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive !== false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {dialogMode === 'create' ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderFieldDialog = () => (
    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {dialogMode === 'create' ? 'Create' : 'Edit'} Constraint Field
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Field Key"
              value={formData.fieldKey || ''}
              onChange={(e) => handleInputChange('fieldKey', e.target.value)}
              error={!!errors.fieldKey}
              helperText={errors.fieldKey}
              disabled={dialogMode === 'edit'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Field Type</InputLabel>
              <Select
                value={formData.fieldType || ''}
                onChange={(e) => handleInputChange('fieldType', e.target.value)}
                error={!!errors.fieldType}
              >
                <MenuItem value="select">Select</MenuItem>
                <MenuItem value="multiselect">Multi-Select</MenuItem>
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
                <MenuItem value="date">Date</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Display Order"
              value={formData.displayOrder || 0}
              onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired || false}
                  onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                />
              }
              label="Required"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive !== false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {dialogMode === 'create' ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderValueDialog = () => (
    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {dialogMode === 'create' ? 'Create' : 'Edit'} Constraint Value
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Value Key"
              value={formData.valueKey || ''}
              onChange={(e) => handleInputChange('valueKey', e.target.value)}
              error={!!errors.valueKey}
              helperText={errors.valueKey}
              disabled={dialogMode === 'edit'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Label"
              value={formData.label || ''}
              onChange={(e) => handleInputChange('label', e.target.value)}
              error={!!errors.label}
              helperText={errors.label}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Icon"
              value={formData.icon || ''}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              placeholder="e.g., 🔒"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Color"
              value={formData.color || ''}
              onChange={(e) => handleInputChange('color', e.target.value)}
              placeholder="e.g., #F44336"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Display Order"
              value={formData.displayOrder || 0}
              onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRecommended || false}
                  onChange={(e) => handleInputChange('isRecommended', e.target.checked)}
                />
              }
              label="Recommended"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive !== false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {dialogMode === 'create' ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Constraints Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage constraint categories, fields, and values for the system.
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Categories" />
        <Tab label="Fields" />
        <Tab label="Values" />
      </Tabs>

      {/* Categories Tab */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Constraint Categories</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('category', 'create')}
            >
              Add Category
            </Button>
          </Box>

          <Grid container spacing={2}>
            {categories.map((category) => (
              <Grid item xs={12} md={6} lg={4} key={category.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Typography sx={{ mr: 1, fontSize: '1.5rem' }}>
                        {category.icon}
                      </Typography>
                      <Typography variant="h6" color={category.color}>
                        {category.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {category.description}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Key: {category.categoryKey}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Fields: {category.fields?.length || 0}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <Chip
                        label={category.isActive ? 'Active' : 'Inactive'}
                        color={category.isActive ? 'success' : 'default'}
                        size="small"
                      />
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('category', 'edit', category)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete('category', category.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Fields Tab */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Constraint Fields</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('field', 'create')}
            >
              Add Field
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.flatMap(category => 
                  category.fields?.map(field => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{field.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {field.fieldKey}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={field.fieldType} size="small" />
                      </TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={field.isRequired ? 'Yes' : 'No'}
                          color={field.isRequired ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={field.isActive ? 'Active' : 'Inactive'}
                          color={field.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('field', 'edit', field)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete('field', field.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Values Tab */}
      {activeTab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Constraint Values</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('value', 'create')}
            >
              Add Value
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Value</TableCell>
                  <TableCell>Field</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Recommended</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.flatMap(category => 
                  category.fields?.flatMap(field => 
                    field.values?.map(value => (
                      <TableRow key={value.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {value.icon && (
                              <Typography sx={{ mr: 1 }}>{value.icon}</Typography>
                            )}
                            <Box>
                              <Typography variant="subtitle2">{value.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {value.valueKey}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{field.name}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={value.isRecommended ? 'Yes' : 'No'}
                            color={value.isRecommended ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={value.isActive ? 'Active' : 'Inactive'}
                            color={value.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('value', 'edit', value)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete('value', value.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Dialogs */}
      {dialogType === 'category' && renderCategoryDialog()}
      {dialogType === 'field' && renderFieldDialog()}
      {dialogType === 'value' && renderValueDialog()}
    </Box>
  );
};

export default ConstraintsManagement;
