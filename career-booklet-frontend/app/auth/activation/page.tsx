'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const Activation: React.FC = () => {
  const { login } = useAuth();
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
  const [countdown, setCountdown] = useState<number>(3); 

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

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
    setOtp(inputs.current.map(input => input?.value).join('')); 
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && !e.currentTarget.value) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    setMessage(null); 
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/send-otp?email_or_phone=${encodeURIComponent(emailOrPhone)}&purpose=activation`,
        { method: 'POST' }
      );

      if (response.ok) {
        setMessage({ text: 'OTP sent successfully!', type: 'success' });
        setShowOtpFields(true); 
        setTimer(60); // Start timer
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.detail || 'Failed to send OTP. Please try again.', type: 'error' });
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
      const response = await fetch('http://127.0.0.1:8000/api/user/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrPhone, otp }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage({ text: 'Account activated successfully!', type: 'success' });
        setActivationSuccess(true); 
        setShowOtpFields(false); 

        login(responseData.tokens.access_token, responseData.tokens.refresh_token);
        console.log('Tokens saved:', responseData.tokens);
      } else {
        setMessage({ text: responseData.detail || 'Activation failed. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error during account activation:', error);
      setMessage({ text: 'An error occurred during activation. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/send-otp?email_or_phone=${encodeURIComponent(emailOrPhone)}&purpose=activation`,
        { method: 'POST' }
      );

      if (response.ok) {
        setMessage({ text: 'OTP resent successfully!', type: 'success' });
        setTimer(60); // Reset timer
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.detail || 'Failed to resend OTP. Please try again.', type: 'error' });
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
      {!activationSuccess ? (
        <form className="max-w-sm mx-auto">
          <div className="text-xl font-bold mb-6">Account Activation</div>

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
                  Email or Phone
                </label>
              </div>
              <input
                type="text"
                id="email"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Enter email or phone"
              />
            </div>
          </div>

          {!showOtpFields && (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full mt-6 bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            >
              Send OTP
            </button>
          )}

          {showOtpFields && (
            <>
              <div className="flex mb-2 space-x-2 rtl:space-x-reverse mt-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <label htmlFor={`code-${i + 1}`} className="sr-only">{`Code ${i + 1}`}</label>
                    <input
                      type="text"
                      maxLength={1}
                      id={`code-${i + 1}`}
                      className="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      required
                      ref={(el) => (inputs.current[i] = el)}
                      onChange={(e) => handleInputChange(i, e)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                    />
                  </div>
                ))}
              </div>
              <p id="helper-text-explanation" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Please enter the 6-digit code we sent via email or phone.
              </p>

              {timer === 0 ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="w-full mt-4 bg-gray-300 text-gray-700 py-2.5 px-5 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
                className="w-full mt-4 bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </>
          )}
        </form>
      ) : (
        <div className="text-center">
          <div className="text-xl font-bold mb-6">Account Activated</div>
          <p>Redirecting to Home in <span className="font-bold">{countdown}</span> seconds...</p>
        </div>
      )}
    </div>
  );
};

export default Activation;
