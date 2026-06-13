import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Email, CheckCircle, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { getApiUrl } from '../utils/api';
import { useThemeMode } from '../contexts/ThemeContext';
import { sewaPageBg, sewaPageBgOverlay, sewaPrimaryButtonGradient, sewaPrimaryButtonHover } from '../theme/sewaDesign';

const EmailOTPPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  
  // ✅ Separate state for better performance
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const steps = ['Enter Email', 'Verify OTP', 'Complete'];
  
  // ✅ Refs for OTP inputs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ✅ Auto-focus first OTP input when step changes
  useEffect(() => {
    if (activeStep === 1 && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [activeStep]);

  // ✅ Email change handler
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  }, []);

  // ✅ Name change handler
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setError('');
  }, []);

  // ✅ OTP change handler (optimized)
  const handleOtpChange = useCallback((index: number, value: string) => {
    const newValue = value.replace(/\D/g, '').slice(0, 1);
    
    setOtp(prev => {
      const newOtp = [...prev];
      newOtp[index] = newValue;
      return newOtp;
    });
    
    setError('');

    // Auto-focus next input
    if (newValue && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, []);

  // ✅ OTP backspace handler
  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  // ✅ Send OTP handler
  const handleSendOTP = useCallback(async () => {
    // Validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      
      const response = await fetch(
        `${getApiUrl('email-otp/send')}?email=${encodeURIComponent(email.trim())}`,
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setActiveStep(1);
        setIsNewUser(!data.data.exists);
        setSuccess(`✅ OTP sent to ${email}! Check your email inbox.`);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      // Error handled by setError
      
      if (err.message.includes('Failed to fetch')) {
        setError('❌ Cannot connect to server. Please ensure backend is running on http://localhost:8080');
      } else if (err.message.includes('Server error')) {
        setError('❌ Server error. Please check backend logs.');
      } else {
        setError(err.message || '❌ Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ✅ Verify OTP handler
  const handleVerifyOTP = useCallback(async () => {
    const otpValue = otp.join('');
    
    // Validation
    if (otpValue.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    if (isNewUser && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      const base = getApiUrl('email-otp/verify');
      const url = isNewUser
        ? `${base}?email=${encodeURIComponent(email)}&otp=${otpValue}&name=${encodeURIComponent(name.trim())}`
        : `${base}?email=${encodeURIComponent(email)}&otp=${otpValue}`;
      
      const response = await fetch(url, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (data.data.requiresRegistration) {
          setActiveStep(2);
          setIsNewUser(true);
          setSuccess('✅ Email verified! Please enter your name.');
        } else {
          // Login/Registration successful
          // ✅ Get role from response
          const userRole = data.data.role || data.data.user?.role || 'CUSTOMER';
          
          // ✅ Ensure user object has role property
          const userData = {
            ...data.data.user,
            role: userRole, // Explicitly set role
          };
          
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('role', userRole);
          
          // ✅ Sync language preference - Priority: localStorage (from HomePage) > User profile > sessionStorage > Default
          let savedLanguage = localStorage.getItem('language');
          
          // ✅ Check sessionStorage backup if localStorage is missing
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
            } catch (e) {}
          } else {
            // Priority 3: Only default to English if nothing is set
            localStorage.setItem('language', 'en');
            try {
              sessionStorage.setItem('language', 'en');
            } catch (e) {}
          }
          
          // Save hasPassword flag
          if (data.data.hasPassword) {
            localStorage.setItem('hasPassword', 'true');
          } else {
            localStorage.removeItem('hasPassword');
          }
          
          setActiveStep(2);
          setSuccess(`✅ ${isNewUser ? 'Registration' : 'Login'} successful! Redirecting...`);
          
          setTimeout(() => {
            // ✅ Verify language is preserved before redirect
            const finalLanguage = localStorage.getItem('language');
            if (!finalLanguage || (finalLanguage !== 'hi' && finalLanguage !== 'en')) {
              const homePageLang = localStorage.getItem('language') || 'en';
              localStorage.setItem('language', homePageLang);
            }
            
            // Redirect based on role and password status
            let redirectPath = '/';
            
            if (!data.data.hasPassword) {
              // Need to create password in profile setup
              if (userRole === 'PROVIDER') {
                redirectPath = '/setup/provider';
              } else {
                redirectPath = '/setup/customer';
              }
            } else {
              // Password already set, redirect based on role
              if (userRole === 'ADMIN') {
                redirectPath = '/admin-dashboard';
              } else if (userRole === 'PROVIDER') {
                redirectPath = '/provider-dashboard';
              } else if (userRole === 'CUSTOMER') {
                redirectPath = '/customer-dashboard';
              } else {
                redirectPath = '/';
              }
            }
            
            // Language is already saved in localStorage, so it will persist across reload
            window.location.href = redirectPath;
          }, 1500);
        }
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      // Error handled by setError
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, email, name, isNewUser, navigate]);

  // ✅ Resend OTP handler
  const handleResendOTP = useCallback(async () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `${getApiUrl('email-otp/resend')}?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ OTP resent successfully! Check your email.');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      // Error handled by setError
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ✅ Back handler
  const handleBack = useCallback(() => {
    if (activeStep === 1) {
      setActiveStep(0);
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess('');
    } else {
      navigate('/login');
    }
  }, [activeStep, navigate]);

  // ✅ Enter key handler
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      if (activeStep === 0) {
        handleSendOTP();
      } else if (activeStep === 1) {
        handleVerifyOTP();
      }
    }
  }, [activeStep, loading, handleSendOTP, handleVerifyOTP]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: sewaPageBg(mode),
        display: 'flex',
        alignItems: 'center',
        py: { xs: 2, sm: 4 },
        px: { xs: 1.5, sm: 2 },
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: sewaPageBgOverlay(mode),
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Paper
          elevation={10}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: mode === 'dark' ? 'divider' : 'rgba(15, 23, 42, 0.08)',
            bgcolor: 'background.paper',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Top: back (no overlap with logo) */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
            <Button
              startIcon={<ArrowBack sx={{ fontSize: 20 }} />}
              onClick={handleBack}
              disabled={loading}
              size="small"
              sx={{
                color: 'primary.main',
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 0,
                px: 0.5,
              }}
            >
              Back
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 2, sm: 3 } }}>
            <Logo size="medium" onClick={() => navigate('/')} />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: 'text.primary',
              fontSize: { xs: '1.35rem', sm: '2.125rem' },
              px: 0.5,
            }}
          >
            Email OTP Login
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: { xs: 3, sm: 4 }, color: 'text.secondary', px: { xs: 0, sm: 1 }, lineHeight: 1.6 }}
          >
            {activeStep === 0 && 'Enter your email to receive OTP'}
            {activeStep === 1 && 'Enter the 6-digit OTP sent to your email'}
            {activeStep === 2 && 'Success!'}
          </Typography>

          {/* Stepper — scroll on very narrow screens */}
          <Stepper
            activeStep={activeStep}
            sx={{
              mb: 4,
              width: '100%',
              overflowX: 'auto',
              pb: 0.5,
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
              {success}
            </Alert>
          )}

          {/* Step 0: Email Input */}
          {activeStep === 0 && (
            <Box onKeyPress={handleKeyPress}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSendOTP}
                disabled={loading}
                sx={{
                  background: sewaPrimaryButtonGradient,
                  py: { xs: 1.35, sm: 1.5 },
                  borderRadius: 999,
                  textTransform: 'none',
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  fontWeight: 700,
                  '&:hover': { background: sewaPrimaryButtonHover },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send OTP'}
              </Button>
            </Box>
          )}

          {/* Step 1: OTP Input */}
          {activeStep === 1 && (
            <Box>
              {isNewUser && (
                <TextField
                  fullWidth
                  label="Your Name"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  sx={{ mb: 3 }}
                />
              )}
              
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                  gap: { xs: 0.5, sm: 1 },
                  mb: 3,
                  width: '100%',
                  maxWidth: { xs: '100%', sm: 400 },
                  mx: 'auto',
                }}
              >
                {otp.map((digit, index) => (
                  <TextField
                    key={index}
                    inputRef={(el) => (otpInputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={loading}
                    size="small"
                    inputProps={{
                      maxLength: 1,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      'aria-label': `OTP digit ${index + 1}`,
                      style: {
                        textAlign: 'center',
                        fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                        fontWeight: 600,
                        padding: '8px 4px',
                      },
                    }}
                    sx={{
                      width: '100%',
                      minWidth: 0,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleVerifyOTP}
                disabled={loading}
                sx={{
                  background: sewaPrimaryButtonGradient,
                  py: { xs: 1.35, sm: 1.5 },
                  borderRadius: 999,
                  textTransform: 'none',
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  fontWeight: 700,
                  mb: 2,
                  '&:hover': { background: sewaPrimaryButtonHover },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={handleResendOTP}
                disabled={loading}
                sx={{ color: 'primary.main', textTransform: 'none' }}
              >
                Resend OTP
              </Button>
            </Box>
          )}

          {/* Step 2: Success */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#4caf50' }}>
                {success}
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailOTPPage;
