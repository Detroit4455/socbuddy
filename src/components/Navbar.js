'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  return (
    <nav className="w-full bg-[#1e1e1e] p-2 text-white flex justify-between fixed top-0 left-0 right-0 z-40 border-b border-[#333]">
      <div className="flex items-center space-x-2">
        <img 
          src="/ICON.svg" 
          alt="SocBuddy Logo" 
          className="w-6 h-6"
        />
        <span className="text-lg font-bold text-[rgba(9,203,177,0.823)]">SocBuddy</span>
      </div>
      
      <ul className="flex space-x-4 items-center">
        <li>
          <Link href="/" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">
            Home
          </Link>
        </li>
        <li>
          <Link href="/todo-list-manager" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">
            Tasks
          </Link>
        </li>
        {session?.user?.role === 'admin' && (
          <li>
            <Link href="/administrator" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">
              Administrator
            </Link>
          </li>
        )}
        
        {status === 'loading' ? (
          <li className="text-sm text-gray-400">Loading...</li>
        ) : session ? (
          <li className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1 bg-[rgba(9,203,177,0.15)] px-3 py-1 rounded-md hover:bg-[rgba(9,203,177,0.25)] transition-colors"
            >
              <span>Welcome, {session.user.username}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-md shadow-lg py-1 z-50 border border-[#444]">
                <Link 
                  href="/profile"
                  className="block px-4 py-2 text-sm text-[#e0e0e0] hover:bg-[#333] hover:text-[rgba(9,203,177,0.823)]"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-[#e0e0e0] hover:bg-[#333] hover:text-[rgba(9,203,177,0.823)]"
                >
                  Sign Out
                </button>
              </div>
            )}
          </li>
        ) : (
          <>
            <li>
              <Link 
                href="/auth/signin"
                className="text-white hover:text-[rgba(9,203,177,0.823)] transition-colors"
              >
                Sign In
              </Link>
            </li>
            <li>
              <Link 
                href="/auth/signup"
                className="bg-[rgba(9,203,177,0.2)] hover:bg-[rgba(9,203,177,0.3)] text-[rgba(9,203,177,0.823)] py-1 px-3 rounded-md transition-colors"
              >
                Sign Up
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar; 