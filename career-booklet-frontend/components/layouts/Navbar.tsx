'use client'
import React, { ReactNode, useEffect, useState } from "react";
import { FaEnvelope, FaMoon, FaSun } from 'react-icons/fa';
// import { GoVideo } from 'react-icons/go';
import { IoSettings } from "react-icons/io5";
import { MdHelp } from "react-icons/md";
import Link from "next/link";
import { useSession,signOut } from "next-auth/react";
import { RiLogoutBoxLine } from "react-icons/ri";  
import { BiUser } from "react-icons/bi";
import { FiBell, FiMessageSquare } from 'react-icons/fi';
import { useRouter } from "next/navigation";

interface NavbarProps {
  children: ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({ children }) => {
  const {data: session,status} = useSession();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [isBlogsDropdownOpen, setIsBlogsDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const router = useRouter();
  const toggleMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };
  
const blogsToggleDropdown = () => {
  setIsBlogsDropdownOpen(prev => !prev);
};
const categoryToggleDropdown = () => {
  setIsCategoryDropdownOpen(prev => !prev);
};
  const handleLogout = () => {
    signOut({ 
      redirect: true,
     });
     router.push('/');
  };

  useEffect(() => {
    const storedMode = localStorage.getItem('darkMode');
    if (storedMode) {
      setIsDarkMode(storedMode === 'true');
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  return (
    <>
      <div>
        <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="px-3 py-2 lg:px-5 lg:pl-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-start rtl:justify-end">
                <button data-drawer-target="logo-sidebar" data-drawer-toggle="logo-sidebar" aria-controls="logo-sidebar" type="button" className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                  <span className="sr-only">Open sidebar</span>
                  <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                  </svg>
                </button>
                <Link href="/" className="flex ms-2 md:me-24">
                  <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">Career Booklet</span>
                </Link>
              </div>
              
              {!isLoading && <>
              {!isAuthenticated && (
                <div className=" dark:text-white">
                  <Link href='/auth/login-password'>Sign Up</Link>
                </div>
              )}
              {isAuthenticated && (
                <div className="flex items-center space-x-0">
                  <button className="relative p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600">
                    <FiMessageSquare size={20} />
                    <span className="sr-only">Messages</span>
                  </button>
                  <button className="relative p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600">
                    <FiBell size={20} />
                    <span className="sr-only">Notifications</span>
                  </button>
                  <div className="relative pl-2">
                    <button onClick={toggleDropdown} type="button" className="flex items-center text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">
                      <span className="sr-only">Open user menu</span>
                      <img className="w-8 h-8 rounded-full" src="https://flowbite.com/docs/images/people/profile-picture-5.jpg" alt="user photo" />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-lg">
                        <ul className="py-1 text-sm">
                          <li>
                            <Link href='/profile' className="flex  items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                            <FaEnvelope className="mr-2"/>
                            {session?.user?.email}
                            </Link>
                          </li>
                          <li>
                            <Link href="/profile" className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                              <BiUser className="mr-2" />
                              Profile
                            </Link>
                          </li>
                          <li>
                            <button onClick={handleLogout} className="flex items-center p-2 w-full hover:bg-gray-100 dark:hover:bg-gray-600">
                              <RiLogoutBoxLine className="mr-2" />
                              Sign out
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )} </>}
            </div>
          </div>
        </nav>
      </div>
      <div>
        <aside id="logo-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen pt-16 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700" aria-label="Sidebar" aria-hidden="true" suppressHydrationWarning={true}>
          <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800 text-sm">
          <ul className="space-y-2 font-medium">
            {isAuthenticated && <li>
                <Link href="/dashboard" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <svg className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 21">
                    <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
                    <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
                </svg>
                <span className="ms-1">Dashboard</span>
                </Link>
              </li>
          }
            {/*
            <li>
                <a href="#" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 18">
                    <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap">Test</span>
                </a>
            </li>
            <li>
                <div className="flex items-center p-2 text-gray-800 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <GoVideo className="text-xl text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
                <span className="flex-1 ms-3 whitespace-nowrap">Learning</span>
                </div>
            </li> */}
            <li>
              <button
                onClick={blogsToggleDropdown}
                className="flex py-2 px-2 items-center justify-between text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group w-full"
              >
              <svg
                className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.5L16.5 2H12Zm8 18h-8V4h4v4h4v12ZM2 6h4v14H2V6Zm6 4h4v2H8v-2Zm0 4h4v2H8v-2Zm0 4h4v2H8v-2Z" />
              </svg>                
                <span className="ml-1 whitespace-nowrap">
                  Blogs
                </span>
                <svg
                  className="w-5 h-5 ml-auto transition-transform duration-200"
                  style={{ transform: isBlogsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isBlogsDropdownOpen && (
                <ul className="pl-6">
                  {isAuthenticated && (<li>
                    <Link
                      href="/posts/create-blog"
                      className="flex justify-between px-2 py-1 text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Create Blog
                      <svg
                        className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </Link>
                  </li>
                  )}
                  <li>
                    <Link
                      href="/posts/trending-blogs"
                      className="flex justify-between px-2 py-1 text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Trending 
                      <svg
                        className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 17l6-6 4 4 8-8M14 7h7v7"
                        />
                      </svg>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/posts/latest-blogs"
                      className="flex justify-between px-2 py-1  text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Latest blogs
                      <svg
                        className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6l4 2M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"
                        />
                      </svg>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/posts/category3"
                      className="flex justify-between px-2 py-1  text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Blogs by  #tags
                      <svg
                        className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.5 7.5h.008v.008H7.5V7.5Zm5.586-5.586a2 2 0 0 0-2.828 0L3 9.672V15a2 2 0 0 0 2 2h5.328l6.086-6.086a2 2 0 0 0 0-2.828l-3.328-3.328ZM12 3.172 15.828 7 12 10.828 8.172 7 12 3.172Z"
                        />
                      </svg>
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={categoryToggleDropdown}
                      className="flex py-1 px-2 items-center justify-between text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group w-full"
                    >
                      <span className="whitespace-nowrap">Blogs by category</span>
                      <svg
                        className="w-5 h-5 transition-transform duration-200"
                        style={{ transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {isCategoryDropdownOpen && (
                      <ul className="pl-3">
                        <li className="flex items-center justify-between">
                          <Link
                            href="/posts/technology"
                            className="block px-1 py-1 text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Technology
                          </Link>
                        </li>
                        <li className="flex items-center justify-between">
                          <Link
                            href="/posts/sports"
                            className="block px-1 py-1 text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Sports
                          </Link>
                        </li>
                        <li className="flex items-center justify-between">
                          <Link
                            href="/posts/news"
                            className="block px-1 py-1 text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            News
                          </Link>
                        </li>
                        <li className="flex items-center justify-between">
                          <Link
                            href="/posts/engineering"
                            className="block px-1 py-1 text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Engineering
                          </Link>
                        </li>
                        <li className="flex items-center justify-between">
                          <Link
                            href="/posts/entertainment"
                            className="block px-1 py-1 text-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Entertainment
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                </ul>
              )}
            </li>

            {/* <li>
                <Link href="/jobs" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <IoBriefcaseSharp className="text-xl text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
                <span className="flex-1 ms-3 whitespace-nowrap">Jobs</span>
                </Link>
            </li> */}
        </ul>
        <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-gray-700">
            <li>
                <Link href="#" className="flex items-center p-2 text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                <svg className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 17 20">
                    <path d="M7.958 19.393a7.7 7.7 0 0 1-6.715-3.439c-2.868-4.832 0-9.376.944-10.654l.091-.122a3.286 3.286 0 0 0 .765-3.288A1 1 0 0 1 4.6.8c.133.1.313.212.525.347A10.451 10.451 0 0 1 10.6 9.3c.5-1.06.772-2.213.8-3.385a1 1 0 0 1 1.592-.758c1.636 1.205 4.638 6.081 2.019 10.441a8.177 8.177 0 0 1-7.053 3.795Z"/>
                </svg>
                <span className="ms-1">Upgrade to Pro</span>
                </Link>
            </li>
            {isAuthenticated && (
            <li>
                <Link href="/user/settings" className="flex items-center p-2 text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                <IoSettings className="text-xl text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
                <span className="ms-1">Settings & Privacy</span>
                </Link>
            </li>
            )}
            <li>
                <div onClick={toggleMode}
                className="flex items-center p-2 text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                <button
                    className="flex items-center text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                    {isDarkMode ? (
                    <FaSun className="text-yellow-500 text-lg" />
                    ) : (
                    <FaMoon className="text-lg text-gray-500 transition duration-75 group-hover:text-gray-900" />
                    )}
                    <span className="ms-1">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>
                </div>
            </li>
            <li>
                <Link href="#" className="flex items-center p-2 text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                <MdHelp className="text-xl text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"/>
                <span className="ms-1">Help</span>
                </Link>
            </li>
        </ul>
          </div>
        </aside>
      </div>
      <div className="px-2 py-2 sm:ml-64 dark:bg-gray-800 dark:text-white">
        <div className="px-2 py-2 rounded-lg dark:border-gray-700 mt-14">
        <div className="grid grid-cols-12 gap-4 mb-2">
          <div className="col-span-12 md:col-span-12 lg:col-span-8 lg:pl-4">
            {children}
          </div>
          <div className="col-span-12 lg:col-span-4">
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
