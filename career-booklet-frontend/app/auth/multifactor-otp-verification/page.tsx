'use client';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import 'react-phone-input-2/lib/style.css';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

type FormData = {
  emailOrPhone: string;
};

const Page: React.FC = () => {
  const [isOtpLogin, setIsOtpLogin] = useState(true);
  const [otpSent, setOtpSent] = useState(true);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [countdown, setCountdown] = useState(60);
  const { isAuthenticated } = useAuth();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const { register, handleSubmit, formState: { errors }, setError,setValue } = useForm<FormData>();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

 useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmailOrPhone(queryEmail);
      setValue('emailOrPhone', queryEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (countdown > 0 && otpSent) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      clearInterval(timer);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [countdown, otpSent]);

  const onSubmit = async (data: FormData) => {
    const emailOrPhone = data.emailOrPhone;

    if (!emailOrPhone) {
      setError('emailOrPhone', {
        type: 'manual',
        message: 'Email or Phone is required',
      });
      return;
    }

    if (!otpSent) {
      handleSendOtp(emailOrPhone);
      return;
    }

    if (isOtpLogin && otpSent) {
      const otp = inputs.current.map(input => input?.value).join('');

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/auth/login-otp?email_or_phone=${emailOrPhone}&otp=${otp}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const responseData = await response.json();
          const { tokens } = responseData;
          login(tokens.access_token, tokens.refresh_token, responseData.tokens.expires_in);

          router.push('/');
          console.log('User logged in:', responseData);
        } else {
          const errorData = await response.json();
          console.error('OTP verification failed:', errorData);
          setError('emailOrPhone', {
            type: 'manual',
            message: errorData.message || 'Invalid OTP',
          });
        }
      } catch (error) {
        console.error('Error during OTP verification request:', error);
      }
    }
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && !e.currentTarget.value) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async (emailOrPhone: string) => {
    if (!emailOrPhone) {
      setError('emailOrPhone', {
        type: 'manual',
        message: 'Email or Phone is required',
      });
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/send-otp?email_or_phone=${encodeURIComponent(emailOrPhone)}&purpose=multi_factor_login`,
        {
          method: 'POST',
      }
      );

      if (response.ok) {
        setOtpSent(true);
        setCountdown(60);
        console.log('OTP sent to:', emailOrPhone);
      } else {
        const errorData = await response.json();
        console.error('Failed to send OTP:', errorData);
        setError('emailOrPhone', {
          type: 'manual',
          message: errorData.message || 'Failed to send OTP',
        });
      }
    } catch (error) {
      console.error('Error during OTP sending request:', error);
    }
  };

  const handleResendOtp = () => {
    if (countdown === 0) {
      handleSendOtp(emailOrPhone);
    }
  };

  return (
    <>
      <div className="text-center font-bold text-gray-900 dark:text-white">
        <h2 className="text-lg">Multi-factor otp verification</h2>
      </div>
      <div className="min-h-screen flex justify-center dark:bg-grey-800">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 px-8 py-7 rounded-lg w-full max-w-sm">
          {errors.emailOrPhone && <p className="text-sm mb-2 text-red-500">{errors.emailOrPhone.message}</p>}

          <div className="mb-5 flex items-center">
            <div className="w-full">
              <div className="flex items-center">
                <FaEnvelope className="mr-3 mb-2 text-gray-500" />
                <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email</label>
              </div>
              <input
                type="text"
                value={emailOrPhone}
                id="emailOrPhone"
                className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@flowbite.com or +91 1234567890"
                {...register('emailOrPhone', { required: 'Email or Phone is required' })}
              />
            </div>
          </div>

          {isOtpLogin && otpSent && (
            <div className="mb-5 flex items-center">
              <div className="w-full">
                <div className="flex mb-2 space-x-2 rtl:space-x-reverse">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <label htmlFor={`code-${i + 1}`} className="sr-only">{`Code ${i + 1}`}</label>
                      <input
                        type="text"
                        maxLength={1}
                        id={`code-${i + 1}`}
                        className="block w-9 h-9 py-3 text-sm text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        required
                        ref={(el) => (inputs.current[i] = el)}
                        onChange={(e) => handleInputChange(i, e)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                      />
                    </div>
                  ))}
                </div>
                <p id="helper-text-explanation" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Please enter the 6-digit code we sent via email or SMS.
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className="text-sm text-blue-500 mt-2"
                >
                  {countdown > 0 ? `Resend OTP (${countdown}s)` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="text-sm w-full bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            {isOtpLogin ? (otpSent ? 'Submit OTP' : 'Send OTP') : 'Login'}
          </button>

          <div className="mt-3 text-center">
            <Link href='/auth' className="text-sm text-blue-500">Login with password</Link>
          </div>
        </form>
      </div>
    </>
  );
}

export default Page;
