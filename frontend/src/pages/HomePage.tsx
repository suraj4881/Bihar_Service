import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import { useLocation } from '../contexts/LocationContext';
import SewaMarketingHome, { SewaStats } from '../components/home/SewaMarketingHome';
import SewaBottomNav from '../components/home/SewaBottomNav';
import AppBar from '../components/AppBar';

interface Stats {
  totalProviders: number;
  verifiedProviders: number;
  totalCustomers: number;
  totalBookings: number;
  totalCategories: number;
  averageRating: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { location, getCurrentLocation, loading: gpsLoading, updateLocation } = useLocation();
  const syncingFromGps = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState(() => {
    try {
      return localStorage.getItem('searchCity') || 'Patna';
    } catch {
      return 'Patna';
    }
  });

  const setCity = (city: string) => {
    setLocationLabel(city);
    try {
      localStorage.setItem('searchCity', city);
    } catch {
      /* ignore */
    }
    updateLocation({
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0,
      address: location?.address ?? city,
      city,
      state: location?.state ?? 'Bihar',
      pincode: location?.pincode ?? '',
    });
  };

  useEffect(() => {
    if (!syncingFromGps.current) return;
    if (gpsLoading) return;
    syncingFromGps.current = false;
    if (location?.city) {
      setLocationLabel(location.city);
      try {
        localStorage.setItem('searchCity', location.city);
      } catch {
        /* ignore */
      }
    }
  }, [gpsLoading, location?.city]);

  const handleUseGpsLocation = () => {
    syncingFromGps.current = true;
    void getCurrentLocation();
  };
  const [stats, setStats] = useState<Stats>({
    totalProviders: 0,
    verifiedProviders: 0,
    totalCustomers: 0,
    totalBookings: 0,
    totalCategories: 0,
    averageRating: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(getApiUrl('stats/dashboard'));
      const data = await response.json();

      if (data.success && data.data) {
        setStats({
          totalProviders: data.data.totalProviders || 0,
          verifiedProviders: data.data.verifiedProviders || 0,
          totalCustomers: data.data.totalCustomers || 0,
          totalBookings: data.data.totalBookings || 0,
          totalCategories: data.data.totalCategories || 0,
          averageRating: data.data.averageRating || 0,
        });
      }
    } catch {
      // keep defaults; UI shows static trust copy
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    navigate(`/services?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationLabel)}`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const sewaStats: SewaStats = {
    totalProviders: stats.totalProviders,
    verifiedProviders: stats.verifiedProviders,
    totalCustomers: stats.totalCustomers,
    totalBookings: stats.totalBookings,
    totalCategories: stats.totalCategories,
    averageRating: stats.averageRating,
  };

  return (
    <Box component="main" sx={{ position: 'relative' }}>
      <AppBar variant="default" position="sticky" />
      <SewaMarketingHome
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        locationLabel={locationLabel}
        setLocationLabel={setCity}
        onSearch={handleSearch}
        onUseGpsLocation={handleUseGpsLocation}
        gpsLocationLoading={gpsLoading}
        stats={sewaStats}
        statsLoading={statsLoading}
        formatNumber={formatNumber}
      />
      <SewaBottomNav />
    </Box>
  );
};

export default HomePage;
