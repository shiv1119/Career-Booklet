'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendOtp } from '../api/auth_service_others/route';
import { signIn } from 'next-auth/react';

const RecoverAccount: React.FC = () => {
  const router = useRouter();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string>('');
  const [showOtpFields, setShowOtpFields] = useState<boolean>(false);
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [activationSuccess, setActivationSuccess] = useState<boolean>(false);
  const [showRecoveryMessage, setShowRecoveryMessage] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const searchParams = useSearchParams();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activationSuccess && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push('/');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activationSuccess, countdown, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmailOrPhone(queryEmail);
    }
  }, [searchParams]);

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
    setOtp(inputs.current.map((input) => input?.value).join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && !e.currentTarget.value) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    setMessage(null);
    try {
      const success = await sendOtp(emailOrPhone, 'recover_account');
      if (success) {
        setMessage({ text: 'OTP sent successfully!', type: 'success' });
        setShowOtpFields(true);
        setTimer(60);
      } else {
        setMessage({ text: 'Failed to send OTP. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setMessage({ text: 'An error occurred while sending OTP. Please try again.', type: 'error' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await signIn('credentials', {
        email: emailOrPhone,
        recover_otp: otp,
        redirect: false,
        callbackUrl: '/',
      });

      if (res?.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        setShowRecoveryMessage(true);
        setTimeout(() => {
          setShowRecoveryMessage(false);
          setActivationSuccess(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error during account activation:', error);
      setMessage({ text: 'Activation failed. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setMessage(null);
    try {
      const success = await sendOtp(emailOrPhone, 'recover_account');
      if (success) {
        setMessage({ text: 'OTP resent successfully!', type: 'success' });
        setTimer(60);
      } else {
        setMessage({ text: 'Failed to resend OTP. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setMessage({ text: 'An error occurred while resending OTP. Please try again.', type: 'error' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen">
      {showRecoveryMessage ? (
        <div className="text-center">
          <div className="text-xl font-bold mb-6">Recovering account...</div>
        </div>
      ) : !activationSuccess ? (
        <form className="max-w-sm mx-auto">
          <div className="text-xl font-bold mb-6 text-center">Recover Your Account</div>

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
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  Email
                </label>
              </div>
              <input
                type="text"
                id="email"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-blue-500"
                placeholder="Enter email"
              />
            </div>
          </div>

          {!showOtpFields && (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700"
            >
              Send OTP
            </button>
          )}

          {showOtpFields && (
            <>
              <div className="flex mb-2 space-x-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="block w-9 h-9 text-center border rounded-lg"
                    ref={(el) => {
                      if (el) inputs.current[i] = el;
                    }}
                    onChange={(e) => handleInputChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                  />
                ))}
              </div>
              {timer === 0 ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="w-full bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400"
                  disabled={isResending}
                >
                  {isResending ? 'Resending...' : 'Resend OTP'}
                </button>
              ) : (
                <div className="text-sm text-gray-400">
                  You can resend OTP in <span className="font-bold">{timer}</span> seconds
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </>
          )}
        </form>
      ) : (
        <div className="text-center">
          <div className="text-xl font-bold mb-6">Account Recovered</div>
          <p>Redirecting to Home in <span className="font-bold">{countdown}</span> seconds...</p>
        </div>
      )}
    </div>
  );
};

export default RecoverAccount;
