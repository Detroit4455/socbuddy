'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import AddHabitModal from '@/components/habits/AddHabitModal';
import ThemeToggle from '@/components/ThemeToggle';

export default function HabitTracker() {
  const { data: session, status } = useSession();
  const isSessionLoading = status === 'loading';
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    if (habits.length > 0 && !selectedHabit) {
      setSelectedHabit(habits[0]);
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
      <header className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border-b py-4 px-6`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-500'}`}>Daily Horizon</h1>
            <p className={darkMode ? 'text-[#888]' : 'text-gray-500'}>{formattedDate}</p>
          </div>
          <div className="flex items-center">
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <nav className="ml-4">
              <ul className="flex space-x-6">
                <li><Link href="/" className={`${darkMode ? 'text-[#bbb] hover:text-[rgba(9,203,177,0.823)]' : 'text-gray-600 hover:text-gray-900 hover:underline'} transition-all`}>Home</Link></li>
                <li><Link href="/habit-tracker/manage" className={`${darkMode ? 'text-[#bbb] hover:text-[rgba(9,203,177,0.823)]' : 'text-gray-600 hover:text-gray-900 hover:underline'} transition-all`}>Manage</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex-grow">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-1/4">
              <div className={`${darkMode ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-white'} rounded-lg p-6`}>
                <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : ''}`}>My Habits</h2>
                
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
                  </div>
                ) : habits.length > 0 ? (
                  <div className="space-y-3">
                    {habits.map(habit => (
                      <div 
                        key={habit._id}
                        onClick={() => setSelectedHabit(habit)}
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
                      onClick={() => setIsAddModalOpen(true)}
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
                      onClick={() => setIsAddModalOpen(true)}
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
              <div className="w-full md:w-3/4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left column - Habit details and insights */}
                  <div className="lg:col-span-8">
                    <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 mb-6`}>
                      <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>{selectedHabit.name}</h2>
                      {selectedHabit.description && (
                        <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-4`}>{selectedHabit.description}</p>
                      )}
                      
                      {/* Progress Insights */}
                      <div className="mt-4">
                        <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : ''}`}>Progress Insights</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Current Streak */}
                          <div className={`text-center py-2 px-3 ${darkMode ? 'bg-[#333]' : 'bg-gray-50'} rounded-lg`}>
                            <p className={darkMode ? 'text-[#888] text-sm mb-1' : 'text-gray-500 text-sm mb-1'}>Current Streak</p>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-500'}`}>{selectedHabit.currentStreak > 0 ? selectedHabit.currentStreak : 1}</div>
                            <p className={darkMode ? 'text-[#888] text-xs' : 'text-gray-500 text-xs'}>days</p>
                          </div>
                          
                          {/* Completion Rate */}
                          <div className={`text-center py-2 px-3 ${darkMode ? 'bg-[#333]' : 'bg-gray-50'} rounded-lg`}>
                            <p className={darkMode ? 'text-[#888] text-sm mb-1' : 'text-gray-500 text-sm mb-1'}>Completion Rate</p>
                            <div className="flex justify-center">
                              <div className="relative h-16 w-16">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={darkMode ? "#555" : "#E5E7EB"}
                                    strokeWidth="3"
                                  />
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={darkMode ? "rgba(9,203,177,0.823)" : "#A78BFA"}
                                    strokeWidth="3"
                                    strokeDasharray={`${getCompletionRate(selectedHabit)}, 100`}
                                  />
                                </svg>
                                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-semibold ${darkMode ? 'text-white' : ''}`}>
                                  {getCompletionRate(selectedHabit)}%
                                </div>
                              </div>
                            </div>
                            <p className={darkMode ? 'text-[#888] text-xs' : 'text-gray-500 text-xs'}>last 30 days</p>
                          </div>
                          
                          {/* Best Streak */}
                          <div className={`text-center py-2 px-3 ${darkMode ? 'bg-[#333]' : 'bg-gray-50'} rounded-lg`}>
                            <p className={darkMode ? 'text-[#888] text-sm mb-1' : 'text-gray-500 text-sm mb-1'}>Best Streak</p>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-500'}`}>{selectedHabit.longestStreak > 0 ? selectedHabit.longestStreak : 1}</div>
                            <p className={darkMode ? 'text-[#888] text-xs' : 'text-gray-500 text-xs'}>days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Calendar Section */}
                    <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 mb-4`}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-md font-medium ${darkMode ? 'text-white' : ''}`}>{formatMonthYear(currentMonth)}</h3>
                        <div className="flex space-x-2">
                          <button 
                            onClick={prevMonth}
                            className={`p-1 rounded-full ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${darkMode ? 'text-[#bbb]' : ''}`}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                          </button>
                          <button 
                            onClick={nextMonth}
                            className={`p-1 rounded-full ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${darkMode ? 'text-[#bbb]' : ''}`}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {/* Previous Month Calendar */}
                        <div className={`transform transition-transform hover:scale-105 hover:shadow-md rounded-lg border ${darkMode ? 'border-[#444] bg-[#2a2a2a]' : 'border-gray-200 bg-white'} p-2 shadow-sm hover:shadow relative`}>
                          <div className={`absolute inset-0 ${darkMode ? 'bg-[#333]' : 'bg-gray-100'} rounded-lg transform -z-10`} style={{ transform: 'translate(3px, 3px)' }}></div>
                          <h4 className={`text-center font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-1 text-sm`}>
                            {formatMonthName(new Date(calendarData.prevMonth.year, calendarData.prevMonth.month))}
                          </h4>
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {/* Days of week headers */}
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                              <div key={index} className={`text-center py-1 text-xs font-medium ${darkMode ? 'text-[#666]' : 'text-gray-500'}`}>
                                {day}
                              </div>
                            ))}
                            
                            {/* Calendar days */}
                            {calendarData.prevMonth.days && calendarData.prevMonth.days.map((day, index) => {
                              const isTrackable = isDateTodayOrYesterday(day.dateStr);
                              
                              return (
                                <div 
                                  key={index} 
                                  className={`text-center py-1 relative ${
                                    day.isCurrentMonth 
                                      ? darkMode ? 'text-white' : 'text-gray-800' 
                                      : darkMode ? 'text-[#555]' : 'text-gray-400'
                                  }`}
                                  onClick={() => isTrackable ? handleTrackHabit(
                                    selectedHabit._id,
                                    day.dateStr
                                  ) : null}
                                >
                                  <span className={`
                                    h-5 w-5 flex items-center justify-center mx-auto rounded-full text-xs
                                    ${day.completed ? (darkMode ? 'bg-[rgba(9,203,177,0.823)]' : 'bg-teal-500') + ' text-white' : darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}
                                    ${isTrackable ? 'cursor-pointer' : 'cursor-default opacity-70'}
                                  `}>
                                    {day.day}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Current Month Calendar */}
                        <div className={`transform transition-transform hover:scale-105 hover:shadow-md rounded-lg border ${darkMode ? 'border-[#444] bg-[#2a2a2a]' : 'border-gray-200 bg-white'} p-2 shadow-sm hover:shadow relative`}>
                          <div className={`absolute inset-0 ${darkMode ? 'bg-[#333]' : 'bg-gray-100'} rounded-lg transform -z-10`} style={{ transform: 'translate(3px, 3px)' }}></div>
                          <h4 className={`text-center font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-1 text-sm`}>
                            {formatMonthName(new Date(calendarData.currentMonth.year, calendarData.currentMonth.month))}
                          </h4>
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {/* Days of week headers */}
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                              <div key={index} className={`text-center py-1 text-xs font-medium ${darkMode ? 'text-[#666]' : 'text-gray-500'}`}>
                                {day}
                              </div>
                            ))}
                            
                            {/* Calendar days */}
                            {calendarData.currentMonth.days && calendarData.currentMonth.days.map((day, index) => {
                              const isToday = day.year === today.getFullYear() && 
                                             day.month === today.getMonth() && 
                                             day.day === today.getDate();
                              
                              const isYesterday = (() => {
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                return day.year === yesterday.getFullYear() && 
                                       day.month === yesterday.getMonth() && 
                                       day.day === yesterday.getDate();
                              })();
                              
                              const isTrackable = isToday || isYesterday;
                              
                              return (
                                <div 
                                  key={index} 
                                  className={`text-center py-1 relative ${
                                    day.isCurrentMonth 
                                      ? darkMode ? 'text-white' : 'text-gray-800' 
                                      : darkMode ? 'text-[#555]' : 'text-gray-400'
                                  } ${
                                    isToday 
                                      ? 'font-bold' 
                                      : ''
                                  }`}
                                  onClick={() => isTrackable ? handleTrackHabit(
                                    selectedHabit._id,
                                    day.dateStr
                                  ) : null}
                                >
                                  <span className={`
                                    h-5 w-5 flex items-center justify-center mx-auto rounded-full text-xs
                                    ${day.completed ? (darkMode ? 'bg-[rgba(9,203,177,0.823)]' : 'bg-teal-500') + ' text-white' : darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}
                                    ${isToday && !day.completed ? 'border border-purple-500' : ''}
                                    ${isTrackable ? 'cursor-pointer' : 'cursor-default opacity-70'}
                                  `}>
                                    {day.day}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Next Month Calendar */}
                        <div className={`transform transition-transform hover:scale-105 hover:shadow-md rounded-lg border ${darkMode ? 'border-[#444] bg-[#2a2a2a]' : 'border-gray-200 bg-white'} p-2 shadow-sm hover:shadow relative`}>
                          <div className={`absolute inset-0 ${darkMode ? 'bg-[#333]' : 'bg-gray-100'} rounded-lg transform -z-10`} style={{ transform: 'translate(3px, 3px)' }}></div>
                          <h4 className={`text-center font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-600'} mb-1 text-sm`}>
                            {formatMonthName(new Date(calendarData.nextMonth.year, calendarData.nextMonth.month))}
                          </h4>
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {/* Days of week headers */}
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                              <div key={index} className={`text-center py-1 text-xs font-medium ${darkMode ? 'text-[#666]' : 'text-gray-500'}`}>
                                {day}
                              </div>
                            ))}
                            
                            {/* Calendar days */}
                            {calendarData.nextMonth.days && calendarData.nextMonth.days.map((day, index) => {
                              return (
                                <div 
                                  key={index} 
                                  className={`text-center py-1 relative ${
                                    day.isCurrentMonth 
                                      ? darkMode ? 'text-white' : 'text-gray-800' 
                                      : darkMode ? 'text-[#555]' : 'text-gray-400'
                                  }`}
                                >
                                  <span className="h-5 w-5 flex items-center justify-center mx-auto rounded-full text-xs opacity-70">
                                    {day.day}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Task Completion History */}
                    <div className={`col-span-3 ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4 mb-4`}>
                      <h3 className={`text-md font-medium mb-3 ${darkMode ? 'text-white' : ''}`}>Task Completion History</h3>
                      
                      <div className="h-60">
                        {selectedHabit.streakData && selectedHabit.streakData.length > 0 ? (
                          <div className="relative h-full">
                            {/* X-axis */}
                            <div className={`absolute bottom-0 left-0 right-0 h-px ${darkMode ? 'bg-[#444]' : 'bg-gray-200'}`}></div>
                            
                            {/* Y-axis */}
                            <div className={`absolute top-0 bottom-0 left-0 w-px ${darkMode ? 'bg-[#444]' : 'bg-gray-200'}`}></div>
                            
                            {/* Generate line graph based on last 14 days data */}
                            {(() => {
                              // Get the last 14 days
                              const dates = [];
                              const today = new Date();
                              
                              for (let i = 13; i >= 0; i--) {
                                const date = new Date(today);
                                date.setDate(date.getDate() - i);
                                const dateStr = date.toISOString().split('T')[0];
                                dates.push(dateStr);
                              }
                              
                              // Count completed tasks per day
                              const completionData = dates.map(date => {
                                const entry = selectedHabit.streakData.find(d => d.date === date);
                                return {
                                  date,
                                  completed: entry?.completed ? 1 : 0,
                                  displayDate: new Date(date).getDate()
                                };
                              });
                              
                              const maxValue = 1;
                              const graphHeight = 200;
                              
                              return (
                                <>
                                  {/* Line graph */}
                                  <svg className="w-full h-full" viewBox={`0 0 ${completionData.length * 30} ${graphHeight}`} preserveAspectRatio="none">
                                    <path
                                      d={`M ${completionData.map((point, index) => 
                                        `${index * 30 + 15},${graphHeight - (point.completed * (graphHeight - 20))}`
                                      ).join(' L ')}`}
                                      fill="none"
                                      stroke={darkMode ? "rgba(9,203,177,0.823)" : "#8b5cf6"}
                                      strokeWidth="2"
                                    />
                                    
                                    {/* Data points */}
                                    {completionData.map((point, index) => (
                                      <circle
                                        key={index}
                                        cx={index * 30 + 15}
                                        cy={graphHeight - (point.completed * (graphHeight - 20))}
                                        r="4"
                                        fill={point.completed ? (darkMode ? "rgba(9,203,177,0.823)" : "#8b5cf6") : "#fff"}
                                        stroke={darkMode ? "rgba(9,203,177,0.823)" : "#8b5cf6"}
                                        strokeWidth="2"
                                      />
                                    ))}
                                  </svg>
                                  
                                  {/* X-axis labels */}
                                  <div className="flex justify-between mt-2 px-2">
                                    {completionData.map((point, index) => (
                                      <div key={index} className={`text-xs ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>
                                        {point.displayDate}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className={`h-full flex items-center justify-center ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>
                            No completion data available yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right column - Achievements */}
                  <div className="lg:col-span-4">
                    <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 h-full`}>
                      <h3 className={`text-lg font-medium mb-6 ${darkMode ? 'text-white' : ''}`}>Achievements</h3>
                      
                      <div className="space-y-4">
                        {/* 3 Day Streak Achievement */}
                        <div className={`p-4 rounded-lg ${
                          selectedHabit.longestStreak >= 3 
                            ? darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-yellow-50' 
                            : darkMode ? 'bg-[#333]' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🔥</div>
                            <div>
                              <h4 className={`font-medium ${darkMode ? 'text-white' : ''}`}>3 Day Streak</h4>
                              <p className={`text-sm ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>
                                {selectedHabit.longestStreak >= 3 ? 'Completed' : 'In Progress'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* 7 Day Streak Achievement */}
                        <div className={`p-4 rounded-lg ${
                          selectedHabit.longestStreak >= 7 
                            ? darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-yellow-50' 
                            : darkMode ? 'bg-[#333]' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🏆</div>
                            <div>
                              <h4 className={`font-medium ${darkMode ? 'text-white' : ''}`}>7 Day Streak</h4>
                              <p className={`text-sm ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>
                                {selectedHabit.longestStreak >= 7 ? 'Completed' : 'In Progress'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Monthly Master Achievement */}
                        <div className={`p-4 rounded-lg ${
                          selectedHabit.longestStreak >= 30 
                            ? darkMode ? 'bg-[rgba(9,203,177,0.1)]' : 'bg-yellow-50' 
                            : darkMode ? 'bg-[#333]' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">⭐</div>
                            <div>
                              <h4 className={`font-medium ${darkMode ? 'text-white' : ''}`}>Monthly Master</h4>
                              <p className={`text-sm ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>
                                {selectedHabit.longestStreak >= 30 ? 'Completed' : 'In Progress'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`w-full md:w-3/4 flex items-center justify-center ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}>
                <div className="text-center py-12">
                  <p className={darkMode ? 'text-[#888] mb-4' : 'text-gray-500 mb-4'}>Select a habit from the list or create a new one to get started.</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className={`${
                      darkMode 
                        ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' 
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    } px-4 py-2 rounded-lg transition-all duration-300`}
                  >
                    Create New Habit
                  </button>
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
    </div>
  );
} 