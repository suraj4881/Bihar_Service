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
import AppBar from '../components/AppBar';
import Logo from '../components/Logo';

const EmailOTPPage: React.FC = () => {
  const navigate = useNavigate();
  
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
        `http://localhost:8080/api/email-otp/send?email=${encodeURIComponent(email.trim())}`,
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
      
      const url = isNewUser
        ? `http://localhost:8080/api/email-otp/verify?email=${encodeURIComponent(email)}&otp=${otpValue}&name=${encodeURIComponent(name.trim())}`
        : `http://localhost:8080/api/email-otp/verify?email=${encodeURIComponent(email)}&otp=${otpValue}`;
      
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
        `http://localhost:8080/api/email-otp/resend?email=${encodeURIComponent(email)}`,
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
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            position: 'relative',
            border: '1px solid rgba(15, 23, 42, 0.08)',
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Logo size={60} onClick={() => navigate('/')} />
          </Box>

          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            disabled={loading}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: 'primary.main',
            }}
          >
            Back
          </Button>

          {/* Title */}
          <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Email OTP Login
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 4, color: '#666' }}>
            {activeStep === 0 && 'Enter your email to receive OTP'}
            {activeStep === 1 && 'Enter the 6-digit OTP sent to your email'}
            {activeStep === 2 && 'Success!'}
          </Typography>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
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
                      <Email sx={{ color: '#667eea' }} />
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
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
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
                {otp.map((digit, index) => (
                  <TextField
                    key={index}
                    inputRef={(el) => (otpInputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={loading}
                    inputProps={{
                      maxLength: 1,
                      style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 },
                    }}
                    sx={{
                      width: 50,
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={handleResendOTP}
                disabled={loading}
                sx={{ color: '#667eea', textTransform: 'none' }}
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
