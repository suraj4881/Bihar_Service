import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  });

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const theme: Theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#FF6B35',
            light: '#FF8C61',
            dark: '#E64A19',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#1e3c72',
            light: '#2a5298',
            dark: '#152a52',
            contrastText: '#FFFFFF',
          },
          background: {
            default: mode === 'light' ? '#F8F9FA' : '#0A0E27',
            paper: mode === 'light' ? '#FFFFFF' : '#1A1F3A',
          },
          text: {
            primary: mode === 'light' ? '#2D3748' : '#E2E8F0',
            secondary: mode === 'light' ? '#4A5568' : '#A0AEC0',
          },
          success: {
            main: '#10B981',
            light: '#34D399',
            dark: '#059669',
          },
          warning: {
            main: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706',
          },
          error: {
            main: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
          },
          info: {
            main: '#3B82F6',
            light: '#60A5FA',
            dark: '#2563EB',
          },
        },
        typography: {
          fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 900,
            fontSize: '3.5rem',
            lineHeight: 1.2,
          },
          h2: {
            fontWeight: 800,
            fontSize: '2.5rem',
            lineHeight: 1.3,
          },
          h3: {
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.4,
          },
          h4: {
            fontWeight: 700,
            fontSize: '1.5rem',
            lineHeight: 1.5,
          },
          h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.5,
          },
          h6: {
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.5,
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        shadows: mode === 'light' 
          ? [
              'none',
              '0px 2px 4px rgba(0,0,0,0.05)',
              '0px 4px 8px rgba(0,0,0,0.08)',
              '0px 8px 16px rgba(0,0,0,0.1)',
              '0px 12px 24px rgba(0,0,0,0.12)',
              '0px 16px 32px rgba(0,0,0,0.14)',
              '0px 20px 40px rgba(0,0,0,0.16)',
              '0px 24px 48px rgba(0,0,0,0.18)',
              '0px 28px 56px rgba(0,0,0,0.2)',
              '0px 32px 64px rgba(0,0,0,0.22)',
              '0px 36px 72px rgba(0,0,0,0.24)',
              '0px 40px 80px rgba(0,0,0,0.26)',
              '0px 44px 88px rgba(0,0,0,0.28)',
              '0px 48px 96px rgba(0,0,0,0.3)',
              '0px 52px 104px rgba(0,0,0,0.32)',
              '0px 56px 112px rgba(0,0,0,0.34)',
              '0px 60px 120px rgba(0,0,0,0.36)',
              '0px 64px 128px rgba(0,0,0,0.38)',
              '0px 68px 136px rgba(0,0,0,0.4)',
              '0px 72px 144px rgba(0,0,0,0.42)',
              '0px 76px 152px rgba(0,0,0,0.44)',
              '0px 80px 160px rgba(0,0,0,0.46)',
              '0px 84px 168px rgba(0,0,0,0.48)',
              '0px 88px 176px rgba(0,0,0,0.5)',
              '0px 92px 184px rgba(0,0,0,0.52)',
            ]
          : [
              'none',
              '0px 2px 4px rgba(0,0,0,0.3)',
              '0px 4px 8px rgba(0,0,0,0.35)',
              '0px 8px 16px rgba(0,0,0,0.4)',
              '0px 12px 24px rgba(0,0,0,0.45)',
              '0px 16px 32px rgba(0,0,0,0.5)',
              '0px 20px 40px rgba(0,0,0,0.55)',
              '0px 24px 48px rgba(0,0,0,0.6)',
              '0px 28px 56px rgba(0,0,0,0.65)',
              '0px 32px 64px rgba(0,0,0,0.7)',
              '0px 36px 72px rgba(0,0,0,0.75)',
              '0px 40px 80px rgba(0,0,0,0.8)',
              '0px 44px 88px rgba(0,0,0,0.85)',
              '0px 48px 96px rgba(0,0,0,0.9)',
              '0px 52px 104px rgba(0,0,0,0.95)',
              '0px 56px 112px rgba(0,0,0,1)',
              '0px 60px 120px rgba(0,0,0,1)',
              '0px 64px 128px rgba(0,0,0,1)',
              '0px 68px 136px rgba(0,0,0,1)',
              '0px 72px 144px rgba(0,0,0,1)',
              '0px 76px 152px rgba(0,0,0,1)',
              '0px 80px 160px rgba(0,0,0,1)',
              '0px 84px 168px rgba(0,0,0,1)',
              '0px 88px 176px rgba(0,0,0,1)',
              '0px 92px 184px rgba(0,0,0,1)',
            ],
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                padding: '10px 24px',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                },
              },
              contained: {
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === 'light' 
                  ? '0 4px 16px rgba(0,0,0,0.08)'
                  : '0 4px 16px rgba(0,0,0,0.5)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: mode === 'light'
                    ? '0 8px 24px rgba(0,0,0,0.12)'
                    : '0 8px 24px rgba(0,0,0,0.7)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

