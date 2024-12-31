'use client'
import React, { useState, useEffect } from "react";
import { Register } from "@/components";
import { Login } from "@/components";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

const Auth: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // Persist page state across sessions using localStorage
  useEffect(() => {
    const storedState = localStorage.getItem('authPageState');
    if (storedState) {
      setIsRegister(JSON.parse(storedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('authPageState', JSON.stringify(isRegister));
  }, [isRegister]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Layout for Sign In / Sign Up buttons */}
      <AuthLayout isRegister={isRegister} setIsRegister={setIsRegister} />
      
      {/* Render Login or Register Form based on isRegister */}
      <div className="w-full max-w-md mt-8">
        {isRegister ? <Register /> : <Login />}
      </div>
    </div>
  );
}

export default Auth;
