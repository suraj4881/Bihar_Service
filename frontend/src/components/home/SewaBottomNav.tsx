import React from 'react';
import { Box, Typography } from '@mui/material';
import HomeRounded from '@mui/icons-material/HomeRounded';
import EventNoteRounded from '@mui/icons-material/EventNoteRounded';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type TabKey = 'home' | 'bookings' | 'offers' | 'account';

const SewaBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const active: TabKey =
    pathname === '/'
      ? 'home'
      : pathname.includes('customer-dashboard') || pathname.includes('booking')
        ? 'bookings'
        : pathname.includes('profile') || pathname.includes('login')
          ? 'account'
          : 'home';

  const goBookings = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const role = localStorage.getItem('role');
    if (role === 'CUSTOMER') navigate('/customer-dashboard');
    else if (role === 'PROVIDER') navigate('/provider-dashboard');
    else navigate('/customer-dashboard');
  };

  const items: { key: TabKey; label: string; icon: React.ReactNode; onClick: () => void }[] = [
    { key: 'home', label: 'Home', icon: <HomeRounded />, onClick: () => navigate('/') },
    { key: 'bookings', label: 'Bookings', icon: <EventNoteRounded />, onClick: goBookings },
    {
      key: 'offers',
      label: 'Offers',
      icon: <LocalOfferRounded />,
      onClick: () => {
        const el = document.getElementById('sewa-offers');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else navigate('/');
      },
    },
    {
      key: 'account',
      label: 'Account',
      icon: <PersonRounded />,
      onClick: () => navigate(isAuthenticated ? '/profile' : '/login'),
    },
  ];

  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: 0.5,
          width: '100%',
          maxWidth: 420,
          px: 1.5,
          py: 1,
          borderRadius: 999,
          bgcolor: 'rgba(15, 23, 42, 0.94)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {items.map(({ key, label, icon, onClick }) => {
          const isActive = active === key;
          return (
            <Box
              key={key}
              onClick={onClick}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.25,
                cursor: 'pointer',
                py: 0.5,
                borderRadius: 999,
                color: isActive ? '#26A69A' : 'rgba(255,255,255,0.55)',
                bgcolor: isActive ? 'rgba(38, 166, 154, 0.15)' : 'transparent',
                transition: 'color 0.2s, background 0.2s',
                '& svg': { fontSize: 24 },
              }}
            >
              {icon}
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SewaBottomNav;
