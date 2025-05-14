'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/solid';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

// Get the current month in YYYY-MM format
const currentDate = new Date();
const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

export default function BankPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialHabit = searchParams.get('habit') || 'Meditation';
  const initialMonth = searchParams.get('month') || currentYearMonth;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHabitName, setSelectedHabitName] = useState(initialHabit);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [slide, setSlide] = useState(false);
  const { data: session, status } = useSession();
  const [userHabits, setUserHabits] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  // Habit template options
  const [templates, setTemplates] = useState([]);
  // State for public marathon follower threshold
  const [threshold, setThreshold] = useState(10);
  // State for expanded habits view
  const [expandedHabits, setExpandedHabits] = useState(false);
  
  const monthOptions = useMemo(() => {
    const ms = new Set();
    data.forEach(h => h.participants.forEach(p => p.completedDates.forEach(d => ms.add(d.slice(0,7)))));
    return Array.from(ms).sort().map(ym => {
      const [year, month] = ym.split('-');
      const date = new Date(parseInt(year), parseInt(month)-1);
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      return { value: ym, label };
    });
  }, [data]);
  
  // Set current month when data loads (if current month exists in options)
  useEffect(() => {
    if (data.length > 0 && monthOptions.some(opt => opt.value === currentYearMonth)) {
      setSelectedMonth(currentYearMonth);
    }
  }, [monthOptions, data]);

  // Get filtered data based on selections
  const filteredData = useMemo(() => {
    if (!selectedHabitName) return null;
    
    const habitData = data.find(h => h.habitName === selectedHabitName);
    if (!habitData) return null;
    
    // Apply month filter if selected
    const filteredParticipants = habitData.participants.map(p => {
      const dates = selectedMonth 
        ? p.completedDates.filter(d => d.startsWith(selectedMonth))
        : p.completedDates;
      
      return {
        ...p,
        completedDates: dates,
        completedDays: dates.length
      };
    });
    
    // Sort by completion count (descending)
    filteredParticipants.sort((a, b) => b.completedDays - a.completedDays);
    
    return {
      ...habitData,
      participants: filteredParticipants
    };
  }, [data, selectedHabitName, selectedMonth]);
  
  // Determine number of days in the selected month or fallback to current month
  const trackDays = useMemo(() => {
    // Use selectedMonth or default to currentYearMonth
    const ym = selectedMonth || currentYearMonth;
    const [yearStr, monthStr] = ym.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    // month is 1-based here; JS Date month param is next month and day 0 gives last day of desired month
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);
  
  // Animation effect
  useEffect(() => {
    if (filteredData) {
      setSlide(false);
      setTimeout(() => setSlide(true), 100);
    }
  }, [filteredData]);

  useEffect(() => {
    fetch('/api/habits/public')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(json => setData(json))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  
  // Fetch current user's habits
  useEffect(() => {
    if (session) {
      fetch('/api/habits')
        .then(res => res.json())
        .then(json => {
          const names = Array.isArray(json) ? json.map(h => h.name) : [];
          setUserHabits(names);
        })
        .catch(err => console.error('Error fetching user habits:', err));
    }
  }, [session]);

  // Fetch habit templates for dropdown
  useEffect(() => {
    fetch('/api/habit-templates')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
      })
      .then(json => setTemplates(json))
      .catch(err => console.error('Error fetching templates:', err));
  }, []);

  // Fetch follower threshold for public marathon
  useEffect(() => {
    fetch('/api/settings/public-marathon-threshold')
      .then(res => res.json())
      .then(json => {
        if (json.threshold !== undefined) setThreshold(json.threshold);
      })
      .catch(err => console.error('Error fetching threshold:', err));
  }, []);

  // Sort templates by used_count descending
  const sortedTemplates = useMemo(
    () => templates.slice().sort((a, b) => b.used_count - a.used_count),
    [templates]
  );

  // Only show templates with more than the configured follower threshold
  const popularTemplates = useMemo(
    () => sortedTemplates.filter(t => t.used_count > threshold),
    [sortedTemplates, threshold]
  );

  // Handle joining a habit
  const handleJoin = async () => {
    if (!selectedHabitName) return;
    try {
      setIsJoining(true);
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedHabitName })
      });
      if (!res.ok) throw new Error('Failed to join habit');
      await res.json();
      toast.success(`Joined habit: ${selectedHabitName}`);
      // Reload page preserving filters
      window.location.href =
        `/habit-tracker/public-marathon?habit=${encodeURIComponent(selectedHabitName)}&month=${encodeURIComponent(selectedMonth)}`;
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error joining habit');
    } finally {
      setIsJoining(false);
    }
  };

  const barColors = ['#A78BFA','#3B82F6','#EC4899','#34D399','#FACC15'];

  // Add handler for Marathon redirection
  const handleMarathonClick = async () => {
    try {
      const res = await fetch('/api/habits/marathon');
      if (!res.ok) throw new Error();
      const data = await res.json();
      const active = data.find(inv => inv.status === 'accepted' || inv.status === 'owner');
      if (active) {
        router.push(`/habit-marathon/chart?marathonId=${active.marathonId}`);
      } else {
        router.push('/habit-marathon');
      }
    } catch {
      router.push('/habit-marathon');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-500 text-white py-8 px-4 sm:px-6">
      {/* Top navigation bar */}
      <nav className="w-full mb-4 sm:mb-6 flex items-center justify-between px-2 sm:px-6">
        <Link href="/habit-tracker" className="text-white hover:text-gray-300">
          <HomeIcon className="h-6 w-6 inline-block" />
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={handleMarathonClick} className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <span className="inline-block animate-bounce">🏃‍➡️</span> Marathon
          </button>
          <Link 
            href="/habit-tracker"
            className="hidden sm:block px-3 py-1 text-sm font-medium rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            Back to Tracker
          </Link>
        </div>
      </nav>
      
      <div className="w-full max-w-none mx-auto p-4 sm:p-6 bg-white/10 border border-white/20 rounded-lg">
        <header className="pb-4 flex flex-col items-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2">
            <h1 className="text-lg sm:text-2xl font-semibold text-center">
              {selectedHabitName ? `${selectedHabitName} Marathon` : 'Public Marathon'}
            </h1>
            
            {/* Month Select - Moved beside the title */}
            <div className="flex items-center">
              <select
                id="monthSelect"
                value={selectedMonth}
                onChange={e => {
                  const month = e.target.value;
                  setSelectedMonth(month);
                  router.replace(
                    `/habit-tracker/public-marathon?habit=${encodeURIComponent(selectedHabitName)}&month=${encodeURIComponent(month)}`
                  );
                }}
                className="bg-white/20 text-white text-sm px-2 py-1 rounded border border-white/30 focus:outline-none focus:border-white/50"
              >
                <option value="" className="text-black">All Time</option>
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value} className="text-black">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm opacity-80 text-center mt-1">
            View progress across all users for each habit
          </p>
        </header>
        
        {/* User's Habits (capsule buttons) */}
        {session && userHabits.length > 0 && (
          <div className="mb-6">
            <div className={`flex flex-wrap gap-2 ${!expandedHabits ? 'max-h-[44px] sm:max-h-[68px] overflow-hidden' : ''}`}>
              {userHabits.map(name => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedHabitName(name);
                    window.location.href =
                      `/habit-tracker/public-marathon?habit=${encodeURIComponent(name)}&month=${encodeURIComponent(selectedMonth)}`;
                  }}
                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    name === selectedHabitName
                      ? 'bg-white text-purple-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            {userHabits.length > 6 && (
              <button 
                onClick={() => setExpandedHabits(!expandedHabits)}
                className="mt-2 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center mx-auto transition-colors"
              >
                {expandedHabits ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Show Less
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Show All Habits
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Filter Controls */}
        <div className="flex justify-center items-center mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="habitSelect" className="text-sm whitespace-nowrap">Select Habit:</label>
            <select
              id="habitSelect"
              value={selectedHabitName}
              onChange={e => {
                const habit = e.target.value;
                setSelectedHabitName(habit);
                router.replace(
                  `/habit-tracker/public-marathon?habit=${encodeURIComponent(habit)}&month=${encodeURIComponent(selectedMonth)}`
                );
              }}
              className="bg-white/20 text-white text-xs py-1 px-1.5 rounded border border-white/30 focus:outline-none focus:border-white/50 min-w-[150px] sm:min-w-[200px] max-w-[250px] truncate"
            >
              <option value="" className="text-black">-- Select a habit --</option>
              {popularTemplates.map(t => (
                <option key={t._id} value={t.habit} className="text-black">
                  {t.habit} ({t.used_count})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {session && filteredData && (() => {
          const userPart = filteredData.participants.find(p => p.userId === session.user.id);
          if (!userPart) return null;
          const ratio = trackDays > 0 ? userPart.completedDays / trackDays : 0;
          const percent = ratio * 100;
          return (
            <div className="mb-6 w-full">
              <h2 className="text-sm font-semibold mb-2 text-center">Your Progress</h2>
              <div className="flex flex-col sm:flex-row sm:items-center overflow-visible">
                <span className="hidden sm:block w-24 text-sm font-medium truncate">You</span>
                <div className="relative w-full sm:flex-1 mt-1 mb-2 sm:mx-2 overflow-visible">
                  <div className="overflow-x-auto">
                    <div className="relative w-full h-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <div className="hidden sm:grid absolute -top-1 left-0 right-0 h-3"
                        style={{ gridTemplateColumns: `repeat(${trackDays}, 1fr)` }}
                      >
                        {Array.from({ length: trackDays - 1 }).map((_, idx) => (
                          <div key={idx} className="border-r border-white/40 h-full" />
                        ))}
                      </div>
                      <div
                        className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
                        style={{ width: slide ? `${percent}%` : '0%', backgroundColor: barColors[0] }}
                      />
                    </div>
                  </div>
                  <span
                    className="absolute -top-4 -translate-x-1/2 overflow-visible animate-bounce transition-all duration-1000 ease-out text-lg leading-none"
                    style={{ left: slide ? `${percent}%` : '0%' }}
                  >
                    🏃‍➡️
                  </span>
                </div>
                <span className="hidden sm:block sm:w-12 text-right text-sm">{userPart.completedDays}km</span>
                <div className="flex justify-between w-full mt-[-2px] sm:hidden">
                  <span className="w-full text-sm font-medium truncate">You</span>
                  <span className="text-sm">{userPart.completedDays}km</span>
                </div>
              </div>
            </div>
          );
        })()}
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-white rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded p-4 text-center">
            {error}
          </div>
        ) : !selectedHabitName ? (
          <div className="text-center py-20 opacity-70">
            Select a habit to view progress
          </div>
        ) : !filteredData || filteredData.participants.length === 0 ? (
          <div className="text-center py-20 opacity-70">
            No data available for this selection
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center mt-10 min-h-[300px]">
            <main className="space-y-8 w-full">
              {filteredData.participants.map((p, i) => {
                const ratio = trackDays > 0 ? p.completedDays / trackDays : 0;
                const percent = ratio * 100;
                const color = barColors[i % barColors.length];
                return (
                  <div key={p.userId} className="flex flex-col sm:flex-row sm:items-center overflow-visible">
                    <span className="hidden sm:block w-24 text-sm font-medium truncate">
                      {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{p.username}
                    </span>
                    <div className="relative w-full sm:flex-1 mt-1 mb-2 sm:mx-2 overflow-visible">
                      <div className="overflow-x-auto">
                        <div className="relative w-full h-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                          <div className="hidden sm:grid absolute -top-1 left-0 right-0 h-3" 
                               style={{ gridTemplateColumns: `repeat(${trackDays}, 1fr)` }}>
                            {Array.from({ length: trackDays - 1 }).map((_, idx) => (
                              <div key={idx} className="border-r border-white/40 h-full" />
                            ))}
                          </div>
                          <div 
                            className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out" 
                            style={{ 
                              width: slide ? `${percent}%` : '0%', 
                              backgroundColor: color 
                            }} 
                          />
                        </div>
                      </div>
                      <span 
                        className="absolute -top-4 -translate-x-1/2 overflow-visible animate-bounce transition-all duration-1000 ease-out text-lg leading-none" 
                        style={{ left: slide ? `${percent}%` : '0%' }}>
                        🏃‍➡️
                      </span>
                    </div>
                    <span className="hidden sm:block sm:w-12 text-right text-sm">{p.completedDays}km</span>
                    <div className="flex justify-between w-full mt-[-2px] sm:hidden">
                      <span className="w-full text-sm font-medium truncate">
                        {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{p.username}
                      </span>
                      <span className="text-sm">{p.completedDays}km</span>
                    </div>
                  </div>
                );
              })}
            </main>
            
            <div className="flex justify-between w-full mt-10 text-sm border-t border-white/20 pt-4">
              <div>
                Max: {trackDays}km<br/>Each completion = 1km
              </div>
              <div className="text-right">
                {selectedMonth ? (
                  <span>Filtered: {selectedMonth}</span>
                ) : (
                  <span>All time data</span>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Join Marathon button inside container */}
        {session && selectedHabitName && !userHabits.includes(selectedHabitName) && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : 'Join Marathon'}
            </button>
          </div>
        )}
        <div className="mt-6 text-center text-sm opacity-70">
          <Link href="/habit-tracker" className="underline hover:text-white">
            Back to Habit Tracker
          </Link>
        </div>
      </div>
    </div>
  );
} 