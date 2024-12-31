'use client'
import Navbar from "./Navbar"
import Providers from "../providers/Providers"
import { useState,useEffect } from "react"

interface BaseLayoutProps {
    children: React.ReactNode;
}

const BaseLayout = ({children}: BaseLayoutProps) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const storedMode = localStorage.getItem('darkMode');
        if (storedMode === 'true') {
          setIsDarkMode(true);
          document.body.classList.add('dark');
        } else if (storedMode === 'false') {
          setIsDarkMode(false);
          document.body.classList.remove('dark');
        } else {
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
            document.body.classList.add('dark');
          } else {
            setIsDarkMode(false);
            document.body.classList.remove('dark');
          }
        }
      }, []);
    return (
        <>
        <Providers>
        <Navbar>{children}</Navbar>
        </Providers>
        </>
    )
}

export default BaseLayout;