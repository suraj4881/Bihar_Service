import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
  Paper,
  Divider,
  Avatar,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday,
  AccessTime,
  LocationOn,
  Home,
  Notes,
  Person,
  Phone,
  Payment,
  CheckCircle,
  MyLocation,
} from '@mui/icons-material';
import AppBar from '../components/AppBar';
import { BIHAR_CITIES } from '../utils/constants';
import { formatPrice, getCurrentLocation } from '../utils/helpers';

interface Provider {
  id: string;
  name: string;
  skill: string;
  price: number;
  profilePhoto?: string;
  providerId?: string;
  serviceId?: string;
}

interface BookingDetail {
  id: string;
  serviceName?: string;
  service?: string;
  serviceCategory?: string;
  providerId: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  price?: number;
  totalAmount?: number;
  address?: string;
  city?: string;
  pincode?: string;
  scheduledDate?: string;
  bookingDate?: string;
}

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  
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
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return phone;
    return `${digits.slice(0, 2)}XXXX${digits.slice(-2)}`;
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);

  const [bookingData, setBookingData] = useState({
    serviceType: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    address: '',
    city: 'Patna',
    pincode: '',
    contactName: '',
    contactPhone: '',
  });

  useEffect(() => {
    loadBookingOrService();
  }, [id]);

  const loadBookingOrService = async () => {
    try {
      if (id) {
        const bookingResponse = await fetch(`http://localhost:8080/api/bookings/${id}`);
        const bookingData = await bookingResponse.json();
        if (bookingData.success && bookingData.data) {
          setBookingDetail(bookingData.data);
          setProvider(null);
          setLoading(false);
          return;
        }
      }

      const serviceResponse = await fetch(`http://localhost:8080/api/services/${id}`);
      const serviceData = await serviceResponse.json();
      if (!serviceData.success || !serviceData.data) {
        setProvider(null);
        setError('Failed to load service details');
        return;
      }

      const service = serviceData.data;
      let providerData = null;
      if (service.providerId) {
        const providerResponse = await fetch(`http://localhost:8080/api/users/${service.providerId}`);
        const providerPayload = await providerResponse.json();
        if (providerPayload.success) {
          providerData = providerPayload.data;
        }
      }

      const mappedProvider: Provider = {
        id: service.id,
        serviceId: service.id,
        providerId: service.providerId,
        name: providerData?.name || service.providerName || 'Provider',
        skill: service.serviceName || service.category || 'Service',
        price: service.finalPrice || service.basePrice || service.price || 0,
        profilePhoto: providerData?.profilePhoto
          ? `http://localhost:8080/api/files/serve?filePath=${encodeURIComponent(providerData.profilePhoto)}`
          : undefined,
      };

      setProvider(mappedProvider);
      setBookingData(prev => ({ ...prev, serviceType: mappedProvider.skill }));
    } catch (err) {
      setProvider(null);
      setError('Failed to load provider details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setBookingData({ ...bookingData, [field]: value });
    setError('');
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location.city) {
        setBookingData({ ...bookingData, city: location.city });
      }
    } catch (err) {
      setError('Could not get your location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!bookingData.description) {
        setError('Please describe your service requirement');
        return;
      }
    }
    if (activeStep === 1) {
      if (!bookingData.scheduledDate || !bookingData.address || !bookingData.city) {
        setError('Please fill all address and schedule fields');
        return;
      }
    }
    setError('');
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!bookingData.contactName || !bookingData.contactPhone) {
      setError('Please provide contact details');
      return;
    }

    if (!user?.id) {
      setError('Please login to continue booking');
      return;
    }

    if (!provider?.providerId || !provider?.serviceId) {
      setError('Service details missing. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const scheduledDate = bookingData.scheduledDate
        ? `${bookingData.scheduledDate}T${bookingData.scheduledTime || '00:00'}:00`
        : null;

      const response = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user.id,
          providerId: provider.providerId,
          serviceId: provider.serviceId,
          service: bookingData.serviceType,
          address: bookingData.address,
          city: bookingData.city,
          pincode: bookingData.pincode,
          scheduledDate,
          price: provider.price,
          specialInstructions: bookingData.description,
          emergencyContact: bookingData.contactName,
          emergencyPhone: bookingData.contactPhone,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Booking created successfully!');
        setTimeout(() => navigate('/customer-dashboard'), 2000);
      } else {
        setError(data.message || 'Booking failed');
      }
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Service Details', 'Schedule & Address', 'Contact & Confirm'];

  if (loading && !provider && !bookingDetail) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (bookingDetail) {
    const displayService = bookingDetail.serviceName || bookingDetail.service || 'Service';
    const displayAmount = bookingDetail.totalAmount ?? bookingDetail.price ?? 0;
    const displayLocation = [bookingDetail.address, bookingDetail.city, bookingDetail.pincode]
      .filter(Boolean)
      .join(', ');
    const scheduledText = bookingDetail.scheduledDate
      ? new Date(bookingDetail.scheduledDate).toLocaleString()
      : 'N/A';
    const createdText = bookingDetail.bookingDate
      ? new Date(bookingDetail.bookingDate).toLocaleString()
      : 'N/A';

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F6F7FB' }}>
        <AppBar variant="simple" position="sticky" showBackButton showNavLinks={false} showAuthButtons={false} />
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Booking
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {displayService}
                  </Typography>
                </Box>
                <Chip
                  label={bookingDetail.status}
                  color={
                    bookingDetail.status === 'COMPLETED'
                      ? 'success'
                      : bookingDetail.status === 'CANCELLED'
                        ? 'error'
                        : bookingDetail.status === 'IN_PROGRESS'
                          ? 'warning'
                          : bookingDetail.status === 'CONFIRMED'
                            ? 'info'
                            : 'default'
                  }
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#FBFBFD', border: '1px solid #EEF0F6' }}>
                    <Typography variant="caption" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {bookingDetail.customerName || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#FBFBFD', border: '1px solid #EEF0F6' }}>
                    <Typography variant="caption" color="text.secondary">
                      Contact
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {maskPhone(bookingDetail.customerPhone)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#FBFBFD', border: '1px solid #EEF0F6' }}>
                    <Typography variant="caption" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      ₹{displayAmount}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#FBFBFD', border: '1px solid #EEF0F6' }}>
                    <Typography variant="caption" color="text.secondary">
                      Scheduled
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {scheduledText}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#FBFBFD', border: '1px solid #EEF0F6' }}>
                    <Typography variant="caption" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {displayLocation || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Booking ID
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {bookingDetail.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {createdText}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="outlined" onClick={() => navigate('/customer-dashboard')}>
                  Back to Dashboard
                </Button>
                <Button variant="contained" onClick={() => navigate('/search')}>
                  Book Another Service
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA' }}>
      {/* Navigation */}
      <AppBar variant="simple" position="sticky" showBackButton showNavLinks={false} showAuthButtons={false} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Main Booking Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                  Book Service
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Fill in the details to book your service
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                {/* Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Step Content */}
                {activeStep === 0 && (
                  <Box>
                    <TextField
                      fullWidth
                      label="Service Type"
                      value={bookingData.serviceType}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <Home color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                    <TextField
                      fullWidth
                      label="Problem Description"
                      multiline
                      rows={4}
                      value={bookingData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Describe your issue in detail..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Notes color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Box>
                )}

                {activeStep === 1 && (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Preferred Date"
                          value={bookingData.scheduledDate}
                          onChange={(e) => handleChange('scheduledDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: new Date().toISOString().split('T')[0] }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarToday color="action" />
                              </InputAdornment>
                            ),
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="time"
                          label="Preferred Time"
                          value={bookingData.scheduledTime}
                          onChange={(e) => handleChange('scheduledTime', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTime color="action" />
                              </InputAdornment>
                            ),
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Service Address"
                          multiline
                          rows={2}
                          value={bookingData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          placeholder="House no., street, area..."
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Home color="action" />
                              </InputAdornment>
                            ),
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Autocomplete
                          options={BIHAR_CITIES}
                          value={bookingData.city}
                          onChange={(_, newValue) => handleChange('city', newValue || 'Patna')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="City/District"
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start">
                                      <LocationOn color="action" />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </>
                                ),
                                endAdornment: (
                                  <>
                                    {locationLoading ? <CircularProgress size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                    <IconButton
                                      size="small"
                                      onClick={handleGetLocation}
                                      disabled={locationLoading}
                                      title="Get Current Location"
                                    >
                                      <MyLocation fontSize="small" />
                                    </IconButton>
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Pincode"
                          value={bookingData.pincode}
                          onChange={(e) => handleChange('pincode', e.target.value)}
                          placeholder="800001"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {activeStep === 2 && (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Contact Person Name"
                          value={bookingData.contactName}
                          onChange={(e) => handleChange('contactName', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person color="action" />
                              </InputAdornment>
                            ),
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Contact Phone"
                          value={bookingData.contactPhone}
                          onChange={(e) => handleChange('contactPhone', e.target.value)}
                          placeholder="98XXXXXXXX"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone color="action" />
                              </InputAdornment>
                            ),
                          }}
                          required
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Booking Summary */}
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Booking Summary
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F5F5F5' }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Service:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight={600}>{bookingData.serviceType}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Date & Time:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight={600}>
                            {bookingData.scheduledDate} at {bookingData.scheduledTime}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Location:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight={600}>{bookingData.city}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    onClick={activeStep === 0 ? () => navigate(-1) : handleBack}
                    sx={{ px: 4 }}
                  >
                    {activeStep === 0 ? 'Cancel' : 'Back'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                    disabled={loading}
                    sx={{
                      px: 4,
                      bgcolor: '#FF6B35',
                      '&:hover': { bgcolor: '#E64A19' },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : activeStep === steps.length - 1 ? (
                      'Confirm Booking'
                    ) : (
                      'Next'
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Provider Info Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 88 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Provider Details
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={provider?.profilePhoto}
                    sx={{ width: 60, height: 60, bgcolor: '#FF6B35', mr: 2 }}
                  >
                    {provider?.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {provider?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {provider?.skill}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estimated Cost
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight={700}>
                    {formatPrice(provider?.price || 0)}+
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    *Actual cost may vary based on work
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" gutterBottom>
                    <CheckCircle fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: '#4CAF50' }} />
                    Verified Provider
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <CheckCircle fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: '#4CAF50' }} />
                    Secure Payment
                  </Typography>
                  <Typography variant="body2">
                    <CheckCircle fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: '#4CAF50' }} />
                    100% Satisfaction Guaranteed
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default BookingPage;
