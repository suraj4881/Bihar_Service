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
  AppBar,
  Toolbar,
  IconButton,
  Card,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Menu as MenuIcon,
  Login,
  PersonAdd,
  Phone,
  Email,
  Brightness4,
  Brightness7,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import CategoryGrid from '../components/home/CategoryGrid';
import HowItWorks from '../components/home/HowItWorks';
import FeaturedProviders from '../components/home/FeaturedProviders';
import { getDummyStats } from '../data/dummyProviders';

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
  const { mode, toggleTheme } = useThemeMode();
  const { language, setLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Patna');
  const [stats, setStats] = useState<Stats>(getDummyStats());
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
          totalProviders: data.data.totalProviders || getDummyStats().totalProviders,
          verifiedProviders: data.data.verifiedProviders || getDummyStats().verifiedProviders,
          totalCustomers: data.data.totalCustomers || getDummyStats().totalCustomers,
          totalBookings: data.data.totalBookings || getDummyStats().totalBookings,
          totalCategories: data.data.totalCategories || 12,
          averageRating: data.data.averageRating || getDummyStats().averageRating,
        });
      }
    } catch (error) {
      // Dummy stats already set in state
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    navigate(`/services?q=${searchQuery}&location=${location}`);
  };

  const popularSearches = ['Plumber', 'Electrician', 'Cleaner', 'Carpenter', 'AC Repair'];

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Logo size="medium" showText onClick={() => navigate('/')} />

          <Box sx={{ flexGrow: 1 }} />

          {/* Language Toggle */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newLang = language === 'en' ? 'hi' : 'en';
              localStorage.setItem('language', newLang);
              try {
                sessionStorage.setItem('language', newLang);
              } catch (e) {
                // Ignore sessionStorage errors
              }
              setLanguage(newLang);
            }}
            startIcon={<LanguageIcon />}
            sx={{
              mr: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.primary',
              bgcolor: alpha('#FF6B35', 0.1),
              '&:hover': {
                bgcolor: alpha('#FF6B35', 0.2),
              },
            }}
          >
            {language === 'en' ? 'हिं' : 'EN'}
          </Button>

          {/* Dark/Light Mode Toggle */}
          <IconButton
            onClick={toggleTheme}
            color="inherit"
            sx={{
              mr: 2,
              bgcolor: alpha('#FF6B35', 0.1),
              '&:hover': {
                bgcolor: alpha('#FF6B35', 0.2),
              },
            }}
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/services')}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              {t('nav.services')}
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/about')}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              {t('nav.about')}
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/contact')}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              {t('nav.contact')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {isAuthenticated ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/profile')}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#FF6B35',
                    color: '#FF6B35',
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                >
                  {user?.name || 'Profile'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    const role = localStorage.getItem('role');
                    if (role === 'PROVIDER') {
                      navigate('/provider-dashboard');
                    } else if (role === 'ADMIN') {
                      navigate('/admin-dashboard');
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                  sx={{
                    bgcolor: '#FF6B35',
                    '&:hover': { bgcolor: '#E64A19' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  startIcon={<Login />}
                  onClick={() => navigate('/login')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/register')}
                  sx={{
                    bgcolor: '#FF6B35',
                    '&:hover': { bgcolor: '#E64A19' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {t('nav.signup')}
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section - Perfect Layout */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 50%, #2D1B69 100%)'
            : 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)',
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
                    color: alpha('#FFD700', 0.9),
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
                      color: '#FFD700',
                      textShadow: '0 4px 12px rgba(255,215,0,0.5)',
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
                          '&:hover fieldset': { borderColor: '#FF6B35' },
                          '&.Mui-focused fieldset': { 
                            borderColor: '#FF6B35', 
                            borderWidth: 2 
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: '#FF6B35', fontSize: 24 }} />
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
                          '&:hover fieldset': { borderColor: '#FF6B35' },
                          '&.Mui-focused fieldset': { 
                            borderColor: '#FF6B35', 
                            borderWidth: 2 
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn sx={{ color: '#FF6B35' }} />
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
                        bgcolor: '#FF6B35',
                        '&:hover': {
                          bgcolor: '#E64A19',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(255,107,53,0.4)',
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

                {/* Popular Searches */}
                <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    {t('search.popular')}
                  </Typography>
                  {popularSearches.map((search) => {
                    // Map English terms to translation keys
                    const termKeyMap: Record<string, string> = {
                      'Plumber': 'service.plumbing',
                      'Electrician': 'service.electrical',
                      'Cleaner': 'service.cleaning',
                      'AC Repair': 'service.ac',
                      'Painter': 'service.painting',
                    };
                    const translatedTerm = termKeyMap[search] ? t(termKeyMap[search]) : search;
                    
                    return (
                      <Button
                        key={search}
                        size="small"
                        onClick={() => {
                          setSearchQuery(search);
                          navigate(`/services?q=${search}&location=${location}`);
                        }}
                        sx={{
                          textTransform: 'none',
                          color: '#FF6B35',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          px: 2,
                          py: 0.75,
                          bgcolor: alpha('#FF6B35', 0.08),
                          border: '1px solid',
                          borderColor: alpha('#FF6B35', 0.2),
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: alpha('#FF6B35', 0.15),
                            borderColor: '#FF6B35',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        {translatedTerm}
                      </Button>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>

            {/* Right Side - हर सेवा उपलब्ध with Service Icons */}
            <Grid item xs={12} md={5}>
              {/* Empty space for better alignment */}
              <Box sx={{ display: { xs: 'none', md: 'block' }, height: 20 }} />
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  height: '500px',
                  background: 'linear-gradient(135deg, #FF8C61 0%, #FF6B35 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 3,
                }}
              >
                {/* Top - Worker Icon & Heading */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '6rem',
                      mb: 1,
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
                    }}
                  >
                    👨‍🔧
                  </Typography>
                  
                  <Typography
                    sx={{
                      color: 'white',
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {language === 'hi' ? 'हर सेवा उपलब्ध' : 'All Services Available'}
                  </Typography>
                </Box>

                {/* Service Icons Grid - 3x2 */}
                <Box sx={{ pb: 2 }}>
                  <Grid container spacing={1.5}>
                    {[
                      { icon: '🔧', labelKey: 'service.plumbing', searchTerm: 'Plumbing', color: '#5B8DEE' },
                      { icon: '⚡', labelKey: 'service.electrical', searchTerm: 'Electrical', color: '#FF9F43' },
                      { icon: '🧹', labelKey: 'service.cleaning', searchTerm: 'Cleaning', color: '#ED6A5A' },
                      { icon: '🛠️', labelKey: 'service.carpentry', searchTerm: 'Carpentry', color: '#8B4513' },
                      { icon: '❄️', labelKey: 'service.ac', searchTerm: 'AC Repair', color: '#4ECDC4' },
                      { icon: '🎨', labelKey: 'service.painting', searchTerm: 'Painting', color: '#E056FD' },
                    ].map((service, index) => (
                      <Grid item xs={4} key={index}>
                        <Box
                          onClick={() => {
                            setSearchQuery(service.searchTerm);
                            navigate(`/services?q=${service.searchTerm}&location=${location}`);
                          }}
                          sx={{
                            background: 'white',
                            borderRadius: 3,
                            p: 1.5,
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: `0 8px 24px ${service.color}60`,
                            },
                          }}
                        >
                          <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>
                            {service.icon}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: service.color,
                              fontSize: '0.7rem',
                            }}
                          >
                            {t(service.labelKey)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
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
                      ? '1px solid rgba(255,107,53,0.2)'
                      : '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: mode === 'dark'
                        ? '0 12px 32px rgba(255,107,53,0.5)'
                        : '0 12px 32px rgba(255,107,53,0.3)',
                    },
                  }}
                >
                  {statsLoading ? (
                    <CircularProgress size={40} sx={{ color: '#FF6B35' }} />
                  ) : (
                    <>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 900, 
                          color: '#FF6B35', 
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

      {/* Categories */}
      <CategoryGrid />

      {/* How It Works */}
      <HowItWorks />

      {/* Featured Providers */}
      <FeaturedProviders />

      {/* Footer */}
      <Box sx={{ 
        bgcolor: mode === 'dark' ? '#0A0E27' : '#1e272e', 
        color: mode === 'dark' ? '#CBD5E0' : 'white', 
        py: 6, 
        mt: 8,
        borderTop: mode === 'dark' ? '1px solid #2D3748' : 'none',
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    fontFamily: '"Poppins", sans-serif',
                    lineHeight: 1,
                    letterSpacing: '-0.5px',
                  }}
                >
                  <Box component="span" sx={{ color: mode === 'dark' ? '#E2E8F0' : 'white' }}>
                    Bihar
                  </Box>
                  <Box component="span" sx={{ color: '#FF6B35' }}>
                    Seva
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    color: mode === 'dark' ? '#A0AEC0' : 'rgba(255,255,255,0.8)',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    mt: 0.5,
                  }}
                >
                  सेवा का भरोसा
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ 
                mt: 2, 
                opacity: 0.9, 
                lineHeight: 1.8,
                color: mode === 'dark' ? '#CBD5E0' : 'rgba(255,255,255,0.9)',
              }}>
                Bihar's most trusted platform for home services. Connect with verified professionals for all your needs.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <IconButton
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  <Phone />
                </IconButton>
                <IconButton
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  <Email />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {t('footer.company')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  opacity: 0.9,
                  cursor: 'pointer',
                  '&:hover': { color: '#FF6B35' },
                }}
                onClick={() => navigate('/about')}
              >
                {t('footer.about')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  opacity: 0.9,
                  cursor: 'pointer',
                  '&:hover': { color: '#FF6B35' },
                }}
              >
                {t('footer.careers')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {t('footer.customers')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  opacity: 0.9,
                  cursor: 'pointer',
                  '&:hover': { color: '#FF6B35' },
                }}
                onClick={() => navigate('/services')}
              >
                {t('footer.browse')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  opacity: 0.9,
                  cursor: 'pointer',
                  '&:hover': { color: '#FF6B35' },
                }}
              >
                {t('footer.howItWorks')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {t('footer.providers')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  opacity: 0.9,
                  cursor: 'pointer',
                  '&:hover': { color: '#FF6B35' },
                }}
                onClick={() => navigate('/register')}
              >
                {t('footer.join')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {t('footer.contact')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                {t('footer.email')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                {t('footer.phone')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  opacity: 0.9,
                  cursor: 'pointer',
                  '&:hover': { color: '#FF6B35' },
                }}
                onClick={() => navigate('/contact')}
              >
                {t('footer.contactUs')}
              </Typography>
            </Grid>
          </Grid>
            <Box
              sx={{
                borderTop: mode === 'dark' 
                  ? '1px solid #2D3748' 
                  : '1px solid rgba(255,255,255,0.1)',
                mt: 4,
                pt: 4,
                textAlign: 'center',
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.8,
                  color: mode === 'dark' ? '#A0AEC0' : 'inherit',
                }}
              >
                {t('footer.copyright')}
              </Typography>
            </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
