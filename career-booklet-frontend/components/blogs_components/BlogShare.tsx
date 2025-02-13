"use client";

import { useState } from "react";
import Image from "next/image";
import { Share2, X, Copy } from "lucide-react";


export default function ShareComponent({ blogTitle, blogUrl }: { blogTitle: string; blogUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareOptions = [
    { name: "WhatsApp", url: `https://wa.me/?text=${encodeURIComponent(blogTitle + " - " + blogUrl)}`, icon: "/icons/whatsapp.svg" },
    { name: "Twitter", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(blogTitle)}&url=${encodeURIComponent(blogUrl)}`, icon: "/icons/twitter.svg" },
    { name: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(blogUrl)}`, icon: "/icons/linkedin.svg" },
    { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`, icon: "/icons/facebook.svg" },
    { name: "Reddit", url: `https://www.reddit.com/submit?url=${encodeURIComponent(blogUrl)}&title=${encodeURIComponent(blogTitle)}`, icon: "/icons/reddit.svg" },
    { name: "Telegram", url: `https://t.me/share/url?url=${encodeURIComponent(blogUrl)}&text=${encodeURIComponent(blogTitle)}`, icon: "/icons/telegram.svg" },
    { name: "Email", url: `mailto:?subject=${encodeURIComponent(blogTitle)}&body=${encodeURIComponent(blogUrl)}`, icon: "/icons/email.svg" },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(blogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:border hover:border-gray-300 p-1 rounded-full focus:ring focus:ring-gray-300 focus:outline-none"
      >
        <Share2 className="w-5 h-5 text-gray-500 dark:text-gray-200" /> Share
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold text-center text-gray-900 dark:text-white my-2">{blogTitle}</h2>

            <div className="flex flex-col bg-gray-100 dark:bg-gray-800 p-2 rounded-md mb-4">
              <div className="flex items-center justify-between gap-2">
                <input 
                  type="text" 
                  value={blogUrl} 
                  readOnly 
                  className="w-full text-sm bg-transparent border rounded-md outline-none text-gray-600 dark:text-gray-300"
                />
                <button onClick={copyToClipboard} className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800">
                  <Copy size={20} />
                </button>
              </div>
              {copied && <span className="text-xs text-green-600 dark:text-green-400 mt-1 text-center">Link copied!</span>}
            </div>
            <div className="flex space-x-4 overflow-x-auto p-2 scrollbar-hide">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center space-y-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                >
                  <Image src={option.icon} alt={option.name} width={30} height={30} />
                  <span className="text-xs font-medium">{option.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
