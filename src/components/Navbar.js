'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState('work');

  useEffect(() => {
    if (session?.user?.userProfile) {
      setUserProfile(session.user.userProfile);
    }
  }, [session]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  const switchProfile = async (newProfile) => {
    try {
      console.log(`Attempting to switch profile to: ${newProfile}`);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userProfile: newProfile }),
      });

      const responseData = await response.json();
      console.log('Profile API response:', responseData);

      if (response.ok) {
        // Update local state
        setUserProfile(newProfile);
        console.log(`Local state updated to: ${newProfile}`);
        
        // Update session
        console.log('Current session before update:', session);
        try {
          const result = await update({
            ...session,
            user: {
              ...session.user,
              userProfile: newProfile
            }
          });
          console.log('Session update result:', result);
        } catch (updateError) {
          console.error('Error updating session:', updateError);
        }
        
        // Get the updated session
        console.log('Session after update attempt:', session);
        
        // Force reload to ensure session changes are applied
        window.location.reload();
        
        // Close dropdown
        setIsDropdownOpen(false);
      } else {
        console.error('Failed to switch profile:', responseData);
      }
    } catch (error) {
      console.error('Error switching profile:', error);
    }
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
        {session && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]">
            {userProfile === 'work' ? 'Work' : 'Personal'}
          </span>
        )}
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
        <li>
          <Link href="/habit-tracker" className="hover:text-[rgba(9,203,177,0.823)] transition-colors">
            Habits
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
                <div className="px-4 py-2 border-b border-[#444]">
                  <p className="text-xs text-[#999] mb-1">Switch Profile:</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => switchProfile('work')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        userProfile === 'work'
                          ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]'
                          : 'bg-[#333] text-[#e0e0e0] hover:bg-[#444]'
                      }`}
                    >
                      Work
                    </button>
                    <button
                      onClick={() => switchProfile('personal')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        userProfile === 'personal'
                          ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]'
                          : 'bg-[#333] text-[#e0e0e0] hover:bg-[#444]'
                      }`}
                    >
                      Personal
                    </button>
                  </div>
                </div>
                
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