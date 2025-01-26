'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaPhoneAlt, FaLock } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type FormData = {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const Register = () => {
  const router = useRouter();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [modal, setModal] = useState<{ visible: boolean; content: React.ReactNode | null }>({
    visible: false,
    content: null,
  });
  const { status } = useSession();
  
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>();

  const checkEmail = async (email: string) => {
    if (!email) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.exists) {
        if (data.deleted) {
          setModal({
            visible: true,
            content: (
              <div>
                <p className="text-sm">Account exists and is deleted. Do you want to recover?</p>
                <div className="mt-4 flex justify-center gap-4">
                  <button
                    onClick={() => recoverAccount(email)}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Recover Account
                  </button>
                  <button
                    onClick={() => setModal({ visible: false, content: null })}
                    className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            ),
          });
        } else if (!data.activated) {
          setModal({
            visible: true,
            content: (
              <div>
                <p className="text-sm">Account exists but is not activated.</p>
                <div className="mt-4 flex justify-center gap-4">
                  <button
                    onClick={() => handleActivateAccount(email)}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Activate Account
                  </button>
                  <button
                    onClick={() => setModal({ visible: false, content: null })}
                    className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            ),
          });
        } else {
          setErrorMessages(["Account exists with this email."]);
        }
      } else {
        setErrorMessages([]);
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const handleActivateAccount = async (email: string) => {
    setModal({ visible: false, content: null });
    router.push(`/auth/activation?email=${encodeURIComponent(email)}`);
  };

  const recoverAccount = async (email: string) => {
    setModal({ visible: false, content: null });
    router.push(`/recover-account?email=${encodeURIComponent(email)}`);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      email: data.email,
      phone_number: data.phone,
      roles: 'user',
      password: data.password,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error:', errorData);
        setErrorMessages([errorData.message || 'Unable to create user']);
      } else {
        const responseData = await response.json();
        console.log('User created successfully:', responseData);
        setErrorMessages([]);

        localStorage.setItem('cb-user-email', data.email);

        router.push(`/auth/activation?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessages(['An error occurred while creating the user.']);
    }
  };

  return (
    <div className="min-h-screen flex justify-center dark:bg-grey-800">
      {modal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-80 relative">
            <button
              onClick={() => setModal({ visible: false, content: null })}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Close modal"
            >
              <AiOutlineClose size={20} />
            </button>
            <div className="text-center">
              <div className="text-sm text-gray-700 dark:text-gray-300 px-2">
                {modal.content}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 w-full max-w-sm">
        {errorMessages.length > 0 && (
          <div className="bg-red-100 text-red-700 border border-red-300 p-4 mb-4 rounded-md">
            <ul>
              {errorMessages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mb-5">
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email</label>
          <input
            type="email"
            id="email"
            className="text-sm bg-gray-50 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="name@example.com"
            {...register('email', { required: 'Email is required' })}
            onBlur={(e) => checkEmail(e.target.value)}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="mb-5 flex items-center">
          <div className="w-full">
            <div className="flex flex-row items-center">
              <FaPhoneAlt className="mr-3 mb-2 text-gray-500 dark:text-white" />
              <label htmlFor="phone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Phone Number</label>
            </div>
            <PhoneInput
              country={'in'}
              placeholder="Enter phone number"
              containerClass="text-black"
              inputProps={{
                className: `pl-11 text-sm bg-white text-gray-800 border border-gray-300 rounded-lg w-full
                dark:bg-gray-800 dark:text-white dark:border-gray-600
                `,
              }}
              onChange={(value) => setValue('phone', value, { shouldValidate: true })}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="mb-5 flex items-center">
          <div className="w-full">
            <div className="flex items-center">
              <FaLock className="mr-3 mb-2 text-gray-500" />
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Password</label>
            </div>
            <input
              type="password"
              id="password"
              className="text-sm bg-gray-50 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Your password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
                  message: 'Password must contain at least one capital letter, one number, and one special character',
                },
              })}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        {/* Confirm Password field */}
        <div className="mb-5 flex items-center">
          <div className="w-full">
            <div className="flex items-center">
              <FaLock className="mr-3 mb-2 text-gray-500" />
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Confirm Password</label>
            </div>
            <input
              type="password"
              id="confirmPassword"
              className="text-sm bg-gray-50 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Confirm password"
              {...register('confirmPassword', {
                required: 'Confirm Password is required',
                validate: (value) => value === watch('password') || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <button type="submit" className="text-sm w-full bg-blue-600 text-white py-2.5 px-5 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Register;
