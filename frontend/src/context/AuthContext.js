import React, { createContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/config';
import { setupAxiosInterceptors, clearAxiosInterceptors } from '../utils/axiosInterceptor';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAccessToken = localStorage.getItem('accessToken');
    // Check both localStorage and sessionStorage for refresh token
    const storedRefreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    
    if (storedUser && storedAccessToken && storedRefreshToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
    }
    
    setIsInitialized(true);
  }, []);

  // Setup axios interceptors when auth state changes
  useEffect(() => {
    if (isInitialized) {
      // Clear existing interceptors first
      clearAxiosInterceptors();
      
      // Setup new interceptors with current auth context
      if (user && accessToken) {
        setupAxiosInterceptors({
          refreshAccessToken,
          logout,
          accessToken,
          user
        });
      }
    }
  }, [user, accessToken, isInitialized]);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', accessToken);
    // Note: refreshToken storage location is handled in Login component
    // based on "Remember Me" checkbox
    setUser(userData);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) return false;
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        
        // Update refresh token if provided
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
          // Store in the same location as the original refresh token
          const inLocalStorage = localStorage.getItem('refreshToken');
          if (inLocalStorage) {
            localStorage.setItem('refreshToken', data.refreshToken);
          } else {
            sessionStorage.setItem('refreshToken', data.refreshToken);
          }
        }
        
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      accessToken, 
      refreshToken, 
      login, 
      logout, 
      refreshAccessToken,
      isInitialized 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
