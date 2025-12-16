import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  Link,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Phone,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebase';
import Logo from '../components/Logo';

const OTPVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const steps = ['Enter Mobile Number', 'Verify OTP', 'Complete'];

  // Setup reCAPTCHA verifier
  useEffect(() => {
    // Clear existing verifier if it exists
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log('Error clearing recaptcha:', e);
      }
      window.recaptchaVerifier = undefined;
    }

    // Create new verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA verified');
      },
    });

    // Cleanup on unmount
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.log('Error clearing recaptcha on unmount:', e);
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
    setError('');
  };

  const handleOtpChange = (index: number, value: string) => {
    const newValue = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (newValue && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First check if phone exists in backend
      const checkResponse = await fetch(
        `http://localhost:8080/api/firebase-auth/check-phone?phone=${phoneNumber}`
      );
      const checkData = await checkResponse.json();
      
      console.log('Phone check:', checkData);

      // Send OTP via Firebase
      const formattedPhone = `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      
      setOtpSent(true);
      setActiveStep(1);
      setSuccess(`✅ OTP sent successfully to +91 ${phoneNumber}! Check your mobile.`);
      
      // Auto-focus first OTP input
      setTimeout(() => {
        const firstInput = document.getElementById('otp-0');
        if (firstInput) {
          (firstInput as HTMLInputElement).focus();
        }
      }, 100);
      
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otpValue);
      console.log('OTP verified:', result);
      
      // Get Firebase ID token
      const idToken = await result.user.getIdToken();
      console.log('Got Firebase token');
      
      // Check if there's pending registration data
      const pendingData = localStorage.getItem('pendingRegistration');
      let registrationData = null;
      
      if (pendingData) {
        registrationData = JSON.parse(pendingData);
        console.log('Found pending registration:', registrationData);
      }
      
      // Determine role and name
      const role = registrationData?.userType || 'CUSTOMER';
      const name = registrationData?.name || 'User';
      const email = registrationData?.email || '';
      
      // Verify with backend
      const response = await fetch(
        `http://localhost:8080/api/firebase-auth/verify-and-login?idToken=${idToken}&role=${role}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.success) {
        const userData = data.data;
        
        if (userData.requiresRegistration) {
          // New user - complete registration with backend
          if (registrationData) {
            // Call backend to complete registration
            const regResponse = await fetch(
              `http://localhost:8080/api/firebase-auth/complete-registration?phone=${phoneNumber}&name=${encodeURIComponent(registrationData.name)}&role=${role}&email=${encodeURIComponent(email)}&city=${encodeURIComponent(registrationData.city || '')}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            
            const regData = await regResponse.json();
            console.log('Registration response:', regData);
            
            if (regData.success) {
              localStorage.setItem('token', regData.data.token);
              localStorage.setItem('user', JSON.stringify(regData.data.user));
              localStorage.setItem('role', regData.data.role);
              localStorage.removeItem('pendingRegistration');
              
              setSuccess('✅ Registration successful! Redirecting...');
              
              setTimeout(() => {
                if (regData.data.role === 'PROVIDER') {
                  navigate('/provider-dashboard');
                } else {
                  navigate('/');
                }
              }, 1000);
            } else {
              setError(regData.message || 'Registration failed');
            }
          } else {
            // No registration data - redirect to register page
            setActiveStep(2);
            navigate(`/register?phone=${phoneNumber}&verified=true`);
          }
        } else {
          // Existing user - login successful
          localStorage.setItem('token', userData.token);
          localStorage.setItem('user', JSON.stringify(userData.user));
          localStorage.setItem('role', userData.role);
          localStorage.removeItem('pendingRegistration');
          
          setSuccess('✅ Login successful! Redirecting...');
          
          // Redirect based on role
          setTimeout(() => {
            if (userData.role === 'PROVIDER') {
              navigate('/provider-dashboard');
            } else if (userData.role === 'ADMIN') {
              navigate('/admin-dashboard');
            } else {
              navigate('/');
            }
          }, 1000);
        }
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
    setOtpSent(false);
    setActiveStep(0);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {/* reCAPTCHA Container */}
        <div id="recaptcha-container"></div>
        
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'white',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Logo size="large" showText={true} />
            </Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
              🔥 Firebase OTP Login
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {otpSent ? 'Enter the OTP sent to your mobile' : 'Enter your mobile number to get started'}
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Phone Number Input */}
          {!otpSent && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                Step 1: Enter your mobile number
              </Typography>
              <TextField
                fullWidth
                label="Mobile Number"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit mobile number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                      <Typography sx={{ ml: 1, color: 'text.secondary' }}>+91</Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
                autoFocus
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSendOTP}
                disabled={loading || phoneNumber.length !== 10}
                sx={{
                  py: 1.5,
                  backgroundColor: '#FF6B35',
                  '&:hover': {
                    backgroundColor: '#E64A19',
                  },
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '🔥 Send OTP via Firebase'}
              </Button>
            </Box>
          )}

          {/* OTP Input */}
          {otpSent && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, textAlign: 'center' }}>
                Step 2: Enter the OTP sent to your mobile
              </Typography>
              
              <Box sx={{ 
                bgcolor: '#E3F2FD', 
                p: 2, 
                borderRadius: 2, 
                mb: 3,
                textAlign: 'center',
              }}>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                  OTP sent to: +91 {phoneNumber}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Enter the 6-digit OTP below:
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  justifyContent: 'center',
                  mb: 3,
                  flexWrap: 'wrap',
                }}
              >
                {otp.map((digit, index) => (
                  <TextField
                    key={index}
                    id={`otp-${index}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e as any)}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 'bold',
                      },
                    }}
                    sx={{
                      width: '55px',
                      '& input': {
                        padding: '14px 0',
                      },
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF6B35',
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
                disabled={loading || otp.join('').length !== 6}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                sx={{
                  py: 2,
                  mb: 2,
                  backgroundColor: '#2E7D32',
                  '&:hover': {
                    backgroundColor: '#1B5E20',
                  },
                  '&:disabled': {
                    backgroundColor: '#BDBDBD',
                  },
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                {loading ? 'Verifying OTP...' : '✅ Verify OTP & Login'}
              </Button>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Didn't receive OTP?{' '}
                  <Link
                    component="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    sx={{ 
                      textDecoration: 'none', 
                      color: '#FF6B35', 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Resend OTP
                  </Link>
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => {
                    setOtpSent(false);
                    setActiveStep(0);
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                    setSuccess('');
                  }}
                  sx={{ textTransform: 'none', color: 'text.secondary' }}
                >
                  Change Mobile Number
                </Button>
              </Box>
            </Box>
          )}

          {/* Login Link */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ textDecoration: 'none', color: '#FF6B35', fontWeight: 'bold' }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>

          {/* Back to Home */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Back to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default OTPVerificationPage;
