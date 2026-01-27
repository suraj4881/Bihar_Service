import React, { useState, useEffect, useRef } from 'react';
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
  TextField,
  InputAdornment,
  AppBar as MuiAppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  CardMedia,
  Rating,
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
  MyLocation,
  SupportAgent,
  Delete,
  Done,
  Search,
  Menu as MenuIcon,
  MoreVert,
  People,
  TrendingUp,
  Group,
  GridView,
  AccessTime,
  LocalOffer,
  Settings,
  ExitToApp,
  Rocket,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice, getCurrentLocation } from '../utils/helpers';
import { Notification } from '../types';
import Logo from '../components/Logo';
import SupportChatFloatingWidget from '../components/SupportChatFloatingWidget';

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
  const [orderFilter, setOrderFilter] = useState('All');
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
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'UPI',
    upiId: '',
    accountHolderName: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
  });
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return phone;
    return `${digits.slice(0, 2)}XXXX${digits.slice(-2)}`;
  };
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [locationUpdatingId, setLocationUpdatingId] = useState<string | null>(null);
  const [arriveUpdatingId, setArriveUpdatingId] = useState<string | null>(null);
  const [liveTrackingBookingId, setLiveTrackingBookingId] = useState<string | null>(null);
  const liveTrackingWatchId = useRef<number | null>(null);
  const lastTrackingSentAt = useRef<number>(0);
  const customerLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const hasAutoArrivedRef = useRef<boolean>(false);
  const bookingStatusRef = useRef<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const providerId = user?.id || provider?.id;

  useEffect(() => {
    fetchProviderStats();
    fetchKYCStatus();
    fetchNotifications();
    fetchServices();
    fetchBookings();
    fetchWalletBalance();
    fetchWithdrawRequests();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  useEffect(() => {
    if (tabValue === 1) {
      fetchBookings();
    } else if (tabValue === 2) {
      fetchWalletBalance();
      fetchWithdrawRequests();
    } else if (tabValue === 4) {
      fetchReviews();
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
      const response = await fetch(`http://localhost:8080/api/users/providers/stats?providerId=${providerId}`, {
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

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data?.balance !== undefined) {
        setWalletBalance(data.data.balance);
      }
    } catch (error) {
      // ignore
    }
  };

  const fetchWithdrawRequests = async () => {
    if (!providerId) return;
    setWithdrawLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/withdrawals/provider/${providerId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setWithdrawRequests(data.data);
      } else {
        setWithdrawRequests([]);
      }
    } catch (error) {
      setWithdrawRequests([]);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    if (!providerId) {
      setWithdrawError('Provider not found');
      return;
    }
    if (!withdrawForm.amount) {
      setWithdrawError('Please enter withdrawal amount');
      return;
    }
    if (withdrawForm.method === 'UPI' && !withdrawForm.upiId) {
      setWithdrawError('Please enter UPI ID');
      return;
    }
    if (withdrawForm.method === 'BANK' && (!withdrawForm.accountNumber || !withdrawForm.ifsc || !withdrawForm.accountHolderName)) {
      setWithdrawError('Please fill bank account details');
      return;
    }
    setWithdrawSubmitting(true);
    setWithdrawError('');
    setWithdrawSuccess('');
    try {
      const response = await fetch('http://localhost:8080/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          amount: Number(withdrawForm.amount),
          method: withdrawForm.method,
          upiId: withdrawForm.upiId,
          accountHolderName: withdrawForm.accountHolderName,
          accountNumber: withdrawForm.accountNumber,
          ifsc: withdrawForm.ifsc,
          bankName: withdrawForm.bankName,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setWithdrawSuccess('Withdrawal request submitted');
        setWithdrawForm({
          amount: '',
          method: 'UPI',
          upiId: '',
          accountHolderName: '',
          accountNumber: '',
          ifsc: '',
          bankName: '',
        });
        fetchWalletBalance();
        fetchWithdrawRequests();
      } else {
        setWithdrawError(data.message || 'Withdrawal failed');
      }
    } catch (error: any) {
      setWithdrawError(error?.message || 'Withdrawal failed');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchReviews = async () => {
    if (!providerId) return;
    setReviewsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/reviews/provider/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Sort by most recent first
          const sortedReviews = data.data.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setReviews(sortedReviews);
        } else {
          setReviews([]);
        }
      } else {
        setReviews([]);
      }
    } catch (error) {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
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
        const totalBookings = data.data.length;
        const pendingBookings = data.data.filter((b: any) => b.status === 'PENDING').length;
        const completedBookings = data.data.filter((b: any) => b.status === 'COMPLETED').length;
        setStats(prev => ({
          ...prev,
          totalBookings,
          pendingBookings,
          completedBookings,
        }));
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

  const handleShareLiveLocation = async (bookingId: string) => {
    setLocationUpdatingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      const location = await getCurrentLocation();
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/tracking`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude: location.lat, longitude: location.lng }),
      });
      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      // ignore
    } finally {
      setLocationUpdatingId(null);
    }
  };

  const handleMarkArrived = async (bookingId: string) => {
    setArriveUpdatingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/arrive`, {
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
    } finally {
      setArriveUpdatingId(null);
    }
  };

  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [bookingToComplete, setBookingToComplete] = useState<string | null>(null);

  const handleCompleteServiceClick = (bookingId: string) => {
    if (!bookingId) {
      return;
    }
    setBookingToComplete(bookingId);
    setCompleteDialogOpen(true);
  };

  const handleCompleteService = async () => {
    if (!bookingToComplete) {
      return;
    }
    
    setCompletingBookingId(bookingToComplete);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCompletingBookingId(null);
        return;
      }

      const response = await fetch(`http://localhost:8080/api/bookings/${bookingToComplete}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Success - refresh everything
        await fetchBookings();
        await fetchProviderStats();
        setCompleteDialogOpen(false);
        setBookingToComplete(null);
        // Auto reload page after successful completion
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setCompletingBookingId(null);
      }
    } catch (error: any) {
      setCompletingBookingId(null);
    }
  };

  const handleCompleteCancel = () => {
    setCompleteDialogOpen(false);
    setBookingToComplete(null);
  };

  // Calculate distance between two coordinates using Haversine formula (in meters)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Geocode address to get coordinates
  const geocodeAddress = async (address: string, city?: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const fullAddress = `${address}${city ? `, ${city}` : ''}, Bihar, India`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: {
            'User-Agent': 'BiharSevaApp/1.0',
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      // Fallback: try with Google Geocoding if available or return null
    }
    return null;
  };

  const stopLiveTracking = () => {
    if (liveTrackingWatchId.current !== null) {
      navigator.geolocation.clearWatch(liveTrackingWatchId.current);
      liveTrackingWatchId.current = null;
    }
    setLiveTrackingBookingId(null);
    customerLocationRef.current = null;
    hasAutoArrivedRef.current = false;
    bookingStatusRef.current = null;
  };

  const startLiveTracking = async (bookingId: string) => {
    stopLiveTracking();
    setLiveTrackingBookingId(bookingId);
    hasAutoArrivedRef.current = false;
    const token = localStorage.getItem('token');

    if (!navigator.geolocation) {
      setLiveTrackingBookingId(null);
      return;
    }

    // Fetch booking details to get customer address
    let bookingData: any = null;
    try {
      const bookingResponse = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (bookingResponse.ok) {
        const bookingResult = await bookingResponse.json();
        if (bookingResult.success && bookingResult.data) {
          bookingData = bookingResult.data;
        }
      }
    } catch (error) {
      // Fallback to bookings state
      bookingData = bookings.find((b) => b.id === bookingId);
    }

    // Get customer location from booking address
    if (bookingData && bookingData.address) {
      const customerLoc = await geocodeAddress(bookingData.address, bookingData.city);
      if (customerLoc) {
        customerLocationRef.current = customerLoc;
      }
    }

    // Store booking status for checks
    bookingStatusRef.current = bookingData?.status || null;

    liveTrackingWatchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastTrackingSentAt.current < 10000) return;
        lastTrackingSentAt.current = now;
        
        const providerLat = position.coords.latitude;
        const providerLng = position.coords.longitude;

        try {
          // Update provider location
          const trackingResponse = await fetch(`http://localhost:8080/api/bookings/${bookingId}/tracking`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: providerLat,
              longitude: providerLng,
            }),
          });

          // Update booking status if needed
          if (trackingResponse.ok) {
            const trackingData = await trackingResponse.json();
            if (trackingData.success && trackingData.data) {
              bookingStatusRef.current = trackingData.data.status;
            }
          }

          // Check if provider is near customer location (within 150 meters)
          if (
            customerLocationRef.current &&
            !hasAutoArrivedRef.current &&
            bookingStatusRef.current &&
            (bookingStatusRef.current === 'CONFIRMED' || bookingStatusRef.current === 'IN_PROGRESS')
          ) {
            const distance = calculateDistance(
              providerLat,
              providerLng,
              customerLocationRef.current.lat,
              customerLocationRef.current.lng
            );

            // Auto-mark as arrived if within 150 meters
            if (distance <= 150) {
              hasAutoArrivedRef.current = true;
              // Automatically mark as arrived
              await handleMarkArrived(bookingId);
              // Refresh bookings to show updated status
              fetchBookings();
            }
          }
        } catch (error) {
          // ignore
        }
      },
      () => {
        stopLiveTracking();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  useEffect(() => {
    return () => stopLiveTracking();
  }, []);

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

  const handleDeleteClick = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete || !providerId) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingToDelete}?userId=${providerId}`, {
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

  // Filter bookings based on orderFilter
  const filteredBookings = orderFilter === 'All' 
    ? bookings 
    : bookings.filter(b => {
        if (orderFilter === 'Ongoing') return b.status === 'IN_PROGRESS';
        if (orderFilter === 'Pending') return b.status === 'PENDING';
        if (orderFilter === 'Completed') return b.status === 'COMPLETED';
        if (orderFilter === 'Cancelled') return b.status === 'CANCELLED';
        return true;
      });

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header with Logo and Notifications */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Logo size="large" onClick={() => navigate('/')} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge badgeContent={unreadCount > 0 ? unreadCount : 0} color="error">
            <IconButton onClick={handleNotificationClick}>
              <Notifications />
            </IconButton>
          </Badge>
          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: '#3B82F6' }}>
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </Avatar>
          </IconButton>
        </Box>
      </Box>

      {/* Notification Popover */}
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
      >
        <Box sx={{ p: 2, width: 400, maxHeight: 500 }}>
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

      {/* User Menu */}
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

      {/* Welcome Banner */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          color: '#fff',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 40%, #2563EB 100%)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Hi{user?.name ? `, ${user.name}` : ''}! Ready to accept bookings?
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Manage services, track bookings, and keep your availability updated.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button 
              variant="contained" 
              onClick={() => navigate('/provider/upload-service')} 
              sx={{ bgcolor: '#F97316', '&:hover': { bgcolor: '#EA580C' } }}
            >
              Add Service
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/support')} 
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: '#fff' } }}
            >
              Get Help
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* KYC Status Banner */}
      {!kycLoading && (
        <Alert
          severity={
            kycStatus.status === 'VERIFIED' ? 'success' :
            (kycStatus.status === 'PENDING' || kycStatus.status === 'UNDER_REVIEW') ? 'warning' :
            kycStatus.status === 'REJECTED' ? 'error' : 'info'
          }
          icon={kycStatusInfo.icon}
          sx={{ mb: 3 }}
          action={
            kycStatus.status === 'VERIFIED' ? (
              <Chip
                icon={<CheckCircle />}
                label={t('dashboard.kyc.complete')}
                color="success"
                size="small"
              />
            ) : kycStatus.status === 'REJECTED' ? (
              <Button
                color="inherit"
                size="small"
                variant="contained"
                onClick={() => navigate('/kyc')}
                sx={{ bgcolor: '#dc3545', '&:hover': { bgcolor: '#c82333' } }}
              >
                {t('dashboard.kyc.reUpload')}
              </Button>
            ) : (
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={() => navigate('/kyc')}
              >
                {kycStatus.status === null ? t('dashboard.kyc.submit') : t('dashboard.kyc.viewStatus')}
              </Button>
            )
          }
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {t('dashboard.kyc.status')}: {kycStatusInfo.text}
            </Typography>
            {kycStatus.status === 'VERIFIED' && kycStatus.verifiedAt && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                ✅ {t('dashboard.kyc.verifiedOn')} {new Date(kycStatus.verifiedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
            )}
            {(kycStatus.status === 'PENDING' || kycStatus.status === 'UNDER_REVIEW') && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                ⏳ {t('dashboard.kyc.underProcessMsg')}
              </Typography>
            )}
            {kycStatus.status === 'REJECTED' && (
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8, mb: 0.5, display: 'block' }}>
                  ❌ {t('dashboard.kyc.rejectedMsg')}
                </Typography>
                {kycStatus.rejectionReason && (
                  <Typography variant="caption" sx={{ opacity: 0.7, fontStyle: 'italic', display: 'block' }}>
                    {kycStatus.rejectionReason}
                  </Typography>
                )}
              </Box>
            )}
            {kycStatus.status === null && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                📋 {t('dashboard.kyc.notSubmittedMsg')}
              </Typography>
            )}
          </Box>
        </Alert>
      )}

      {/* Stats Cards - Only show in Overview */}
      {tabValue === 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
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
      )}

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab icon={<Dashboard />} iconPosition="start" label={t('dashboard.tabs.overview')} />
          <Tab icon={<Assignment />} iconPosition="start" label={t('dashboard.tabs.bookings')} />
          <Tab icon={<AccountBalanceWallet />} iconPosition="start" label={t('dashboard.tabs.earnings')} />
          <Tab icon={<BusinessCenter />} iconPosition="start" label={t('dashboard.tabs.services')} />
          <Tab icon={<Star />} iconPosition="start" label="Reviews" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Paper elevation={2}>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
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
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<SupportAgent />}
                      onClick={() => navigate('/support')}
                      sx={{ mt: 1.5, fontWeight: 600, py: 1.2, borderRadius: 2 }}
                    >
                      Help & Support
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

        <TabPanel value={tabValue} index={1}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                    {t('dashboard.allBookings')}
                  </Typography>
                  <Chip label={`${stats.pendingBookings} ${t('dashboard.pending')}`} color="warning" size="small" sx={{ fontWeight: 600 }} />
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
                        <TableCell sx={{ fontWeight: 700 }}>Delete</TableCell>
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
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  sx={{ 
                                    fontWeight: 600,
                                    minWidth: 80,
                                    textTransform: 'none',
                                    height: 32
                                  }}
                                  onClick={() => navigate(`/booking/${booking.id}`)}
                                >
                                  {t('dashboard.view')}
                                </Button>
                                
                                {booking.status === 'PENDING' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleConfirmBooking(booking.id)}
                                    sx={{ 
                                      fontWeight: 600,
                                      minWidth: 100,
                                      textTransform: 'none',
                                      height: 32
                                    }}
                                  >
                                    Confirm
                                  </Button>
                                )}
                                
                                {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
                                  <Button
                                    size="small"
                                    variant={liveTrackingBookingId === booking.id ? 'contained' : 'outlined'}
                                    color={liveTrackingBookingId === booking.id ? 'success' : 'primary'}
                                    startIcon={<MyLocation />}
                                    onClick={() =>
                                      liveTrackingBookingId === booking.id
                                        ? stopLiveTracking()
                                        : startLiveTracking(booking.id)
                                    }
                                    sx={{ 
                                      fontWeight: 600,
                                      minWidth: 110,
                                      textTransform: 'none',
                                      height: 32
                                    }}
                                  >
                                    {liveTrackingBookingId === booking.id ? 'Stop Live' : 'Auto Live'}
                                  </Button>
                                )}
                                
                                {booking.status === 'IN_PROGRESS' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="info"
                                    onClick={() => handleMarkArrived(booking.id)}
                                    disabled={arriveUpdatingId === booking.id}
                                    sx={{ 
                                      fontWeight: 600,
                                      minWidth: 100,
                                      textTransform: 'none',
                                      height: 32
                                    }}
                                  >
                                    {arriveUpdatingId === booking.id ? 'Arriving...' : 'Arrived'}
                                  </Button>
                                )}
                                
                                {/* Complete Service Button */}
                                {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && 
                                  booking.status !== 'COMPLETED' && (
                                  <Tooltip title="Mark service as completed">
                                    <span>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={completingBookingId === booking.id ? <CircularProgress size={16} color="inherit" /> : <Done />}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (e.nativeEvent) {
                                            e.nativeEvent.stopImmediatePropagation();
                                          }
                                          if (booking.id && completingBookingId !== booking.id) {
                                            handleCompleteServiceClick(booking.id);
                                          }
                                        }}
                                        disabled={completingBookingId === booking.id || booking.status === 'COMPLETED' || !booking.id}
                                        sx={{ 
                                          fontWeight: 600,
                                          minWidth: 140,
                                          textTransform: 'none',
                                          height: 32,
                                          bgcolor: '#10B981',
                                          cursor: 'pointer',
                                          pointerEvents: 'auto',
                                          '&:hover': { 
                                            bgcolor: '#059669',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                                          },
                                          '&:disabled': { 
                                            bgcolor: '#9CA3AF',
                                            cursor: 'not-allowed',
                                            pointerEvents: 'none'
                                          },
                                          transition: 'all 0.2s ease',
                                          position: 'relative',
                                          zIndex: 10
                                        }}
                                      >
                                        {completingBookingId === booking.id ? 'Completing...' : 'Complete Service'}
                                      </Button>
                                    </span>
                                  </Tooltip>
                                )}
                                
                                {/* Directions Button - Always in same row */}
                                {booking.address && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<LocationOn />}
                                    onClick={() => {
                                      const destination = encodeURIComponent(`${booking.address}${booking.city ? `, ${booking.city}` : ''}`);
                                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                                    }}
                                    sx={{ 
                                      textTransform: 'none',
                                      height: 32,
                                      minWidth: 110,
                                      borderColor: '#3B82F6',
                                      color: '#3B82F6',
                                      '&:hover': {
                                        bgcolor: 'rgba(59, 130, 246, 0.08)',
                                        borderColor: '#2563EB'
                                      }
                                    }}
                                  >
                                    Directions
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {(booking.status === 'CANCELLED' || booking.status === 'COMPLETED') && (
                                <Tooltip title="Delete Booking">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteClick(booking.id)}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
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
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
                      {t('dashboard.stats.thisMonth')}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 0.5 }}>
                      ₹{stats.thisMonthEarnings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.monthlyEarnings')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
                      Wallet Balance
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563EB', mb: 0.5 }}>
                      ₹{walletBalance.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available for withdrawal
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
                      Withdraw Earnings
                    </Typography>
                    {withdrawError && <Alert severity="error" sx={{ mb: 2 }}>{withdrawError}</Alert>}
                    {withdrawSuccess && <Alert severity="success" sx={{ mb: 2 }}>{withdrawSuccess}</Alert>}
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Amount"
                          value={withdrawForm.amount}
                          onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          select
                          label="Withdrawal Method"
                          value={withdrawForm.method}
                          onChange={(e) => setWithdrawForm({ ...withdrawForm, method: e.target.value })}
                        >
                          <MenuItem value="UPI">UPI</MenuItem>
                          <MenuItem value="BANK">Bank Transfer</MenuItem>
                        </TextField>
                      </Grid>
                      {withdrawForm.method === 'UPI' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="UPI ID"
                            value={withdrawForm.upiId}
                            onChange={(e) => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })}
                          />
                        </Grid>
                      )}
                      {withdrawForm.method === 'BANK' && (
                        <>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Account Holder Name"
                              value={withdrawForm.accountHolderName}
                              onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolderName: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Account Number"
                              value={withdrawForm.accountNumber}
                              onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="IFSC"
                              value={withdrawForm.ifsc}
                              onChange={(e) => setWithdrawForm({ ...withdrawForm, ifsc: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Bank Name"
                              value={withdrawForm.bankName}
                              onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                            />
                          </Grid>
                        </>
                      )}
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleWithdrawSubmit}
                          disabled={withdrawSubmitting}
                        >
                          {withdrawSubmitting ? 'Submitting...' : 'Request Withdrawal'}
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
                      Withdrawal Requests
                    </Typography>
                    {withdrawLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    ) : withdrawRequests.length === 0 ? (
                      <Alert severity="info">No withdrawal requests yet</Alert>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {withdrawRequests.map((req: any) => (
                              <TableRow key={req.id}>
                                <TableCell>{req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell>₹{Number(req.amount || 0).toLocaleString()}</TableCell>
                                <TableCell>{req.method}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={req.status}
                                    size="small"
                                    color={req.status === 'PAID' ? 'success' : req.status === 'REJECTED' ? 'error' : req.status === 'APPROVED' ? 'info' : 'warning'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
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

        <TabPanel value={tabValue} index={3}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                    {t('dashboard.myServices')}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => navigate('/provider/upload-service')}
                    sx={{ bgcolor: '#FF6B35', fontWeight: 600, borderRadius: 2, textTransform: 'none' }}
                  >
                    {t('dashboard.addService')}
                  </Button>
                </Box>
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.875rem' }}>
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

        <TabPanel value={tabValue} index={4}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                      Customer Reviews
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Total {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} • Average Rating: {stats.averageRating.toFixed(1)} ⭐
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${reviews.length} Reviews`} 
                    color="primary" 
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {reviewsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : reviews.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No reviews yet. Complete services to receive customer reviews.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {reviews.map((review: any) => (
                      <Card 
                        key={review.id} 
                        variant="outlined" 
                        sx={{ 
                          borderRadius: 2,
                          '&:hover': {
                            boxShadow: 2,
                            borderColor: '#3B82F6'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: '#3B82F6', width: 48, height: 48 }}>
                                {(review.customerName || 'C').charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {review.customerName || 'Anonymous Customer'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {review.service || 'Service'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Star sx={{ color: '#FFB800', fontSize: 20 }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFB800' }}>
                                  {review.rating}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {review.createdAt 
                                  ? new Date(review.createdAt).toLocaleDateString('en-IN', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })
                                  : 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {review.comment && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#555',
                                lineHeight: 1.6,
                                pl: 7
                              }}
                            >
                              "{review.comment}"
                            </Typography>
                          )}
                          
                          {review.providerResponse && (
                            <Box 
                              sx={{ 
                                mt: 2, 
                                p: 2, 
                                bgcolor: '#F3F4F6', 
                                borderRadius: 1,
                                borderLeft: '3px solid #3B82F6'
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3B82F6', display: 'block', mb: 0.5 }}>
                                Your Response:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {review.providerResponse}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

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

      {/* Complete Service Confirmation Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={handleCompleteCancel}
        aria-labelledby="complete-dialog-title"
        aria-describedby="complete-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="complete-dialog-title" sx={{ fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Done sx={{ fontSize: 24 }} />
          Complete Service
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="complete-dialog-description" sx={{ fontSize: '1rem', mt: 1 }}>
            Are you sure the service is completed and payment has been received? 
            <br /><br />
            This will:
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Mark the booking as <strong>COMPLETED</strong></li>
              <li>Notify the customer to rate the service</li>
              <li>Update your earnings and stats</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleCompleteCancel} 
            disabled={completingBookingId !== null}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteService}
            color="success"
            variant="contained"
            disabled={completingBookingId !== null}
            startIcon={completingBookingId ? <CircularProgress size={20} /> : <Done />}
            sx={{ minWidth: 150, fontWeight: 600 }}
          >
            {completingBookingId ? 'Completing...' : 'Complete Service'}
          </Button>
        </DialogActions>
      </Dialog>

      <SupportChatFloatingWidget userId={providerId || ''} userRole="PROVIDER" userName={user?.name || provider?.name || 'Provider'} />
    </Container>
  );
};

export default ProviderDashboard;
