'use client'
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

const AuthPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="w-full max-w-md mx-auto">
      <AuthLayout isRegister={isRegister} setIsRegister={setIsRegister} />
        <div className="w-full max-w-md mt-8">
        {isRegister ? <Register /> : <Login />}
      </div>
    </div>
  );
}

export default AuthPage;
