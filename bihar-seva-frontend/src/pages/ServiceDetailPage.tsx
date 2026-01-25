import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Rating,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Star,
  AccessTime,
  AttachMoney,
  LocationOn,
  CheckCircle,
} from '@mui/icons-material';
import { Service } from '../types/service';
import { serviceService } from '../services/serviceService';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import { logAnalyticsEvent } from '../services/analyticsService';

const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadService();
    }
  }, [id]);

  const loadService = async () => {
    try {
      setLoading(true);
      const response = await serviceService.getServiceById(id!);
      if (response.success) {
        setService(response.data || null);
      } else {
        setError(response.error || 'Failed to load service');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load service');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    if (service) {
      logAnalyticsEvent({
        eventType: 'CLICK',
        page: `/service/${service.id}`,
        target: 'book_service',
      });
      navigate(`/booking/${service.id}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !service) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Service not found'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/services')}>
          Back to Services
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
            Service Overview
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Review details, pricing, and availability before booking.
          </Typography>
        </Card>

        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/services')}
          sx={{ mb: 3 }}
        >
          Back to Services
        </Button>

        <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3,
                    fontSize: '40px',
                  }}
                >
                  {service.icon}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {service.name}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {service.category}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Rating value={service.averageRating} readOnly precision={0.1} />
                    <Typography variant="body2" color="text.secondary">
                      {service.averageRating.toFixed(1)} ({service.bookingCount} bookings)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {service.description}
              </Typography>

              {service.tags && service.tags.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {service.tags.map((tag, index) => (
                      <Chip key={index} label={tag} variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {service.requirements && service.requirements.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    What You Need to Provide
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {service.requirements.map((requirement, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                        <Typography variant="body2">{requirement}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {service.benefits && service.benefits.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    What You Get
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {service.benefits.map((benefit, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                        <Typography variant="body2">{benefit}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                Book This Service
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachMoney sx={{ color: '#2563EB', fontSize: 24 }} />
                <Typography variant="h4" sx={{ color: '#2563EB', fontWeight: 'bold' }}>
                  ₹{service.basePrice}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  / {service.priceUnit}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AccessTime sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  Duration: {service.duration}
                </Typography>
              </Box>

              {service.workingHours && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <LocationOn sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Available: {service.workingHours}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleBookService}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                Book Now
              </Button>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Secure booking • Easy cancellation • Quality guaranteed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </Box>
  );
};

export default ServiceDetailPage;
