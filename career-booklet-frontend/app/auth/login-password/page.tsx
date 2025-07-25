'use client';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useRouter} from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';

type FormData = {
  emailOrPhone: string;
  password: string;
};

const LoginWithPassword: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>();
  const router = useRouter();
  const {status} = useSession();

    
  
    const isAuthenticated = status === 'authenticated';
    useEffect(() => {
      if (isAuthenticated) {
        router.replace('/');
      }
    }, [isAuthenticated, router]);
  
    const redirectUrl = localStorage.getItem('redirectUrl');
  const parsedRedirectUrl = redirectUrl ? JSON.parse(redirectUrl) : null;
  

  const onSubmit = async (data: FormData) => {
    const cleanedEmailOrPhone = data.emailOrPhone.replace(/\s+/g, '').split('').join('');
    signIn('credentials', {
        email_or_phone: cleanedEmailOrPhone,
        password: data.password,
        redirect: !!parsedRedirectUrl,
        callbackUrl: parsedRedirectUrl || '/',
    }).then((res) => {
        if (res?.error) {
          if(res?.error === 'MFA Required'){
            router.push(`/auth/mfa-verification?email=${encodeURIComponent(data.emailOrPhone)}`);
          } else {
            setError('emailOrPhone', { message: res?.error });
          }
        } else{
            router.push(parsedRedirectUrl || '/'); 
            localStorage.removeItem('redirectUrl');
        }
    });
  };

  return (
    <div className="w-full min-h-screen flex justify-center dark:bg-grey-800">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 w-full max-w-sm">
        {errors.emailOrPhone && <div className="mb-4 p-2 text-sm rounded bg-red-100 text-sm mb-2 text-red-700">{errors.emailOrPhone.message}</div>}
        <div className="mb-5 flex items-center">
          <div className="w-full">
            <div className="flex items-center">
              <FaEnvelope className="mr-3 mb-2 text-gray-500" />
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email or Phone</label>
            </div>
            <input
              type="text"
              id="emailOrPhone"
              className="text-sm dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              placeholder="name@domain.com or 91 1234567890"
              {...register('emailOrPhone', { required: 'Email or Phone is required' })}
            />
          </div>
        </div>

        <div className="mb-5 flex items-center">
          <div className="w-full">
            <div className="flex items-center">
              <FaLock className="mr-3 mb-2 text-gray-500" />
              <div className="flex items-center justify-between w-full">
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Password</label>
                <Link href="/auth/reset-password" className="text-sm mb-2 text-blue-500 hover:underline">Forget Password?</Link>
              </div>
            </div>
            <input
              type="password"
              id="password"
              className="text-sm bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-white text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              placeholder="Your password"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="text-sm w-full bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Login
        </button>

        <div className="mt-3 text-center text-sm text-blue-500">
          <Link href='/auth/login-otp'>Login with OTP?</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginWithPassword;
