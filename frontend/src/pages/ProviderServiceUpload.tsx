import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  Alert,
  CircularProgress,
  MenuItem,
  Chip,
  Paper,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
  Radio,
  RadioGroup,
  FormLabel,
  Stack,
} from '@mui/material';
import {
  AttachMoney,
  Description,
  Add,
  Delete,
  PhotoCamera,
  CheckCircle,
  ArrowBack,
  MyLocation,
  LocationOn,
  EditLocation,
  Phone,
  WhatsApp,
  Chat,
  AccessTime,
  CalendarToday,
  Label,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { serviceService } from '../services/serviceService';
import type { ServiceCategory } from '../types/service';
import { SERVICE_CATEGORIES } from '../data/homeContent';
import { getApiUrl } from '../utils/api';
import {
  sewaHeroBarGradient,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const fieldFocusSx = {
  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
} as const;

const primaryBtnSx = {
  background: sewaPrimaryButtonGradient,
  color: '#fff',
  '&:hover': { background: sewaPrimaryButtonHover },
} as const;

interface ServiceImage {
  file: File | null;
  preview: string;
}

/** Same labels as the marketing home page when API has no `/service-categories` data. */
function categoriesFromHomePage(): ServiceCategory[] {
  return SERVICE_CATEGORIES.map((c) => ({
    id: `home-${c.id}`,
    name: c.name,
    description: '',
    icon: c.iconKey,
    color: c.color,
    isActive: true,
    sortOrder: c.id,
    serviceCount: 0,
    createdAt: '',
    updatedAt: '',
    subcategories: [] as string[],
    popularServices: [] as string[],
    tags: [] as string[],
    requiresKYC: false,
    requiresLocation: false,
    allowsCustomPricing: true,
    defaultPriceUnit: 'per service',
    defaultDuration: '',
  }));
}

function categoryMenuLabel(c: ServiceCategory, hi: boolean): string {
  if (!hi) return c.name;
  const home = SERVICE_CATEGORIES.find((x) => x.name === c.name);
  return home?.nameHi ?? c.name;
}

const ProviderServiceUpload: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const hi = language === 'hi';
  const { user, provider } = useAuth();
  
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
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [serviceData, setServiceData] = useState({
    title: '',
    description: '',
    category: '',
    basePrice: '', // Provider's actual price
    expertiseLevel: 'INTERMEDIATE',
    estimatedDuration: '',
    serviceArea: '',
    tags: [] as string[],
  });
  
  const [contactOptions, setContactOptions] = useState({
    allowDirectCall: true,
    allowWhatsApp: true,
    allowInAppChat: true,
  });
  
  const [availability, setAvailability] = useState({
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    availableFrom: '09:00',
    availableTo: '18:00',
    isAvailableNow: true,
  });
  
  const [tagInput, setTagInput] = useState('');
  
  const [locationMethod, setLocationMethod] = useState<'live' | 'manual'>('manual');
  const [liveLocation, setLiveLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    pincode?: string;
  } | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [serviceImages, setServiceImages] = useState<ServiceImage[]>([]);
  const serviceImageInputRef = useRef<HTMLInputElement>(null);

  const [categoryMode, setCategoryMode] = useState<'existing' | 'custom'>('existing');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  /** API list when backend exposes `/api/service-categories`; otherwise home marketing list. */
  const [categoryListSource, setCategoryListSource] = useState<'api' | 'home'>('home');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCategoriesLoading(true);
      try {
        const res = await serviceService.getCategories();
        if (
          !cancelled &&
          res.success &&
          res.data &&
          res.data.length > 0
        ) {
          const active = res.data.filter((c) => c.isActive !== false);
          setCategories(active.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
          setCategoryListSource('api');
        } else if (!cancelled) {
          setCategories(categoriesFromHomePage());
          setCategoryListSource('home');
        }
      } catch {
        if (!cancelled) {
          setCategories(categoriesFromHomePage());
          setCategoryListSource('home');
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const expertiseLevels = [
    { value: 'BEGINNER', label: 'Beginner (0-2 years)' },
    { value: 'INTERMEDIATE', label: 'Intermediate (2-5 years)' },
    { value: 'EXPERT', label: 'Expert (5-10 years)' },
    { value: 'MASTER', label: 'Master (10+ years)' },
  ];

  const handleChange = (field: string, value: any) => {
    setServiceData({ ...serviceData, [field]: value });
    setError('');
  };

  const handleCategoryModeChange = (mode: 'existing' | 'custom') => {
    setCategoryMode(mode);
    setServiceData((prev) => ({ ...prev, category: '' }));
    setError('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (!window.isSecureContext) {
      setError('Live location requires HTTPS or localhost. Please use manual entry.');
      return;
    }
    
    setError('');
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          // Reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || fallbackAddress;
          const locationAddress = data.address || {};
          const city =
            locationAddress.city ||
            locationAddress.town ||
            locationAddress.village ||
            locationAddress.county ||
            locationAddress.state_district ||
            locationAddress.state ||
            '';
          const pincode = locationAddress.postcode || '';
          
          setLiveLocation({ latitude, longitude, address, city, pincode });
          setServiceData({
            ...serviceData,
            serviceArea: address,
          });
          setError('');
        } catch (err) {
          const { latitude, longitude } = position.coords;
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLiveLocation({ latitude, longitude, address: fallbackAddress });
          setServiceData({
            ...serviceData,
            serviceArea: fallbackAddress,
          });
          setError('Failed to get address from location. Showing coordinates instead.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        let errorMessage = 'Failed to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location permission denied. Please enable location access in your browser settings or use manual entry.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. Please try again or use manual entry.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or use manual entry.';
            break;
          default:
            errorMessage += 'Please use manual entry.';
            break;
        }
        
        setError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const newImages: ServiceImage[] = [];
      let loadedCount = 0;
      const totalFiles = files.length;
      
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          loadedCount++;
          newImages.push({
            file,
            preview: e.target?.result as string,
          });
          if (loadedCount === totalFiles) {
            setServiceImages((prev) => {
              const updated = [...prev, ...newImages];
              return updated;
            });
          }
        };
        reader.onerror = (error) => {
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUploadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't prevent default if clicking directly on the input
    if ((e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple rapid clicks
    if (loading) {
      return;
    }
    
    // Use requestAnimationFrame to ensure the click happens properly
    requestAnimationFrame(() => {
      if (serviceImageInputRef.current) {
        try {
          serviceImageInputRef.current.click();
        } catch (error) {
          // Ignore click errors
        }
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setServiceImages(serviceImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!serviceData.title || !serviceData.description || !serviceData.basePrice) {
      setError(hi ? 'सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields');
      return;
    }

    const categoryTrimmed = serviceData.category?.trim() || '';
    if (!categoryTrimmed) {
      setError(
        hi
          ? 'श्रेणी चुनें या अपनी सेवा का प्रकार लिखें।'
          : 'Select a category from the list or enter your custom service type.'
      );
      return;
    }

    if (categoryMode === 'existing' && categories.length > 0) {
      const names = new Set(categories.map((c) => c.name));
      if (!names.has(categoryTrimmed)) {
        setError(hi ? 'सूची से एक वैध श्रेणी चुनें।' : 'Please choose a valid category from the list.');
        return;
      }
    }

    if (parseFloat(serviceData.basePrice) <= 0) {
      setError('Base price must be greater than 0');
      return;
    }

    // Validate service area
    if (!serviceData.serviceArea || serviceData.serviceArea.trim() === '') {
      setError('Please provide service area location');
      return;
    }

    if (!provider?.id && !user?.id) {
      setError('Session expired. Please login again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Use new dynamic service API
      const providerId = provider?.id || user?.id || '';
      const catTrim = serviceData.category.trim();
      const matchedCategory = categories.find((c) => c.name === catTrim);
      const servicePayload = {
        providerId,
        serviceName: serviceData.title,
        description: serviceData.description,
        category: catTrim,
        categoryId: categoryMode === 'existing' && matchedCategory ? matchedCategory.id : undefined,
        basePrice: parseFloat(serviceData.basePrice),
        price: parseFloat(serviceData.basePrice),
        priceUnit: 'per service',
        serviceArea: serviceData.serviceArea,
        serviceAreas: serviceData.serviceArea ? [serviceData.serviceArea] : [],
        address: serviceData.serviceArea,
        city: liveLocation?.city || manualLocation || '',
        pincode: liveLocation?.pincode || '',
        availableDays: availability.availableDays,
        availableFrom: availability.availableFrom,
        availableTo: availability.availableTo,
        isAvailableNow: availability.isAvailableNow,
        allowDirectCall: contactOptions.allowDirectCall,
        allowWhatsApp: contactOptions.allowWhatsApp,
        allowInAppChat: contactOptions.allowInAppChat,
        serviceRadius: 5, // Default 5km
        latitude: liveLocation?.latitude,
        longitude: liveLocation?.longitude,
        tags: serviceData.tags,
      };
      
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('services/create'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicePayload),
      });

      let data: any = null;
      let errorMessage = '';
      if (!response.ok) {
        try {
          data = await response.json();
          errorMessage = data?.message || data?.error || '';
        } catch (error) {
          const errorText = await response.text();
          errorMessage = errorText;
        }
        setError(errorMessage || 'Failed to upload service. Please try again.');
        return;
      }
      
      data = await response.json();

      if (data.success && data.data) {
        setSuccess(true);
        setError('');
        setTimeout(() => {
          navigate('/provider-dashboard');
        }, 2000);
      } else {
        const errorMsg = data.message || data.error || 'Service upload failed';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
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
          background: sewaHeroBarGradient,
        }}
      >
        <Container maxWidth="sm" sx={{ px: 2 }}>
          <Paper
            sx={{
              p: { xs: 3, sm: 5 },
              textAlign: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
            }}
          >
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              {hi ? 'सेवा सफलतापूर्वक अपलोड हुई!' : 'Service uploaded successfully'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {hi
                ? 'प्रशासन की मंज़ूरी के बाद यह ग्राहकों को दिखेगी।'
                : 'Your service will appear to customers after admin approval.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {hi
                ? 'नोट: कीमत की समीक्षा की जा सकती है।'
                : 'Note: Admin may review pricing and commission.'}
            </Typography>
            <CircularProgress color="primary" />
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 2, md: 4 } }}>
      <AppBar variant="simple" position="sticky" showBackButton />
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
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
              {hi ? 'नई सेवा जोड़ें' : 'Add new service'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 560 }}>
              {hi
                ? 'विवरण, कीमत और स्थान स्पष्ट रखें।'
                : 'Showcase your skills with clear details, pricing, and location.'}
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
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 800,
                textAlign: 'center',
                mb: 0.5,
                color: 'text.primary',
              }}
            >
              {hi ? 'सेवा विवरण अपलोड करें' : 'Upload your service details'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
              {hi
                ? 'अपनी सेवा के बारे में पूरी जानकारी दें'
                : 'Provide complete information about your service'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Alert severity="info" color="info" sx={{ mb: 3, borderRadius: 2 }}>
              <strong>{hi ? 'ज़रूरी:' : 'Important:'}</strong>{' '}
              {hi
                ? 'अपनी वास्तविक आधार कीमत दर्ज करें। अंतिम ग्राहक कीमत पर प्रशासन कमीशन (लगभग 20%) जोड़ सकता है।'
                : 'Enter your actual base price. Admin commission (~20%) may be added to the final customer price.'}
            </Alert>

            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, pl: 1.5, borderLeft: 4, borderColor: 'primary.main' }}>
                  {hi ? 'मूल जानकारी' : 'Basic information'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={hi ? 'सेवा शीर्षक' : 'Service title'}
                  value={serviceData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={hi ? 'उदा. घरेलू प्लंबिंग मरम्मत' : 'e.g., Professional home plumbing repair'}
                  required
                  sx={fieldFocusSx}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={hi ? 'विस्तृत विवरण' : 'Detailed description'}
                  value={serviceData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={
                    hi
                      ? 'सेवा, कौशल, सामग्री आदि लिखें।'
                      : "Describe your service, expertise, what's included, materials used, etc."
                  }
                  sx={fieldFocusSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Description color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <FormLabel component="legend" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, display: 'block' }}>
                  {hi ? 'श्रेणी / सेवा प्रकार' : 'Category / service type'}
                </FormLabel>
                <RadioGroup
                  value={categoryMode}
                  onChange={(e) => handleCategoryModeChange(e.target.value as 'existing' | 'custom')}
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 0, sm: 2 },
                    mb: 2,
                  }}
                >
                  <FormControlLabel
                    value="existing"
                    control={<Radio color="primary" />}
                    disabled={categoriesLoading}
                    label={
                      hi
                        ? 'होम पेज वाली सूची से श्रेणी चुनें'
                        : 'Choose from home page categories'
                    }
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio color="primary" />}
                    label={hi ? 'अपनी अलग सेवा / नाम लिखें' : 'Enter a different custom service name'}
                  />
                </RadioGroup>

                {categoryMode === 'existing' && categories.length > 0 && (
                  <FormControl fullWidth sx={{ mb: { xs: 2, sm: 0 } }}>
                    <InputLabel id="category-select-label">{hi ? 'श्रेणी चुनें' : 'Select category'}</InputLabel>
                    <Select
                      labelId="category-select-label"
                      label={hi ? 'श्रेणी चुनें' : 'Select category'}
                      value={serviceData.category}
                      displayEmpty
                      onChange={(e) => handleChange('category', e.target.value)}
                      disabled={categoriesLoading}
                    >
                      <MenuItem value="">
                        <em>{hi ? '— चुनें —' : '— Select —'}</em>
                      </MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.name}>
                          {categoryMenuLabel(c, hi)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {categoryMode === 'custom' && (
                  <TextField
                    fullWidth
                    label={hi ? 'कस्टम सेवा / श्रेणी' : 'Custom service or category'}
                    value={serviceData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder={hi ? 'उदा. विशेष मार्बल पॉलिशिंग' : 'e.g., Specialized marble polishing'}
                    helperText={
                      hi
                        ? 'वह नाम लिखें जो आपकी सेवा सबसे अच्छे से बताए।'
                        : 'Describe the type of work in your own words.'
                    }
                    sx={fieldFocusSx}
                  />
                )}

                {categoriesLoading && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <CircularProgress size={18} color="primary" />
                    <Typography variant="caption" color="text.secondary">
                      {hi ? 'श्रेणियाँ लोड हो रही हैं…' : 'Loading categories…'}
                    </Typography>
                  </Stack>
                )}
                {!categoriesLoading && categoryListSource === 'home' && (
                  <Alert severity="info" sx={{ mt: 1, borderRadius: 2 }}>
                    {hi
                      ? 'श्रेणियाँ होम पेज जैसी ही सूची से ली गई हैं। आप चाहें तो नीचे “अलग सेवा” में अपना शब्द भी लिख सकते हैं।'
                      : 'Categories match the home page. You can still pick “custom service” to type your own label — your choice is saved with this listing.'}
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={hi ? 'कौशल स्तर' : 'Expertise level'}
                  value={serviceData.expertiseLevel}
                  onChange={(e) => handleChange('expertiseLevel', e.target.value)}
                  sx={fieldFocusSx}
                >
                  {expertiseLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Pricing */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, pl: 1.5, borderLeft: 4, borderColor: 'primary.main' }}>
                  {hi ? 'मूल्य विवरण' : 'Pricing details'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={hi ? 'आपकी आधार कीमत (₹)' : 'Your base price (₹)'}
                  value={serviceData.basePrice}
                  onChange={(e) => handleChange('basePrice', e.target.value)}
                  placeholder="1000"
                  sx={fieldFocusSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  required
                  helperText={
                    hi ? 'यह आपकी कमाई है; ग्राहक पर कमीशन जोड़ा जा सकता है।' : 'Your earnings; commission may be added for customers.'
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: (theme) => theme.palette.primary.main + '14',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {hi ? 'अनुमानित ग्राहक कीमत (~20% कमीशन):' : 'Estimated customer price (~20% commission):'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    ₹
                    {serviceData.basePrice
                      ? Math.round(parseFloat(serviceData.basePrice) * 1.2).toLocaleString('en-IN')
                      : '0'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {hi ? 'आपकी कमाई: ' : 'Your earnings: '}
                    ₹{serviceData.basePrice ? parseFloat(serviceData.basePrice).toLocaleString('en-IN') : '0'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration"
                  value={serviceData.estimatedDuration}
                  onChange={(e) => handleChange('estimatedDuration', e.target.value)}
                  placeholder="e.g., 2-3 hours"
                  helperText="How long does this service typically take?"
                />
              </Grid>

              {/* Tags Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Tags (Optional)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {serviceData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => {
                        const newTags = serviceData.tags.filter((_, i) => i !== index);
                        handleChange('tags', newTags);
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Add Tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        if (!serviceData.tags.includes(tagInput.trim())) {
                          handleChange('tags', [...serviceData.tags, tagInput.trim()]);
                        }
                        setTagInput('');
                      }
                    }}
                    placeholder="e.g., emergency, 24/7, certified"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Label />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Press Enter to add tag. Tags help customers find your service."
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => {
                      if (tagInput.trim() && !serviceData.tags.includes(tagInput.trim())) {
                        handleChange('tags', [...serviceData.tags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                    sx={{ minWidth: 100 }}
                  >
                    Add
                  </Button>
                </Box>
              </Grid>

              {/* Contact Options */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Contact Options
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contactOptions.allowDirectCall}
                        onChange={(e) => setContactOptions({ ...contactOptions, allowDirectCall: e.target.checked })}
                        icon={<Phone />}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone sx={{ fontSize: 20 }} />
                        <Typography>Allow Direct Phone Calls</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contactOptions.allowWhatsApp}
                        onChange={(e) => setContactOptions({ ...contactOptions, allowWhatsApp: e.target.checked })}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WhatsApp sx={{ fontSize: 20, color: '#25D366' }} />
                        <Typography>Allow WhatsApp Contact</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contactOptions.allowInAppChat}
                        onChange={(e) => setContactOptions({ ...contactOptions, allowInAppChat: e.target.checked })}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chat sx={{ fontSize: 20 }} />
                        <Typography>Allow In-App Chat</Typography>
                      </Box>
                    }
                  />
                </FormGroup>
              </Grid>

              {/* Availability */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Availability
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Available From"
                      value={availability.availableFrom}
                      onChange={(e) => setAvailability({ ...availability, availableFrom: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTime />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Available To"
                      value={availability.availableTo}
                      onChange={(e) => setAvailability({ ...availability, availableTo: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTime />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={availability.isAvailableNow}
                          onChange={(e) => setAvailability({ ...availability, isAvailableNow: e.target.checked })}
                        />
                      }
                      label="Available for immediate booking"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Available Days:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <Chip
                          key={day}
                          label={day.substring(0, 3)}
                          onClick={() => {
                            const days = availability.availableDays;
                            if (days.includes(day)) {
                              setAvailability({
                                ...availability,
                                availableDays: days.filter((d) => d !== day),
                              });
                            } else {
                              setAvailability({
                                ...availability,
                                availableDays: [...days, day],
                              });
                            }
                          }}
                          color={availability.availableDays.includes(day) ? 'primary' : 'default'}
                          variant={availability.availableDays.includes(day) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Service Area with Location Options */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Service Area
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                    <Button
                      variant={locationMethod === 'live' ? 'contained' : 'outlined'}
                      color="primary"
                      startIcon={loading && locationMethod === 'live' ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <MyLocation />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (loading || locationLoading) {
                          return;
                        }
                        setLocationMethod('live');
                        if (!liveLocation) {
                          getCurrentLocation();
                        } else {
                          setServiceData({
                            ...serviceData,
                            serviceArea: liveLocation.address,
                          });
                        }
                      }}
                      disabled={false}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        ...(locationMethod === 'live' ? primaryBtnSx : {}),
                      }}
                    >
                      {locationLoading && locationMethod === 'live' ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          Getting Location...
                        </>
                      ) : (
                        'Use Live Location'
                      )}
                    </Button>
                    <Button
                      variant={locationMethod === 'manual' ? 'contained' : 'outlined'}
                      color="primary"
                      startIcon={<EditLocation />}
                      onClick={() => setLocationMethod('manual')}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        ...(locationMethod === 'manual' ? primaryBtnSx : {}),
                      }}
                    >
                      {hi ? 'मैन्युअल दर्ज करें' : 'Enter manually'}
                    </Button>
                  </Stack>

                  {locationMethod === 'live' ? (
                    <Box>
                      {liveLocation ? (
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: 'rgba(76,175,80,0.08)',
                            border: '2px solid #4CAF50',
                            borderRadius: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOn sx={{ color: '#4CAF50', mr: 1 }} />
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', fontFamily: '"Poppins", sans-serif' }}>
                              Current Location
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#666', fontFamily: '"Poppins", sans-serif', mb: 1 }}>
                            {liveLocation.address}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999', fontFamily: '"Poppins", sans-serif' }}>
                            Coordinates: {liveLocation.latitude.toFixed(6)}, {liveLocation.longitude.toFixed(6)}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<MyLocation />}
                            onClick={getCurrentLocation}
                            sx={{
                              mt: 1,
                              textTransform: 'none',
                              fontFamily: '"Poppins", sans-serif',
                              color: '#4CAF50',
                            }}
                          >
                            Refresh Location
                          </Button>
                        </Paper>
                      ) : (
                        <Paper
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            border: '2px dashed',
                            borderColor: 'primary.light',
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                          }}
                        >
                          <MyLocation sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="body1" sx={{ mb: 2, fontFamily: '"Poppins", sans-serif' }}>
                            Click "Use Live Location" to get your current location
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  ) : (
                    <TextField
                      fullWidth
                      label={hi ? 'सेवा क्षेत्र' : 'Service area'}
                      value={manualLocation}
                      onChange={(e) => {
                        const value = e.target.value;
                        setManualLocation(value);
                        setServiceData({
                          ...serviceData,
                          serviceArea: value,
                        });
                      }}
                      placeholder={hi ? 'उदा. पटना, बोरिंग रोड' : 'e.g., Patna, Boring Road, Bihar'}
                      helperText={hi ? 'जहाँ आप यह सेवा देते हैं' : 'Enter the area where you provide this service'}
                      sx={fieldFocusSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn color="action" />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  )}
                </Box>
              </Grid>

              {/* Service Images */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Service Images (Optional)
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box
                  component="div"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: 'primary.light',
                    borderRadius: 2,
                    cursor: 'pointer',
                    userSelect: 'none',
                    position: 'relative',
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    },
                    '&:active': {
                      bgcolor: 'action.selected',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={handleUploadClick}
                >
                  <PhotoCamera sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    {hi ? 'सेवा की तस्वीरें अपलोड करें' : 'Upload service photos'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {hi ? 'पुराना काम, औज़ार या सेटअप दिखाएँ' : 'Show your previous work, tools, or setup'}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                    {hi ? 'अधिकतम 5 तस्वीरें • क्लिक करके चुनें' : 'Max 5 images • Click to browse'}
                  </Typography>
                  <input
                    type="file"
                    ref={serviceImageInputRef}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 2,
                      fontSize: 0,
                    }}
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </Box>

                {serviceImages.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {serviceImages.map((image, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Paper sx={{ position: 'relative', p: 1 }}>
                          <img
                            src={image.preview}
                            alt={`Service ${index + 1}`}
                            style={{ width: '100%', borderRadius: 4 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': { bgcolor: 'white' },
                            }}
                          >
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                mt: 4,
                py: 2,
                ...primaryBtnSx,
                boxShadow: '0 4px 20px rgba(0, 105, 92, 0.35)',
                '&:hover': {
                  background: sewaPrimaryButtonHover,
                  boxShadow: '0 6px 24px rgba(0, 105, 92, 0.45)',
                },
                fontWeight: 700,
                fontSize: '1.05rem',
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : hi ? (
                'अपलोड करें और मंज़ूरी हेतु भेजें'
              ) : (
                'Upload service & submit for approval'
              )}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ProviderServiceUpload;

