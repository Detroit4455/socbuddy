'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import ThemeToggle from '@/components/ThemeToggle';

export default function ManageHabits() {
  const { data: session, status } = useSession();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHabit, setEditingHabit] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [habitForm, setHabitForm] = useState({
    name: '',
    description: '',
    icon: '',
    color: '',
    frequency: 'daily',
    targetDaysPerWeek: 7
  });

  // Icon and color options
  const ICON_OPTIONS = ['✓', '🏃', '📚', '💧', '🍎', '🧘', '💪', '🛌', '🧠', '🎯', '💻', '🎨'];
  const COLOR_OPTIONS = [
    '#8b5cf6', // purple
    '#ff9500', // orange
    '#ff2d55', // pink
    '#5ac8fa', // blue
    '#4cd964', // green
    '#9c5fff', // violet
    '#ffcc00', // yellow
    '#ff3b30'  // red
  ];

  useEffect(() => {
    if (session?.user) {
      loadHabits();
    }
    
    // Check if dark mode preference exists in localStorage
    const savedDarkMode = localStorage.getItem('socbuddy-dark-mode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, [session]);
  
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

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Are you sure you want to delete this habit? All tracking data will be lost.')) {
      return;
    }
    
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
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Error deleting habit');
    }
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setHabitForm({
      name: habit.name,
      description: habit.description || '',
      icon: habit.icon,
      color: habit.color,
      frequency: habit.frequency,
      targetDaysPerWeek: habit.targetDaysPerWeek
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setHabitForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateHabit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/habits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: editingHabit._id,
          ...habitForm
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update habit');
      }
      
      toast.success('Habit updated successfully');
      setEditingHabit(null);
      loadHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error(error.message || 'Error updating habit');
    }
  };

  const closeEditForm = () => {
    setEditingHabit(null);
  };

  const calculateCompletionRate = (habit) => {
    if (!habit.streakData || habit.streakData.length === 0) return 0;
    
    const completedEntries = habit.streakData.filter(entry => entry.completed).length;
    return Math.round((completedEntries / habit.streakData.length) * 100);
  };

  // Helper to get a date 30 days ago
  const getThirtyDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const getCompletionRateLast30Days = (habit) => {
    if (!habit.streakData || habit.streakData.length === 0) return 0;
    
    const thirtyDaysAgo = getThirtyDaysAgo();
    const recentEntries = habit.streakData.filter(entry => entry.date >= thirtyDaysAgo);
    
    if (recentEntries.length === 0) return 0;
    
    const completedEntries = recentEntries.filter(entry => entry.completed).length;
    return Math.round((completedEntries / recentEntries.length) * 100);
  };

  // Helper to format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (status === 'loading') {
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
        <p className={`mb-6 text-center ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Please sign in to access the Habit Manager.</p>
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
    <div className={`min-h-screen ${darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-800'}`}>
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
      <header className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : ''}`}>Habit Manager</h1>
            <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>{formattedDate}</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Link
              href="/habit-tracker"
              className={`${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-600'} text-sm font-medium flex items-center`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Tracker
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-6 mb-6`}>
          <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : ''}`}>Your Habits</h2>
          
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
            </div>
          ) : (
            <>
              {habits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {habits.map(habit => (
                    <div
                      key={habit._id}
                      className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-white border-gray-200'} rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow`}
                    >
                      <div className="p-4 border-b border-gray-200" style={{ backgroundColor: `${habit.color}15` }}>
                        <div className="flex items-center mb-2">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: habit.color }}>
                            <span className="text-white">{habit.icon}</span>
                          </div>
                          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : ''}`}>{habit.name}</h3>
                        </div>
                        {habit.description && (
                          <p className={`${darkMode ? 'text-[#bbb]' : 'text-gray-600'} text-sm mb-2`}>{habit.description}</p>
                        )}
                        <div className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                          Frequency: <span className="font-medium">{habit.frequency}</span>
                          {habit.frequency === 'weekly' && (
                            <span> ({habit.targetDaysPerWeek} days/week)</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className={`text-center p-2 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'} rounded-lg`}>
                            <p className={`text-xs ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>Current Streak</p>
                            <p className={`text-xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-500'}`}>{habit.currentStreak || 0} days</p>
                          </div>
                          <div className={`text-center p-2 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'} rounded-lg`}>
                            <p className={`text-xs ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>Completion Rate</p>
                            <p className={`text-xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-500'}`}>{calculateCompletionRate(habit)}%</p>
                          </div>
                        </div>
                        
                        <div className={`flex flex-col space-y-1 text-sm ${darkMode ? 'text-[#888]' : 'text-gray-500'} mb-4`}>
                          <div className="flex justify-between">
                            <span>Started:</span>
                            <span className="font-medium">{formatDate(habit.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Best Streak:</span>
                            <span className="font-medium">{habit.longestStreak || 0} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Completions:</span>
                            <span className="font-medium">{habit.streakData?.filter(d => d.completed).length || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditHabit(habit)}
                            className={`flex-1 ${darkMode ? 'bg-[#444] text-[#bbb] hover:bg-[#555]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-3 py-1 rounded text-sm transition-colors`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHabit(habit._id)}
                            className={`flex-1 ${darkMode ? 'bg-[rgba(239,68,68,0.2)] text-[#f97171] hover:bg-[rgba(239,68,68,0.3)]' : 'bg-red-50 text-red-500 hover:bg-red-100'} px-3 py-1 rounded text-sm transition-colors`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} mb-4`}>You haven't created any habits yet.</p>
                  <Link
                    href="/habit-tracker"
                    className={`${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} px-4 py-2 rounded-lg inline-block transition-all duration-300`}
                  >
                    Create Your First Habit
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Edit Habit Modal */}
        {editingHabit && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} w-full max-w-md rounded-lg overflow-hidden border shadow-xl`}>
              <div className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} px-6 py-4 border-b flex justify-between items-center`}>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : ''}`}>Edit Habit</h3>
                <button 
                  onClick={closeEditForm}
                  className={`${darkMode ? 'text-[#bbb] hover:text-white' : 'text-gray-400 hover:text-gray-500'}`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateHabit} className={`p-6 ${darkMode ? 'text-white' : ''}`}>
                <div className="mb-4">
                  <label className={`block mb-1 text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={habitForm.name}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode 
                        ? 'bg-[#333] border-[#444] text-white focus:border-[rgba(9,203,177,0.5)]'
                        : 'border-gray-300 focus:border-purple-500'
                    } border focus:ring-2 focus:ring-opacity-50 ${
                      darkMode 
                        ? 'focus:ring-[rgba(9,203,177,0.2)]'
                        : 'focus:ring-purple-200'
                    }`}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className={`block mb-1 text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Description (Optional)</label>
                  <textarea
                    name="description"
                    value={habitForm.description}
                    onChange={handleFormChange}
                    rows={2}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode 
                        ? 'bg-[#333] border-[#444] text-white focus:border-[rgba(9,203,177,0.5)]'
                        : 'border-gray-300 focus:border-purple-500'
                    } border focus:ring-2 focus:ring-opacity-50 ${
                      darkMode 
                        ? 'focus:ring-[rgba(9,203,177,0.2)]'
                        : 'focus:ring-purple-200'
                    }`}
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <label className={`block mb-1 text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`flex items-center justify-center p-2 rounded-lg text-xl ${
                          habitForm.icon === icon
                            ? darkMode 
                              ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] border border-[rgba(9,203,177,0.5)]'
                              : 'bg-purple-100 text-purple-600 border border-purple-300'
                            : darkMode
                              ? 'bg-[#333] hover:bg-[#444] text-white border border-transparent'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-transparent'
                        }`}
                        onClick={() => setHabitForm(prev => ({ ...prev, icon }))}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className={`block mb-1 text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Color</label>
                  <div className="grid grid-cols-8 gap-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 rounded-lg ${
                          habitForm.color === color
                            ? darkMode ? 'ring-2 ring-white' : 'ring-2 ring-gray-600'
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setHabitForm(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className={`block mb-1 text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Frequency</label>
                  <select
                    name="frequency"
                    value={habitForm.frequency}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode 
                        ? 'bg-[#333] border-[#444] text-white focus:border-[rgba(9,203,177,0.5)]'
                        : 'border-gray-300 focus:border-purple-500'
                    } border focus:ring-2 focus:ring-opacity-50 ${
                      darkMode 
                        ? 'focus:ring-[rgba(9,203,177,0.2)]'
                        : 'focus:ring-purple-200'
                    }`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                
                {habitForm.frequency === 'weekly' && (
                  <div className="mb-4">
                    <label className={`block mb-1 text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Target Days Per Week</label>
                    <input
                      type="number"
                      name="targetDaysPerWeek"
                      min="1"
                      max="7"
                      value={habitForm.targetDaysPerWeek}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2 rounded-md ${
                        darkMode 
                          ? 'bg-[#333] border-[#444] text-white focus:border-[rgba(9,203,177,0.5)]'
                          : 'border-gray-300 focus:border-purple-500'
                      } border focus:ring-2 focus:ring-opacity-50 ${
                        darkMode 
                          ? 'focus:ring-[rgba(9,203,177,0.2)]'
                          : 'focus:ring-purple-200'
                      }`}
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      darkMode 
                        ? 'bg-[#333] text-[#bbb] hover:bg-[#444]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      darkMode 
                        ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border-t py-4 px-6 text-center ${darkMode ? 'text-[#888]' : 'text-gray-500'} text-sm`}>
        Daily Horizon - Build better habits, one day at a time
      </footer>
    </div>
  );
} 