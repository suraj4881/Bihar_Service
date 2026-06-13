import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
} from '@mui/material';
import { Phone, Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeMode } from '../contexts/ThemeContext';
import Logo from './Logo';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { mode } = useThemeMode();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: mode === 'dark' ? '#0F172A' : '#1E293B',
        color: mode === 'dark' ? '#CBD5E0' : 'white',
        py: 6,
        mt: 8,
        borderTop: mode === 'dark' ? '1px solid #334155' : 'none',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Logo size="medium" showText />
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: mode === 'dark' ? '#A0AEC0' : 'rgba(255,255,255,0.8)',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  mt: 0.5,
                }}
              >
                सेवा का भरोसा
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                opacity: 0.9,
                lineHeight: 1.8,
                color: mode === 'dark' ? '#CBD5E0' : 'rgba(255,255,255,0.9)',
              }}
            >
              SewaBihar — Bihar&apos;s trusted home services platform. Connect with verified professionals for every need.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <IconButton
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <Phone />
              </IconButton>
              <IconButton
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <Email />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              {t('footer.company')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 1, opacity: 0.9, cursor: 'pointer', '&:hover': { color: '#3B82F6' } }}
              onClick={() => navigate('/about')}
            >
              {t('footer.about')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 1, opacity: 0.9, cursor: 'pointer', '&:hover': { color: '#3B82F6' } }}
            >
              {t('footer.careers')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              {t('footer.customers')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 1, opacity: 0.9, cursor: 'pointer', '&:hover': { color: '#3B82F6' } }}
              onClick={() => navigate('/services')}
            >
              {t('footer.browse')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 1, opacity: 0.9, cursor: 'pointer', '&:hover': { color: '#3B82F6' } }}
            >
              {t('footer.howItWorks')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              {t('footer.providers')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 1, opacity: 0.9, cursor: 'pointer', '&:hover': { color: '#3B82F6' } }}
              onClick={() => navigate('/register')}
            >
              {t('footer.join')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              {t('footer.contact')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
              {t('footer.email')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
              {t('footer.phone')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mb: 1, opacity: 0.9, cursor: 'pointer', '&:hover': { color: '#3B82F6' } }}
              onClick={() => navigate('/contact')}
            >
              {t('footer.contactUs')}
            </Typography>
          </Grid>
        </Grid>
        <Box
          sx={{
            borderTop: mode === 'dark' ? '1px solid #334155' : '1px solid rgba(255,255,255,0.1)',
            mt: 4,
            pt: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              opacity: 0.8,
              color: mode === 'dark' ? '#A0AEC0' : 'inherit',
            }}
          >
            {t('footer.copyright')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
