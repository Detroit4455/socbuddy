'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const ModernNavbar = ({ darkMode, toggleDarkMode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  return (
    <nav className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      darkMode 
        ? (scrolled ? 'backdrop-blur-lg bg-[#1e1e1e]/90' : 'bg-[#1e1e1e]') 
        : (scrolled ? 'backdrop-blur-lg bg-white/90 shadow-sm' : 'bg-white shadow-sm')
      } ${darkMode ? 'border-[#333]' : 'border-gray-200'} border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative overflow-hidden rounded-full">
                <img 
                  src="/ICON.svg" 
                  alt="SocBuddy Logo" 
                  className="w-8 h-8 transition-transform duration-500 transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-[rgba(9,203,177,0.2)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="text-xl font-bold text-[rgba(9,203,177,0.823)] transition-all duration-300 group-hover:tracking-wider">
                SocBuddy
              </span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex space-x-6 items-center">
              <Link href="/" className={`${darkMode ? 'text-white' : 'text-gray-700'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300 relative group text-sm font-medium`}>
                Home
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${darkMode ? 'bg-[rgba(9,203,177,0.823)]' : 'bg-gray-500'} transition-all duration-300 group-hover:w-full`}></span>
              </Link>
              <Link href="/todo-list-manager" className={`${darkMode ? 'text-white' : 'text-gray-700'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300 relative group text-sm font-medium`}>
                Tasks
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${darkMode ? 'bg-[rgba(9,203,177,0.823)]' : 'bg-gray-500'} transition-all duration-300 group-hover:w-full`}></span>
              </Link>
              <Link href="/habit-tracker" className={`${darkMode ? 'text-white' : 'text-gray-700'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300 relative group text-sm font-medium`}>
                Habits
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${darkMode ? 'bg-[rgba(9,203,177,0.823)]' : 'bg-gray-500'} transition-all duration-300 group-hover:w-full`}></span>
              </Link>
              {session?.user?.role === 'admin' && (
                <Link href="/administrator" className={`${darkMode ? 'text-white' : 'text-gray-700'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300 relative group text-sm font-medium`}>
                  Administrator
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${darkMode ? 'bg-[rgba(9,203,177,0.823)]' : 'bg-gray-500'} transition-all duration-300 group-hover:w-full`}></span>
                </Link>
              )}
            </div>

            <div className="h-6 w-px bg-gray-500/30"></div>
            
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            {status === 'loading' ? (
              <div className="animate-pulse h-8 w-24 bg-gray-500/20 rounded-md"></div>
            ) : session ? (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center space-x-2 ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-white hover:bg-gray-100'} px-3 py-2 rounded-lg transition-all duration-300 border ${darkMode ? 'border-[#444]' : 'border-gray-200'} group`}
                >
                  <div className={`w-8 h-8 ${darkMode ? 'bg-[rgba(9,203,177,0.2)]' : 'bg-purple-100'} rounded-full flex items-center justify-center`}>
                    <span className={`${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-700'} text-sm font-semibold`}>
                      {session.user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                    {session.user.username}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-md shadow-lg py-1 z-50 border transition-all duration-200 animate-fadeIn`}>
                    <Link 
                      href="/profile"
                      className={`block px-4 py-2 text-sm ${darkMode ? 'text-[#e0e0e0] hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      href="/dashboard"
                      className={`block px-4 py-2 text-sm ${darkMode ? 'text-[#e0e0e0] hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <div className={`h-px ${darkMode ? 'bg-[#444]' : 'bg-gray-200'} my-1`}></div>
                    <button
                      onClick={handleSignOut}
                      className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-[#e0e0e0] hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth/signin"
                  className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-[rgba(9,203,177,0.823)] transition-colors duration-300`}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup"
                  className={`text-sm font-medium ${
                    darkMode 
                      ? 'bg-[rgba(9,203,177,0.2)] hover:bg-[rgba(9,203,177,0.3)] text-[rgba(9,203,177,0.823)]' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } py-2 px-4 rounded-lg transition-colors duration-300`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${
                darkMode 
                  ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } p-2 rounded-md focus:outline-none transition-colors`}
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border-t`}>
        <div className="px-4 pt-2 pb-3 space-y-1">
          <Link 
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/todo-list-manager"
            className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Tasks
          </Link>
          <Link 
            href="/habit-tracker"
            className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Habits
          </Link>
          {session?.user?.role === 'admin' && (
            <Link 
              href="/administrator"
              className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Administrator
            </Link>
          )}
          {status !== 'loading' && !session && (
            <>
              <Link 
                href="/auth/signin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup"
                className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
          {status !== 'loading' && session && (
            <>
              <Link 
                href="/profile"
                className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link 
                href="/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-[#333]' : 'text-gray-700 hover:bg-gray-100'} hover:text-[rgba(9,203,177,0.823)]`}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ModernNavbar; 