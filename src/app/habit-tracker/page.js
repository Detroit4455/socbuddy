'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import AddHabitModal from '@/components/habits/AddHabitModal';
import HabitTemplateSelector from '@/components/habits/HabitTemplateSelector';
import ThemeToggle from '@/components/ThemeToggle';
import HabitDetails from '@/components/HabitDetails';

export default function HabitTracker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isSessionLoading = status === 'loading';
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [calendarData, setCalendarData] = useState({
    prevMonth: [],
    currentMonth: [],
    nextMonth: []
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadHabits();
      loadStats();
    }
    
    // Check if dark mode preference exists in localStorage
    const savedDarkMode = localStorage.getItem('socbuddy-dark-mode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, [session]);

  useEffect(() => {
    if (habits.length > 0) {
      if (!selectedHabit) {
      setSelectedHabit(habits[0]);
      } else {
        const updated = habits.find(h => h._id === selectedHabit._id);
        if (updated) {
          setSelectedHabit(updated);
        }
      }
    }
  }, [habits]);

  useEffect(() => {
    if (selectedHabit) {
      generateAllCalendarData();
    }
  }, [selectedHabit, currentMonth]);
  
  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('socbuddy-dark-mode', darkMode);
  }, [darkMode]);

  // Fetch and set pending marathon invitations
  const fetchNotifications = async () => {
    if (!session?.user) return;
    setNotifLoading(true);
    try {
      const res = await fetch('/api/habits/marathon?status=pending');
      if (res.ok) {
        const data = await res.json();
        const pending = data.filter(inv => inv.status === 'pending');
        setNotifications(pending);
      } else {
        console.error('Error fetching notifications:', res.statusText);
      }
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [session]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

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
      toast.error('Error loading habits');
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

  const handleAddHabit = async (habit) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(habit),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (responseData.error === 'Validation failed' && responseData.details) {
          const errorMessages = Object.entries(responseData.details)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          
          console.error('Validation errors:', responseData.details);
          toast.error(`Validation failed:\n${errorMessages}`);
        } else {
          console.error('Server error:', responseData.error);
          toast.error(responseData.error || 'Failed to create habit');
        }
        setIsSubmitting(false);
        return;
      }
      
      toast.success('Habit added successfully!');
      
      setIsAddModalOpen(false);
      setShowTemplatePicker(false);
      setIsSubmitting(false);
      loadHabits();
      loadStats();
    } catch (error) {
      console.error('Error submitting habit:', error);
      toast.error('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const isDateTodayOrYesterday = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate.getTime() === today.getTime() || 
           checkDate.getTime() === yesterday.getTime();
  };

  const handleTrackHabit = async (habitId, date) => {
    try {
      // Check if the date is current day or previous day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() !== today.getTime() && selectedDate.getTime() !== yesterday.getTime()) {
        toast.error("You can only track habits for today and yesterday");
        return;
      }
      
      // Find if the habit is already completed for this date
      const habit = habits.find(h => h._id === habitId);
      if (!habit) {
        toast.error("Habit not found");
        return;
      }
      
      // Check if entry already exists and its completed status
      const existingEntry = (habit.streakData || []).find(entry => entry.date === date);
      const completed = existingEntry ? !existingEntry.completed : true;
      
      const response = await fetch('/api/habits/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId, date, completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to track habit');
      }

      loadHabits();
      loadStats();
      toast.success('Habit tracked successfully!');
    } catch (error) {
      console.error('Error tracking habit:', error);
      toast.error('Error tracking habit');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: habitId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete habit');
      }

      toast.success('Habit deleted successfully');
      loadHabits();
      loadStats();
      if (selectedHabit && selectedHabit._id === habitId) {
        setSelectedHabit(habits.length > 1 ? habits.find(h => h._id !== habitId) : null);
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Error deleting habit');
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getPreviousMonthDays = (year, month) => {
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = [];
    
    if (firstDay > 0) {
      const daysInPrevMonth = getDaysInMonth(year, month - 1);
      for (let i = daysInPrevMonth - firstDay + 1; i <= daysInPrevMonth; i++) {
        prevMonthDays.push({
          day: i,
          month: month - 1,
          year: month === 0 ? year - 1 : year,
          isPrevMonth: true
        });
      }
    }
    
    return prevMonthDays;
  };

  const getNextMonthDays = (year, month, daysInMonth, firstDay) => {
    const lastDay = (firstDay + daysInMonth) % 7;
    const nextMonthDays = [];
    
    if (lastDay !== 0) {
      const daysToAdd = 7 - lastDay;
      for (let i = 1; i <= daysToAdd; i++) {
        nextMonthDays.push({
          day: i,
          month: month + 1,
          year: month === 11 ? year + 1 : year,
          isNextMonth: true
        });
      }
    }
    
    return nextMonthDays;
  };

  const generateAllCalendarData = () => {
    if (!selectedHabit) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Generate data for previous month
    const prevDate = new Date(year, month - 1, 1);
    const prevMonthData = generateMonthCalendarData(
      prevDate.getFullYear(),
      prevDate.getMonth(),
      selectedHabit
    );
    
    // Generate data for current month
    const currentMonthData = generateMonthCalendarData(
      year,
      month,
      selectedHabit
    );
    
    // Generate data for next month
    const nextDate = new Date(year, month + 1, 1);
    const nextMonthData = generateMonthCalendarData(
      nextDate.getFullYear(),
      nextDate.getMonth(),
      selectedHabit
    );
    
    setCalendarData({
      prevMonth: prevMonthData,
      currentMonth: currentMonthData,
      nextMonth: nextMonthData
    });
  };

  const generateMonthCalendarData = (year, month, habit) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const prevMonthDays = getPreviousMonthDays(year, month);
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      month,
      year,
      isCurrentMonth: true
    }));
    const nextMonthDays = getNextMonthDays(year, month, daysInMonth, firstDay);
    
    // Combine all days
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    
    // Add completion data from the selected habit
    const completionData = {};
    if (habit && habit.streakData) {
      habit.streakData.forEach(entry => {
        completionData[entry.date] = entry.completed;
      });
    }
    
    // Map calendar days with completion status
    const calendarWithStatus = allDays.map(day => {
      const dateStr = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
      return {
        ...day,
        dateStr,
        completed: completionData[dateStr] || false
      };
    });
    
    return {
      year,
      month,
      days: calendarWithStatus
    };
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const formatMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getCompletionRate = (habit) => {
    if (!habit || !habit.streakData || habit.streakData.length === 0) return 0;
    
    const completedEntries = habit.streakData.filter(entry => entry.completed).length;
    return Math.round((completedEntries / habit.streakData.length) * 100);
  };

  const getLongestStreak = (habit) => {
    return habit?.longestStreak || 0;
  };

  // Handle Marathon button click: redirect based on invitation status
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

  // Toggle notification panel and clear notifications when read
  const handleBellClick = () => {
    setShowNotifications(prev => {
      const newShow = !prev;
      if (newShow) fetchNotifications();
      return newShow;
    });
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
    setIsProfileOpen(false);
  };

  if (isSessionLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'} flex flex-col items-center justify-center p-4`}>
        <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sign In Required</h1>
        <p className={`mb-6 text-center ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Please sign in to access the Habit Tracker.</p>
        <Link
          href="/auth/signin"
          className={`${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} px-6 py-2 rounded-lg transition-all duration-300`}
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Get the current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-800'} flex flex-col`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: darkMode ? '#2a2a2a' : '#f3f4f6',
            color: darkMode ? '#e0e0e0' : '#111827',
            borderRadius: '8px',
            border: darkMode ? '1px solid #444' : '1px solid #e5e7eb'
          },
          success: {
            iconTheme: {
              primary: darkMode ? 'rgba(9,203,177,0.823)' : 'rgb(139, 92, 246)',
              secondary: 'white'
            }
          }
        }}
      />
      
      {/* Header */}
      <header className={`px-4 py-3 shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-b border-[#333]' : 'bg-white border-b border-gray-200'}`}>
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center justify-between w-full sm:w-auto space-x-1">
              <h1 className="text-xl font-semibold">Habit Tracker</h1>
              <div className="flex items-center sm:hidden space-x-1">
                {/* Mobile-only Marathon button */}
                <button
                  onClick={handleMarathonClick}
                  className="px-2 py-1 text-sm rounded-md bg-purple-50 hover:bg-purple-100 text-purple-600"
                >
                  <span className="inline-block animate-bounce">🏃‍➡️</span> Marathon
                </button>
                {/* Mobile-only Stats link - moved directly after Marathon */}
                <Link
                  href="/habit-tracker/stats"
                  className="px-2 py-1 text-sm rounded-md bg-purple-100 hover:bg-purple-200 text-purple-600"
                >
                  Stats
                </Link>
                {/* Mobile-only theme toggle */}
                <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                {/* Mobile-only notification bell with dropdown */}
                <div className="relative">
                  <button onClick={handleBellClick} className="text-xl">
                    🔔
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-2 h-4 w-4 bg-red-500 text-white text-xs font-semibold flex items-center justify-center rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute mt-1 right-0 w-64 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#444] rounded shadow-lg z-50">
                      {notifLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <svg className="animate-spin h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.372 0 0 5.372 0 12h4z" />
                          </svg>
                          Loading...
              </div>
                      ) : (
                        <ul className="max-h-48 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map(inv => (
                              <li key={inv.marathonId}>
                                <button
                                  onClick={() => { router.push('/habit-marathon'); setShowNotifications(false); }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-gray-200"
                                >
                                  Invitation to join "{inv.name}" marathon
                                </button>
                              </li>
                            ))
                          ) : (
                            <li className="px-4 py-2 text-center text-sm text-gray-900 dark:text-gray-200">
                              No notifications
                            </li>
                          )}
                        </ul>
                      )}
            </div>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-wrap gap-2 items-center ml-auto justify-end w-full sm:w-auto">
              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(prev => !prev)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-md ${darkMode ? 'hover:bg-[#444]' : 'hover:bg-[#eee]'}`}
                >
                  <span className={`${darkMode ? 'text-white' : 'text-gray-800'}`}>{session.user.username}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`${darkMode ? 'text-white h-4 w-4' : 'text-gray-600 h-4 w-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isProfileOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded shadow-lg z-50 ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'}`}>  
                    <Link href="/profile" className={`block px-4 py-2 text-sm ${darkMode ? 'text-[#e0e0e0]' : 'text-gray-800'} hover:${darkMode ? 'bg-[#333]' : 'bg-gray-100'}`}>Profile</Link>
                    <button onClick={handleSignOut} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-[#e0e0e0]' : 'text-gray-800'} hover:${darkMode ? 'bg-[#333]' : 'bg-gray-100'}`}>Sign Out</button>
                  </div>
                )}
              </div>
              {/* Notification bell */}
              <div className="relative">
                <button onClick={handleBellClick} className="relative text-xl">
                  🔔
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 w-4 bg-red-500 text-white text-xs font-semibold flex items-center justify-center rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute mt-1 right-0 w-64 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#444] rounded shadow-lg z-50">
                    {notifLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <svg className="animate-spin h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.372 0 0 5.372 0 12h4z" />
                        </svg>
                        Loading...
                      </div>
                    ) : (
                      <ul className="max-h-48 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(inv => (
                          <li key={inv.marathonId}>
                            <button onClick={() => { router.push('/habit-marathon'); setShowNotifications(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-gray-200">
                              Invitation to join "{inv.name}" marathon
                            </button>
                          </li>
                        )) : (
                          <li className="px-4 py-2 text-center text-sm text-gray-900 dark:text-gray-200">No notifications</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {/* Theme toggle */}
                <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Link 
                href="/habit-tracker/manage" 
                className={`hidden sm:inline-flex px-3 py-1 text-sm rounded-md ${
                  darkMode 
                    ? 'bg-[rgba(9,203,177,0.1)] hover:bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                }`}
              >
                Manage
              </Link>
              <button
                onClick={handleMarathonClick}
                className={`hidden sm:inline-flex px-3 py-1 text-sm rounded-md ${
                  darkMode 
                    ? 'bg-[rgba(9,203,177,0.1)] hover:bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                }`}
              >
                <span className="inline-block animate-bounce">🏃‍➡️</span> Marathon
              </button>
            </div>
            {/* Mobile-only greeting below capsules */}
            <div className="flex w-full items-center justify-end sm:hidden">
              <span className="text-sm font-medium">Hello, {session?.user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-grow">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-1/4">
              <div className={`${darkMode ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-white'} rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : ''}`}>My Habits</h2>
                  <Link
                    href="/habit-tracker/manage"
                    className={`text-sm px-2 py-1 rounded ${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'} md:hidden`}
                  >
                    Manage
                  </Link>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
                  </div>
                ) : habits.length > 0 ? (
                  <div className="space-y-3">
                    {habits.map(habit => (
                      <div 
                        key={habit._id}
                        onClick={() => { setSelectedHabit(habit); setShowMobileModal(true); }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedHabit && selectedHabit._id === habit._id
                            ? darkMode 
                              ? 'border-2 border-[rgba(9,203,177,0.823)] bg-[rgba(9,203,177,0.1)]'
                              : 'border-2 border-purple-500 bg-purple-50'
                            : darkMode
                              ? 'border border-[#444] hover:border-[rgba(9,203,177,0.4)]'
                              : 'border border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center ${darkMode ? 'bg-[#333]' : 'bg-gray-100'}`}>
                            {habit.icon}
                          </div>
                          <h3 className="font-medium flex-grow">{habit.name}</h3>
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrackHabit(
                                habit._id, 
                                new Date().toISOString().split('T')[0]
                              );
                            }} 
                            className={`flex items-center justify-center w-5 h-5 rounded border cursor-pointer ${
                              darkMode ? 'border-[#555] hover:bg-[#333]' : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {habit.streakData?.find(entry => 
                              entry.date === new Date().toISOString().split('T')[0]
                            )?.completed && (
                              <svg className={`w-4 h-4 ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-teal-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-[#888]' : 'text-gray-500'} mt-1`}>Current streak: {habit.currentStreak > 0 ? habit.currentStreak : 1}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className={darkMode ? 'text-[#888] mb-4' : 'text-gray-500 mb-4'}>You haven't created any habits yet.</p>
                    <button
                      onClick={() => setShowTemplatePicker(true)}
                      className={`${
                        darkMode 
                          ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' 
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      } px-4 py-2 rounded-lg transition-all duration-300`}
                    >
                      Create Your First Habit
                    </button>
                  </div>
                )}
                
                {habits.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowTemplatePicker(true)}
                      className={`w-full ${
                        darkMode 
                          ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' 
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      } px-4 py-2 rounded-lg transition-all duration-300`}
                    >
                      Add New Habit
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main Content */}
            {selectedHabit ? (
              // Desktop: show inline on md and up
              <div className="hidden md:block md:w-3/4">
                <HabitDetails
                  selectedHabit={selectedHabit}
                  darkMode={darkMode}
                  currentMonth={currentMonth}
                  calendarData={calendarData}
                  handleTrackHabit={handleTrackHabit}
                  isDateTodayOrYesterday={isDateTodayOrYesterday}
                  prevMonth={prevMonth}
                  nextMonth={nextMonth}
                  formatMonthYear={formatMonthYear}
                  formatMonthName={formatMonthName}
                  getCompletionRate={getCompletionRate}
                />
                                </div>
                                  ) : null}
            {/* Mobile: modal popup for main content using HabitDetails */}
            {showMobileModal && selectedHabit && (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-40 md:hidden">
                <div className="relative w-full h-full overflow-auto p-4">
                  <button
                    onClick={() => setShowMobileModal(false)}
                    className="absolute top-2 right-2 text-2xl text-white"
                  >×</button>
                  <div className={`${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'} rounded-lg shadow-lg border p-4 mx-auto w-full max-w-md mt-12 mb-12`}> 
                    <HabitDetails
                      selectedHabit={selectedHabit}
                      darkMode={darkMode}
                      currentMonth={currentMonth}
                      calendarData={calendarData}
                      handleTrackHabit={handleTrackHabit}
                      isDateTodayOrYesterday={isDateTodayOrYesterday}
                      prevMonth={prevMonth}
                      nextMonth={nextMonth}
                      formatMonthYear={formatMonthYear}
                      formatMonthName={formatMonthName}
                      getCompletionRate={getCompletionRate}
                    />
                                      </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border-t py-4 px-6 text-center ${darkMode ? 'text-[#888]' : 'text-gray-500'} text-sm`}>
        Daily Horizon - Build better habits, one day at a time
      </footer>
      
      {/* Add Habit Modal */}
      {isAddModalOpen && (
        <AddHabitModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddHabit}
          isLoading={isSubmitting}
          darkMode={darkMode}
        />
      )}
      
      {showTemplatePicker && (
        <HabitTemplateSelector
          onClose={() => setShowTemplatePicker(false)}
          onSave={handleAddHabit}
          isLoading={isSubmitting}
          darkMode={darkMode}
        />
      )}
    </div>
  );
} 