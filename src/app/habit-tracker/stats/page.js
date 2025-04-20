'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import HabitStatsDetail from '@/components/habits/HabitStatsDetail';

export default function HabitStatistics() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadHabits();
      loadStats();
    }
  }, [session]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/habits');
      if (!response.ok) {
        throw new Error('Failed to fetch habits');
      }
      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/habits/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch habit statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading habit statistics:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="mb-6 text-center">Please sign in to access the Habit Tracker statistics.</p>
        <Link
          href="/auth/signin"
          className="bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)] px-4 py-2 rounded-lg hover:bg-[rgba(9,203,177,0.25)] transition-all duration-300"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pt-16 pb-10 px-4 sm:px-6 lg:px-8 text-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto bg-[#1e1e1e] rounded-2xl shadow-lg p-6 border border-[#444] mt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Habit Statistics</h1>
            <p className="text-[#bbb] mt-1">Detailed insights into your habit performance</p>
          </div>
          <Link
            href="/habit-tracker"
            className="bg-[#2a2a2a] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-all duration-300"
          >
            Back to Tracker
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overall Summary */}
            {stats && (
              <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#444]">
                <h2 className="text-xl font-semibold text-white mb-4">Overall Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[#666] text-xs uppercase">Total Habits</p>
                    <p className="text-3xl font-bold text-white">{stats.totalHabits}</p>
                  </div>
                  <div>
                    <p className="text-[#666] text-xs uppercase">Completion Rate</p>
                    <p className="text-3xl font-bold text-[rgba(9,203,177,0.823)]">{stats.completionRate}%</p>
                  </div>
                  <div>
                    <p className="text-[#666] text-xs uppercase">Longest Streak</p>
                    <p className="text-3xl font-bold text-white">{stats.longestStreak} days</p>
                  </div>
                  <div>
                    <p className="text-[#666] text-xs uppercase">Daily Habits</p>
                    <p className="text-3xl font-bold text-white">{stats.habitsByFrequency.daily}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Individual Habit Stats */}
            <HabitStatsDetail habits={habits} />
          </div>
        )}
      </div>
    </div>
  );
} 