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
  IconButton,
  Link,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, ArrowBack, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';

const ForgetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const steps = [
    language === 'hi' ? 'ईमेल दर्ज करें' : 'Enter Email',
    language === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP',
    language === 'hi' ? 'नया पासवर्ड सेट करें' : 'Set New Password'
  ];
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (activeStep === 1 && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [activeStep]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  }, []);

  const handleOtpChange = useCallback((index: number, value: string) => {
    const newValue = value.replace(/\D/g, '').slice(0, 1);
    
    setOtp(prev => {
      const newOtp = [...prev];
      newOtp[index] = newValue;
      return newOtp;
    });
    
    setError('');

    if (newValue && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleSendOTP = useCallback(async () => {
    if (!email.trim()) {
      setError(language === 'hi' ? 'कृपया अपना ईमेल पता दर्ज करें' : 'Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(language === 'hi' ? 'कृपया एक वैध ईमेल पता दर्ज करें' : 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:8080/api/auth/forgot-password?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpSent(true);
        setSuccess(language === 'hi' 
          ? 'OTP आपके ईमेल पर भेजा गया है' 
          : 'OTP has been sent to your email');
        setActiveStep(1);
      } else {
        setError(data.message || (language === 'hi' ? 'OTP भेजने में त्रुटि' : 'Error sending OTP'));
      }
    } catch (err: any) {
      setError(err.message || (language === 'hi' ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [email, language]);

  const handleVerifyOTP = useCallback(async () => {
    const otpValue = otp.join('').trim();
    if (otpValue.length !== 6) {
      setError(language === 'hi' ? 'कृपया 6 अंकों का OTP दर्ज करें' : 'Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const response = await fetch(
        `http://localhost:8080/api/auth/verify-password-reset-otp?email=${encodeURIComponent(normalizedEmail)}&otp=${otpValue}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setActiveStep(2);
        setSuccess(language === 'hi' ? 'OTP सत्यापित किया गया' : 'OTP verified successfully');
      } else {
        setError(data.message || (language === 'hi' ? 'अमान्य या समाप्त OTP' : 'Invalid or expired OTP'));
      }
    } catch (err: any) {
      setError(err.message || (language === 'hi' ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [email, otp, language]);

  const handleResetPassword = useCallback(async () => {
    if (!newPassword || newPassword.length < 6) {
      setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(language === 'hi' ? 'पासवर्ड मेल नहीं खा रहे हैं' : 'Passwords do not match');
      return;
    }

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError(language === 'hi' ? 'कृपया OTP दर्ज करें' : 'Please enter OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const response = await fetch(
        `http://localhost:8080/api/auth/reset-password-otp?email=${encodeURIComponent(normalizedEmail)}&otp=${otpValue.trim()}&password=${encodeURIComponent(newPassword)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(language === 'hi' ? 'पासवर्ड सफलतापूर्वक रीसेट किया गया!' : 'Password reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || (language === 'hi' ? 'पासवर्ड रीसेट करने में त्रुटि' : 'Error resetting password'));
      }
    } catch (err: any) {
      setError(err.message || (language === 'hi' ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।' : 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [email, otp, newPassword, confirmPassword, navigate, language]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: '#1F2937' }}>
              {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#6B7280' }}>
              {language === 'hi' 
                ? 'अपना ईमेल पता दर्ज करें और हम आपको पासवर्ड रीसेट करने के लिए OTP भेजेंगे'
                : 'Enter your email address and we will send you an OTP to reset your password'}
            </Typography>
            <TextField
              fullWidth
              label={language === 'hi' ? 'ईमेल पता' : 'Email Address'}
              type="email"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleSendOTP}
              disabled={loading}
              sx={{
                bgcolor: '#667eea',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#5568d3',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                language === 'hi' ? 'OTP भेजें' : 'Send OTP'
              )}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: '#1F2937' }}>
              {language === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#6B7280' }}>
              {language === 'hi' 
                ? `हमने ${email} पर OTP भेजा है`
                : `We have sent an OTP to ${email}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  inputRef={(el) => (otpInputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  inputProps={{
                    maxLength: 1,
                    style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 },
                  }}
                  sx={{
                    width: 56,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              ))}
            </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length !== 6}
              sx={{
                bgcolor: '#667eea',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#5568d3',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                language === 'hi' ? 'सत्यापित करें' : 'Verify'
              )}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={handleSendOTP}
              disabled={loading}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              {language === 'hi' ? 'OTP पुनः भेजें' : 'Resend OTP'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: '#1F2937' }}>
              {language === 'hi' ? 'नया पासवर्ड सेट करें' : 'Set New Password'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#6B7280' }}>
              {language === 'hi' 
                ? 'कृपया अपना नया पासवर्ड दर्ज करें'
                : 'Please enter your new password'}
            </Typography>
            <TextField
              fullWidth
              label={language === 'hi' ? 'नया पासवर्ड' : 'New Password'}
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label={language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
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
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading}
              sx={{
                bgcolor: '#10B981',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#059669',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                language === 'hi' ? 'पासवर्ड रीसेट करें' : 'Reset Password'
              )}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar variant="simple" position="sticky" showBackButton />
      
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {renderStepContent()}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              sx={{
                color: '#667eea',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {language === 'hi' ? '← लॉगिन पर वापस जाएं' : '← Back to Login'}
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgetPasswordPage;
