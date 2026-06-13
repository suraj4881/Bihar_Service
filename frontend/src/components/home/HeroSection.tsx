import React from 'react';
import { Box, Container, Typography, TextField, Button, InputAdornment, Grid, Card, CardContent } from '@mui/material';
import { Search, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [location, setLocation] = React.useState('Patna');

  const handleSearch = () => {
    navigate(`/services?q=${searchQuery}&location=${location}`);
  };

  const popularSearches = ['Plumber', 'Electrician', 'Cleaner', 'Carpenter', 'AC Repair'];

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
        color: 'white',
        py: { xs: 6, md: 10 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 700,
                mb: 2,
              }}
            >
              Find Trusted Local Service Providers in Bihar
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                opacity: 0.95,
                fontWeight: 400,
              }}
            >
              Book verified professionals for home services at your doorstep
            </Typography>

            {/* Search Box */}
            <Card sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    placeholder="What service do you need?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
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
                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSearch}
                    sx={{
                      height: '56px',
                      backgroundColor: '#FF6B35',
                      '&:hover': {
                        backgroundColor: '#E64A19',
                      },
                    }}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>

              {/* Popular Searches */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Popular:
                </Typography>
                {popularSearches.map((search) => (
                  <Button
                    key={search}
                    size="small"
                    onClick={() => {
                      setSearchQuery(search);
                      handleSearch();
                    }}
                    sx={{
                      ml: 1,
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {search}
                  </Button>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Hero Image/Illustration */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box
              sx={{
                width: '100%',
                height: '400px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
              }}
            >
              🏠🔧
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;

