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
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
} from '@mui/material';
import {
  AttachMoney,
  Description,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';

const ProviderProfileSetup: React.FC = () => {
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
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [profileData, setProfileData] = useState({
    // Step 1: Service Details
    serviceCategory: '',
    skills: [] as string[],
    experience: '',
    biography: '',
    
    // Step 2: Pricing & Availability
    hourlyRate: '',
    minimumCharge: '',
    serviceRadius: '',
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    workingHours: {
      start: '09:00',
      end: '18:00',
    },
  });

  const serviceCategories = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Carpentry',
    'AC Repair',
    'Painting',
    'Appliance Repair',
    'Other Services',
  ];

  const steps = ['Service Details', 'Pricing & Availability', 'Review & Submit'];

  const handleChange = (field: string, value: any) => {
    setProfileData({ ...profileData, [field]: value });
    setError('');
  };

  const handleNext = () => {
    // Validation for Step 1
    if (activeStep === 0) {
      if (!profileData.serviceCategory || !profileData.experience || !profileData.biography) {
        setError('Please fill all required fields');
        return;
      }
    }
    
    // Validation for Step 2
    if (activeStep === 1) {
      if (!profileData.hourlyRate || !profileData.minimumCharge) {
        setError('Please fill all pricing fields');
        return;
      }
    }
    
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/providers/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          ...profileData,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update user role/status
        navigate('/kyc'); // Redirect to KYC verification
      } else {
        setError(data.message || 'Profile setup failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Service Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Service Category"
                value={profileData.serviceCategory}
                onChange={(e) => handleChange('serviceCategory', e.target.value)}
                required
              >
                {serviceCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Years of Experience"
                type="number"
                value={profileData.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Schedule />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Biography / About Your Service"
                value={profileData.biography}
                onChange={(e) => handleChange('biography', e.target.value)}
                placeholder="Tell customers about your expertise, certifications, and what makes you unique..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Pricing & Availability
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Rate (₹)"
                type="number"
                value={profileData.hourlyRate}
                onChange={(e) => handleChange('hourlyRate', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Charge (₹)"
                type="number"
                value={profileData.minimumCharge}
                onChange={(e) => handleChange('minimumCharge', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Radius (km)"
                type="number"
                value={profileData.serviceRadius}
                onChange={(e) => handleChange('serviceRadius', e.target.value)}
                placeholder="How far are you willing to travel?"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Working Hours
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Start Time"
                    value={profileData.workingHours.start}
                    onChange={(e) => handleChange('workingHours', {
                      ...profileData.workingHours,
                      start: e.target.value,
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="End Time"
                    value={profileData.workingHours.end}
                    onChange={(e) => handleChange('workingHours', {
                      ...profileData.workingHours,
                      end: e.target.value,
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Available Days
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.keys(profileData.availability).map((day) => (
                  <Chip
                    key={day}
                    label={day.charAt(0).toUpperCase() + day.slice(1)}
                    onClick={() => handleChange('availability', {
                      ...profileData.availability,
                      [day]: !profileData.availability[day as keyof typeof profileData.availability],
                    })}
                    color={profileData.availability[day as keyof typeof profileData.availability] ? 'primary' : 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Review Your Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Service Category</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {profileData.serviceCategory}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Experience</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {profileData.experience} years
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Hourly Rate</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ₹{profileData.hourlyRate}/hour
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Minimum Charge</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ₹{profileData.minimumCharge}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Biography</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {profileData.biography}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <AppBar variant="simple" position="sticky" showBackButton />
      <Container maxWidth="md">
        <Card
          sx={{
            mb: 3,
            p: { xs: 3, md: 4 },
            color: '#fff',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Complete Provider Profile
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Add service details and pricing to get verified faster.
          </Typography>
        </Card>
        <Card elevation={10} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
              Complete Your Provider Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
              Just a few more steps to start offering your services
            </Typography>
            
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            
            {renderStepContent()}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ textTransform: 'none' }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{
                    bgcolor: '#667eea',
                    '&:hover': { bgcolor: '#764ba2' },
                    px: 4,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Submitting...' : 'Complete Setup'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    bgcolor: '#667eea',
                    '&:hover': { bgcolor: '#764ba2' },
                    px: 4,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ProviderProfileSetup;

