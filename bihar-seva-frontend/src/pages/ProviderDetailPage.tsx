import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
} from '@mui/material';
import {
  ArrowBack,
  Phone,
  Chat,
  LocationOn,
  Verified,
  Star,
  WorkOutline,
  Schedule,
  Language,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import StatusBadge from '../components/StatusBadge';

interface Provider {
  id: string;
  name: string;
  skill: string;
  rating: number;
  totalReviews: number;
  city: string;
  price: number;
  isVerified: boolean;
  profilePhoto?: string;
  experience: number;
  about?: string;
  services?: string[];
  workingHours?: string;
  languages?: string[];
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

const ProviderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { language, setLanguage, t } = useLanguage();
  
  // ✅ Sync language on mount from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchProviderDetails();
  }, [id]);

  const fetchProviderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/providers/${id}`);
      const data = await response.json();
      if (data.success) {
        setProvider(data.data);
      }
    } catch (error) {
      console.error('Error fetching provider:', error);
      // Mock data
      setProvider(mockProvider);
      setReviews(mockReviews);
    } finally {
      setLoading(false);
    }
  };

  const mockProvider: Provider = {
    id: '1',
    name: 'Raj Kumar Sharma',
    skill: 'Plumbing',
    rating: 4.8,
    totalReviews: 156,
    city: 'Patna',
    price: 650,
    isVerified: true,
    experience: 5,
    about:
      'Expert plumber with 5+ years of experience in residential and commercial plumbing. Specialized in pipe repairs, fixture installations, and bathroom fittings. Committed to providing quality service with customer satisfaction.',
    services: [
      'Pipe repair & replacement',
      'Tap & fixture installation',
      'Bathroom & kitchen fittings',
      'Water heater installation',
      'Drainage cleaning',
      'Emergency plumbing services',
    ],
    workingHours: '9:00 AM - 6:00 PM (Mon-Sat)',
    languages: ['Hindi', 'English'],
  };

  const mockReviews: Review[] = [
    {
      id: '1',
      customerName: 'Rohit Kumar',
      rating: 5,
      comment:
        'Excellent service! Very professional and completed the work on time. Highly recommended.',
      date: '2 days ago',
      helpful: 24,
    },
    {
      id: '2',
      customerName: 'Priya Singh',
      rating: 4,
      comment:
        'Good work, came on time and fixed the leak quickly. Could improve communication.',
      date: '1 week ago',
      helpful: 12,
    },
    {
      id: '3',
      customerName: 'Amit Verma',
      rating: 5,
      comment:
        'Best plumber I have found in Patna. Very skilled and reasonable pricing.',
      date: '2 weeks ago',
      helpful: 18,
    },
  ];

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!provider) {
    return <Typography>Provider not found</Typography>;
  }

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Logo size="small" showText onClick={() => navigate('/')} />
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Provider Info Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 88 }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    src={provider.profilePhoto}
                    sx={{
                      width: 150,
                      height: 150,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: '#FF6B35',
                      fontSize: '3rem',
                    }}
                  >
                    {provider.name[0]}
                  </Avatar>
                  <Typography variant="h5" gutterBottom>
                    {provider.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {provider.skill}
                  </Typography>
                  {provider.isVerified && (
                    <StatusBadge status="verified" sx={{ mb: 2 }} />
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                    <Rating value={provider.rating} precision={0.1} readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {provider.rating}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {provider.totalReviews} reviews
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText primary={provider.city} secondary="Location" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WorkOutline />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${provider.experience} years`}
                      secondary="Experience"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary={provider.workingHours}
                      secondary="Working Hours"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Language />
                    </ListItemIcon>
                    <ListItemText
                      primary={provider.languages?.join(', ')}
                      secondary="Languages"
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" color="primary" align="center" gutterBottom>
                  ₹{provider.price}+ per visit
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigate(`/booking/${provider.id}`)}
                  sx={{
                    mb: 1,
                    bgcolor: '#FF6B35',
                    '&:hover': { bgcolor: '#E64A19' },
                  }}
                >
                  Book Service
                </Button>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Phone />}
                      href={`tel:+919876543210`}
                    >
                      Call
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button fullWidth variant="outlined" startIcon={<Chat />}>
                      Chat
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="About" />
                <Tab label="Services" />
                <Tab label={`Reviews (${provider.totalReviews})`} />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* About Tab */}
                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      About Me
                    </Typography>
                    <Typography paragraph>{provider.about}</Typography>
                  </Box>
                )}

                {/* Services Tab */}
                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Services Offered
                    </Typography>
                    <List>
                      {provider.services?.map((service, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={service} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Reviews Tab */}
                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Customer Reviews
                    </Typography>

                    {/* Rating Summary */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#F5F5F5' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <Typography variant="h2">{provider.rating}</Typography>
                        </Grid>
                        <Grid item>
                          <Rating value={provider.rating} precision={0.1} readOnly />
                          <Typography variant="body2" color="text.secondary">
                            Based on {provider.totalReviews} reviews
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Reviews List */}
                    {reviews.map((review) => (
                      <Paper key={review.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {review.customerName}
                            </Typography>
                            <Rating value={review.rating} size="small" readOnly />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {review.date}
                          </Typography>
                        </Box>
                        <Typography paragraph>{review.comment}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button size="small" startIcon={<Star />}>
                            Helpful ({review.helpful})
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProviderDetailPage;

