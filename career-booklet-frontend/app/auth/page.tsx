'use client'
import React, { useState } from "react";
import { Register } from "@/components"; // Import Register component
import { Login } from "@/components";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa"; // Import React Icons

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false); // State to toggle between Register and Login

  return (
    <div className="p-6 flex flex-col items-center">
      {/* Button Group */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setIsRegister(false)}
          className={`px-9 py-2 flex items-center gap-2 text-sm font-semibold rounded-md transition-all ${
            !isRegister
              ? "bg-blue-600 text-white shadow-md scale-105"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          <FaSignInAlt size={18} />
          Sign In
        </button>
        <button
          onClick={() => setIsRegister(true)}
          className={`px-9 py-2 flex items-center gap-2 text-sm font-semibold rounded-md transition-all ${
            isRegister
              ? "bg-blue-600 text-white shadow-md scale-105"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          <FaUserPlus size={18} />
          Sign Up
        </button>
      </div>

      <div className="w-full max-w-md">
        {isRegister ? <Register /> : <Login />}
      </div>
    </div>
  );
}
