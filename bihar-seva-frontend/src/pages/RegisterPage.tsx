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
import Logo from '../components/Logo';
import { BIHAR_CITIES } from '../utils/constants';
import { getCurrentLocation } from '../utils/helpers';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  
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
      '&:hover fieldset': {
        borderColor: '#667eea',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#667eea',
        borderWidth: 2,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#667eea',
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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(102,126,234,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118,75,162,0.3) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          elevation={24}
          sx={{
            borderRadius: 5,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Grid container>
            {/* Left Side - Branding */}
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                p: { xs: 4, md: 5 },
                display: 'flex',
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
                <Logo size="large" showText />
                
                {/* Animated Worker Icon */}
                <Box
                  sx={{
                    fontSize: '5rem',
                    my: 3,
                    animation: 'bounce 2s ease-in-out infinite',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-20px)' },
                    },
                  }}
                >
                  👨‍🔧
                </Box>
                
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mt: 2, 
                    mb: 2, 
                    fontWeight: 800,
                    fontFamily: '"Poppins", sans-serif',
                    color: 'white',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  {t('register.welcome')}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    maxWidth: '90%',
                    mx: 'auto',
                    fontWeight: 500,
                  }}
                >
                  {t('register.subtitle')}
                </Typography>
                
                <Box 
                  sx={{ 
                    mt: 4, 
                    p: 3, 
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
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
                        mb: index < 3 ? 1.5 : 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'white',
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          mr: 1.5,
                          fontSize: '1.3rem',
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
              md={7}
              sx={{
                background: 'linear-gradient(135deg, #FFF5EB 0%, #FFE5D0 50%, #FFEFD5 100%)',
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="h3" 
                    gutterBottom 
                  sx={{ 
                    fontWeight: 800,
                    fontFamily: '"Poppins", sans-serif',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                  >
                    {t('register.title')}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: '1rem',
                    }}
                  >
                    {t('register.fillDetails')}
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={2.5}>
                  {/* Account Type Selection */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                      {t('register.registerAs')}: *
                    </Typography>
                    <Grid container spacing={2} sx={{ maxWidth: '380px', justifyContent: 'flex-start' }}>
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
                              minHeight: '65px',
                              display: 'flex',
                              alignItems: 'center',
                              border: formData.role === type.value ? '3px solid #667eea' : '2px solid #d1d5db',
                              bgcolor: formData.role === type.value 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : '#f9fafb',
                              background: formData.role === type.value 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : '#f9fafb',
                              transition: 'all 0.3s',
                              boxShadow: formData.role === type.value ? '0 4px 15px rgba(102, 126, 234, 0.3)' : 1,
                              '&:hover': {
                                borderColor: '#667eea',
                                transform: 'translateY(-2px)',
                                boxShadow: formData.role === type.value 
                                  ? '0 6px 20px rgba(102, 126, 234, 0.4)' 
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
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary', fontSize: '0.95rem' }}>
                      {t('register.language')}: *
                    </Typography>
                    <Grid container spacing={2} sx={{ maxWidth: '380px', justifyContent: 'flex-start' }}>
                      {[
                        { value: 'English', label: t('register.english'), flag: '🇬🇧', subtitle: 'Default' },
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
                              minHeight: '65px',
                              display: 'flex',
                              alignItems: 'center',
                              border: formData.language === lang.value ? '3px solid #667eea' : '2px solid #d1d5db',
                              bgcolor: formData.language === lang.value 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : '#f9fafb',
                              background: formData.language === lang.value 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : '#f9fafb',
                              transition: 'all 0.3s',
                              boxShadow: formData.language === lang.value ? '0 4px 15px rgba(102, 126, 234, 0.3)' : 1,
                              '&:hover': {
                                borderColor: '#667eea',
                                transform: 'translateY(-2px)',
                                boxShadow: formData.language === lang.value 
                                  ? '0 6px 20px rgba(102, 126, 234, 0.4)' 
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

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('register.name')}
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('register.email')}
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('register.phone')}
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="98XXXXXXXX"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Autocomplete
                      options={BIHAR_CITIES}
                      value={formData.city}
                      onChange={(_, newValue) => handleChange('city', newValue || 'Patna')}
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
                                  <LocationOn sx={{ color: '#667eea' }} />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {locationLoading ? <CircularProgress size={20} sx={{ color: '#667eea' }} /> : null}
                                {params.InputProps.endAdornment}
                                <IconButton
                                  size="small"
                                  onClick={handleGetLocation}
                                  disabled={locationLoading}
                                  title={t('register.getLocation')}
                                  sx={{ color: '#667eea' }}
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

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('register.password')}
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('register.confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  size="large"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    mt: 4,
                    py: 1.8,
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
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : t('register.submit') + ' 🚀'}
                </Button>

                <Divider sx={{ my: 3, fontWeight: 600, color: 'text.secondary' }}>{t('login.or')}</Divider>

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
                </Button>

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {t('register.haveAccount')}{' '}
                    <Link
                      onClick={() => navigate('/login')}
                      sx={{
                        color: '#667eea',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          textDecoration: 'underline',
                          color: '#764ba2',
                        },
                      }}
                    >
                      {t('register.signIn')} →
                    </Link>
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 3, 
                      color: 'text.secondary',
                      fontSize: '0.8rem',
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
  );
};

export default RegisterPage;
