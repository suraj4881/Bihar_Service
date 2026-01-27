import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Paper,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  CameraAlt,
  Image as ImageIcon,
  Lock,
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  LocationOn,
  Home,
  Verified,
  ArrowBack,
  Security,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import Logo from '../components/Logo';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ✅ Sync language on mount from localStorage
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoMenuAnchor, setPhotoMenuAnchor] = useState<null | HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const photoMenuOpen = Boolean(photoMenuAnchor);
  
  // Phone number change states - New flow: Old phone OTP -> Transaction verification -> Email OTP
  const [phoneChangeDialogOpen, setPhoneChangeDialogOpen] = useState(false);
  const [phoneChangeStep, setPhoneChangeStep] = useState(0); // 0: Old phone OTP, 1: Transaction/Email OTP, 2: New phone
  const [oldPhoneOTP, setOldPhoneOTP] = useState(['', '', '', '', '', '']);
  const [oldPhoneOTPSent, setOldPhoneOTPSent] = useState(false);
  const [oldPhoneVerified, setOldPhoneVerified] = useState(false);
  const [useTransactionVerification, setUseTransactionVerification] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionVerified, setTransactionVerified] = useState(false);
  const [emailOTP, setEmailOTP] = useState(['', '', '', '', '', '']);
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');

  // Profile form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });

  // Password change data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        pincode: user.pincode || '',
      });
      setProfilePhoto(user.profilePhoto || null);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  // Photo menu handlers
  const handlePhotoMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setPhotoMenuAnchor(event.currentTarget);
  };

  const handlePhotoMenuClose = () => {
    setPhotoMenuAnchor(null);
  };

  // Photo upload handler - File upload
  const handlePhotoClick = () => {
    handlePhotoMenuClose();
    fileInputRef.current?.click();
  };

  // Camera capture handler
  const handleCameraClick = async () => {
    try {
      setError('');
      setCameraReady(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      
      setCameraStream(stream);
      setCameraDialogOpen(true);
    } catch (error: any) {
      let errorMessage = 'Camera access denied. Please allow camera permission.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      setError(errorMessage);
      setCameraDialogOpen(false);
    }
  };

  // Effect to set video stream when dialog opens
  useEffect(() => {
    if (cameraDialogOpen && cameraStream) {
      // Wait for dialog to fully render before setting video stream
      const timer = setTimeout(() => {
        if (videoRef.current && cameraStream) {
          const video = videoRef.current;
          
          // Set srcObject
          video.srcObject = cameraStream;
          
          // Force play
          video.play()
            .then(() => {
              setCameraReady(true);
            })
            .catch(err => {
              console.error('❌ Video play error:', err);
              setError('Failed to start camera preview. Please check camera permissions.');
              setCameraReady(false);
            });
          
          const handleLoadedMetadata = () => {
            video.play().catch(() => {
              // Ignore play errors
            });
          };

          const handleCanPlay = () => {
            setCameraReady(true);
          };

          const handlePlaying = () => {
            setCameraReady(true);
          };

          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('canplay', handleCanPlay);
          video.addEventListener('playing', handlePlaying);
          
          // Cleanup
          return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('playing', handlePlaying);
          };
        }
      }, 100); // Small delay to ensure dialog is rendered
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      setCameraReady(false);
    }
    
    // Cleanup when dialog closes
    return () => {
      if (!cameraDialogOpen && videoRef.current) {
        const video = videoRef.current;
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
        setCameraReady(false);
      }
    };
  }, [cameraDialogOpen, cameraStream]);

  // Capture photo from camera
  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready - wait a bit if not ready
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      setError('Camera is loading. Please wait a moment...');
      // Wait and retry
      setTimeout(() => {
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          handleCapturePhoto();
        } else {
          setError('Camera is not ready. Please try again.');
        }
      }, 500);
      return;
    }

    // Check if video has valid dimensions
    if (!video.videoWidth || !video.videoHeight) {
      setError('Camera video not loaded. Please wait a moment.');
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      setError('Failed to capture photo. Please try again.');
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas (mirror it back since we flipped it for display)
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
      
      // Convert to blob and upload
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Failed to capture photo. Please try again.');
          return;
        }

        // Stop camera stream first
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
        setCameraDialogOpen(false);
        setCameraReady(false);
        
        // Create file from blob and upload
        const file = new File([blob], `profile-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        await uploadPhotoFile(file);
      }, 'image/jpeg', 0.9);
    } catch (error: any) {
      setError('Failed to capture photo: ' + (error.message || 'Unknown error'));
    }
  };

  // Close camera dialog
  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraDialogOpen(false);
  };

  // Handle file input change
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadPhotoFile(file);
  };

  // Upload photo file (used by both file upload and camera)
  const uploadPhotoFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setPhotoUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`http://localhost:8080/api/users/${user?.id}/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      if (data.success) {
        const photoUrl = data.data.profilePhoto;
        setProfilePhoto(photoUrl);
        
        // Update localStorage with new photo URL
        const updatedUser = { ...user, profilePhoto: photoUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update AuthContext user state immediately
        if (user) {
          // Trigger a re-fetch of user data from backend to ensure sync
          try {
            const token = localStorage.getItem('token');
            const userResponse = await fetch(`http://localhost:8080/api/users/${user.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success && userData.data) {
                localStorage.setItem('user', JSON.stringify(userData.data));
                // Force re-render by updating state
                setProfilePhoto(userData.data.profilePhoto || photoUrl);
              }
            }
          } catch (err) {
          }
        }
        
        setSuccess('✅ Profile photo updated successfully!');
        // Don't reload immediately, let user see the success message
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to upload photo');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:8080/api/users/${user?.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email, // Email is read-only, but send it anyway
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.data));
        setSuccess('✅ Profile updated successfully!');
        setEditMode(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Phone number change handlers - New flow
  const handleSendOTPToOldPhone = async () => {
    if (!user?.id) {
      setError('User information not available. Please login again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/send-otp-old-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setOldPhoneOTPSent(true);
        // Show OTP in development mode
        const otp = data.data?.otp;
        if (otp) {
          alert(`🔑 OTP (Development Mode): ${otp}\n\nNote: In production, OTP will be sent via SMS.`);
        }
        setSuccess(`✅ OTP sent to your registered phone number. ${otp ? `OTP: ${otp} (Check alert)` : 'Check backend logs for OTP.'}`);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOldPhoneOTP = async () => {
    const otpValue = oldPhoneOTP.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user?.id}/verify-old-phone-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: otpValue }),
      });

      const data = await response.json();
      if (data.success && data.data?.verified) {
        setOldPhoneVerified(true);
        setPhoneChangeStep(2); // Move to new phone entry
        setSuccess('✅ Phone OTP verified! Enter your new phone number');
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTransactionVerification = async () => {
    setUseTransactionVerification(true);
    setPhoneChangeStep(1);
  };

  const handleVerifyTransactionAmount = async () => {
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid transaction amount');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user?.id}/verify-transaction-amount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (data.success && data.data?.verified) {
        setTransactionVerified(true);
        setSuccess('✅ Transaction amount verified! Sending OTP to your email...');
        // Automatically send email OTP
        await handleSendEmailOTPForPhoneChange();
      } else {
        setError(data.message || 'Invalid transaction amount');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify transaction amount. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOTPForPhoneChange = async () => {
    if (!user?.id) {
      setError('User information not available.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/send-email-otp-phone-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEmailOTPSent(true);
        // Show OTP in development mode
        const otp = data.data?.otp;
        if (otp) {
          alert(`🔑 Email OTP (Development Mode): ${otp}\n\nNote: In production, OTP will be sent via email.`);
        }
        setSuccess(`✅ OTP sent to your email address. ${otp ? `OTP: ${otp} (Check alert)` : 'Check backend logs for OTP.'}`);
        setPhoneChangeStep(2); // Move to new phone entry
      } else {
        setError(data.message || 'Failed to send email OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send email OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTPAndChangePhone = async () => {
    const otpValue = emailOTP.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    if (newPhoneNumber.length !== 10) {
      setError('Please enter valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user?.id}/change-phone-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber: newPhoneNumber, emailOTP: otpValue }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('✅ Phone number updated successfully!');
        localStorage.setItem('user', JSON.stringify(data.data));
        resetPhoneChangeFlow();
        setTimeout(() => {
          setPhoneChangeDialogOpen(false);
          window.location.reload();
        }, 1500);
      } else {
        setError(data.message || 'Invalid OTP or phone number');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneChangeFlow = () => {
    setPhoneChangeStep(0);
    setOldPhoneOTP(['', '', '', '', '', '']);
    setOldPhoneOTPSent(false);
    setOldPhoneVerified(false);
    setUseTransactionVerification(false);
    setTransactionAmount('');
    setTransactionVerified(false);
    setEmailOTP(['', '', '', '', '', '']);
    setEmailOTPSent(false);
    setNewPhoneNumber('');
  };

  const handleOTPInputChange = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value.length > 1) return;
    setter(prev => {
      const newOTP = [...prev];
      newOTP[index] = value;
      return newOTP;
    });
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };


  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user?.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);

      if (data.success) {
        setSuccess('✅ Password changed successfully!');
        setPasswordDialogOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        pincode: user.pincode || '',
      });
    }
    setEditMode(false);
    setError('');
  };


  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Please login to view your profile.</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      flexGrow: 1, 
      minHeight: '100vh',
      bgcolor: 'background.default',
    }}>
      {/* Modern Header */}
      <AppBar variant="simple" position="sticky" showBackButton />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#1F2937' }}>
            My Profile
          </Typography>
          <Typography variant="body1" sx={{ color: '#6B7280' }}>
            Manage your personal information and account settings
          </Typography>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Profile Header Card */}
        <Card 
          elevation={3}
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              zIndex: 0,
            }
          }}
        >
          <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={profilePhoto ? (profilePhoto.startsWith('http') ? profilePhoto : `http://localhost:8080/api/files/serve?filePath=${encodeURIComponent(profilePhoto)}`) : undefined}
                    sx={{
                      width: 140,
                      height: 140,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      fontSize: '3.5rem',
                      border: '5px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {!profilePhoto && user.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <IconButton
                    onClick={handlePhotoMenuClick}
                    disabled={photoUploading}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: '#fff',
                      color: '#667eea',
                      width: 44,
                      height: 44,
                      border: '3px solid #fff',
                      '&:hover': { 
                        bgcolor: '#f0f0f0',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      },
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.2s ease',
                    }}
                    title="Change Photo"
                  >
                    {photoUploading ? (
                      <CircularProgress size={20} sx={{ color: '#667eea' }} />
                    ) : (
                      <PhotoCamera sx={{ fontSize: 22 }} />
                    )}
                  </IconButton>
                </Box>
              
              {/* Photo Menu Dropdown */}
              <Menu
                anchorEl={photoMenuAnchor}
                open={photoMenuOpen}
                onClose={handlePhotoMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    handlePhotoMenuClose();
                    handleCameraClick();
                  }}
                  disabled={photoUploading}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <CameraAlt sx={{ color: '#667eea', fontSize: 24 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Take Photo"
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    }}
                  />
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={handlePhotoClick}
                  disabled={photoUploading}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <ImageIcon sx={{ color: '#10B981', fontSize: 24 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Upload Photo"
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    }}
                  />
                </MenuItem>
              </Menu>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                    {user.name}
                  </Typography>
                  {user.isVerified && (
                    <Chip
                      icon={<Verified sx={{ color: '#fff !important' }} />}
                      label="Verified"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        color: '#fff',
                        fontWeight: 600,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                      size="small"
                    />
                  )}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  <Email sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  {user.email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<Phone sx={{ fontSize: 16 }} />}
                    label={user.phone || 'Not set'}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontWeight: 500,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                    size="small"
                  />
                  <Chip
                    label={`Member since ${new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontWeight: 500,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                    size="small"
                  />
                  {user.totalBookings > 0 && (
                    <Chip
                      label={`${user.totalBookings} Bookings`}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        fontWeight: 500,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                      size="small"
                    />
                  )}
                </Box>
              </Box>
              <Box>
                {!editMode ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    sx={{
                      bgcolor: '#fff',
                      color: '#667eea',
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {t('editProfile') || 'Edit Profile'}
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                      sx={{
                        bgcolor: '#10B981',
                        color: '#fff',
                        borderRadius: 2,
                        px: 3,
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        '&:hover': {
                          bgcolor: '#059669',
                          boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                        },
                      }}
                    >
                      {loading ? 'Saving...' : (t('save') || 'Save')}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      disabled={loading}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        color: '#fff',
                        borderRadius: 2,
                        px: 3,
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#fff',
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card 
          elevation={2}
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ 
            p: 3,
            bgcolor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Person sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1F2937',
                }}
              >
                {t('personal Information') || 'Personal Information'}
              </Typography>
            </Box>
          </Box>
          <CardContent sx={{ p: 3 }}>
            
            <Grid container spacing={3}>
              {/* Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: !editMode ? '#F9FAFB' : '#fff',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Email - NON-EDITABLE */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  disabled={true}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#F9FAFB',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Email cannot be changed"
                />
              </Grid>

              {/* Phone - Can be changed with OTP verification */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  disabled={true}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#F9FAFB',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: '#667eea' }} />
                        <Typography sx={{ ml: 1, color: '#6B7280', fontWeight: 500 }}>+91</Typography>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={() => setPhoneChangeDialogOpen(true)}
                          sx={{ 
                            textTransform: 'none', 
                            fontSize: '0.875rem',
                            color: '#667eea',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: 'rgba(102, 126, 234, 0.1)',
                            },
                          }}
                        >
                          Change
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Click Change to update your phone number"
                />
              </Grid>

              {/* City */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: !editMode ? '#F9FAFB' : '#fff',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  multiline
                  rows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: !editMode ? '#F9FAFB' : '#fff',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <Home sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Pincode */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: !editMode ? '#F9FAFB' : '#fff',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#667eea',
                    },
                  }}
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>

              {/* State */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State"
                  value="Bihar"
                  disabled={true}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#F9FAFB',
                    },
                  }}
                  helperText="Service available in Bihar only"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card 
          elevation={2}
          sx={{ 
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ 
            p: 3,
            bgcolor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Security sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1F2937',
                }}
              >
                {t('security') || 'Security'}
              </Typography>
            </Box>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, color: '#1F2937' }}>
                  Password
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Last changed on {new Date(user.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Lock />}
                onClick={() => setPasswordDialogOpen(true)}
                sx={{ 
                  textTransform: 'none',
                  bgcolor: '#EF4444',
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#DC2626',
                  },
                }}
              >
                Change Password
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Must be at least 6 characters"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#FF6B35',
              '&:hover': { backgroundColor: '#E64A19' },
            }}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Camera Capture Dialog */}
      <Dialog
        open={cameraDialogOpen}
        onClose={handleCloseCamera}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>
          Take Profile Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 300,
                height: 400,
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', // Egg shape
                overflow: 'hidden',
                bgcolor: '#000',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  transform: 'scaleX(-1)', // Mirror effect for better UX
                  backgroundColor: '#000',
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play()
                      .then(() => {
                        setCameraReady(true);
                      })
                      .catch(err => {
                      });
                  }
                }}
                onCanPlay={() => {
                  setCameraReady(true);
                }}
                onPlaying={() => {
                  setCameraReady(true);
                }}
                onError={(e) => {
                  setError('Camera error. Please check permissions and try again.');
                  setCameraReady(false);
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
              {cameraReady 
                ? 'Position yourself in the frame and click Capture'
                : 'Camera is loading... Please wait'}
            </Typography>
            {!cameraReady && (
              <CircularProgress size={24} sx={{ color: '#FF6B35' }} />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={handleCloseCamera}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCapturePhoto}
            variant="contained"
            startIcon={<CameraAlt />}
            disabled={!cameraReady || photoUploading}
            sx={{
              textTransform: 'none',
              background: cameraReady 
                ? 'linear-gradient(45deg, #FF6B35, #F7931E)'
                : 'rgba(0, 0, 0, 0.26)',
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              boxShadow: cameraReady 
                ? '0 4px 15px rgba(255, 107, 53, 0.4)'
                : 'none',
              '&:hover': {
                background: cameraReady
                  ? 'linear-gradient(45deg, #F7931E, #FF6B35)'
                  : 'rgba(0, 0, 0, 0.26)',
                boxShadow: cameraReady
                  ? '0 6px 20px rgba(255, 107, 53, 0.6)'
                  : 'none',
              },
              '&:disabled': {
                color: 'rgba(0, 0, 0, 0.26)',
              },
            }}
          >
            {photoUploading ? 'Uploading...' : cameraReady ? 'Capture Photo' : 'Loading Camera...'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Phone Number Change Dialog - New Flow */}
      <Dialog
        open={phoneChangeDialogOpen}
        onClose={() => {
          setPhoneChangeDialogOpen(false);
          resetPhoneChangeFlow();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color="primary" />
            Change Phone Number
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={phoneChangeStep} sx={{ mt: 2, mb: 3 }}>
            <Step>
              <StepLabel>Verify Old Phone</StepLabel>
            </Step>
            <Step>
              <StepLabel>{useTransactionVerification ? 'Verify Transaction' : 'Email OTP'}</StepLabel>
            </Step>
            <Step>
              <StepLabel>New Phone</StepLabel>
            </Step>
          </Stepper>

          {/* Step 0: Verify Old Phone OTP */}
          {phoneChangeStep === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                We'll send an OTP to your current registered phone number to verify your identity.
              </Alert>
              {!oldPhoneOTPSent ? (
                <Box>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSendOTPToOldPhone}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  >
                    Send OTP to {formData.phone ? `+91 ${formData.phone.substring(0, 2)}XXXX${formData.phone.substring(6)}` : 'Registered Phone'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleUseTransactionVerification}
                    disabled={loading}
                  >
                    Phone Unavailable? Verify via Transaction
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Enter OTP sent to your registered phone number:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                    {oldPhoneOTP.map((digit, index) => (
                      <TextField
                        key={index}
                        id={`otp-old-${index}`}
                        value={digit}
                        onChange={(e) => handleOTPInputChange(index, e.target.value, setOldPhoneOTP)}
                        inputProps={{
                          maxLength: 1,
                          style: { textAlign: 'center', fontSize: '1.5rem' },
                        }}
                        sx={{ width: 50 }}
                      />
                    ))}
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleVerifyOldPhoneOTP}
                    disabled={loading || oldPhoneOTP.join('').length !== 6}
                    sx={{ mb: 1 }}
                  >
                    Verify OTP
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleSendOTPToOldPhone}
                    disabled={loading}
                    sx={{ mb: 1 }}
                  >
                    Resend OTP
                  </Button>
                  <Button
                    fullWidth
                    variant="text"
                    onClick={handleUseTransactionVerification}
                    disabled={loading}
                  >
                    Phone Unavailable? Verify via Transaction
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Step 1: Transaction Verification or Email OTP */}
          {phoneChangeStep === 1 && (
            <Box>
              {useTransactionVerification ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Enter the amount of your last completed transaction to verify your identity.
                  </Alert>
                  {!transactionVerified ? (
                    <Box>
                      <TextField
                        fullWidth
                        label="Last Transaction Amount (₹)"
                        type="number"
                        value={transactionAmount}
                        onChange={(e) => setTransactionAmount(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        helperText="Enter the exact amount from your last completed booking"
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleVerifyTransactionAmount}
                        disabled={loading || !transactionAmount}
                        sx={{ mb: 1 }}
                      >
                        Verify Transaction Amount
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          setPhoneChangeStep(0);
                          setUseTransactionVerification(false);
                        }}
                        disabled={loading}
                      >
                        Back to Phone OTP
                      </Button>
                    </Box>
                  ) : (
                    <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
                      Transaction verified! Sending OTP to your email...
                    </Alert>
                  )}
                </Box>
              ) : (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
                    Phone OTP verified! Enter your new phone number.
                  </Alert>
                  <TextField
                    fullWidth
                    label="New Phone Number"
                    value={newPhoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewPhoneNumber(value);
                    }}
                    inputProps={{ maxLength: 10 }}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                          <Typography sx={{ ml: 1 }}>+91</Typography>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Enter 10-digit phone number"
                  />
                  {!emailOTPSent ? (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSendEmailOTPForPhoneChange}
                      disabled={loading || newPhoneNumber.length !== 10}
                    >
                      Send OTP to Email
                    </Button>
                  ) : (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Enter OTP sent to your email ({user?.email}):
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                        {emailOTP.map((digit, index) => (
                          <TextField
                            key={index}
                            id={`otp-email-${index}`}
                            value={digit}
                            onChange={(e) => handleOTPInputChange(index, e.target.value, setEmailOTP)}
                            inputProps={{
                              maxLength: 1,
                              style: { textAlign: 'center', fontSize: '1.5rem' },
                            }}
                            sx={{ width: 50 }}
                          />
                        ))}
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleVerifyEmailOTPAndChangePhone}
                        disabled={loading || emailOTP.join('').length !== 6}
                        sx={{ mb: 1 }}
                      >
                        Verify & Update Phone
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleSendEmailOTPForPhoneChange}
                        disabled={loading}
                      >
                        Resend OTP
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Step 2: New Phone Entry (after email OTP sent) */}
          {phoneChangeStep === 2 && emailOTPSent && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Enter your new phone number and verify with the OTP sent to your email.
              </Alert>
              <TextField
                fullWidth
                label="New Phone Number"
                value={newPhoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setNewPhoneNumber(value);
                }}
                inputProps={{ maxLength: 10 }}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                      <Typography sx={{ ml: 1 }}>+91</Typography>
                    </InputAdornment>
                  ),
                }}
                helperText="Enter 10-digit phone number"
              />
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter OTP sent to your email ({user?.email}):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                {emailOTP.map((digit, index) => (
                  <TextField
                    key={index}
                    id={`otp-email-final-${index}`}
                    value={digit}
                    onChange={(e) => handleOTPInputChange(index, e.target.value, setEmailOTP)}
                    inputProps={{
                      maxLength: 1,
                      style: { textAlign: 'center', fontSize: '1.5rem' },
                    }}
                    sx={{ width: 50 }}
                  />
                ))}
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyEmailOTPAndChangePhone}
                disabled={loading || emailOTP.join('').length !== 6 || newPhoneNumber.length !== 10}
                sx={{ mb: 1 }}
              >
                Verify & Update Phone
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSendEmailOTPForPhoneChange}
                disabled={loading}
              >
                Resend OTP
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPhoneChangeDialogOpen(false);
              resetPhoneChangeFlow();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
