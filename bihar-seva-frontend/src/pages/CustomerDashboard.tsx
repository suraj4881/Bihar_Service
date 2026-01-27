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
  Badge,
  Popover,
  Divider,
  CardMedia,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
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
  SupportAgent,
  Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import SupportChatFloatingWidget from '../components/SupportChatFloatingWidget';
import { Notification } from '../types';

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

  const getBookingStatusLabel = (status?: string) => {
    if (!status) return 'Pending';
    if (status === 'PAYMENT_PENDING') return 'Payment Pending';
    return status;
  };

  const getBookingStatusColor = (status?: string) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'CANCELLED') return 'error';
    if (status === 'CONFIRMED') return 'info';
    return 'warning';
  };
  
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
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [ratingFeedback, setRatingFeedback] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);

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
            ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)
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
            ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)
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

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setNotificationsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const sortedNotifications = (data.data as Notification[]).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setNotifications(sortedNotifications);
          setUnreadCount(sortedNotifications.filter(n => !n.isRead).length);
        }
      }

      const countResponse = await fetch(`http://localhost:8080/api/notifications/user/${user.id}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (countResponse.ok) {
        const countData = await countResponse.json();
        if (countData.success) {
          setUnreadCount(countData.data || 0);
        }
      }
    } catch (error) {
      // ignore
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await fetch(`http://localhost:8080/api/notifications/user/${user.id}/read-all`, {
        method: 'PUT',
      });
      fetchNotifications();
    } catch (error) {
      // ignore
    }
  };

  const handleNotificationItemClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await fetch(`http://localhost:8080/api/notifications/${notification.id}/read`, {
          method: 'PUT',
        });
      }
      fetchNotifications();
      setTabValue(1);
      handleNotificationClose();
    } catch (error) {
      // ignore
    }
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

  const handleDeleteClick = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete || !user?.id) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingToDelete}?userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh bookings list
        fetchBookings();
        setDeleteDialogOpen(false);
        setBookingToDelete(null);
      } else {
        alert(data.message || 'Failed to delete booking');
      }
    } catch (error) {
      alert('Error deleting booking. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const handleClearHistoryClick = () => {
    setClearHistoryDialogOpen(true);
  };

  const handleClearHistoryConfirm = async () => {
    if (!user?.id) return;
    
    setClearingHistory(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setClearingHistory(false);
        return;
      }
      
      // Delete all cancelled and completed bookings
      const allBookings = bookings.filter(b => 
        b.status === 'CANCELLED' || b.status === 'COMPLETED'
      );
      
      if (allBookings.length === 0) {
        setClearHistoryDialogOpen(false);
        setClearingHistory(false);
        return;
      }
      
      // Delete all bookings in parallel
      const deletePromises = allBookings.map(async (booking) => {
        try {
          const response = await fetch(`http://localhost:8080/api/bookings/${booking.id}?userId=${user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          return response.ok;
        } catch (error) {
          return false;
        }
      });
      
      await Promise.all(deletePromises);
      
      // Refresh bookings and stats
      await fetchBookings();
      await fetchCustomerStats();
      setClearHistoryDialogOpen(false);
    } catch (error) {
      // Error handled silently
    } finally {
      setClearingHistory(false);
    }
  };

  const handleClearHistoryCancel = () => {
    setClearHistoryDialogOpen(false);
  };

  const handleRateClick = (booking: any) => {
    setBookingToRate(booking);
    setRatingValue(booking.customerRating || 0);
    setRatingFeedback(booking.customerFeedback || '');
    setRatingDialogOpen(true);
  };

  const handleRatingCancel = () => {
    setRatingDialogOpen(false);
    setBookingToRate(null);
    setRatingValue(0);
    setRatingFeedback('');
  };

  const handleRatingSubmit = async () => {
    if (!bookingToRate || !ratingValue || ratingValue < 1 || ratingValue > 5) {
      return;
    }

    setSubmittingRating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSubmittingRating(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/bookings/${bookingToRate.id}/rating?rating=${ratingValue}&feedback=${encodeURIComponent(ratingFeedback || '')}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh bookings and stats
        await fetchBookings();
        await fetchCustomerStats();
        handleRatingCancel();
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setSubmittingRating(false);
    }
  };

  useEffect(() => {
    if (tabValue === 0 || tabValue === 1 || tabValue === 3) {
      fetchBookings();
    } else if (tabValue === 2) {
      fetchFavorites();
    }
  }, [tabValue]);

  useEffect(() => {
    fetchCustomerStats();
    fetchNotifications();
  }, [user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Auto-refresh bookings every 15 seconds to reflect provider actions (like completing service)
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      // Only refresh if on bookings-related tabs
      if (tabValue === 0 || tabValue === 1 || tabValue === 3) {
        fetchBookings();
        fetchCustomerStats();
      }
    }, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [user?.id, tabValue]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar variant="dashboard" position="static" title="My Dashboard" />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card
          sx={{
            mb: 4,
            p: { xs: 3, md: 4 },
            color: '#fff',
            background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 45%, #3B82F6 100%)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Welcome back{user?.name ? `, ${user.name}` : ''}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Track bookings, connect with trusted providers, and get help fast.
              </Typography>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
              <Button variant="contained" color="secondary" onClick={() => navigate('/search')} sx={{ bgcolor: '#F97316', '&:hover': { bgcolor: '#EA580C' } }}>
                Explore Services
              </Button>
              <Button variant="outlined" onClick={() => navigate('/support')} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: '#fff' } }}>
                Get Help
              </Button>
            </Grid>
          </Grid>
        </Card>
        {/* Search Bar */}
        <Card sx={{ mb: 4, p: 2.5, border: '1px solid', borderColor: 'divider' }}>
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
                  <Button variant="contained" onClick={handleSearch}>
                    Search
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error">
            <IconButton color="primary" onClick={handleNotificationClick}>
              <Notifications />
            </IconButton>
          </Badge>
          <Popover
            open={Boolean(notificationAnchorEl)}
            anchorEl={notificationAnchorEl}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                width: 360,
                maxHeight: 480,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Notifications</Typography>
                {unreadCount > 0 && (
                  <Button size="small" onClick={handleMarkAllAsRead}>
                    Mark all read
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 1 }} />
              {notificationsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="body2" color="text.secondary">No notifications</Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 380, overflow: 'auto' }}>
                  {notifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        button
                        onClick={() => handleNotificationItemClick(notification)}
                        sx={{
                          bgcolor: notification.isRead ? 'transparent' : '#e3f2fd',
                          borderRadius: 1,
                          mb: 0.5,
                        }}
                      >
                        <ListItemIcon>
                          {notification.type === 'BOOKING' && <Assignment />}
                          {notification.type === 'REVIEW' && <Star />}
                          {!notification.type && <Notifications />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 700 }}>
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Popover>
        </Box>

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
                          .filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED')
                          .sort((a, b) => {
                            // Show COMPLETED first, then others
                            if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return -1;
                            if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return 1;
                            return 0;
                          })
                          .slice(0, 2)
                          .map((booking) => (
                            <ListItem 
                              key={booking.id} 
                              sx={{ 
                                borderBottom: '1px solid #eee', 
                                mb: 1,
                                bgcolor: booking.status === 'COMPLETED' ? '#F0FDF4' : 'transparent',
                                borderRadius: booking.status === 'COMPLETED' ? 2 : 0,
                                p: booking.status === 'COMPLETED' ? 1 : 0,
                              }}
                            >
                              <ListItemIcon>
                                {booking.status === 'COMPLETED' ? (
                                  <CheckCircle color="success" />
                                ) : (
                                  <Assignment color="primary" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {booking.serviceName || booking.service}
                                    </Typography>
                                    {booking.status === 'COMPLETED' && (
                                      <Chip 
                                        label="Completed" 
                                        color="success" 
                                        size="small" 
                                        icon={<CheckCircle />}
                                        sx={{ fontWeight: 700 }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <>
                                    <Box component="span" sx={{ display: 'block' }}>
                                      Provider: {booking.providerName || 'N/A'}
                                    </Box>
                                    <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                      {booking.status === 'COMPLETED' && booking.completedDate ? (
                                        <>Completed: {new Date(booking.completedDate).toLocaleString()}</>
                                      ) : (
                                        <>Scheduled: {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleString() : 'Not scheduled'}</>
                                      )}
                                    </Box>
                                  </>
                                }
                              />
                              {booking.status !== 'COMPLETED' && (
                                <Chip
                                  label={getBookingStatusLabel(booking.status)}
                                  color={getBookingStatusColor(booking.status)}
                                  size="small"
                                />
                              )}
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
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<SupportAgent />}
                      onClick={() => navigate('/support')}
                      sx={{ mt: 2 }}
                    >
                      Help & Support
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
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Recent Bookings
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Showing recent 5 orders
                    </Typography>
                  </Box>
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
                        <TableCell>Delete</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookingsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : bookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No bookings found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings
                          .sort((a, b) => {
                            const dateA = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
                            const dateB = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
                            return dateB - dateA; // Most recent first
                          })
                          .slice(0, 5) // Show only recent 5 orders
                          .map((booking) => (
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={getBookingStatusLabel(booking.status)}
                                    color={getBookingStatusColor(booking.status)}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                  />
                                  {booking.status === 'COMPLETED' && (
                                    <CheckCircle sx={{ color: '#10B981', fontSize: 18 }} />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="outlined" onClick={() => navigate(`/booking/${booking.id}`)}>
                                  View
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Tooltip title={booking.status === 'CANCELLED' || booking.status === 'COMPLETED' ? "Delete Booking" : "Can only delete cancelled or completed bookings"}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteClick(booking.id)}
                                      disabled={booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'}
                                      sx={{ 
                                        opacity: (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') ? 1 : 0.3,
                                        cursor: (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') ? 'pointer' : 'not-allowed'
                                      }}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Booking History
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Delete />}
                    onClick={handleClearHistoryClick}
                    disabled={bookings.filter(b => b.status === 'CANCELLED' || b.status === 'COMPLETED').length === 0}
                  >
                    Clear History
                  </Button>
                </Box>
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
                        <TableCell>Delete</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookingsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No booking history found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings
                          .filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED')
                          .sort((a, b) => {
                            const dateA = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
                            const dateB = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
                            return dateB - dateA; // Most recent first
                          })
                          .map((booking) => (
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
                                {booking.completedDate 
                                  ? new Date(booking.completedDate).toLocaleString() 
                                  : booking.scheduledDate
                                  ? new Date(booking.scheduledDate).toLocaleString()
                                  : booking.bookingDate 
                                  ? new Date(booking.bookingDate).toLocaleString() 
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>₹{booking.totalAmount || booking.price || 0}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={getBookingStatusLabel(booking.status)}
                                    color={getBookingStatusColor(booking.status)}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                  />
                                  {booking.status === 'COMPLETED' && (
                                    <CheckCircle sx={{ color: '#10B981', fontSize: 18 }} />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {booking.customerRating ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Rating value={booking.customerRating} readOnly size="small" />
                                    {booking.customerFeedback && (
                                      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {booking.customerFeedback}
                                      </Typography>
                                    )}
                                  </Box>
                                ) : booking.status === 'COMPLETED' ? (
                                  <Button 
                                    size="small" 
                                    variant="outlined" 
                                    color="primary"
                                    startIcon={<Star />}
                                    onClick={() => handleRateClick(booking)}
                                  >
                                    Rate
                                  </Button>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Tooltip title={booking.status === 'CANCELLED' || booking.status === 'COMPLETED' ? "Delete Booking" : "Can only delete cancelled or completed bookings"}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteClick(booking.id)}
                                      disabled={booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'}
                                      sx={{ 
                                        opacity: (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') ? 1 : 0.3,
                                        cursor: (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') ? 'pointer' : 'not-allowed'
                                      }}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 700, color: '#DC2626' }}>
          Delete Booking
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear History Confirmation Dialog */}
      <Dialog
        open={clearHistoryDialogOpen}
        onClose={handleClearHistoryCancel}
        aria-labelledby="clear-history-dialog-title"
        aria-describedby="clear-history-dialog-description"
      >
        <DialogTitle id="clear-history-dialog-title" sx={{ fontWeight: 700, color: '#DC2626' }}>
          Clear Booking History
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-history-dialog-description">
            Are you sure you want to delete all cancelled and completed bookings from your history? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearHistoryCancel} disabled={clearingHistory}>
            Cancel
          </Button>
          <Button
            onClick={handleClearHistoryConfirm}
            color="error"
            variant="contained"
            disabled={clearingHistory}
            startIcon={clearingHistory ? <CircularProgress size={20} /> : <Delete />}
          >
            {clearingHistory ? 'Clearing...' : 'Clear All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog
        open={ratingDialogOpen}
        onClose={handleRatingCancel}
        aria-labelledby="rating-dialog-title"
        aria-describedby="rating-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="rating-dialog-title" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star sx={{ color: '#FFB800', fontSize: 28 }} />
          Rate Your Service
        </DialogTitle>
        <DialogContent>
          {bookingToRate && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Service: <strong>{bookingToRate.serviceName || bookingToRate.service}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Provider: <strong>{bookingToRate.providerName || 'N/A'}</strong>
              </Typography>
            </Box>
          )}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
              How would you rate this service?
            </Typography>
            <Rating
              value={ratingValue}
              onChange={(event, newValue) => {
                if (newValue !== null) {
                  setRatingValue(newValue);
                }
              }}
              size="large"
              sx={{ fontSize: '2.5rem' }}
            />
            {ratingValue > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {ratingValue === 5 && 'Excellent!'}
                {ratingValue === 4 && 'Very Good!'}
                {ratingValue === 3 && 'Good!'}
                {ratingValue === 2 && 'Fair'}
                {ratingValue === 1 && 'Poor'}
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Share your feedback (optional)"
            placeholder="Tell us about your experience..."
            value={ratingFeedback}
            onChange={(e) => setRatingFeedback(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleRatingCancel} 
            disabled={submittingRating}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRatingSubmit}
            variant="contained"
            color="primary"
            disabled={submittingRating || ratingValue < 1 || ratingValue > 5}
            startIcon={submittingRating ? <CircularProgress size={20} /> : <Star />}
            sx={{ minWidth: 150, fontWeight: 600 }}
          >
            {submittingRating ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>

      <SupportChatFloatingWidget userId={user?.id || ''} userRole="CUSTOMER" userName={user?.name || 'Customer'} />
    </Box>
  );
};

export default CustomerDashboard;

