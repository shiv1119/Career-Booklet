'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ResetPassword: React.FC = () => {
  const router = useRouter();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showOtpFields, setShowOtpFields] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

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
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/send-otp?email_or_phone=${encodeURIComponent(email)}&purpose=reset-password`,
        { method: 'POST' }
      );

      if (response.ok) {
        setMessage({ text: 'OTP sent successfully!', type: 'success' });
        setShowOtpFields(true);
        setTimer(60);
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.detail || 'Failed to send OTP. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setMessage({ text: 'An error occurred while sending OTP. Please try again.', type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp:otp, new_password: newPassword }),
      });

      if (response.ok) {
        setMessage({ text: 'Password reset successfully! Redirecting to login...', type: 'success' });
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.detail || 'Failed to reset password. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ text: 'An error occurred while resetting password. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/send-otp?email_or_phone=${encodeURIComponent(email)}&purpose=${encodeURIComponent('reset_password')}`,
        { method: 'POST' }
      );

      if (response.ok) {
        setMessage({ text: 'OTP resent successfully!', type: 'success' });
        setTimer(60);
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
    <div className="min-h-screen flex justify-center">
      <form className="max-w-sm w-full">
        <div className="text-xl font-bold mb-6">Reset Password</div>

        {message && (
          <div
            className={`mb-4 p-2 text-sm rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {!showOtpFields ? (
          <>
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700"
            >
              Send OTP
            </button>
          </>
        ) : (
          <>
            <div className="flex mb-2 space-x-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  className="block w-9 h-9 text-center border border-gray-300 rounded-lg"
                  required
                  ref={(el) => {
                    if (el) inputs.current[i] = el;
                  }}
                  onChange={(e) => handleInputChange(i, e)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>
            <div className="mb-5">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-900 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
              />
            </div>

            {timer === 0 ? (
              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full mb-4 bg-gray-300 text-gray-700 py-2.5 px-5 rounded-lg"
              >
                Resend OTP
              </button>
            ) : (
              <div className="text-sm text-gray-400 mb-4">
                Resend OTP in <span className="font-bold">{timer}</span> seconds
              </div>
            )}

            <button
              type="button"
              onClick={handleResetPassword}
              className="w-full bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default ResetPassword;
