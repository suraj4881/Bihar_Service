import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TextField,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  CameraAlt,
  PhotoLibrary,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice, getCurrentLocation } from '../utils/helpers';
import { Notification } from '../types';
import AppBar from '../components/AppBar';
import SupportChatFloatingWidget from '../components/SupportChatFloatingWidget';
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

interface KYCStatus {
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | null;
  verifiedAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
}

/** Align with backend ProviderStatsService.providerShare */
function providerShareFromBookingRow(b: {
  status?: string;
  totalAmount?: number;
  totalPrice?: number;
  price?: number;
  commission?: number;
}): number {
  if (b.status !== 'COMPLETED') return 0;
  const total =
    Number(b.totalAmount) > 0
      ? Number(b.totalAmount)
      : Number(b.totalPrice) > 0
        ? Number(b.totalPrice)
        : Number(b.price) || 0;
  const comm = Number(b.commission) >= 0 ? Number(b.commission) : 0;
  return Math.max(0, total - comm);
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

const ProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, provider, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [tabValue, setTabValue] = useState(0);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
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
  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return phone;
    return `${digits.slice(0, 2)}XXXX${digits.slice(-2)}`;
  };
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [locationUpdatingId, setLocationUpdatingId] = useState<string | null>(null);
  const [arriveUpdatingId, setArriveUpdatingId] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeBooking, setCompleteBooking] = useState<any>(null);
  const [completionOtp, setCompletionOtp] = useState('');
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [completionSubmitting, setCompletionSubmitting] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const [sendingCompletionOtp, setSendingCompletionOtp] = useState(false);
  const [liveTrackingBookingId, setLiveTrackingBookingId] = useState<string | null>(null);
  const liveTrackingWatchId = useRef<number | null>(null);
  const lastTrackingSentAt = useRef<number>(0);
  const completionCameraInputRef = useRef<HTMLInputElement>(null);

  const providerId = user?.id || provider?.id;

  useEffect(() => {
    if (!providerId) return undefined;
    let cancelled = false;
    fetchKYCStatus();
    fetchNotifications();
    fetchServices();
    fetchWalletBalance();
    fetchWithdrawRequests();
    void (async () => {
      await fetchProviderStats();
      if (!cancelled) await fetchBookings();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  useEffect(() => {
    if (tabValue === 1) {
      void fetchBookings();
    } else if (tabValue === 2) {
      void (async () => {
        await fetchProviderStats();
        await fetchBookings();
        fetchWalletBalance();
        fetchWithdrawRequests();
      })();
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
      const url = getApiUrl(`kyc/status/${providerId}`);
      
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
    if (!providerId) {
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        getApiUrl(`providers/stats?providerId=${encodeURIComponent(providerId)}`),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && typeof data.data === 'object') {
          const d = data.data as Record<string, unknown>;
          setStats({
            totalBookings: Number(d.totalBookings) || 0,
            pendingBookings: Number(d.pendingBookings) || 0,
            completedBookings: Number(d.completedBookings) || 0,
            totalEarnings: Number(d.totalEarnings) || 0,
            thisMonthEarnings: Number(d.thisMonthEarnings) || 0,
            averageRating: Number(d.averageRating) || 0,
            totalReviews: Number(d.totalReviews) || 0,
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
      const response = await fetch(getApiUrl('wallet/balance'), {
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
      const response = await fetch(getApiUrl(`withdrawals/provider/${providerId}`));
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
      const response = await fetch(getApiUrl('withdrawals/request'), {
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

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const fetchServices = async () => {
    if (!providerId) {
      return;
    }
    
    setServicesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`services/provider/${providerId}`), {
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
      const response = await fetch(getApiUrl(`bookings/provider/${providerId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        const list = data.data as any[];
        setBookings(list);
        const totalBookings = list.length;
        const pendingLike = new Set(['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS']);
        const pendingBookings = list.filter((b) => pendingLike.has(b.status)).length;
        const completedBookings = list.filter((b) => b.status === 'COMPLETED').length;

        let totalEarnings = 0;
        let thisMonthEarnings = 0;
        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        firstOfMonth.setHours(0, 0, 0, 0);
        const ratings: number[] = [];

        for (const b of list) {
          if (b.status !== 'COMPLETED') continue;
          const share = providerShareFromBookingRow(b);
          totalEarnings += share;
          const doneRaw = b.completedDate;
          if (doneRaw) {
            const done = new Date(doneRaw);
            if (!Number.isNaN(done.getTime()) && done >= firstOfMonth) {
              thisMonthEarnings += share;
            }
          }
          const r = Number(b.customerRating);
          if (r > 0) ratings.push(r);
        }

        const averageRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((a, c) => a + c, 0) / ratings.length) * 10) / 10
            : 0;
        const totalReviews = ratings.length;

        setStats((prev) => ({
          ...prev,
          totalBookings,
          pendingBookings,
          completedBookings,
          totalEarnings,
          thisMonthEarnings,
          averageRating,
          totalReviews,
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
      const response = await fetch(getApiUrl(`bookings/${bookingId}/accept`), {
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
      const response = await fetch(getApiUrl(`bookings/${bookingId}/tracking`), {
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
      const response = await fetch(getApiUrl(`bookings/${bookingId}/arrive`), {
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

  const openCompleteDialog = (booking: any) => {
    setCompleteBooking(booking);
    setCompletionOtp('');
    setCompletionFiles([]);
    setCompletionError('');
    setSendingCompletionOtp(false);
    setCompleteDialogOpen(true);
  };

  const addCompletionFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f && f.size > 0);
    if (!list.length) return;
    setCompletionFiles((prev) => [...prev, ...list]);
  }, []);

  const handleSendCompletionOtp = async () => {
    if (!completeBooking?.id) return;
    const bookingProviderId = completeBooking.providerId || providerId;
    if (!bookingProviderId) return;
    if (completeBooking.paymentStatus && completeBooking.paymentStatus !== 'PAID') {
      setCompletionError(
        language === 'hi'
          ? 'पहले ग्राहक को भुगतान पूरा करना होगा।'
          : 'The customer must complete payment before sending a completion code.'
      );
      return;
    }
    setSendingCompletionOtp(true);
    setCompletionError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.set('providerId', bookingProviderId);
      if (completeBooking.userId) params.set('customerUserId', completeBooking.userId);
      if (completeBooking.serviceId) params.set('serviceId', completeBooking.serviceId);
      const response = await fetch(
        getApiUrl(`bookings/${completeBooking.id}/completion-otp/send?${params.toString()}`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      let data: { success?: boolean; message?: string; error?: string } = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON error body */
      }
      if (!response.ok || !data.success) {
        const msg =
          data.message ||
          data.error ||
          (language === 'hi' ? 'OTP नहीं भेजा जा सका' : 'Could not send OTP');
        setCompletionError(response.status ? `${msg} (${response.status})` : msg);
        return;
      }
    } catch {
      setCompletionError(language === 'hi' ? 'OTP नहीं भेजा जा सका' : 'Could not send OTP');
    } finally {
      setSendingCompletionOtp(false);
    }
  };

  const handleSubmitCompletion = async () => {
    if (!completeBooking?.id) return;
    const bookingProviderId = completeBooking.providerId || providerId;
    if (!bookingProviderId) return;
    if (completeBooking.paymentStatus && completeBooking.paymentStatus !== 'PAID') {
      setCompletionError('Customer payment must be completed before finishing the service.');
      return;
    }
    if (completionOtp.trim().length !== 4) {
      setCompletionError(
        language === 'hi'
          ? 'ग्राहक के डैशबोर्ड पर दिख रहा ४ अंकीय कोड यहाँ डालें।'
          : 'Enter the 4-digit code shown on the customer’s dashboard (tap Send OTP first if they need a new code).'
      );
      return;
    }
    if (completionFiles.length === 0) {
      setCompletionError('Add at least one photo of the completed work.');
      return;
    }
    setCompletionSubmitting(true);
    setCompletionError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('providerId', bookingProviderId);
      formData.append('otp', completionOtp.trim());
      completionFiles.forEach((file, index) => {
        const name = file.name && file.name.trim() ? file.name : `completion-${index}.jpg`;
        formData.append('files', file, name);
      });
      const response = await fetch(getApiUrl(`bookings/${completeBooking.id}/complete-verification`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setCompletionError(data.message || 'Could not complete booking');
        return;
      }
      setCompleteDialogOpen(false);
      setCompleteBooking(null);
      fetchBookings();
    } catch (error) {
      setCompletionError('Could not complete booking');
    } finally {
      setCompletionSubmitting(false);
    }
  };

  const stopLiveTracking = () => {
    if (liveTrackingWatchId.current !== null) {
      navigator.geolocation.clearWatch(liveTrackingWatchId.current);
      liveTrackingWatchId.current = null;
    }
    setLiveTrackingBookingId(null);
  };

  const startLiveTracking = async (bookingId: string) => {
    stopLiveTracking();
    setLiveTrackingBookingId(bookingId);
    const token = localStorage.getItem('token');

    if (!navigator.geolocation) {
      setLiveTrackingBookingId(null);
      return;
    }

    liveTrackingWatchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastTrackingSentAt.current < 10000) return;
        lastTrackingSentAt.current = now;
        try {
          await fetch(getApiUrl(`bookings/${bookingId}/tracking`), {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });
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
      const response = await fetch(getApiUrl(`notifications/user/${providerId}`), {
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
      const countResponse = await fetch(getApiUrl(`notifications/user/${providerId}/unread-count`), {
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
      const response = await fetch(getApiUrl(`notifications/${notificationId}/read`), {
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
      const response = await fetch(getApiUrl(`notifications/user/${user.id}/read-all`), {
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
        return { bg: '#e0f2f1', color: '#00695C', icon: <Warning />, text: t('dashboard.kyc.notSubmitted') };
    }
  };

  const kycStatusInfo = getKYCStatusColor();

  const hour = new Date().getHours();
  const firstName = user?.name?.trim()?.split(/\s+/)[0] ?? '';
  const greetingEn =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingHi =
    hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या';

  const providerHeaderTitle = (
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
          ? 'सेवा का भरोसा · प्रोवाइडर वर्कस्पेस'
          : 'SewaBihar · Your provider workspace'}
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
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
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
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: notification.isRead ? 'action.hover' : 'action.selected',
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
                          bgcolor: 'primary.main',
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
      <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 0.5 }} aria-label="Account menu">
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.dark',
            border: '2px solid rgba(255,255,255,0.9)',
          }}
        >
          {user?.name?.charAt(0).toUpperCase() || 'P'}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem
          onClick={() => {
            navigate('/profile');
            handleProfileMenuClose();
          }}
        >
          <Person sx={{ mr: 1 }} /> Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate('/provider/upload-service');
            handleProfileMenuClose();
          }}
        >
          <Add sx={{ mr: 1 }} /> Add Service
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleLogout();
            handleProfileMenuClose();
          }}
        >
          <Logout sx={{ mr: 1 }} /> Logout
        </MenuItem>
      </Menu>
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        variant="dashboard"
        position="static"
        title={providerHeaderTitle}
        customActions={dashboardToolbarActions}
      />

      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        <Card
          sx={{
            mb: 3,
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
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.35rem', sm: '2rem' } }}
              >
                {language === 'hi'
                  ? `नमस्ते${user?.name ? `, ${user.name}` : ''}! नई बुकिंग के लिए तैयार?`
                  : `Hi${user?.name ? `, ${user.name}` : ''}! Ready to accept bookings?`}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 560 }}>
                {language === 'hi'
                  ? 'सेवाएँ प्रबंधित करें, बुकिंग ट्रैक करें, और अपनी उपलब्धता अपडेट रखें।'
                  : 'Manage services, track bookings, and keep your availability updated.'}
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
                onClick={() => navigate('/provider/upload-service')}
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
                {language === 'hi' ? 'सेवा जोड़ें' : 'Add service'}
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

        {/* Stats — SewaBihar teal accent cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              key: 'bookings',
              accent: '#00695C',
              icon: <Assignment sx={{ fontSize: 26 }} />,
              label: t('dashboard.stats.totalBookings'),
              main: loading ? (
                <CircularProgress size={26} />
              ) : (
                <Typography component="span" variant="h4" sx={{ fontWeight: 800 }}>
                  {stats.totalBookings}
                </Typography>
              ),
              caption: `${stats.completedBookings} ${t('dashboard.stats.completed')}`,
            },
            {
              key: 'earnings',
              accent: '#00897B',
              icon: <AccountBalanceWallet sx={{ fontSize: 26 }} />,
              label: t('dashboard.stats.totalEarnings'),
              main: (
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  ₹{loading ? '…' : stats.totalEarnings.toLocaleString()}
                </Typography>
              ),
              caption: `₹${stats.thisMonthEarnings.toLocaleString()} ${t('dashboard.stats.thisMonth')}`,
            },
            {
              key: 'pending',
              accent: '#004D40',
              icon: <Schedule sx={{ fontSize: 26 }} />,
              label: t('dashboard.stats.pendingBookings'),
              main: loading ? (
                <CircularProgress size={26} />
              ) : (
                <Typography component="span" variant="h4" sx={{ fontWeight: 800 }}>
                  {stats.pendingBookings}
                </Typography>
              ),
              caption: t('dashboard.stats.needsAttention'),
            },
            {
              key: 'rating',
              accent: '#26A69A',
              icon: <Star sx={{ fontSize: 26 }} />,
              label: t('dashboard.stats.averageRating'),
              main: loading ? (
                <CircularProgress size={26} />
              ) : (
                <Typography component="span" variant="h4" sx={{ fontWeight: 800 }}>
                  {stats.averageRating.toFixed(1)}
                </Typography>
              ),
              caption: `${stats.totalReviews} ${t('dashboard.stats.reviews')}`,
            },
          ].map((row) => (
            <Grid item xs={12} sm={6} md={3} key={row.key}>
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
                      <Box sx={{ mb: 0.5 }}>{row.main}</Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {row.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {row.caption}
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
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            indicatorColor="primary"
            textColor="primary"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              px: { xs: 0.5, sm: 1 },
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                minHeight: 52,
              },
            }}
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
                                    bgcolor: 'primary.main',
                                    borderRadius: 2,
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Assignment sx={{ color: 'primary.contrastText', fontSize: 20 }} />
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
                        fontWeight: 700,
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        background: sewaPrimaryButtonGradient,
                        '&:hover': { background: sewaPrimaryButtonHover },
                      }}
                    >
                      {t('dashboard.addService')}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<Edit />}
                      onClick={() => navigate('/profile')}
                      sx={{ mb: 1.5, fontWeight: 600, py: 1.2, borderRadius: 2, textTransform: 'none' }}
                    >
                      {t('dashboard.editProfile')}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<Security />}
                      onClick={() => navigate('/kyc')}
                      sx={{ fontWeight: 600, py: 1.2, borderRadius: 2, textTransform: 'none' }}
                    >
                      {kycStatus.status === 'VERIFIED' ? t('dashboard.kycVerified') + ' ✅' : t('dashboard.kycStatus')}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<SupportAgent />}
                      onClick={() => navigate('/support')}
                      sx={{ mt: 1.5, fontWeight: 600, py: 1.2, borderRadius: 2, textTransform: 'none' }}
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
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                      ₹{stats.thisMonthEarnings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.monthlyEarnings')}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={75}
                      sx={{ mt: 2, height: 8, borderRadius: 1, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
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
                                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
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
                              {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<MyLocation />}
                                  onClick={() => handleShareLiveLocation(booking.id)}
                                  disabled={locationUpdatingId === booking.id || liveTrackingBookingId === booking.id}
                                  sx={{ fontWeight: 600, mr: 1 }}
                                >
                                  {locationUpdatingId === booking.id ? 'Sharing...' : 'Share Live'}
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
                                  sx={{ fontWeight: 600, mr: 1 }}
                                >
                                  {liveTrackingBookingId === booking.id ? 'Stop Live' : 'Auto Live'}
                                </Button>
                              )}
                              {booking.status === 'IN_PROGRESS' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleMarkArrived(booking.id)}
                                  disabled={arriveUpdatingId === booking.id}
                                  sx={{ fontWeight: 600, mr: 1 }}
                                >
                                  {arriveUpdatingId === booking.id ? 'Arriving...' : 'Arrived'}
                                </Button>
                              )}
                              {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="secondary"
                                  onClick={() => openCompleteDialog(booking)}
                                  sx={{ fontWeight: 600, mr: 1 }}
                                >
                                  {language === 'hi' ? 'पूर्ण' : 'Complete service'}
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
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
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
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.dark', mb: 1 }}>
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
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333' }}>
                      Wallet Balance
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
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
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 2 }}>
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
      <Dialog open={completeDialogOpen} onClose={() => !completionSubmitting && setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {language === 'hi' ? 'सेवा पूर्ण करें' : 'Complete service'}
        </DialogTitle>
        <DialogContent>
          {completeBooking && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {completeBooking.serviceName || completeBooking.service || 'Service'} · ₹{completeBooking.totalAmount || completeBooking.price || 0}
              </Typography>
              <Chip
                size="small"
                label={completeBooking.paymentStatus === 'PAID' ? (language === 'hi' ? 'भुगतान हो गया' : 'Paid') : (language === 'hi' ? 'भुगतान लंबित' : 'Payment pending')}
                color={completeBooking.paymentStatus === 'PAID' ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              />
              {completeBooking.paymentStatus && completeBooking.paymentStatus !== 'PAID' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {language === 'hi'
                    ? 'पूर्ण करने से पहले ग्राहक को भुगतान पूरा करना होगा।'
                    : 'The customer must complete payment before you can finish this job.'}
                </Alert>
              )}
              <Typography variant="body2" sx={{ mb: 2 }}>
                {language === 'hi'
                  ? 'पहले “ग्राहक को OTP भेजें” दबाएँ — नया ४ अंकीय कोड ग्राहक के डैशबोर्ड पर दिखेगा। फिर फोटो जोड़ें और वही कोड यहाँ डालें।'
                  : 'Tap “Send OTP to customer” so a new 4-digit code appears on their dashboard. Then add photos and enter the code they read to you.'}
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2, textTransform: 'none', fontWeight: 600 }}
                onClick={handleSendCompletionOtp}
                disabled={
                  sendingCompletionOtp ||
                  (completeBooking.paymentStatus && completeBooking.paymentStatus !== 'PAID')
                }
              >
                {sendingCompletionOtp
                  ? language === 'hi'
                    ? 'भेज रहे हैं…'
                    : 'Sending…'
                  : language === 'hi'
                    ? 'ग्राहक को OTP भेजें'
                    : 'Send OTP to customer'}
              </Button>
              <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, mb: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CameraAlt />}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                  onClick={() => completionCameraInputRef.current?.click()}
                >
                  {language === 'hi' ? 'लाइव कैमरा' : 'Live capture'}
                </Button>
                <input
                  ref={completionCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => {
                    addCompletionFiles(e.target.files);
                    if (e.target) e.target.value = '';
                  }}
                />
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PhotoLibrary />}
                  component="label"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {language === 'hi' ? 'गैलरी से अपलोड' : 'Upload from gallery'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      addCompletionFiles(e.target.files);
                      if (e.target) e.target.value = '';
                    }}
                  />
                </Button>
              </Box>
              {completionFiles.length > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  {completionFiles.length}{' '}
                  {language === 'hi' ? 'फ़ाइल चुनी गई' : 'file(s) selected'}
                </Typography>
              )}
              <TextField
                fullWidth
                label={language === 'hi' ? 'ग्राहक का OTP' : 'OTP from customer'}
                placeholder={language === 'hi' ? 'ग्राहक से मिला ४ अंकीय कोड' : 'OTP from customer'}
                value={completionOtp}
                onChange={(e) => setCompletionOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputProps={{ maxLength: 4 }}
                sx={{ mb: 2 }}
              />
              {completionError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {completionError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCompleteDialogOpen(false)} disabled={completionSubmitting}>
            {language === 'hi' ? 'रद्द' : 'Cancel'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCompletion}
            disabled={
              completionSubmitting ||
              !completeBooking ||
              (completeBooking.paymentStatus && completeBooking.paymentStatus !== 'PAID')
            }
          >
            {completionSubmitting ? (language === 'hi' ? 'सबमिट…' : 'Submitting…') : (language === 'hi' ? 'पूर्ण करें' : 'Submit & complete')}
          </Button>
        </DialogActions>
      </Dialog>
      <SupportChatFloatingWidget userId={providerId || ''} userRole="PROVIDER" userName={user?.name || provider?.name || 'Provider'} />
    </Box>
  );
};

export default ProviderDashboard;
