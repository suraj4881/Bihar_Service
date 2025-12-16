import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  Send,
  Person,
  Message,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';

const ContactPage: React.FC = () => {
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSuccess('Thank you! We will get back to you within 24 hours.');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  const contactInfo = [
    {
      icon: <Phone sx={{ fontSize: 40, color: '#FF6B35' }} />,
      title: 'Phone',
      details: ['+91 98765 43210', '+91 98765 43211'],
      action: 'Call Us',
    },
    {
      icon: <Email sx={{ fontSize: 40, color: '#2196F3' }} />,
      title: 'Email',
      details: ['support@biharseva.com', 'info@biharseva.com'],
      action: 'Email Us',
    },
    {
      icon: <LocationOn sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: 'Office',
      details: ['123, Fraser Road', 'Patna, Bihar - 800001'],
      action: 'Get Directions',
    },
    {
      icon: <AccessTime sx={{ fontSize: 40, color: '#9C27B0' }} />,
      title: 'Working Hours',
      details: ['Monday - Saturday: 9 AM - 6 PM', 'Sunday: Closed'],
      action: null,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA' }}>
      {/* Navigation */}
      <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Logo size="small" showText onClick={() => navigate('/')} />
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" align="center" gutterBottom sx={{ fontWeight: 800 }}>
            Contact Us
          </Typography>
          <Typography variant="h6" align="center" sx={{ opacity: 0.95, maxWidth: '800px', mx: 'auto' }}>
            Have questions? We're here to help!
            <br />
            Get in touch with our support team
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Send us a Message
                </Typography>

                {success && (
                  <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                    {success}
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone (Optional)"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      multiline
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      placeholder="Tell us how we can help you..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                            <Message color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={loading}
                      startIcon={<Send />}
                      sx={{
                        py: 1.5,
                        bgcolor: '#FF6B35',
                        '&:hover': { bgcolor: '#E64A19' },
                        fontWeight: 600,
                      }}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={5}>
            <Grid container spacing={3}>
              {contactInfo.map((info, index) => (
                <Grid item xs={12} key={index}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      transition: 'transform 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box>{info.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {info.title}
                        </Typography>
                        {info.details.map((detail, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {detail}
                          </Typography>
                        ))}
                        {info.action && (
                          <Button
                            size="small"
                            sx={{
                              mt: 1,
                              color: '#FF6B35',
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            {info.action} →
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Map Placeholder */}
            <Paper elevation={2} sx={{ mt: 3, p: 3, textAlign: 'center', bgcolor: '#F5F5F5' }}>
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#E0E0E0',
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  🗺️ Map View
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Visit our office at Fraser Road, Patna
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* FAQ Section */}
        <Card sx={{ mt: 6, p: 4, bgcolor: '#F5F5F5' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Frequently Asked Questions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                How do I book a service?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Simply search for the service you need, select a provider, choose your preferred time slot, and confirm
                your booking. It's that easy!
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Are all providers verified?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Yes! All service providers on BiharSeva go through a rigorous background verification and certification
                process.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                What if I'm not satisfied with the service?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                We have a 100% satisfaction guarantee. If you're not happy with the service, contact our support team
                within 24 hours.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                How can I become a service provider?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Click on "Join as Provider" on our homepage, complete the registration process, upload your documents,
                and start receiving bookings!
              </Typography>
            </Grid>
          </Grid>
        </Card>
      </Container>
    </Box>
  );
};

export default ContactPage;

