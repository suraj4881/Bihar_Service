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
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
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
import { getApiUrl } from '../utils/api';
import {
  sewaPageBg,
  sewaPageBgOverlay,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { mode } = useThemeMode();
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;
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


  // Common TextField styles — labels readable on light grey field bg
  const textFieldSx = {
    '& .MuiInputLabel-root': {
      fontWeight: 600,
      fontSize: '0.9rem',
      color: mode === 'dark' ? '#cbd5e1' : '#1e293b',
    },
    '& .MuiOutlinedInput-input': {
      fontSize: { xs: '1rem', sm: '0.95rem' },
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      transition: 'all 0.3s',
      bgcolor: mode === 'dark' ? '#1E293B' : '#ffffff',
      '&:hover fieldset': {
        borderColor: primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: primary,
        borderWidth: 2,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: primary,
    },
  };

  const sectionLabelSx = {
    mb: 1,
    fontWeight: 800,
    color: 'text.primary',
    fontSize: { xs: '0.95rem', sm: '0.9rem' },
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
    setError('');
  };

  const toggleButtonStyles = {
    py: { xs: 0.85, sm: 1 },
    px: 1.25,
    textTransform: 'none' as const,
    fontWeight: 700,
    fontSize: { xs: '0.875rem', sm: '0.9rem' },
    gap: 1,
    borderColor: alpha('#000', mode === 'dark' ? 0.35 : 0.12),
    color: mode === 'dark' ? '#94a3b8' : '#64748b',
    '&.Mui-selected': {
      color: '#fff',
      bgcolor: `${primary} !important`,
      borderColor: `${primary} !important`,
      '&:hover': {
        bgcolor: `${primaryDark} !important`,
      },
    },
    '&:hover': {
      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,105,92,0.06)',
    },
  };

  const handleRoleToggle = (_: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (value) handleChange('role', value);
  };

  const handleLanguageToggle = (_: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (!value) return;
    handleChange('language', value);
    const langCode = value === 'Hindi' ? 'hi' : 'en';
    setLanguage(langCode);
    localStorage.setItem('language', langCode);
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
      
      const response = await fetch(getApiUrl('auth/register'), {
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
        background: sewaPageBg(mode),
        display: 'flex',
        alignItems: 'center',
        py: { xs: 2, md: 3 },
        px: { xs: 1, sm: 0 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: sewaPageBgOverlay(mode),
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
            background: mode === 'dark' ? '#1E293B' : '#ffffff',
            backdropFilter: 'blur(20px)',
            boxShadow: mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.8)'
              : '0 20px 50px rgba(0, 77, 64, 0.18)',
            border: mode === 'dark' ? '1px solid #334155' : '1px solid rgba(0, 77, 64, 0.12)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Grid container>
            {/* Left: solid teal panel — readable on web + stacked on mobile */}
            <Grid
              item
              xs={12}
              md={4}
              sx={{
                display: 'flex',
                background:
                  mode === 'dark'
                    ? 'linear-gradient(165deg, #022c26 0%, #0d3d36 45%, #0f4a42 100%)'
                    : 'linear-gradient(165deg, #004D40 0%, #00695C 42%, #00897B 100%)',
                color: '#fff',
                p: { xs: 2.5, sm: 3 },
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,255,255,0.15) 0%, transparent 55%)',
                  pointerEvents: 'none',
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 320 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Logo size="medium" showText tone="inverse" />
                </Box>

                <Box
                  sx={{
                    fontSize: { xs: '2.75rem', sm: '3.25rem' },
                    my: { xs: 1.5, sm: 2 },
                    lineHeight: 1,
                  }}
                  aria-hidden
                >
                  👨‍🔧
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    mt: 0.5,
                    mb: 1,
                    fontWeight: 800,
                    fontFamily: '"Poppins", "Inter", sans-serif',
                    color: '#ffffff',
                    fontSize: { xs: '1.15rem', sm: '1.35rem' },
                    lineHeight: 1.35,
                    textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                  }}
                >
                  {t('register.welcome')}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.92)',
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    lineHeight: 1.55,
                    maxWidth: '100%',
                    mx: 'auto',
                    fontWeight: 500,
                  }}
                >
                  {t('register.subtitle')}
                </Typography>

                <Box
                  sx={{
                    mt: 2,
                    p: 1.75,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.28)',
                    textAlign: 'left',
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
                        gap: 1,
                        mb: index < 3 ? 1.25 : 0,
                        fontSize: { xs: '0.88rem', sm: '0.9rem' },
                        fontWeight: 600,
                        color: '#ffffff',
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          flexShrink: 0,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(255,255,255,0.18)',
                          fontSize: '0.95rem',
                        }}
                      >
                        {item.icon}
                      </Box>
                      <span>{item.text}</span>
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
                background: mode === 'dark' ? '#1E293B' : '#f4f8f7',
              }}
            >
              <CardContent
                sx={{
                  p: { xs: 2.5, sm: 3, md: 3.5 },
                  flex: 1,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: primary, borderRadius: '3px' },
                }}
              >
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      fontWeight: 800,
                      fontFamily: '"Poppins", "Inter", sans-serif',
                      color: mode === 'dark' ? '#E0F2F1' : primaryDark,
                      mb: 0.75,
                      fontSize: { xs: '1.35rem', sm: '1.5rem' },
                    }}
                  >
                    {t('register.title')}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.95rem', sm: '0.9rem' },
                      fontWeight: 500,
                      lineHeight: 1.5,
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

                <Grid container spacing={{ xs: 2, sm: 1.5 }}>
                  {/* Account type — compact segmented control */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={sectionLabelSx}>
                      {t('register.registerAs')}: *
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      value={formData.role}
                      onChange={handleRoleToggle}
                      aria-label={t('register.registerAs')}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        '& .MuiToggleButton-root': {
                          ...toggleButtonStyles,
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          '& .MuiSvgIcon-root': {
                            fontSize: 20,
                            opacity: 0.95,
                          },
                        },
                      }}
                    >
                      <ToggleButton value="CUSTOMER">
                        <PersonOutline sx={{ mr: 0.75 }} />
                        {t('register.customer')}
                      </ToggleButton>
                      <ToggleButton value="PROVIDER">
                        <Work sx={{ mr: 0.75 }} />
                        {t('register.provider')}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>

                  {/* Language — same pattern, single row */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={sectionLabelSx}>
                      {t('register.language')}: *
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      value={formData.language}
                      onChange={handleLanguageToggle}
                      aria-label={t('register.language')}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        '& .MuiToggleButton-root': {
                          ...toggleButtonStyles,
                          justifyContent: 'center',
                          flex: 1,
                        },
                      }}
                    >
                      <ToggleButton value="English">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            component="span"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              letterSpacing: 0.5,
                              opacity: 0.85,
                              minWidth: 22,
                              textAlign: 'center',
                            }}
                          >
                            EN
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              fontFamily: '"Poppins", sans-serif',
                            }}
                          >
                            {t('register.english')}
                          </Typography>
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="Hindi">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            component="span"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              letterSpacing: 0.5,
                              opacity: 0.85,
                              minWidth: 22,
                              textAlign: 'center',
                            }}
                          >
                            हि
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              fontFamily: '"Noto Sans Devanagari", "Poppins", sans-serif',
                            }}
                          >
                            {t('register.hindi')}
                          </Typography>
                        </Box>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>

                  {/* Name and Email in same row */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('register.name')}
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: primary, fontSize: 20 }} />
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
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: primary, fontSize: 20 }} />
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
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone sx={{ color: primary, fontSize: 20 }} />
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
                      size="medium"
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
                                  <LocationOn sx={{ color: primary, fontSize: 20 }} />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {locationLoading ? <CircularProgress size={18} sx={{ color: primary }} /> : null}
                                {params.InputProps.endAdornment}
                                <IconButton
                                  size="small"
                                  onClick={handleGetLocation}
                                  disabled={locationLoading}
                                  title={t('register.getLocation')}
                                  sx={{ color: primary, p: 0.5 }}
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
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: primary, fontSize: 20 }} />
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
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: primary, fontSize: 20 }} />
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
                    background: sewaPrimaryButtonGradient,
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(0, 77, 64, 0.35)',
                    '&:hover': {
                      background: sewaPrimaryButtonHover,
                      boxShadow: '0 12px 28px rgba(0, 77, 64, 0.42)',
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
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '0.95rem', sm: '0.875rem' } }}>
                    {t('register.haveAccount')}{' '}
                    <Link
                      onClick={() => navigate('/login')}
                      sx={{
                        color: 'primary.main',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          textDecoration: 'underline',
                          color: 'primary.dark',
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
                      fontSize: { xs: '0.8rem', sm: '0.75rem' },
                      lineHeight: 1.5,
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
