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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  People,
  VerifiedUser,
  Block,
  CheckCircle,
  Cancel,
  Assessment,
  Settings,
  Logout,
  Notifications,
  TrendingUp,
  AccountBalanceWallet,
  Assignment,
  Security,
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

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  
  // ✅ Sync language on mount from localStorage (set on HomePage)
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        console.log('🔄 AdminDashboard: Syncing language from localStorage:', savedLanguage);
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalCustomers: 0,
    pendingKYC: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeServices: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ bgcolor: '#667eea' }}>
        <Toolbar>
          <Logo size="medium" onClick={() => navigate('/')} />
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
            <Avatar sx={{ bgcolor: '#764ba2', width: 32, height: 32 }}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Users
                    </Typography>
                  </Box>
                  <People sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : stats.totalProviders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Providers
                    </Typography>
                  </Box>
                  <VerifiedUser sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : stats.pendingKYC}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Pending KYC
                    </Typography>
                  </Box>
                  <Security sx={{ fontSize: 40, opacity: 0.8 }} />
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
                      ₹{loading ? '...' : stats.totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Revenue
                    </Typography>
                  </Box>
                  <AccountBalanceWallet sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
            <Tab icon={<People />} label="Users" iconPosition="start" />
            <Tab icon={<Security />} label="KYC Verification" iconPosition="start" />
            <Tab icon={<Assignment />} label="Services" iconPosition="start" />
            <Tab icon={<Assessment />} label="Analytics" iconPosition="start" />
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Recent Activity
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <CheckCircle sx={{ color: '#4caf50', mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            New Provider Registered
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            2 hours ago
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Security sx={{ color: '#ff9800', mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            KYC Verification Pending
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            5 pending requests
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<People />}
                          onClick={() => setTabValue(1)}
                          sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
                        >
                          Manage Users
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Security />}
                          onClick={() => setTabValue(2)}
                          sx={{ bgcolor: '#f5576c', '&:hover': { bgcolor: '#e0485c' } }}
                        >
                          Review KYC
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Assessment />}
                          onClick={() => setTabValue(4)}
                        >
                          View Analytics
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Settings />}
                          onClick={() => navigate('/admin/settings')}
                        >
                          Settings
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Users Tab */}
          <TabPanel value={tabValue} index={1}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  All Users
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Verified</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Loading...</TableCell>
                        <TableCell colSpan={5} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* KYC Tab */}
          <TabPanel value={tabValue} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  KYC Verification Requests
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {stats.pendingKYC} KYC verification requests pending review
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<Security />}
                  onClick={() => navigate('/kyc')}
                  sx={{ bgcolor: '#667eea' }}
                >
                  Review All KYC Requests
                </Button>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Services Tab */}
          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Service Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage all services, approve/reject provider services, and monitor service quality.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Revenue Overview
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                      ₹{stats.totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total platform revenue
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      User Growth
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total registered users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
