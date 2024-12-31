'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'flowbite';
import Navbar from "@/components/Navbar"; 
import { SessionProvider } from "next-auth/react";
import { metadata } from './metadata';
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-800 dark:text-white`}
      >
        <SessionProvider>
        <AuthProvider>
            <Navbar>{children}</Navbar>
        </AuthProvider>
        </SessionProvider>
        <script src="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.js"></script>
      </body>
    </html>
  );
}
