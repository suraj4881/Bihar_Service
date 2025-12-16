import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
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
import Logo from '../components/Logo';

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
        console.log('🔄 CustomerDashboard: Syncing language from localStorage:', savedLanguage);
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

  useEffect(() => {
    fetchCustomerStats();
  }, []);

  const fetchCustomerStats = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint
      // Mock data for now
      setStats({
        totalBookings: 12,
        activeBookings: 2,
        completedBookings: 10,
        favoriteProviders: 5,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ bgcolor: '#667eea' }}>
        <Toolbar>
          <Logo size="medium" onClick={() => navigate('/')} />
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 700 }}>
            My Dashboard
          </Typography>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
            <Avatar sx={{ bgcolor: '#764ba2', width: 32, height: 32 }}>
              {user?.name?.charAt(0).toUpperCase() || 'C'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Search Bar */}
        <Card sx={{ mb: 4, p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search for services... (e.g., Plumber, Electrician, AC Repair)"
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
                    sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
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
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
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
                    <List>
                      {[1, 2].map((item) => (
                        <ListItem key={item} sx={{ borderBottom: '1px solid #eee', mb: 1 }}>
                          <ListItemIcon>
                            <Assignment color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Plumbing Service"
                            secondary={
                              <>
                                <Box component="span" sx={{ display: 'block' }}>
                                  Provider: Rajesh Kumar
                                </Box>
                                <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                  Scheduled: Today 2:00 PM
                                </Box>
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <Rating value={4.5} readOnly size="small" />
                                  <Typography variant="caption" sx={{ ml: 1 }}>
                                    4.5 (15 reviews)
                                  </Typography>
                                </Box>
                              </>
                            }
                          />
                          <Chip label="Pending" color="warning" size="small" />
                        </ListItem>
                      ))}
                    </List>
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
                      Popular Services
                    </Typography>
                    <List dense>
                      {['Plumber', 'Electrician', 'AC Repair', 'Carpenter'].map((service) => (
                        <ListItem key={service} button onClick={() => navigate(`/search?q=${service}`)}>
                          <ListItemText primary={service} />
                        </ListItem>
                      ))}
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
                      <TableRow>
                        <TableCell>Plumbing</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Rajesh Kumar
                            </Typography>
                            <Rating value={4.5} readOnly size="small" />
                          </Box>
                        </TableCell>
                        <TableCell>28 Nov, 2:00 PM</TableCell>
                        <TableCell>₹1,500</TableCell>
                        <TableCell>
                          <Chip label="Pending" color="warning" size="small" />
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">View</Button>
                        </TableCell>
                      </TableRow>
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
                <Grid container spacing={2}>
                  {[1, 2, 3].map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: '#667eea', mr: 2 }}>
                              R
                            </Avatar>
                            <Box>
                              <Typography variant="h6">Rajesh Kumar</Typography>
                              <Rating value={4.5} readOnly size="small" />
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            Patna, Bihar
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Plumbing • Electrician
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Button size="small" variant="outlined" sx={{ mr: 1 }}>View</Button>
                            <Button size="small" variant="outlined" color="error">Remove</Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
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
                      <TableRow>
                        <TableCell>Plumbing</TableCell>
                        <TableCell>Rajesh Kumar</TableCell>
                        <TableCell>25 Nov 2024</TableCell>
                        <TableCell>₹1,500</TableCell>
                        <TableCell>
                          <Chip label="Completed" color="success" size="small" />
                        </TableCell>
                        <TableCell>
                          <Rating value={5} readOnly size="small" />
                        </TableCell>
                      </TableRow>
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

