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
  MenuItem,
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
  Receipt,
} from '@mui/icons-material';
import AppBar from '../components/AppBar';
import { BIHAR_CITIES } from '../utils/constants';
import { formatPrice, getCurrentLocation, getRelativeTime } from '../utils/helpers';

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
  providerName?: string;
  providerPhone?: string;
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
  providerLatitude?: number;
  providerLongitude?: number;
  providerLocationUpdatedAt?: string;
  arrivedAt?: string;
}

const UPI_ID = 'quickseva@upi';
const UPI_NAME = 'QuickSeva Bihar';

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
    paymentMethod: '',
    transactionId: '',
  });
  const [paymentSummary, setPaymentSummary] = useState<any | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const getUpiUri = () => {
    const amount = paymentSummary?.totalAmount ?? provider?.price ?? 0;
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: UPI_NAME,
      am: amount ? amount.toString() : '0',
      cu: 'INR',
      tn: 'Service booking payment',
    });
    return `upi://pay?${params.toString()}`;
  };

  useEffect(() => {
    loadBookingOrService();
  }, [id]);

  useEffect(() => {
    const fetchPaymentSummary = async () => {
      if (!provider?.serviceId || !provider?.price) {
        return;
      }
      setPaymentLoading(true);
      try {
        const response = await fetch('http://localhost:8080/api/payments/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId: provider.serviceId, basePrice: provider.price }),
        });
        const data = await response.json();
        if (data.success && data.data) {
          setPaymentSummary(data.data);
        }
      } catch (err) {
        // ignore payment summary errors
      } finally {
        setPaymentLoading(false);
      }
    };

    fetchPaymentSummary();
  }, [provider?.serviceId, provider?.price]);

  useEffect(() => {
    if (!id || user?.role !== 'CUSTOMER') return;
    let isActive = true;

    const fetchTracking = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/bookings/${id}/tracking`);
        const data = await response.json();
        if (isActive && data.success && data.data) {
          setBookingDetail(prev =>
            prev
              ? {
                  ...prev,
                  providerLatitude: data.data.providerLatitude,
                  providerLongitude: data.data.providerLongitude,
                  providerLocationUpdatedAt: data.data.providerLocationUpdatedAt,
                  arrivedAt: data.data.arrivedAt,
                  status: data.data.status || prev.status,
                }
              : prev
          );
        }
      } catch (err) {
        // Ignore tracking failures to avoid breaking the page
      }
    };

    fetchTracking();
    const intervalId = setInterval(fetchTracking, 15000);
    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [id, user?.role]);

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
    if (activeStep === 2) {
      if (!bookingData.paymentMethod) {
        setError('Please select a payment method');
        return;
      }
      if (bookingData.paymentMethod !== 'WALLET' && !bookingData.transactionId) {
        setError('Please enter a transaction ID');
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
    if (!bookingData.paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    if (bookingData.paymentMethod !== 'WALLET' && !bookingData.transactionId) {
      setError('Please enter a transaction ID');
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
        const bookingId = data.data?.id;
        if (!bookingId) {
          setError('Payment failed: booking ID missing.');
          return;
        }

        const paymentResponse = await fetch('http://localhost:8080/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            bookingId,
            paymentMethod: bookingData.paymentMethod,
            transactionId: bookingData.transactionId,
          }),
        });
        const paymentData = await paymentResponse.json();

        if (paymentData.success && paymentData.data?.paymentStatus === 'SUCCESS') {
          setSuccess('Payment successful! Booking confirmed.');
          setTimeout(() => navigate('/customer-dashboard'), 2000);
        } else if (paymentData.success && paymentData.data?.paymentStatus === 'PENDING_VERIFICATION') {
          setSuccess('Payment submitted. Booking will be confirmed after admin verification.');
          setTimeout(() => navigate('/customer-dashboard'), 2000);
        } else {
          setError(paymentData.message || 'Payment failed. Booking pending.');
        }
      } else {
        setError(data.message || 'Booking failed');
      }
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Service Details', 'Schedule & Address', 'Payment', 'Contact & Confirm'];

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
    const isCustomerView = user?.role === 'CUSTOMER';
    const primaryName = isCustomerView ? bookingDetail.providerName : bookingDetail.customerName;
    const secondaryPhone = isCustomerView ? bookingDetail.providerPhone : bookingDetail.customerPhone;
    const primaryLabel = isCustomerView ? 'Provider' : 'Customer';
    const contactLabel = isCustomerView ? 'Provider Contact' : 'Customer Contact';
    const dashboardPath = isCustomerView ? '/customer-dashboard' : '/provider-dashboard';
    const isArrived = Boolean(bookingDetail.arrivedAt) || bookingDetail.status === 'COMPLETED';
    const trackingStep =
      isArrived
        ? 2
        : bookingDetail.status === 'IN_PROGRESS'
          ? 1
          : bookingDetail.status === 'CONFIRMED'
            ? 0
            : -1;
    const trackingText =
      isArrived
        ? 'Provider has arrived'
        : bookingDetail.status === 'IN_PROGRESS'
          ? 'Provider is on the way'
          : bookingDetail.status === 'CONFIRMED'
            ? 'Provider assigned and preparing'
            : 'Tracking unavailable';
    const etaText =
      isArrived
        ? 'Arrived'
        : bookingDetail.status === 'IN_PROGRESS'
          ? '15-30 min'
          : bookingDetail.status === 'CONFIRMED'
            ? '30-45 min'
            : '—';
    const showTracking =
      isCustomerView &&
      ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(bookingDetail.status);
    const providerCoordsAvailable =
      typeof bookingDetail.providerLatitude === 'number' &&
      typeof bookingDetail.providerLongitude === 'number';
    const avatarText = (primaryName || 'P').trim().charAt(0).toUpperCase();

    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #F5F7FB 0%, #E8EEF7 100%)',
          backgroundAttachment: 'fixed',
        }}
      >
        <AppBar variant="simple" position="sticky" showBackButton showNavLinks={false} showAuthButtons={false} />
        <Container maxWidth="md" sx={{ py: 5 }}>
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)',
              backgroundColor: '#FFFFFF',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 5 }, fontFamily: '"Poppins", sans-serif' }}>
              <Box
                sx={{
                  mb: 3,
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #E6F0FF 0%, #F8FAFC 100%)',
                  border: '1px solid #DCE7FF',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                      Booking Details
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
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
                    sx={{ fontWeight: 700, px: 1 }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E9EEF5',
                      boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#EEF2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Person sx={{ color: '#4F46E5' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {primaryLabel}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {primaryName || 'N/A'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E9EEF5',
                      boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#E6FFFB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Phone sx={{ color: '#0F766E' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {contactLabel}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {maskPhone(secondaryPhone)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E9EEF5',
                      boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#FFF3E6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Payment sx={{ color: '#EA580C' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        ₹{displayAmount}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E9EEF5',
                      boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#EEF2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CalendarToday sx={{ color: '#3B82F6' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Scheduled
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {scheduledText}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E9EEF5',
                      boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#EEF2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LocationOn sx={{ color: '#3B82F6' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {displayLocation || 'N/A'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {showTracking && (
                <Paper
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: 4,
                    border: '1px solid #E9EEF5',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                    bgcolor: '#FFFFFF',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '12px',
                          bgcolor: '#EEF2FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MyLocation sx={{ color: '#4F46E5' }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          Live Tracking
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {trackingText}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {bookingDetail.providerLocationUpdatedAt
                            ? `Last updated ${getRelativeTime(bookingDetail.providerLocationUpdatedAt)}`
                            : 'Waiting for provider location'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={`ETA ${etaText}`}
                        color={isArrived ? 'success' : 'warning'}
                        sx={{ fontWeight: 700 }}
                      />
                      <Chip
                        label={trackingStep === 2 ? 'Arrived' : 'Tracking'}
                        color={trackingStep === 2 ? 'success' : 'info'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                  </Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid #E9EEF5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          bgcolor: '#FFFFFF',
                        }}
                      >
                        <Avatar sx={{ bgcolor: '#2563EB' }}>{avatarText}</Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {primaryLabel}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {primaryName || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {contactLabel}: {maskPhone(secondaryPhone)}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: '1px solid #E9EEF5',
                          bgcolor: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        <LocationOn sx={{ color: '#2563EB' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Destination
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {displayLocation || 'N/A'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                  <Box
                    sx={{
                      position: 'relative',
                      height: 200,
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid #E5EAF2',
                      background: 'linear-gradient(135deg, #F1F5FF 0%, #EAF6FF 100%)',
                    }}
                  >
                    {providerCoordsAvailable ? (
                      <Box
                        component="iframe"
                        title="Live tracking map"
                        sx={{
                          width: '100%',
                          height: '100%',
                          border: 0,
                        }}
                        src={`https://www.google.com/maps?q=${bookingDetail.providerLatitude},${bookingDetail.providerLongitude}&z=16&output=embed`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage:
                              'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25) 0, transparent 35%), radial-gradient(circle at 80% 70%, rgba(255,107,53,0.2) 0, transparent 40%)',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'relative',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 1,
                          }}
                        >
                          <LocationOn sx={{ fontSize: 52, color: '#2563EB' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                            {displayLocation || 'Destination'}
                          </Typography>
                        </Box>
                      </>
                    )}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 16,
                        bottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 999,
                        border: '1px solid #E5EAF2',
                      }}
                    >
                      <MyLocation sx={{ fontSize: 16, color: '#4F46E5' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#1F2937' }}>
                        Tracking provider location
                      </Typography>
                    </Box>
                  </Box>
                  <Stepper alternativeLabel activeStep={Math.max(trackingStep, 0)} sx={{ mt: 2 }}>
                    {['Confirmed', 'On the way', 'Arrived'].map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!displayLocation && !providerCoordsAvailable}
                      onClick={() => {
                        if (providerCoordsAvailable) {
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${bookingDetail.providerLatitude},${bookingDetail.providerLongitude}`,
                            '_blank'
                          );
                          return;
                        }
                        if (displayLocation) {
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation)}`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      Open Live Map
                    </Button>
                  </Box>
                </Paper>
              )}

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

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button variant="outlined" onClick={() => navigate(dashboardPath)} sx={{ px: 3 }}>
                    Back to Dashboard
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      navigate('/support', {
                        state: { bookingId: bookingDetail.id, category: 'BOOKING' },
                      })
                    }
                    sx={{ px: 3 }}
                  >
                    Need Help
                  </Button>
                </Box>
                {isCustomerView && (
                  <Button variant="contained" onClick={() => navigate('/search')} sx={{ bgcolor: '#FF6B35', px: 3 }}>
                    Book Another Service
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F5F7FB 0%, #E8EEF7 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
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
                          select
                          label="Payment Method"
                          value={bookingData.paymentMethod}
                          onChange={(e) => handleChange('paymentMethod', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Payment color="action" />
                              </InputAdornment>
                            ),
                          }}
                        >
                          <MenuItem value="">Select method</MenuItem>
                          <MenuItem value="WALLET">Wallet</MenuItem>
                          <MenuItem value="UPI">UPI</MenuItem>
                          <MenuItem value="CARD">Card</MenuItem>
                        </TextField>
                      </Grid>
                      {bookingData.paymentMethod === 'UPI' && (
                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ py: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                Pay via UPI
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Use this UPI ID to pay, then enter the transaction ID below.
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: { xs: 'column', sm: 'row' },
                                  gap: 2,
                                  alignItems: 'center',
                                  mb: 2,
                                }}
                              >
                                <Box
                                  component="img"
                                  alt="UPI QR"
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getUpiUri())}`}
                                  sx={{ width: 200, height: 200, border: '1px solid #eee', borderRadius: 1 }}
                                />
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Scan QR to pay
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    Amount: ₹{paymentSummary?.totalAmount ?? provider?.price ?? 0}
                                  </Typography>
                                </Box>
                              </Box>
                              <TextField
                                fullWidth
                                label="UPI ID"
                                value={UPI_ID}
                                InputProps={{ readOnly: true }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                      {bookingData.paymentMethod && bookingData.paymentMethod !== 'WALLET' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Transaction ID"
                            value={bookingData.transactionId}
                            onChange={(e) => handleChange('transactionId', e.target.value)}
                            placeholder="Enter payment reference"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Receipt color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ py: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                              Payment Summary
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Base Price</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ₹{paymentSummary?.basePrice ?? provider?.price ?? 0}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Commission</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ₹{paymentSummary?.commissionAmount ?? 0}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Total</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  ₹{paymentSummary?.totalAmount ?? provider?.price ?? 0}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
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

                {activeStep === 3 && (
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
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Payment:</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight={600}>{bookingData.paymentMethod || '-'}</Typography>
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
                      'Pay & Confirm'
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
