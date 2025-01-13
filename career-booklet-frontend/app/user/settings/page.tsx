'use client'

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";

export default function Settings() {
  const { data: session, status } = useSession();
  const [enableMfa, setEnableMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isAuthenticated = status === "authenticated";

  const handleMfaToggle = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setMessage("");

    try {
      const url = `${process.env.AUTH_SERVICES_API}/api/auth/enable-mfa?user_id=${session.user.id}&enable=${enableMfa}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setMessage(enableMfa ? "MFA enabled successfully!" : "MFA disabled successfully!");
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.detail || "Failed to toggle MFA"}`);
      }
    } catch (error) {
      console.error("Error toggling MFA:", error);
      setMessage("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-10 px-4">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Settings</h1>

      {!isAuthenticated ? (
        <div className="text-center">
          <p className="text-gray-600 dark:text-white mb-4">Please log in to access your settings.</p>
          <button
            onClick={() => signIn()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log In
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border-2 border-black shadow-md rounded-lg p-6 w-full max-w-3xl dark:border-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-700 dark:text-white">Enable MFA</h2>
              <p className="text-gray-600 dark:text-gray-200">Secure your account with Multi-Factor Authentication.</p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                id="enable-mfa"
                checked={enableMfa}
                onChange={(e) => setEnableMfa(e.target.checked)}
                className="h-6 w-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enable-mfa" className="text-gray-600 dark:text-gray-200">
                {enableMfa ? "Enabled" : "Disabled"}
              </label>
            </div>
          </div>

          <button
            onClick={handleMfaToggle}
            disabled={loading}
            className={`mt-6 w-full px-4 py-2 font-medium text-white rounded ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : enableMfa
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Saving..." : "Save"}
          </button>

          {message && (
            <p
              className={`mt-4 text-center font-medium ${
                message.startsWith("Error") ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
