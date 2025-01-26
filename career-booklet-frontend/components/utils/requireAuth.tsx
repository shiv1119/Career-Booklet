'use client';
import React, { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
}

const RequireAuth: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const url = window.location.pathname;
      localStorage.setItem('redirectUrl', JSON.stringify(url));
      router.push(`/auth`);
    }
  }, [status, router]);

  if (status === 'loading') {
    localStorage.removeItem('redirectUrl');
    return <div className='flex justify-center items-center'>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    localStorage.removeItem('redirectUrl');
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
