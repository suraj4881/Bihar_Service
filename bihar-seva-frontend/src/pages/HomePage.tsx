import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Paper,
  Card,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Search,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeMode } from '../contexts/ThemeContext';
import AppBar from '../components/AppBar';
import CategoryGrid from '../components/home/CategoryGrid';
import HowItWorks from '../components/home/HowItWorks';
import FeaturedProviders from '../components/home/FeaturedProviders';

interface Stats {
  totalProviders: number;
  verifiedProviders: number;
  totalCustomers: number;
  totalBookings: number;
  totalCategories: number;
  averageRating: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const { mode } = useThemeMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Patna');
  const [stats, setStats] = useState<Stats>({
    totalProviders: 0,
    verifiedProviders: 0,
    totalCustomers: 0,
    totalBookings: 0,
    totalCategories: 0,
    averageRating: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/stats/dashboard');
      const data = await response.json();
      
      if (data.success && data.data) {
        setStats({
          totalProviders: data.data.totalProviders || 0,
          verifiedProviders: data.data.verifiedProviders || 0,
          totalCustomers: data.data.totalCustomers || 0,
          totalBookings: data.data.totalBookings || 0,
          totalCategories: data.data.totalCategories || 0,
          averageRating: data.data.averageRating || 0,
        });
      }
    } catch (error) {
      // Keep default stats (all zeros)
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    navigate(`/services?q=${searchQuery}&location=${location}`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar variant="default" position="sticky" />

      {/* Hero Section - Perfect Layout */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, #0B1220 0%, #111827 50%, #1F2937 100%)'
            : 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 15% 50%, rgba(255,255,255,0.08) 0%, transparent 50%),
              radial-gradient(circle at 85% 30%, rgba(255,255,255,0.08) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(255,107,53,0.1) 0%, transparent 40%)
            `,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
          <Grid container spacing={4} alignItems="center">
            {/* Left Side - Content */}
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 4 }}>
                {/* Tagline */}
                <Typography
                  variant="overline"
                  sx={{
                    color: alpha('#60A5FA', 0.9),
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    letterSpacing: '2px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {t('hero.tagline')}
                </Typography>

                {/* Main Heading */}
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 900,
                    color: 'white',
                    mb: 2,
                    mt: 1,
                    lineHeight: 1.1,
                    textShadow: mode === 'dark' 
                      ? '0 4px 12px rgba(0,0,0,0.8)' 
                      : '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  {t('hero.title')}
                  <br />
                  <Box
                    component="span"
                    sx={{
                      color: '#60A5FA',
                      textShadow: '0 4px 12px rgba(96, 165, 250, 0.5)',
                    }}
                  >
                    {t('hero.subtitle')}
                  </Box>
                </Typography>

                {/* Subtitle */}
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255,255,255,0.95)',
                    mb: 1,
                    fontWeight: 500,
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {t('hero.description')}
                </Typography>

                {/* Features */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                  {[t('hero.verified'), t('hero.affordable'), t('hero.reliable')].map((item) => (
                    <Typography
                      key={item}
                      sx={{
                        color: 'white',
                        bgcolor: alpha('#fff', 0.15),
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Box>

              {/* Search Box - Centered & Prominent */}
              <Paper
                elevation={24}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 3,
                  background: mode === 'dark' ? '#1A1F3A' : 'white',
                  boxShadow: mode === 'dark'
                    ? '0 20px 60px rgba(0,0,0,0.8)'
                    : '0 20px 60px rgba(0,0,0,0.3)',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    mb: 2.5,
                    color: mode === 'dark' ? '#E2E8F0' : '#1e3c72',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {t('search.title')}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      placeholder={t('search.placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: mode === 'dark' ? '#0A0E27' : '#F8F9FA',
                          color: mode === 'dark' ? '#E2E8F0' : 'inherit',
                          fontSize: '1rem',
                          '& fieldset': { 
                            borderColor: mode === 'dark' ? '#2D3748' : '#E0E0E0' 
                          },
                          '&:hover fieldset': { borderColor: '#3B82F6' },
                          '&.Mui-focused fieldset': { 
                            borderColor: '#3B82F6', 
                            borderWidth: 2 
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: '#3B82F6', fontSize: 24 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      placeholder={t('search.location')}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: mode === 'dark' ? '#0A0E27' : '#F8F9FA',
                          color: mode === 'dark' ? '#E2E8F0' : 'inherit',
                          '& fieldset': { 
                            borderColor: mode === 'dark' ? '#2D3748' : '#E0E0E0' 
                          },
                          '&:hover fieldset': { borderColor: '#3B82F6' },
                          '&.Mui-focused fieldset': { 
                            borderColor: '#3B82F6', 
                            borderWidth: 2 
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn sx={{ color: '#3B82F6' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={5}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSearch}
                      sx={{
                        height: '56px',
                          bgcolor: '#3B82F6',
                          '&:hover': {
                            bgcolor: '#2563EB',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                          },
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        boxShadow: '0 4px 16px rgba(255,107,53,0.3)',
                        transition: 'all 0.3s',
                      }}
                    >
                      {t('search.button')}
                    </Button>
                  </Grid>
                </Grid>

                {/* Search Info */}
                <Box sx={{ mt: 2.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: mode === 'dark' ? '#A0AEC0' : 'text.secondary',
                      textAlign: 'center',
                      fontWeight: 500,
                    }}
                  >
                    {language === 'hi' 
                      ? 'किसी भी सेवा के लिए खोजें - हमारे पास सभी प्रकार की सेवाएं उपलब्ध हैं'
                      : 'Search for any service - We have all types of services available'
                    }
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Right Side - All Services Info */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: { xs: 'none', md: 'block' }, height: 20 }} />
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: mode === 'dark'
                    ? '0 20px 60px rgba(0,0,0,0.8)'
                    : '0 20px 60px rgba(0,0,0,0.3)',
                  height: '500px',
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.2) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: mode === 'dark' 
                    ? '1px solid rgba(59, 130, 246, 0.3)'
                    : '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    fontSize: '5rem',
                    mb: 3,
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
                  }}
                >
                  🛠️
                </Box>
                
                <Typography
                  sx={{
                    color: mode === 'dark' ? '#E2E8F0' : '#1E293B',
                    fontSize: '2rem',
                    fontWeight: 800,
                    mb: 2,
                    textShadow: mode === 'dark' 
                      ? '0 2px 8px rgba(0,0,0,0.5)' 
                      : '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {language === 'hi' ? 'सभी सेवाएं उपलब्ध' : 'All Services Available'}
                </Typography>

                <Typography
                  sx={{
                    color: mode === 'dark' ? '#CBD5E0' : '#475569',
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    mb: 3,
                    lineHeight: 1.6,
                    maxWidth: '400px',
                  }}
                >
                  {language === 'hi' 
                    ? 'हमारे प्लेटफॉर्म पर कोई भी सेवा जोड़ी जा सकती है। डायनेमिक सेवा प्रणाली के साथ, आप किसी भी प्रकार की सेवा खोज और बुक कर सकते हैं।'
                    : 'Any service can be added to our platform. With our dynamic service system, you can search and book any type of service you need.'
                  }
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 2 }}>
                  {[
                    { icon: '✓', text: language === 'hi' ? 'सभी प्रकार की सेवाएं' : 'All Types of Services' },
                    { icon: '✓', text: language === 'hi' ? 'स्थान-आधारित खोज' : 'Location-Based Search' },
                    { icon: '✓', text: language === 'hi' ? 'सत्यापित प्रदाता' : 'Verified Providers' },
                  ].map((feature, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: mode === 'dark' 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : 'rgba(59, 130, 246, 0.1)',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        border: mode === 'dark'
                          ? '1px solid rgba(59, 130, 246, 0.3)'
                          : '1px solid rgba(59, 130, 246, 0.2)',
                      }}
                    >
                      <Typography sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '1.2rem' }}>
                        {feature.icon}
                      </Typography>
                      <Typography
                        sx={{
                          color: mode === 'dark' ? '#E2E8F0' : '#1E293B',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        }}
                      >
                        {feature.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Stats Section Below - Dynamic from Backend */}
          <Grid container spacing={3} sx={{ mt: 4 }}>
            {[
              { 
                number: `${formatNumber(stats.verifiedProviders)}+`, 
                labelKey: 'stats.providers',
                key: 'verifiedProviders'
              },
              { 
                number: `${formatNumber(stats.totalCustomers)}+`, 
                labelKey: 'stats.customers',
                key: 'totalCustomers'
              },
              { 
                number: `${stats.totalCategories}+`, 
                labelKey: 'stats.categories',
                key: 'totalCategories'
              },
              { 
                number: `${stats.averageRating}★`, 
                labelKey: 'stats.rating',
                key: 'averageRating'
              },
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Card
                  sx={{
                    background: mode === 'dark' 
                      ? 'rgba(26,31,58,0.9)' 
                      : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    textAlign: 'center',
                    py: 2.5,
                    boxShadow: mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.5)'
                      : '0 8px 24px rgba(0,0,0,0.15)',
                    border: mode === 'dark'
                      ? '1px solid rgba(59, 130, 246, 0.2)'
                      : '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: mode === 'dark'
                        ? '0 12px 32px rgba(59, 130, 246, 0.5)'
                        : '0 12px 32px rgba(59, 130, 246, 0.3)',
                    },
                  }}
                >
                  {statsLoading ? (
                    <CircularProgress size={40} sx={{ color: '#3B82F6' }} />
                  ) : (
                    <>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 900, 
                          color: '#3B82F6', 
                          mb: 0.5 
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: mode === 'dark' ? '#A0AEC0' : 'text.secondary',
                        }}
                      >
                        {t(stat.labelKey)}
                      </Typography>
                    </>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* All Services Section */}
      <Box sx={{ 
        py: 10,
        background: mode === 'dark' 
          ? 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
          : 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
                  : 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {language === 'hi' ? 'सभी सेवाएं एक जगह' : 'All Services in One Place'}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: mode === 'dark' ? '#CBD5E0' : '#64748B',
                fontWeight: 400,
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              {language === 'hi'
                ? 'हमारा प्लेटफॉर्म डायनेमिक है - कोई भी सेवा जोड़ी जा सकती है। प्लंबिंग से लेकर कंप्यूटर रिपेयर तक, हमारे पास आपकी सभी जरूरतों के लिए सेवाएं हैं।'
                : 'Our platform is dynamic - any service can be added. From plumbing to computer repair, we have services for all your needs.'
              }
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                title: language === 'hi' ? 'डायनेमिक सेवा प्रणाली' : 'Dynamic Service System',
                description: language === 'hi'
                  ? 'कोई भी सेवा जोड़ी जा सकती है, कोई सीमा नहीं'
                  : 'Any service can be added, no limitations',
                icon: '🔄',
              },
              {
                title: language === 'hi' ? 'स्थान-आधारित खोज' : 'Location-Based Search',
                description: language === 'hi'
                  ? 'GPS, पिनकोड या शहर के आधार पर खोजें'
                  : 'Search by GPS, pincode, or city',
                icon: '📍',
              },
              {
                title: language === 'hi' ? 'सत्यापित प्रदाता' : 'Verified Providers',
                description: language === 'hi'
                  ? 'KYC-सत्यापित और रेटेड प्रदाता'
                  : 'KYC-verified and rated providers',
                icon: '✅',
              },
              {
                title: language === 'hi' ? 'आसान बुकिंग' : 'Easy Booking',
                description: language === 'hi'
                  ? 'कॉल, WhatsApp या इन-ऐप चैट के माध्यम से'
                  : 'Via call, WhatsApp, or in-app chat',
                icon: '📞',
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 3,
                    textAlign: 'center',
                    bgcolor: mode === 'dark' ? '#1E293B' : 'white',
                    border: mode === 'dark' 
                      ? '1px solid #334155' 
                      : '1px solid #E2E8F0',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: mode === 'dark'
                        ? '0 12px 32px rgba(59, 130, 246, 0.3)'
                        : '0 12px 32px rgba(59, 130, 246, 0.15)',
                      borderColor: '#3B82F6',
                    },
                  }}
                >
                  <Typography sx={{ fontSize: '3rem', mb: 2 }}>
                    {feature.icon}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: mode === 'dark' ? '#E2E8F0' : '#1E293B',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? '#94A3B8' : '#64748B',
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/services')}
              sx={{
                bgcolor: '#3B82F6',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                '&:hover': {
                  bgcolor: '#2563EB',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(59, 130, 246, 0.5)',
                },
                transition: 'all 0.3s',
              }}
            >
              {language === 'hi' ? 'सभी सेवाएं देखें' : 'Explore All Services'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* How It Works */}
      <HowItWorks />

      {/* Featured Providers */}
      <FeaturedProviders />

    </Box>
  );
};

export default HomePage;
