'use client';

import { useState, useEffect } from 'react';
import { fetchMfaStatus, toggleMfa } from '@/app/api/auth_service_others/route';
interface UserId{
  userId: string | undefined
}
export default function MfaToggle({ userId }:UserId) {
  const [enableMfa, setEnableMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showMfaOptions, setShowMfaOptions] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchStatus = async () => {
      try {
        const enabled = await fetchMfaStatus(userId);
        setEnableMfa(enabled);
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
          setErrorMessage('Failed to load MFA status. ' + error.message);
        } else {
          console.error('An unknown error occurred:', error);
          setErrorMessage('Failed to load MFA status.');
        }
      }
    };

    fetchStatus();
  }, [userId]);

  const handleMfaToggle = async () => {
    if (!userId) return;
  
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    const desiredState = !enableMfa;
  
    try {
      await toggleMfa(userId, desiredState);
      setEnableMfa(desiredState);
      setSuccessMessage(desiredState ? 'MFA enabled successfully!' : 'MFA disabled successfully!');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage('An error occurred. Please try again. ' + error.message);
      } else {
        console.error('An unknown error occurred:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  

  const handleCheckboxChange = () => {
    handleMfaToggle();
  };

  const toggleMfaOptions = () => {
    setShowMfaOptions((prev) => !prev);
  };

  return (
    <div>
      <div className="bg-gray-200 dark:bg-gray-700 px-2 rounded-md">
        <h2 className="text-sm text-gray-700 dark:text-white">
          <button
            onClick={toggleMfaOptions}
            className="flex justify-between items-center w-full text-left"
          >
            Enable Multi-factor-Authentication
            <span className="text-gray-500 text-sm dark:text-gray-300">
              {showMfaOptions ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
              )}
            </span>
          </button>
        </h2>
      </div>
      {showMfaOptions && (
        <div className="flex items-center justify-between space-x-4 mt-2 px-2">
          <p className="text-gray-600 text-sm dark:text-gray-200">
            Secure your account with Multi-Factor Authentication. The OTP will be sent to both email
            and phone number for MFA.
          </p>
          <div className="flex items-center space-x-1">
            <input
              type="checkbox"
              id="enable-mfa"
              checked={enableMfa}
              onChange={handleCheckboxChange}
              disabled={loading}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enable-mfa" className="text-sm text-gray-600 dark:text-gray-200">
              {enableMfa ? 'Enabled' : 'Disabled'}
            </label>
          </div>
        </div>
      )}
      {successMessage && (
        <p className="mt-2 text-sm text-center text-green-600 font-medium">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="mt-2 text-sm text-center text-red-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
