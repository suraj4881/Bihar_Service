import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
  city?: string;
  pincode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export const authService = {
  async registerUser(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  },

  async registerProvider(providerData: RegisterRequest): Promise<AuthResponse> {
    try {
      // For now, use the same endpoint as user registration
      // Later we can create a separate provider registration endpoint
      const response = await axios.post(`${API_BASE_URL}/auth/register`, providerData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Provider registration failed'
      };
    }
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  }
};
