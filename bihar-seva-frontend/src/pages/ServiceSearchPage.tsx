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
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Search, LocationOn, FilterList, ArrowBack, SearchOff } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import StatusBadge from '../components/StatusBadge';
import { dummyProviders, DummyProvider } from '../data/dummyProviders';
import { config, getApiUrl, devLog } from '../config/config';

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
  experience: number;
}

const ServiceSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
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
  const [location, setLocation] = useState(searchParams.get('location') || 'Patna');
  const [priceRange, setPriceRange] = useState<number[]>([0, 2000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState(true);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = ['Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'AC Repair', 'Painting'];

  useEffect(() => {
    // Fetch/filter providers whenever dependencies change
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, location, priceRange, selectedCategories, minRating, onlyVerified, sortBy, page]);

  const loadDummyData = () => {
    // Check if dummy data is available (for development only)
    if (!dummyProviders || dummyProviders.length === 0) {
      devLog('⚠️ No dummy data available. Please ensure backend is running.');
      setProviders([]);
      setTotalPages(0);
      return;
    }
    
    devLog('🧪 DEVELOPMENT MODE - Using dummy data');
    devLog('🔍 Search Query:', searchQuery);
    devLog('📍 Location:', location);
    devLog('💰 Price Range:', priceRange);
    devLog('⭐ Min Rating:', minRating);
    devLog('✅ Only Verified:', onlyVerified);
    devLog('📂 Selected Categories:', selectedCategories);
    
    // Convert dummy providers to Provider format
    let filtered: Provider[] = dummyProviders.map((p: DummyProvider) => ({
      id: p.id,
      name: p.name,
      skill: p.skill,
      rating: p.rating,
      totalReviews: p.totalReviews,
      city: p.city,
      price: p.hourlyRate,
      isVerified: p.isVerified,
      experience: parseInt(p.experience),
    }));
    
    devLog('📦 Total providers before filter:', filtered.length);

    // Apply search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const skill = p.skill.toLowerCase();
        const name = p.name.toLowerCase();
        
        // Match full word or partial match
        return (
          skill.includes(query) ||
          name.includes(query) ||
          // Handle variations like "plumber" matching "plumbing"
          (query.includes('plumb') && skill.includes('plumb')) ||
          (query.includes('electric') && skill.includes('electric')) ||
          (query.includes('clean') && skill.includes('clean')) ||
          (query.includes('carpen') && skill.includes('carpen')) ||
          (query.includes('ac') && skill.includes('ac')) ||
          (query.includes('paint') && skill.includes('paint'))
        );
      });
      devLog('🔍 After search filter:', filtered.length);
    }

    // Apply location filter
    if (location && location.trim() !== '') {
      const beforeCount = filtered.length;
      filtered = filtered.filter((p) => 
        p.city.toLowerCase().trim() === location.toLowerCase().trim()
      );
      devLog(`📍 After location filter (${location}):`, filtered.length, `(was ${beforeCount})`);
      if (filtered.length > 0) {
        devLog('📍 Matching cities:', Array.from(new Set(filtered.map(p => p.city))));
      }
    }

    if (onlyVerified) {
      filtered = filtered.filter((p) => p.isVerified);
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.skill));
    }

    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (minRating > 0) {
      filtered = filtered.filter((p) => p.rating >= minRating);
    }

    // Sort
    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    }

    devLog('✅ Filtered providers:', filtered.length);
    devLog('👥 Providers:', filtered.map(p => `${p.name} (${p.skill})`));
    
    setProviders(filtered);
    setTotalPages(Math.ceil(filtered.length / 9));
  };

  const fetchProviders = async () => {
    setLoading(true);
    
    try {
      // Build API URL with query parameters
      const apiUrl = getApiUrl(
        `/api/providers/search?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(location)}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}&verified=${onlyVerified}&sort=${sortBy}&page=${page}`
      );
      
      devLog('🌐 Fetching from API:', apiUrl);
      
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
          devLog('✅ BACKEND DATA received:', data.data.length, 'providers');
          setProviders(data.data);
          setTotalPages(data.totalPages || Math.ceil(data.data.length / 9));
          setLoading(false);
          return;
        }
      }
      
      // Fallback to dummy data only in development
      if (config.features.useDummyData) {
        devLog('⚠️ Backend not available, using DUMMY data (development only)');
        loadDummyData();
      } else {
        // Production: No dummy data, show empty state
        devLog('❌ Backend not available and dummy data disabled');
        setProviders([]);
        setTotalPages(0);
      }
      
    } catch (error) {
      devLog('⚠️ Backend error:', error);
      
      // Fallback to dummy data only in development
      if (config.features.useDummyData) {
        devLog('📦 Using DUMMY data fallback');
        loadDummyData();
      } else {
        // Production: Show empty state
        setProviders([]);
        setTotalPages(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSearch = () => {
    setPage(1);
    fetchProviders();
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Logo size="small" showText onClick={() => navigate('/')} />
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => navigate('/profile')}>Profile</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
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
            <Grid item xs={12} md={4}>
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
            </Grid>
            <Grid item xs={12} md={3}>
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
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <FilterList sx={{ mr: 1 }} />
                  <Typography variant="h6">Filters</Typography>
                </Box>

                {/* Categories */}
                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend">Categories</FormLabel>
                  <FormGroup>
                    {categories.map((category) => (
                      <FormControlLabel
                        key={category}
                        control={
                          <Checkbox
                            checked={selectedCategories.includes(category)}
                            onChange={() => handleCategoryChange(category)}
                          />
                        }
                        label={category}
                      />
                    ))}
                  </FormGroup>
                </FormControl>

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
                    setSelectedCategories([]);
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
                      setSelectedCategories([]);
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
                
                {/* Suggestions */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Popular Services:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
                    {['Plumber', 'Electrician', 'Cleaner', 'Carpenter', 'AC Repair', 'Painter'].map((service) => (
                      <Button
                        key={service}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSearchQuery(service);
                          setPage(1);
                        }}
                        sx={{
                          borderColor: '#E0E0E0',
                          color: 'text.secondary',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#FF6B35',
                            color: '#FF6B35',
                          },
                        }}
                      >
                        {service}
                      </Button>
                    ))}
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
                          <Grid item xs={12} sm={9} md={7}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6">{provider.name}</Typography>
                              {provider.isVerified && <StatusBadge status="verified" />}
                            </Box>
                            <Typography color="text.secondary" gutterBottom>
                              {provider.skill} • {provider.experience} years experience
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Rating value={provider.rating} precision={0.1} size="small" readOnly />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                {provider.rating} ({provider.totalReviews} reviews)
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationOn sx={{ fontSize: 18, mr: 0.5 }} />
                              <Typography variant="body2">{provider.city}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
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

