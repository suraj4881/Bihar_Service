import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Slider,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Avatar,
  Rating,
  InputAdornment,
  Pagination,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import { Search, LocationOn, FilterList, SearchOff, Map, List as ListIcon, MyLocation } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import { getApiUrl, getFileServeUrl } from '../utils/api';
import {
  sewaHeroBarGradient,
  sewaPrimaryButtonGradient,
  sewaPrimaryButtonHover,
} from '../theme/sewaDesign';

const searchFieldSx = {
  '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
} as const;

const primaryContainedSx = {
  background: sewaPrimaryButtonGradient,
  color: '#fff',
  '&:hover': { background: sewaPrimaryButtonHover },
} as const;

const outlinedPrimarySx = {
  borderColor: 'primary.main',
  color: 'primary.main',
  '&:hover': { borderColor: 'primary.dark', bgcolor: 'rgba(0, 105, 92, 0.06)' },
} as const;


// Frontend Provider interface (for display)
interface Provider {
  id: string;
  name: string;
  skill: string;
  rating: number;
  totalReviews: number;
  city: string;
  price: number;
  isVerified: boolean;
  profilePhoto?: string;
  experience?: number;
  expertiseLevel?: string;
  biography?: string; // Optional field for search matching
  phone?: string;
  whatsappNumber?: string;
  allowDirectCall?: boolean;
  allowWhatsApp?: boolean;
  allowInAppChat?: boolean;
  completedJobs?: number;
}

const ServiceSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const hi = language === 'hi';
  const [searchParams] = useSearchParams();
  
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
  
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [priceRange, setPriceRange] = useState<number[]>([0, 2000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState(true);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(5); // Default 5km
  const [locationType, setLocationType] = useState<'city' | 'gps'>('city');

  // Update search query when URL params change
  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    const locationParam = searchParams.get('location') || '';
    
    if (queryParam !== searchQuery) {
      setSearchQuery(queryParam);
    }
    
    if (locationParam !== location) {
      setLocation(locationParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // Fetch/filter providers whenever dependencies change
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    location,
    locationType,
    userLocation,
    searchRadius,
    priceRange,
    minRating,
    onlyVerified,
    sortBy,
    page,
  ]);


  const fetchProviders = async () => {
    setLoading(true);
    
    try {
      // Build API URL with query parameters
      // Use SearchController endpoint for dynamic services
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim() !== '') {
        params.append('query', searchQuery.trim());
      }
      // Add location based on selected type
      if (locationType === 'gps' && userLocation) {
        params.append('latitude', userLocation.latitude.toString());
        params.append('longitude', userLocation.longitude.toString());
        params.append('radiusKm', searchRadius.toString());
      } else if (locationType === 'city' && location && location.trim() !== '') {
        params.append('city', location.trim());
      }
      // Category filter removed from UI
      
      // Use services collection search endpoint
      const apiUrl = getApiUrl(`services/search?${params.toString()}`);
      
      
      // Try to fetch from backend API
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data && Array.isArray(data.data)) {
          // If backend returns empty results, show empty state
          if (data.data.length === 0) {
            setProviders([]);
            setTotalPages(0);
            setLoading(false);
            return;
          }
          
          // Convert DynamicService to Provider format for display
          const convertedProviders: Provider[] = data.data.map((service: any) => ({
            id: service.id,
            name: service.providerName || 'Provider',
            skill: service.serviceName || service.category || 'Service',
            rating: service.averageRating || 0,
            totalReviews: service.totalReviews || 0,
            city: service.city || service.address || (service.serviceAreas && service.serviceAreas[0]) || 'N/A',
            price: service.finalPrice || service.basePrice || service.price || 0,
            isVerified: service.isVerified || service.isApproved || false,
            profilePhoto:
              service.serviceImages && service.serviceImages.length > 0
                ? getFileServeUrl(service.serviceImages[0])
                : undefined,
            experience: service.experience,
            expertiseLevel: service.expertiseLevel,
            phone: service.phone,
            whatsappNumber: service.whatsappNumber,
            allowDirectCall: service.allowDirectCall,
            allowWhatsApp: service.allowWhatsApp,
            allowInAppChat: service.allowInAppChat,
            completedJobs: service.completedJobs || 0,
          }));
          
          setProviders(convertedProviders);
          setTotalPages(data.totalPages || Math.ceil(convertedProviders.length / 9));
          setLoading(false);
          return;
        }
      }
      
      // Show empty state if backend not available
      setProviders([]);
      setTotalPages(0);
      setLoading(false);
      
    } catch (error) {
      // Show empty state on error
      setProviders([]);
      setTotalPages(0);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProviders();
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    
    setLocationLoading(true);
    setLocationType('gps');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocationLoading(false);
        // Auto-search nearby services
        fetchProviders();
      },
      (error) => {
        setLocationLoading(false);
        setLocationType('city');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <AppBar variant="simple" position="sticky" showBackButton showNavLinks={false} showAuthButtons={false} />

      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Card
          sx={{
            mb: { xs: 2, md: 4 },
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
          <Grid container spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.35rem', sm: '2rem' } }}>
                {hi
                  ? 'अपने पास भरोसेमंद सेवाएँ खोजें'
                  : 'Find trusted services near you'}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 560 }}>
                {hi
                  ? 'सेवा नाम से खोजें या लाइव GPS से अपने क्षेत्र में प्रदाता देखें।'
                  : 'Search by service name or use live GPS to discover providers in your area.'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ justifyContent: { xs: 'stretch', md: 'flex-end' }, alignItems: 'stretch' }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setLocationType('gps');
                    getCurrentLocation();
                  }}
                  sx={{ ...primaryContainedSx, textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
                >
                  {hi ? 'GPS उपयोग करें' : 'Use GPS'}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/support')}
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.65)',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 999,
                    '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  {hi ? 'मदद चाहिए?' : 'Need help?'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Card>
        {/* Search */}
        <Card
          sx={{
            mb: { xs: 2, md: 4 },
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder={hi ? 'सेवाएँ खोजें…' : 'Search for services…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={searchFieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <Select
                  value={locationType}
                  onChange={(e) => {
                    const nextType = e.target.value as 'city' | 'gps';
                    setLocationType(nextType);
                    if (nextType === 'gps') {
                      getCurrentLocation();
                    } else {
                      setUserLocation(null);
                    }
                  }}
                  sx={{ height: '56px' }}
                >
                  <MenuItem value="city">{hi ? 'शहर' : 'City'}</MenuItem>
                  <MenuItem value="gps">{hi ? 'GPS स्थान' : 'GPS location'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              {locationType === 'gps' ? (
                <TextField
                  fullWidth
                  placeholder={
                    userLocation
                      ? hi
                        ? 'स्थान मिला'
                        : 'Location detected'
                      : hi
                        ? 'पास के लिए Nearby दबाएँ'
                        : 'Click Nearby to detect'
                  }
                  value={userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : ''}
                  disabled
                  sx={searchFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MyLocation />
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField
                  fullWidth
                  placeholder={hi ? 'स्थान / शहर' : 'Location'}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  sx={searchFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Grid>
            <Grid item xs={12} md={1}>
              <FormControl fullWidth>
                <Select
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value as number)}
                  sx={{ height: '56px' }}
                  disabled={locationType !== 'gps'}
                >
                  <MenuItem value={5}>5 km</MenuItem>
                  <MenuItem value={10}>10 km</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                sx={{
                  height: '56px',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  ...primaryContainedSx,
                }}
              >
                {hi ? 'खोजें' : 'Search'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={locationLoading ? <CircularProgress size={16} color="inherit" /> : <MyLocation />}
                onClick={getCurrentLocation}
                disabled={locationLoading}
                sx={{
                  height: '56px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  ...outlinedPrimarySx,
                }}
                title={hi ? 'आस-पास की सेवाएँ' : 'Find nearby services'}
              >
                {hi ? 'पास में' : 'Nearby'}
              </Button>
            </Grid>
          </Grid>
        </Card>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Filters */}
          <Grid item xs={12} md={3}>
            <Card
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
                position: { md: 'sticky' },
                top: { md: 88 },
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FilterList sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {hi ? 'फ़िल्टर' : 'Filters'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom variant="subtitle2" color="text.secondary">
                    {hi ? 'मूल्य सीमा' : 'Price range'}
                  </Typography>
                  <Slider
                    value={priceRange}
                    onChange={(_, newValue) => setPriceRange(newValue as number[])}
                    valueLabelDisplay="auto"
                    min={0}
                    max={2000}
                    step={50}
                    color="primary"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">₹{priceRange[0]}</Typography>
                    <Typography variant="body2">₹{priceRange[1]}</Typography>
                  </Box>
                </Box>

                {/* Rating Filter */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {hi ? 'न्यूनतम रेटिंग' : 'Minimum rating'}
                  </Typography>
                  <Select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value as number)}
                  >
                    <MenuItem value={0}>{hi ? 'सभी' : 'All'}</MenuItem>
                    <MenuItem value={4}>4★ & above</MenuItem>
                    <MenuItem value={4.5}>4.5★ & above</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={onlyVerified}
                      onChange={(e) => setOnlyVerified(e.target.checked)}
                    />
                  }
                  label={hi ? 'केवल सत्यापित प्रदाता' : 'Verified providers only'}
                  sx={{ alignItems: 'flex-start', mb: 0 }}
                />

                <Button
                  fullWidth
                  variant="text"
                  color="primary"
                  onClick={() => {
                    setPriceRange([0, 2000]);
                    setMinRating(0);
                    setOnlyVerified(true);
                  }}
                  sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  {hi ? 'फ़िल्टर रीसेट' : 'Reset filters'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Results */}
          <Grid item xs={12} md={9}>
            {!loading && providers.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {hi
                    ? providers.length === 1
                      ? '1 प्रदाता मिला'
                      : `${providers.length} प्रदाता मिले`
                    : `${providers.length} Provider${providers.length !== 1 ? 's' : ''} found`}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    alignItems: { xs: 'stretch', md: 'center' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Button
                      size="small"
                      variant={viewMode === 'list' ? 'contained' : 'text'}
                      onClick={() => setViewMode('list')}
                      startIcon={<ListIcon />}
                      sx={{
                        borderRadius: 0,
                        flex: 1,
                        textTransform: 'none',
                        ...(viewMode === 'list'
                          ? primaryContainedSx
                          : { '&:hover': { bgcolor: 'action.hover' } }),
                      }}
                    >
                      {hi ? 'सूची' : 'List'}
                    </Button>
                    <Button
                      size="small"
                      variant={viewMode === 'map' ? 'contained' : 'text'}
                      onClick={() => setViewMode('map')}
                      startIcon={<Map />}
                      sx={{
                        borderRadius: 0,
                        flex: 1,
                        textTransform: 'none',
                        ...(viewMode === 'map'
                          ? primaryContainedSx
                          : { '&:hover': { bgcolor: 'action.hover' } }),
                      }}
                    >
                      {hi ? 'मानचित्र' : 'Map'}
                    </Button>
                  </Box>
                  <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="rating">{hi ? 'रेटिंग' : 'Sort by rating'}</MenuItem>
                      <MenuItem value="price-low">{hi ? 'कीमत: कम से ज़्यादा' : 'Price: low to high'}</MenuItem>
                      <MenuItem value="price-high">{hi ? 'कीमत: ज़्यादा से कम' : 'Price: high to low'}</MenuItem>
                      <MenuItem value="reviews">{hi ? 'सबसे ज़्यादा समीक्षा' : 'Most reviews'}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <CircularProgress size={56} color="primary" sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {hi ? 'प्रदाता खोज रहे हैं…' : 'Searching for providers…'}
                </Typography>
              </Box>
            ) : providers.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  px: 3,
                }}
              >
                <SearchOff sx={{ fontSize: 96, color: 'action.disabled', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {hi ? 'कोई प्रदाता नहीं मिला' : 'No providers found'}
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 480 }}>
                  {hi
                    ? 'आपकी शर्तों से मेल खाने वाला कोई प्रदाता नहीं मिला। फ़िल्टर बदलकर या दूसरी सेवा खोजकर देखें।'
                    : "We couldn't find any providers matching your search. Try adjusting filters or searching for a different service."}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', maxWidth: 420 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      setSearchQuery('');
                      setOnlyVerified(false);
                      setMinRating(0);
                      setPriceRange([0, 2000]);
                    }}
                    sx={{ ...primaryContainedSx, px: 3, py: 1.25, textTransform: 'none', fontWeight: 700 }}
                  >
                    {hi ? 'सभी फ़िल्टर हटाएँ' : 'Clear all filters'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={() => navigate('/')}
                    sx={{ ...outlinedPrimarySx, px: 3, py: 1.25, textTransform: 'none', fontWeight: 600 }}
                  >
                    {hi ? 'होम पर वापस' : 'Back to home'}
                  </Button>
                </Stack>
              </Box>
            ) : viewMode === 'map' ? (
              <Box sx={{ height: '600px', border: '1px solid #e0e0e0', borderRadius: 2, position: 'relative', bgcolor: '#f5f5f5' }}>
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, bgcolor: 'white', p: 2, borderRadius: 2, boxShadow: 2 }}>
                  <Typography variant="h6" gutterBottom>Map View</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {providers.length} providers found
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ListIcon />}
                    onClick={() => setViewMode('list')}
                    sx={{ mt: 2 }}
                  >
                    Switch to List
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Map sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Map View Coming Soon
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Interactive map with provider locations will be available soon
                    </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ListIcon />}
                    onClick={() => setViewMode('list')}
                    sx={{ ...primaryContainedSx, textTransform: 'none', fontWeight: 600 }}
                  >
                    {hi ? 'सूची में देखें' : 'View as list'}
                  </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {providers.map((provider) => (
                  <Grid item xs={12} key={provider.id}>
                    <Card
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 28px rgba(15, 23, 42, 0.08)',
                        },
                      }}
                      onClick={() => navigate(`/provider/${provider.id}`)}
                    >
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={3} md={2}>
                            <Avatar
                              src={provider.profilePhoto}
                              sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}
                            >
                              {provider.name[0]}
                            </Avatar>
                          </Grid>
                          <Grid item xs={12} sm={9} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6">{provider.name}</Typography>
                              {provider.isVerified && <StatusBadge status="verified" />}
                            </Box>
                            <Typography color="text.secondary" gutterBottom>
                              {provider.skill}
                              {' • '}
                              {provider.experience
                                ? `${provider.experience} years experience`
                                : provider.expertiseLevel
                                  ? provider.expertiseLevel
                                  : 'Experience N/A'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
                              <Rating value={provider.rating} precision={0.1} size="small" readOnly />
                              <Typography variant="body2" color="text.secondary">
                                {provider.rating} ({provider.totalReviews} reviews)
                              </Typography>
                              {provider.completedJobs !== undefined && provider.completedJobs > 0 && (
                                <Chip
                                  label={`${provider.completedJobs} jobs completed`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <LocationOn sx={{ fontSize: 18, mr: 0.5 }} />
                              <Typography variant="body2">{provider.city}</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Book to unlock chat and call.
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                            <Typography variant="h5" color="primary" gutterBottom>
                              ₹{provider.price}+
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Starting price
                            </Typography>
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/booking/${provider.id}`);
                              }}
                              sx={{ mt: 1, textTransform: 'none', fontWeight: 700, ...primaryContainedSx }}
                            >
                              {hi ? 'अभी बुक करें' : 'Book now'}
                            </Button>
                            <Button
                              variant="outlined"
                              color="primary"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/provider/${provider.id}`);
                              }}
                              sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
                            >
                              {hi ? 'प्रोफ़ाइल देखें' : 'View profile'}
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Pagination */}
            {!loading && providers.length > 0 && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root.Mui-selected': {
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ServiceSearchPage;

