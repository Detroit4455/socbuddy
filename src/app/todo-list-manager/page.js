'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';

const TodoListManager = () => {
  const { data: session, status } = useSession();
  const isGuest = status === 'unauthenticated';
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ 
    name: '', 
    dueDate: new Date().toISOString().split('T')[0], // Set today's date as default
    owner: isGuest ? 'guest' : '', 
    detail: '', 
    comments: [], 
    expanded: false,
    startDate: new Date().toISOString().split('T')[0], // Add start date
    status: 'Pending' // Changed default status to Pending
  });
  const [editingTask, setEditingTask] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentingTask, setCommentingTask] = useState(null);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('In Progress');
  const [dateFilter, setDateFilter] = useState('all');
  const [popup, setPopup] = useState({ show: false, message: '', type: 'info' });
  const tasksPerPage = 100;
  const [darkMode, setDarkMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showUrls, setShowUrls] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [lastProfileUsed, setLastProfileUsed] = useState('');

  // Update owner field with authenticated username when session is loaded
  useEffect(() => {
    if (session?.user?.username && !newTask.owner) {
      setNewTask(prev => ({
        ...prev,
        owner: session.user.username
      }));
    } else if (isGuest && newTask.owner === '') {
      setNewTask(prev => ({
        ...prev,
        owner: 'guest'
      }));
    }
  }, [session, newTask.owner, isGuest]);

  // Add this to track profile changes
  useEffect(() => {
    if (session?.user?.userProfile) {
      // Only reload if the profile has changed
      if (lastProfileUsed !== session.user.userProfile) {
        console.log(`Profile changed from ${lastProfileUsed} to ${session.user.userProfile}. Reloading tasks.`);
        setLastProfileUsed(session.user.userProfile);
        
        // Reload tasks when profile changes
        const loadTasks = async () => {
          try {
            setLoading(true);
            const response = await fetch(`/api/tasks?profile=${session.user.userProfile}`);
            if (!response.ok) {
              throw new Error('Failed to load tasks after profile change');
            }
            const data = await response.json();
            
            // Ensure each task has required properties
            const tasksWithDefaults = data.map(task => ({
              ...task,
              comments: task.comments || [],
              expanded: false
            }));
            
            setTasks(tasksWithDefaults);
            setFilteredTasks(tasksWithDefaults);
            setLoading(false);
          } catch (error) {
            console.error('Error loading tasks after profile change:', error);
            setLoading(false);
            showPopup('Error loading tasks after profile change.', 'error');
          }
        };
        
        loadTasks();
      }
    }
  }, [session?.user?.userProfile]);

  // Function to show popup
  const showPopup = (message, type = 'info') => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: '', type: 'info' }), 3000);
  };

  // Add Popup Component
  const Popup = ({ message, type }) => (
    <div className={`fixed right-4 top-1/2 transform -translate-y-1/2 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
      popup.show ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
    } ${
      type === 'error' ? 'bg-red-500' : 
      type === 'success' ? 'bg-[rgba(9,203,177,0.15)]' : 'bg-[#2a2a2a]'
    }`}>
      <p className={`text-sm ${type === 'error' ? 'text-white' : 'text-[rgba(9,203,177,0.823)]'}`}>
        {message}
      </p>
    </div>
  );

  // Load tasks from MongoDB API
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        
        // If user is not signed in, initialize guest tasks first
        if (isGuest) {
          try {
            await fetch('/api/tasks/guest-init');
          } catch (error) {
            console.error('Error initializing guest tasks:', error);
          }
        }
        
        // Fetch tasks from our MongoDB API endpoint with profile filter
        const userProfile = session?.user?.userProfile || 'work';
        const response = await fetch(`/api/tasks?profile=${userProfile}`);
        if (!response.ok) {
          throw new Error('Failed to load tasks from API');
        }
        const data = await response.json();
        
        // Ensure each task has required properties
        const tasksWithDefaults = data.map(task => ({
          ...task,
          comments: task.comments || [],
          expanded: false
        }));
        
        setTasks(tasksWithDefaults);
        setFilteredTasks(tasksWithDefaults);
        setLoading(false);
      } catch (error) {
        console.error('Error loading tasks:', error);
        // If loading from API fails, try localStorage as fallback
        const savedTasks = localStorage.getItem('todoTasks');
        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          setTasks(parsedTasks);
          setFilteredTasks(parsedTasks);
        }
        setLoading(false);
        showPopup('Error loading tasks. Using cached data.', 'error');
      }
    };

    loadTasks();
  }, [isGuest, session?.user?.userProfile]);

  // Function to filter tasks by date
  const filterTasksByDate = (tasks, filter) => {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    
    switch(filter) {
      case '1day':
        const oneDayAgo = new Date(todayStart);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return tasks.filter(task => new Date(task.startDate) >= oneDayAgo);
      case '7days':
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return tasks.filter(task => new Date(task.startDate) >= sevenDaysAgo);
      case '1month':
        const oneMonthAgo = new Date(todayStart);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return tasks.filter(task => new Date(task.startDate) >= oneMonthAgo);
      case '6months':
        const sixMonthsAgo = new Date(todayStart);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return tasks.filter(task => new Date(task.startDate) >= sixMonthsAgo);
      default:
        return tasks;
    }
  };

  // Update useEffect for filtering
  useEffect(() => {
    let filtered = tasks;
    
    // Apply date filter first
    filtered = filterTasksByDate(filtered, dateFilter);
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(task => {
        return (
          task.name.toLowerCase().includes(searchLower) ||
          task.status.toLowerCase().includes(searchLower) ||
          task.dueDate.includes(searchLower) ||
          task.owner.toLowerCase().includes(searchLower) ||
          task.detail.toLowerCase().includes(searchLower) ||
          (task.comments && task.comments.some(comment => 
            comment.text.toLowerCase().includes(searchLower)
          ))
        );
      });
    }
    
    setFilteredTasks(filtered);
    setCurrentPage(1);
  }, [searchTerm, tasks, statusFilter, dateFilter]);

  const handleInputChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const addTask = () => {
    // Check if user is logged in
    if (!session) {
      // Redirect to sign-in page with a callback to return to todo-list-manager
      window.location.href = '/auth/signin?callbackUrl=/todo-list-manager';
      return;
    }
    
    if (newTask.name && newTask.dueDate && newTask.detail) {
      const userProfile = session.user.userProfile || 'work';
      console.log(`Creating task with userProfile: ${userProfile}`);
      
      const updatedTasks = [...tasks, { 
        ...newTask, 
        comments: [],
        startDate: new Date().toISOString().split('T')[0],
        status: 'Pending', // Ensure status is Pending when adding task
        userId: session.user.id, // Add the user ID to the task
        owner: session.user.username, // Set owner to the current user's username
        userProfile: userProfile, // Set the user profile
        profile_used: `${userProfile} profile` // Add profile_used field
      }];
      
      console.log(`New task with profile_used: ${updatedTasks[updatedTasks.length - 1].profile_used}`);
      
      setTasks(updatedTasks);
      setNewTask({ 
        name: '', 
        dueDate: new Date().toISOString().split('T')[0],
        owner: session?.user?.username || '', 
        detail: '', 
        comments: [], 
        expanded: false,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Pending' // Reset with Pending status
      });
      
      saveTasksToStorage(updatedTasks, true);
    } else {
      showPopup('Please fill all required fields: Task Name, Due Date, and Detail.', 'error');
    }
  };

  const toggleExpand = (index) => {
    // If clicking on the same row that's already expanded, collapse it
    if (expandedTask === index) {
      setExpandedTask(null);
      return;
    }
    
    // Otherwise, expand the clicked row and collapse any other expanded row
    setExpandedTask(index);
  };

  const handleCellEdit = (index, field, value) => {
    const updatedTasks = tasks.map((task, idx) => 
      idx === index ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);
    
    // Debounce the save operation to reduce alerts
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    const timeout = setTimeout(() => {
      saveTasksToStorage(updatedTasks);
    }, 1000); // Wait 1 second after the last edit before saving
    
    setSaveTimeout(timeout);
  };

  const toggleEditMode = (index, e) => {
    e.stopPropagation(); // Prevent expand toggle when clicking edit button
    
    if (editingTask === index) {
      // If already editing this task, save and exit edit mode
      setEditingTask(null);
    } else {
      // Enter edit mode and ensure the details are expanded
      setEditingTask(index);
      setExpandedTask(index);
      setNewComment(''); // Reset new comment when entering edit mode
    }
  };

  const toggleCommentMode = (index, e) => {
    e.stopPropagation(); // Prevent expand toggle when clicking comment button
    
    if (commentingTask === index) {
      // If already commenting this task, exit comment mode
      setCommentingTask(null);
    } else {
      // Enter comment mode and ensure the details are expanded
      setCommentingTask(index);
      setExpandedTask(index);
      setNewComment(''); // Reset new comment when entering comment mode
    }
  };

  const markAsComplete = (index, e) => {
    e.stopPropagation(); // Prevent expand toggle when clicking complete button
    
    const updatedTasks = tasks.map((task, idx) => 
      idx === index ? { ...task, status: 'Completed' } : task
    );
    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks);
  };

  const addComment = (index) => {
    if (!newComment.trim()) return;
    
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const newCommentObj = {
      text: newComment,
      date: formattedDate,
      timestamp: today.getTime(),
      awaiting: isAwaitingResponse,
      username: session?.user?.username || 'Guest'  // Add username from session
    };
    
    const updatedTasks = tasks.map((task, idx) => {
      if (idx === index) {
        return {
          ...task,
          comments: [newCommentObj, ...(task.comments || [])],
          status: isAwaitingResponse ? 'Awaiting' : 'In Progress' // Only change to In Progress if not awaiting
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    setNewComment('');
    setIsAwaitingResponse(false); // Reset the awaiting status
    
    // Save to localStorage and JSON file without showing alert
    saveTasksToStorage(updatedTasks, false);
    
    // Show popup notification for status change
    showPopup(`Comment added and task status changed to ${isAwaitingResponse ? 'Awaiting' : 'In Progress'}`, 'success');
    
    // Exit comment mode after adding comment
    setCommentingTask(null);
  };

  const saveTasksToStorage = async (updatedTasks, showAlert = true) => {
    try {
      // Save to localStorage for immediate access and backup
      localStorage.setItem('todoTasks', JSON.stringify(updatedTasks));
      
      // Find what tasks were added, modified, or deleted
      const existingIds = tasks.map(task => task._id).filter(id => id);
      const updatedIds = updatedTasks.map(task => task._id).filter(id => id);
      
      // Handle new tasks (those without an _id)
      const newTasks = updatedTasks.filter(task => !task._id);
      for (const newTask of newTasks) {
        console.log(`Sending task to API with profile_used: ${newTask.profile_used}`);
        
        // Make sure the profile_used field is set if it's missing
        if (!newTask.profile_used && newTask.userProfile) {
          newTask.profile_used = `${newTask.userProfile} profile`;
        }
        
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTask)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create task');
        }
        
        // Log the created task
        const createdTask = await response.json();
        console.log(`API created task with profile_used: ${createdTask.profile_used}`);
      }
      
      // Handle modified tasks (those with an _id that still exist)
      const modifiedTasks = updatedTasks.filter(task => task._id);
      for (const modifiedTask of modifiedTasks) {
        const response = await fetch('/api/tasks', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(modifiedTask)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update task');
        }
      }
      
      // Handle deleted tasks (those in existingIds but not in updatedIds)
      const deletedIds = existingIds.filter(id => !updatedIds.includes(id));
      for (const _id of deletedIds) {
        const response = await fetch('/api/tasks', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ _id })
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete task');
        }
      }
      
      // After all operations, refresh tasks from API
      const userProfile = session?.user?.userProfile || 'work';
      const response = await fetch(`/api/tasks?profile=${userProfile}`);
      if (response.ok) {
        const refreshedTasks = await response.json();
        setTasks(refreshedTasks);
      }
      
      if (saveTimeout === null && showAlert) {
        showPopup('Tasks saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
      if (showAlert) {
        showPopup('Error saving tasks. Please try again.', 'error');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'text-red-500';
      case 'Completed':
        return 'text-green-500';
      case 'In Progress':
        return 'text-yellow-500';
      case 'Awaiting':
        return 'text-orange-500';
      default:
        return '';
    }
  };

  // Calculate pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Update the Comment component
  const Comment = ({ comment, session }) => {
    const [expanded, setExpanded] = useState(false);
    const maxVisibleLines = 4;
    const lines = comment.text.split('\n');
    const shouldShowExpand = lines.length > maxVisibleLines;

    const formatComment = (text) => {
      // Updated regex to match URLs with or without protocol
      const urlRegex = /(https?:\/\/[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([\/\?][^\s]*)?)/g;
      
      return text.split(urlRegex).map((part, index) => {
        if (part && part.match(urlRegex)) {
          // Add https:// if it doesn't start with a protocol
          const url = part.startsWith('http') ? part : `https://${part}`;
          return (
            <a 
              key={index} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline transition-colors duration-300"
            >
              {part}
            </a>
          );
        }
        return part;
      });
    };

    return (
      <div className="bg-[#1a1a1a] rounded-lg p-3 hover:bg-[#222] transition-all duration-300 mb-3">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs text-[rgba(9,203,177,0.823)] font-medium">
            {comment.username || session?.user?.username || 'Guest'}
          </span>
          <span className="text-xs text-[#666]">
            {comment.date}
          </span>
        </div>
        <div className="font-mono text-sm text-[#e0e0e0] whitespace-pre-wrap leading-relaxed">
          {expanded ? formatComment(comment.text) : formatComment(lines.slice(0, maxVisibleLines).join('\n'))}
          {shouldShowExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="ml-1 text-[rgba(9,203,177,0.823)] hover:text-[#00ff9d] transition-colors duration-300 text-xs"
            >
              {expanded ? 'Show less' : '... Show more'}
            </button>
          )}
        </div>
        {comment.awaiting && (
          <div className="mt-1 text-xs text-orange-500">Awaiting response</div>
        )}
      </div>
    );
  };

  // Add this function at the top level of the component
  const calculateDaysSince = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}d`;
  };

  // Update the extractUrls function
  const extractUrls = (task) => {
    const urlRegex = /(https?:\/\/[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([\/\?][^\s]*)?)/g;
    const urls = [];
    
    // Extract from detail
    if (task.detail) {
      const detailUrls = task.detail.match(urlRegex);
      if (detailUrls) {
        urls.push(...detailUrls);
      }
    }
    
    // Extract from comments
    if (task.comments && task.comments.length > 0) {
      task.comments.forEach(comment => {
        if (comment.text) {
          const commentUrls = comment.text.match(urlRegex);
          if (commentUrls) {
            urls.push(...commentUrls);
          }
        }
      });
    }
    
    // Format URLs (add https:// if missing)
    return [...new Set(urls)].map(url => 
      url.startsWith('http') ? url : `https://${url}`
    );
  };

  // Update the formatDate function to include time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Update the formatDateShort function for due date
  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] py-6 px-2 sm:py-10 sm:px-6 lg:px-8">
      <Navbar />
      
      {/* Add Popup to the top level */}
      {popup.show && <Popup message={popup.message} type={popup.type} />}
      
      <div className="max-w-4xl mx-auto bg-[#1e1e1e] rounded-2xl shadow-lg p-3 sm:p-6 border border-[#444] mt-16">
        {/* Header section - stack on mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-2 sm:space-y-0">
          <div className="w-full sm:w-1/4 text-center sm:text-left">
            {session && (
              <p className="text-sm text-[rgba(9,203,177,0.823)]">
                Welcome, {session.user.username}!
              </p>
            )}
            {isGuest && (
              <p className="text-sm text-yellow-500">
                Viewing as guest
              </p>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-white w-full sm:w-2/4 text-center">Todo List Manager</h1>
          <div className="w-full sm:w-1/4 flex justify-center sm:justify-end">
            {isGuest && (
              <Link href="/auth/signin?callbackUrl=/todo-list-manager" className="text-yellow-500 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
        
        {isGuest && (
          <div className="mb-4 p-3 bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg text-yellow-500">
            <p>You are viewing tasks as a guest. <Link href="/auth/signin?callbackUrl=/todo-list-manager" className="underline font-bold">Sign in</Link> to create and manage your own tasks.</p>
          </div>
        )}
        
        {/* Task Creation Form - make responsive */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            name="name"
            value={newTask.name}
            onChange={handleInputChange}
            placeholder="Task Name"
            className="border border-[#444] bg-[#2a2a2a] text-[#e0e0e0] py-1.5 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.823)]"
          />
          <input
            type="date"
            name="dueDate"
            value={newTask.dueDate}
            onChange={handleInputChange}
            className="border border-[#444] bg-[#2a2a2a] text-[#e0e0e0] py-1.5 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.823)]"
          />
          <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <textarea
              name="detail"
              value={newTask.detail}
              onChange={handleInputChange}
              placeholder="Task Detail"
              className="col-span-1 sm:col-span-2 border border-[#444] bg-[#2a2a2a] text-[#e0e0e0] py-1.5 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.823)] resize-none"
              rows="3"
            />
            <div className="flex flex-row sm:flex-col gap-2">
              <button
                onClick={addTask}
                className="flex-1 py-2 px-4 rounded-lg transition-all duration-300 bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.2)] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)]"
              >
                Add Task
              </button>
              {session && (
                <Link 
                  href="/todo-list-manager/statistics"
                  className="flex-1 py-2 px-4 rounded-lg transition-all duration-300 bg-[#1e1e1e] border border-[#444] text-[#e0e0e0] hover:bg-[rgba(9,203,177,0.1)] hover:text-[rgba(9,203,177,0.823)] flex items-center justify-center"
                >
                  Statistics
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Filters section - stack on mobile */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="w-full sm:w-auto mb-2 sm:mb-0">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto bg-[#1e1e1e] text-[#e0e0e0] py-1.5 px-4 rounded-lg border border-[#444] focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.823)] hover:bg-[#2a2a2a] transition-all duration-300"
            >
              <option value="all">All Time</option>
              <option value="1day">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="1month">Last Month</option>
              <option value="6months">Last 6 Months</option>
            </select>
          </div>

          {/* Status Filter Tabs - scroll horizontally on mobile */}
          <div className="w-full sm:w-auto overflow-x-auto">
            <div className="flex sm:grid sm:grid-cols-5 min-w-max sm:min-w-0 bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#444]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`py-1.5 px-6 transition-all duration-300 ${
                  statusFilter === 'all'
                  ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]'
                  : 'text-[#e0e0e0] hover:bg-[rgba(9,203,177,0.1)] hover:text-[rgba(9,203,177,0.823)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('Pending')}
                className={`py-1.5 px-6 transition-all duration-300 ${
                  statusFilter === 'Pending'
                  ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]'
                  : 'text-[#e0e0e0] hover:bg-[rgba(9,203,177,0.1)] hover:text-[rgba(9,203,177,0.823)]'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('In Progress')}
                className={`py-1.5 px-6 transition-all duration-300 ${
                  statusFilter === 'In Progress'
                  ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]'
                  : 'text-[#e0e0e0] hover:bg-[rgba(9,203,177,0.1)] hover:text-[rgba(9,203,177,0.823)]'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('Awaiting')}
                className={`py-1.5 px-6 transition-all duration-300 ${
                  statusFilter === 'Awaiting'
                  ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]'
                  : 'text-[#e0e0e0] hover:bg-[rgba(9,203,177,0.1)] hover:text-[rgba(9,203,177,0.823)]'
                }`}
              >
                Awaiting
              </button>
              <button
                onClick={() => setStatusFilter('Completed')}
                className={`py-1.5 px-6 transition-all duration-300 ${
                  statusFilter === 'Completed'
                  ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]'
                  : 'text-[#e0e0e0] hover:bg-[rgba(9,203,177,0.1)] hover:text-[rgba(9,203,177,0.823)]'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - full width on mobile */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            className="w-full border border-[#444] bg-[#2a2a2a] text-[#e0e0e0] py-1.5 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.823)]"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-[#bbb]">Loading tasks...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left rounded-lg overflow-hidden">
                <thead className="bg-[#2a2a2a]">
                  <tr>
                    <th className="py-3 px-4 text-[rgba(9,203,177,0.823)] whitespace-nowrap">Task Name</th>
                    <th className="py-3 px-4 text-[rgba(9,203,177,0.823)] whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-[rgba(9,203,177,0.823)] whitespace-nowrap">Due Date</th>
                    <th className="py-3 px-4 text-[rgba(9,203,177,0.823)] whitespace-nowrap">Owner</th>
                    <th className="py-3 px-4 text-[rgba(9,203,177,0.823)] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTasks.map((task, index) => {
                    // Find the actual index in the original tasks array
                    const originalIndex = tasks.findIndex(t => 
                      t.name === task.name && 
                      t.dueDate === task.dueDate && 
                      t.owner === task.owner
                    );
                    
                    return (
                      <React.Fragment key={index}>
                        <tr 
                          className={`border-b border-[#444] hover:bg-[#2a2a2a] cursor-pointer ${expandedTask === originalIndex ? 'bg-[#2a2a2a]' : ''}`}
                          onClick={() => toggleExpand(originalIndex)}
                        >
                          <td className="py-2 px-4 text-[#e0e0e0]">
                            {editingTask === originalIndex ? (
                              <input
                                type="text"
                                value={task.name}
                                onChange={(e) => handleCellEdit(originalIndex, 'name', e.target.value)}
                                className="w-full bg-[#2a2a2a] text-[#e0e0e0] p-1 rounded border border-[#444]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div 
                                className={`truncate max-w-[300px] ${expandedTask === originalIndex ? 'whitespace-normal' : ''}`} 
                                title={task.name}
                              >
                                {task.name}
                              </div>
                            )}
                          </td>
                          <td className={`py-2 px-4 font-semibold ${getStatusColor(task.status)}`}>
                            {editingTask === originalIndex ? (
                              <select
                                value={task.status}
                                onChange={(e) => handleCellEdit(originalIndex, 'status', e.target.value)}
                                className="bg-[#2a2a2a] text-[#e0e0e0] p-1 rounded border border-[#444]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              task.status
                            )}
                          </td>
                          <td className="py-2 px-4 text-[#e0e0e0]">
                            {editingTask === originalIndex ? (
                              <input
                                type="date"
                                value={task.dueDate}
                                onChange={(e) => handleCellEdit(originalIndex, 'dueDate', e.target.value)}
                                className="bg-[#2a2a2a] text-[#e0e0e0] p-1 rounded border border-[#444]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              formatDateShort(task.dueDate)
                            )}
                          </td>
                          <td className="py-2 px-4 text-[#e0e0e0]">
                            {task.owner}
                          </td>
                          <td className="py-2 px-4 text-[#e0e0e0]">
                            <div className="flex space-x-2">
                              {!isGuest ? (
                                <>
                                  <button
                                    onClick={(e) => toggleEditMode(originalIndex, e)}
                                    className="text-[rgba(9,203,177,0.823)] hover:text-[#00ff9d] transition-colors duration-300"
                                    title="Edit Task"
                                  >
                                    {editingTask === originalIndex ? '✓' : '✎'}
                                  </button>
                                  <button
                                    onClick={(e) => toggleCommentMode(originalIndex, e)}
                                    className={`text-[rgba(9,203,177,0.823)] hover:text-[#00ff9d] transition-colors duration-300 ${commentingTask === originalIndex ? 'text-[#00ff9d]' : ''}`}
                                    title="Add Comment"
                                  >
                                    💬
                                  </button>
                                  <button
                                    onClick={(e) => markAsComplete(originalIndex, e)}
                                    className="text-[rgba(9,203,177,0.823)] hover:text-[#00ff9d] transition-colors duration-300"
                                    title="Mark as Complete"
                                  >
                                    ✅
                                  </button>
                                </>
                              ) : (
                                <span className="text-yellow-500 text-xs">Sign in to edit</span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedTask === originalIndex && (
                          <tr className="bg-[#2a2a2a]">
                            <td colSpan="5" className="py-2 px-4 text-[#bbb]">
                              {/* Task Details Capsules */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-3 py-1.5 rounded-full text-xs bg-[#333] text-[#e0e0e0] hover:bg-[#444] transition-all duration-300">
                                  Start: {formatDate(task.startDate)}
                                </span>
                                <span className="px-3 py-1.5 rounded-full text-xs bg-[#333] text-[#e0e0e0] hover:bg-[#444] transition-all duration-300">
                                  Due: {formatDateShort(task.dueDate)}
                                </span>
                                <span className="px-3 py-1.5 rounded-full text-xs bg-[#333] text-[#e0e0e0] hover:bg-[#444] transition-all duration-300">
                                  Owner: {task.owner}
                                </span>
                                <span className="px-3 py-1.5 rounded-full text-xs bg-[#333] text-[#e0e0e0] hover:bg-[#444] transition-all duration-300">
                                  Status: <span className={getStatusColor(task.status)}>{task.status}</span>
                                </span>
                                <span className="px-3 py-1.5 rounded-full text-xs bg-[#333] text-[#e0e0e0] hover:bg-[#444] transition-all duration-300">
                                  Open since: {calculateDaysSince(task.startDate)}
                                </span>
                                {task.profile_used ? (
                                  <span className="px-3 py-1.5 rounded-full text-xs bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.25)] transition-all duration-300">
                                    {task.profile_used}
                                  </span>
                                ) : task.userProfile ? (
                                  <span className="px-3 py-1.5 rounded-full text-xs bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.25)] transition-all duration-300">
                                    {task.userProfile} profile
                                  </span>
                                ) : null}
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowDetails(!showDetails);
                                    setShowUrls(false);
                                  }}
                                  className="px-3 py-1.5 rounded-full text-xs bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#333] transition-all duration-300"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowUrls(!showUrls);
                                    setShowDetails(false);
                                  }}
                                  className="px-3 py-1.5 rounded-full text-xs bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#333] transition-all duration-300"
                                >
                                  URLs ({extractUrls(task).length})
                                </button>
                              </div>

                              {/* Details Modal */}
                              {showDetails && selectedTask === task && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                  <div className="bg-[#1e1e1e] p-4 sm:p-6 rounded-lg max-w-2xl w-full mx-2 sm:mx-4">
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-lg font-semibold text-[rgba(9,203,177,0.823)]">Task Details</h3>
                                      <button
                                        onClick={() => setShowDetails(false)}
                                        className="text-[#666] hover:text-[#e0e0e0] transition-colors duration-300"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div className="font-mono text-sm text-[#e0e0e0] whitespace-pre-wrap">
                                      {task.detail}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* URLs Modal */}
                              {showUrls && selectedTask === task && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                  <div className="bg-[#1e1e1e] p-4 sm:p-6 rounded-lg max-w-2xl w-full mx-2 sm:mx-4">
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-lg font-semibold text-[rgba(9,203,177,0.823)]">URLs in Task</h3>
                                      <button
                                        onClick={() => setShowUrls(false)}
                                        className="text-[#666] hover:text-[#e0e0e0] transition-colors duration-300"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div className="space-y-2">
                                      {extractUrls(task).map((url, index) => (
                                        <a
                                          key={index}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block p-2 bg-[#2a2a2a] rounded hover:bg-[#333] transition-colors duration-300 text-blue-500 hover:text-blue-400"
                                        >
                                          {url}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Comments Section */}
                              <div className="mb-4">
                                <h3 className="text-[rgba(9,203,177,0.823)] font-semibold mb-2">Comments</h3>
                                
                                {/* Add Comment Form */}
                                {(commentingTask === originalIndex || editingTask === originalIndex) && (
                                  <div className="mb-3 flex flex-col">
                                    <div className="flex items-center mb-2">
                                      <input
                                        type="checkbox"
                                        checked={isAwaitingResponse}
                                        onChange={(e) => setIsAwaitingResponse(e.target.checked)}
                                        className="mr-2 h-4 w-4 text-[rgba(9,203,177,0.823)] border-[#444] rounded focus:ring-[rgba(9,203,177,0.823)]"
                                      />
                                      <span className="text-[#e0e0e0]">Waiting for Response</span>
                                    </div>
                                    <div className="flex">
                                      <textarea
                                        value={newComment}
                                        onChange={handleCommentChange}
                                        placeholder="Add a comment..."
                                        className="flex-grow bg-[#1a1a1a] text-[#e0e0e0] p-2 rounded border border-[#444] resize-none mr-2 font-mono whitespace-pre-wrap"
                                        rows="4"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addComment(originalIndex);
                                        }}
                                        className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[rgba(9,203,177,0.823)] py-2 px-4 rounded border border-[rgba(9,203,177,0.823)] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)] transition-all duration-300 self-end"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Display Comments */}
                                {task.comments && task.comments.length > 0 ? (
                                  <div className="space-y-2">
                                    {task.comments.map((comment, commentIndex) => (
                                      <Comment 
                                        key={commentIndex} 
                                        comment={comment} 
                                        session={session} 
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[#666] italic">No comments yet</div>
                                )}
                              </div>
                              
                              {/* Details Section */}
                              <div>
                                <h3 className="text-[rgba(9,203,177,0.823)] font-semibold mb-2">Details</h3>
                                {editingTask === originalIndex ? (
                                  <textarea
                                    value={task.detail}
                                    onChange={(e) => handleCellEdit(originalIndex, 'detail', e.target.value)}
                                    className="w-full bg-[#2a2a2a] text-[#e0e0e0] p-2 rounded border border-[#444] resize-none"
                                    rows="3"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <div className="whitespace-pre-line">
                                    {task.detail}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination - center on mobile */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`py-1 px-3 rounded ${
                    currentPage === 1
                      ? 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                      : 'bg-[#1e1e1e] text-[rgba(9,203,177,0.823)] border border-[rgba(9,203,177,0.823)] hover:bg-[#2a2a2a] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)]'
                  }`}
                >
                  Previous
                </button>
                <span className="py-1 px-3 text-[#e0e0e0]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`py-1 px-3 rounded ${
                    currentPage === totalPages
                      ? 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                      : 'bg-[#1e1e1e] text-[rgba(9,203,177,0.823)] border border-[rgba(9,203,177,0.823)] hover:bg-[#2a2a2a] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)]'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TodoListManager; 