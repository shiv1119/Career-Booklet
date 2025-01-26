'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FaEnvelope } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { sendOtp } from '@/app/api/auth_service_others/route'; // Import the sendOtp function

type FormData = {
  emailOrPhone: string;
  otp?: string;
};

const LoginWithOtp: React.FC = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<HTMLInputElement[]>([]); 
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>();
  const router = useRouter();
  const { status } = useSession();

  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && !e.currentTarget.value) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };
  const redirectUrl = localStorage.getItem('redirectUrl') 
  ? JSON.parse(localStorage.getItem('redirectUrl') as string) 
  : '/';
  const onSubmit = async (data: FormData) => {
    if (!otpSent) {
      handleSendOtp(data);
    } else {
      const otp = inputs.current.map((input) => input?.value).join('');
      signIn('credentials', {
        email_or_phone: data.emailOrPhone,
        login_otp: otp,
        redirect: !!redirectUrl,
        callbackUrl: redirectUrl,
      }).then((res) => {
        if (res?.error) {
          setError('otp', { message: res.error });
        } else {
          router.push(redirectUrl);
          localStorage.removeItem('redirectUrl');
        }
      });
    }
  };

  const handleSendOtp = async (data: FormData) => {
    const success = await sendOtp(data.emailOrPhone, "login");
    if (success) {
      setOtpSent(true);
      setCountdown(60);
    } else {
      setError('emailOrPhone', { message: 'Failed to send OTP' });
    }
  };

  return (
    <div className="min-h-screen flex justify-center dark:bg-gray-800">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 p-2 w-full max-w-sm rounded-lg"
      >
        {errors.emailOrPhone && (
          <p className="text-sm mb-2 text-red-500">{errors.emailOrPhone.message}</p>
        )}
        <div className="mb-5">
          <div className="flex items-center mb-2">
            <FaEnvelope className="mr-3 text-gray-500" />
            <label
              htmlFor="emailOrPhone"
              className="block text-sm font-medium text-gray-900 dark:text-white"
            >
              Email or Phone
            </label>
          </div>
          <input
            type="text"
            id="emailOrPhone"
            className="text-sm dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            placeholder="name@domain.com or +91 1234567890"
            {...register('emailOrPhone', { required: 'Email or Phone is required' })}
          />
        </div>

        {otpSent && (
          <div className="mb-5">
            <div className="flex mb-2 space-x-2 rtl:space-x-reverse">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  className="w-9 h-9 py-3 text-center border text-sm font-bold rounded-lg dark:text-black focus:ring-blue-500"
                  ref={(el) => {
                    if (el) inputs.current[i] = el;
                  }}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onChange={(e) => handleInputChange(i, e)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => countdown === 0 && handleSendOtp({ emailOrPhone: '' })}
              disabled={countdown > 0}
              className="text-sm text-blue-500 mt-2"
            >
              {countdown > 0 ? `Resend OTP (${countdown}s)` : 'Resend OTP'}
            </button>
          </div>
        )}

        <button
          type="submit"
          className="text-sm w-full bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {otpSent ? 'Submit OTP' : 'Send OTP'}
        </button>
      </form>
    </div>
  );
};

export default LoginWithOtp;
