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
  IconButton,
  Paper,
  Alert,
  InputAdornment,
  useTheme,
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
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import { sewaHeroBarGradient } from '../theme/sewaDesign';

const ContactPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const theme = useTheme();
  const pc = theme.palette.primary.main;
  
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
      icon: <Phone sx={{ fontSize: 40, color: pc }} />,
      title: 'Phone',
      details: ['+91 98765 43210', '+91 98765 43211'],
      action: 'Call Us',
    },
    {
      icon: <Email sx={{ fontSize: 40, color: pc }} />,
      title: 'Email',
      details: ['support@sewabihar.com', 'info@sewabihar.com'],
      action: 'Email Us',
    },
    {
      icon: <LocationOn sx={{ fontSize: 40, color: pc }} />,
      title: 'Office',
      details: ['123, Fraser Road', 'Patna, Bihar - 800001'],
      action: 'Get Directions',
    },
    {
      icon: <AccessTime sx={{ fontSize: 40, color: pc }} />,
      title: 'Working Hours',
      details: ['Monday - Saturday: 9 AM - 6 PM', 'Sunday: Closed'],
      action: null,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <AppBar variant="default" position="sticky" showNavLinks={true} showAuthButtons={true} />

      {/* Hero Section */}
      <Box
        sx={{
          background: sewaHeroBarGradient,
          color: 'white',
          py: { xs: 6, md: 8 },
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            sx={{ display: 'block', textAlign: 'center', letterSpacing: 4, opacity: 0.9, mb: 1 }}
          >
            SEWABIHAR
          </Typography>
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.5rem' } }}
          >
            Contact us
          </Typography>
          <Typography
            variant="h6"
            align="center"
            sx={{ opacity: 0.95, maxWidth: '800px', mx: 'auto', fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            Have questions? We&apos;re here to help.
            <br />
            Reach our support team
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={4}>
          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
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
                              color: 'primary.main',
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
            <Paper elevation={2} sx={{ mt: 3, p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(15, 23, 42, 0.06)',
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
                Yes. All service providers on SewaBihar go through background verification and certification.
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

