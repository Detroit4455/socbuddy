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
  const [view, setView] = useState('create'); // create, invitations
  // Owner 'Add Participants' UI state
  const [addHabitId, setAddHabitId] = useState(null);
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [addUserSuggestions, setAddUserSuggestions] = useState([]);
  const [addSelectedUsers, setAddSelectedUsers] = useState([]);
  // Active tab participants cache
  const [activeParticipants, setActiveParticipants] = useState({});
  const [activeLoading, setActiveLoading] = useState({});
  // Add these new state variables at the top with other state declarations
  const [expandedMarathons, setExpandedMarathons] = useState({});
  const [participantDetails, setParticipantDetails] = useState({});
  // Add this state to store details of selected users not in search results
  const [addSelectedUserDetails, setAddSelectedUserDetails] = useState({});
  // Replace single Add Participants UI state with per-marathon state
  const [expandedAdd, setExpandedAdd] = useState({}); // { [marathonKey]: true/false }
  const [addUIState, setAddUIState] = useState({}); // { [marathonKey]: { searchTerm, userSuggestions, selectedUsers, selectedUserDetails } }

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
      
      const data = await response.json();
      toast.success(`Invitation ${status} successfully!`);
      if (data.newHabitCreated && data.newHabitName) {
        toast.success(`New Habit > ${data.newHabitName} > is added to your account`);
      }
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
      // Instead of loading progress and showing it in the same page,
      // redirect to the chart view directly
      router.push(`/habit-marathon/chart?habitId=${habitId}&marathonId=${marathonId}`);
    } catch (error) {
      console.error('Error loading marathon progress:', error);
      toast.error(error.message || 'Error loading marathon progress');
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

  // Helper to get marathon key
  const getMarathonKey = (habitId, marathonId) => `${habitId}_${marathonId}`;

  // Handler to expand/collapse Add Participants for a marathon
  const handleExpandAdd = (habitId, marathonId) => {
    const key = getMarathonKey(habitId, marathonId);
    setExpandedAdd(prev => ({ ...prev, [key]: !prev[key] }));
    // Initialize state if not present
    setAddUIState(prev => ({
      ...prev,
      [key]: prev[key] || { searchTerm: '', userSuggestions: [], selectedUsers: [], selectedUserDetails: {} }
    }));
  };

  // Handler for search input change
  const handleAddSearchChange = (e, habitId, marathonId) => {
    const key = getMarathonKey(habitId, marathonId);
    const q = e.target.value;
    setAddUIState(prev => ({
      ...prev,
      [key]: { ...prev[key], searchTerm: q }
    }));
    searchAddUsers(q, habitId, marathonId);
  };

  // Search users for a specific marathon
  const searchAddUsers = async (query, habitId, marathonId) => {
    const key = getMarathonKey(habitId, marathonId);
    if (!query || query.length < 2) {
      setAddUIState(prev => ({
        ...prev,
        [key]: { ...prev[key], userSuggestions: [] }
      }));
      return;
    }
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search users');
      const data = await res.json();
      setAddUIState(prev => ({
        ...prev,
        [key]: { ...prev[key], userSuggestions: data }
      }));
    } catch (err) {
      toast.error('Error searching users');
    }
  };

  // Handler to select/deselect a user for a specific marathon
  const handleAddUserSelect = (userId, habitId, marathonId) => {
    const key = getMarathonKey(habitId, marathonId);
    setAddUIState(prev => {
      const selected = prev[key]?.selectedUsers || [];
      const newSelected = selected.includes(userId)
        ? selected.filter(id => id !== userId)
        : [...selected, userId];
      return {
        ...prev,
        [key]: { ...prev[key], selectedUsers: newSelected }
      };
    });
  };

  // Fetch user details for selected users not in suggestions (per marathon)
  useEffect(() => {
    Object.entries(addUIState).forEach(([key, state]) => {
      const missingIds = (state.selectedUsers || []).filter(
        id => !(state.userSuggestions || []).some(u => u.id === id) && !state.selectedUserDetails?.[id]
      );
      if (missingIds.length > 0) {
        fetch(`/api/users?ids=${missingIds.join(',')}`)
          .then(res => res.json())
          .then(data => {
            const details = {};
            data.forEach(u => { details[u.id] = u; });
            setAddUIState(prev => ({
              ...prev,
              [key]: {
                ...prev[key],
                selectedUserDetails: { ...prev[key].selectedUserDetails, ...details }
              }
            }));
          })
          .catch(console.error);
      }
    });
  }, [addUIState]);

  // Invite additional users for a specific marathon
  const inviteAdditionalUsers = async (habitId, marathonId) => {
    const key = getMarathonKey(habitId, marathonId);
    const selectedUsers = addUIState[key]?.selectedUsers || [];
    if (!habitId || selectedUsers.length === 0) {
      toast.error('Select at least one user');
      return;
    }
    try {
      const res = await fetch('/api/habits/marathon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, marathonId, userIds: selectedUsers }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.duplicateUsers || data.previouslyRejectedUsers) {
          let message = 'Some invitations could not be sent: ';
          if (data.duplicateUsers?.length > 0) {
            message += `\n- Users already invited: ${data.duplicateUsers.join(', ')}`;
          }
          if (data.previouslyRejectedUsers?.length > 0) {
            message += `\n- Users previously rejected: ${data.previouslyRejectedUsers.join(', ')}`;
          }
          toast.error(message);
        } else {
          throw new Error(data.error || 'Failed to invite');
        }
      } else {
        const data = await res.json();
        if (data.duplicateUsers?.length > 0 || data.previouslyRejectedUsers?.length > 0) {
          toast.success(data.message || 'Invitations sent with some warnings');
        } else {
          toast.success('Participants invited successfully');
        }
      }
      // reset form for this marathon
      setAddUIState(prev => ({
        ...prev,
        [key]: { searchTerm: '', userSuggestions: [], selectedUsers: [], selectedUserDetails: {} }
      }));
      loadInvitations();
    } catch (err) {
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

  // Add this new function for leaving a marathon
  const handleLeaveMarathon = async (habitId, marathonId) => {
    if (!confirm('Are you sure you want to leave this marathon?')) return;
    try {
      const res = await fetch(`/api/habits/marathon?habitId=${habitId}&marathonId=${marathonId}&leave=true`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to leave marathon');
      }
      const data = await res.json();
      toast.success(data.message || 'Successfully left the marathon');
      // Refresh invitations to remove the marathon from active list
      loadInvitations();
    } catch (error) {
      console.error('Error leaving marathon:', error);
      toast.error(error.message || 'Error leaving marathon');
    }
  };

  // Add this new function to fetch participant details
  const fetchParticipantDetails = async (habitId, marathonId) => {
    try {
      const res = await fetch(`/api/habits/marathon/participants?habitId=${habitId}&marathonId=${marathonId}`);
      if (!res.ok) throw new Error('Failed to fetch participant details');
      const data = await res.json();
      setParticipantDetails(prev => ({
        ...prev,
        [`${habitId}_${marathonId}`]: data.participants
      }));
    } catch (err) {
      console.error('Error fetching participant details:', err);
      toast.error('Failed to load participant details');
    }
  };

  // Add this new function to handle expand/collapse
  const toggleParticipantList = async (habitId, marathonId) => {
    const key = `${habitId}_${marathonId}`;
    setExpandedMarathons(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    // Fetch participant details if not already loaded
    if (!participantDetails[key]) {
      await fetchParticipantDetails(habitId, marathonId);
    }
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
      <header className={`px-4 py-3 shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-b border-[#333]' : 'bg-white border-b border-gray-200'}`}>
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Habit Marathon</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">
                Hello, {session?.user?.username}
              </span>
              {/* Mobile Chart button */}
              {invitations.find(inv => inv.status === 'accepted' || inv.status === 'owner') && (
                <Link 
                  href={`/habit-marathon/chart?marathonId=${invitations.find(inv => inv.status === 'accepted' || inv.status === 'owner').marathonId}`}
                  className="sm:hidden px-2 py-1 text-xs font-medium rounded-md bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1"
                >
                  <span className="inline-block animate-bounce">🏃‍➡️</span>
                  Chart
                </Link>
              )}
              {/* Desktop Chart button */}
              {invitations.find(inv => inv.status === 'accepted' || inv.status === 'owner') && (
                <Link 
                  href={`/habit-marathon/chart?marathonId=${invitations.find(inv => inv.status === 'accepted' || inv.status === 'owner').marathonId}`}
                  className={`hidden sm:block px-3 py-1 text-sm font-medium rounded-full ${
                    darkMode 
                      ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  } transition-colors`}
                >
                  View Chart
                </Link>
              )}
              <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              <Link href="/habit-tracker" className={`${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-800 hover:text-gray-600'} transition-colors`}>
                <HomeIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
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
        </div>
        
        {view === 'active' && (
          <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-4 sm:p-6 mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : ''}`}>Active Marathons</h2>
            {invitations.filter(inv => inv.status === 'accepted').length === 0 && invitations.filter(inv => inv.isOwner).length === 0 ? (
              <p className={`text-center py-6 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>No active marathons.</p>
            ) : (
              <div className="space-y-4">
                {/* Your Created Marathons */}
                {invitations.filter(inv => inv.isOwner).length > 0 && (
                  <>
                    <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : ''}`}>Your Created Marathons</h3>
                    {invitations
                      .filter(inv => inv.isOwner)
                      .map(invitation => {
                        const { pending: pendingCount = 0, accepted: acceptedCount = 0, rejected: rejectedCount = 0 } = invitation.marathonStats || {};
                        const key = `${invitation.habitId}_${invitation.marathonId}`;
                        const isExpanded = expandedMarathons[key];
                        const participants = participantDetails[key] || [];
                        
                        return (
                          <div 
                            key={invitation.habitId + '_' + invitation.marathonId}
                            className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                              <div className="flex-1">
                                <h4 className={`text-md font-medium ${darkMode ? 'text-white' : ''}`}>{invitation.name}</h4>
                                {invitation.groupName && (
                                  <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Group: {invitation.groupName}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <p className={`text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>
                                    Participants: {acceptedCount} accepted, {pendingCount} pending, {rejectedCount} rejected
                                  </p>
                                  <button
                                    onClick={() => toggleParticipantList(invitation.habitId, invitation.marathonId)}
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      darkMode 
                                        ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                    }`}
                                  >
                                    {isExpanded ? 'Hide Details' : 'Show Details'}
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2">
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
                                <button
                                  onClick={() => handleDeleteMarathon(invitation.habitId, invitation.marathonId)}
                                  className={`px-3 py-1 rounded-md text-sm ${
                                    darkMode 
                                      ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                                  }`}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            
                            {/* Participant Details */}
                            {isExpanded && (
                              <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-[#444]' : 'border-gray-200'}`}>
                                <div className="space-y-2">
                                  {participants.length > 0 ? (
                                    participants.map(participant => (
                                      <div 
                                        key={participant.userId}
                                        className={`flex items-center justify-between p-2 rounded-md ${
                                          darkMode ? 'bg-[#2a2a2a]' : 'bg-white'
                                        }`}
                                      >
                                        <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                          {participant.username}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          participant.status === 'accepted' 
                                            ? darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'
                                            : participant.status === 'rejected'
                                              ? darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                                              : darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
                                        }`}>
                                          {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className={`text-sm text-center ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                                      Loading participant details...
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </>
                )}

                {/* Accepted Marathons */}
                {invitations.filter(inv => inv.status === 'accepted').length > 0 && (
                  <>
                    <h3 className={`text-lg font-medium mt-6 mb-3 ${darkMode ? 'text-white' : ''}`}>Marathons You've Joined</h3>
                    {invitations
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
                            <div className="flex gap-2">
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
                              <button
                                onClick={() => handleLeaveMarathon(invitation.habitId, invitation.marathonId)}
                                className={`px-3 py-1 rounded-md text-sm ${
                                  darkMode 
                                    ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                              >
                                Leave Marathon
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </>
                )}
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
                                onClick={() => handleExpandAdd(invitation.habitId, invitation.marathonId)}
                                className={`px-3 py-1 rounded-md text-sm ${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                              >
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
                          {expandedAdd[getMarathonKey(invitation.habitId, invitation.marathonId)] && (
                            <div className={`${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'} border ${darkMode ? 'border-[#444]' : 'border-gray-200'} rounded-lg p-4 mt-4`}>
                              <input
                                type="text"
                                value={addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.searchTerm || ''}
                                onChange={e => handleAddSearchChange(e, invitation.habitId, invitation.marathonId)}
                                placeholder="Search users to invite"
                                className={`w-full px-3 py-2 rounded-md ${darkMode ? 'bg-[#333] border-[#444] text-white' : 'bg-white border-gray-300'}`}
                              />
                              {(addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.userSuggestions.length > 0) && (
                                <div className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-white border-gray-200'} border rounded-md mt-2 max-h-40 overflow-y-auto`}>
                                  {addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.userSuggestions.map(u => (
                                    <div
                                      key={u.id}
                                      className={`flex items-center px-3 py-2 cursor-pointer ${addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.selectedUsers.includes(u.id) ? (darkMode ? 'bg-[rgba(9,203,177,0.2)]' : 'bg-green-50') : ''}`}
                                      onClick={() => handleAddUserSelect(u.id, invitation.habitId, invitation.marathonId)}>
                                      <input type="checkbox" checked={addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.selectedUsers.includes(u.id)} readOnly className="mr-2" />
                                      <span>{u.username}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {(addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.selectedUsers.length > 0) && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.selectedUsers.map(id => {
                                    const user = (addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.userSuggestions || []).find(u => u.id === id) || (addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.selectedUserDetails || {})[id];
                                    return user ? (
                                      <div
                                        key={id}
                                        className={`flex items-center px-2 py-1 rounded-md text-sm ${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]' : 'bg-purple-100 text-purple-600'}`}
                                      >
                                        {user.username}
                                        <button
                                          onClick={() => handleAddUserSelect(id, invitation.habitId, invitation.marathonId)}
                                          className="ml-2 text-xs p-1"
                                          aria-label="Remove user"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              )}
                              <div className="mt-3">
                                <button
                                  onClick={() => inviteAdditionalUsers(invitation.habitId, invitation.marathonId)}
                                  disabled={!(addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.selectedUsers.length > 0)}
                                  className={`px-4 py-2 rounded-md text-sm font-medium ${!(addUIState[getMarathonKey(invitation.habitId, invitation.marathonId)]?.selectedUsers.length > 0) ? 'opacity-50 cursor-not-allowed' : (darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' : 'bg-green-600 text-white hover:bg-green-700')}`}
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
      </main>
      
      {/* Footer */}
      <footer className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} border-t py-4 px-4 text-center ${darkMode ? 'text-[#888]' : 'text-gray-500'} text-xs sm:text-sm`}>
        Daily Horizon - Build better habits together
      </footer>
    </div>
  );
} 