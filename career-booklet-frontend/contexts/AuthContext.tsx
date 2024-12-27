'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tokenRefreshTimer, setTokenRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const accessToken = Cookies.get('access_token');
    setIsAuthenticated(!!accessToken);
  }, []);

  const clearRefreshTimer = () => {
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
  };

  const scheduleTokenRefresh = (expiresIn: number) => {
    clearRefreshTimer();
    const refreshTime = (expiresIn - 60) * 1000; 

    const timer = setTimeout(async () => {
      await fetchNewAccessToken();
    }, refreshTime);

    setTokenRefreshTimer(timer);
  };

  const fetchNewAccessToken = useCallback(async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const { access_token, expires_in } = await response.json();
        Cookies.set('access_token', access_token, { expires: 1 / 24 }); 
        setIsAuthenticated(true);
        scheduleTokenRefresh(expires_in);
        return access_token;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      return null;
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    const accessToken = Cookies.get('access_token');
    if (accessToken) {
      return accessToken;
    }
    return await fetchNewAccessToken();
  }, [fetchNewAccessToken]);

  const login = (accessToken: string, refreshToken: string, expiresIn: number) => {
    Cookies.set('access_token', accessToken, { expires: 1 / 24 }); 
    Cookies.set('refresh_token', refreshToken, { expires: 1 }); 
    setIsAuthenticated(true);
    scheduleTokenRefresh(expiresIn);
  };

  const logout = () => {
    clearRefreshTimer();
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
