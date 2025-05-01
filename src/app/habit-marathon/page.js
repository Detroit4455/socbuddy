'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { HomeIcon } from '@heroicons/react/solid';

export default function HabitMarathon() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [habits, setHabits] = useState([]);
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('create'); // create, invitations, progress
  const [marathonProgress, setMarathonProgress] = useState(null);
  const [selectedMarathon, setSelectedMarathon] = useState(null);
  const [selectedMarathonId, setSelectedMarathonId] = useState(null);
  const [showTopUsers, setShowTopUsers] = useState(false);
  const [topUsers, setTopUsers] = useState([]);
  // Owner 'Add Participants' UI state
  const [addHabitId, setAddHabitId] = useState(null);
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [addUserSuggestions, setAddUserSuggestions] = useState([]);
  const [addSelectedUsers, setAddSelectedUsers] = useState([]);
  // Active tab participants cache
  const [activeParticipants, setActiveParticipants] = useState({});
  const [activeLoading, setActiveLoading] = useState({});

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
    setIsProfileOpen(false);
  };

  useEffect(() => {
    if (session?.user) {
      loadHabits();
      loadInvitations();
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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/habits/marathon');
      if (!response.ok) {
        throw new Error('Failed to fetch marathon invitations');
      }
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error('Error loading marathon invitations:', error);
      toast.error('Error loading invitations');
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Error searching users');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    searchUsers(query);
  };

  const handleHabitChange = (e) => {
    const habitId = e.target.value;
    setSelectedHabit(habitId);
    setSelectedUsers([]);
  };

  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      // Remove user
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      // Add user
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const createMarathon = async () => {
    if (!selectedHabit || selectedUsers.length === 0) {
      toast.error('Please select a habit and at least one user');
      return;
    }
    
    try {
      const response = await fetch('/api/habits/marathon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId: selectedHabit,
          userIds: selectedUsers,
          groupName
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create marathon');
      }
      
      toast.success('Marathon invitations sent successfully!');
      setSelectedHabit(null);
      setSelectedUsers([]);
      setSearchTerm('');
      setUsers([]);
      setGroupName('');
      // Refresh invitations list so new marathon appears
      loadInvitations();
    } catch (error) {
      console.error('Error creating marathon:', error);
      toast.error(error.message || 'Error creating marathon');
    }
  };

  const handleInvitationResponse = async (habitId, marathonId, status) => {
    try {
      const response = await fetch('/api/habits/marathon', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId,
          marathonId,
          status
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${status} invitation`);
      }
      
      toast.success(`Invitation ${status} successfully!`);
      loadInvitations(); // Reload invitations
    } catch (error) {
      console.error(`Error ${status} invitation:`, error);
      toast.error(error.message || `Error ${status} invitation`);
    }
  };

  // Delete the entire marathon (only for owners)
  const handleDeleteMarathon = async (habitId, marathonId) => {
    if (!confirm('Are you sure you want to delete this marathon?')) return;
    try {
      const res = await fetch(`/api/habits/marathon?habitId=${habitId}&marathonId=${marathonId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete marathon');
      }
      const data = await res.json();
      toast.success(data.message || 'Marathon deleted');
      // Refresh invitations to remove deleted marathon
      loadInvitations();
    } catch (error) {
      console.error('Error deleting marathon:', error);
      toast.error(error.message || 'Error deleting marathon');
    }
  };

  const loadMarathonProgress = async (habitId, marathonId) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/habits/marathon/progress?habitId=${habitId}&marathonId=${marathonId}`
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load marathon progress');
      }
      
      const data = await response.json();
      setMarathonProgress(data);
      setSelectedMarathon(habitId);
      setSelectedMarathonId(marathonId);
      setView('progress');
      
      // Reset top users when loading new marathon progress
      setShowTopUsers(false);
      setTopUsers([]);
    } catch (error) {
      console.error('Error loading marathon progress:', error);
      toast.error(error.message || 'Error loading marathon progress');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopUsers = async () => {
    try {
      if (!selectedMarathon || !selectedMarathonId || !marathonProgress) return;
      
      setIsLoading(true);
      const response = await fetch(`/api/habits/marathon/top-users?habitId=${selectedMarathon}&marathonId=${selectedMarathonId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load top users');
      }
      
      const data = await response.json();
      setTopUsers(data.topUsers);
    } catch (error) {
      console.error('Error loading top users:', error);
      toast.error('Error loading top users');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleTopUsers = () => {
    if (!showTopUsers && topUsers.length === 0) {
      loadTopUsers();
    }
    setShowTopUsers(!showTopUsers);
  };

  const searchAddUsers = async (query) => {
    if (!query || query.length < 2) {
      setAddUserSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search users');
      const data = await res.json();
      setAddUserSuggestions(data);
    } catch (err) {
      console.error('Error searching users for add:', err);
      toast.error('Error searching users');
    }
  };

  const handleAddSearchChange = (e) => {
    const q = e.target.value;
    setAddSearchTerm(q);
    searchAddUsers(q);
  };

  const handleAddUserSelect = (userId) => {
    setAddSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const inviteAdditionalUsers = async (habitId, marathonId) => {
    if (!habitId || addSelectedUsers.length === 0) {
      toast.error('Select at least one user');
      return;
    }
    try {
      const res = await fetch('/api/habits/marathon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, marathonId, userIds: addSelectedUsers }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to invite');
      }
      toast.success('Participants invited successfully');
      // reset form
      setAddHabitId(null);
      setAddSearchTerm(''); setAddUserSuggestions([]); setAddSelectedUsers([]);
      loadInvitations();
    } catch (err) {
      console.error('Error inviting users:', err);
      toast.error(err.message || 'Error inviting users');
    }
  };

  // When switching to active view, fetch participant lists
  useEffect(() => {
    if (view === 'active' && invitations.length) {
      invitations.filter(inv => inv.status === 'accepted').forEach(inv => {
        const id = inv.habitId;
        if (!activeParticipants[id]) {
          setActiveLoading(prev => ({ ...prev, [id]: true }));
          fetch(`/api/habits/marathon/progress?habitId=${id}`)
            .then(res => res.json())
            .then(data => {
              setActiveParticipants(prev => ({ ...prev, [id]: data.participants }));
            })
            .catch(console.error)
            .finally(() => {
              setActiveLoading(prev => ({ ...prev, [id]: false }));
            });
        }
      });
    }
  }, [view, invitations]);

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
        <p className={`mb-6 text-center ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Please sign in to access the Habit Marathon feature.</p>
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
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : ''}`}>Habit Marathon</h1>
            <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>{formattedDate}</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(prev => !prev)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md ${darkMode ? 'hover:bg-[#444]' : 'hover:bg-gray-100'}`}
              >
                <span className={`${darkMode ? 'text-white' : 'text-gray-800'}`}>{session.user.username}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`${darkMode ? 'text-white h-4 w-4' : 'text-gray-600 h-4 w-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isProfileOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded shadow-lg z-50 ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'}`}>  
                  <Link href="/profile" className={`block px-4 py-2 text-sm ${darkMode ? 'text-[#e0e0e0] hover:bg-[#444]' : 'text-gray-800 hover:bg-gray-100'}`}>Profile</Link>
                  <button onClick={handleSignOut} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-[#e0e0e0] hover:bg-[#444]' : 'text-gray-800 hover:bg-gray-100'}`}>Sign Out</button>
                </div>
              )}
            </div>
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Link
              href="/habit-tracker"
              className={`${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-600'} text-sm font-medium flex items-center`}
            >
              <HomeIcon className="h-4 w-4 mr-1" />
              Home
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setView('active');
              loadInvitations();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'active'
                ? darkMode 
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' 
                  : 'bg-purple-100 text-purple-600'
                : darkMode
                  ? 'text-[#bbb] hover:bg-[#333]'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active Marathons
          </button>
          <button 
            onClick={() => setView('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'create' 
                ? darkMode 
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' 
                  : 'bg-purple-100 text-purple-600'
                : darkMode
                  ? 'text-[#bbb] hover:bg-[#333]'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Create Marathon
          </button>
          <button 
            onClick={() => {
              setView('invitations');
              loadInvitations();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'invitations' 
                ? darkMode 
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' 
                  : 'bg-purple-100 text-purple-600'
                : darkMode
                  ? 'text-[#bbb] hover:bg-[#333]'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Invitations 
            {invitations.filter(inv => inv.status === 'pending').length > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                darkMode ? 'bg-[rgba(9,203,177,0.823)] text-black' : 'bg-purple-500 text-white'
              }`}>
                {invitations.filter(inv => inv.status === 'pending').length}
              </span>
            )}
          </button>
          {marathonProgress && (
            <button 
              onClick={() => setView('progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                view === 'progress' 
                  ? darkMode 
                    ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' 
                    : 'bg-purple-100 text-purple-600'
                  : darkMode
                    ? 'text-[#bbb] hover:bg-[#333]'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Marathon Progress
            </button>
          )}
        </div>
        
        {view === 'active' && (
          <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-4 sm:p-6 mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : ''}`}>Active Marathons</h2>
            {invitations.filter(inv => inv.status === 'accepted').length === 0 ? (
              <p className={`text-center py-6 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>No active marathons.</p>
            ) : (
              <div className="space-y-4">
                {invitations.filter(inv => inv.status === 'accepted').map(inv => (
                  <div key={inv.habitId} className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}> 
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className={`text-md font-medium ${darkMode ? 'text-white' : ''}`}>{inv.name}</h4>
                        <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Owner: {inv.ownerName}</p>
                      </div>
                      <button
                        onClick={() => loadMarathonProgress(inv.habitId, inv.marathonId)}
                        className={`px-3 py-1 rounded-md text-sm ${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
                        View Progress
                      </button>
                    </div>
                    <div className="mt-2">
                      {activeLoading[inv.habitId] ? (
                        <span className="text-sm text-gray-500">Loading participants…</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {activeParticipants[inv.habitId]?.map(p => (
                            <span key={p.userId} className={`px-2 py-1 rounded-full text-sm ${darkMode ? 'bg-[#444] text-white' : 'bg-gray-200 text-gray-800'}`}>{p.username}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {view === 'create' && (
          <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-4 sm:p-6 mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 sm:mb-6 ${darkMode ? 'text-white' : ''}`}>Create Habit Marathon</h2>
            
            <div className="mb-5">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-700'}`}>
                Select a habit
              </label>
              <select
                value={selectedHabit || ''}
                onChange={handleHabitChange}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode 
                    ? 'bg-[#333] border-[#444] text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select a habit</option>
                {habits.map(habit => (
                  <option key={habit._id} value={habit._id}>
                    {habit.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedHabit && (
              <>
                <div className="mb-5">
                  <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-700'}`}>
                    Invite users to join
                  </label>
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search for users"
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode 
                        ? 'bg-[#333] border-[#444] text-white placeholder-[#777]' 
                        : 'bg-white border-gray-300 placeholder-gray-400'
                    }`}
                  />
                  
                  {users.length > 0 && (
                    <div className={`mt-2 ${darkMode ? 'bg-[#333] border-[#444]' : 'bg-white border-gray-200'} border rounded-md max-h-40 sm:max-h-60 overflow-y-auto`}>
                      {users.map(user => (
                        <div 
                          key={user.id}
                          className={`flex items-center px-3 py-2 cursor-pointer ${
                            darkMode 
                              ? selectedUsers.includes(user.id) ? 'bg-[rgba(9,203,177,0.2)]' : 'hover:bg-[#444]'
                              : selectedUsers.includes(user.id) ? 'bg-purple-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleUserSelect(user.id)}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {}}
                            className={`mr-3 ${darkMode ? 'accent-[rgba(9,203,177,0.823)]' : 'accent-purple-500'}`}
                          />
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{user.username}</p>
                            <p className={`text-xs ${darkMode ? 'text-[#999]' : 'text-gray-500'}`}>{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedUsers.length > 0 && (
                  <div className="mb-5">
                    <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-700'}`}>
                      Selected users ({selectedUsers.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(userId => {
                        const user = users.find(u => u.id === userId);
                        return user ? (
                          <div 
                            key={userId}
                            className={`flex items-center px-2 py-1 rounded-md text-sm ${
                              darkMode 
                                ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]'
                                : 'bg-purple-100 text-purple-600'
                            }`}
                          >
                            {user.username}
                            <button
                              onClick={() => handleUserSelect(userId)}
                              className="ml-2 text-xs p-1"
                              aria-label="Remove user"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                {selectedHabit && (
                  <div className="mb-5">
                    <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-700'}`}>
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className={`w-full px-3 py-2 rounded-md ${darkMode ? 'bg-[#333] border-[#444] text-white placeholder-[#777]' : 'bg-white border-gray-300 placeholder-gray-400'}`}
                    />
                  </div>
                )}
                
                <button
                  onClick={createMarathon}
                  disabled={!selectedHabit || selectedUsers.length === 0}
                  className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium ${
                    !selectedHabit || selectedUsers.length === 0
                      ? darkMode 
                        ? 'bg-[#333] text-[#777] cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : darkMode 
                        ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Start Marathon
                </button>
              </>
            )}
          </div>
        )}
        
        {view === 'invitations' && (
          <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-4 sm:p-6 mb-6`}>
            <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : ''}`}>Marathon Invitations</h2>
            
            {invitations.length === 0 ? (
              <p className={`text-center py-6 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                No marathon invitations found.
              </p>
            ) : (
              <div className="space-y-4">
                <h3 className={`text-lg font-medium mt-6 mb-3 ${darkMode ? 'text-white' : ''}`}>Pending Invitations</h3>
                {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
                  <p className={`text-center py-3 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                    No pending invitations.
                  </p>
                ) : (
                  invitations
                    .filter(inv => inv.status === 'pending')
                    .map(invitation => (
                      <div 
                        key={invitation.habitId}
                        className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                          <div>
                            <h4 className={`text-md font-medium ${darkMode ? 'text-white' : ''}`}>{invitation.name}</h4>
                            {invitation.groupName && (
                              <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Group: {invitation.groupName}</p>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>
                              Invited by: {invitation.ownerName}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleInvitationResponse(invitation.habitId, invitation.marathonId, 'accepted')}
                              className={`px-3 py-1 rounded-md text-sm ${
                                darkMode 
                                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleInvitationResponse(invitation.habitId, invitation.marathonId, 'rejected')}
                              className={`px-3 py-1 rounded-md text-sm ${
                                darkMode 
                                  ? 'bg-[rgba(239,68,68,0.2)] text-[#f97171] hover:bg-[rgba(239,68,68,0.3)]'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
                
                <h3 className={`text-lg font-medium mt-6 mb-3 ${darkMode ? 'text-white' : ''}`}>Active Marathons</h3>
                {invitations.filter(inv => inv.status === 'accepted').length === 0 ? (
                  <p className={`text-center py-3 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                    No active marathons.
                  </p>
                ) : (
                  invitations
                    .filter(inv => inv.status === 'accepted')
                    .map(invitation => (
                      <div 
                        key={invitation.habitId + '_' + invitation.marathonId}
                        className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                          <div>
                            <h4 className={`text-md font-medium ${darkMode ? 'text-white' : ''}`}>{invitation.name}</h4>
                            {invitation.groupName && (
                              <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Group: {invitation.groupName}</p>
                            )}
                            <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>
                              Marathon with: {invitation.ownerName}
                            </p>
                          </div>
                          <button
                            onClick={() => loadMarathonProgress(invitation.habitId, invitation.marathonId)}
                            className={`px-3 py-1 rounded-md text-sm ${
                              darkMode 
                                ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                            }`}
                          >
                            View Progress
                          </button>
                        </div>
                      </div>
                    ))
                )}
                
                <h3 className={`text-lg font-medium mt-6 mb-3 ${darkMode ? 'text-white' : ''}`}>Your Created Marathons</h3>
                {invitations.filter(inv => inv.isOwner).length === 0 ? (
                  <p className={`text-center py-3 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                    You haven't created any marathons yet.
                  </p>
                ) : (
                  invitations
                    .filter(inv => inv.isOwner)
                    .map(invitation => {
                      // Get counts from marathonStats
                      const { pending: pendingCount = 0, accepted: acceptedCount = 0, rejected: rejectedCount = 0 } = invitation.marathonStats || {};
                      
                      return (
                        <div 
                          key={invitation.habitId}
                          className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                            <div>
                              <h4 className={`text-md font-medium ${darkMode ? 'text-white' : ''}`}>{invitation.name}</h4>
                              {invitation.groupName && (
                                <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Group: {invitation.groupName}</p>
                              )}
                              {invitation.participants && invitation.participants.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {invitation.participants.map(p => (
                                    <span key={p.userId} className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#444] text-[#bbb]' : 'bg-gray-100 text-gray-600'}`}>{p.username}</span>
                                  ))}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 mt-1">
                                {pendingCount > 0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    darkMode ? 'bg-[#444] text-[#bbb]' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {pendingCount} pending
                                  </span>
                                )}
                                {acceptedCount > 0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-green-100 text-green-600'
                                  }`}>
                                    {acceptedCount} accepted
                                  </span>
                                )}
                                {rejectedCount > 0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    darkMode ? 'bg-[rgba(239,68,68,0.2)] text-[#f97171]' : 'bg-red-100 text-red-600'
                                  }`}>
                                    {rejectedCount} declined
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                            <button
                                onClick={() => loadMarathonProgress(invitation.habitId, invitation.marathonId)}
                                className={`px-3 py-1 rounded-md text-sm ${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-purple-50 text-purple-600'} hover:${darkMode ? 'bg-[rgba(9,203,177,0.3)]' : 'bg-purple-100'}`}>
                              View Progress
                            </button>
                              <button
                                onClick={() => setAddHabitId(invitation.habitId)}
                                className={`px-3 py-1 rounded-md text-sm ${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                Add Participants
                              </button>
                              <button
                                onClick={() => handleDeleteMarathon(invitation.habitId, invitation.marathonId)}
                                className={`px-3 py-1 rounded-md text-sm ${darkMode ? 'bg-[rgba(239,68,68,0.2)] text-[#f97171] hover:bg-[rgba(239,68,68,0.3)]' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                              >
                                Delete Marathon
                              </button>
                          </div>
                          </div>
                          {/* Add Participants Form */}
                          {addHabitId === invitation.habitId && (
                            <div className={`${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'} border ${darkMode ? 'border-[#444]' : 'border-gray-200'} rounded-lg p-4 mt-4`}>
                              <input
                                type="text"
                                value={addSearchTerm}
                                onChange={handleAddSearchChange}
                                placeholder="Search users to invite"
                                className={`w-full px-3 py-2 rounded-md ${darkMode ? 'bg-[#333] border-[#444] text-white' : 'bg-white border-gray-300'}`}
                              />
                              {addUserSuggestions.length > 0 && (
                                <div className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-white border-gray-200'} border rounded-md mt-2 max-h-40 overflow-y-auto`}>  
                                  {addUserSuggestions.map(u => (
                                    <div
                                      key={u.id}
                                      className={`flex items-center px-3 py-2 cursor-pointer ${addSelectedUsers.includes(u.id) ? (darkMode ? 'bg-[rgba(9,203,177,0.2)]' : 'bg-green-50') : ''}`}
                                      onClick={() => handleAddUserSelect(u.id)}>
                                      <input type="checkbox" checked={addSelectedUsers.includes(u.id)} readOnly className="mr-2" />
                                      <span>{u.username}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {addSelectedUsers.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {addSelectedUsers.map(id => {
                                    const user = addUserSuggestions.find(u => u.id === id);
                                    return user ? (
                                      <span key={id} className={`px-2 py-1 rounded-md text-sm ${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-green-100 text-green-600'}`}>{user.username}</span>
                                    ) : null;
                                  })}
                                </div>
                              )}
                              <div className="mt-3">
                                <button
                                  onClick={() => inviteAdditionalUsers(invitation.habitId, invitation.marathonId)}
                                  disabled={addSelectedUsers.length === 0}
                                  className={`px-4 py-2 rounded-md text-sm font-medium ${addSelectedUsers.length === 0 ? 'opacity-50 cursor-not-allowed' : (darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' : 'bg-green-600 text-white hover:bg-green-700')}`}
                                >Invite</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        )}
        
        {view === 'progress' && marathonProgress && (
          <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-4 sm:p-6 mb-6`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : ''}`}>
                Marathon Progress: {marathonProgress.habitName}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTopUsers}
                  className={`text-sm px-3 py-1 rounded-md ${darkMode 
                      ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  {showTopUsers ? 'Hide Top 3' : 'Show Top 3'}
                </button>
                <button
                  onClick={() => setView('invitations')}
                  className={`text-sm ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-600'}`}
                >
                  Back to Invitations
                </button>
                <Link href={`/habit-marathon/chart?habitId=${marathonProgress.habitId}`}> 
                  <button
                    className={`text-sm px-3 py-1 rounded-md ${darkMode 
                      ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                    }`}
                  >
                    View Chart
                  </button>
                </Link>
              </div>
            </div>
            
            {showTopUsers && (
              <div className={`mb-6 rounded-lg ${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} border p-4`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : ''}`}>Top 3 Users</h3>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ranked by: <span className="font-semibold">Days Completed</span>
                  </div>
                </div>
                
                {isLoading && topUsers.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
                  </div>
                ) : topUsers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {topUsers.map((user, index) => (
                      <div key={user.userId} className={`flex items-center p-4 rounded-lg ${
                        index === 0 
                          ? darkMode ? 'bg-amber-900 bg-opacity-20 border border-amber-700' : 'bg-amber-50 border border-amber-200' 
                          : index === 1 
                            ? darkMode ? 'bg-slate-800 bg-opacity-50 border border-slate-600' : 'bg-slate-100 border border-slate-300'
                            : darkMode ? 'bg-orange-900 bg-opacity-20 border border-orange-700' : 'bg-orange-50 border border-orange-200'
                      }`}>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-3 ${
                          index === 0 
                            ? darkMode ? 'bg-amber-900 bg-opacity-40 text-amber-300' : 'bg-amber-100 text-amber-600'
                            : index === 1
                              ? darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                              : darkMode ? 'bg-orange-900 bg-opacity-40 text-orange-300' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <div className="w-full">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{user.username}</h4>
                            <div className="flex items-center gap-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-purple-100 text-purple-600'
                              }`}>
                                {user.completedDays} days
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                darkMode ? 'bg-[#444] text-white' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {user.completionRate}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                              <div 
                                className="h-1.5 rounded-full" 
                                style={{ 
                                  width: `${user.completionRate}%`,
                                  backgroundColor: darkMode ? 'rgba(9,203,177,0.823)' : '#8b5cf6'
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-4 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                    No top users data available.
                  </p>
                )}
              </div>
            )}
            
            <div className={`overflow-x-auto rounded-lg ${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} border`}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={darkMode ? 'bg-[#222]' : 'bg-gray-100'}>
                  <tr>
                    <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Rank
                    </th>
                    <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      User
                    </th>
                    <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Completed
                    </th>
                    <th scope="col" className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-[#444]' : 'divide-gray-200'}`}>
                  {marathonProgress.participants.map((participant, index) => (
                    <tr key={participant.userId} className={index % 2 === 0 ? (darkMode ? 'bg-[#333]' : 'bg-white') : (darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50')}>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {index + 1}
                      </td>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {participant.username}
                        {participant.userId === session.user.id && (
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-purple-100 text-purple-600'
                          }`}>
                            You
                          </span>
                        )}
                      </td>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {participant.completedDays}/{participant.totalDays}
                      </td>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap`}>
                        <div className="flex items-center">
                          <div className="w-14 sm:w-24 bg-gray-200 rounded-full h-2 mr-2 dark:bg-gray-700">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${participant.completionRate}%`,
                                backgroundColor: darkMode ? 'rgba(9,203,177,0.823)' : '#8b5cf6'
                              }}
                            ></div>
                          </div>
                          <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {participant.completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border-t py-4 px-4 text-center ${darkMode ? 'text-[#888]' : 'text-gray-500'} text-xs sm:text-sm`}>
        Daily Horizon - Build better habits together
      </footer>
    </div>
  );
} 