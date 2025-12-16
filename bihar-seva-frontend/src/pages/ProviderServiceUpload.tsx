import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  Alert,
  CircularProgress,
  MenuItem,
  Chip,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  AttachMoney,
  Description,
  Add,
  Delete,
  PhotoCamera,
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ServiceImage {
  file: File | null;
  preview: string;
}

const ProviderServiceUpload: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  // ✅ Sync language on mount from localStorage
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [serviceData, setServiceData] = useState({
    title: '',
    description: '',
    category: '',
    basePrice: '', // Provider's actual price
    expertiseLevel: 'INTERMEDIATE',
    estimatedDuration: '',
    serviceArea: '',
    tags: [] as string[],
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [serviceImages, setServiceImages] = useState<ServiceImage[]>([]);

  const categories = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Carpentry',
    'AC Repair',
    'Painting',
    'Appliance Repair',
    'Other Services',
  ];

  const expertiseLevels = [
    { value: 'BEGINNER', label: 'Beginner (0-2 years)' },
    { value: 'INTERMEDIATE', label: 'Intermediate (2-5 years)' },
    { value: 'EXPERT', label: 'Expert (5-10 years)' },
    { value: 'MASTER', label: 'Master (10+ years)' },
  ];

  const handleChange = (field: string, value: any) => {
    setServiceData({ ...serviceData, [field]: value });
    setError('');
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !serviceData.tags.includes(currentTag.trim())) {
      setServiceData({
        ...serviceData,
        tags: [...serviceData.tags, currentTag.trim()],
      });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setServiceData({
      ...serviceData,
      tags: serviceData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: ServiceImage[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({
            file,
            preview: e.target?.result as string,
          });
          if (newImages.length === files.length) {
            setServiceImages([...serviceImages, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setServiceImages(serviceImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!serviceData.title || !serviceData.description || !serviceData.category || !serviceData.basePrice) {
      setError('Please fill all required fields');
      return;
    }

    if (parseFloat(serviceData.basePrice) <= 0) {
      setError('Base price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('providerId', user?.id || '');
      formData.append('title', serviceData.title);
      formData.append('description', serviceData.description);
      formData.append('category', serviceData.category);
      formData.append('basePrice', serviceData.basePrice);
      formData.append('expertiseLevel', serviceData.expertiseLevel);
      formData.append('estimatedDuration', serviceData.estimatedDuration);
      formData.append('serviceArea', serviceData.serviceArea);
      formData.append('tags', JSON.stringify(serviceData.tags));
      
      // Upload service images
      serviceImages.forEach((image, index) => {
        if (image.file) {
          formData.append(`serviceImage${index}`, image.file);
        }
      });

      const response = await fetch('http://localhost:8080/api/providers/services/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setError('');
        setTimeout(() => {
          navigate('/provider-dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Service upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 100, color: '#4CAF50', mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Service Uploaded Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your service will be visible to customers after admin approval.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Note:</strong> Admin will review your pricing and may apply commission.
            </Typography>
            <CircularProgress />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <IconButton
          onClick={() => navigate('/provider-dashboard')}
          sx={{
            mb: 2,
            bgcolor: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
          }}
        >
          <ArrowBack />
        </IconButton>

        <Card elevation={10} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 5 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                textAlign: 'center',
                mb: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Upload Your Service Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
              Provide complete information about your service offering
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Alert severity="info" sx={{ mb: 4 }}>
              <strong>Important:</strong> Enter your actual base price. Admin will automatically add 20% commission for the final customer price.
            </Alert>

            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Service Title"
                  value={serviceData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Professional Home Plumbing Repair"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Detailed Description"
                  value={serviceData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your service, expertise, what's included, materials used, etc."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Description />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Service Category"
                  value={serviceData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Expertise Level"
                  value={serviceData.expertiseLevel}
                  onChange={(e) => handleChange('expertiseLevel', e.target.value)}
                >
                  {expertiseLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Pricing */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Pricing Details
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Your Base Price (₹)"
                  value={serviceData.basePrice}
                  onChange={(e) => handleChange('basePrice', e.target.value)}
                  placeholder="1000"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                  required
                  helperText="This is your earnings. Admin commission will be added separately."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(102, 126, 234, 0.08)',
                    border: '2px solid #667eea',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Customer will see (with 20% commission):
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                    ₹{serviceData.basePrice ? Math.round(parseFloat(serviceData.basePrice) * 1.2) : 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your earnings: ₹{serviceData.basePrice || 0}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration"
                  value={serviceData.estimatedDuration}
                  onChange={(e) => handleChange('estimatedDuration', e.target.value)}
                  placeholder="e.g., 2-3 hours"
                  helperText="How long does this service typically take?"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Service Area"
                  value={serviceData.serviceArea}
                  onChange={(e) => handleChange('serviceArea', e.target.value)}
                  placeholder="e.g., Patna, Boring Road"
                  helperText="Where do you provide this service?"
                />
              </Grid>

              {/* Tags */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Tags (Optional)
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Tags"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="e.g., Emergency, 24/7, Certified"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddTag}
                    startIcon={<Add />}
                    sx={{
                      minWidth: 120,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': { borderColor: '#764ba2', bgcolor: 'rgba(102,126,234,0.08)' },
                    }}
                  >
                    Add
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {serviceData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      sx={{ bgcolor: '#667eea' }}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Service Images */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Service Images (Optional)
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '2px dashed #667eea',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(102,126,234,0.05)' },
                  }}
                  component="label"
                >
                  <PhotoCamera sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    Upload Service Photos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Show your previous work, tools, or setup (Max 5 images)
                  </Typography>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </Paper>

                {serviceImages.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {serviceImages.map((image, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Paper sx={{ position: 'relative', p: 1 }}>
                          <img
                            src={image.preview}
                            alt={`Service ${index + 1}`}
                            style={{ width: '100%', borderRadius: 4 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': { bgcolor: 'white' },
                            }}
                          >
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                mt: 4,
                py: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a4294 100%)',
                  boxShadow: '0 6px 25px rgba(102,126,234,0.5)',
                  transform: 'translateY(-2px)',
                },
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: 2,
                transition: 'all 0.3s',
                textTransform: 'none',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Upload Service & Submit for Approval'}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ProviderServiceUpload;

