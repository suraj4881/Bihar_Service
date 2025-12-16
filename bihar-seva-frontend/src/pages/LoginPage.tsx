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
  Phone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  
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
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
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
        
        // ✅ Sync language preference - Priority: localStorage (from HomePage) > User profile > sessionStorage > Default
        let savedLanguage = localStorage.getItem('language');
        console.log('🔍 LoginPage: Checking language - localStorage:', savedLanguage, 'userData.language:', userData.language);
        
        // ✅ Check sessionStorage backup if localStorage is missing
        if (!savedLanguage || (savedLanguage !== 'hi' && savedLanguage !== 'en')) {
          try {
            const sessionLang = sessionStorage.getItem('language');
            console.log('🔍 LoginPage: localStorage missing/invalid, checking sessionStorage:', sessionLang);
            if (sessionLang === 'hi' || sessionLang === 'en') {
              localStorage.setItem('language', sessionLang);
              savedLanguage = sessionLang;
              console.log('✅ LoginPage: Restored language from sessionStorage:', sessionLang);
            }
          } catch (e) {
            console.warn('⚠️ LoginPage: Could not read sessionStorage:', e);
          }
        }
        
        if (savedLanguage && (savedLanguage === 'hi' || savedLanguage === 'en')) {
          // Priority 1: Keep existing language preference from HomePage (DON'T overwrite!)
          console.log('✅ LoginPage: Language preference maintained from HomePage:', savedLanguage);
          // DO NOT set it again - just keep what's already there
        } else if (userData.language) {
          // Priority 2: User profile has language preference - use it
          const userLang = userData.language.toLowerCase();
          const langPreference = (userLang === 'hindi' || userLang === 'hi') ? 'hi' : 'en';
          localStorage.setItem('language', langPreference);
          try {
            sessionStorage.setItem('language', langPreference);
          } catch (e) {}
          console.log('✅ LoginPage: Language synced from user profile:', langPreference);
        } else {
          // Priority 3: Only default to English if nothing is set
          console.log('⚠️ LoginPage: No language found anywhere, defaulting to English');
          localStorage.setItem('language', 'en');
          try {
            sessionStorage.setItem('language', 'en');
          } catch (e) {}
        }
        
        // ✅ Check if user has password
        if (data.data.hasPassword !== undefined) {
          if (data.data.hasPassword) {
            localStorage.setItem('hasPassword', 'true');
          } else {
            localStorage.removeItem('hasPassword');
          }
        }

        // ✅ CRITICAL: Verify language is preserved before redirect
        const finalLanguage = localStorage.getItem('language');
        console.log('🔍 LoginPage: Final language check before redirect:', finalLanguage);
        if (!finalLanguage || (finalLanguage !== 'hi' && finalLanguage !== 'en')) {
          // If language was lost, restore from HomePage preference
          const homePageLang = localStorage.getItem('language') || 'en';
          localStorage.setItem('language', homePageLang);
          console.log('⚠️ LoginPage: Language was missing, restored to:', homePageLang);
        }
        
        // ✅ Role-based redirect
        console.log('🔍 Login successful - Role:', userRole);
        console.log('🔍 LoginPage: Language preserved for redirect:', localStorage.getItem('language'));
        
        let redirectPath = '/';
        if (userRole === 'ADMIN') {
          console.log('→ Redirecting to Admin Dashboard');
          redirectPath = '/admin-dashboard';
        } else if (userRole === 'PROVIDER') {
          console.log('→ Redirecting to Provider Dashboard');
          redirectPath = '/provider-dashboard';
        } else if (userRole === 'CUSTOMER') {
          console.log('→ Redirecting to Customer Dashboard');
          redirectPath = '/customer-dashboard';
        } else {
          console.log('→ Redirecting to Homepage');
          redirectPath = '/';
        }
        
        // ✅ Force full page reload to update AuthContext
        // Language is already saved in localStorage, so it will persist across reload
        window.location.href = redirectPath;
      } else {
        setError(data.message || t('login.error'));
      }
    } catch (err: any) {
      // Error handled by setError
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else if (err.message.includes('Server error')) {
        setError('Server error. Please try again later.');
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
  const goToPhoneOTP = useCallback(() => navigate('/phone-otp'), [navigate]);
  const goToRegister = useCallback(() => navigate('/register'), [navigate]);
  const goToHome = useCallback(() => navigate('/'), [navigate]);

  // ✅ Common TextField styles (static, no re-creation)
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={0} sx={{ minHeight: '600px' }}>
          {/* Left Panel - Branding */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
              borderRadius: { xs: '16px 16px 0 0', md: '16px 0 0 16px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 6,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Box onClick={goToHome} sx={{ cursor: 'pointer', mb: 4 }}>
              <Logo size={80} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {t('login.welcome')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
              {t('login.subtitle')}
            </Typography>
            <Box sx={{ width: '100%', maxWidth: 300 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  ✓
                </Box>
                <Typography>{t('login.trusted')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  ✓
                </Box>
                <Typography>{t('login.secure')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  ✓
                </Box>
                <Typography>{t('login.support')}</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right Panel - Login Form */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: { xs: '0 0 16px 16px', md: '0 16px 16px 0' },
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 6, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                  {t('login.title')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
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
                    label={t('login.email')}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#667eea' }} />
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
                          <Lock sx={{ color: '#667eea' }} />
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
                          sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }}
                        />
                      }
                      label={<Typography variant="body2">{t('login.remember')}</Typography>}
                    />
                    <Link href="#" underline="hover" sx={{ fontSize: '0.875rem', color: '#667eea' }}>
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
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      mb: 3,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                      },
                      '&:disabled': {
                        background: '#ccc',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : t('login.submit')}
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" sx={{ color: '#999', px: 2 }}>
                    {t('login.or')}
                  </Typography>
                </Divider>

                {/* Alternative Login Methods */}
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
                    mb: 2,
                    '&:hover': {
                      borderColor: '#5568d3',
                      bgcolor: 'rgba(102, 126, 234, 0.04)',
                    },
                  }}
                >
                  {t('login.emailOtp')}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={goToPhoneOTP}
                  disabled={loading}
                  startIcon={<Phone />}
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
                  {t('login.phoneOtp')}
                </Button>

                {/* Register Link */}
                <Box sx={{ textAlign: 'center', mt: 'auto' }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {t('login.noAccount')}{' '}
                    <Link
                      component="button"
                      onClick={goToRegister}
                      underline="hover"
                      sx={{ color: '#667eea', fontWeight: 600, cursor: 'pointer' }}
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
  );
};

export default LoginPage;
