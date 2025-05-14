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
  const [previewMounted, setPreviewMounted] = useState(false);
  const [isDeletingNotifications, setIsDeletingNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    console.log("🔔 Fetching notifications for user:", session?.user?.id);
    try {
      // Fetch marathon invitations
      const invitationsRes = await fetch('/api/habits/marathon?status=pending');
      let pendingInvitations = [];
      if (invitationsRes.ok) {
        const data = await invitationsRes.json();
        pendingInvitations = data.filter(inv => inv.status === 'pending').map(inv => ({
          ...inv,
          notificationType: 'invitation'
        }));
        console.log("🔔 Fetched pending marathon invitations:", pendingInvitations.length);
      } else {
        console.error("🔔 Error fetching marathon invitations:", await invitationsRes.text());
      }

      // Fetch marathon completion notifications
      console.log("🔔 Fetching marathon completion notifications...");
      const notificationsRes = await fetch('/api/notifications?type=marathon-completion&read=false');
      let completionNotifications = [];
      if (notificationsRes.ok) {
        completionNotifications = await notificationsRes.json();
        console.log("🔔 Fetched completion notifications:", completionNotifications.length);
        console.log("🔔 Completion notifications:", completionNotifications);
        
        // Transform format to match what the component expects
        completionNotifications = completionNotifications.map(notif => ({
          marathonId: notif.marathonId,
          name: notif.habitName,
          message: notif.message,
          notificationType: 'completion',
          _id: notif._id, // Keep the notification ID for marking as read
          senderId: notif.senderId,
          senderName: notif.senderName
        }));
      } else {
        console.error("🔔 Error fetching completion notifications:", await notificationsRes.text());
      }

      // Combine both types of notifications
      const allNotifications = [...pendingInvitations, ...completionNotifications];
      console.log("🔔 Total notifications:", allNotifications.length);
      setNotifications(allNotifications);
    } catch (err) {
      console.error('🔔 Error fetching notifications', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [session]);

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          notificationIds: [notificationId]
        }),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.notificationType === 'invitation') {
      router.push('/habit-marathon');
    } else if (notification.notificationType === 'completion') {
      // Mark as read when clicked
      if (notification._id) {
        markNotificationAsRead(notification._id);
      }
    }
    setShowNotifications(false);
  };

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
    // Check for duplicate habit name
    const duplicate = habits.find(h => h.name.trim().toLowerCase() === habit.name.trim().toLowerCase());
    if (duplicate) {
      toast.error('You are already part of this habit');
      setIsSubmitting(false);
      return;
    }
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
      console.log("✅ Tracking habit:", habitId);
      console.log("✅ Date:", date);
      
      // Check if the date is current day or previous day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() !== today.getTime() && selectedDate.getTime() !== yesterday.getTime()) {
        console.log("✅ Invalid date - not today or yesterday");
        toast.error("You can only track habits for today and yesterday");
        return;
      }
      
      // Find if the habit is already completed for this date
      const habit = habits.find(h => h._id === habitId);
      if (!habit) {
        console.log("✅ Habit not found");
        toast.error("Habit not found");
        return;
      }
      
      // Check if entry already exists and its completed status
      const existingEntry = (habit.streakData || []).find(entry => entry.date === date);
      const completed = existingEntry ? !existingEntry.completed : true;
      console.log("✅ Setting completed status to:", completed);
      console.log("✅ Existing entry:", existingEntry);
      console.log("✅ Habit marathons:", habit.marathons);
      
      console.log("✅ Sending API request to track habit...");
      const response = await fetch('/api/habits/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId, date, completed }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("✅ API error:", errorText);
        throw new Error('Failed to track habit');
      }
      
      const result = await response.json();
      console.log("✅ Habit tracking result:", result);

      loadHabits();
      loadStats();
      fetchNotifications(); // Add this to refresh notifications after tracking a habit
      toast.success('Habit tracked successfully!');
    } catch (error) {
      console.error('✅ Error tracking habit:', error);
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

  // Calculate total completed days across all habits
  const getTotalCompletedDays = () => {
    if (!habits || habits.length === 0) return 0;
    
    // Count the total number of completed days across all habits
    let totalDays = 0;
    habits.forEach(habit => {
      if (habit.streakData) {
        const completedDays = habit.streakData.filter(entry => entry.completed).length;
        totalDays += completedDays;
      }
    });
    
    return totalDays;
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
    setShowNotifications(!showNotifications);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
    setIsProfileOpen(false);
  };

  useEffect(() => { setPreviewMounted(true); }, []);

  // Add function to handle clearing all notifications
  const handleClearAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    try {
      setIsDeletingNotifications(true);
      
      // Delete all notifications directly in one step
      const deleteResponse = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allNotifications: true
        }),
      });
      
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to delete notifications');
      }
      
      // Clear the local notifications state
      setNotifications([]);
      toast.success('All notifications cleared');
      
      // Close the notification dropdown
      setShowNotifications(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    } finally {
      setIsDeletingNotifications(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-400 flex flex-col items-center justify-start p-6">
        {/* Sign In / Sign Up */}
        <div className="mt-32 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4 text-white flex items-center space-x-2"><span>🏃‍➡️</span><span>🚶‍♀️‍➡️</span><span>Sign In Required</span></h1>
          <p className="mb-6 text-center text-white/90">Please sign in to access the Habit Tracker.</p>
          <div className="flex space-x-4">
            <Link href="/auth/signin" className="px-6 py-2 bg-white bg-opacity-80 text-purple-700 rounded-lg hover:bg-opacity-100 transition">Sign In</Link>
            <Link href="/auth/signup" className="px-6 py-2 bg-white bg-opacity-80 text-green-700 rounded-lg hover:bg-opacity-100 transition">Sign Up</Link>
          </div>
        </div>
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
                {/* Mobile-only hamburger menu button */}
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-1 rounded-md ${darkMode ? 'text-white hover:bg-[#444]' : 'text-gray-800 hover:bg-gray-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>
                
                {/* Mobile Overall Run KM display */}
                <div className={`flex items-center justify-center px-2 py-1 rounded-md ${
                  darkMode 
                    ? 'bg-[rgba(9,203,177,0.1)] text-[rgba(9,203,177,0.823)] border border-[rgba(9,203,177,0.3)]' 
                    : 'bg-purple-50 text-purple-600 border border-purple-200'
                }`}>
                  <span className="text-xs font-medium">Journey: {getTotalCompletedDays()} KM</span>
                </div>
                
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
                        <div>
                          <div className="sticky top-0 bg-purple-100 dark:bg-[#333] px-4 py-1 flex justify-between items-center">
                            <span className="text-sm text-purple-800 dark:text-gray-200 font-medium">
                              Notifications ({notifications.length})
                            </span>
                            {notifications.length > 0 && (
                              <button
                                onClick={handleClearAllNotifications}
                                disabled={isDeletingNotifications}
                                className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                              >
                                {isDeletingNotifications ? 'Clearing...' : 'Clear All'}
                              </button>
                            )}
                          </div>
                          <ul className="max-h-64 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map(notif => (
                                <li key={notif.notificationType === 'invitation' ? notif.marathonId : notif._id} 
                                    className="border-b last:border-b-0 border-gray-100 dark:border-[#444]">
                                  <button
                                    onClick={() => handleNotificationClick(notif)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-gray-200"
                                  >
                                    {notif.notificationType === 'invitation' ? (
                                      <div>
                                        <div className="font-semibold">Marathon Invitation</div>
                                        <div className="text-sm truncate">"{notif.name}" marathon</div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="font-semibold">Habit Completed</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{notif.senderName}</div>
                                        <div className="text-sm">{notif.message}</div>
                                      </div>
                                    )}
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                                No notifications
                              </li>
                            )}
                          </ul>
                          {notifications.length > 0 && (
                            <div className="p-2 border-t border-gray-100 dark:border-[#444]">
                              <button
                                onClick={() => fetchNotifications()}
                                className="w-full text-center text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                              >
                                Refresh
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile menu dropdown */}
            {isMobileMenuOpen && (
              <div className="sm:hidden w-full mt-2 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-[#444] z-50">
                <div className="py-2">
                  <Link
                    href="/habit-tracker/stats"
                    className="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#333]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Stats
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
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-[#333]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
            
            <div className="hidden sm:flex flex-wrap gap-2 items-center ml-auto justify-end w-full sm:w-auto">
              {/* Overall Run KM display */}
              <div className={`flex items-center justify-center px-3 py-1 rounded-md ${
                darkMode 
                  ? 'bg-[rgba(9,203,177,0.1)] text-[rgba(9,203,177,0.823)] border border-[rgba(9,203,177,0.3)]' 
                  : 'bg-purple-50 text-purple-600 border border-purple-200'
              }`}>
                <span className="text-sm font-medium">Habit Journey: {getTotalCompletedDays()} KM</span>
              </div>
              
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
                      <div>
                        <div className="sticky top-0 bg-purple-100 dark:bg-[#333] px-4 py-1 flex justify-between items-center">
                          <span className="text-sm text-purple-800 dark:text-gray-200 font-medium">
                            Notifications ({notifications.length})
                          </span>
                          {notifications.length > 0 && (
                            <button
                              onClick={handleClearAllNotifications}
                              disabled={isDeletingNotifications}
                              className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                            >
                              {isDeletingNotifications ? 'Clearing...' : 'Clear All'}
                            </button>
                          )}
                        </div>
                        <ul className="max-h-64 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map(notif => (
                              <li key={notif.notificationType === 'invitation' ? notif.marathonId : notif._id} 
                                  className="border-b last:border-b-0 border-gray-100 dark:border-[#444]">
                                <button
                                  onClick={() => handleNotificationClick(notif)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-900 dark:text-gray-200"
                                >
                                  {notif.notificationType === 'invitation' ? (
                                    <div>
                                      <div className="font-semibold">Marathon Invitation</div>
                                      <div className="text-sm truncate">"{notif.name}" marathon</div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="font-semibold">Habit Completed</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">{notif.senderName}</div>
                                      <div className="text-sm">{notif.message}</div>
                                    </div>
                                  )}
                                </button>
                              </li>
                            ))
                          ) : (
                            <li className="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                              No notifications
                            </li>
                          )}
                        </ul>
                        {notifications.length > 0 && (
                          <div className="p-2 border-t border-gray-100 dark:border-[#444]">
                            <button
                              onClick={() => fetchNotifications()}
                              className="w-full text-center text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                            >
                              Refresh
                            </button>
                          </div>
                        )}
                      </div>
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
              <Link 
                href="/habit-tracker/public-marathon" 
                className={`hidden sm:inline-flex px-3 py-1 text-sm rounded-md ${
                  darkMode 
                    ? 'bg-[rgba(9,203,177,0.1)] hover:bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                }`}
              >
                <span className="inline-block animate-bounce mr-1">🏃‍➡️</span>
                Public Marathon
              </Link>
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
                        } shadow-md hover:shadow-lg hover:-translate-y-1 transition-transform`}
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
                  habits={habits}
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
                      habits={habits}
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