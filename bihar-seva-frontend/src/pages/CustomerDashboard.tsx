import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CardMedia,
  Rating,
} from '@mui/material';
import {
  Dashboard,
  Search,
  Assignment,
  Favorite,
  Settings,
  Logout,
  Notifications,
  LocationOn,
  Star,
  CheckCircle,
  Pending,
  Cancel,
  History,
  Add,
  Phone,
  Email,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  
  // ✅ Sync language on mount from localStorage (set on HomePage)
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    favoriteProviders: 0,
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const fetchCustomerStats = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/user/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const totalBookings = data.data.length;
          const activeBookings = data.data.filter((b: any) =>
            ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)
          ).length;
          const completedBookings = data.data.filter((b: any) => b.status === 'COMPLETED').length;
          
          setStats((prev) => ({
            ...prev,
            totalBookings,
            activeBookings,
            completedBookings,
          }));
        }
      }
    } catch (error) {
      // Keep default stats (all zeros)
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/user/${user?.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setBookings(data.data);
          const totalBookings = data.data.length;
          const activeBookings = data.data.filter((b: any) =>
            ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)
          ).length;
          const completedBookings = data.data.filter((b: any) => b.status === 'COMPLETED').length;
          setStats((prev) => ({
            ...prev,
            totalBookings,
            activeBookings,
            completedBookings,
          }));
        }
      }
    } catch (error) {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/favorites/${user?.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFavorites(data.data);
          setStats((prev) => ({
            ...prev,
            favoriteProviders: data.data.length || 0,
          }));
        }
      }
    } catch (error) {
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    if (tabValue === 0 || tabValue === 1) {
      fetchBookings();
    } else if (tabValue === 2) {
      fetchFavorites();
    } else if (tabValue === 3) {
      fetchBookings();
    }
  }, [tabValue]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar variant="dashboard" position="static" title="My Dashboard" />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Search Bar */}
        <Card sx={{ mb: 4, p: 2 }}>
          <TextField
            fullWidth
            placeholder={language === 'hi' ? 'सेवाएं खोजें...' : 'Search for services...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}
                  >
                    Search
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Card>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : stats.totalBookings}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Bookings
                    </Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : stats.activeBookings}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Bookings
                    </Typography>
                  </Box>
                  <Pending sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : stats.completedBookings}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Completed
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : stats.favoriteProviders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Favorite Providers
                    </Typography>
                  </Box>
                  <Star sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
            <Tab icon={<Assignment />} label="My Bookings" iconPosition="start" />
            <Tab icon={<Star />} label="Favorites" iconPosition="start" />
            <Tab icon={<History />} label="History" iconPosition="start" />
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Active Bookings
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setTabValue(1)}
                      >
                        View All
                      </Button>
                    </Box>
                    {bookingsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length === 0 ? (
                      <Alert severity="info">No active bookings</Alert>
                    ) : (
                      <List>
                        {bookings
                          .filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')
                          .slice(0, 2)
                          .map((booking) => (
                            <ListItem key={booking.id} sx={{ borderBottom: '1px solid #eee', mb: 1 }}>
                              <ListItemIcon>
                                <Assignment color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={booking.serviceName || booking.service}
                                secondary={
                                  <>
                                    <Box component="span" sx={{ display: 'block' }}>
                                      Provider: {booking.providerName || 'N/A'}
                                    </Box>
                                    <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                      Scheduled: {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleString() : 'Not scheduled'}
                                    </Box>
                                  </>
                                }
                              />
                              <Chip 
                                label={booking.status || 'Pending'} 
                                color={booking.status === 'COMPLETED' ? 'success' : booking.status === 'CANCELLED' ? 'error' : 'warning'} 
                                size="small" 
                              />
                            </ListItem>
                          ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Quick Actions
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Search />}
                      onClick={() => navigate('/search')}
                      sx={{ mb: 2, bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
                    >
                      Search Services
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Settings />}
                      onClick={() => navigate('/profile')}
                      sx={{ mb: 2 }}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<History />}
                      onClick={() => setTabValue(3)}
                    >
                      View History
                    </Button>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Quick Search
                    </Typography>
                    <List dense>
                      <ListItem button onClick={() => navigate('/services')}>
                        <ListItemText primary={language === 'hi' ? 'सभी सेवाएं खोजें' : 'Search All Services'} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* My Bookings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    All Bookings
                  </Typography>
                  <Chip label={`${stats.activeBookings} Active`} color="warning" />
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Provider</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookingsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : bookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No bookings found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>{booking.serviceName || booking.service}</TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {booking.providerName || 'N/A'}
                                </Typography>
                                {booking.providerRating && (
                                  <Rating value={booking.providerRating} readOnly size="small" />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {booking.scheduledDate 
                                ? new Date(booking.scheduledDate).toLocaleString() 
                                : booking.bookingDate 
                                ? new Date(booking.bookingDate).toLocaleString() 
                                : 'N/A'}
                            </TableCell>
                            <TableCell>₹{booking.totalAmount || booking.price || 0}</TableCell>
                            <TableCell>
                              <Chip 
                                label={booking.status || 'Pending'} 
                                color={
                                  booking.status === 'COMPLETED' ? 'success' : 
                                  booking.status === 'CANCELLED' ? 'error' : 
                                  'warning'
                                } 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined" onClick={() => navigate(`/booking/${booking.id}`)}>
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Favorites Tab */}
          <TabPanel value={tabValue} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Favorite Providers
                </Typography>
                {favoritesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : favorites.length === 0 ? (
                  <Alert severity="info">No favorite providers</Alert>
                ) : (
                  <Grid container spacing={2}>
                    {favorites.map((favorite) => (
                      <Grid item xs={12} sm={6} md={4} key={favorite.id || favorite.providerId}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ bgcolor: '#3B82F6', mr: 2 }}>
                                {favorite.providerName?.charAt(0) || 'P'}
                              </Avatar>
                              <Box>
                                <Typography variant="h6">{favorite.providerName || 'Provider'}</Typography>
                                {favorite.rating && (
                                  <Rating value={favorite.rating} readOnly size="small" />
                                )}
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {favorite.city || favorite.location || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {favorite.services?.join(' • ') || favorite.category || 'Service Provider'}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                sx={{ mr: 1 }}
                                onClick={() => navigate(`/provider/${favorite.providerId}`)}
                              >
                                View
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error"
                                onClick={async () => {
                                  const token = localStorage.getItem('token');
                                  await fetch(`http://localhost:8080/api/favorites/${favorite.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                    },
                                  });
                                  fetchFavorites();
                                }}
                              >
                                Remove
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Booking History
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Provider</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rating</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookingsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : bookings.filter(b => b.status === 'COMPLETED').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No completed bookings
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings
                          .filter(b => b.status === 'COMPLETED')
                          .map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>{booking.serviceName || booking.service}</TableCell>
                              <TableCell>{booking.providerName || 'N/A'}</TableCell>
                              <TableCell>
                                {booking.completedDate 
                                  ? new Date(booking.completedDate).toLocaleDateString() 
                                  : booking.bookingDate 
                                  ? new Date(booking.bookingDate).toLocaleDateString() 
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>₹{booking.totalAmount || booking.price || 0}</TableCell>
                              <TableCell>
                                <Chip label="Completed" color="success" size="small" />
                              </TableCell>
                              <TableCell>
                                {booking.customerRating ? (
                                  <Rating value={booking.customerRating} readOnly size="small" />
                                ) : (
                                  <Button size="small" variant="outlined" onClick={() => navigate(`/booking/${booking.id}/review`)}>
                                    Rate
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default CustomerDashboard;

