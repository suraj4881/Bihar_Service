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
  alpha,
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import SupportChatFloatingWidget from '../components/SupportChatFloatingWidget';
import { Notification } from '../types';
import { getApiUrl } from '../utils/api';
import {
  sewaHeroBarGradient,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

/** Elapsed time from booking creation (dashboard “timer”). */
const BookingElapsedTimer: React.FC<{ startIso?: string; language: string }> = ({ startIso, language }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startIso) return undefined;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [startIso]);
  if (!startIso) return null;
  const sec = Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
      {language === 'hi' ? 'बुकिंग के बाद से समय: ' : 'Time since booking: '}
      {pad(h)}:{pad(m)}:{pad(s)}
    </Typography>
  );
};

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
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
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

  const fetchCustomerStats = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`bookings/user/${user.id}`), {
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
      const response = await fetch(getApiUrl(`bookings/user/${user?.id}`), {
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
      const response = await fetch(getApiUrl(`favorites/${user?.id}`), {
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
      const response = await fetch(getApiUrl(`notifications/user/${user.id}`), {
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

      const countResponse = await fetch(getApiUrl(`notifications/user/${user.id}/unread-count`), {
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
      await fetch(getApiUrl(`notifications/user/${user.id}/read-all`), {
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
        await fetch(getApiUrl(`notifications/${notification.id}/read`), {
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

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
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

  /** Refresh bookings so customers see a new completion code soon after the provider taps Send OTP. */
  useEffect(() => {
    if (!user?.id) return;
    if (tabValue !== 0 && tabValue !== 1 && tabValue !== 3) return;
    const id = window.setInterval(() => {
      fetchBookings();
    }, 15000);
    return () => clearInterval(id);
  }, [user?.id, tabValue]);

  const hour = new Date().getHours();
  const firstName = user?.name?.trim()?.split(/\s+/)[0] ?? '';
  const greetingEn =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingHi =
    hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या';

  const dashboardHeaderTitle = (
    <Box sx={{ maxWidth: { xs: 'min(56vw, 220px)', sm: 420 } }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          color: 'inherit',
          lineHeight: 1.3,
          fontSize: { xs: '0.78rem', sm: '0.95rem' },
        }}
      >
        {language === 'hi'
          ? `${greetingHi}${firstName ? `, ${firstName}` : ''}`
          : `${greetingEn}${firstName ? `, ${firstName}` : ''}`}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: { xs: 'none', sm: 'block' },
          opacity: 0.92,
          fontWeight: 500,
          mt: 0.25,
        }}
      >
        {language === 'hi'
          ? 'सेवा का भरोसा · आपका सर्विस खाता'
          : 'SewaBihar · Your bookings & services in one place'}
      </Typography>
    </Box>
  );

  const dashboardToolbarActions = (
    <>
      <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error">
        <IconButton color="inherit" onClick={handleNotificationClick} aria-label="Notifications">
          <Notifications />
        </IconButton>
      </Badge>
      <Popover
        open={Boolean(notificationAnchorEl)}
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
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
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 380, overflow: 'auto' }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationItemClick(notification)}
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
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
      <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 0.5 }} aria-label="Account menu">
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
      </IconButton>
      <Menu anchorEl={profileMenuAnchor} open={Boolean(profileMenuAnchor)} onClose={handleProfileMenuClose}>
        <MenuItem
          onClick={() => {
            navigate('/profile');
            handleProfileMenuClose();
          }}
        >
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            logout();
            navigate('/login');
            handleProfileMenuClose();
          }}
        >
          Logout
        </MenuItem>
      </Menu>
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        variant="dashboard"
        position="static"
        title={dashboardHeaderTitle}
        customActions={dashboardToolbarActions}
      />

      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Card
          sx={{
            mb: 4,
            p: { xs: 2.5, md: 4 },
            color: '#fff',
            background: sewaHeroBarGradient,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 16px 48px rgba(0, 77, 64, 0.28)',
            border: '1px solid rgba(255,255,255,0.12)',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 90% 20%, rgba(255,255,255,0.14) 0%, transparent 42%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Grid container spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={7}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.35rem', sm: '2rem' } }}>
                {language === 'hi'
                  ? `वापसी पर स्वागत है${user?.name ? `, ${user.name}` : ''}!`
                  : `Welcome back${user?.name ? `, ${user.name}` : ''}!`}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 560 }}>
                {language === 'hi'
                  ? 'बुकिंग देखें, भरोसेमंद प्रोवाइडर से जुड़ें, और जल्दी मदद पाएँ।'
                  : 'Track bookings, connect with trusted providers, and get help when you need it.'}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="contained"
                onClick={() => navigate('/search')}
                sx={{
                  background: sewaPrimaryButtonGradient,
                  color: '#fff',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 2.5,
                  borderRadius: 999,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  '&:hover': { background: sewaPrimaryButtonHover },
                }}
              >
                {language === 'hi' ? 'सेवाएँ खोजें' : 'Explore services'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/support')}
                sx={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.65)',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 999,
                  '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                {language === 'hi' ? 'मदद' : 'Get help'}
              </Button>
            </Grid>
          </Grid>
        </Card>
        {/* Search */}
        <Card
          elevation={0}
          sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <TextField
            fullWidth
            placeholder={language === 'hi' ? 'सेवाएं खोजें...' : 'Search for services...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 999,
                      px: 2.5,
                      background: sewaPrimaryButtonGradient,
                      '&:hover': { background: sewaPrimaryButtonHover },
                    }}
                  >
                    {language === 'hi' ? 'खोजें' : 'Search'}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Card>

        {/* Stats — teal-accent cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              value: stats.totalBookings,
              label: language === 'hi' ? 'कुल बुकिंग' : 'Total bookings',
              icon: <Assignment sx={{ fontSize: 26 }} />,
              accent: '#00695C',
            },
            {
              value: stats.activeBookings,
              label: language === 'hi' ? 'सक्रिय बुकिंग' : 'Active',
              icon: <Pending sx={{ fontSize: 26 }} />,
              accent: '#00897B',
            },
            {
              value: stats.completedBookings,
              label: language === 'hi' ? 'पूर्ण' : 'Completed',
              icon: <CheckCircle sx={{ fontSize: 26 }} />,
              accent: '#004D40',
            },
            {
              value: stats.favoriteProviders,
              label: language === 'hi' ? 'पसंदीदा प्रोवाइडर' : 'Favorite providers',
              icon: <Star sx={{ fontSize: 26 }} />,
              accent: '#26A69A',
            },
          ].map((row) => (
            <Grid item xs={12} sm={6} md={3} key={row.label}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderLeft: 4,
                  borderLeftColor: row.accent,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                        {loading ? <CircularProgress size={26} /> : row.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {row.label}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: row.accent,
                        bgcolor: alpha(row.accent, 0.12),
                      }}
                    >
                      {row.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper
          sx={{
            mb: 3,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            textColor="primary"
            indicatorColor="primary"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: { xs: 0.5, sm: 1 },
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52 },
            }}
          >
            <Tab icon={<Dashboard />} label={language === 'hi' ? 'अवलोकन' : 'Overview'} iconPosition="start" />
            <Tab icon={<Assignment />} label={language === 'hi' ? 'मेरी बुकिंग' : 'My bookings'} iconPosition="start" />
            <Tab icon={<Star />} label={language === 'hi' ? 'पसंदीदा' : 'Favorites'} iconPosition="start" />
            <Tab icon={<History />} label={language === 'hi' ? 'इतिहास' : 'History'} iconPosition="start" />
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
                                    <BookingElapsedTimer startIso={booking.bookingDate} language={language} />
                                    {booking.serviceCompletionPin &&
                                      booking.status !== 'COMPLETED' &&
                                      booking.status !== 'CANCELLED' && (
                                        <Box sx={{ mt: 0.5 }}>
                                          {booking.completionOtpSentAt && (
                                            <Alert severity="info" sx={{ py: 0.25, mb: 0.5, fontSize: '0.75rem' }}>
                                              {language === 'hi'
                                                ? 'प्रोवाइडर ने नया कोड भेजा है — नीचे दिए अंक बताएँ।'
                                                : 'Your provider sent a new code — read the digits below to them.'}
                                            </Alert>
                                          )}
                                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
                                            {language === 'hi' ? 'पूर्णता कोड: ' : 'Completion code: '}
                                            <Box component="span" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                                              {booking.serviceCompletionPin}
                                            </Box>
                                          </Typography>
                                        </Box>
                                      )}
                                  </>
                                }
                              />
                              <Chip
                                label={getBookingStatusLabel(booking.status)}
                                color={getBookingStatusColor(booking.status)}
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
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        background: sewaPrimaryButtonGradient,
                        '&:hover': { background: sewaPrimaryButtonHover },
                      }}
                    >
                      {language === 'hi' ? 'सेवाएँ खोजें' : 'Search services'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<Settings />}
                      onClick={() => navigate('/profile')}
                      sx={{ mb: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                      {language === 'hi' ? 'प्रोफ़ाइल' : 'Edit profile'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<History />}
                      onClick={() => setTabValue(3)}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                      {language === 'hi' ? 'इतिहास देखें' : 'View history'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<SupportAgent />}
                      onClick={() => navigate('/support')}
                      sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                      {language === 'hi' ? 'सहायता' : 'Help & support'}
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
                        <TableCell>Timer</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookingsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : bookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
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
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {booking.bookingDate ? (
                                <BookingElapsedTimer startIso={booking.bookingDate} language={language} />
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell>
                              {booking.serviceCompletionPin &&
                              booking.status !== 'COMPLETED' &&
                              booking.status !== 'CANCELLED' ? (
                                <Box>
                                  {booking.completionOtpSentAt && (
                                    <Typography variant="caption" color="primary" sx={{ display: 'block', fontWeight: 600 }}>
                                      {language === 'hi' ? 'नया कोड' : 'New code'}
                                    </Typography>
                                  )}
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: 2 }}>
                                    {booking.serviceCompletionPin}
                                  </Typography>
                                </Box>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell>₹{booking.totalAmount || booking.price || 0}</TableCell>
                            <TableCell>
                              <Chip
                                label={getBookingStatusLabel(booking.status)}
                                color={getBookingStatusColor(booking.status)}
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
                              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
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
                                  await fetch(getApiUrl(`favorites/${favorite.id}`), {
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
      <SupportChatFloatingWidget userId={user?.id || ''} userRole="CUSTOMER" userName={user?.name || 'Customer'} />
    </Box>
  );
};

export default CustomerDashboard;

