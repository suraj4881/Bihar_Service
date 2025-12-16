import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Star,
  LocationOn,
  AccessTime,
  AttachMoney,
  Category,
  Sort,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Service, ServiceCategory, ServiceSearchParams } from '../types/service';
import { serviceService } from '../services/serviceService';

const ServiceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  
  // ✅ Sync language on mount from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      if (savedLanguage !== language) {
        setLanguage(savedLanguage as 'en' | 'hi');
      }
    }
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'popularity' | 'name'>('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadCategories();
    loadServices();
  }, [page, selectedCategory, selectedSubcategory, sortBy, sortOrder, minPrice, maxPrice, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await serviceService.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams: ServiceSearchParams = {
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        subcategory: selectedSubcategory || undefined,
        sortBy,
        sortOrder,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        page,
        size: 20,
      };

      const response = await serviceService.searchServices(searchParams);
      setServices(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadServices();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    setPage(0);
  };

  const handleSortChange = (sortBy: 'price' | 'rating' | 'popularity' | 'name') => {
    setSortBy(sortBy);
    setPage(0);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1);
  };

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  const handleAddService = () => {
    setShowAddService(true);
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || '🔧';
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#FF6B35';
  };

  const filteredCategories = categories.filter(cat => cat.isActive);

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Services
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Find the perfect service for your needs
          </Typography>

          {/* Search Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search services..."
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
              sx={{ backgroundColor: 'white' }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{ minWidth: 100 }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddService}
              sx={{ backgroundColor: '#2E7D32' }}
            >
              Add Service
            </Button>
          </Box>

          {/* Filters */}
          {showFilters && (
            <Card sx={{ mb: 3, p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {filteredCategories.map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.icon} {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value as any)}
                      label="Sort By"
                    >
                      <MenuItem value="popularity">Popularity</MenuItem>
                      <MenuItem value="price">Price</MenuItem>
                      <MenuItem value="rating">Rating</MenuItem>
                      <MenuItem value="name">Name</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Min Price"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Max Price"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Card>
          )}
        </Box>

        {/* Category Tabs */}
        <Box sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label="All Services"
              onClick={() => {
                setSelectedCategory('');
                setSelectedSubcategory('');
                setPage(0);
              }}
            />
            {filteredCategories.map((category) => (
              <Tab
                key={category.id}
                label={category.name}
                onClick={() => handleCategoryChange(category.name)}
                sx={{ textTransform: 'none' }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Services Grid */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading services...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={loadServices} sx={{ mt: 2 }}>
              Try Again
            </Button>
          </Box>
        ) : services.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No services found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Try adjusting your search criteria or add a new service
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddService}
            >
              Add Service
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {services.map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                    onClick={() => handleServiceClick(service.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            backgroundColor: getCategoryColor(service.category) + '20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            fontSize: '24px',
                          }}
                        >
                          {service.icon}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {service.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {service.category}
                          </Typography>
                        </Box>
                        {service.isPopular && (
                          <Chip
                            label="Popular"
                            size="small"
                            color="primary"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {service.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Star sx={{ color: '#FFD700', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {service.averageRating.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({service.bookingCount} bookings)
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoney sx={{ color: '#FF6B35', fontSize: 16 }} />
                          <Typography variant="h6" sx={{ color: '#FF6B35', fontWeight: 'bold' }}>
                            ₹{service.basePrice}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            / {service.priceUnit}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            {service.duration}
                          </Typography>
                        </Box>
                      </Box>

                      {service.tags && service.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {service.tags.slice(0, 3).map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              sx={{
                                backgroundColor: getCategoryColor(service.category) + '20',
                                color: getCategoryColor(service.category),
                                fontSize: '0.7rem',
                              }}
                            />
                          ))}
                          {service.tags.length > 3 && (
                            <Chip
                              label={`+${service.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      )}

                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: getCategoryColor(service.category),
                          '&:hover': {
                            backgroundColor: getCategoryColor(service.category),
                            opacity: 0.9,
                          },
                        }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}

            {/* Results Summary */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {services.length} of {totalElements} services
              </Typography>
            </Box>
          </>
        )}

        {/* Add Service Dialog */}
        <Dialog
          open={showAddService}
          onClose={() => setShowAddService(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add New Service</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Can't find the service you're looking for? Add a custom service request.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We'll review your request and add it to our service list if it's suitable for our platform.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setShowAddService(false);
                navigate('/add-service');
              }}
            >
              Add Custom Service
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddService(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ServiceListPage;
