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
} from '@mui/material';
import {
  CloudUpload,
  CameraAlt,
  CheckCircle,
  Fingerprint,
  CreditCard,
  ArrowBack,
  PhotoCamera,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

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
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const steps = ['Aadhaar Verification', 'PAN Card', 'Selfie Verification', 'Review & Submit'];

  // Handle file uploads with preview
  const handleFileUpload = (
    file: File,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
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
      // Call Aadhaar OTP API (Mock for now)
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
      // Call Aadhaar verification API (Mock for now)
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
    try {
      const formData = new FormData();
      formData.append('userId', user?.id || '');
      formData.append('userRole', user?.role || 'CUSTOMER');
      
      if (aadhaarMethod === 0) {
        formData.append('documentType', 'AADHAAR');
        if (aadhaarFront) formData.append('documentFront', aadhaarFront);
        if (aadhaarBack) formData.append('documentBack', aadhaarBack);
      } else {
        formData.append('documentType', 'AADHAAR_OTP');
        formData.append('documentNumber', aadhaarNumber);
      }
      
      if (panCard) formData.append('panCard', panCard);
      formData.append('panNumber', panNumber);
      
      if (selfie) formData.append('selfie', selfie);
      
      const response = await fetch('http://localhost:8080/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setError('');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(data.message || 'KYC submission failed');
      }
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
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Aadhaar Verification
            </Typography>
            
            <Tabs
              value={aadhaarMethod}
              onChange={(_, newValue) => setAadhaarMethod(newValue)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Upload Aadhaar Scan" icon={<CloudUpload />} />
              <Tab label="Verify with OTP" icon={<Fingerprint />} />
            </Tabs>
            
            <TabPanel value={aadhaarMethod} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      border: '2px dashed #667eea',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(102,126,234,0.05)' },
                    }}
                    component="label"
                  >
                    {aadhaarFrontPreview ? (
                      <img src={aadhaarFrontPreview} alt="Aadhaar Front" style={{ maxWidth: '100%', maxHeight: 200 }} />
                    ) : (
                      <>
                        <CloudUpload sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Upload Aadhaar Front
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Click to browse
                        </Typography>
                      </>
                    )}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setAadhaarFront, setAadhaarFrontPreview)}
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      border: '2px dashed #667eea',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(102,126,234,0.05)' },
                    }}
                    component="label"
                  >
                    {aadhaarBackPreview ? (
                      <img src={aadhaarBackPreview} alt="Aadhaar Back" style={{ maxWidth: '100%', maxHeight: 200 }} />
                    ) : (
                      <>
                        <CloudUpload sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Upload Aadhaar Back
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Click to browse
                        </Typography>
                      </>
                    )}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setAadhaarBack, setAadhaarBackPreview)}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
            
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
                      bgcolor: '#667eea',
                      '&:hover': { bgcolor: '#764ba2' },
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
                            bgcolor: '#667eea',
                            '&:hover': { bgcolor: '#764ba2' },
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
          </Box>
        );
        
      case 1: // PAN Card
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              PAN Card Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '2px dashed #667eea',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(102,126,234,0.05)' },
                  }}
                  component="label"
                >
                  {panCardPreview ? (
                    <img src={panCardPreview} alt="PAN Card" style={{ maxWidth: '100%', maxHeight: 250 }} />
                  ) : (
                    <>
                      <CreditCard sx={{ fontSize: 80, color: '#667eea', mb: 2 }} />
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        Upload PAN Card
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click to browse
                      </Typography>
                    </>
                  )}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setPanCard, setPanCardPreview)}
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
                  sx={{ mb: 2 }}
                />
                <Alert severity="info" sx={{ mt: 2 }}>
                  Please ensure PAN number matches the uploaded card
                </Alert>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2: // Selfie
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Selfie Verification
            </Typography>
            
            <Tabs
              value={selfieMethod}
              onChange={(_, newValue) => setSelfieMethod(newValue)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Upload Photo" icon={<CloudUpload />} />
              <Tab label="Live Capture" icon={<CameraAlt />} />
            </Tabs>
            
            <TabPanel value={selfieMethod} index={0}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed #667eea',
                  cursor: 'pointer',
                  maxWidth: 400,
                  mx: 'auto',
                  '&:hover': { bgcolor: 'rgba(102,126,234,0.05)' },
                }}
                component="label"
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie" style={{ maxWidth: '100%', borderRadius: 8 }} />
                ) : (
                  <>
                    <PhotoCamera sx={{ fontSize: 100, color: '#667eea', mb: 2 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                      Upload Your Selfie
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click to browse
                    </Typography>
                  </>
                )}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], setSelfie, setSelfiePreview)}
                />
              </Paper>
            </TabPanel>
            
            <TabPanel value={selfieMethod} index={1}>
              <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
                {!cameraActive && !selfiePreview && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={startCamera}
                    startIcon={<CameraAlt />}
                    sx={{
                      bgcolor: '#667eea',
                      '&:hover': { bgcolor: '#764ba2' },
                      py: 2,
                      px: 4,
                    }}
                  >
                    Start Camera
                  </Button>
                )}
                
                {cameraActive && (
                  <Box>
                    <video
                      ref={videoRef}
                      autoPlay
                      style={{
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: 8,
                        border: '3px solid #667eea',
                      }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={captureSelfie}
                        startIcon={<PhotoCamera />}
                        sx={{
                          bgcolor: '#667eea',
                          '&:hover': { bgcolor: '#764ba2' },
                        }}
                      >
                        Capture
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={stopCamera}
                        sx={{
                          borderColor: '#667eea',
                          color: '#667eea',
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
                
                {selfiePreview && !cameraActive && (
                  <Box>
                    <img
                      src={selfiePreview}
                      alt="Captured Selfie"
                      style={{
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: 8,
                        border: '3px solid #4CAF50',
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelfie(null);
                        setSelfiePreview('');
                      }}
                      sx={{ mt: 2 }}
                    >
                      Retake
                    </Button>
                  </Box>
                )}
                
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
            </TabPanel>
          </Box>
        );
        
      case 3: // Review
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
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
            
            <Alert severity="warning" sx={{ mt: 3 }}>
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 100, color: '#4CAF50', mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              KYC Submitted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your documents are under review. You'll be notified once verified.
            </Typography>
            <CircularProgress />
            <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
              Redirecting to home...
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            mb: 2,
            bgcolor: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
          }}
        >
          <ArrowBack />
        </IconButton>
        
        <Card elevation={10} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
              KYC Verification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
              Complete your KYC to start offering/booking services
            </Typography>
            
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            
            {renderStepContent()}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ textTransform: 'none' }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{
                    bgcolor: '#667eea',
                    '&:hover': { bgcolor: '#764ba2' },
                    px: 4,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit KYC'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    bgcolor: '#667eea',
                    '&:hover': { bgcolor: '#764ba2' },
                    px: 4,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Next
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

