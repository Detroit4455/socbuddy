'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-800'} flex flex-col`}>
      <header className={`px-4 py-3 shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-b border-[#333]' : 'bg-white border-b border-gray-200'}`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Habit Statistics</h1>
          <div className="flex items-center space-x-2">
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