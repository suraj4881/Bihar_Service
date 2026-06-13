import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Paper,
  useTheme,
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
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import { sewaHeroBarGradient, sewaAccentPanelGradient } from '../theme/sewaDesign';

const AboutPage: React.FC = () => {
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

  const features = [
    {
      icon: <Verified sx={{ fontSize: 48, color: pc }} />,
      title: 'Verified Professionals',
      description: 'All service providers are background-verified and certified',
    },
    {
      icon: <Speed sx={{ fontSize: 48, color: pc }} />,
      title: 'Quick Service',
      description: 'Get services scheduled within hours, not days',
    },
    {
      icon: <Security sx={{ fontSize: 48, color: pc }} />,
      title: 'Secure Payments',
      description: 'Safe and secure payment options with full transparency',
    },
    {
      icon: <SupportAgent sx={{ fontSize: 48, color: pc }} />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your queries',
    },
  ];

  const stats = [
    { icon: <Groups />, number: '500+', label: 'Verified Providers' },
    { icon: <TrendingUp />, number: '5000+', label: 'Services Completed' },
    { icon: <EmojiEvents />, number: '4.8', label: 'Average Rating' },
  ];

  const team = [{ name: 'Suraj Kumar', role: 'CEO', avatar: '👨‍💼' }];

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
            About SewaBihar
          </Typography>
          <Typography
            variant="h6"
            align="center"
            sx={{ opacity: 0.95, maxWidth: '800px', mx: 'auto', fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            Bihar&apos;s trusted home services platform
            <br />
            Connecting you with verified professionals
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, sm: 3 } }}>
        {/* Mission */}
        <Card sx={{ mb: 6, p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            Our Mission
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            At SewaBihar, we are on a mission to revolutionize the home services industry in Bihar. We believe that
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
          Why choose SewaBihar?
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
            p: { xs: 3, md: 4 },
            mb: 8,
            borderRadius: 3,
            background: sewaAccentPanelGradient,
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
            <Grid item xs={12} sm={8} md={5} lg={4} key={index} sx={{ maxWidth: 420, mx: 'auto' }}>
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
                    bgcolor: 'primary.main',
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
        <Card sx={{ mt: 8, p: 4, bgcolor: 'background.paper' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            Our Vision
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            We envision a Bihar where every household has instant access to reliable, affordable, and quality home
            services. A platform where skilled professionals thrive, customers are delighted, and the community grows
            together. SewaBihar is more than a service platform — it&apos;s a movement to digitize and organize the
            unorganized service sector, bringing dignity and prosperity to local service professionals.
          </Typography>
        </Card>
      </Container>
    </Box>
  );
};

export default AboutPage;

