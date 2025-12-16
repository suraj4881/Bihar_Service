// Application Configuration
// This file manages environment-specific settings

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080',
    timeout: 10000, // 10 seconds
  },

  // Feature Flags
  features: {
    useDummyData: process.env.REACT_APP_USE_DUMMY_DATA === 'true' || process.env.NODE_ENV === 'development',
    enableLogging: process.env.NODE_ENV === 'development',
  },

  // App Settings
  app: {
    name: 'BiharSeva',
    version: '1.0.0',
    defaultCity: 'Patna',
  },
};

// Helper function to check if we're in production
export const isProduction = () => process.env.NODE_ENV === 'production';

// Helper function to check if we're in development
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// Helper to get API endpoint
export const getApiUrl = (endpoint: string) => {
  return `${config.api.baseUrl}${endpoint}`;
};

// Helper to log only in development
export const devLog = (...args: any[]) => {
  if (config.features.enableLogging) {
    console.log(...args);
  }
};

