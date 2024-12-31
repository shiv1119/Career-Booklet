'use client';
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthButtons() {
  const pathname = usePathname();

  const isSignInActive = pathname === "/auth/login-password" || pathname === "/auth/login-otp";
  const isSignUpActive = pathname === "/auth/register";

  return (
    <div className="flex gap-4 mb-6">
      <Link
        href="/auth/login-password"
        className={`px-5 py-2 flex items-center gap-2 text-sm font-semibold rounded-md transition-all ${
          isSignInActive
            ? "bg-blue-600 text-white shadow-md scale-105"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        <FaSignInAlt size={18} />
        Sign In
      </Link>
      <Link
        href="/auth/register"
        className={`px-5 py-2 flex items-center gap-2 text-sm font-semibold rounded-md transition-all ${
          isSignUpActive
            ? "bg-blue-600 text-white shadow-md scale-105"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        <FaUserPlus size={18} />
        Sign Up
      </Link>
    </div>
  );
}
