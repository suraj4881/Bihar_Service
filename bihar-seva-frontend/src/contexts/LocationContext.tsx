import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface LocationContextType {
  location: Location | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  updateLocation: (location: Location) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocoding to get address
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await response.json();

        const newLocation: Location = {
          latitude,
          longitude,
          address: data.localityInfo?.administrative?.[0]?.name || 'Unknown Address',
          city: data.city || data.locality || 'Unknown City',
          state: data.principalSubdivision || 'Bihar',
          pincode: data.postcode || '',
        };

        setLocation(newLocation);
        localStorage.setItem('currentLocation', JSON.stringify(newLocation));
      } catch (geocodeError) {
        // Fallback location data
        const newLocation: Location = {
          latitude,
          longitude,
          address: 'Current Location',
          city: 'Bihar',
          state: 'Bihar',
          pincode: '',
        };
        setLocation(newLocation);
        localStorage.setItem('currentLocation', JSON.stringify(newLocation));
      }
    } catch (err) {
      setError('Unable to retrieve your location');
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = (newLocation: Location) => {
    setLocation(newLocation);
    localStorage.setItem('currentLocation', JSON.stringify(newLocation));
  };

  useEffect(() => {
    // Try to get stored location first
    const storedLocation = localStorage.getItem('currentLocation');
    if (storedLocation) {
      try {
        setLocation(JSON.parse(storedLocation));
      } catch (err) {
        console.error('Error parsing stored location:', err);
      }
    }
  }, []);

  const value = {
    location,
    loading,
    error,
    getCurrentLocation,
    updateLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
