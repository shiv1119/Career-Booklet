'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react';
import { deactivateAccount, sendOtp } from '@/app/api/auth_service_others/route';
import { useRouter } from 'next/navigation';

const DeactivateAccount = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null); 
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<HTMLInputElement[]>([]);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.email) {
      setEmailOrPhone(session.user.email);
    }
  }, [session]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpSent) {
      handleSendOtp();
    } else {
      const otpValue = inputs.current.map((input) => input?.value).join('');
      try {
        const userId = String(session?.user.id);
        await deactivateAccount(userId, otpValue);
        setMessage({ text: 'Account deactivated successfully...', type: 'success' });

        setTimeout(() => {
          signOut({ 
            redirect: false,
            callbackUrl:'/'
            });
            router.push('/');
        }, 2000);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred. Please try again.');
        }
      }
    }
  };

  const handleSendOtp = async () => {
    if (!emailOrPhone) {
      setError('Email or phone is required');
      return;
    }

    const success = await sendOtp(emailOrPhone, 'deactivate_account');
    if (success) {
      setMessage({ text: 'OTP sent successfully!', type: 'success' });
      setOtpSent(true);
      setCountdown(60);
    } else {
      setMessage({ text: 'Failed to send OTP. Please try again.', type: 'error' });
    }
  };

  return (
    <>
      <div className="text-center text-lg font-bold">
        <h2>Deactivate Account</h2>
        <div className="w-full max-w-sm mx-auto bg-yellow-100 text-gray-800 p-4 mt-4 rounded-lg text-sm">
          <p className="text-center">
            <span className='text-red-900'>WARNING:</span>Deactivating your account will remove your access to all services. You can activate you account whenever you wish.
          </p>
        </div>
      </div>
      <div className="min-h-screen flex justify-center dark:bg-grey-800">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 py-8 w-full max-w-sm">
          {error && <p className="text-sm mb-2 text-red-500">{error}</p>}
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
                <FaEnvelope className="mr-3 mb-2 text-gray-500" />
                <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Email
                </label>
              </div>
              <input
                type="text"
                id="emailOrPhone"
                className="text-sm dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                placeholder="name@domain.com"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                readOnly
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
              <button
                type="button"
                onClick={() => countdown === 0 && handleSendOtp()}
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
    </>
  );
};

export default DeactivateAccount;
