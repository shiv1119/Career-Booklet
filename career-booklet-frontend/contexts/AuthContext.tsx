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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if the access token is expired based on expiry time
  const isTokenExpired = (): boolean => {
    const accessToken = Cookies.get('access_token');
    const expiresAt = Cookies.get('access_token_expiry');

    if (!accessToken || !expiresAt) {
      return true; // Token or expiry time is missing
    }

    const expiryTime = parseInt(expiresAt, 10);
    return new Date().getTime() >= expiryTime; // Compare current time with expiry time
  };

  // Check the authentication status when the app loads
  useEffect(() => {
    const accessToken = Cookies.get('access_token');

    // If the token is valid and not expired, set isAuthenticated to true
    if (accessToken && !isTokenExpired()) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    setIsLoading(false); // Done loading
  }, []); // Run once on component mount

  // Fetch a new access token using refresh token
  const fetchNewAccessToken = useCallback(async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      logout(); // If no refresh token, log out
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
        const expiryTime = new Date().getTime() + expires_in * 1000; // expires_in is in seconds, convert to ms
        Cookies.set('access_token', access_token, { expires: expires_in / 3600 / 24 }); // Set cookie expiry
        Cookies.set('refresh_token', refreshToken, { expires: 1 }); // Session cookie for refresh token
        Cookies.set('access_token_expiry', expiryTime.toString(), { expires: expires_in / 3600 / 24 }); // Set expiry time for access token
        setIsAuthenticated(true);
        return access_token;
      } else {
        logout(); // If refresh fails, log out
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  }, []);

  // Function to get the current access token
  const getAccessToken = useCallback(async () => {
    const accessToken = Cookies.get('access_token');

    if (accessToken && !isTokenExpired()) {
      return accessToken; // Valid token
    }

    // Token is expired or missing, fetch a new one
    return await fetchNewAccessToken();
  }, [fetchNewAccessToken]);

  // Login function
  const login = (accessToken: string, refreshToken: string, expiresIn: number) => {
    const expiryTime = new Date().getTime() + expiresIn * 1000; // Calculate expiry time in ms
    Cookies.set('access_token', accessToken, { expires: expiresIn / 3600 / 24 }); // Set cookie expiry for access token
    Cookies.set('refresh_token', refreshToken, { expires: 1 }); // Session cookie for refresh token
    Cookies.set('access_token_expiry', expiryTime.toString(), { expires: expiresIn / 3600 / 24 }); // Set expiry time for access token

    console.log('User logged in, cookies set:', { accessToken, refreshToken });

    setIsAuthenticated(true);
  };

  // Logout function
  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('access_token_expiry');
    console.log('User logged out, cookies cleared.');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (<div className='min-h-screen font-bold text-2xl flex justify-center items-center'>
      <div>Welcome To Career Booklet</div>
    </div>);
  }

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
