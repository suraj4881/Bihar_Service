import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email, CheckCircle, ArrowBack } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import Logo from '../components/Logo';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  
  // ✅ Sync language on mount from localStorage
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  const email = location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleCodeChange = useCallback((index: number, value: string) => {
    const newValue = value.replace(/\D/g, '').slice(0, 1);
    
    setCode(prev => {
      const newCode = [...prev];
      newCode[index] = newValue;
      return newCode;
    });
    
    setError('');

    // Auto-focus next input
    if (newValue && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [code]);

  const handleVerify = useCallback(async () => {
    const codeValue = code.join('');
    
    if (codeValue.length !== 6) {
      setError('Please enter complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:8080/api/email-verification/verify?email=${encodeURIComponent(email)}&code=${codeValue}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err: any) {
      console.error('❌ Verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [code, email, navigate]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `http://localhost:8080/api/email-verification/resend?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ Verification code resent! Check your email.');
        setCode(['', '', '', '', '', '']);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (err: any) {
      console.error('❌ Resend error:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }, [email]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  }, [handleVerify, loading]);

  if (!email) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={10} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              ❌ No Email Provided
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
              Please register first to verify your email.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              Go to Register
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3, position: 'relative' }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Logo size="medium" onClick={() => navigate('/')} />
          </Box>

          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/register')}
            disabled={loading}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: '#667eea',
            }}
          >
            Back
          </Button>

          {/* Title */}
          <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
            Verify Your Email
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 4, color: '#666' }}>
            We've sent a 6-digit verification code to
            <br />
            <strong>{email}</strong>
          </Typography>

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

          {/* Code Input */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }} onKeyPress={handleKeyPress}>
            {code.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading || resending}
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

          {/* Verify Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleVerify}
            disabled={loading || resending}
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
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify Email'}
          </Button>

          {/* Resend Button */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
              Didn't receive the code?
            </Typography>
            <Button
              variant="text"
              onClick={handleResend}
              disabled={loading || resending}
              sx={{ color: '#667eea', textTransform: 'none', fontWeight: 600 }}
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </Button>
          </Box>

          {/* Help Text */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              <strong>💡 Tips:</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
              • Check your spam/junk folder
              <br />
              • Code expires in 10 minutes
              <br />
              • Make sure you entered the correct email
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailVerificationPage;

