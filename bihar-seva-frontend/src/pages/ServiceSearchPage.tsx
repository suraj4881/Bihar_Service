import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
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
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Search, LocationOn, FilterList, SearchOff, Map, List as ListIcon, MyLocation, Phone, WhatsApp, Chat } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import { getApiUrl } from '../config/config';


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
      const apiUrl = getApiUrl(`/api/services/search?${params.toString()}`);
      
      
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
            profilePhoto: service.serviceImages && service.serviceImages.length > 0 
              ? `http://localhost:8080/api/files/serve?filePath=${encodeURIComponent(service.serviceImages[0])}`
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

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card
          sx={{
            mb: 4,
            p: { xs: 3, md: 4 },
            color: '#fff',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 40%, #2563EB 100%)',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Find trusted services near you
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Search by service name or use live GPS to discover providers in your area.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
              <Button variant="contained" color="secondary" onClick={() => { setLocationType('gps'); getCurrentLocation(); }} sx={{ bgcolor: '#F97316', '&:hover': { bgcolor: '#EA580C' } }}>
                Use GPS
              </Button>
              <Button variant="outlined" onClick={() => navigate('/support')} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: '#fff' } }}>
                Need Help?
              </Button>
            </Grid>
          </Grid>
        </Card>
        {/* Search Bar */}
        <Card sx={{ mb: 4, p: 2.5, borderRadius: 3, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
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
                  <MenuItem value="city">City</MenuItem>
                  <MenuItem value="gps">GPS Location</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              {locationType === 'gps' ? (
                <TextField
                  fullWidth
                  placeholder={userLocation ? 'Location detected' : 'Click Nearby to detect'}
                  value={userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : ''}
                  disabled
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
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
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
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                sx={{
                  height: '56px',
                  bgcolor: '#FF6B35',
                  '&:hover': { bgcolor: '#E64A19' },
                }}
              >
                Search
              </Button>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={locationLoading ? <CircularProgress size={16} /> : <MyLocation />}
                onClick={getCurrentLocation}
                disabled={locationLoading}
                sx={{
                  height: '56px',
                  borderColor: '#FF6B35',
                  color: '#FF6B35',
                  '&:hover': { borderColor: '#E64A19', bgcolor: 'rgba(255, 107, 53, 0.04)' },
                }}
                title="Find Nearby Services"
              >
                Nearby
              </Button>
            </Grid>
          </Grid>
        </Card>

        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <FilterList sx={{ mr: 1 }} />
                  <Typography variant="h6">Filters</Typography>
                </Box>

                {/* Price Range */}
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>Price Range</Typography>
                  <Slider
                    value={priceRange}
                    onChange={(_, newValue) => setPriceRange(newValue as number[])}
                    valueLabelDisplay="auto"
                    min={0}
                    max={2000}
                    step={50}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">₹{priceRange[0]}</Typography>
                    <Typography variant="body2">₹{priceRange[1]}</Typography>
                  </Box>
                </Box>

                {/* Rating Filter */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <FormLabel>Minimum Rating</FormLabel>
                  <Select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value as number)}
                  >
                    <MenuItem value={0}>All</MenuItem>
                    <MenuItem value={4}>4★ & above</MenuItem>
                    <MenuItem value={4.5}>4.5★ & above</MenuItem>
                  </Select>
                </FormControl>

                {/* Verified Only */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={onlyVerified}
                      onChange={(e) => setOnlyVerified(e.target.checked)}
                    />
                  }
                  label="Verified Providers Only"
                />

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setPriceRange([0, 2000]);
                    setMinRating(0);
                    setOnlyVerified(true);
                  }}
                  sx={{ mt: 2 }}
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Results */}
          <Grid item xs={12} md={9}>
            {!loading && providers.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {providers.length} Provider{providers.length !== 1 ? 's' : ''} Found
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Button
                      size="small"
                      variant={viewMode === 'list' ? 'contained' : 'text'}
                      onClick={() => setViewMode('list')}
                      startIcon={<ListIcon />}
                      sx={{
                        borderRadius: 0,
                        bgcolor: viewMode === 'list' ? '#FF6B35' : 'transparent',
                        color: viewMode === 'list' ? 'white' : 'inherit',
                        '&:hover': { bgcolor: viewMode === 'list' ? '#E64A19' : 'rgba(0,0,0,0.04)' },
                      }}
                    >
                      List
                    </Button>
                    <Button
                      size="small"
                      variant={viewMode === 'map' ? 'contained' : 'text'}
                      onClick={() => setViewMode('map')}
                      startIcon={<Map />}
                      sx={{
                        borderRadius: 0,
                        bgcolor: viewMode === 'map' ? '#FF6B35' : 'transparent',
                        color: viewMode === 'map' ? 'white' : 'inherit',
                        '&:hover': { bgcolor: viewMode === 'map' ? '#E64A19' : 'rgba(0,0,0,0.04)' },
                      }}
                    >
                      Map
                    </Button>
                  </Box>
                  <FormControl sx={{ minWidth: 200 }}>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="rating">Sort by Rating</MenuItem>
                      <MenuItem value="price-low">Price: Low to High</MenuItem>
                      <MenuItem value="price-high">Price: High to Low</MenuItem>
                      <MenuItem value="reviews">Most Reviews</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <CircularProgress size={60} sx={{ color: '#FF6B35', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Searching for providers...
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
                <SearchOff sx={{ fontSize: 120, color: '#E0E0E0', mb: 3 }} />
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                  No Providers Found
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 500 }}>
                  We couldn't find any providers matching your search criteria. Try adjusting your filters or search for a different service.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setSearchQuery('');
                      setOnlyVerified(false);
                      setMinRating(0);
                      setPriceRange([0, 2000]);
                    }}
                    sx={{
                      bgcolor: '#FF6B35',
                      '&:hover': { bgcolor: '#E64A19' },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    Clear All Filters
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                    sx={{
                      borderColor: '#FF6B35',
                      color: '#FF6B35',
                      '&:hover': {
                        borderColor: '#E64A19',
                        bgcolor: 'rgba(255, 107, 53, 0.04)',
                      },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    Back to Home
                  </Button>
                </Box>
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
                      sx={{ bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E64A19' } }}
                    >
                      View as List
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
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => navigate(`/provider/${provider.id}`)}
                    >
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={3} md={2}>
                            <Avatar
                              src={provider.profilePhoto}
                              sx={{ width: 80, height: 80, bgcolor: '#FF6B35', fontSize: '2rem' }}
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
                              sx={{ mt: 1, bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E64A19' } }}
                            >
                              Book Now
                            </Button>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/provider/${provider.id}`);
                              }}
                              sx={{ mt: 1 }}
                            >
                              View Profile
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
                    '& .MuiPaginationItem-root': {
                      '&.Mui-selected': {
                        bgcolor: '#FF6B35',
                        '&:hover': {
                          bgcolor: '#E64A19',
                        },
                      },
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

