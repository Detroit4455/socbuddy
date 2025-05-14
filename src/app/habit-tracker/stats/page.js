'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import HabitStatsDetail from '@/components/habits/HabitStatsDetail';

export default function HabitStatistics() {
  const { data: session } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('socbuddy-dark-mode');
    if (saved) setDarkMode(saved === 'true');
    if (session?.user) loadHabits();
  }, [session]);

  const loadHabits = async () => {
      setLoading(true);
    try {
      const res = await fetch('/api/habits');
      if (res.ok) setHabits(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('socbuddy-dark-mode', next);
      return next;
    });
  };

  const handleMarathonClick = () => router.push('/habit-marathon');
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
    setIsMobileMenuOpen(false);
  };

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-800'} flex flex-col`}>
      <header className={`px-4 py-3 shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-b border-[#333]' : 'bg-white border-b border-gray-200'}`}>
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <h1 className="text-xl font-semibold">Habit Statistics</h1>
            
            {/* Mobile hamburger menu */}
            <div className="sm:hidden flex items-center">
              {/* Home button before hamburger */}
              <Link 
                href="/habit-tracker" 
                className={`p-1 rounded-md mr-2 ${darkMode ? 'text-white hover:bg-[#444]' : 'text-gray-800 hover:bg-gray-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 00-1-1h-4a1 1 0 00-1 1v4a1 1 0 001 1H9" />
                </svg>
              </Link>
              
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-1 rounded-md ${darkMode ? 'text-white hover:bg-[#444]' : 'text-gray-800 hover:bg-gray-100'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu dropdown */}
          {isMobileMenuOpen && (
            <div className="sm:hidden w-full mt-2 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#444] z-50">
              <div className="py-2">
                <Link
                  href="/habit-tracker"
                  className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#333]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tracker
                </Link>
                <Link
                  href="/habit-tracker/manage"
                  className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#333]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Manage
                </Link>
                <Link
                  href="/habit-tracker/public-marathon"
                  className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#333]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="inline-block mr-1">🏃‍➡️</span>
                  Public Marathon
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#333]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#333]"
                >
                  Sign Out
                </button>
                <div className="mt-2 px-4 py-2 border-t border-gray-100 dark:border-[#444] flex items-center justify-between">
                  <span className="text-sm text-gray-800 dark:text-white">Theme</span>
                  <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                </div>
              </div>
            </div>
          )}
          
          {/* Desktop navigation */}
          <div className="hidden sm:flex items-center space-x-2">
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Link href="/habit-tracker" className={`px-3 py-1 text-sm rounded-md ${darkMode ? 'bg-[rgba(9,203,177,0.1)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.2)]' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>Tracker</Link>
            <Link href="/habit-tracker/manage" className={`px-3 py-1 text-sm rounded-md ${darkMode ? 'bg-[rgba(9,203,177,0.1)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.2)]' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>Manage</Link>
            <button onClick={handleMarathonClick} className={`px-3 py-1 text-sm rounded-md ${darkMode ? 'bg-[rgba(9,203,177,0.1)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.2)]' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>🏃‍➡️ Marathon</button>
          </div>
        </div>
      </header>
      <div className="flex-grow p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
          </div>
        ) : (
          <HabitStatsDetail habits={habits} darkMode={darkMode} />
        )}
      </div>
    </div>
  );
} 