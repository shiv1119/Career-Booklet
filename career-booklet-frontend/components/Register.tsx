'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { FaPhoneAlt, FaEnvelope, FaLock } from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';  
import 'react-phone-input-2/lib/style.css'; 
import { useRouter } from 'next/navigation';

type FormData = {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const Register = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const payload = {
      email: data.email,
      phone_number: data.phone,
      roles: 'user',
      password: data.password,
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error:', errorData);
        alert(`Error: ${errorData.message || 'Unable to create user'}`);
      } else {
        const responseData = await response.json();
        console.log('User created successfully:', responseData);
        alert('User created successfully!');
        
        // Navigate to the activation page
        router.push('/auth/activation'); 
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while creating the user.');
    }
  };

  return (
    <div className="min-h-screen flex justify-center dark:bg-grey-800">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        {/* Email field */}
        <div className="mb-5 flex items-center">
          <div className="w-full">
            <div className="flex items-center">
              <FaEnvelope className="mr-3 mb-2 text-gray-500" />
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email</label>
            </div>
            <input
              type="email"
              id="email"
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 text-gray-900 rounded-lg pl-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="name@flowbite.com"
              {...register('email', { required: 'Email is required', pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i })}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
        </div>

        {/* Phone field */}
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
                className: `
                  pl-12 text-sm bg-white text-gray-800 border border-gray-300 rounded-lg w-full 
                  dark:bg-gray-800 dark:text-white dark:border-gray-600
                `,
              }}
              onChange={(value) => setValue('phone', value, { shouldValidate: true })}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>
        </div>

        {/* Password field */}
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
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
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
