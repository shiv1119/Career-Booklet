'use client'
import React, { useRef } from 'react';

const Activation: React.FC = () => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

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

  return (
    <div className='min-h-screen'>
      <form className="max-w-sm mx-auto">
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
          Please introduce the 6-digit code we sent via email.
        </p>
      </form>
    </div>
  );
};

export default Activation;
