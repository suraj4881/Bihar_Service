import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Handyman, Build } from '@mui/icons-material';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | number;
  showText?: boolean;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // ✅ Handle both string and number sizes
  const getSizes = () => {
    if (typeof size === 'number') {
      return {
        container: size,
        icon: Math.round(size * 0.6),
        text: `${size / 30}rem`,
        tagline: `${size / 80}rem`,
      };
    }
    
    const predefinedSizes: Record<string, { container: number; icon: number; text: string; tagline: string }> = {
      small: { container: 32, icon: 20, text: '1.1rem', tagline: '0.55rem' },
      medium: { container: 44, icon: 26, text: '1.5rem', tagline: '0.65rem' },
      large: { container: 56, icon: 32, text: '2rem', tagline: '0.75rem' },
    };
    
    // ✅ Fallback to medium if invalid size
    return predefinedSizes[size as string] || predefinedSizes.medium;
  };
  
  const sizes = getSizes();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {/* Logo Icon - Service Badge */}
      <Box
        sx={{
          position: 'relative',
          width: sizes.container,
          height: sizes.container,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.25)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 3,
            borderRadius: '50%',
            background: 'white',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <Handyman
            sx={{
              fontSize: sizes.icon,
              color: '#FF6B35',
              transform: 'rotate(-15deg)',
            }}
          />
          <Build
            sx={{
              fontSize: sizes.icon * 0.7,
              color: '#F7931E',
              position: 'absolute',
              bottom: '25%',
              right: '25%',
            }}
          />
        </Box>
      </Box>

      {/* Logo Text */}
      {showText && (
        <Box>
          <Typography
            sx={{
              fontSize: sizes.text,
              fontWeight: 800,
              fontFamily: '"Poppins", sans-serif',
              lineHeight: 1,
              letterSpacing: '-0.5px',
            }}
          >
            <Box component="span" sx={{ color: isDark ? '#E2E8F0' : '#212121' }}>
              Bihar
            </Box>
            <Box component="span" sx={{ color: '#FF6B35' }}>
              Seva
            </Box>
          </Typography>
          {size !== 'small' && (
            <Typography
              sx={{
                fontSize: sizes.tagline,
                color: isDark ? '#A0AEC0' : '#757575',
                fontWeight: 600,
                letterSpacing: '0.5px',
                mt: 0.3,
              }}
            >
              सेवा का भरोसा
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Logo;
