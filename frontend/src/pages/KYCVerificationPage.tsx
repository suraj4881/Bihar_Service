import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Chip,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  CameraAlt,
  CheckCircle,
  Fingerprint,
  CreditCard,
  ArrowBack,
  PhotoCamera,
  UploadFile,
  Image,
  Description,
  Badge,
  Person,
  Pending,
  Cancel,
  VerifiedUser,
  Refresh,
  Assignment,
  Security,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import { getApiUrl, getFileServeUrl } from '../utils/api';
import {
  sewaHeroBarGradient,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const kycPrimaryBtnSx = {
  background: sewaPrimaryButtonGradient,
  color: '#fff',
  '&:hover': { background: sewaPrimaryButtonHover },
} as const;

const kycOutlinedPrimarySx = {
  borderColor: 'primary.main',
  color: 'primary.main',
  '&:hover': {
    borderColor: 'primary.dark',
    bgcolor: 'rgba(0, 105, 92, 0.06)',
  },
} as const;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const KYCVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const hi = language === 'hi';
  
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
  
  // Fetch KYC status on mount
  useEffect(() => {
    fetchKYCStatus();
  }, [user?.id]);
  
  const fetchKYCStatus = async () => {
    if (!user?.id) {
      setKycLoading(false);
      return;
    }
    
    setKycLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`kyc/status/${user.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.data) {
        const statusData = data.data;
        setKycStatus({
          status: statusData.status || null,
          aadhaarSubmitted: statusData.aadhaarSubmitted,
          panSubmitted: statusData.panSubmitted,
          selfieSubmitted: statusData.selfieSubmitted,
          aadhaarStatus: statusData.aadhaarStatus,
          panStatus: statusData.panStatus,
          selfieStatus: statusData.selfieStatus,
          rejectionReason: statusData.rejectionReason,
          verifiedAt: statusData.verifiedAt,
          submittedAt: statusData.submittedAt,
          aadhaarFrontUrl: statusData.aadhaarFrontUrl,
          aadhaarBackUrl: statusData.aadhaarBackUrl,
          panImageUrl: statusData.panImageUrl,
          selfieImageUrl: statusData.selfieImageUrl,
        });
        
        // If documents are submitted, show status view
        if (statusData.aadhaarSubmitted || statusData.panSubmitted || statusData.selfieSubmitted) {
          setViewMode('status');
        } else {
          setViewMode('upload');
        }
      } else {
        setKycStatus(null);
        setViewMode('upload');
      }
    } catch (error) {
      setKycStatus(null);
      setViewMode('upload');
    } finally {
      setKycLoading(false);
    }
  };
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // KYC Status State
  const [kycStatus, setKycStatus] = useState<{
    status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | null;
    aadhaarSubmitted?: boolean;
    panSubmitted?: boolean;
    selfieSubmitted?: boolean;
    aadhaarStatus?: string;
    panStatus?: string;
    selfieStatus?: string;
    rejectionReason?: string;
    verifiedAt?: string;
    submittedAt?: string;
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
    panImageUrl?: string;
    selfieImageUrl?: string;
  } | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'upload' | 'status'>('upload');

  // Aadhaar Tab State
  const [aadhaarMethod, setAadhaarMethod] = useState(0); // 0 = Manual Upload, 1 = OTP Verification
  
  // Aadhaar Manual Upload
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null);
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState('');
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState('');
  
  // Aadhaar OTP Verification
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOTP, setAadhaarOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  
  // PAN Card
  const [panCard, setPanCard] = useState<File | null>(null);
  const [panCardPreview, setPanCardPreview] = useState('');
  const [panNumber, setPanNumber] = useState('');
  
  // Selfie
  const [selfieMethod, setSelfieMethod] = useState(0); // 0 = Upload, 1 = Live Capture
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // File input refs
  const aadhaarFrontInputRef = useRef<HTMLInputElement>(null);
  const aadhaarBackInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const steps = ['Aadhaar Verification', 'PAN Card', 'Selfie Verification', 'Review & Submit'];

  // Handle file uploads with preview
  const handleFileUpload = (
    file: File,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Aadhaar OTP Functions
  const handleSendAadhaarOTP = async () => {
    if (aadhaarNumber.length !== 12) {
      setError('Please enter valid 12-digit Aadhaar number');
      return;
    }
    
    setLoading(true);
    try {
      // Call Aadhaar OTP API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOtpSent(true);
      setError('');
      setSuccess(false);
    } catch (err: any) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAadhaarOTP = async () => {
    if (aadhaarOTP.length !== 6) {
      setError('Please enter valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      // Call Aadhaar verification API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAadhaarVerified(true);
      setError('');
    } catch (err: any) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permission.');
    }
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            setSelfie(file);
            setSelfiePreview(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleNext = () => {
    // Validation for each step
    if (activeStep === 0) {
      if (aadhaarMethod === 0) {
        if (!aadhaarFront || !aadhaarBack) {
          setError('Please upload both sides of Aadhaar card');
          return;
        }
      } else {
        if (!aadhaarVerified) {
          setError('Please verify your Aadhaar with OTP');
          return;
        }
      }
    }
    
    if (activeStep === 1) {
      if (!panCard || !panNumber) {
        setError('Please upload PAN card and enter PAN number');
        return;
      }
    }
    
    if (activeStep === 2) {
      if (!selfie) {
        setError('Please upload or capture your selfie');
        return;
      }
    }
    
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userId = user?.id || '';
      const userRole = user?.role || 'CUSTOMER';
      const token = localStorage.getItem('token');
      
      // Submit Aadhaar to separate collection
      if (aadhaarFront && aadhaarBack) {
        const aadhaarFormData = new FormData();
        aadhaarFormData.append('userId', userId);
        aadhaarFormData.append('userRole', userRole);
        aadhaarFormData.append('aadhaarFront', aadhaarFront);
        aadhaarFormData.append('aadhaarBack', aadhaarBack);
        aadhaarFormData.append('aadhaarNumber', '');
        aadhaarFormData.append('isOtpVerified', 'false');
        
        const aadhaarResponse = await fetch(getApiUrl('kyc/aadhaar/submit'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: aadhaarFormData,
        });
        
        const aadhaarData = await aadhaarResponse.json();
        if (!aadhaarData.success) {
          throw new Error(aadhaarData.message || 'Aadhaar submission failed');
        }
      }
      
      // Submit PAN to separate collection
      if (panCard && panNumber) {
        const panFormData = new FormData();
        panFormData.append('userId', userId);
        panFormData.append('userRole', userRole);
        panFormData.append('panImage', panCard);
        panFormData.append('panNumber', panNumber);
        
        const panResponse = await fetch(getApiUrl('kyc/pan/submit'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: panFormData,
        });
        
        const panData = await panResponse.json();
        if (!panData.success) {
          throw new Error(panData.message || 'PAN submission failed');
        }
      }
      
      // Submit Selfie to separate collection
      if (selfie) {
        const selfieFormData = new FormData();
        selfieFormData.append('userId', userId);
        selfieFormData.append('userRole', userRole);
        selfieFormData.append('selfieImage', selfie);
        selfieFormData.append('captureMethod', selfieMethod === 0 ? 'UPLOAD' : 'LIVE_CAPTURE');
      
        const selfieResponse = await fetch(getApiUrl('kyc/selfie/submit'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
          body: selfieFormData,
      });
      
        const selfieData = await selfieResponse.json();
        if (!selfieData.success) {
          throw new Error(selfieData.message || 'Selfie submission failed');
        }
      }
      
      // All submissions successful
        setSuccess(true);
        setError('');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Aadhaar Verification
        return (
          <Box>
            <Box sx={{ mb: 4, pb: 2, borderBottom: '2px solid #f0f0f0' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '1.75rem',
                  color: '#1a1a1a',
                  mb: 0.5,
                }}
              >
              Aadhaar Verification
            </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666',
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '0.9rem',
                }}
              >
                Upload both sides of your Aadhaar card for verification
              </Typography>
            </Box>
            
            {/* Aadhaar OTP Feature - Disabled for now. Enable when OTP feature is ready */}
            {/* 
            <Tabs
              value={aadhaarMethod}
              onChange={(_, newValue) => setAadhaarMethod(newValue)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Upload Aadhaar Scan" icon={<CloudUpload />} />
              <Tab label="Verify with OTP" icon={<Fingerprint />} />
            </Tabs>
            */}
            
            {/* Manual Upload Section - Always visible when OTP is disabled */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 0,
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': { 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: 'primary.main',
                      },
                    }}
                    component="label"
                  >
                    {aadhaarFrontPreview ? (
                      <Box sx={{ 
                        position: 'relative', 
                        bgcolor: '#f5f5f5', 
                        minHeight: 300, 
                        width: '100%',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        p: 2,
                      }}>
                        <img 
                          src={aadhaarFrontPreview} 
                          alt="Aadhaar Front" 
                          style={{ 
                            maxWidth: '100%',
                            maxHeight: '400px',
                            width: 'auto',
                            height: 'auto',
                            display: 'block',
                            objectFit: 'contain',
                            borderRadius: 4,
                          }} 
                        />
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ 
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            fontFamily: '"Poppins", sans-serif',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAadhaarFront(null);
                            setAadhaarFrontPreview('');
                          }}
                        >
                          Change
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          p: 5,
                          textAlign: 'center',
                          bgcolor: '#fafafa',
                        }}
                      >
                        {/* Aadhaar Logo */}
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2.5,
                            py: 1,
                            borderRadius: 2,
                            mb: 3,
                            background: sewaPrimaryButtonGradient,
                            boxShadow: '0 4px 12px rgba(0, 77, 64, 0.25)',
                          }}
                        >
                          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: 1.5 }}>
                            आधार
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', letterSpacing: 1 }}>
                            AADHAAR
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Image sx={{ fontSize: 52, color: 'primary.main' }} />
                        </Box>

                        <Typography sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: '1.05rem' }}>
                          {hi ? 'आधार का अग्र भाग अपलोड करें' : 'Upload Aadhaar front'}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2.5 }}>
                          JPG, PNG or PDF (max 5MB)
                        </Typography>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            aadhaarFrontInputRef.current?.click();
                          }}
                          sx={{ ...kycOutlinedPrimarySx, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 2 }}
                        >
                          {hi ? 'फ़ाइल चुनें' : 'Choose file'}
                        </Button>
                      </Box>
                    )}
                    <input
                      ref={aadhaarFrontInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setAadhaarFront, setAadhaarFrontPreview)}
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 0,
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': { 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: 'primary.main',
                      },
                    }}
                    component="label"
                  >
                    {aadhaarBackPreview ? (
                      <Box sx={{ 
                        position: 'relative', 
                        bgcolor: '#f5f5f5', 
                        minHeight: 300, 
                        width: '100%',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        p: 2,
                      }}>
                        <img 
                          src={aadhaarBackPreview} 
                          alt="Aadhaar Back" 
                          style={{ 
                            maxWidth: '100%',
                            maxHeight: '400px',
                            width: 'auto',
                            height: 'auto',
                            display: 'block',
                            objectFit: 'contain',
                            borderRadius: 4,
                          }} 
                        />
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ 
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            fontFamily: '"Poppins", sans-serif',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAadhaarBack(null);
                            setAadhaarBackPreview('');
                          }}
                        >
                          Change
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          p: 5,
                          textAlign: 'center',
                          bgcolor: '#fafafa',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2.5,
                            py: 1,
                            borderRadius: 2,
                            mb: 3,
                            background: sewaPrimaryButtonGradient,
                            boxShadow: '0 4px 12px rgba(0, 77, 64, 0.25)',
                          }}
                        >
                          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: 1.5 }}>
                            आधार
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', letterSpacing: 1 }}>
                            AADHAAR
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Image sx={{ fontSize: 52, color: 'primary.main' }} />
                        </Box>

                        <Typography sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary', fontSize: '1.05rem' }}>
                          {hi ? 'आधार का पिछला भाग अपलोड करें' : 'Upload Aadhaar back'}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mb: 2.5 }}>
                          JPG, PNG or PDF (max 5MB)
                        </Typography>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            aadhaarBackInputRef.current?.click();
                          }}
                          sx={{ ...kycOutlinedPrimarySx, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 2 }}
                        >
                          {hi ? 'फ़ाइल चुनें' : 'Choose file'}
                        </Button>
                      </Box>
                    )}
                    <input
                      ref={aadhaarBackInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setAadhaarBack, setAadhaarBackPreview)}
                    />
                  </Paper>
                </Grid>
              </Grid>
            
            {/* Aadhaar OTP TabPanel - Disabled for now */}
            {/* 
            <TabPanel value={aadhaarMethod} index={1}>
              <Box sx={{ maxWidth: 500, mx: 'auto' }}>
                <TextField
                  fullWidth
                  label="Aadhaar Number"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="XXXX XXXX XXXX"
                  inputProps={{ maxLength: 12 }}
                  disabled={otpSent}
                  sx={{ mb: 2 }}
                />
                
                {!otpSent ? (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSendAadhaarOTP}
                    disabled={loading || aadhaarNumber.length !== 12}
                    sx={{
                      bgcolor: 'primary.main',
                      '&:hover': { background: sewaPrimaryButtonHover },
                      py: 1.5,
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
                  </Button>
                ) : (
                  <>
                    {aadhaarVerified ? (
                      <Alert severity="success" icon={<CheckCircle />}>
                        Aadhaar verified successfully!
                      </Alert>
                    ) : (
                      <>
                        <TextField
                          fullWidth
                          label="Enter OTP"
                          value={aadhaarOTP}
                          onChange={(e) => setAadhaarOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="XXXXXX"
                          inputProps={{ maxLength: 6 }}
                          sx={{ mb: 2 }}
                        />
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={handleVerifyAadhaarOTP}
                          disabled={loading || aadhaarOTP.length !== 6}
                          sx={{
                            bgcolor: 'primary.main',
                            '&:hover': { background: sewaPrimaryButtonHover },
                            py: 1.5,
                          }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </Box>
            </TabPanel>
            */}
          </Box>
        );
        
      case 1: // PAN Card
        return (
          <Box>
            <Box sx={{ mb: 4, pb: 2, borderBottom: '2px solid #f0f0f0' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '1.75rem',
                  color: '#1a1a1a',
                  mb: 0.5,
                }}
              >
              PAN Card Details
            </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666',
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '0.9rem',
                }}
              >
                Upload your PAN card and enter the PAN number
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 0,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': { 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={(e) => {
                    // If clicking on the Paper itself (not on button), trigger file input
                    if ((e.target as HTMLElement).tagName !== 'BUTTON' && !panCardPreview) {
                      panInputRef.current?.click();
                    }
                  }}
                >
                  {panCardPreview ? (
                    <Box sx={{ 
                      position: 'relative', 
                      bgcolor: '#f5f5f5', 
                      minHeight: 300, 
                      width: '100%',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      p: 2,
                    }}>
                      <img 
                        src={panCardPreview} 
                        alt="PAN Card" 
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '400px',
                          width: 'auto',
                          height: 'auto',
                          display: 'block',
                          objectFit: 'contain',
                          borderRadius: 4,
                        }} 
                      />
                      <Button
                        size="small"
                        variant="contained"
                        sx={{ 
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          fontFamily: '"Poppins", sans-serif',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPanCard(null);
                          setPanCardPreview('');
                        }}
                      >
                        Change
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        p: 5,
                        textAlign: 'center',
                        bgcolor: '#fafafa',
                      }}
                    >
                      <CreditCard sx={{ fontSize: 48, color: 'primary.main', mb: 2, display: 'block' }} />
                      <Typography 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 0.5, 
                          color: '#1a1a1a',
                          fontFamily: '"Poppins", sans-serif',
                          fontSize: '1.1rem',
                        }}
                      >
                        Upload PAN Card
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: '#666',
                          fontFamily: '"Poppins", sans-serif',
                          fontSize: '0.875rem',
                          mb: 2.5,
                        }}
                      >
                        JPG, PNG or PDF (Max 5MB)
                      </Typography>
                      <Button
                        component="span"
                        variant="outlined"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          panInputRef.current?.click();
                        }}
                        sx={{
                          ...kycOutlinedPrimarySx,
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 3,
                          borderRadius: 2,
                        }}
                      >
                        Choose File
                      </Button>
                    </Box>
                  )}
                  <input
                    id="pan-card-input"
                    ref={panInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, setPanCard, setPanCardPreview);
                      }
                    }}
                  />
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="PAN Number"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="ABCDE1234F"
                  inputProps={{ maxLength: 10 }}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      fontFamily: '"Poppins", sans-serif',
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: '"Poppins", sans-serif',
                    },
                  }}
                />
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 2,
                    fontFamily: '"Poppins", sans-serif',
                    '& .MuiAlert-message': {
                      fontFamily: '"Poppins", sans-serif',
                    },
                  }}
                >
                  Please ensure PAN number matches the uploaded card
                </Alert>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2: // Selfie
        return (
          <Box>
            <Box sx={{ mb: 4, pb: 2, borderBottom: '2px solid #f0f0f0' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '1.75rem',
                  color: '#1a1a1a',
                  mb: 0.5,
                }}
              >
              Selfie Verification
            </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666',
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '0.9rem',
                }}
              >
                Upload a clear selfie or capture one using your camera
              </Typography>
            </Box>
            
            <Tabs
              value={selfieMethod}
              onChange={(_, newValue) => setSelfieMethod(newValue)}
              sx={{ 
                mb: 5, 
                borderBottom: 2, 
                borderColor: '#f0f0f0',
                '& .MuiTab-root': {
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minHeight: 64,
                  px: 4,
                  '&.Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 700,
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  bgcolor: 'primary.main',
                },
              }}
            >
              <Tab label="Upload Photo" icon={<CloudUpload />} iconPosition="start" />
              <Tab label="Live Capture" icon={<CameraAlt />} iconPosition="start" />
            </Tabs>
            
            <TabPanel value={selfieMethod} index={0}>
              <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Paper
                  elevation={0}
                sx={{
                    p: 0,
                    border: '2px solid #e8e8e8',
                    borderRadius: 4,
                  cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    '&:hover': { 
                      boxShadow: '0 8px 24px rgba(0, 105, 92,0.15)',
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                    },
                }}
                component="label"
              >
                {selfiePreview ? (
                  <Box sx={{ 
                    position: 'relative', 
                    bgcolor: '#f8f9fa', 
                    minHeight: 400, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 3,
                  }}>
                    <img 
                      src={selfiePreview} 
                      alt="Selfie" 
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: '450px',
                        width: 'auto',
                        height: 'auto',
                        display: 'block',
                        objectFit: 'contain',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }} 
                    />
                    <Button
                      size="medium"
                      variant="contained"
                      sx={{ 
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 3,
                        borderRadius: 2,
                        '&:hover': { 
                          bgcolor: 'rgba(0,0,0,0.9)',
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelfie(null);
                        setSelfiePreview('');
                      }}
                    >
                      Change Photo
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: { xs: 4, sm: 6 },
                      textAlign: 'center',
                      background: 'linear-gradient(180deg, #f8faf9 0%, #ffffff 100%)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: sewaPrimaryButtonGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        boxShadow: '0 4px 16px rgba(0, 77, 64, 0.3)',
                      }}
                    >
                      <Person sx={{ fontSize: 56, color: 'white' }} />
                    </Box>
                    <Typography 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 1, 
                        color: '#1a1a1a',
                        fontFamily: '"Poppins", sans-serif',
                        fontSize: '1.25rem',
                      }}
                    >
                      Upload Your Selfie
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: '#666',
                        fontFamily: '"Poppins", sans-serif',
                        fontSize: '0.95rem',
                        mb: 3.5,
                        maxWidth: 300,
                        mx: 'auto',
                        lineHeight: 1.6,
                      }}
                    >
                      Upload a clear face photo. Make sure your face is clearly visible and well-lit.
                    </Typography>
                    <Button
                      component="span"
                      variant="contained"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selfieInputRef.current?.click();
                      }}
                      sx={{
                        ...kycPrimaryBtnSx,
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 5,
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1rem',
                        boxShadow: '0 4px 14px rgba(0, 105, 92, 0.35)',
                        '&:hover': {
                          ...kycPrimaryBtnSx['&:hover'],
                          boxShadow: '0 6px 20px rgba(0, 105, 92, 0.45)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Choose File
                    </Button>
                    <Typography 
                      sx={{ 
                        color: '#999',
                        fontFamily: '"Poppins", sans-serif',
                        fontSize: '0.8rem',
                        mt: 2,
                      }}
                    >
                      JPG, PNG or PDF (Max 5MB)
                    </Typography>
                  </Box>
                )}
                <input
                  ref={selfieInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setSelfie, setSelfiePreview)}
                />
              </Paper>
              </Box>
            </TabPanel>
            
            <TabPanel value={selfieMethod} index={1}>
              <Box sx={{ maxWidth: 550, mx: 'auto' }}>
                {!cameraActive && !selfiePreview && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      border: '2px solid #e8e8e8',
                      borderRadius: 4,
                      bgcolor: '#fafbfc',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        boxShadow: '0 4px 16px rgba(0, 105, 92,0.3)',
                      }}
                    >
                      <CameraAlt sx={{ fontSize: 48, color: 'white' }} />
                    </Box>
                    <Typography 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 1, 
                        color: '#1a1a1a',
                        fontFamily: '"Poppins", sans-serif',
                        fontSize: '1.25rem',
                      }}
                    >
                      Live Camera Capture
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: '#666',
                        fontFamily: '"Poppins", sans-serif',
                        fontSize: '0.95rem',
                        mb: 4,
                        maxWidth: 350,
                        mx: 'auto',
                        lineHeight: 1.6,
                      }}
                    >
                      Click the button below to start your camera and capture a live selfie
                    </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={startCamera}
                    startIcon={<CameraAlt />}
                    sx={{
                      ...kycPrimaryBtnSx,
                      fontWeight: 700,
                      textTransform: 'none',
                      py: 2,
                      px: 6,
                      borderRadius: 2,
                      fontSize: '1.05rem',
                      boxShadow: '0 4px 14px rgba(0, 105, 92, 0.35)',
                      '&:hover': {
                        ...kycPrimaryBtnSx['&:hover'],
                        boxShadow: '0 6px 20px rgba(0, 105, 92, 0.45)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Start Camera
                  </Button>
                  </Paper>
                )}
                
                {cameraActive && (
                  <Box>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '2px solid #e8e8e8',
                        borderRadius: 4,
                        bgcolor: 'white',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                      }}
                    >
                    <video
                      ref={videoRef}
                      autoPlay
                      style={{
                        width: '100%',
                          maxWidth: '100%',
                        borderRadius: 8,
                          display: 'block',
                      }}
                    />
                    </Paper>
                    <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        onClick={captureSelfie}
                        startIcon={<PhotoCamera />}
                        size="large"
                        sx={{
                          bgcolor: '#4CAF50',
                          color: 'white',
                          fontFamily: '"Poppins", sans-serif',
                          fontWeight: 700,
                          textTransform: 'none',
                          px: 5,
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          boxShadow: '0 4px 14px rgba(76,175,80,0.35)',
                          '&:hover': { 
                            bgcolor: '#45a049',
                            boxShadow: '0 6px 20px rgba(76,175,80,0.45)',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Capture Photo
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={stopCamera}
                        size="large"
                        sx={{
                          borderColor: '#dc3545',
                          color: '#dc3545',
                          fontFamily: '"Poppins", sans-serif',
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 5,
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          '&:hover': {
                            borderColor: '#c82333',
                            bgcolor: 'rgba(220,53,69,0.05)',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
                
                {selfiePreview && !cameraActive && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 4,
                      p: 3,
                      border: '2px solid #4CAF50',
                      borderRadius: 4,
                      bgcolor: 'white',
                      boxShadow: '0 4px 16px rgba(76,175,80,0.2)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 600,
                        color: '#4CAF50',
                        mb: 2,
                        fontSize: '1rem',
                      }}
                    >
                      ✓ Photo Captured Successfully
                    </Typography>
                    <img
                      src={selfiePreview}
                      alt="Captured Selfie"
                      style={{
                        width: '100%',
                        maxWidth: 450,
                        borderRadius: 8,
                        display: 'block',
                        margin: '0 auto',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelfie(null);
                        setSelfiePreview('');
                      }}
                      sx={{
                        mt: 3,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'rgba(0, 105, 92, 0.06)',
                        },
                      }}
                    >
                      Retake Photo
                    </Button>
                  </Paper>
                )}
                
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
            </TabPanel>
          </Box>
        );
        
      case 3: // Review
        return (
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 4, 
                fontWeight: 700, 
                textAlign: 'center',
                fontFamily: '"Poppins", sans-serif',
                fontSize: '1.5rem',
                color: '#1a1a1a',
              }}
            >
              Review Your Documents
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Aadhaar Verification
                  </Typography>
                  {aadhaarMethod === 0 ? (
                    <>
                      {aadhaarFrontPreview && <img src={aadhaarFrontPreview} alt="Aadhaar" style={{ width: '100%', borderRadius: 4 }} />}
                      <Chip label="Manual Upload" size="small" color="primary" sx={{ mt: 1 }} />
                    </>
                  ) : (
                    <>
                      <Typography variant="body2">{aadhaarNumber}</Typography>
                      <Chip label="OTP Verified" size="small" color="success" sx={{ mt: 1 }} icon={<CheckCircle />} />
                    </>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    PAN Card
                  </Typography>
                  {panCardPreview && <img src={panCardPreview} alt="PAN" style={{ width: '100%', borderRadius: 4 }} />}
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {panNumber}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Selfie
                  </Typography>
                  {selfiePreview && <img src={selfiePreview} alt="Selfie" style={{ width: '100%', borderRadius: 4 }} />}
                  <Chip label="Verified" size="small" color="success" sx={{ mt: 1 }} />
                </Paper>
              </Grid>
            </Grid>
            
            <Alert 
              severity="warning" 
              sx={{ 
                mt: 4,
                fontFamily: '"Poppins", sans-serif',
                '& .MuiAlert-message': {
                  fontFamily: '"Poppins", sans-serif',
                },
              }}
            >
              Please ensure all documents are clear and readable. Your KYC will be reviewed by our team within 24-48 hours.
            </Alert>
          </Box>
        );
        
      default:
        return null;
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 50%, #f0f4f8 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Paper 
            elevation={0}
            sx={{ 
              p: 6, 
              textAlign: 'center',
              borderRadius: 4,
              border: '1px solid #e8e8e8',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              bgcolor: 'white',
            }}
          >
            <CheckCircle sx={{ fontSize: 120, color: '#4CAF50', mb: 4 }} />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                fontFamily: '"Poppins", sans-serif',
                color: '#1a1a1a',
                fontSize: '2rem',
              }}
            >
              KYC Submitted Successfully!
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4,
                fontFamily: '"Poppins", sans-serif',
                color: '#666',
                fontSize: '1.05rem',
                maxWidth: 500,
                mx: 'auto',
              }}
            >
              Your documents are under review. You'll be notified once verified.
            </Typography>
            <CircularProgress size={28} sx={{ color: 'primary.main', mb: 2 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: '"Poppins", sans-serif',
                color: '#999',
                fontSize: '0.9rem',
              }}
            >
              Redirecting to home...
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }
  
  // Render Status View Component
  const renderStatusView = () => {
    if (!kycStatus) return null;
    
    const getStatusColor = (status?: string) => {
      switch (status) {
        case 'VERIFIED': return '#4CAF50';
        case 'UNDER_REVIEW': return '#FF9800';
        case 'PENDING': return '#2196F3';
        case 'REJECTED': return '#f44336';
        default: return '#9E9E9E';
      }
    };
    
    const getStatusIcon = (status?: string) => {
      switch (status) {
        case 'VERIFIED': return <VerifiedUser />;
        case 'UNDER_REVIEW': return <Pending />;
        case 'PENDING': return <Pending />;
        case 'REJECTED': return <Cancel />;
        default: return <Pending />;
      }
    };
    
    const getStatusText = (status?: string) => {
      switch (status) {
        case 'VERIFIED': return 'Verified';
        case 'UNDER_REVIEW': return 'Under Review';
        case 'PENDING': return 'Pending';
        case 'REJECTED': return 'Rejected';
        default: return 'Not Submitted';
      }
    };
    
    return (
      <Box>
        <Box sx={{ textAlign: 'center', mb: 5, pb: 4, borderBottom: '2px solid #f0f0f0' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: sewaPrimaryButtonGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 8px 24px rgba(0, 77, 64, 0.35)',
            }}
          >
            <Security sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Poppins", sans-serif', color: '#1a1a1a', mb: 1.5, lineHeight: 1.2 }}>
            KYC Status
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', fontFamily: '"Poppins", sans-serif', fontSize: '1rem', lineHeight: 1.6, maxWidth: 600, mx: 'auto', mb: 3 }}>
            View your document verification status and track the progress of your identity verification
          </Typography>
          {kycStatus.status === 'REJECTED' && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => {
                  setViewMode('upload');
                  fetchKYCStatus();
                }}
                sx={{ 
                  fontFamily: '"Poppins", sans-serif', 
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 5,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: '#dc3545',
                  boxShadow: '0 4px 12px rgba(220,53,69,0.3)',
                  '&:hover': {
                    bgcolor: '#c82333',
                    boxShadow: '0 6px 16px rgba(220,53,69,0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Re-upload Documents
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Overall Status */}
        <Paper
          elevation={0}
          sx={{
            mb: 5,
            p: 3,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 
              kycStatus.status === 'VERIFIED' ? '#4CAF50' :
              kycStatus.status === 'REJECTED' ? '#f44336' :
              kycStatus.status === 'UNDER_REVIEW' ? '#FF9800' : '#2196F3',
            bgcolor: 
              kycStatus.status === 'VERIFIED' ? 'rgba(76,175,80,0.05)' :
              kycStatus.status === 'REJECTED' ? 'rgba(244,67,54,0.05)' :
              kycStatus.status === 'UNDER_REVIEW' ? 'rgba(255,152,0,0.05)' : 'rgba(33,150,243,0.05)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: getStatusColor(kycStatus.status),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                mr: 2,
                boxShadow: `0 4px 12px ${getStatusColor(kycStatus.status)}40`,
              }}
            >
              {getStatusIcon(kycStatus.status)}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', color: '#1a1a1a', mb: 0.5 }}>
                Overall Status: {kycStatus.status ? getStatusText(kycStatus.status) : 'Not Submitted'}
              </Typography>
              {kycStatus.submittedAt && (
                <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Poppins", sans-serif' }}>
                  Submitted on: {new Date(kycStatus.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              )}
            </Box>
          </Box>
          {kycStatus.status === 'REJECTED' && kycStatus.rejectionReason && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2, fontFamily: '"Poppins", sans-serif' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Rejection Reason:
              </Typography>
              <Typography variant="body2">
                {kycStatus.rejectionReason}
              </Typography>
            </Alert>
          )}
          {kycStatus.status === 'VERIFIED' && kycStatus.verifiedAt && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2, fontFamily: '"Poppins", sans-serif' }}>
              <Typography variant="body2">
                ✓ Verified on: {new Date(kycStatus.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
            </Alert>
          )}
        </Paper>
        
        {/* Document Status Cards */}
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', mb: 3, color: '#1a1a1a' }}>
          Document Status
        </Typography>
        <Grid container spacing={3}>
          {/* Aadhaar Status */}
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 4, 
                border: '2px solid', 
                borderColor: getStatusColor(kycStatus.aadhaarStatus),
                bgcolor: 'white',
                boxShadow: `0 4px 20px ${getStatusColor(kycStatus.aadhaarStatus)}20`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${getStatusColor(kycStatus.aadhaarStatus)}30`,
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor(kycStatus.aadhaarStatus),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2,
                    boxShadow: `0 4px 12px ${getStatusColor(kycStatus.aadhaarStatus)}40`,
                  }}>
                    <Image sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', color: '#1a1a1a' }}>
                    Aadhaar
                  </Typography>
                </Box>
                <Chip
                  icon={getStatusIcon(kycStatus.aadhaarStatus)}
                  label={getStatusText(kycStatus.aadhaarStatus)}
                  sx={{
                    bgcolor: getStatusColor(kycStatus.aadhaarStatus),
                    color: 'white',
                    fontWeight: 700,
                    fontFamily: '"Poppins", sans-serif',
                    mb: 2,
                    fontSize: '0.875rem',
                    height: 32,
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
                {kycStatus.aadhaarSubmitted && (kycStatus.aadhaarFrontUrl || kycStatus.aadhaarBackUrl) ? (
                  <Box sx={{ mt: 2, flexGrow: 1 }}>
                    {kycStatus.aadhaarFrontUrl && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: '#1a1a1a', fontFamily: '"Poppins", sans-serif', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Front Side
                        </Typography>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid #e8e8e8',
                            bgcolor: '#fafafa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 120,
                          }}
                        >
                          <img 
                            src={getFileServeUrl(kycStatus.aadhaarFrontUrl)}
                            alt="Aadhaar Front"
                            style={{
                              width: '100%',
                              maxHeight: 120,
                              objectFit: 'contain',
                              borderRadius: 6,
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </Paper>
                      </Box>
                    )}
                    {kycStatus.aadhaarBackUrl && (
                      <Box>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: '#1a1a1a', fontFamily: '"Poppins", sans-serif', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Back Side
                        </Typography>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid #e8e8e8',
                            bgcolor: '#fafafa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 120,
                          }}
                        >
                          <img 
                            src={getFileServeUrl(kycStatus.aadhaarBackUrl)}
                            alt="Aadhaar Back"
                            style={{
                              width: '100%',
                              maxHeight: 120,
                              objectFit: 'contain',
                              borderRadius: 6,
                            }}
                            onError={(e) => {
                              console.error('Error loading Aadhaar back image:', kycStatus.aadhaarBackUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </Paper>
                      </Box>
                    )}
                  </Box>
                ) : !kycStatus.aadhaarSubmitted ? (
                  <Box sx={{ mt: 2, textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" sx={{ color: '#999', fontFamily: '"Poppins", sans-serif', fontStyle: 'italic' }}>
                      Not submitted yet
                    </Typography>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
          
          {/* PAN Status */}
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 4, 
                border: '2px solid', 
                borderColor: getStatusColor(kycStatus.panStatus),
                bgcolor: 'white',
                boxShadow: `0 4px 20px ${getStatusColor(kycStatus.panStatus)}20`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${getStatusColor(kycStatus.panStatus)}30`,
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor(kycStatus.panStatus),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2,
                    boxShadow: `0 4px 12px ${getStatusColor(kycStatus.panStatus)}40`,
                  }}>
                    <CreditCard sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', color: '#1a1a1a' }}>
                    PAN Card
                  </Typography>
                </Box>
                <Chip
                  icon={getStatusIcon(kycStatus.panStatus)}
                  label={getStatusText(kycStatus.panStatus)}
                  sx={{
                    bgcolor: getStatusColor(kycStatus.panStatus),
                    color: 'white',
                    fontWeight: 700,
                    fontFamily: '"Poppins", sans-serif',
                    mb: 2,
                    fontSize: '0.875rem',
                    height: 32,
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
                {kycStatus.panSubmitted && kycStatus.panImageUrl ? (
                  <Box sx={{ mt: 2, flexGrow: 1 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid #e8e8e8',
                        bgcolor: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 180,
                      }}
                    >
                      <img 
                        src={getFileServeUrl(kycStatus.panImageUrl)}
                        alt="PAN Card"
                        style={{
                          width: '100%',
                          maxHeight: 180,
                          objectFit: 'contain',
                          borderRadius: 6,
                        }}
                        onError={(e) => {
                          console.error('Error loading PAN image:', kycStatus.panImageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </Paper>
                  </Box>
                ) : !kycStatus.panSubmitted ? (
                  <Box sx={{ mt: 2, textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" sx={{ color: '#999', fontFamily: '"Poppins", sans-serif', fontStyle: 'italic' }}>
                      Not submitted yet
                    </Typography>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Selfie Status */}
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 4, 
                border: '2px solid', 
                borderColor: getStatusColor(kycStatus.selfieStatus),
                bgcolor: 'white',
                boxShadow: `0 4px 20px ${getStatusColor(kycStatus.selfieStatus)}20`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${getStatusColor(kycStatus.selfieStatus)}30`,
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor(kycStatus.selfieStatus),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2,
                    boxShadow: `0 4px 12px ${getStatusColor(kycStatus.selfieStatus)}40`,
                  }}>
                    <Person sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', color: '#1a1a1a' }}>
                    Selfie
                  </Typography>
                </Box>
                <Chip
                  icon={getStatusIcon(kycStatus.selfieStatus)}
                  label={getStatusText(kycStatus.selfieStatus)}
                  sx={{
                    bgcolor: getStatusColor(kycStatus.selfieStatus),
                    color: 'white',
                    fontWeight: 700,
                    fontFamily: '"Poppins", sans-serif',
                    mb: 2,
                    fontSize: '0.875rem',
                    height: 32,
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
                {kycStatus.selfieSubmitted && kycStatus.selfieImageUrl ? (
                  <Box sx={{ mt: 2, flexGrow: 1 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid #e8e8e8',
                        bgcolor: '#fafafa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 180,
                      }}
                    >
                      <img 
                        src={getFileServeUrl(kycStatus.selfieImageUrl)}
                        alt="Selfie"
                        style={{
                          width: '100%',
                          maxHeight: 180,
                          objectFit: 'contain',
                          borderRadius: 6,
                        }}
                        onError={(e) => {
                          console.error('Error loading Selfie image:', kycStatus.selfieImageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </Paper>
                  </Box>
                ) : !kycStatus.selfieSubmitted ? (
                  <Box sx={{ mt: 2, textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" sx={{ color: '#999', fontFamily: '"Poppins", sans-serif', fontStyle: 'italic' }}>
                      Not submitted yet
                    </Typography>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Show loading while fetching status
  if (kycLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Show status view if documents are submitted
  if (viewMode === 'status' && kycStatus) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 5 }}>
        <AppBar variant="simple" position="sticky" showBackButton />
        <Container maxWidth="lg">
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
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.35rem', sm: '2rem' } }}>
                {hi ? 'KYC स्थिति' : 'KYC verification status'}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95 }}>
                {hi ? 'दस्तावेज़ों की जाँच की प्रगति देखें।' : 'Track verification progress and document updates.'}
              </Typography>
            </Box>
          </Card>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
              bgcolor: 'background.paper',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 6 } }}>
              {renderStatusView()}
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 3, md: 5 },
        position: 'relative',
      }}
    >
      <AppBar variant="simple" position="sticky" showBackButton />
      <Container maxWidth="lg">
        <Card
          sx={{
            mb: { xs: 2, md: 3 },
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
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.35rem', sm: '2rem' } }}>
              {hi ? 'अपना KYC पूरा करें' : 'Complete your KYC'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95 }}>
              {hi
                ? 'आधार, PAN और सेल्फ़ी जमा करके तेज़ी से सत्यापित हों।'
                : 'Submit Aadhaar, PAN, and a selfie to get verified faster.'}
            </Typography>
          </Box>
        </Card>
        <Card
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
            bgcolor: 'background.paper',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 6 } }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800, 
                  mb: 1.5,
                  fontFamily: '"Poppins", sans-serif',
                  color: '#1a1a1a',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  letterSpacing: '-0.5px',
                }}
              >
              KYC Verification
            </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#666',
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '1rem',
                  fontWeight: 500,
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                Complete your KYC verification to start offering or booking services on our platform
            </Typography>
            </Box>
            
            <Stepper
              activeStep={activeStep}
              alternativeLabel={isMdUp}
              orientation={isMdUp ? 'horizontal' : 'vertical'}
              sx={{
                mb: { xs: 3, md: 6 },
                '& .MuiStep-root': {
                  '& .MuiStepLabel-root': {
                    '& .MuiStepLabel-iconContainer': {
                      '& .MuiSvgIcon-root': {
                        fontSize: '2rem',
                        '&.Mui-active': {
                          color: 'primary.main',
                        },
                        '&.Mui-completed': {
                          color: '#4CAF50',
                        },
                      },
                    },
                  },
                },
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#4CAF50',
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: 'primary.main',
                },
                '& .MuiStepLabel-label': {
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  '&.Mui-active': {
                    fontWeight: 700,
                    color: 'primary.main',
                  },
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 4,
                  borderRadius: 2,
                  fontFamily: '"Poppins", sans-serif',
                  '& .MuiAlert-message': {
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                  },
                }} 
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}
            
            {renderStepContent()}
            
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                mt: { xs: 4, md: 6 },
                pt: 4,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                fullWidth={!isMdUp}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: activeStep === 0 ? '#ccc' : 'text.secondary',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  maxWidth: { sm: 200 },
                  alignSelf: { xs: 'stretch', sm: 'auto' },
                  '&:hover': {
                    bgcolor: activeStep === 0 ? 'transparent' : 'action.hover',
                  },
                  '&.Mui-disabled': {
                    color: '#ccc',
                  },
                }}
              >
                ← Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  fullWidth={!isMdUp}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                  sx={{
                    ...kycPrimaryBtnSx,
                    px: { xs: 3, sm: 6 },
                    maxWidth: { sm: 360 },
                    alignSelf: { xs: 'stretch', sm: 'auto' },
                    py: 1.8,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(0, 105, 92, 0.35)',
                    '&:hover': {
                      background: sewaPrimaryButtonHover,
                      boxShadow: '0 6px 20px rgba(0, 105, 92, 0.45)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      background: '#e0e0e0',
                      color: '#757575',
                      boxShadow: 'none',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit KYC'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  fullWidth={!isMdUp}
                  sx={{
                    ...kycPrimaryBtnSx,
                    px: { xs: 3, sm: 6 },
                    maxWidth: { sm: 280 },
                    alignSelf: { xs: 'stretch', sm: 'auto' },
                    py: 1.8,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(0, 105, 92, 0.35)',
                    '&:hover': {
                      background: sewaPrimaryButtonHover,
                      boxShadow: '0 6px 20px rgba(0, 105, 92, 0.45)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Next →
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default KYCVerificationPage;

