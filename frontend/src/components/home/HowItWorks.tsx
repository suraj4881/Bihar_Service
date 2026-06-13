import React from 'react';
import { Box, Container, Typography, Grid, Paper, Avatar, useTheme } from '@mui/material';
import { Search, EventAvailable, Payment, RateReview } from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';

const HowItWorks: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useLanguage();
  const steps = [
    {
      icon: <Search sx={{ fontSize: 48 }} />,
      titleKey: 'step1.title',
      descKey: 'step1.desc',
      color: '#2196F3',
    },
    {
      icon: <EventAvailable sx={{ fontSize: 48 }} />,
      titleKey: 'step2.title',
      descKey: 'step2.desc',
      color: '#4CAF50',
    },
    {
      icon: <Payment sx={{ fontSize: 48 }} />,
      titleKey: 'step3.title',
      descKey: 'step3.desc',
      color: '#FF9800',
    },
    {
      icon: <RateReview sx={{ fontSize: 48 }} />,
      titleKey: 'step4.title',
      descKey: 'step4.desc',
      color: '#9C27B0',
    },
  ];

  return (
    <Box sx={{ 
      py: 8, 
      background: isDark 
        ? 'linear-gradient(180deg, #0A0E27 0%, #1A1F3A 100%)'
        : 'linear-gradient(135deg, #FFF0E1 0%, #FFE4CC 50%, #FFD9B8 100%)',
    }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          align="center"
          sx={{ 
            mb: 1, 
            fontWeight: 700,
            color: isDark ? '#E2E8F0' : 'inherit',
          }}
        >
          {t('section.howItWorks.title')}
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{ 
            mb: 6,
            color: isDark ? '#A0AEC0' : 'text.secondary',
          }}
        >
          {t('section.howItWorks.subtitle')}
        </Typography>

        <Grid container spacing={4}>
          {steps.map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  bgcolor: isDark ? '#1A1F3A' : 'white',
                  border: isDark ? '1px solid #2D3748' : '1px solid #E0E0E0',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: isDark
                      ? '0 8px 24px rgba(255,107,53,0.3)'
                      : '0 8px 24px rgba(0,0,0,0.12)',
                    borderColor: step.color,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: `${step.color}15`,
                    color: step.color,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {step.icon}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t(step.titleKey)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(step.descKey)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HowItWorks;

