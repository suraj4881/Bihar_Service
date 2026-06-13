import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  Divider,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ArrowBack,
  Phone,
  Chat,
  LocationOn,
  Verified,
  Star,
  WorkOutline,
  Schedule,
  Language,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import { logAnalyticsEvent } from '../services/analyticsService';

interface Provider {
  id: string;
  name: string;
  skill: string;
  rating: number;
  totalReviews: number;
  city: string;
  price: number;
  isVerified: boolean;
  profilePhoto?: string;
  experience?: number;
  expertiseLevel?: string;
  about?: string;
  services?: string[];
  workingHours?: string;
  languages?: string[];
  serviceImages?: string[];
  serviceArea?: string;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

const ProviderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  
  // ✅ Sync language on mount from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const [callError, setCallError] = useState('');
  const [serviceProviderId, setServiceProviderId] = useState<string | null>(null);

  useEffect(() => {
    fetchProviderDetails();
  }, [id]);

  useEffect(() => {
    if (user?.id && id && serviceProviderId) {
      fetchBookingAccess(user.id, serviceProviderId, id);
    }
  }, [user?.id, id, serviceProviderId]);

  const fetchProviderDetails = async () => {
    try {
      const serviceResponse = await fetch(`http://localhost:8080/api/services/${id}`);
      const serviceData = await serviceResponse.json();
      if (!serviceData.success || !serviceData.data) {
        setProvider(null);
        setReviews([]);
        return;
      }

      const service = serviceData.data;
      setServiceProviderId(service.providerId || null);
      let userData: any = null;
      if (service.providerId) {
        const userResponse = await fetch(`http://localhost:8080/api/users/${service.providerId}`);
        const userPayload = await userResponse.json();
        if (userPayload.success) {
          userData = userPayload.data;
        }
      }

      const resolveImageUrl = (path?: string) => {
        if (!path) return undefined;
        if (path.startsWith('http://') || path.startsWith('https://')) {
          return path;
        }
        return `http://localhost:8080/api/files/serve?filePath=${encodeURIComponent(path)}`;
      };

      const mappedProvider: Provider = {
        id: service.id,
        name: userData?.name || service.providerName || 'Provider',
        skill: service.serviceName || service.category || 'Service',
        rating: service.averageRating || 0,
        totalReviews: service.totalReviews || 0,
        city: service.city || userData?.city || 'N/A',
        price: service.finalPrice || service.basePrice || service.price || 0,
        isVerified: Boolean(service.isApproved || userData?.isVerified),
        profilePhoto: resolveImageUrl(userData?.profilePhoto),
        experience: userData?.experience,
        about: service.description,
        services: service.tags || [],
        workingHours: service.availableFrom && service.availableTo
          ? `${service.availableFrom} - ${service.availableTo}`
          : undefined,
        languages: userData?.language ? [userData.language] : undefined,
        serviceImages: service.serviceImages || [],
        serviceArea: service.serviceArea || service.address,
        expertiseLevel: service.expertiseLevel,
      };

      setProvider(mappedProvider);
    } catch (error) {
      setProvider(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingAccess = async (userId: string, providerId: string, serviceId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/bookings/user/${userId}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const allowedStatuses = new Set(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']);
        const matched = data.data.find((booking: any) => (
          booking.providerId === providerId &&
          booking.serviceId === serviceId &&
          allowedStatuses.has(booking.status)
        ));
        if (matched) {
          setHasConfirmedBooking(true);
          setBookingId(matched.id);
          return;
        }
      }
      setHasConfirmedBooking(false);
      setBookingId(null);
    } catch (error) {
      setHasConfirmedBooking(false);
      setBookingId(null);
    }
  };

  const handleMaskedCall = async () => {
    if (!bookingId) {
      setCallError('Please book and confirm first to enable calling.');
      return;
    }

    setCallLoading(true);
    setCallError('');
    try {
      logAnalyticsEvent({
        eventType: 'CALL',
        page: `/provider/${id}`,
        target: 'masked_call',
      });
      const response = await fetch('http://localhost:8080/api/calls/masked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await response.json();
      if (data.success && data.data?.proxyNumber) {
        window.open(`tel:${data.data.proxyNumber}`, '_self');
      } else {
        setCallError(data.message || data.data?.message || 'Call proxy not configured.');
      }
    } catch (error: any) {
      setCallError(error?.message || 'Unable to initiate masked call.');
    } finally {
      setCallLoading(false);
    }
  };


  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h6">Loading provider details...</Typography>
      </Container>
    );
  }

  if (!provider) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h6">Provider not found.</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar variant="simple" position="sticky" showBackButton showNavLinks={false} showAuthButtons={false} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card
          sx={{
            mb: 4,
            p: { xs: 3, md: 4 },
            color: '#fff',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Provider Profile
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            View experience, availability, and verified service details.
          </Typography>
        </Card>

        <Grid container spacing={4}>
          {/* Provider Info Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 88 }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    src={provider.profilePhoto}
                    sx={{
                      width: 150,
                      height: 150,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: '#2563EB',
                      fontSize: '3rem',
                    }}
                  >
                    {provider.name[0]}
                  </Avatar>
                  <Typography variant="h5" gutterBottom>
                    {provider.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {provider.skill}
                  </Typography>
                  {provider.isVerified && (
                    <StatusBadge status="verified" sx={{ mb: 2 }} />
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                    <Rating value={provider.rating} precision={0.1} readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {provider.rating}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {provider.totalReviews} reviews
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText primary={provider.serviceArea || provider.city} secondary="Location" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WorkOutline />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        provider.experience
                          ? `${provider.experience} years`
                          : provider.expertiseLevel
                            ? provider.expertiseLevel
                            : 'N/A'
                      }
                      secondary="Experience"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary={provider.workingHours}
                      secondary="Working Hours"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Language />
                    </ListItemIcon>
                    <ListItemText
                      primary={provider.languages?.join(', ')}
                      secondary="Languages"
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                {provider.serviceImages && provider.serviceImages.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Service Images
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {provider.serviceImages.map((image, index) => (
                        <Box
                          key={`${image}-${index}`}
                          component="img"
                          src={`http://localhost:8080/api/files/serve?filePath=${encodeURIComponent(image)}`}
                          alt={`Service ${index + 1}`}
                          sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover' }}
                        />
                      ))}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                <Typography variant="h6" color="primary" align="center" gutterBottom>
                  ₹{provider.price}+ per visit
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigate(`/booking/${provider.id}`)}
                  sx={{ mb: 1 }}
                >
                  Book Service
                </Button>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Phone />}
                      disabled={!hasConfirmedBooking || callLoading}
                      title={hasConfirmedBooking ? 'Call via masked number' : 'Book first to unlock calling'}
                      onClick={handleMaskedCall}
                    >
                      {callLoading ? 'Connecting...' : 'Call'}
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Chat />}
                      disabled={!hasConfirmedBooking}
                      title={hasConfirmedBooking ? 'Chat enabled' : 'Book first to unlock chat'}
                    >
                      Chat
                    </Button>
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  {hasConfirmedBooking ? 'Chat and call are now available.' : 'Book the service to unlock chat and call.'}
                </Typography>
                {callError && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                    {callError}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="About" />
                <Tab label="Services" />
                <Tab label={`Reviews (${provider.totalReviews})`} />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* About Tab */}
                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      About Me
                    </Typography>
                    <Typography paragraph>{provider.about}</Typography>
                  </Box>
                )}

                {/* Services Tab */}
                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Services Offered
                    </Typography>
                    <List>
                      {provider.services?.map((service, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={service} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Reviews Tab */}
                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Customer Reviews
                    </Typography>

                    {/* Rating Summary */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#F5F5F5' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Typography variant="h2">{provider.rating}</Typography>
                        </Grid>
                        <Grid item>
                          <Rating value={provider.rating} precision={0.1} readOnly />
                          <Typography variant="body2" color="text.secondary">
                            Based on {provider.totalReviews} reviews
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Reviews List */}
                    {reviews.map((review) => (
                      <Paper key={review.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {review.customerName}
                            </Typography>
                            <Rating value={review.rating} size="small" readOnly />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {review.date}
                          </Typography>
                        </Box>
                        <Typography paragraph>{review.comment}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button size="small" startIcon={<Star />}>
                            Helpful ({review.helpful})
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProviderDetailPage;

