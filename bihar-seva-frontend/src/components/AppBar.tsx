import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  alpha,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Language as LanguageIcon,
  Brightness7,
  Brightness4,
  Login,
  PersonAdd,
  ArrowBack,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

interface AppBarProps {
  variant?: 'default' | 'simple' | 'dashboard';
  position?: 'static' | 'sticky' | 'fixed';
  showBackButton?: boolean;
  title?: string;
  showNavLinks?: boolean;
  showAuthButtons?: boolean;
  customActions?: React.ReactNode;
  sx?: object;
}

const AppBar: React.FC<AppBarProps> = ({
  variant = 'default',
  position = 'sticky',
  showBackButton = false,
  title,
  showNavLinks = true,
  showAuthButtons = true,
  customActions,
  sx = {},
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { language, setLanguage, t } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    localStorage.setItem('language', newLang);
    try {
      sessionStorage.setItem('language', newLang);
    } catch (e) {
      // Ignore sessionStorage errors
    }
    setLanguage(newLang);
  };

  // Dashboard variant
  if (variant === 'dashboard') {
    return (
      <MuiAppBar position={position} sx={{ bgcolor: '#667eea', ...sx }}>
        <Toolbar>
          <Logo size="medium" onClick={() => navigate('/')} />
          {title && (
            <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 700 }}>
              {title}
            </Typography>
          )}
          {customActions || (
            <>
              <IconButton color="inherit">
                <Notifications />
              </IconButton>
              <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
                <Avatar sx={{ bgcolor: '#764ba2', width: 32, height: 32 }}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </MuiAppBar>
    );
  }

  // Simple variant
  if (variant === 'simple') {
    return (
      <MuiAppBar
        position={position}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          color: 'text.primary',
          ...sx,
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          {showBackButton && (
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                mr: 2,
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' },
              }}
            >
              <ArrowBack />
            </IconButton>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <Logo size="medium" showText={true} />
          </Box>
          {customActions || (showAuthButtons && isAuthenticated && (
            <Button
              onClick={handleLogout}
              variant="contained"
              sx={{
                textTransform: 'none',
                background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #F7931E, #FF6B35)',
                  boxShadow: '0 6px 20px rgba(255, 107, 53, 0.6)',
                },
              }}
            >
              {t('logout') || 'Logout'}
            </Button>
          ))}
        </Toolbar>
      </MuiAppBar>
    );
  }

  // Default variant (full navigation)
  return (
    <MuiAppBar
      position={position}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        ...sx,
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <IconButton
          edge="start"
          color="inherit"
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Logo size="medium" showText onClick={() => navigate('/')} />

        <Box sx={{ flexGrow: 1 }} />

        {/* Language Toggle */}
        <Button
          onClick={handleLanguageToggle}
          startIcon={<LanguageIcon />}
          sx={{
            mr: 2,
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.primary',
            bgcolor: alpha('#FF6B35', 0.1),
            '&:hover': {
              bgcolor: alpha('#FF6B35', 0.2),
            },
          }}
        >
          {language === 'en' ? 'हिं' : 'EN'}
        </Button>

        {/* Dark/Light Mode Toggle */}
        <IconButton
          onClick={toggleTheme}
          color="inherit"
          sx={{
            mr: 2,
            bgcolor: alpha('#FF6B35', 0.1),
            '&:hover': {
              bgcolor: alpha('#FF6B35', 0.2),
            },
          }}
        >
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        {/* Navigation Links */}
        {showNavLinks && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/services')}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              {t('nav.services')}
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/about')}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              {t('nav.about')}
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/contact')}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              {t('nav.contact')}
            </Button>
          </Box>
        )}

        {/* Auth Buttons or User Menu */}
        {showAuthButtons && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isAuthenticated ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/profile')}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#FF6B35',
                    color: '#FF6B35',
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                >
                  {user?.name || 'Profile'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    const role = localStorage.getItem('role');
                    if (role === 'PROVIDER') {
                      navigate('/provider-dashboard');
                    } else if (role === 'ADMIN') {
                      navigate('/admin-dashboard');
                    } else {
                      navigate('/customer-dashboard');
                    }
                  }}
                  sx={{
                    bgcolor: '#FF6B35',
                    '&:hover': { bgcolor: '#E64A19' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  startIcon={<Login />}
                  onClick={() => navigate('/login')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/register')}
                  sx={{
                    bgcolor: '#FF6B35',
                    '&:hover': { bgcolor: '#E64A19' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {t('nav.signup')}
                </Button>
              </>
            )}
          </Box>
        )}

        {customActions}
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;

