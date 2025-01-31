'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { sendOtp } from '@/app/api/auth_service_others/route';

type FormData = {
  emailOrPhone: string;
  otp?: string;
};

const MultiFactorVerification: React.FC = () => {
  const [otpSent, setOtpSent] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [inputType, setInputType] = useState<'email' | 'phone'>('email');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const { register, handleSubmit, setValue, setError, getValues } = useForm<FormData>();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setInputType('email');
      setValue('emailOrPhone', queryEmail);
    }
  }, [searchParams, setValue]);

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

  const handleSendOtp = async (data: FormData) => {
    try {
      if (!data.emailOrPhone) {
        setMessage({ text: 'Email or Phone is required.', type: 'error' });
        return;
      }

      const success = await sendOtp(data.emailOrPhone, "multi_factor_login");
      if (success) {
        setOtpSent(true);
        setCountdown(60);
        setMessage({ text: 'OTP sent successfully!', type: 'success' });
      } else {
        setMessage({ text: 'Failed to send OTP. Please try again.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while sending OTP.' + error, type: 'error' });
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setMessage(null);
    try {
      const emailOrPhone = getValues('emailOrPhone'); // Ensure emailOrPhone is fetched
      if (!emailOrPhone) {
        setMessage({ text: 'Please enter your email or phone number.', type: 'error' });
        setIsResending(false);
        return;
      }

      const success = await sendOtp(emailOrPhone, 'multi_factor_login');
      if (success) {
        setMessage({ text: 'OTP resent successfully!', type: 'success' });
        setCountdown(60);
        setOtpSent(true);
      } else {
        setMessage({ text: 'Failed to resend OTP. Please try again.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while resending OTP.' + error, type: 'error' });
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!otpSent) {
      handleSendOtp(data);
    } else {
      const otp = inputs.current.map((input) => input?.value || '').join('');
      signIn('credentials', {
        email_or_phone: data.emailOrPhone,
        login_otp: otp,
        redirect: false,
        callbackUrl: '/'
      }).then((res) => {
        if (res?.error) {
          setError('otp', { message: 'Invalid OTP. Please try again.' });
          setMessage({ text: 'Invalid OTP. Please try again.', type: 'error' });
        } else {
          router.push('/');
        }
      });
    }
  };

  return (
    <>
      <div className="text-center text-lg font-bold">
        <h2>MFA OTP Verification</h2>
      </div>
      <div className="min-h-screen flex justify-center dark:bg-gray-800">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 w-full max-w-sm">
          {message && (
            <div
              className={`mb-4 p-2 text-sm rounded ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
          
          <div className="mb-5 flex items-center">
            <div className="w-full">
              <div className="flex items-center">
                {inputType === 'email' ? (
                  <FaEnvelope className="mr-3 mb-2 text-gray-500" />
                ) : (
                  <FaPhoneAlt className="mr-3 mb-2 text-gray-500" />
                )}
                <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {inputType === 'email' ? 'Email' : 'Phone'}
                </label>
              </div>
              <input
                type="text"
                id="emailOrPhone"
                className="text-sm dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                placeholder={inputType === 'email' ? 'name@domain.com' : '+91 1234567890'}
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
                    className="w-9 h-9 py-3 text-center border text-sm font-bold rounded-lg dark:text-black focus:ring-blue-500"
                    ref={(el) => {
                      if (el) inputs.current[i] = el;
                    }}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onChange={(e) => handleInputChange(i, e)}
                  />
                ))}
              </div>
              <p id="helper-text-explanation" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Please enter the 6-digit code we sent via email or phone.
              </p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isResending}
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
    </>
  );
};

export default MultiFactorVerification;
