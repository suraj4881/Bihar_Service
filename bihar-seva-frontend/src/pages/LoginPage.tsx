import React, { useState, useCallback, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeMode } from '../contexts/ThemeContext';
import Logo from '../components/Logo';
import AppBar from '../components/AppBar';

const LoginPage: React.FC = () => {
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
      }
    }
  }, []);
  
  // ✅ Separate state for better performance
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Memoized handlers to prevent re-creation
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleRememberMeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  }, []);

  // ✅ Optimized submit handler
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validation
    const identifier = email.trim();
    if (!identifier) {
      setError('Please enter your email or mobile number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (identifier.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      if (!/^[6-9]\d{9}$/.test(identifier)) {
        setError('Please enter a valid mobile number');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : null;

      if (!response.ok || !data?.success) {
        const message = data?.message || `Login failed (status ${response.status})`;
        if (message.toLowerCase().includes('invalid email or password')) {
          setError('Invalid credentials');
        } else {
          setError(message);
        }
        return;
      }

      if (data.success) {
        // ✅ Get role from response
        const userRole = data.data.role || data.data.user?.role || 'CUSTOMER';
        
        // ✅ Ensure user object has role property
        const userData = {
          ...data.data.user,
          role: userRole, // Explicitly set role
        };
        
        // ✅ Save auth data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', userRole);
        
        // Sync language preference - Priority: localStorage (from HomePage) > User profile > sessionStorage > Default
        let savedLanguage = localStorage.getItem('language');
        
        // Check sessionStorage backup if localStorage is missing
        if (!savedLanguage || (savedLanguage !== 'hi' && savedLanguage !== 'en')) {
          try {
            const sessionLang = sessionStorage.getItem('language');
            if (sessionLang === 'hi' || sessionLang === 'en') {
              localStorage.setItem('language', sessionLang);
              savedLanguage = sessionLang;
            }
          } catch (e) {
            // Ignore sessionStorage errors
          }
        }
        
        if (savedLanguage && (savedLanguage === 'hi' || savedLanguage === 'en')) {
          // Priority 1: Keep existing language preference from HomePage
        } else if (userData.language) {
          // Priority 2: User profile has language preference - use it
          const userLang = userData.language.toLowerCase();
          const langPreference = (userLang === 'hindi' || userLang === 'hi') ? 'hi' : 'en';
          localStorage.setItem('language', langPreference);
          try {
            sessionStorage.setItem('language', langPreference);
          } catch (e) {
            // Ignore sessionStorage errors
          }
        } else {
          // Priority 3: Only default to English if nothing is set
          localStorage.setItem('language', 'en');
          try {
            sessionStorage.setItem('language', 'en');
          } catch (e) {
            // Ignore sessionStorage errors
          }
        }
        
        // Check if user has password
        if (data.data.hasPassword !== undefined) {
          if (data.data.hasPassword) {
            localStorage.setItem('hasPassword', 'true');
          } else {
            localStorage.removeItem('hasPassword');
          }
        }

        // Verify language is preserved before redirect
        const finalLanguage = localStorage.getItem('language');
        if (!finalLanguage || (finalLanguage !== 'hi' && finalLanguage !== 'en')) {
          const homePageLang = localStorage.getItem('language') || 'en';
          localStorage.setItem('language', homePageLang);
        }
        
        // Role-based redirect
        let redirectPath = '/';
        if (userRole === 'ADMIN') {
          redirectPath = '/admin-dashboard';
        } else if (userRole === 'SUPPORT') {
          redirectPath = '/support-dashboard';
        } else if (userRole === 'PROVIDER') {
          redirectPath = '/provider-dashboard';
        } else if (userRole === 'CUSTOMER') {
          redirectPath = '/customer-dashboard';
        }
        
        // ✅ Force full page reload to update AuthContext
        // Language is already saved in localStorage, so it will persist across reload
        window.location.href = redirectPath;
      }
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate]);

  // ✅ Handle Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  }, [handleSubmit, loading]);

  // ✅ Navigation handlers (memoized)
  const goToEmailOTP = useCallback(() => navigate('/email-otp'), [navigate]);
  const goToRegister = useCallback(() => navigate('/register'), [navigate]);
  const goToHome = useCallback(() => navigate('/'), [navigate]);

  // ✅ Common TextField styles (static, no re-creation)
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      transition: 'all 0.3s',
      bgcolor: mode === 'dark' ? '#1E293B' : '#F8FAFC',
      '&:hover fieldset': {
        borderColor: '#3B82F6',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3B82F6',
        borderWidth: 2,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#3B82F6',
    },
  };

  return (
    <Box>
      <AppBar />
    <Box
      sx={{
        minHeight: '100vh',
        background: mode === 'dark'
          ? 'linear-gradient(135deg, #0B1220 0%, #111827 50%, #1F2937 100%)'
          : 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
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
          backgroundImage: mode === 'dark'
            ? `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 80% 30%, rgba(96, 165, 250, 0.1) 0%, transparent 50%)`
            : `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
               radial-gradient(circle at 80% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={0} sx={{ minHeight: '600px' }}>
          {/* Left Panel - Branding */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              background: mode === 'dark'
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.3) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)',
              backdropFilter: 'blur(20px)',
              border: mode === 'dark'
                ? '1px solid rgba(59, 130, 246, 0.3)'
                : '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: { xs: '16px 16px 0 0', md: '16px 0 0 16px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 6,
              color: mode === 'dark' ? '#E2E8F0' : 'white',
              textAlign: 'center',
            }}
          >
            <Box 
              onClick={goToHome} 
              sx={{ 
                cursor: 'pointer', 
                mb: 4,
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Logo size={80} />
            </Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
                  : 'linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('login.welcome')}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 4, 
                opacity: mode === 'dark' ? 0.9 : 0.95,
                color: mode === 'dark' ? '#CBD5E0' : 'rgba(255,255,255,0.95)',
                fontWeight: 400,
              }}
            >
              {t('login.subtitle')}
            </Typography>
            <Box sx={{ width: '100%', maxWidth: 320 }}>
              {[
                { key: 'trusted', icon: '✓' },
                { key: 'secure', icon: '✓' },
                { key: 'support', icon: '✓' },
              ].map((item, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: index < 2 ? 2.5 : 0,
                    p: 1.5,
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: mode === 'dark' 
                        ? 'rgba(59, 130, 246, 0.2)' 
                        : 'rgba(255,255,255,0.1)',
                      transform: 'translateX(5px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: mode === 'dark'
                        ? 'rgba(59, 130, 246, 0.3)'
                        : 'rgba(255,255,255,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: mode === 'dark' ? '#60A5FA' : 'white',
                      boxShadow: mode === 'dark'
                        ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                        : '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography 
                    sx={{ 
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: mode === 'dark' ? '#E2E8F0' : 'white',
                    }}
                  >
                    {t(`login.${item.key}`)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Right Panel - Login Form */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: { xs: '0 0 16px 16px', md: '0 16px 16px 0' },
                bgcolor: mode === 'dark' ? '#1E293B' : 'white',
                border: mode === 'dark' 
                  ? '1px solid #334155' 
                  : '1px solid rgba(0,0,0,0.05)',
                boxShadow: mode === 'dark'
                  ? '0 20px 60px rgba(0,0,0,0.8)'
                  : '0 20px 60px rgba(0,0,0,0.15)',
              }}
            >
              <CardContent sx={{ p: { xs: 4, sm: 6 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 1,
                    color: mode === 'dark' ? '#E2E8F0' : '#1E293B',
                  }}
                >
                  {t('login.title')}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 4, 
                    color: mode === 'dark' ? '#94A3B8' : '#64748B',
                    fontWeight: 400,
                  }}
                >
                  {t('login.subtitle')}
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {/* Email/Password Login */}
                <Box component="form" onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
                  <TextField
                    fullWidth
                    label="Email or Mobile"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#2563EB' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ ...textFieldSx, mb: 3 }}
                  />

                  <TextField
                    fullWidth
                    label={t('login.password')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#2563EB' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={togglePasswordVisibility} edge="end" disabled={loading}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ ...textFieldSx, mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={handleRememberMeChange}
                          disabled={loading}
                          sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }}
                        />
                      }
                      label={<Typography variant="body2">{t('login.remember')}</Typography>}
                    />
                    <Link 
                      href="#" 
                      underline="hover" 
                      sx={{ 
                        fontSize: '0.875rem', 
                        color: '#3B82F6',
                        fontWeight: 600,
                        '&:hover': {
                          color: '#2563EB',
                        },
                      }}
                    >
                      {t('login.forgot')}
                    </Link>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading}
                      sx={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: 'white',
                      py: 1.75,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      mb: 3,
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
                      transition: 'all 0.3s',
                      '&:hover': {
                          background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                        transform: 'translateY(-2px)',
                          boxShadow: '0 12px 32px rgba(37, 99, 235, 0.45)',
                      },
                      '&:disabled': {
                        background: mode === 'dark' ? '#475569' : '#CBD5E0',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : t('login.submit')}
                  </Button>
                </Box>

                {/* OTP Feature - Disabled for now. Enable when OTP feature is ready */}
                {/* 
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" sx={{ color: '#999', px: 2 }}>
                    {t('login.or')}
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={goToEmailOTP}
                  disabled={loading}
                  startIcon={<Email />}
                  sx={{
                    borderColor: '#667eea',
                    color: '#667eea',
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    mb: 3,
                    '&:hover': {
                      borderColor: '#5568d3',
                      bgcolor: 'rgba(102, 126, 234, 0.04)',
                    },
                  }}
                >
                  {t('login.emailOtp')}
                </Button>
                */}

                {/* Register Link */}
                <Box sx={{ textAlign: 'center', mt: 'auto' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: mode === 'dark' ? '#94A3B8' : '#64748B',
                      fontWeight: 400,
                    }}
                  >
                    {t('login.noAccount')}{' '}
                    <Link
                      component="button"
                      onClick={goToRegister}
                      underline="hover"
                      sx={{ 
                        color: '#3B82F6', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#2563EB',
                        },
                      }}
                    >
                      {t('login.signup')}
                    </Link>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
    </Box>
  );
};

export default LoginPage;
