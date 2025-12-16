import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Verified,
  Speed,
  Security,
  SupportAgent,
  Groups,
  TrendingUp,
  EmojiEvents,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';

const AboutPage: React.FC = () => {
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

  const features = [
    {
      icon: <Verified sx={{ fontSize: 48, color: '#4CAF50' }} />,
      title: 'Verified Professionals',
      description: 'All service providers are background-verified and certified',
    },
    {
      icon: <Speed sx={{ fontSize: 48, color: '#2196F3' }} />,
      title: 'Quick Service',
      description: 'Get services scheduled within hours, not days',
    },
    {
      icon: <Security sx={{ fontSize: 48, color: '#FF9800' }} />,
      title: 'Secure Payments',
      description: 'Safe and secure payment options with full transparency',
    },
    {
      icon: <SupportAgent sx={{ fontSize: 48, color: '#9C27B0' }} />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your queries',
    },
  ];

  const stats = [
    { icon: <Groups />, number: '500+', label: 'Verified Providers' },
    { icon: <TrendingUp />, number: '5000+', label: 'Services Completed' },
    { icon: <EmojiEvents />, number: '4.8', label: 'Average Rating' },
  ];

  const team = [
    { name: 'Raj Kumar', role: 'Founder & CEO', avatar: '👨‍💼' },
    { name: 'Priya Singh', role: 'CTO', avatar: '👩‍💻' },
    { name: 'Amit Sharma', role: 'Head of Operations', avatar: '👨‍🔧' },
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" align="center" gutterBottom sx={{ fontWeight: 800 }}>
            About BiharSeva
          </Typography>
          <Typography variant="h6" align="center" sx={{ opacity: 0.95, maxWidth: '800px', mx: 'auto' }}>
            Bihar's Most Trusted Home Service Platform
            <br />
            Connecting You with Verified Professionals
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Mission */}
        <Card sx={{ mb: 6, p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#FF6B35' }}>
            Our Mission
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            At BiharSeva, we are on a mission to revolutionize the home services industry in Bihar. We believe that
            finding reliable, skilled professionals for your home shouldn't be a hassle. Our platform connects
            homeowners with verified service providers, ensuring quality, transparency, and trust in every interaction.
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            We are committed to empowering local service professionals by providing them with a platform to showcase
            their skills, grow their business, and serve their community better.
          </Typography>
        </Card>

        {/* Features */}
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          Why Choose BiharSeva?
        </Typography>
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Stats */}
        <Paper
          sx={{
            p: 4,
            mb: 8,
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
            color: 'white',
          }}
        >
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ fontSize: '3rem', mb: 1 }}>{stat.icon}</Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    {stat.number}
                  </Typography>
                  <Typography variant="h6">{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Team */}
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          Meet Our Team
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {team.map((member, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: 3,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 6,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '4rem',
                    bgcolor: '#FF6B35',
                  }}
                >
                  {member.avatar}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {member.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {member.role}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Vision */}
        <Card sx={{ mt: 8, p: 4, bgcolor: '#F5F5F5' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#FF6B35' }}>
            Our Vision
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            We envision a Bihar where every household has instant access to reliable, affordable, and quality home
            services. A platform where skilled professionals thrive, customers are delighted, and the community grows
            together. BiharSeva is more than a service platform – it's a movement to digitize and organize the
            unorganized service sector, bringing dignity and prosperity to local service professionals.
          </Typography>
        </Card>
      </Container>
    </Box>
  );
};

export default AboutPage;

