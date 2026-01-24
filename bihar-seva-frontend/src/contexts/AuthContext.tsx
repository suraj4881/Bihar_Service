import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Provider } from '../types';

interface AuthContextType {
  user: User | null;
  provider: Provider | null;
  isAuthenticated: boolean;
  userType: 'USER' | 'PROVIDER' | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  setUserData: (user: User | null) => void;
  setProviderData: (provider: Provider | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// ✅ Helper: Safe localStorage get
const safeGetLocalStorage = (key: string): string | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      return null;
    }
    return item;
  } catch (error) {
    return null;
  }
};

// ✅ Helper: Safe JSON parse
const safeJSONParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return null;
  }
};

// ✅ Helper: Safe localStorage set
const safeSetLocalStorage = (key: string, value: any): void => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  } catch (error) {
    // Ignore localStorage errors
  }
};

// ✅ Helper: Clear all auth data
const clearAuthData = (): void => {
  const keys = ['token', 'user', 'provider', 'role', 'hasPassword'];
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Ignore localStorage errors
    }
  });
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ Auto-logout timer (30 minutes of inactivity)
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds
  const logoutTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // ✅ Initialize auth state from localStorage (runs once on mount)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = safeGetLocalStorage('token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        const storedUser = safeGetLocalStorage('user');
        const storedProvider = safeGetLocalStorage('provider');
        const storedRole = safeGetLocalStorage('role');

        if (storedUser) {
          const parsedUser = safeJSONParse<User>(storedUser);
          if (parsedUser) {
            // ✅ Ensure role is set from localStorage if missing
            if (!parsedUser.role && storedRole) {
              parsedUser.role = storedRole as 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
            }
            
            // ✅ Sync language preference - Priority: localStorage (from HomePage) > User profile
            const savedLanguage = localStorage.getItem('language');
            if (savedLanguage && (savedLanguage === 'hi' || savedLanguage === 'en')) {
              // Keep language from HomePage (user just selected it)
            } else if (parsedUser.language) {
              // Fallback to user profile language if HomePage language not set
              const userLang = parsedUser.language.toLowerCase();
              const langPreference = (userLang === 'hindi' || userLang === 'hi') ? 'hi' : 'en';
              localStorage.setItem('language', langPreference);
            }
            
            setUser(parsedUser);
          } else {
            clearAuthData();
          }
        } else if (storedProvider) {
          const parsedProvider = safeJSONParse<Provider>(storedProvider);
          if (parsedProvider) {
            setProvider(parsedProvider);
          } else {
            clearAuthData();
          }
        }
      } catch (error) {
        // Error handled silently
        clearAuthData();
      } finally {
        // ✅ Always set loading to false
        setLoading(false);
      }
    };

    initAuth();
  }, []);
  
  // ✅ Auto-logout after inactivity
  useEffect(() => {
    if (!user && !provider) return;
    
    const resetTimer = () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      
      logoutTimerRef.current = setTimeout(() => {
        alert('Your session has expired due to inactivity. Please login again.');
        logout();
        window.location.href = '/login';
      }, AUTO_LOGOUT_TIME);
    };
    
    // Reset timer on user activity
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activities.forEach(activity => {
      window.addEventListener(activity, resetTimer);
    });
    
    // Initial timer
    resetTimer();
    
    // Cleanup
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      activities.forEach(activity => {
        window.removeEventListener(activity, resetTimer);
      });
    };
  }, [user, provider]);

  // ✅ Login function (memoized to prevent re-creation)
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        safeSetLocalStorage('token', data.data.token);
        
        if (data.data.userType === 'USER') {
          const userData = data.data.user;
          setUser(userData); // ✅ Update state immediately
          safeSetLocalStorage('user', userData);
          
          // ✅ Sync language preference - Priority: localStorage (from HomePage) > User profile
          const savedLanguage = localStorage.getItem('language');
          if (savedLanguage && (savedLanguage === 'hi' || savedLanguage === 'en')) {
            // Keep language from HomePage (user just selected it)
          } else if (userData.language) {
            // Fallback to user profile language if HomePage language not set
            const userLang = userData.language.toLowerCase();
            const langPreference = (userLang === 'hindi' || userLang === 'hi') ? 'hi' : 'en';
            localStorage.setItem('language', langPreference);
          }
        } else if (data.data.userType === 'PROVIDER') {
          const providerData = data.data.provider;
          setProvider(providerData); // ✅ Update state immediately
          safeSetLocalStorage('provider', providerData);
          
          // ✅ Sync language preference - Priority: localStorage (from HomePage) > Provider profile
          const savedLanguage = localStorage.getItem('language');
          if (savedLanguage && (savedLanguage === 'hi' || savedLanguage === 'en')) {
            // Keep language from HomePage (user just selected it)
          } else if (providerData.language) {
            // Fallback to provider profile language if HomePage language not set
            const userLang = providerData.language.toLowerCase();
            const langPreference = (userLang === 'hindi' || userLang === 'hi') ? 'hi' : 'en';
            localStorage.setItem('language', langPreference);
          }
        }
        
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      // Error handled by throw
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }, []);

  // ✅ Register function (memoized)
  const register = useCallback(async (userData: any) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }, []);

  // ✅ Logout function (memoized)
  const logout = useCallback(() => {
    // Call backend to update online status
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) {
      fetch(`http://localhost:8080/api/auth/logout?userId=${user.id}`, {
        method: 'POST',
      }).catch(() => {
        // Ignore logout API errors
      });
    }
    
    setUser(null);
    setProvider(null);
    clearAuthData();
  }, []);

  // ✅ Manual setters for external auth (OTP, etc.)
  const setUserData = useCallback((userData: User | null) => {
    setUser(userData);
    safeSetLocalStorage('user', userData);
  }, []);

  const setProviderData = useCallback((providerData: Provider | null) => {
    setProvider(providerData);
    safeSetLocalStorage('provider', providerData);
  }, []);

  // ✅ Computed values (memoized)
  const isAuthenticated = !!(user || provider);
  const userType: 'USER' | 'PROVIDER' | null = user ? 'USER' : provider ? 'PROVIDER' : null;

  const value = {
    user,
    provider,
    isAuthenticated,
    userType,
    login,
    register,
    logout,
    loading,
    setUserData,
    setProviderData,
  };

  // ✅ Don't block rendering with loading screen (causes white page)
  // The app will render immediately and auth state will update when ready

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
