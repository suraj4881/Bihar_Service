import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Rating, Button, useTheme } from '@mui/material';
import { LocationOn, Verified, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

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
  experience: number;
}

const FeaturedProviders: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useLanguage();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/providers/featured?limit=6');
      const data = await response.json();
      if (data.success) {
        setProviders(data.data || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Mock data for now
  const mockProviders: Provider[] = [
    {
      id: '1',
      name: 'Raj Kumar Sharma',
      skill: 'Plumbing',
      rating: 4.8,
      totalReviews: 156,
      city: 'Patna',
      price: 650,
      isVerified: true,
      experience: 5,
    },
    {
      id: '2',
      name: 'Amit Singh',
      skill: 'Electrical',
      rating: 4.9,
      totalReviews: 203,
      city: 'Patna',
      price: 800,
      isVerified: true,
      experience: 7,
    },
    {
      id: '3',
      name: 'Priya Kumari',
      skill: 'Cleaning',
      rating: 4.7,
      totalReviews: 89,
      city: 'Patna',
      price: 450,
      isVerified: true,
      experience: 3,
    },
  ];

  const displayProviders = providers.length > 0 ? providers : mockProviders;

  if (loading && providers.length === 0) {
    displayProviders.splice(0, displayProviders.length);
  }

  return (
    <Box sx={{ 
      py: 8,
      background: isDark
        ? 'linear-gradient(180deg, #0A0E27 0%, #1A1F3A 100%)'
        : 'linear-gradient(180deg, #FFE5D0 0%, #FFF5EB 100%)',
    }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700, 
              mb: 1,
              color: isDark ? '#E2E8F0' : 'inherit',
            }}>
              {t('section.providers.title')}
            </Typography>
            <Typography variant="body1" sx={{
              color: isDark ? '#A0AEC0' : 'text.secondary',
            }}>
              {t('section.providers.subtitle')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/services')}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            View All
          </Button>
        </Box>

        <Grid container spacing={3}>
          {displayProviders.map((provider) => (
            <Grid item xs={12} sm={6} md={4} key={provider.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  bgcolor: isDark ? '#1A1F3A' : 'white',
                  border: isDark ? '1px solid #2D3748' : '1px solid #E0E0E0',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    borderColor: '#FF6B35',
                  },
                }}
                onClick={() => navigate(`/provider/${provider.id}`)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      src={provider.profilePhoto}
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: '#FF6B35',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {provider.name[0]}
                    </Avatar>
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {provider.name}
                        </Typography>
                        {provider.isVerified && (
                          <Verified sx={{ fontSize: 20, color: '#4CAF50' }} />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {provider.skill}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={provider.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {provider.rating} ({provider.totalReviews} reviews)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {provider.city}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                      •
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {provider.experience} years exp.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      ₹{provider.price}+
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/booking/${provider.id}`);
                      }}
                      sx={{
                        bgcolor: '#FF6B35',
                        '&:hover': { bgcolor: '#E64A19' },
                      }}
                    >
                      Book Now
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 4, display: { xs: 'block', md: 'none' } }}>
          <Button
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/services')}
            fullWidth
          >
            View All Providers
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturedProviders;

