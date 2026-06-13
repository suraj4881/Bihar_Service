import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardActionArea, useTheme } from '@mui/material';
import { Build, ElectricalServices, CleaningServices, Carpenter, AcUnit, FormatPaint, Plumbing, LocalLaundryService } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const CategoryGrid: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useLanguage();

  const categories = [
    { id: 1, nameKey: 'service.plumbing', searchTerm: 'plumbing', icon: <Plumbing sx={{ fontSize: 48 }} />, color: '#2196F3', count: 45 },
    { id: 2, nameKey: 'service.electrical', searchTerm: 'electrical', icon: <ElectricalServices sx={{ fontSize: 48 }} />, color: '#FFC107', count: 38 },
    { id: 3, nameKey: 'service.cleaning', searchTerm: 'cleaning', icon: <CleaningServices sx={{ fontSize: 48 }} />, color: '#4CAF50', count: 52 },
    { id: 4, nameKey: 'service.carpentry', searchTerm: 'carpentry', icon: <Carpenter sx={{ fontSize: 48 }} />, color: '#795548', count: 28 },
    { id: 5, nameKey: 'service.ac', searchTerm: 'ac', icon: <AcUnit sx={{ fontSize: 48 }} />, color: '#00BCD4', count: 34 },
    { id: 6, nameKey: 'service.painting', searchTerm: 'painting', icon: <FormatPaint sx={{ fontSize: 48 }} />, color: '#E91E63', count: 25 },
    { id: 7, nameKey: 'service.appliance', searchTerm: 'appliance', icon: <LocalLaundryService sx={{ fontSize: 48 }} />, color: '#9C27B0', count: 41 },
    { id: 8, nameKey: 'service.other', searchTerm: 'other', icon: <Build sx={{ fontSize: 48 }} />, color: '#607D8B', count: 67 },
  ];

  return (
    <Box sx={{ 
      py: 8, 
      background: isDark 
        ? 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
        : 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
    }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          align="center"
          sx={{ 
            mb: 1, 
            fontWeight: 700, 
            color: isDark ? '#E2E8F0' : '#212121',
          }}
        >
          {t('section.services.title')}
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{ 
            mb: 6,
            color: isDark ? '#A0AEC0' : 'text.secondary',
          }}
        >
          {t('section.services.subtitle')}
        </Typography>

        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={6} sm={4} md={3} key={category.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  bgcolor: isDark ? '#1E293B' : 'white',
                  border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: isDark 
                      ? '0 8px 24px rgba(59, 130, 246, 0.3)'
                      : '0 8px 24px rgba(59, 130, 246, 0.15)',
                    borderColor: category.color,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/services?category=${category.searchTerm}`)}
                  sx={{ height: '100%', p: 3 }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 0 }}>
                    <Box
                      sx={{
                        color: category.color,
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {category.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {t(category.nameKey)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.count} {t('service.providers')}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default CategoryGrid;

