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
  Payment,
  AccountBalance,
  Receipt,
  Download,
  PictureAsPdf,
  ShoppingCart,
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
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [pendingKYCRequests, setPendingKYCRequests] = useState<any[]>([]);
  const [pendingKYCRequestsLoading, setPendingKYCRequestsLoading] = useState(false);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [pendingServicesLoading, setPendingServicesLoading] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [walletTransactionsLoading, setWalletTransactionsLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [commissionStats, setCommissionStats] = useState<any>({});
  const [commissionRate, setCommissionRate] = useState(10);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalCustomers: 0,
    pendingKYC: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeServices: 0,
  });
  
  // KYC Review Dialog State
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedKYCRequest, setSelectedKYCRequest] = useState<any>(null);
  const [rejectionReasons, setRejectionReasons] = useState<{[key: string]: string}>({});
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    if (tabValue === 1) {
      fetchUsers();
    } else if (tabValue === 2) {
      fetchPendingKYCRequests();
    } else if (tabValue === 3) {
      fetchPendingServices();
    } else if (tabValue === 4) {
      fetchAnalytics();
    } else if (tabValue === 5) {
      fetchWalletTransactions();
    } else if (tabValue === 6) {
      fetchPayments();
    } else if (tabValue === 7) {
      fetchBookings();
    }
  }, [tabValue]);
  
  const fetchPendingServices = async () => {
    setPendingServicesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/services?isApproved=false', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPendingServices(data.data);
        } else {
          setPendingServices([]);
        }
      }
    } catch (error) {
      setPendingServices([]);
    } finally {
      setPendingServicesLoading(false);
    }
  };
  
  const handleApproveService = async (serviceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/services/${serviceId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchPendingServices();
        fetchDashboardStats();
      }
    } catch (error) {
      // Handle error
    }
  };
  
  const handleRejectService = async (serviceId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/services/${serviceId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      
      if (response.ok) {
        fetchPendingServices();
        fetchDashboardStats();
      }
    } catch (error) {
      // Handle error
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        // Filter out ADMIN users from the list (only show CUSTOMER and PROVIDER)
        const filteredUsers = data.data.filter((user: any) => user.role !== 'ADMIN');
        
        // Debug: Log first user to see field names
        if (filteredUsers.length > 0) {
        }
        
        setUsers(filteredUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Fetch data when tabs are selected
    if (newValue === 1) {
      fetchUsers();
    } else if (newValue === 2) {
      fetchPendingKYCRequests();
    } else if (newValue === 3) {
      fetchPendingServices();
    } else if (newValue === 4) {
      fetchAnalytics();
    } else if (newValue === 5) {
      fetchWalletTransactions();
    } else if (newValue === 6) {
      fetchPayments();
    } else if (newValue === 7) {
      fetchBookings();
    }
  };
  
  const fetchWalletTransactions = async () => {
    setWalletTransactionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/transactions/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setWalletTransactions(data.data);
      } else {
        setWalletTransactions([]);
      }
    } catch (error) {
      setWalletTransactions([]);
    } finally {
      setWalletTransactionsLoading(false);
    }
  };
  
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/transactions/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setPayments(data.data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/bookings', {
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

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/commission/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setCommissionStats(data.data);
        if (data.data.averageCommissionRate) {
          setCommissionRate(data.data.averageCommissionRate);
        }
      }
    } catch (error) {
      // Handle error
    }
  };
  
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchUsers();
        fetchDashboardStats();
      }
    } catch (error) {
      // Handle error
    }
  };

  const fetchPendingKYCRequests = async () => {
    setPendingKYCRequestsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8080/api/admin/kyc/pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        setPendingKYCRequests([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setPendingKYCRequests(data.data);
      } else {
        setPendingKYCRequests([]);
      }
    } catch (error) {
      setPendingKYCRequests([]);
    } finally {
      setPendingKYCRequestsLoading(false);
    }
  };

  const handleApproveDocument = async (documentType: string, documentId: string) => {
    if (!user || !documentId) return;
    
    setReviewLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = `http://localhost:8080/api/kyc/${documentType}/${documentId}/approve?adminUserId=${user.id}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`${documentType.toUpperCase()} document approved successfully!`);
        fetchPendingKYCRequests();
        if (selectedKYCRequest) {
          const updatedRequest = { ...selectedKYCRequest };
          if (documentType === 'aadhaar') {
            updatedRequest.aadhaarStatus = 'VERIFIED';
          } else if (documentType === 'pan') {
            updatedRequest.panStatus = 'VERIFIED';
          } else if (documentType === 'selfie') {
            updatedRequest.selfieStatus = 'VERIFIED';
          }
          setSelectedKYCRequest(updatedRequest);
        }
      } else {
        alert(`Error: ${data.message || 'Failed to approve document'}`);
      }
    } catch (error) {
      alert('Error approving document. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRejectDocument = async (documentType: string, documentId: string, rejectionReason: string) => {
    if (!user || !documentId || !rejectionReason) return;
    
    setReviewLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = `http://localhost:8080/api/kyc/${documentType}/${documentId}/reject?adminUserId=${user.id}&rejectionReason=${encodeURIComponent(rejectionReason)}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`${documentType.toUpperCase()} document rejected.`);
        fetchPendingKYCRequests();
        if (selectedKYCRequest) {
          const updatedRequest = { ...selectedKYCRequest };
          if (documentType === 'aadhaar') {
            updatedRequest.aadhaarStatus = 'REJECTED';
          } else if (documentType === 'pan') {
            updatedRequest.panStatus = 'REJECTED';
          } else if (documentType === 'selfie') {
            updatedRequest.selfieStatus = 'REJECTED';
          }
          setSelectedKYCRequest(updatedRequest);
        }
      } else {
        alert(`Error: ${data.message || 'Failed to reject document'}`);
      }
    } catch (error) {
      alert('Error rejecting document. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const normalizeFilePath = (filePath?: string) => {
    if (!filePath) return '';
    let normalized = filePath.replace(/\\/g, '/').trim();
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      try {
        const url = new URL(normalized);
        normalized = url.pathname || '';
      } catch (error) {
        // Keep original if URL parsing fails
      }
    }
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1);
    }
    return normalized;
  };

  const getKycImageUrls = (docType: string, userId: string, imagePath?: string) => {
    const baseUrl = 'http://localhost:8080';
    let primary = '';
    if (docType === 'aadhaar_front') {
      primary = `${baseUrl}/api/kyc/aadhaar/${userId}/image/front`;
    } else if (docType === 'aadhaar_back') {
      primary = `${baseUrl}/api/kyc/aadhaar/${userId}/image/back`;
    } else if (docType === 'pan') {
      primary = `${baseUrl}/api/kyc/pan/${userId}/image`;
    } else if (docType === 'selfie') {
      primary = `${baseUrl}/api/kyc/selfie/${userId}/image`;
    }

    const normalizedPath = normalizeFilePath(imagePath);
    const fallback = normalizedPath
      ? `${baseUrl}/api/files/serve?filePath=${encodeURIComponent(normalizedPath)}`
      : '';

    return { primary, fallback };
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    const fallback = target.dataset.fallback;
    if (fallback && target.src !== fallback) {
      target.src = fallback;
      return;
    }
    target.onerror = null;
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
  };

  const handleDownloadImage = async (imagePath: string, fileName: string, userId: string, docType: string) => {
    try {
      const token = localStorage.getItem('token');
      let url = '';
      
      // Use database collection endpoints
      if (docType === 'aadhaar_front') {
        url = `http://localhost:8080/api/kyc/aadhaar/${userId}/image/front`;
      } else if (docType === 'aadhaar_back') {
        url = `http://localhost:8080/api/kyc/aadhaar/${userId}/image/back`;
      } else if (docType === 'pan') {
        url = `http://localhost:8080/api/kyc/pan/${userId}/image`;
      } else if (docType === 'selfie') {
        url = `http://localhost:8080/api/kyc/selfie/${userId}/image`;
      } else {
        // Fallback to old method
        url = `http://localhost:8080/api/kyc/download/image?path=${encodeURIComponent(imagePath)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${fileName}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('Error downloading image. Please try again.');
      }
    } catch (error) {
      alert('Error downloading image. Please try again.');
    }
  };

  const handleDownloadAllDocuments = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:8080/api/kyc/download/${userId}/pdf`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `KYC_Documents_${userId}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('Error downloading documents. Please try again.');
      }
    } catch (error) {
      alert('Error downloading documents. Please try again.');
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

  const aadhaarFrontImage = selectedKYCRequest
    ? getKycImageUrls('aadhaar_front', selectedKYCRequest.userId, selectedKYCRequest.aadhaarFrontUrl)
    : null;
  const aadhaarBackImage = selectedKYCRequest
    ? getKycImageUrls('aadhaar_back', selectedKYCRequest.userId, selectedKYCRequest.aadhaarBackUrl)
    : null;
  const panImage = selectedKYCRequest
    ? getKycImageUrls('pan', selectedKYCRequest.userId, selectedKYCRequest.panImageUrl)
    : null;
  const selfieImage = selectedKYCRequest
    ? getKycImageUrls('selfie', selectedKYCRequest.userId, selectedKYCRequest.selfieImageUrl)
    : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar variant="dashboard" position="static" title="Admin Dashboard" />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white' }}>
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
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
            <Tab icon={<People />} label="Users" iconPosition="start" />
            <Tab icon={<Security />} label="KYC Verification" iconPosition="start" />
            <Tab icon={<Assignment />} label="Services" iconPosition="start" />
            <Tab icon={<Assessment />} label="Analytics" iconPosition="start" />
            <Tab icon={<AccountBalanceWallet />} label="Wallet Transactions" iconPosition="start" />
            <Tab icon={<Payment />} label="Payments" iconPosition="start" />
            <Tab icon={<ShoppingCart />} label="Bookings/Orders" iconPosition="start" />
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
                          sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}
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
                  All Users ({users.length})
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
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <CircularProgress sx={{ my: 2 }} />
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              No users found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user: any) => {
                          // Handle both field name variations (isActive/active, isVerified/verified)
                          const isActive = user.isActive !== undefined ? user.isActive : user.active !== undefined ? user.active : true;
                          const isVerified = user.isVerified !== undefined ? user.isVerified : user.verified !== undefined ? user.verified : false;
                          
                          return (
                            <TableRow key={user.id}>
                              <TableCell>{user.name || 'N/A'}</TableCell>
                              <TableCell>{user.email || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={user.role || 'CUSTOMER'}
                                  size="small"
                                  color={
                                    user.role === 'ADMIN'
                                      ? 'error'
                                      : user.role === 'PROVIDER'
                                      ? 'primary'
                                      : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={isActive ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={isActive ? 'success' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                {isVerified ? (
                                  <CheckCircle color="success" />
                                ) : (
                                  <Cancel color="error" />
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color={isActive ? 'error' : 'success'}
                                  onClick={() => handleToggleUserStatus(user.id)}
                                >
                                  {isActive ? 'Block' : 'Unblock'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
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
                  {pendingKYCRequests.length} KYC verification requests pending review
                </Alert>
                {pendingKYCRequestsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : pendingKYCRequests.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Security sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No pending KYC requests
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      All KYC verifications are up to date
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>User</strong></TableCell>
                          <TableCell><strong>Role</strong></TableCell>
                          <TableCell><strong>Documents</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Submitted</strong></TableCell>
                          <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingKYCRequests.map((request: any) => (
                          <TableRow key={request.userId}>
                            <TableCell>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {request.userName || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {request.userEmail}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={request.userRole || 'N/A'}
                                size="small"
                                color={request.userRole === 'PROVIDER' ? 'primary' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {request.hasAadhaar && (
                                  <Chip label="Aadhaar" size="small" color={request.aadhaarStatus === 'PENDING' ? 'warning' : 'info'} />
                                )}
                                {request.hasPAN && (
                                  <Chip label="PAN" size="small" color={request.panStatus === 'PENDING' ? 'warning' : 'info'} />
                                )}
                                {request.hasSelfie && (
                                  <Chip label="Selfie" size="small" color={request.selfieStatus === 'PENDING' ? 'warning' : 'info'} />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={request.overallStatus || 'PENDING'}
                                size="small"
                                color={
                                  request.overallStatus === 'UNDER_REVIEW' ? 'info' :
                                  request.overallStatus === 'PENDING' ? 'warning' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {request.earliestSubmittedAt 
                                  ? new Date(request.earliestSubmittedAt).toLocaleDateString()
                                  : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                  setSelectedKYCRequest(request);
                                  setRejectionReasons({});
                                  setReviewDialogOpen(true);
                                }}
                                sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}
                              >
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Services Tab */}
          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Pending Service Approvals
                </Typography>
                {pendingServicesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : pendingServices.length === 0 ? (
                  <Alert severity="info">No pending services for approval</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Service Name</strong></TableCell>
                          <TableCell><strong>Provider</strong></TableCell>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell><strong>Price</strong></TableCell>
                          <TableCell><strong>Location</strong></TableCell>
                          <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>{service.serviceName}</TableCell>
                            <TableCell>{service.providerName}</TableCell>
                            <TableCell>{service.category}</TableCell>
                            <TableCell>₹{service.basePrice || service.price}</TableCell>
                            <TableCell>{service.city || service.serviceArea}</TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleApproveService(service.id)}
                                sx={{ mr: 1 }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleRejectService(service.id, reason);
                                }}
                              >
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                      ₹{commissionStats.totalRevenue ? commissionStats.totalRevenue.toLocaleString() : stats.totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All time platform revenue
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Total Commission
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                      ₹{commissionStats.totalCommission ? commissionStats.totalCommission.toLocaleString() : '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Commission earned
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Commission Rate
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {commissionStats.averageCommissionRate ? commissionStats.averageCommissionRate.toFixed(1) : '10.0'}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average commission rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                      Commission Control
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TextField
                        type="number"
                        label="Commission Rate (%)"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 10)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        sx={{ width: 200 }}
                      />
                      <Button variant="contained" color="primary">
                        Update Rate
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        Standard commission rate: 10%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                      Total Transactions
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {commissionStats.totalTransactions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All payment transactions
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

          {/* Wallet Transactions Tab */}
          <TabPanel value={tabValue} index={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Wallet Transactions
                </Typography>
                {walletTransactionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : walletTransactions.length === 0 ? (
                  <Alert severity="info">No wallet transactions found</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>User ID</strong></TableCell>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell><strong>Amount</strong></TableCell>
                          <TableCell><strong>Balance Before</strong></TableCell>
                          <TableCell><strong>Balance After</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {walletTransactions.map((transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.userId}</TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.transactionType || 'N/A'}
                                size="small"
                                color={transaction.transactionType === 'DEPOSIT' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell>₹{transaction.amount?.toLocaleString() || '0'}</TableCell>
                            <TableCell>₹{transaction.balanceBefore?.toLocaleString() || '0'}</TableCell>
                            <TableCell>₹{transaction.balanceAfter?.toLocaleString() || '0'}</TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.transactionStatus || 'PENDING'}
                                size="small"
                                color={transaction.transactionStatus === 'SUCCESS' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Payments Tab */}
          <TabPanel value={tabValue} index={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Payment Transactions
                </Typography>
                {paymentsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : payments.length === 0 ? (
                  <Alert severity="info">No payment transactions found</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Booking ID</strong></TableCell>
                          <TableCell><strong>Customer</strong></TableCell>
                          <TableCell><strong>Provider</strong></TableCell>
                          <TableCell><strong>Amount</strong></TableCell>
                          <TableCell><strong>Commission</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.bookingId || 'N/A'}</TableCell>
                            <TableCell>{payment.customerId || 'N/A'}</TableCell>
                            <TableCell>{payment.providerId || 'N/A'}</TableCell>
                            <TableCell>₹{payment.totalAmount?.toLocaleString() || '0'}</TableCell>
                            <TableCell>₹{payment.commissionDeducted?.toLocaleString() || '0'}</TableCell>
                            <TableCell>
                              <Chip
                                label={payment.paymentStatus || 'PENDING'}
                                size="small"
                                color={payment.paymentStatus === 'PAID' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Bookings/Orders Tab */}
          <TabPanel value={tabValue} index={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  All Bookings/Orders
                </Typography>
                {bookingsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : bookings.length === 0 ? (
                  <Alert severity="info">No bookings found</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Booking ID</strong></TableCell>
                          <TableCell><strong>Customer</strong></TableCell>
                          <TableCell><strong>Provider</strong></TableCell>
                          <TableCell><strong>Service</strong></TableCell>
                          <TableCell><strong>Address</strong></TableCell>
                          <TableCell><strong>Booking Date</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Price</strong></TableCell>
                          <TableCell><strong>Payment Status</strong></TableCell>
                          <TableCell><strong>Created At</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bookings.map((booking: any) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {booking.id?.substring(0, 8)}...
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {booking.userId || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {booking.providerId || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {booking.serviceName || booking.service || 'N/A'}
                                </Typography>
                                {booking.serviceCategory && (
                                  <Typography variant="caption" color="text.secondary">
                                    {booking.serviceCategory}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">
                                  {booking.address || 'N/A'}
                                </Typography>
                                {(booking.city || booking.pincode) && (
                                  <Typography variant="caption" color="text.secondary">
                                    {booking.city || ''} {booking.pincode || ''}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {booking.bookingDate 
                                  ? new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'N/A'}
                              </Typography>
                              {booking.scheduledDate && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Scheduled: {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={booking.status || 'PENDING'}
                                size="small"
                                color={
                                  booking.status === 'COMPLETED' ? 'success' :
                                  booking.status === 'CANCELLED' ? 'error' :
                                  booking.status === 'IN_PROGRESS' ? 'warning' :
                                  booking.status === 'CONFIRMED' ? 'info' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ₹{booking.totalPrice?.toLocaleString() || booking.price?.toLocaleString() || '0'}
                              </Typography>
                              {booking.commission && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Commission: ₹{booking.commission.toLocaleString()}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={booking.paymentStatus || 'PENDING'}
                                size="small"
                                color={booking.paymentStatus === 'PAID' ? 'success' : 'warning'}
                              />
                              {booking.paymentMethod && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  {booking.paymentMethod}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {booking.createdAt 
                                  ? new Date(booking.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'N/A'}
                              </Typography>
                              {booking.createdAt && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {new Date(booking.createdAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </Paper>
      </Container>
      
      {/* KYC Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Review KYC Documents
            </Typography>
            <IconButton onClick={() => setReviewDialogOpen(false)} size="small">
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedKYCRequest && (
            <Box>
              {/* User Info */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {selectedKYCRequest.userName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {selectedKYCRequest.userEmail}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: {selectedKYCRequest.userPhone || 'N/A'}
                </Typography>
                <Chip
                  label={selectedKYCRequest.userRole}
                  size="small"
                  color={selectedKYCRequest.userRole === 'PROVIDER' ? 'primary' : 'default'}
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* Aadhaar Document */}
              {selectedKYCRequest.hasAadhaar && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Aadhaar Document
                    <Chip
                      label={selectedKYCRequest.aadhaarStatus}
                      size="small"
                      color={selectedKYCRequest.aadhaarStatus === 'PENDING' ? 'warning' : 'info'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {selectedKYCRequest.aadhaarFrontUrl && (
                      <Grid item xs={6}>
                        <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              Front
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadImage(selectedKYCRequest.aadhaarFrontUrl, 'Aadhaar_Front', selectedKYCRequest.userId, 'aadhaar_front')}
                              sx={{ color: '#3B82F6' }}
                            >
                              <Download fontSize="small" />
                            </IconButton>
                          </Box>
                          <img
                            src={aadhaarFrontImage?.primary || ''}
                            data-fallback={aadhaarFrontImage?.fallback || ''}
                            alt="Aadhaar Front"
                            style={{ width: '100%', height: 'auto', borderRadius: 4, maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                            onError={handleImageError}
                          />
                        </Box>
                      </Grid>
                    )}
                    {selectedKYCRequest.aadhaarBackUrl && (
                      <Grid item xs={6}>
                        <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              Back
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadImage(selectedKYCRequest.aadhaarBackUrl, 'Aadhaar_Back', selectedKYCRequest.userId, 'aadhaar_back')}
                              sx={{ color: '#3B82F6' }}
                            >
                              <Download fontSize="small" />
                            </IconButton>
                          </Box>
                          <img
                            src={aadhaarBackImage?.primary || ''}
                            data-fallback={aadhaarBackImage?.fallback || ''}
                            alt="Aadhaar Back"
                            style={{ width: '100%', height: 'auto', borderRadius: 4, maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                            onError={handleImageError}
                          />
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                  {selectedKYCRequest.aadhaarStatus === 'PENDING' && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApproveDocument('aadhaar', selectedKYCRequest.aadhaarId)}
                        disabled={reviewLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) {
                            handleRejectDocument('aadhaar', selectedKYCRequest.aadhaarId, reason);
                          }
                        }}
                        disabled={reviewLoading}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* PAN Document */}
              {selectedKYCRequest.hasPAN && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    PAN Document
                    <Chip
                      label={selectedKYCRequest.panStatus}
                      size="small"
                      color={selectedKYCRequest.panStatus === 'PENDING' ? 'warning' : 'info'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {selectedKYCRequest.panImageUrl && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, maxWidth: 400 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            PAN Document
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadImage(selectedKYCRequest.panImageUrl, 'PAN', selectedKYCRequest.userId, 'pan')}
                            sx={{ color: '#3B82F6' }}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Box>
                        <img
                          src={panImage?.primary || ''}
                          data-fallback={panImage?.fallback || ''}
                          alt="PAN"
                          style={{ width: '100%', height: 'auto', borderRadius: 4, maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                          onError={handleImageError}
                        />
                      </Box>
                    </Box>
                  )}
                  {selectedKYCRequest.panStatus === 'PENDING' && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApproveDocument('pan', selectedKYCRequest.panId)}
                        disabled={reviewLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) {
                            handleRejectDocument('pan', selectedKYCRequest.panId, reason);
                          }
                        }}
                        disabled={reviewLoading}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Selfie Document */}
              {selectedKYCRequest.hasSelfie && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Selfie Document
                    <Chip
                      label={selectedKYCRequest.selfieStatus}
                      size="small"
                      color={selectedKYCRequest.selfieStatus === 'PENDING' ? 'warning' : 'info'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {selectedKYCRequest.selfieImageUrl && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, maxWidth: 400 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Selfie
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadImage(selectedKYCRequest.selfieImageUrl, 'Selfie', selectedKYCRequest.userId, 'selfie')}
                            sx={{ color: '#3B82F6' }}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Box>
                        <img
                          src={selfieImage?.primary || ''}
                          data-fallback={selfieImage?.fallback || ''}
                          alt="Selfie"
                          style={{ width: '100%', height: 'auto', borderRadius: 4, maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                          onError={handleImageError}
                        />
                      </Box>
                    </Box>
                  )}
                  {selectedKYCRequest.selfieStatus === 'PENDING' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApproveDocument('selfie', selectedKYCRequest.selfieId)}
                        disabled={reviewLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) {
                            handleRejectDocument('selfie', selectedKYCRequest.selfieId, reason);
                          }
                        }}
                        disabled={reviewLoading}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
