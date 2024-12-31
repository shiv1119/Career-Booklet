'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaEnvelope } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

type FormData = {
  emailOrPhone: string;
  password?: string;
  otp?: string;
};

const LoginWithOtp: React.FC = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>();
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const onSubmit = async (data: FormData) => {
    if (!otpSent) {
      handleSendOtp(data);
    } else {
      const otp = inputs.current.map(input => input?.value).join('');
      try {
        // Call NextAuth API (credentials provider)
        const response = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          body: JSON.stringify({
            email_or_phone: data.emailOrPhone,
            otp: otp,
          }),
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const responseData = await response.json();
          const { tokens } = responseData;
          router.push('/');
        } else {
          const errorData = await response.json();
          setError('otp', {
            type: 'manual',
            message: errorData.message || 'Invalid OTP',
          });
        }
      } catch (error) {
        console.error('Error during OTP login:', error);
      }
    }
  };

  const handleSendOtp = async (data: FormData) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/send-otp?email_or_phone=${data.emailOrPhone}&purpose=login`,
        { method: 'POST' }
      );
      if (response.ok) {
        setOtpSent(true);
        setCountdown(60);
      } else {
        const errorData = await response.json();
        setError('emailOrPhone', {
          type: 'manual',
          message: errorData.message || 'Failed to send OTP',
        });
      }
    } catch (error) {
      console.error('Error during OTP send:', error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center dark:bg-grey-800">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 w-full max-w-sm">
        {errors.emailOrPhone && <p className="text-sm mb-2 text-red-500">{errors.emailOrPhone.message}</p>}
        <div className="mb-5 flex items-center">
          <div className="w-full">
            <div className='flex items-center'>
              <FaEnvelope className="mr-3 mb-2 text-gray-500" />
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email or Phone</label>
            </div>
            <input
              type="text"
              id="emailOrPhone"
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              placeholder="name@domain.com or +91 1234567890"
              {...register('emailOrPhone', { required: 'Email or Phone is required' })}
            />
          </div>
        </div>

        {otpSent && (
          <div className="mb-5">
            <div className="flex mb-2 space-x-2 rtl:space-x-reverse">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  className="w-9 h-9 py-3 text-center border rounded-lg focus:ring-blue-500"
                  ref={(el) => (inputs.current[i] = el)}
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
