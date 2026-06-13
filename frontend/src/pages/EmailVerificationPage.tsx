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
import { CheckCircle, ArrowBack } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import { getApiUrl } from '../utils/api';
import { useThemeMode } from '../contexts/ThemeContext';
import {
  sewaPageBg,
  sewaPageBgOverlay,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { mode } = useThemeMode();
  
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
        `${getApiUrl('email-verification/verify')}?email=${encodeURIComponent(email)}&code=${codeValue}`,
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
        `${getApiUrl('email-verification/resend')}?email=${encodeURIComponent(email)}`,
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
          background: sewaPageBg(mode),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
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
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              width: '100%',
            }}
          >
            <Typography variant="h5" sx={{ mb: 2 }}>
              ❌ No Email Provided
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
              Please register first to verify your email.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
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
            p: { xs: 2, sm: 3 },
            pb: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
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
              onClick={() => navigate('/register')}
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

          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 800,
              mb: 1,
              color: 'text.primary',
              fontSize: { xs: '1.35rem', sm: '1.5rem' },
              px: 0.5,
            }}
          >
            Verify Your Email
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{
              mb: { xs: 3, sm: 4 },
              color: 'text.secondary',
              px: { xs: 0, sm: 1 },
              lineHeight: 1.6,
              wordBreak: 'break-word',
            }}
          >
            We&apos;ve sent a 6-digit verification code to{' '}
            <Box component="strong" sx={{ color: 'text.primary', display: 'inline' }}>
              {email}
            </Box>
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

          {/* Code — responsive 6-column grid (no horizontal overflow on narrow screens) */}
          <Box
            component="div"
            onKeyPress={handleKeyPress}
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
            {code.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading || resending}
                size="small"
                inputProps={{
                  maxLength: 1,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  'aria-label': `Digit ${index + 1}`,
                  style: {
                    textAlign: 'center',
                    fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                    fontWeight: 700,
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

          {/* Verify Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleVerify}
            disabled={loading || resending}
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
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify Email'}
          </Button>

          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Didn&apos;t receive the code?
            </Typography>
            <Button
              variant="text"
              onClick={handleResend}
              disabled={loading || resending}
              sx={{ color: 'primary.main', textTransform: 'none', fontWeight: 700 }}
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 2,
              p: { xs: 1.75, sm: 2 },
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'grey.100',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 700 }}>
              Tips
            </Typography>
            <Box
              component="ul"
              sx={{
                color: 'text.secondary',
                m: 0,
                pl: 2.25,
                fontSize: '0.75rem',
                lineHeight: 1.75,
              }}
            >
              <li>Check your spam/junk folder</li>
              <li>Code expires in 10 minutes</li>
              <li>Make sure you entered the correct email</li>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailVerificationPage;

