import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  Alert,
  CircularProgress,
  Autocomplete,
  IconButton,
} from '@mui/material';
import {
  Home,
  LocationOn,
  CheckCircle,
  Lock,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BIHAR_CITIES } from '../utils/constants';
import AppBar from '../components/AppBar';

const CustomerProfileSetup: React.FC = () => {
  const navigate = useNavigate();
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Check if user logged in via OTP (no password set)
  const isOTPLogin = !localStorage.getItem('hasPassword'); // This will be set by backend
  
  const [profileData, setProfileData] = useState({
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      area: '',
      city: 'Patna',
      pincode: '',
      landmark: '',
    },
    preferences: {
      preferredLanguage: 'Hindi',
      communicationMode: 'Phone',
    },
  });

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData({
        ...profileData,
        [parent]: {
          ...(profileData as any)[parent],
          [child]: value,
        },
      });
    } else {
      setProfileData({ ...profileData, [field]: value });
    }
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!profileData.address.street || !profileData.address.area || !profileData.address.pincode) {
      setError('Please fill all required address fields');
      return;
    }
    
    // Password validation if user logged in via OTP
    if (isOTPLogin) {
      if (!profileData.password) {
        setError('Please create a password for your account');
        return;
      }
      if (profileData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (profileData.password !== profileData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/customers/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          password: isOTPLogin ? profileData.password : undefined,
          address: profileData.address,
          preferences: profileData.preferences,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Mark that password is now set
        if (isOTPLogin && profileData.password) {
          localStorage.setItem('hasPassword', 'true');
        }
        // Redirect to home page
        navigate('/');
        window.location.reload();
      } else {
        setError(data.message || 'Profile setup failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
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
      }}
    >
      <Container maxWidth="md">
        <Card elevation={10} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 5 }}>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 700, 
                textAlign: 'center', 
                mb: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Complete Your Profile 🎯
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
              Help us serve you better by providing your address details
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            
            {isOTPLogin && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Security Setup:</strong> Since you logged in with OTP, please create a password for your account.
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {isOTPLogin && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                      Create Password
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="Create Password"
                      value={profileData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Minimum 6 characters"
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
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      value={profileData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="Re-enter password"
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
                      required
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Address Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  value={profileData.address.street}
                  onChange={(e) => handleChange('address.street', e.target.value)}
                  placeholder="e.g., House No. 123, Street Name"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Home />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Area / Locality"
                  value={profileData.address.area}
                  onChange={(e) => handleChange('address.area', e.target.value)}
                  placeholder="e.g., Boring Road"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={BIHAR_CITIES}
                  value={profileData.address.city}
                  onChange={(_, newValue) => handleChange('address.city', newValue || 'Patna')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="City"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <LocationOn />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pincode"
                  value={profileData.address.pincode}
                  onChange={(e) => handleChange('address.pincode', e.target.value)}
                  placeholder="800001"
                  inputProps={{ maxLength: 6 }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Landmark (Optional)"
                  value={profileData.address.landmark}
                  onChange={(e) => handleChange('address.landmark', e.target.value)}
                  placeholder="Near..."
                />
              </Grid>
            </Grid>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
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
              {loading ? 'Saving...' : 'Complete Setup & Start Booking 🚀'}
            </Button>
            
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                textAlign: 'center', 
                mt: 2, 
                color: 'text.secondary' 
              }}
            >
              You can update this information anytime from your profile settings
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CustomerProfileSetup;

