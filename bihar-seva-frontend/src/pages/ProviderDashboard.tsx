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
  BusinessCenter,
  Schedule,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Notification } from '../types';
import Logo from '../components/Logo';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface KYCStatus {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
  verifiedAt?: string;
  rejectionReason?: string;
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
  const { user, logout } = useAuth();
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

  useEffect(() => {
    fetchProviderStats();
    fetchKYCStatus();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) {
        fetchNotifications();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

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
    if (!user?.id) {
      setKycLoading(false);
      return;
    }

    setKycLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/kyc/status/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setKycStatus({
          status: data.data.status,
          verifiedAt: data.data.verifiedAt,
          rejectionReason: data.data.rejectionReason,
        });
      } else {
        setKycStatus({ status: null });
      }
    } catch (error) {
      // Error handled silently
      setKycStatus({ status: null });
    } finally {
      setKycLoading(false);
    }
  };

  const fetchProviderStats = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch('http://localhost:8080/api/providers/stats', {
      //   headers: { 'Authorization': `Bearer ${token}` },
      // });
      // Mock data for now
      setStats({
        totalBookings: 24,
        pendingBookings: 5,
        completedBookings: 18,
        totalEarnings: 45000,
        thisMonthEarnings: 12000,
        averageRating: 4.5,
        totalReviews: 15,
      });
    } catch (error) {
      // Error handled silently
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

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setNotificationsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all notifications
      const response = await fetch(`http://localhost:8080/api/notifications/user/${user.id}`, {
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
        return { bg: '#fff3e0', color: '#f57c00', icon: <Pending />, text: t('dashboard.kyc.pending') };
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
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#FF6B35', borderBottom: '3px solid #F7931E' }}>
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
                              bgcolor: '#FF6B35',
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
            <Avatar sx={{ bgcolor: '#F7931E', width: 36, height: 36, border: '2px solid white' }}>
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
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* KYC Status Banner - Prominent Display */}
        {!kycLoading && (
          <Alert
            severity={
              kycStatus.status === 'VERIFIED' ? 'success' :
              kycStatus.status === 'PENDING' ? 'warning' :
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
              kycStatus.status !== 'VERIFIED' ? (
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/kyc')}
                  sx={{ fontWeight: 600 }}
                >
                  {kycStatus.status === null ? t('dashboard.kyc.submit') : t('dashboard.kyc.viewStatus')}
                </Button>
              ) : (
                <Chip
                  icon={<CheckCircle />}
                  label={t('dashboard.kyc.verified')}
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
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
                {kycStatus.status === 'PENDING' && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    ⏳ {t('dashboard.kyc.pendingMsg')}
                  </Typography>
                )}
                {kycStatus.status === 'REJECTED' && kycStatus.rejectionReason && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    ❌ {t('dashboard.kyc.rejectedMsg')}: {kycStatus.rejectionReason}
                  </Typography>
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
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                color: '#FF6B35',
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
                    <List sx={{ p: 0 }}>
                      {[1, 2, 3].map((item, index) => (
                        <ListItem
                          key={item}
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
                                bgcolor: '#FF6B35',
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
                                {t('service.plumbing')} {t('service.providers')}
                              </Typography>
                            }
                            secondary={
                              <Box component="div" sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary" component="span" display="block">
                                  <Person sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                  {t('dashboard.customer')}: John Doe
                                </Typography>
                                <Typography variant="body2" color="text.secondary" component="span" display="block" sx={{ mt: 0.5 }}>
                                  <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                  {t('dashboard.scheduled')}: {t('dashboard.today')} 2:00 PM
                                </Typography>
                              </Box>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                          <Chip
                            label={t('dashboard.pending')}
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </ListItem>
                      ))}
                    </List>
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
                        bgcolor: '#FF6B35',
                        '&:hover': { bgcolor: '#e55a2b' },
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
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#667eea' }}>JD</Avatar>
                            John Doe
                          </Box>
                        </TableCell>
                        <TableCell>Plumbing</TableCell>
                        <TableCell>28 Nov, 2:00 PM</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>₹1,500</TableCell>
                        <TableCell>
                          <Chip label={t('dashboard.pending')} color="warning" size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined" sx={{ fontWeight: 600 }}>
                            {t('dashboard.view')}
                          </Button>
                        </TableCell>
                      </TableRow>
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
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 2, '&:hover': { boxShadow: 3 } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                            {t('service.plumbing')} {t('service.providers')}
                          </Typography>
                          <Chip label={t('dashboard.active')} color="success" size="small" sx={{ fontWeight: 600 }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('dashboard.basePrice')}: ₹1,500
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('dashboard.commission')}: ₹300 (20%)
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Chip label={t('dashboard.kyc.verified')} color="primary" size="small" icon={<VerifiedUser />} />
                          <Button size="small" variant="outlined" sx={{ ml: 'auto', fontWeight: 600 }}>
                            {t('dashboard.edit')}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProviderDashboard;
