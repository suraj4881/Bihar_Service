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
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Popover,
  Divider,
  Tooltip,
  AppBar as MuiAppBar,
  Toolbar,
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  AccountBalanceWallet,
  Add,
  Logout,
  Notifications,
  CheckCircle,
  Pending,
  Cancel,
  Star,
  Edit,
  Security,
  VerifiedUser,
  Warning,
  CalendarToday,
  Person,
  LocationOn,
  BusinessCenter,
  Schedule,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/helpers';
import { Notification } from '../types';
import Logo from '../components/Logo';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface KYCStatus {
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | null;
  verifiedAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, provider, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<KYCStatus>({ status: null });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return phone;
    return `${digits.slice(0, 2)}XXXX${digits.slice(-2)}`;
  };
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const providerId = user?.id || provider?.id;

  useEffect(() => {
    fetchProviderStats();
    fetchKYCStatus();
    fetchNotifications();
    fetchServices();
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  useEffect(() => {
    if (tabValue === 1) {
      fetchBookings();
    }
  }, [tabValue]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (providerId) {
        fetchNotifications();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [providerId]);

  // ✅ CRITICAL: Force language sync IMMEDIATELY on mount (before any render)
  // This ensures language is set before component renders translations
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Force read from localStorage IMMEDIATELY (priority: localStorage > user profile > default)
    const savedLanguage = localStorage.getItem('language');
    
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      // Priority 1: localStorage (set from HomePage)
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
      } else {
      }
    } else if (user?.language) {
      // Priority 2: User profile
      const userLang = user.language.toLowerCase();
      const langPreference = (userLang === 'hindi' || userLang === 'hi') ? 'hi' : 'en';
      if (langPreference !== language) {
        setLanguage(langPreference);
        localStorage.setItem('language', langPreference);
      }
    } else {
      // Priority 3: Default to English
      if (language !== 'en') {
        setLanguage('en');
        localStorage.setItem('language', 'en');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run IMMEDIATELY on mount - empty deps to run once
  
  // ✅ Also sync when language changes in localStorage (from other tabs/pages)
  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage === 'hi' || savedLanguage === 'en') {
        if (savedLanguage !== language) {
          setLanguage(savedLanguage as 'en' | 'hi');
        }
      }
    };
    
    // Check immediately
    handleLanguageChange();
    
    // Listen for storage events
    window.addEventListener('storage', handleLanguageChange);
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
    };
  }, [language, setLanguage]);

  const fetchKYCStatus = async () => {
    if (!providerId) {
      setKycLoading(false);
      return;
    }

    setKycLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:8080/api/kyc/status/${providerId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.data) {
        const statusData = data.data;
        setKycStatus({
          status: statusData.status || null,
          verifiedAt: statusData.verifiedAt,
          rejectionReason: statusData.rejectionReason,
          submittedAt: statusData.submittedAt,
        });
      } else {
        setKycStatus({ status: null });
      }
    } catch (error) {
      setKycStatus({ status: null });
    } finally {
      setKycLoading(false);
    }
  };

  const fetchProviderStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/providers/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStats({
            totalBookings: data.data.totalBookings || 0,
            pendingBookings: data.data.pendingBookings || 0,
            completedBookings: data.data.completedBookings || 0,
            totalEarnings: data.data.totalEarnings || 0,
            thisMonthEarnings: data.data.thisMonthEarnings || 0,
            averageRating: data.data.averageRating || 0,
            totalReviews: data.data.totalReviews || 0,
          });
        }
      }
    } catch (error) {
      // Keep default stats (all zeros)
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

  const fetchServices = async () => {
    if (!providerId) {
      return;
    }
    
    setServicesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/services/provider/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setServices(data.data);
      } else {
        setServices([]);
      }
    } catch (error) {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!providerId) {
      return;
    }
    
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/provider/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setBookings(data.data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    if (!providerId) return;
    
    setNotificationsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all notifications
      const response = await fetch(`http://localhost:8080/api/notifications/user/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Sort by createdAt (newest first)
          const sortedNotifications = (data.data as Notification[]).sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setNotifications(sortedNotifications);
          
          // Update unread count
          const unread = sortedNotifications.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      }

      // Also fetch unread count separately
      const countResponse = await fetch(`http://localhost:8080/api/notifications/user/${providerId}/unread-count`, {
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
      // Error handled silently
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleNotificationItemClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    // Navigate based on notification type and actionUrl
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'BOOKING':
          navigate('/provider-dashboard');
          setTabValue(1); // Bookings tab
          break;
        case 'KYC':
          navigate('/kyc');
          break;
        case 'PAYMENT':
          navigate('/provider-dashboard');
          setTabValue(2); // Earnings tab
          break;
        default:
          break;
      }
    }

    handleNotificationClose();
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications/user/${user.id}/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getKYCStatusColor = () => {
    switch (kycStatus.status) {
      case 'VERIFIED':
        return { bg: '#e8f5e9', color: '#2e7d32', icon: <VerifiedUser />, text: t('dashboard.kyc.verified') };
      case 'PENDING':
      case 'UNDER_REVIEW':
        return { bg: '#fff3e0', color: '#f57c00', icon: <Pending />, text: t('dashboard.kyc.underProcess') };
      case 'REJECTED':
        return { bg: '#ffebee', color: '#c62828', icon: <Cancel />, text: t('dashboard.kyc.rejected') };
      default:
        return { bg: '#e3f2fd', color: '#1976d2', icon: <Warning />, text: t('dashboard.kyc.notSubmitted') };
    }
  };

  const kycStatusInfo = getKYCStatusColor();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* App Bar */}
      <MuiAppBar position="static" elevation={0} sx={{ bgcolor: '#3B82F6', borderBottom: '3px solid #2563EB' }}>
        <Toolbar sx={{ py: 1 }}>
          <Logo size="medium" onClick={() => navigate('/')} />
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 700, color: 'white' }}>
            {t('dashboard.provider.title')}
          </Typography>
          <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error">
            <IconButton color="inherit" onClick={handleNotificationClick}>
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
                width: 400,
                maxHeight: 500,
                mt: 1,
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t('dashboard.notifications.title') || 'Notifications'}
                </Typography>
                {unreadCount > 0 && (
                  <Button size="small" onClick={handleMarkAllAsRead}>
                    {t('dashboard.notifications.markAllRead') || 'Mark all read'}
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
                    {t('dashboard.notifications.noNotifications') || 'No notifications'}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {notifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        button
                        onClick={() => handleNotificationItemClick(notification)}
                        sx={{
                          bgcolor: notification.isRead ? 'transparent' : '#e3f2fd',
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            bgcolor: notification.isRead ? '#f5f5f5' : '#bbdefb',
                          },
                        }}
                      >
                        <ListItemIcon>
                          {notification.type === 'BOOKING' && <Assignment />}
                          {notification.type === 'KYC' && <Security />}
                          {notification.type === 'PAYMENT' && <AccountBalanceWallet />}
                          {notification.type === 'REVIEW' && <Star />}
                          {notification.type === 'SYSTEM' && <Notifications />}
                          {!notification.type && <Info />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: notification.isRead ? 400 : 700,
                                color: notification.priority === 'URGENT' ? '#d32f2f' : 'inherit',
                              }}
                            >
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(notification.createdAt).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </Box>
                          }
                        />
                        {!notification.isRead && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#3B82F6',
                              ml: 1,
                            }}
                          />
                        )}
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Popover>
          <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
            <Avatar sx={{ bgcolor: '#2563EB', width: 36, height: 36, border: '2px solid white' }}>
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => navigate('/profile')}>
              <Person sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={() => navigate('/provider/upload-service')}>
              <Add sx={{ mr: 1 }} /> Add Service
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </MuiAppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* KYC Status Banner - Prominent Display */}
        {!kycLoading && (
          <Alert
            severity={
              kycStatus.status === 'VERIFIED' ? 'success' :
              (kycStatus.status === 'PENDING' || kycStatus.status === 'UNDER_REVIEW') ? 'warning' :
              kycStatus.status === 'REJECTED' ? 'error' : 'info'
            }
            icon={kycStatusInfo.icon}
            sx={{
              mb: 3,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
            action={
              kycStatus.status === 'VERIFIED' ? (
                <Chip
                  icon={<CheckCircle />}
                  label={t('dashboard.kyc.complete')}
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
              ) : kycStatus.status === 'REJECTED' ? (
                <Button
                  color="inherit"
                  size="small"
                  variant="contained"
                  onClick={() => navigate('/kyc')}
                  sx={{ 
                    fontWeight: 600,
                    bgcolor: '#dc3545',
                    '&:hover': { bgcolor: '#c82333' },
                  }}
                >
                  {t('dashboard.kyc.reUpload')}
                </Button>
              ) : (
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/kyc')}
                  sx={{ fontWeight: 600 }}
                >
                  {kycStatus.status === null ? t('dashboard.kyc.submit') : t('dashboard.kyc.viewStatus')}
                </Button>
              )
            }
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {t('dashboard.kyc.status')}: {kycStatusInfo.text}
                </Typography>
                {kycStatus.status === 'VERIFIED' && kycStatus.verifiedAt && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    ✅ {t('dashboard.kyc.verifiedOn')} {new Date(kycStatus.verifiedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Typography>
                )}
                {(kycStatus.status === 'PENDING' || kycStatus.status === 'UNDER_REVIEW') && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    ⏳ {t('dashboard.kyc.underProcessMsg')}
                  </Typography>
                )}
                {kycStatus.status === 'REJECTED' && (
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                      ❌ {t('dashboard.kyc.rejectedMsg')}
                    </Typography>
                    {kycStatus.rejectionReason && (
                      <Typography variant="body2" sx={{ opacity: 0.7, fontStyle: 'italic' }}>
                        {kycStatus.rejectionReason}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, fontWeight: 600 }}>
                      🔄 {t('dashboard.kyc.reUploadMsg')}
                    </Typography>
                  </Box>
                )}
                {kycStatus.status === null && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    📋 {t('dashboard.kyc.notSubmittedMsg')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Alert>
        )}

        {/* Stats Cards - Enhanced Design */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {loading ? <CircularProgress size={28} sx={{ color: 'white' }} /> : stats.totalBookings}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      {t('dashboard.stats.totalBookings')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                      {stats.completedBookings} {t('dashboard.stats.completed')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Assignment sx={{ fontSize: 36 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      ₹{loading ? '...' : stats.totalEarnings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      {t('dashboard.stats.totalEarnings')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                      ₹{stats.thisMonthEarnings.toLocaleString()} {t('dashboard.stats.thisMonth')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AccountBalanceWallet sx={{ fontSize: 36 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {loading ? <CircularProgress size={28} sx={{ color: 'white' }} /> : stats.pendingBookings}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      {t('dashboard.stats.pendingBookings')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                      {t('dashboard.stats.needsAttention')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Schedule sx={{ fontSize: 36 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Star sx={{ fontSize: 28, mr: 0.5 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {loading ? <CircularProgress size={28} sx={{ color: 'white' }} /> : stats.averageRating.toFixed(1)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      {t('dashboard.stats.averageRating')}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                      {stats.totalReviews} {t('dashboard.stats.reviews')}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Star sx={{ fontSize: 36 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs - Enhanced Design */}
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: '#fff',
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                minHeight: 64,
              },
              '& .Mui-selected': {
                color: '#3B82F6',
              },
            }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<Dashboard />} label={t('dashboard.tabs.overview')} iconPosition="start" />
            <Tab icon={<Assignment />} label={t('dashboard.tabs.bookings')} iconPosition="start" />
            <Tab icon={<AccountBalanceWallet />} label={t('dashboard.tabs.earnings')} iconPosition="start" />
            <Tab icon={<BusinessCenter />} label={t('dashboard.tabs.services')} iconPosition="start" />
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                        हाल की बुकिंग | Recent Bookings
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setTabValue(1)}
                        sx={{ fontWeight: 600 }}
                      >
                        सभी देखें | View All
                      </Button>
                    </Box>
                    {bookingsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length === 0 ? (
                      <Alert severity="info">{language === 'hi' ? 'कोई सक्रिय बुकिंग नहीं' : 'No active bookings'}</Alert>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {bookings
                          .filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')
                          .slice(0, 3)
                          .map((booking, index) => (
                            <ListItem
                              key={booking.id}
                              sx={{
                                borderBottom: index < 2 ? '1px solid #eee' : 'none',
                                py: 2,
                                px: 0,
                                '&:hover': { bgcolor: '#f5f5f5', borderRadius: 1 },
                              }}
                            >
                              <ListItemIcon>
                                <Box
                                  sx={{
                                    bgcolor: '#3B82F6',
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Assignment sx={{ color: 'white', fontSize: 20 }} />
                                </Box>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {booking.serviceName || booking.service || 'Service'}
                                  </Typography>
                                }
                                secondary={
                                  <Box component="div" sx={{ mt: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary" component="span" display="block">
                                      <Person sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                      {language === 'hi' ? 'ग्राहक' : 'Customer'}: {booking.customerName || booking.emergencyContact || booking.userName || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" component="span" display="block" sx={{ mt: 0.5 }}>
                                      <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                      {language === 'hi' ? 'निर्धारित' : 'Scheduled'}: {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleString() : 'Not scheduled'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" component="span" display="block" sx={{ mt: 0.5 }}>
                                      <LocationOn sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                      {booking.address ? `${booking.address}${booking.city ? `, ${booking.city}` : ''}` : 'N/A'}
                                    </Typography>
                                  </Box>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                              />
                              <Chip
                                label={booking.status || 'Pending'}
                                color={booking.status === 'COMPLETED' ? 'success' : booking.status === 'CANCELLED' ? 'error' : 'warning'}
                                size="small"
                                sx={{ fontWeight: 600, mr: 1 }}
                              />
                              {booking.status === 'PENDING' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleConfirmBooking(booking.id)}
                                  sx={{ textTransform: 'none' }}
                                >
                                  Confirm
                                </Button>
                              )}
                            </ListItem>
                          ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card elevation={2} sx={{ borderRadius: 2, mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
                      {t('dashboard.quickActions')}
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/provider/upload-service')}
                      sx={{
                        mb: 1.5,
                        bgcolor: '#3B82F6',
                        '&:hover': { bgcolor: '#2563EB' },
                        fontWeight: 600,
                        py: 1.2,
                        borderRadius: 2,
                      }}
                    >
                      {t('dashboard.addService')}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => navigate('/profile')}
                      sx={{ mb: 1.5, fontWeight: 600, py: 1.2, borderRadius: 2 }}
                    >
                      {t('dashboard.editProfile')}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Security />}
                      onClick={() => navigate('/kyc')}
                      sx={{ fontWeight: 600, py: 1.2, borderRadius: 2 }}
                    >
                      {kycStatus.status === 'VERIFIED' ? t('dashboard.kycVerified') + ' ✅' : t('dashboard.kycStatus')}
                    </Button>
                  </CardContent>
                </Card>

                <Card elevation={2} sx={{ borderRadius: 2, bgcolor: '#f8f9fa' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
                      {t('dashboard.stats.thisMonth')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                      ₹{stats.thisMonthEarnings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.monthlyEarnings')}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={75}
                      sx={{ mt: 2, height: 8, borderRadius: 1, bgcolor: '#e0e0e0' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      75% {language === 'hi' ? 'मासिक लक्ष्य' : 'Monthly Target'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Bookings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                      {t('dashboard.allBookings')}
                    </Typography>
                    <Chip label={`${stats.pendingBookings} ${t('dashboard.pending')}`} color="warning" sx={{ fontWeight: 600 }} />
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.customer')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.service')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.dateTime')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.amount')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.status')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.actions')}</TableCell>
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
                              {language === 'hi' ? 'कोई बुकिंग नहीं मिली' : 'No bookings found'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#3B82F6' }}>
                                  {(booking.customerName || booking.emergencyContact || booking.userName)?.charAt(0) || 'C'}
                                </Avatar>
                                {booking.customerName || booking.emergencyContact || booking.userName || 'Customer'}
                              </Box>
                              {booking.customerPhone && (
                                <Typography variant="caption" color="text.secondary">
                                  {maskPhone(booking.customerPhone)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{booking.serviceName || booking.service || 'Service'}</TableCell>
                            <TableCell>
                              {booking.scheduledDate 
                                ? new Date(booking.scheduledDate).toLocaleString() 
                                : booking.bookingDate 
                                ? new Date(booking.bookingDate).toLocaleString() 
                                : 'N/A'}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {booking.address ? `${booking.address}${booking.city ? `, ${booking.city}` : ''}` : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>₹{booking.totalAmount || booking.price || 0}</TableCell>
                            <TableCell>
                              <Chip 
                                label={booking.status || 'Pending'} 
                                color={booking.status === 'COMPLETED' ? 'success' : booking.status === 'CANCELLED' ? 'error' : 'warning'} 
                                size="small" 
                                sx={{ fontWeight: 600 }} 
                              />
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                sx={{ fontWeight: 600, mr: 1 }}
                                onClick={() => navigate(`/booking/${booking.id}`)}
                              >
                                {t('dashboard.view')}
                              </Button>
                              {booking.status === 'PENDING' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleConfirmBooking(booking.id)}
                                  sx={{ fontWeight: 600, mr: 1 }}
                                >
                                  Confirm
                                </Button>
                              )}
                              {booking.address && (
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => {
                                    const destination = encodeURIComponent(`${booking.address}${booking.city ? `, ${booking.city}` : ''}`);
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                                  }}
                                >
                                  Directions
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

          {/* Earnings Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333' }}>
                      {t('dashboard.totalEarnings')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                      ₹{stats.totalEarnings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.allTimeEarnings')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333' }}>
                      {t('dashboard.stats.thisMonth')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                      ₹{stats.thisMonthEarnings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.monthlyEarnings')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
                      {t('dashboard.earningsHistory')}
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.date')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.service')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.amount')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.commission')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('dashboard.netEarnings')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>28 Nov 2024</TableCell>
                            <TableCell>Plumbing</TableCell>
                            <TableCell>₹2,000</TableCell>
                            <TableCell>₹400 (20%)</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>₹1,600</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* My Services Tab */}
          <TabPanel value={tabValue} index={3}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                    {t('dashboard.myServices')}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/provider/upload-service')}
                    sx={{ bgcolor: '#FF6B35', fontWeight: 600, borderRadius: 2 }}
                  >
                    {t('dashboard.addService')}
                  </Button>
                </Box>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  {t('dashboard.servicesMsg')}
                </Alert>
                {servicesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : services.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#666', fontFamily: '"Poppins", sans-serif' }}>
                      No services added yet
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: '#999', fontFamily: '"Poppins", sans-serif' }}>
                      Add your first service to start receiving bookings
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/provider/upload-service')}
                      sx={{
                        bgcolor: '#FF6B35',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontFamily: '"Poppins", sans-serif',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: '#F7931E',
                        },
                      }}
                    >
                      Add Your First Service
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {services.map((service) => (
                      <Grid item xs={12} md={6} key={service.id}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            borderRadius: 3, 
                            border: '2px solid',
                            borderColor: service.isApproved ? '#4CAF50' : '#FF9800',
                            '&:hover': { boxShadow: 4 },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', color: '#1a1a1a' }}>
                                {service.serviceName || service.title}
                              </Typography>
                              <Chip 
                                label={service.isApproved ? 'Approved' : 'Pending'} 
                                color={service.isApproved ? 'success' : 'warning'} 
                                size="small" 
                                sx={{ fontWeight: 600, fontFamily: '"Poppins", sans-serif' }} 
                              />
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1, color: '#666', fontFamily: '"Poppins", sans-serif' }}>
                              <strong>Category:</strong> {service.category}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, color: '#666', fontFamily: '"Poppins", sans-serif' }}>
                              <strong>Base Price:</strong> {service.basePrice ? formatPrice(service.basePrice) : '₹0'}
                            </Typography>
                            {service.finalPrice && (
                              <Typography variant="body2" sx={{ mb: 1, color: '#666', fontFamily: '"Poppins", sans-serif' }}>
                                <strong>Customer Price:</strong> {formatPrice(service.finalPrice)}
                              </Typography>
                            )}
                            {service.serviceArea && (
                              <Typography variant="body2" sx={{ mb: 1, color: '#666', fontFamily: '"Poppins", sans-serif' }}>
                                <strong>Service Area:</strong> {service.serviceArea}
                              </Typography>
                            )}
                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={service.expertiseLevel} 
                                size="small" 
                                sx={{ fontFamily: '"Poppins", sans-serif' }}
                              />
                              {service.estimatedDuration && (
                                <Chip 
                                  label={service.estimatedDuration} 
                                  size="small" 
                                  sx={{ fontFamily: '"Poppins", sans-serif' }}
                                />
                              )}
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
        </Paper>
      </Container>
    </Box>
  );
};

export default ProviderDashboard;
