import React, { useState, useEffect, useRef } from 'react';
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
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  AttachMoney,
  Description,
  Add,
  Delete,
  PhotoCamera,
  CheckCircle,
  ArrowBack,
  MyLocation,
  LocationOn,
  EditLocation,
  Phone,
  WhatsApp,
  Chat,
  AccessTime,
  CalendarToday,
  Label,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ServiceImage {
  file: File | null;
  preview: string;
}

const ProviderServiceUpload: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { user, provider } = useAuth();
  
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
  const [locationLoading, setLocationLoading] = useState(false);
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
  
  const [contactOptions, setContactOptions] = useState({
    allowDirectCall: true,
    allowWhatsApp: true,
    allowInAppChat: true,
  });
  
  const [availability, setAvailability] = useState({
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    availableFrom: '09:00',
    availableTo: '18:00',
    isAvailableNow: true,
  });
  
  const [tagInput, setTagInput] = useState('');
  
  const [locationMethod, setLocationMethod] = useState<'live' | 'manual'>('manual');
  const [liveLocation, setLiveLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    pincode?: string;
  } | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [serviceImages, setServiceImages] = useState<ServiceImage[]>([]);
  const serviceImageInputRef = useRef<HTMLInputElement>(null);

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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (!window.isSecureContext) {
      setError('Live location requires HTTPS or localhost. Please use manual entry.');
      return;
    }
    
    setError('');
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          // Reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || fallbackAddress;
          const locationAddress = data.address || {};
          const city =
            locationAddress.city ||
            locationAddress.town ||
            locationAddress.village ||
            locationAddress.county ||
            locationAddress.state_district ||
            locationAddress.state ||
            '';
          const pincode = locationAddress.postcode || '';
          
          setLiveLocation({ latitude, longitude, address, city, pincode });
          setServiceData({
            ...serviceData,
            serviceArea: address,
          });
          setError('');
        } catch (err) {
          const { latitude, longitude } = position.coords;
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLiveLocation({ latitude, longitude, address: fallbackAddress });
          setServiceData({
            ...serviceData,
            serviceArea: fallbackAddress,
          });
          setError('Failed to get address from location. Showing coordinates instead.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        let errorMessage = 'Failed to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location permission denied. Please enable location access in your browser settings or use manual entry.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. Please try again or use manual entry.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or use manual entry.';
            break;
          default:
            errorMessage += 'Please use manual entry.';
            break;
        }
        
        setError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const newImages: ServiceImage[] = [];
      let loadedCount = 0;
      const totalFiles = files.length;
      
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          loadedCount++;
          newImages.push({
            file,
            preview: e.target?.result as string,
          });
          if (loadedCount === totalFiles) {
            setServiceImages((prev) => {
              const updated = [...prev, ...newImages];
              return updated;
            });
          }
        };
        reader.onerror = (error) => {
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUploadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't prevent default if clicking directly on the input
    if ((e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple rapid clicks
    if (loading) {
      return;
    }
    
    // Use requestAnimationFrame to ensure the click happens properly
    requestAnimationFrame(() => {
      if (serviceImageInputRef.current) {
        try {
          serviceImageInputRef.current.click();
        } catch (error) {
          // Ignore click errors
        }
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setServiceImages(serviceImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!serviceData.title || !serviceData.description || !serviceData.basePrice) {
      setError('Please fill all required fields');
      return;
    }

    if (parseFloat(serviceData.basePrice) <= 0) {
      setError('Base price must be greater than 0');
      return;
    }

    // Validate service area
    if (!serviceData.serviceArea || serviceData.serviceArea.trim() === '') {
      setError('Please provide service area location');
      return;
    }

    if (!provider?.id && !user?.id) {
      setError('Session expired. Please login again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Use new dynamic service API
      const providerId = provider?.id || user?.id || '';
      const servicePayload = {
        providerId,
        serviceName: serviceData.title,
        description: serviceData.description,
        category: serviceData.category,
        basePrice: parseFloat(serviceData.basePrice),
        price: parseFloat(serviceData.basePrice),
        priceUnit: 'per service',
        serviceArea: serviceData.serviceArea,
        serviceAreas: serviceData.serviceArea ? [serviceData.serviceArea] : [],
        address: serviceData.serviceArea,
        city: liveLocation?.city || manualLocation || '',
        pincode: liveLocation?.pincode || '',
        availableDays: availability.availableDays,
        availableFrom: availability.availableFrom,
        availableTo: availability.availableTo,
        isAvailableNow: availability.isAvailableNow,
        allowDirectCall: contactOptions.allowDirectCall,
        allowWhatsApp: contactOptions.allowWhatsApp,
        allowInAppChat: contactOptions.allowInAppChat,
        serviceRadius: 5, // Default 5km
        latitude: liveLocation?.latitude,
        longitude: liveLocation?.longitude,
        tags: serviceData.tags,
      };
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/services/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicePayload),
      });

      let data: any = null;
      let errorMessage = '';
      if (!response.ok) {
        try {
          data = await response.json();
          errorMessage = data?.message || data?.error || '';
        } catch (error) {
          const errorText = await response.text();
          errorMessage = errorText;
        }
        setError(errorMessage || 'Failed to upload service. Please try again.');
        return;
      }
      
      data = await response.json();

      if (data.success && data.data) {
        setSuccess(true);
        setError('');
        setTimeout(() => {
          navigate('/provider-dashboard');
        }, 2000);
      } else {
        const errorMsg = data.message || data.error || 'Service upload failed';
        setError(errorMsg);
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
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <AppBar variant="simple" position="sticky" showBackButton />
      <Container maxWidth="lg">
        <Card
          sx={{
            mb: 3,
            p: { xs: 3, md: 4 },
            color: '#fff',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Add New Service
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Showcase your skills with clear details, pricing, and location.
          </Typography>
        </Card>

        <Card elevation={10} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 5 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                textAlign: 'center',
                mb: 1,
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
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
                  fullWidth
                  label="Category (Auto-detected)"
                  value={serviceData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="Category will be auto-detected from service name"
                  helperText="Category is automatically assigned based on similar services"
                  disabled={!!serviceData.category}
                />
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
                        <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: '#667eea' }}>₹</Typography>
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
                    Customer will see (with 10% commission):
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea', fontFamily: '"Poppins", sans-serif' }}>
                    ₹{serviceData.basePrice ? Math.round(parseFloat(serviceData.basePrice) * 1.1).toLocaleString('en-IN') : '0'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Poppins", sans-serif' }}>
                    Your earnings: ₹{serviceData.basePrice ? parseFloat(serviceData.basePrice).toLocaleString('en-IN') : '0'}
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

              {/* Tags Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Tags (Optional)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {serviceData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => {
                        const newTags = serviceData.tags.filter((_, i) => i !== index);
                        handleChange('tags', newTags);
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Add Tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        if (!serviceData.tags.includes(tagInput.trim())) {
                          handleChange('tags', [...serviceData.tags, tagInput.trim()]);
                        }
                        setTagInput('');
                      }
                    }}
                    placeholder="e.g., emergency, 24/7, certified"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Label />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Press Enter to add tag. Tags help customers find your service."
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {
                      if (tagInput.trim() && !serviceData.tags.includes(tagInput.trim())) {
                        handleChange('tags', [...serviceData.tags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                    sx={{ minWidth: 100 }}
                  >
                    Add
                  </Button>
                </Box>
              </Grid>

              {/* Contact Options */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Contact Options
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contactOptions.allowDirectCall}
                        onChange={(e) => setContactOptions({ ...contactOptions, allowDirectCall: e.target.checked })}
                        icon={<Phone />}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone sx={{ fontSize: 20 }} />
                        <Typography>Allow Direct Phone Calls</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contactOptions.allowWhatsApp}
                        onChange={(e) => setContactOptions({ ...contactOptions, allowWhatsApp: e.target.checked })}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WhatsApp sx={{ fontSize: 20, color: '#25D366' }} />
                        <Typography>Allow WhatsApp Contact</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contactOptions.allowInAppChat}
                        onChange={(e) => setContactOptions({ ...contactOptions, allowInAppChat: e.target.checked })}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chat sx={{ fontSize: 20 }} />
                        <Typography>Allow In-App Chat</Typography>
                      </Box>
                    }
                  />
                </FormGroup>
              </Grid>

              {/* Availability */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Availability
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Available From"
                      value={availability.availableFrom}
                      onChange={(e) => setAvailability({ ...availability, availableFrom: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTime />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Available To"
                      value={availability.availableTo}
                      onChange={(e) => setAvailability({ ...availability, availableTo: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTime />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={availability.isAvailableNow}
                          onChange={(e) => setAvailability({ ...availability, isAvailableNow: e.target.checked })}
                        />
                      }
                      label="Available for immediate booking"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Available Days:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <Chip
                          key={day}
                          label={day.substring(0, 3)}
                          onClick={() => {
                            const days = availability.availableDays;
                            if (days.includes(day)) {
                              setAvailability({
                                ...availability,
                                availableDays: days.filter((d) => d !== day),
                              });
                            } else {
                              setAvailability({
                                ...availability,
                                availableDays: [...days, day],
                              });
                            }
                          }}
                          color={availability.availableDays.includes(day) ? 'primary' : 'default'}
                          variant={availability.availableDays.includes(day) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Service Area with Location Options */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Service Area
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      variant={locationMethod === 'live' ? 'contained' : 'outlined'}
                      startIcon={loading && locationMethod === 'live' ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <MyLocation />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (loading || locationLoading) {
                          return;
                        }
                        setLocationMethod('live');
                        if (!liveLocation) {
                          getCurrentLocation();
                        } else {
                          setServiceData({
                            ...serviceData,
                            serviceArea: liveLocation.address,
                          });
                        }
                      }}
                      disabled={false}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 600,
                        bgcolor: locationMethod === 'live' ? '#667eea' : 'transparent',
                        borderColor: '#667eea',
                        color: locationMethod === 'live' ? 'white' : '#667eea',
                        '&:hover': {
                          bgcolor: locationMethod === 'live' ? '#5568d3' : 'rgba(102,126,234,0.08)',
                          borderColor: '#667eea',
                        },
                        '&:disabled': {
                          bgcolor: 'rgba(0,0,0,0.12)',
                          color: 'rgba(0,0,0,0.26)',
                        },
                      }}
                    >
                      {locationLoading && locationMethod === 'live' ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          Getting Location...
                        </>
                      ) : (
                        'Use Live Location'
                      )}
                    </Button>
                    <Button
                      variant={locationMethod === 'manual' ? 'contained' : 'outlined'}
                      startIcon={<EditLocation />}
                      onClick={() => setLocationMethod('manual')}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 600,
                        bgcolor: locationMethod === 'manual' ? '#667eea' : 'transparent',
                        borderColor: '#667eea',
                        color: locationMethod === 'manual' ? 'white' : '#667eea',
                        '&:hover': {
                          bgcolor: locationMethod === 'manual' ? '#5568d3' : 'rgba(102,126,234,0.08)',
                          borderColor: '#667eea',
                        },
                      }}
                    >
                      Enter Manually
                    </Button>
                  </Box>

                  {locationMethod === 'live' ? (
                    <Box>
                      {liveLocation ? (
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: 'rgba(76,175,80,0.08)',
                            border: '2px solid #4CAF50',
                            borderRadius: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOn sx={{ color: '#4CAF50', mr: 1 }} />
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', fontFamily: '"Poppins", sans-serif' }}>
                              Current Location
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Poppins", sans-serif', mb: 1 }}>
                            {liveLocation.address}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999', fontFamily: '"Poppins", sans-serif' }}>
                            Coordinates: {liveLocation.latitude.toFixed(6)}, {liveLocation.longitude.toFixed(6)}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<MyLocation />}
                            onClick={getCurrentLocation}
                            sx={{
                              mt: 1,
                              textTransform: 'none',
                              fontFamily: '"Poppins", sans-serif',
                              color: '#4CAF50',
                            }}
                          >
                            Refresh Location
                          </Button>
                        </Paper>
                      ) : (
                        <Paper
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            border: '2px dashed #667eea',
                            borderRadius: 2,
                            bgcolor: 'rgba(102,126,234,0.05)',
                          }}
                        >
                          <MyLocation sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                          <Typography variant="body1" sx={{ mb: 2, fontFamily: '"Poppins", sans-serif' }}>
                            Click "Use Live Location" to get your current location
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  ) : (
                    <TextField
                      fullWidth
                      label="Service Area"
                      value={manualLocation}
                      onChange={(e) => {
                        const value = e.target.value;
                        setManualLocation(value);
                        setServiceData({
                          ...serviceData,
                          serviceArea: value,
                        });
                      }}
                      placeholder="e.g., Patna, Boring Road, Bihar"
                      helperText="Enter the area where you provide this service"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  )}
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
                <Box
                  component="div"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '2px dashed #667eea',
                    borderRadius: 2,
                    cursor: 'pointer',
                    userSelect: 'none',
                    position: 'relative',
                    bgcolor: 'white',
                    '&:hover': { 
                      bgcolor: 'rgba(102,126,234,0.05)',
                      borderColor: '#764ba2',
                    },
                    '&:active': {
                      bgcolor: 'rgba(102,126,234,0.1)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  onClick={handleUploadClick}
                >
                  <PhotoCamera sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, fontFamily: '"Poppins", sans-serif', color: '#1a1a1a' }}>
                    Upload Service Photos
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Poppins", sans-serif', display: 'block', mb: 0.5 }}>
                    Show your previous work, tools, or setup
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: '"Poppins", sans-serif', color: '#667eea', fontWeight: 600 }}>
                    Max 5 images • Click to browse
                  </Typography>
                  <input
                    type="file"
                    ref={serviceImageInputRef}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 2,
                      fontSize: 0,
                    }}
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </Box>

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
                      disabled={false}
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

