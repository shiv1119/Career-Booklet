'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const DeleteAccountDropdown = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDropdown = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div>
      <div className="bg-gray-200 dark:bg-gray-700 px-2 rounded-md">
        <button
          onClick={toggleDropdown}
          className="flex justify-between items-center w-full text-left"
        >
          <h2 className="text-sm text-gray-700 dark:text-white">
            Delete Account
          </h2>
          <span className="text-gray-500 text-sm dark:text-gray-300">
            {isExpanded ? (
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
      </div>

      {isExpanded && (
        <div className="flex items-center justify-between mt-2 px-2 space-x-4">
          <div>
            <p className="text-gray-600 text-sm dark:text-gray-200">
              <span className="text-red-600">Account deletion warning: </span>
              Deleting your account will permanently remove your data and access to all services. Please confirm your decision carefully.
            </p>
          </div>
          <div>
            <Link
              href="/delete-account"
              className="text-blue-500 text-sm whitespace-nowrap"
            >
              Click here
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteAccountDropdown;
