'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

interface AuthContextProps {
  isAuthenticated: boolean;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const isTokenExpired = (): boolean => {
    const accessToken = Cookies.get('access_token');
    const expiresAt = Cookies.get('access_token_expiry');

    if (!accessToken || !expiresAt) {
      return true; 
    }

    const expiryTime = parseInt(expiresAt, 10);
    return new Date().getTime() >= expiryTime; 
  };

  useEffect(() => {
    const accessToken = Cookies.get('access_token');

    if (accessToken && !isTokenExpired()) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    setLoading(false); 
  }, []);

  const fetchNewAccessToken = useCallback(async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      logout(); 
      return null;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const { access_token, expires_in } = await response.json();
        const expiryTime = new Date().getTime() + expires_in * 1000; 
        Cookies.set('access_token', access_token, { expires: expires_in / 3600 / 24 }); 
        Cookies.set('refresh_token', refreshToken, { expires: 1 }); 
        Cookies.set('access_token_expiry', expiryTime.toString(), { expires: expires_in / 3600 / 24 }); 
        setIsAuthenticated(true);
        return access_token;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    const accessToken = Cookies.get('access_token');

    if (accessToken && !isTokenExpired()) {
      return accessToken; 
    }

    return await fetchNewAccessToken();
  }, [fetchNewAccessToken]);

  const login = (accessToken: string, refreshToken: string, expiresIn: number) => {
    const expiryTime = new Date().getTime() + expiresIn * 1000; 
    Cookies.set('access_token', accessToken, { expires: expiresIn / 3600 / 24 }); 
    Cookies.set('refresh_token', refreshToken, { expires: 1 }); 
    Cookies.set('access_token_expiry', expiryTime.toString(), { expires: expiresIn / 3600 / 24 }); 
    console.log('User logged in, cookies set:', { accessToken, refreshToken });

    setIsAuthenticated(true);
  };

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('access_token_expiry');
    console.log('User logged out, cookies cleared.');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, getAccessToken }}>
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
