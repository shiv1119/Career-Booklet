'use client'
import Link from 'next/link';
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FaPhoneAlt, FaEnvelope, FaLock } from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

type FormData = {
  emailOrPhone: string;
  password: string;
};

const Login: React.FC = () => {
  const [isOtpLogin, setIsOtpLogin] = useState(false); // State for OTP login
  const [otpSent, setOtpSent] = useState(false); // State for whether OTP is sent
  const inputs = useRef<(HTMLInputElement | null)[]>([]); // Ref to store OTP inputs
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
    if (isOtpLogin && otpSent) {
      // OTP submission logic here
      console.log('OTP:', inputs.current.map(input => input?.value).join(''));
    }
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && index < inputs.current.length - 1) {
      // Move to the next input if it's not the last one
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && !e.currentTarget.value) {
      // Move to the previous input on Backspace if the current input is empty
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = () => {
    // Logic to send OTP here
    setOtpSent(true);
  };

  return (
    <div className="min-h-screen flex justify-center dark:bg-grey-800">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        
        {/* Email or Phone field */}
        <div className="mb-5 flex items-center">
          <div className="w-full">
            <div className='flex items-center'>
              <FaEnvelope className="mr-3 mb-2 text-gray-500" />
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email or Phone</label>
            </div>
            <input
              type="text"
              id="emailOrPhone"
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="name@flowbite.com or +91 1234567890"
              {...register('emailOrPhone', { required: 'Email or Phone is required' })}
            />
            {errors.emailOrPhone && <p className="text-sm text-red-500">{errors.emailOrPhone.message}</p>}
          </div>
        </div>

        {/* Password field */}
        {!isOtpLogin && (
          <div className="mb-5 flex items-center">
            <div className="w-full">
              <div className='flex items-center'>
                <FaLock className="mr-3 mb-2 text-gray-500" />
                <div className="flex items-center justify-between w-full">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Password</label>
                  <Link href="/forgot-password" className="text-sm mb-2 text-blue-500 hover:underline">Forget Password?</Link>
                </div>
              </div>
              <input
                type="password"
                id="password"
                className="text-sm bg-gray-50 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Your password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
          </div>
        )}

        {/* OTP Login Toggle */}

        {/* OTP Input Fields */}
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
                Please enter the 6-digit code we sent via email or SMS.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="text-sm w-full bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          onClick={isOtpLogin && !otpSent ? handleSendOtp : undefined}
        >
          {isOtpLogin ? (otpSent ? 'Submit OTP' : 'Send OTP') : 'Login'}
        </button>
        <div className="mt-3 text-center">
          <button
            type="button"
            className="text-sm text-blue-500"
            onClick={() => setIsOtpLogin(!isOtpLogin)}
          >
            {isOtpLogin ? 'Login with Password?' : 'Login with OTP?'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
