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
            main: '#2563EB',
            light: '#60A5FA',
            dark: '#1E40AF',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: '#F97316',
            light: '#FDBA74',
            dark: '#EA580C',
            contrastText: '#FFFFFF',
          },
          background: {
            default: mode === 'light' ? '#F5F7FB' : '#0B1220',
            paper: mode === 'light' ? '#FFFFFF' : '#0F172A',
          },
          text: {
            primary: mode === 'light' ? '#0F172A' : '#E2E8F0',
            secondary: mode === 'light' ? '#475569' : '#94A3B8',
          },
          success: {
            main: '#16A34A',
            light: '#4ADE80',
            dark: '#15803D',
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
            light: '#93C5FD',
            dark: '#2563EB',
          },
        },
        typography: {
          fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 800, fontSize: '3rem', lineHeight: 1.15 },
          h2: { fontWeight: 800, fontSize: '2.4rem', lineHeight: 1.2 },
          h3: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.3 },
          h4: { fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.4 },
          h5: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.5 },
          h6: { fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.5 },
          button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
        },
        shape: {
          borderRadius: 14,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: mode === 'light' ? '#F5F7FB' : '#0B1220',
                color: mode === 'light' ? '#0F172A' : '#E2E8F0',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                padding: '10px 22px',
                fontWeight: 600,
                boxShadow: 'none',
              },
              contained: {
                boxShadow: '0 8px 18px rgba(37, 99, 235, 0.18)',
                '&:hover': {
                  boxShadow: '0 12px 24px rgba(37, 99, 235, 0.24)',
                  transform: 'translateY(-1px)',
                },
              },
              outlined: {
                borderColor: mode === 'light' ? '#CBD5F5' : '#334155',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 20,
                boxShadow: mode === 'light'
                  ? '0 16px 40px rgba(15, 23, 42, 0.08)'
                  : '0 12px 30px rgba(0,0,0,0.45)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundImage: 'none',
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                backgroundColor: mode === 'light' ? '#F8FAFC' : '#0F172A',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2563EB',
                  borderWidth: 2,
                },
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'light' ? '#F8FAFC' : '#111827',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              head: {
                fontWeight: 700,
                color: mode === 'light' ? '#0F172A' : '#E2E8F0',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                fontWeight: 600,
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

