// Centralized API Configuration
// This file provides a single source of truth for all API endpoints

import { config } from '../config/config';

const getApiBaseUrl = (): string => {
  // Check for environment variable first (highest priority)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback to config.ts
  if (config?.api?.baseUrl) {
    return config.api.baseUrl;
  }
  
  // Final fallback
  return 'http://localhost:8080';
};

export const API_BASE_URL = `${getApiBaseUrl()}/api`;

// Helper function to build full API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper function to get file serve URL
export const getFileServeUrl = (filePath: string): string => {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `${getApiBaseUrl()}/api/files/serve?filePath=${encodeURIComponent(filePath)}`;
};

export default {
  API_BASE_URL,
  getApiUrl,
  getFileServeUrl,
};
