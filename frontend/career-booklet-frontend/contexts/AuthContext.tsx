'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthContextProps {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | undefined;
  user: { id: number; roles: string[] } | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<{ id: number; roles: string[] } | null>(null);
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        roles: session.user.roles,
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const isAuthenticated = status === 'authenticated';
  const loading = status === 'loading';

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    if (result?.status === 'mfa-required') {
      setIsMfaRequired(true);
      router.push(`/auth/multifactor-otp-verification?email=${encodeURIComponent(email)}`);
    }
  };

  const logout = () => {
    signOut({ callbackUrl: '/' });
  };

  const getAccessToken = () => {
    return session?.accessToken;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, getAccessToken, user }}>
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
