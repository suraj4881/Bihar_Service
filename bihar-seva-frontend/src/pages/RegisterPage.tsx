import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Link,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Phone,
  Person,
  LocationOn,
  MyLocation,
  PersonOutline,
  Work,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeMode } from '../contexts/ThemeContext';
import Logo from '../components/Logo';
import { BIHAR_CITIES } from '../utils/constants';
import { getCurrentLocation } from '../utils/helpers';
import AppBar from '../components/AppBar';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { mode } = useThemeMode();
  // ✅ Sync language on mount from localStorage (set on HomePage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
        setFormData(prev => ({
          ...prev,
          language: savedLanguage === 'hi' ? 'Hindi' : 'English',
        }));
      }
    }
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: 'Patna',
    role: 'CUSTOMER',
    language: language === 'hi' ? 'Hindi' : 'English',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);


  // Common TextField styles
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      transition: 'all 0.3s',
      bgcolor: mode === 'dark' ? '#1E293B' : '#F8FAFC',
      '&:hover fieldset': {
        borderColor: '#2563EB',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2563EB',
        borderWidth: 2,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#2563EB',
    },
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
    setError('');
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location.city) {
        setFormData({ ...formData, city: location.city });
      }
    } catch (err) {
      setError('Could not get your location. Please select manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError(t('register.fillAllFields'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    if (formData.password.length < 6) {
      setError(t('register.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      // ✅ Prepare data for backend (exclude confirmPassword)
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role || 'CUSTOMER', // ✅ Include role with fallback
        language: formData.language || 'English', // ✅ Include language with fallback
        city: formData.city,
        address: '', // Can be added later
        pincode: '', // Can be added later
      };
      
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      const data = await response.json();
      
      if (data.success) {
        // ✅ Don't log in automatically - redirect to email verification
        navigate('/email-verification', { 
          state: { email: formData.email },
          replace: true 
        });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar variant="default" position="sticky" />
    <Box
      sx={{
        minHeight: '100vh',
        background: mode === 'dark'
          ? 'linear-gradient(135deg, #0B1220 0%, #111827 50%, #1F2937 100%)'
          : 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 2, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: mode === 'dark'
            ? `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 80% 30%, rgba(96, 165, 250, 0.1) 0%, transparent 50%)`
            : `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
               radial-gradient(circle at 80% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          elevation={24}
          sx={{
            borderRadius: { xs: 3, md: 4 },
            overflow: 'hidden',
            background: mode === 'dark' ? '#1E293B' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.8)'
              : '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: mode === 'dark' ? '1px solid #334155' : 'none',
            maxHeight: { xs: '95vh', md: '90vh' },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Grid container>
            {/* Left Side - Branding - Hidden on small screens, compact on medium */}
            <Grid
              item
              xs={0}
              md={4}
              sx={{
                display: { xs: 'none', md: 'flex' },
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)',
                backdropFilter: 'blur(20px)',
                border: mode === 'dark'
                  ? '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid rgba(59, 130, 246, 0.2)',
                color: mode === 'dark' ? '#E2E8F0' : 'white',
                p: 3,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                  opacity: 0.3,
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Logo size="medium" showText />
                
                {/* Animated Worker Icon */}
                <Box
                  sx={{
                    fontSize: '3.5rem',
                    my: 2,
                    animation: 'bounce 2s ease-in-out infinite',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-15px)' },
                    },
                  }}
                >
                  👨‍🔧
                </Box>
                
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mt: 1, 
                    mb: 1, 
                    fontWeight: 800,
                    fontFamily: '"Poppins", sans-serif',
                    color: 'white',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  {t('register.welcome')}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    maxWidth: '90%',
                    mx: 'auto',
                    fontWeight: 500,
                  }}
                >
                  {t('register.subtitle')}
                </Typography>
                
                <Box 
                  sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {[
                    { icon: '✓', text: t('register.verified') },
                    { icon: '⚡', text: t('register.instant') },
                    { icon: '🔒', text: t('register.secure') },
                    { icon: '🎯', text: t('register.support') },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: index < 3 ? 1 : 0,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'white',
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          mr: 1,
                          fontSize: '1.1rem',
                        }}
                      >
                        {item.icon}
                      </Box>
                      {item.text}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Right Side - Form */}
            <Grid 
              item 
              xs={12} 
              md={8}
              sx={{
                background: mode === 'dark' ? '#1E293B' : '#F8FAFC',
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 2.5 }, flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#3B82F6', borderRadius: '3px' } }}>
                <Box sx={{ mb: 2 }}>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                  sx={{ 
                    fontWeight: 800,
                    fontFamily: '"Poppins", sans-serif',
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
                      : 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
                  }}
                  >
                    {t('register.title')}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('register.fillDetails')}
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={1.5}>
                  {/* Account Type Selection */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                      {t('register.registerAs')}: *
                    </Typography>
                    <Grid container spacing={1.5} sx={{ maxWidth: '100%', justifyContent: 'flex-start' }}>
                      {[
                        { value: 'CUSTOMER', label: t('register.customer'), icon: <PersonOutline />, desc: 'Book services', enabled: true },
                        { value: 'PROVIDER', label: t('register.provider'), icon: <Work />, desc: 'Offer services', enabled: true },
                        // { value: 'ADMIN', label: 'Admin', icon: <AdminPanelSettings />, desc: 'Manage platform', enabled: false }, // Hidden for now
                      ].filter(type => type.enabled).map((type) => (
                        <Grid item xs={6} sm={6} key={type.value}>
                          <Card
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChange('role', type.value);
                            }}
                            sx={{
                              cursor: 'pointer',
                              height: '100%',
                              minHeight: '50px',
                              display: 'flex',
                              alignItems: 'center',
                              border: formData.role === type.value ? '2px solid #3B82F6' : '1px solid #d1d5db',
                              bgcolor: formData.role === type.value 
                                ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
                                : mode === 'dark' ? '#1E293B' : '#f9fafb',
                              background: formData.role === type.value 
                                ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
                                : mode === 'dark' ? '#1E293B' : '#f9fafb',
                              transition: 'all 0.3s',
                              boxShadow: formData.role === type.value ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 1,
                              '&:hover': {
                                borderColor: '#3B82F6',
                                transform: 'translateY(-2px)',
                                boxShadow: formData.role === type.value 
                                  ? '0 6px 20px rgba(59, 130, 246, 0.4)' 
                                  : 3,
                              },
                            }}
                          >
                            <CardContent 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleChange('role', type.value);
                              }}
                              sx={{ p: 0.5, py: 0.8, textAlign: 'center', width: '100%', cursor: 'pointer' }}
                            >
                              <Box sx={{ 
                                color: formData.role === type.value ? 'white' : '#6b7280', 
                                mb: 0.2,
                                fontSize: '0.9rem',
                                display: 'inline-block',
                              }}>
                                {type.icon}
                              </Box>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 700, 
                                  color: formData.role === type.value ? 'white' : '#1f2937',
                                  fontSize: '0.8rem',
                                  display: 'block',
                                  fontFamily: '"Poppins", sans-serif',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                {type.label}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  {/* Language Selection */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                      {t('register.language')}: *
                    </Typography>
                    <Grid container spacing={1.5} sx={{ maxWidth: '100%', justifyContent: 'flex-start' }}>
                      {[
                        { value: 'English', label: t('register.english'), flag: 'IN', subtitle: 'Default' },
                        { value: 'Hindi', label: t('register.hindi'), flag: '🇮🇳', subtitle: 'भारतीय' },
                      ].map((lang) => (
                        <Grid item xs={6} key={lang.value}>
                          <Card
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChange('language', lang.value);
                              const langCode = lang.value === 'Hindi' ? 'hi' : 'en';
                              setLanguage(langCode);
                              localStorage.setItem('language', langCode);
                            }}
                            sx={{
                              cursor: 'pointer',
                              height: '100%',
                              minHeight: '50px',
                              display: 'flex',
                              alignItems: 'center',
                              border: formData.language === lang.value ? '2px solid #3B82F6' : '1px solid #d1d5db',
                              bgcolor: formData.language === lang.value 
                                ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
                                : mode === 'dark' ? '#1E293B' : '#f9fafb',
                              background: formData.language === lang.value 
                                ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
                                : mode === 'dark' ? '#1E293B' : '#f9fafb',
                              transition: 'all 0.3s',
                              boxShadow: formData.language === lang.value ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 1,
                              '&:hover': {
                                borderColor: '#3B82F6',
                                transform: 'translateY(-2px)',
                                boxShadow: formData.language === lang.value 
                                  ? '0 6px 20px rgba(59, 130, 246, 0.4)' 
                                  : 3,
                              },
                            }}
                          >
                            <CardContent 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleChange('language', lang.value);
                                const langCode = lang.value === 'Hindi' ? 'hi' : 'en';
                                setLanguage(langCode);
                                localStorage.setItem('language', langCode);
                              }}
                              sx={{ p: 0.5, py: 0.8, textAlign: 'center', width: '100%', cursor: 'pointer' }}
                            >
                              <Typography 
                                sx={{ 
                                  mb: 0.2,
                                  fontSize: '1.1rem',
                                  filter: formData.language === lang.value ? 'brightness(1.2)' : 'none',
                                }}
                              >
                                {lang.flag}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 700, 
                                  color: formData.language === lang.value ? 'white' : '#1f2937',
                                  fontSize: '0.8rem',
                                  display: 'block',
                                  fontFamily: lang.value === 'Hindi' ? '"Noto Sans Devanagari", "Poppins", sans-serif' : '"Poppins", sans-serif',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                {lang.label}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  {/* Name and Email in same row */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('register.name')}
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: '#3B82F6', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('register.email')}
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: '#3B82F6', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>

                  {/* Phone and City in same row */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('register.phone')}
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="98XXXXXXXX"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone sx={{ color: '#3B82F6', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={BIHAR_CITIES}
                      value={formData.city}
                      onChange={(_, newValue) => handleChange('city', newValue || 'Patna')}
                      size="small"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('register.city')}
                          sx={textFieldSx}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <LocationOn sx={{ color: '#3B82F6', fontSize: 20 }} />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {locationLoading ? <CircularProgress size={18} sx={{ color: '#3B82F6' }} /> : null}
                                {params.InputProps.endAdornment}
                                <IconButton
                                  size="small"
                                  onClick={handleGetLocation}
                                  disabled={locationLoading}
                                  title={t('register.getLocation')}
                                  sx={{ color: '#3B82F6', p: 0.5 }}
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

                  {/* Password and Confirm Password in same row */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('register.password')}
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: '#3B82F6', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('register.confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: '#3B82F6', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              size="small"
                            >
                              {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>
                </Grid>

                <Button
                  fullWidth
                  variant="contained"
                  size="medium"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    mt: 2,
                    py: 1.2,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                      boxShadow: '0 12px 32px rgba(59, 130, 246, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    textTransform: 'none',
                  }}
                >
                  {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : t('register.submit') + ' 🚀'}
                </Button>

                {/* OTP Feature - Disabled for now. Enable when OTP feature is ready */}
                {/* <Divider sx={{ my: 3, fontWeight: 600, color: 'text.secondary' }}>{t('login.or')}</Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<Email />}
                  onClick={() => navigate('/email-otp')}
                  sx={{
                    py: 1.5,
                    borderWidth: 2,
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: '#764ba2',
                      bgcolor: 'rgba(102, 126, 234, 0.08)',
                      transform: 'translateY(-2px)',
                      color: '#764ba2',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  {t('login.emailOtp')}
                </Button> */}

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem' }}>
                    {t('register.haveAccount')}{' '}
                    <Link
                      onClick={() => navigate('/login')}
                      sx={{
                        color: '#3B82F6',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          textDecoration: 'underline',
                          color: '#2563EB',
                        },
                      }}
                    >
                      {t('signIn')} →
                    </Link>
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 1.5, 
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  >
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </Typography>
                </Box>
              </CardContent>
            </Grid>
          </Grid>
        </Card>
      </Container>
    </Box>
    </Box>

  );
};

export default RegisterPage;
