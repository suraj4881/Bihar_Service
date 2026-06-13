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
  Stack,
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
import { getApiUrl, getFileServeUrl } from '../utils/api';
import {
  sewaHeroBarGradient,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const profileFieldSx = {
  '& .MuiInputBase-input': { fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
} as const;

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

      const response = await fetch(getApiUrl(`users/${user?.id}/upload-photo`), {
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
            const userResponse = await fetch(getApiUrl(`users/${user.id}`), {
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

      const response = await fetch(getApiUrl(`users/${user?.id}/profile`), {
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
      const response = await fetch(getApiUrl(`users/${user.id}/send-otp-old-phone`), {
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
      const response = await fetch(getApiUrl(`users/${user?.id}/verify-old-phone-otp`), {
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
      const response = await fetch(getApiUrl(`users/${user?.id}/verify-transaction-amount`), {
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
      const response = await fetch(getApiUrl(`users/${user.id}/send-email-otp-phone-change`), {
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
      const response = await fetch(getApiUrl(`users/${user?.id}/change-phone-email-otp`), {
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
      const response = await fetch(getApiUrl(`users/${user?.id}/change-password`), {
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

  const resolvedProfilePhoto =
    profilePhoto && !profilePhoto.startsWith('http')
      ? getFileServeUrl(profilePhoto)
      : profilePhoto || undefined;

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

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        <Card
          sx={{
            mb: 3,
            p: { xs: 2.5, md: 4 },
            color: '#fff',
            background: sewaHeroBarGradient,
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 12px 40px rgba(0, 77, 64, 0.25)',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.12) 0%, transparent 42%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.35rem', sm: '2rem' } }}>
              {language === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My profile'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 560 }}>
              {language === 'hi'
                ? 'सुचारू बुकिंग के लिए अपनी जानकारी अपडेट रखें।'
                : 'Keep your details up to date for smoother bookings.'}
            </Typography>
          </Box>
        </Card>

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

        {/* Profile summary */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems={{ xs: 'center', md: 'flex-start' }}
            justifyContent="space-between"
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems={{ xs: 'center', sm: 'flex-start' }}
              sx={{ width: '100%', minWidth: 0 }}
            >
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  src={resolvedProfilePhoto}
                  sx={{
                    width: { xs: 96, sm: 120 },
                    height: { xs: 96, sm: 120 },
                    fontSize: { xs: '2.25rem', sm: '3rem' },
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    border: '4px solid',
                    borderColor: 'background.paper',
                    boxShadow: 2,
                  }}
                >
                  {!profilePhoto && user.name?.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton
                  onClick={handlePhotoMenuClick}
                  disabled={photoUploading}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    width: 40,
                    height: 40,
                    border: '2px solid',
                    borderColor: 'background.paper',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                  aria-label={language === 'hi' ? 'फोटो बदलें' : 'Change photo'}
                >
                  {photoUploading ? (
                    <CircularProgress size={20} sx={{ color: 'inherit' }} />
                  ) : (
                    <PhotoCamera sx={{ fontSize: 22 }} />
                  )}
                </IconButton>
                <Menu
                  anchorEl={photoMenuAnchor}
                  open={photoMenuOpen}
                  onClose={handlePhotoMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handlePhotoMenuClose();
                      handleCameraClick();
                    }}
                    disabled={photoUploading}
                  >
                    <ListItemIcon>
                      <CameraAlt color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={language === 'hi' ? 'फोटो लें' : 'Take photo'} />
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handlePhotoClick} disabled={photoUploading}>
                    <ListItemIcon>
                      <ImageIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={language === 'hi' ? 'अपलोड करें' : 'Upload photo'} />
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

              <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent={{ xs: 'center', sm: 'flex-start' }}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mb: 1 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
                    {user.name}
                  </Typography>
                  {user.isVerified && (
                    <Chip icon={<Verified />} label={language === 'hi' ? 'सत्यापित' : 'Verified'} color="success" size="small" />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {language === 'hi' ? 'सदस्यता' : 'Member since'}{' '}
                  {new Date(user.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-start' }} useFlexGap>
                  <Chip
                    label={user.isOnline ? (language === 'hi' ? 'ऑनलाइन' : 'Online') : language === 'hi' ? 'ऑफलाइन' : 'Offline'}
                    color={user.isOnline ? 'success' : 'default'}
                    size="small"
                    variant={user.isOnline ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label={`${user.totalBookings || 0} ${language === 'hi' ? 'बुकिंग' : 'bookings'}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </Stack>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ width: { xs: '100%', md: 'auto' }, alignItems: 'stretch' }}
            >
              {!editMode ? (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Edit />}
                  onClick={() => setEditMode(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 999,
                    px: 3,
                    background: sewaPrimaryButtonGradient,
                    '&:hover': { background: sewaPrimaryButtonHover },
                  }}
                >
                  {language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit profile'}
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Save />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                    color="success"
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                  >
                    {t('save') || 'Save'}
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    color="primary"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    disabled={loading}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 999 }}
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Personal information */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 800,
                pl: 1.5,
                borderLeft: 4,
                borderColor: 'primary.main',
                color: 'text.primary',
              }}
            >
              {language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal information'}
            </Typography>
            
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
                  sx={profileFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
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
                  sx={profileFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
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
                  sx={profileFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                        <Typography sx={{ ml: 1, color: 'text.secondary' }}>+91</Typography>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={() => setPhoneChangeDialogOpen(true)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
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
                  sx={profileFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn color="action" />
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
                  rows={2}
                  sx={profileFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Home color="action" />
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
                  sx={profileFieldSx}
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
                  sx={profileFieldSx}
                  helperText="Service available in Bihar only"
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Security */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            mt: { xs: 2, sm: 4 },
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: 800,
                pl: 1.5,
                borderLeft: 4,
                borderColor: 'primary.main',
                color: 'text.primary',
              }}
            >
              {language === 'hi' ? 'सुरक्षा' : 'Security'}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last changed on {new Date(user.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={<Lock />}
                onClick={() => setPasswordDialogOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  alignSelf: { xs: 'stretch', sm: 'center' },
                  maxWidth: { sm: 280 },
                }}
              >
                {language === 'hi' ? 'पासवर्ड बदलें' : 'Change password'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Footer — SewaBihar teal bar */}
      <Box
        sx={{
          mt: { xs: 4, md: 8 },
          py: { xs: 3, md: 4 },
          background: (theme) =>
            `linear-gradient(180deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          borderTop: '1px solid',
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Logo size="medium" showText={true} />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)', mb: 2, lineHeight: 1.8 }}>
                {t('Empowering Bihar with seamless service connections. Your trusted partner for quality home services.')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>
                {language === 'hi' ? 'त्वरित लिंक' : 'Quick links'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  '&:hover': { color: '#fff', textDecoration: 'underline' },
                }}
                onClick={() => navigate('/')}
              >
                Home
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  '&:hover': { color: '#fff', textDecoration: 'underline' },
                }}
                onClick={() => navigate('/about')}
              >
                About Us
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  '&:hover': { color: '#fff', textDecoration: 'underline' },
                }}
                onClick={() => navigate('/contact')}
              >
                Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>
                {language === 'hi' ? 'संपर्क' : 'Contact'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
                <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'rgba(255,255,255,0.95)' }} />
                support@sewabihar.com
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
                <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'rgba(255,255,255,0.95)' }} />
                +91 1800-XXX-XXXX
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>
                {language === 'hi' ? 'फॉलो करें' : 'Follow'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <IconButton
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
                  }}
                >
                  <Typography variant="body2">FB</Typography>
                </IconButton>
                <IconButton
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
                  }}
                >
                  <Typography variant="body2">TW</Typography>
                </IconButton>
                <IconButton
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
                  }}
                >
                  <Typography variant="body2">IG</Typography>
                </IconButton>
              </Box>
            </Grid>
          </Grid>
          <Box
            sx={{
              borderTop: '1px solid rgba(255,255,255,0.2)',
              mt: 4,
              pt: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)' }}>
              © {new Date().getFullYear()} SewaBihar. {t('All rights reserved.')}
            </Typography>
          </Box>
        </Container>
      </Box>

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
              background: sewaPrimaryButtonGradient,
              '&:hover': { background: sewaPrimaryButtonHover },
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
              <CircularProgress size={24} color="primary" />
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
              background: cameraReady ? sewaPrimaryButtonGradient : 'rgba(0, 0, 0, 0.26)',
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              boxShadow: cameraReady ? '0 4px 15px rgba(13, 148, 136, 0.35)' : 'none',
              '&:hover': {
                background: cameraReady ? sewaPrimaryButtonHover : 'rgba(0, 0, 0, 0.26)',
                boxShadow: cameraReady ? '0 6px 20px rgba(13, 148, 136, 0.45)' : 'none',
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
