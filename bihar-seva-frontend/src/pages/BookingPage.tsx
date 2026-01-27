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
  StepConnector,
  stepConnectorClasses,
  styled,
  alpha,
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
  AccountBalanceWallet,
  CreditCard,
  AccountBalance,
  Security,
  Lock,
  VerifiedUser,
  ArrowForward,
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


// Styled Stepper Connector
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

// Styled Step Icon
const StepIconRoot = styled('div')<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ theme, ownerState }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 50,
    height: 50,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...(ownerState.active && {
      backgroundImage: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      boxShadow: '0 4px 10px 0 rgba(255, 107, 53, 0.4)',
    }),
    ...(ownerState.completed && {
      backgroundImage: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    }),
  })
);

function StepIcon(props: { active?: boolean; completed?: boolean; icon: number }) {
  const { active, completed, icon } = props;
  const icons: { [index: string]: React.ReactElement } = {
    1: <Home />,
    2: <CalendarToday />,
    3: <Payment />,
    4: <CheckCircle />,
  };

  return (
    <StepIconRoot ownerState={{ completed, active }}>
      {icons[String(icon)]}
    </StepIconRoot>
  );
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
    paymentMethod: '',
    transactionId: '',
  });
  const [paymentSummary, setPaymentSummary] = useState<any | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

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

        if (bookingData.paymentMethod === 'WALLET') {
          const paymentResponse = await fetch('http://localhost:8080/api/payments/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              bookingId,
              paymentMethod: 'WALLET',
              transactionId: '',
            }),
          });
          const paymentData = await paymentResponse.json();

          if (paymentData.success && paymentData.data?.paymentStatus === 'SUCCESS') {
            setSuccess('Payment successful! Booking confirmed.');
            setTimeout(() => navigate('/customer-dashboard'), 2000);
          } else {
            setError(paymentData.message || 'Payment failed. Booking pending.');
          }
          return;
        }

        if (bookingData.paymentMethod === 'RAZORPAY') {
          const orderResponse = await fetch('http://localhost:8080/api/payments/razorpay/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId }),
          });
          const orderData = await orderResponse.json();
          if (!orderData.success) {
            setError(orderData.message || 'Failed to create payment order.');
            return;
          }

          const scriptLoaded = await new Promise<boolean>((resolve) => {
            if ((window as any).Razorpay) {
              resolve(true);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });

          if (!scriptLoaded) {
            setError('Failed to load Razorpay checkout.');
            return;
          }

          const options = {
            key: orderData.data.keyId,
            amount: orderData.data.amount,
            currency: orderData.data.currency,
            name: 'BiharSeva',
            description: 'Service Booking Payment',
            order_id: orderData.data.orderId,
            handler: async (response: any) => {
              const verifyRes = await fetch('http://localhost:8080/api/payments/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setSuccess('Payment successful! Booking confirmed.');
                setTimeout(() => navigate('/customer-dashboard'), 2000);
              } else {
                setError(verifyData.message || 'Payment verification failed.');
              }
            },
            prefill: {
              name: bookingData.contactName,
              contact: bookingData.contactPhone,
            },
            theme: {
              color: '#2563EB',
            },
          };
          const razorpay = new (window as any).Razorpay(options);
          razorpay.open();
          return;
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
            <Card 
              sx={{
                borderRadius: 4,
                boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)',
                border: '1px solid #E9EEF5',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontFamily: '"Poppins", sans-serif' }}>
                    Book Service
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                    Complete the steps below to book your service with ease
                  </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                {/* Enhanced Stepper */}
                <Box sx={{ mb: 5 }}>
                  <Stepper 
                    activeStep={activeStep} 
                    connector={<ColorlibConnector />}
                    sx={{
                      '& .MuiStepLabel-root': {
                        '& .MuiStepLabel-label': {
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: '#64748B',
                          '&.Mui-active': {
                            color: '#FF6B35',
                            fontWeight: 700,
                          },
                          '&.Mui-completed': {
                            color: '#FF6B35',
                          },
                        },
                      },
                    }}
                  >
                    {steps.map((label, index) => (
                      <Step key={label}>
                        <StepLabel StepIconComponent={StepIcon}>
                          <Typography variant="body2" sx={{ fontWeight: activeStep === index ? 700 : 500, mt: 1 }}>
                            {label}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                {/* Step Content */}
                {activeStep === 0 && (
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Home sx={{ color: '#FF6B35' }} />
                        Service Information
                      </Typography>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          mb: 3,
                          borderRadius: 3,
                          border: '2px solid #E9EEF5',
                          bgcolor: '#FAFBFC',
                          '&:hover': {
                            borderColor: '#FF6B35',
                            boxShadow: '0 4px 12px rgba(255, 107, 53, 0.1)',
                          },
                        }}
                      >
                        <CardContent>
                          <TextField
                            fullWidth
                            label="Service Type"
                            value={bookingData.serviceType}
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Home sx={{ color: '#FF6B35' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: '#FFFFFF',
                                '& fieldset': {
                                  borderColor: '#E9EEF5',
                                },
                              },
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Notes sx={{ color: '#FF6B35' }} />
                        Describe Your Requirement
                      </Typography>
                      <TextField
                        fullWidth
                        label="Problem Description"
                        multiline
                        rows={5}
                        value={bookingData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Please describe your service requirement in detail. Include any specific issues, preferences, or special instructions..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                              <Notes sx={{ color: '#FF6B35' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: '#E9EEF5',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: '#FF6B35',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#FF6B35',
                              borderWidth: 2,
                            },
                          },
                        }}
                        required
                      />
                    </Box>
                  </Box>
                )}

                {activeStep === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ color: '#FF6B35' }} />
                      Schedule & Location Details
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 3, 
                            bgcolor: '#F8FAFC',
                            border: '2px solid #E9EEF5',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 18, color: '#FF6B35' }} />
                            Preferred Date & Time
                          </Typography>
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
                                      <CalendarToday sx={{ color: '#FF6B35' }} />
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    bgcolor: '#FFFFFF',
                                    '& fieldset': {
                                      borderColor: '#E9EEF5',
                                      borderWidth: 2,
                                    },
                                    '&:hover fieldset': {
                                      borderColor: '#FF6B35',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: '#FF6B35',
                                      borderWidth: 2,
                                    },
                                  },
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
                                      <AccessTime sx={{ color: '#FF6B35' }} />
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    bgcolor: '#FFFFFF',
                                    '& fieldset': {
                                      borderColor: '#E9EEF5',
                                      borderWidth: 2,
                                    },
                                    '&:hover fieldset': {
                                      borderColor: '#FF6B35',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: '#FF6B35',
                                      borderWidth: 2,
                                    },
                                  },
                                }}
                                required
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 3, 
                            bgcolor: '#F8FAFC',
                            border: '2px solid #E9EEF5',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn sx={{ fontSize: 18, color: '#FF6B35' }} />
                            Service Location
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Service Address"
                                multiline
                                rows={3}
                                value={bookingData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="House no., street, area, landmark..."
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                      <Home sx={{ color: '#FF6B35' }} />
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    bgcolor: '#FFFFFF',
                                    '& fieldset': {
                                      borderColor: '#E9EEF5',
                                      borderWidth: 2,
                                    },
                                    '&:hover fieldset': {
                                      borderColor: '#FF6B35',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: '#FF6B35',
                                      borderWidth: 2,
                                    },
                                  },
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
                                            <LocationOn sx={{ color: '#FF6B35' }} />
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
                                            sx={{ color: '#FF6B35' }}
                                          >
                                            <MyLocation fontSize="small" />
                                          </IconButton>
                                        </>
                                      ),
                                    }}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        bgcolor: '#FFFFFF',
                                        '& fieldset': {
                                          borderColor: '#E9EEF5',
                                          borderWidth: 2,
                                        },
                                        '&:hover fieldset': {
                                          borderColor: '#FF6B35',
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: '#FF6B35',
                                          borderWidth: 2,
                                        },
                                      },
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
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    bgcolor: '#FFFFFF',
                                    '& fieldset': {
                                      borderColor: '#E9EEF5',
                                      borderWidth: 2,
                                    },
                                    '&:hover fieldset': {
                                      borderColor: '#FF6B35',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: '#FF6B35',
                                      borderWidth: 2,
                                    },
                                  },
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {activeStep === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Payment sx={{ color: '#FF6B35' }} />
                      Select Payment Method
                    </Typography>

                    {/* Payment Method Cards */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      <Grid item xs={12} sm={6}>
                        <Card
                          onClick={() => handleChange('paymentMethod', 'WALLET')}
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 3,
                            border: bookingData.paymentMethod === 'WALLET' ? '3px solid #FF6B35' : '2px solid #E9EEF5',
                            bgcolor: bookingData.paymentMethod === 'WALLET' ? '#FFF5F0' : '#FFFFFF',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: '#FF6B35',
                              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.15)',
                              transform: 'translateY(-2px)',
                            },
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {bookingData.paymentMethod === 'WALLET' && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: '#FF6B35',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(255, 107, 53, 0.4)',
                              }}
                            >
                              <CheckCircle sx={{ color: '#FFFFFF', fontSize: 20 }} />
                            </Box>
                          )}
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 2,
                                  bgcolor: '#FFF5F0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <AccountBalanceWallet sx={{ fontSize: 32, color: '#FF6B35' }} />
                              </Box>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                  Wallet
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Pay from your wallet
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                              <Security sx={{ fontSize: 16, color: '#10B981' }} />
                              <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                                Secure & Instant
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Card
                          onClick={() => handleChange('paymentMethod', 'RAZORPAY')}
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 3,
                            border: bookingData.paymentMethod === 'RAZORPAY' ? '3px solid #FF6B35' : '2px solid #E9EEF5',
                            bgcolor: bookingData.paymentMethod === 'RAZORPAY' ? '#FFF5F0' : '#FFFFFF',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: '#FF6B35',
                              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.15)',
                              transform: 'translateY(-2px)',
                            },
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {bookingData.paymentMethod === 'RAZORPAY' && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: '#FF6B35',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(255, 107, 53, 0.4)',
                              }}
                            >
                              <CheckCircle sx={{ color: '#FFFFFF', fontSize: 20 }} />
                            </Box>
                          )}
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 2,
                                  bgcolor: '#EEF2FF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <CreditCard sx={{ fontSize: 32, color: '#4F46E5' }} />
                              </Box>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                  Razorpay
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  UPI, Cards & More
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                              <Lock sx={{ fontSize: 16, color: '#10B981' }} />
                              <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                                SSL Encrypted
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {bookingData.paymentMethod === 'RAZORPAY' && (
                      <Alert 
                        severity="info" 
                        icon={<Security />}
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          bgcolor: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          '& .MuiAlert-icon': {
                            color: '#2563EB',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Secure Payment Gateway
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          You will be redirected to Razorpay's secure checkout to complete the payment. All major payment methods including UPI, Credit/Debit Cards, and Net Banking are supported.
                        </Typography>
                      </Alert>
                    )}

                    {bookingData.paymentMethod === 'WALLET' && (
                      <Alert 
                        severity="success" 
                        icon={<AccountBalanceWallet />}
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          bgcolor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          '& .MuiAlert-icon': {
                            color: '#10B981',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Instant Payment
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Payment will be processed instantly from your wallet balance. No redirect required.
                        </Typography>
                      </Alert>
                    )}

                    {/* Payment Summary Card */}
                    <Card 
                      sx={{ 
                        borderRadius: 3,
                        border: '2px solid #E9EEF5',
                        bgcolor: '#FAFBFC',
                        mb: 3,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountBalance sx={{ color: '#FF6B35' }} />
                          Payment Summary
                        </Typography>
                        {paymentLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={32} />
                          </Box>
                        ) : (
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid #E9EEF5' }}>
                              <Typography variant="body1" color="text.secondary">
                                Base Price
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                ₹{paymentSummary?.basePrice ?? provider?.price ?? 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid #E9EEF5' }}>
                              <Typography variant="body1" color="text.secondary">
                                Platform Commission (10%)
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                ₹{paymentSummary?.commissionAmount ?? 0}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                Total Amount
                              </Typography>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: '#FF6B35' }}>
                                ₹{paymentSummary?.totalAmount ?? provider?.price ?? 0}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    <Divider sx={{ my: 3 }} />

                    {/* Booking Summary */}
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#0F172A', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ color: '#FF6B35' }} />
                      Booking Summary
                    </Typography>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        borderRadius: 3,
                        bgcolor: '#F8FAFC',
                        border: '2px solid #E9EEF5',
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Home sx={{ fontSize: 18, color: '#FF6B35' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Service:
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A', ml: 4 }}>
                            {bookingData.serviceType}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarToday sx={{ fontSize: 18, color: '#FF6B35' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Date & Time:
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A', ml: 4 }}>
                            {bookingData.scheduledDate ? new Date(bookingData.scheduledDate).toLocaleDateString('en-IN', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'Not set'} at {bookingData.scheduledTime || 'Not set'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationOn sx={{ fontSize: 18, color: '#FF6B35' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Location:
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A', ml: 4 }}>
                            {bookingData.address ? `${bookingData.address}, ` : ''}{bookingData.city}{bookingData.pincode ? ` - ${bookingData.pincode}` : ''}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}

                {activeStep === 3 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ color: '#FF6B35' }} />
                      Contact Information
                    </Typography>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        borderRadius: 3, 
                        bgcolor: '#F8FAFC',
                        border: '2px solid #E9EEF5',
                        mb: 4,
                      }}
                    >
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Contact Person Name"
                            value={bookingData.contactName}
                            onChange={(e) => handleChange('contactName', e.target.value)}
                            placeholder="Enter your full name"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person sx={{ color: '#FF6B35' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: '#FFFFFF',
                                '& fieldset': {
                                  borderColor: '#E9EEF5',
                                  borderWidth: 2,
                                },
                                '&:hover fieldset': {
                                  borderColor: '#FF6B35',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#FF6B35',
                                  borderWidth: 2,
                                },
                              },
                            }}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Contact Phone Number"
                            value={bookingData.contactPhone}
                            onChange={(e) => handleChange('contactPhone', e.target.value)}
                            placeholder="98XXXXXXXX"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Phone sx={{ color: '#FF6B35' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: '#FFFFFF',
                                '& fieldset': {
                                  borderColor: '#E9EEF5',
                                  borderWidth: 2,
                                },
                                '&:hover fieldset': {
                                  borderColor: '#FF6B35',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#FF6B35',
                                  borderWidth: 2,
                                },
                              },
                            }}
                            required
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            This number will be used for service provider contact and booking updates
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    <Divider sx={{ my: 3 }} />

                    {/* Final Booking Summary */}
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#0F172A', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedUser sx={{ color: '#FF6B35' }} />
                      Review Your Booking
                    </Typography>
                    <Card 
                      sx={{ 
                        borderRadius: 3,
                        border: '2px solid #E9EEF5',
                        bgcolor: '#FAFBFC',
                        mb: 3,
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 2,
                                  bgcolor: '#FFF5F0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Home sx={{ color: '#FF6B35' }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Service Type
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                  {bookingData.serviceType}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 2,
                                  bgcolor: '#EEF2FF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <CalendarToday sx={{ color: '#4F46E5' }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Scheduled Date & Time
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                  {bookingData.scheduledDate ? new Date(bookingData.scheduledDate).toLocaleDateString('en-IN', { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  }) : 'Not set'} at {bookingData.scheduledTime || 'Not set'}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 2,
                                  bgcolor: '#E6FFFB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <LocationOn sx={{ color: '#0F766E' }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Location
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                  {bookingData.city}{bookingData.pincode ? ` - ${bookingData.pincode}` : ''}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 2,
                                  bgcolor: '#F0FDF4',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Payment sx={{ color: '#10B981' }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Payment Method
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                  {bookingData.paymentMethod === 'WALLET' ? 'Wallet' : bookingData.paymentMethod === 'RAZORPAY' ? 'Razorpay (UPI/Cards)' : 'Not selected'}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                Total Amount
                              </Typography>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: '#FF6B35' }}>
                                ₹{paymentSummary?.totalAmount ?? provider?.price ?? 0}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    <Alert 
                      severity="info" 
                      icon={<Security />}
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        '& .MuiAlert-icon': {
                          color: '#2563EB',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Secure Booking
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your booking will be confirmed after successful payment. You'll receive a confirmation message with all details.
                      </Typography>
                    </Alert>
                  </Box>
                )}

                {/* Enhanced Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, gap: 2 }}>
                  <Button
                    onClick={activeStep === 0 ? () => navigate(-1) : handleBack}
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    sx={{ 
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      borderColor: '#E9EEF5',
                      color: '#64748B',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#FF6B35',
                        color: '#FF6B35',
                        bgcolor: '#FFF5F0',
                      },
                    }}
                  >
                    {activeStep === 0 ? 'Cancel' : 'Back'}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                    disabled={loading}
                    endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
                    sx={{
                      px: 5,
                      py: 1.5,
                      borderRadius: 2,
                      bgcolor: '#FF6B35',
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                      '&:hover': { 
                        bgcolor: '#E64A19',
                        boxShadow: '0 6px 16px rgba(255, 107, 53, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      '&:disabled': {
                        bgcolor: '#CBD5E1',
                        color: '#FFFFFF',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        Processing...
                      </>
                    ) : activeStep === steps.length - 1 ? (
                      'Pay & Confirm Booking'
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Provider Info Sidebar */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                position: 'sticky', 
                top: 88,
                borderRadius: 4,
                boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)',
                border: '1px solid #E9EEF5',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#0F172A', fontFamily: '"Poppins", sans-serif' }}>
                  Provider Details
                </Typography>
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: '#F8FAFC',
                    border: '2px solid #E9EEF5',
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={provider?.profilePhoto}
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: '#FF6B35', 
                        mr: 2,
                        border: '3px solid #FFF5F0',
                        boxShadow: '0 4px 12px rgba(255, 107, 53, 0.2)',
                      }}
                    >
                      {provider?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                        {provider?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {provider?.skill}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    icon={<VerifiedUser sx={{ fontSize: 18 }} />}
                    label="Verified Provider"
                    color="success"
                    sx={{ fontWeight: 600, bgcolor: '#F0FDF4', color: '#10B981' }}
                  />
                </Paper>
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: 'linear-gradient(135deg, #FFF5F0 0%, #FEF3F2 100%)',
                    border: '2px solid #FFE4D6',
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <AccountBalance sx={{ color: '#FF6B35', fontSize: 24 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Estimated Cost
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: '#FF6B35', fontWeight: 800, mb: 0.5 }}>
                    {formatPrice(provider?.price || 0)}+
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    *Final cost may vary based on actual work required
                  </Typography>
                </Paper>

                <Divider sx={{ my: 2.5 }} />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0F172A' }}>
                    Why Choose Us?
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: '#F0FDF4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle sx={{ color: '#10B981', fontSize: 20 }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                        Verified & Trusted Provider
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Security sx={{ color: '#2563EB', fontSize: 20 }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                        Secure Payment Gateway
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: '#FEF3C7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle sx={{ color: '#F59E0B', fontSize: 20 }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                        100% Satisfaction Guarantee
                      </Typography>
                    </Box>
                  </Box>
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
