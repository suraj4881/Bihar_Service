import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logAnalyticsEvent } from '../services/analyticsService';

const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { user, provider, userType } = useAuth();

  useEffect(() => {
    const page = `${location.pathname}${location.search}`;
    let fallbackRole: string | undefined;
    let fallbackUserId: string | undefined;
    try {
      fallbackRole = localStorage.getItem('role') || undefined;
      const storedUser = localStorage.getItem('user');
      const storedProvider = localStorage.getItem('provider');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        fallbackUserId = parsed?.id;
      } else if (storedProvider) {
        const parsed = JSON.parse(storedProvider);
        fallbackUserId = parsed?.id;
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    const role =
      user?.role ||
      (provider ? 'PROVIDER' : undefined) ||
      fallbackRole ||
      (userType === 'USER' ? 'CUSTOMER' : userType === 'PROVIDER' ? 'PROVIDER' : undefined);

    logAnalyticsEvent({
      eventType: 'VIEW',
      page,
      userId: user?.id || provider?.id || fallbackUserId,
      userRole: role,
    });
  }, [location.pathname, location.search, user?.id, user?.role, provider?.id, userType]);

  return null;
};

export default AnalyticsTracker;
