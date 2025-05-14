'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';

const StatisticsDashboard = () => {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        
        // Get the user's current profile
        const userProfile = session?.user?.userProfile || 'work';
        
        // First, try to get statistics from our dedicated statistics API
        // Pass the userProfile parameter to filter by profile
        const statsResponse = await fetch(`/api/tasks/statistics?dateFilter=${timeRange}&profile=${userProfile}`);
        
        if (statsResponse.ok) {
          // If we have a statistics API, use its data
          const statsData = await statsResponse.json();
          // Process statistics data as needed
          setStatistics(statsData);
          setLoading(false);
          return;
        }
        
        // Fallback: If statistics API fails, load raw tasks from the tasks API
        // Include the profile parameter to filter by the current profile
        const response = await fetch(`/api/tasks?profile=${userProfile}`);
        if (!response.ok) {
          throw new Error('Failed to load tasks');
        }
        const data = await response.json();
        setTasks(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading statistics:', error);
        // Last resort fallback: Use localStorage if all APIs fail
        // Filter by the current user ID if we have it
        const savedTasks = localStorage.getItem('todoTasks');
        if (savedTasks) {
          let parsedTasks = JSON.parse(savedTasks);
          // If we have a user session, filter tasks by this user
          if (session?.user?.id) {
            parsedTasks = parsedTasks.filter(task => task.userId === session.user.id);
            
            // Also filter by userProfile if available
            if (session?.user?.userProfile) {
              parsedTasks = parsedTasks.filter(task => 
                task.userProfile === session.user.userProfile || 
                task.profile_used === `${session.user.userProfile} profile`
              );
            }
          }
          setTasks(parsedTasks);
        }
        setLoading(false);
      }
    };

    // Only load tasks if we have a session
    if (session) {
      loadTasks();
    }
  }, [timeRange, session, session?.user?.userProfile]);

  const filterTasksByDate = (tasks, range) => {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    
    switch(range) {
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

  const calculateStatistics = (tasks) => {
    const filteredTasks = filterTasksByDate(tasks, timeRange);
    
    // Status counts
    const statusCounts = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    // Owner distribution
    const ownerDistribution = filteredTasks.reduce((acc, task) => {
      acc[task.owner] = (acc[task.owner] || 0) + 1;
      return acc;
    }, {});

    // Completion rate
    const totalTasks = filteredTasks.length;
    const completedTasks = statusCounts['Completed'] || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Average comments per task
    const totalComments = filteredTasks.reduce((sum, task) => sum + (task.comments?.length || 0), 0);
    const avgCommentsPerTask = totalTasks > 0 ? totalComments / totalTasks : 0;

    // Tasks by due date (overdue, due soon, future)
    const today = new Date();
    const dueDateStats = filteredTasks.reduce((acc, task) => {
      const dueDate = new Date(task.dueDate);
      if (dueDate < today) {
        acc.overdue++;
      } else if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        acc.dueSoon++;
      } else {
        acc.future++;
      }
      return acc;
    }, { overdue: 0, dueSoon: 0, future: 0 });

    // Tasks by status over time (for trend analysis)
    const statusByDay = {};
    filteredTasks.forEach(task => {
      const startDate = new Date(task.startDate).toISOString().split('T')[0];
      if (!statusByDay[startDate]) {
        statusByDay[startDate] = {
          'Pending': 0,
          'In Progress': 0,
          'Completed': 0,
          'Awaiting': 0
        };
      }
      statusByDay[startDate][task.status] = (statusByDay[startDate][task.status] || 0) + 1;
    });

    return {
      statusCounts,
      ownerDistribution,
      completionRate,
      avgCommentsPerTask,
      dueDateStats,
      totalTasks,
      statusByDay
    };
  };

  // If statistics is undefined, use calculatedStats
  const calculatedStats = statistics || calculateStatistics(tasks);
  
  // Ensure required properties exist to prevent errors
  const safeStats = {
    totalTasks: calculatedStats?.totalTasks || 0,
    statusCounts: calculatedStats?.statusCounts || {},
    ownerDistribution: calculatedStats?.ownerDistribution || {},
    completionRate: calculatedStats?.completionRate || 0,
    avgCommentsPerTask: calculatedStats?.avgCommentsPerTask || 0,
    dueDateStats: calculatedStats?.dueDateStats || { overdue: 0, dueSoon: 0, future: 0 },
    statusByDay: calculatedStats?.statusByDay || {}
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-red-500';
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-yellow-500';
      case 'Awaiting':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const StatCard = ({ title, value, icon, color = 'text-[rgba(9,203,177,0.823)]', bgColor = 'bg-[rgba(9,203,177,0.1)]' }) => (
    <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#444] hover:shadow-lg transition-all duration-300 hover:border-[rgba(9,203,177,0.4)]">
      <div className="flex items-center mb-3">
        <div className={`${bgColor} p-2 rounded-lg mr-3`}>
          <span className="text-xl">{icon}</span>
        </div>
        <h3 className="text-[#e0e0e0] text-sm">{title}</h3>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );

  const ProgressBar = ({ percentage, color, label, count }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-[#e0e0e0]">{label}</span>
        <span className="text-sm text-[rgba(9,203,177,0.823)]">{count}</span>
      </div>
      <div className="w-full bg-[#2a2a2a] rounded-full h-3">
        <div 
          className={`h-3 rounded-full ${color}`}
          style={{ width: `${percentage > 0 ? Math.max(percentage, 3) : 0}%` }}
        ></div>
      </div>
    </div>
  );

  const CircleProgress = ({ percentage, color, size = 120, strokeWidth = 8, label, value }) => (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle 
            cx={size/2} 
            cy={size/2} 
            r={(size/2) - (strokeWidth/2)} 
            fill="none" 
            stroke="#2a2a2a" 
            strokeWidth={strokeWidth} 
          />
          {/* Progress circle */}
          <circle 
            cx={size/2} 
            cy={size/2} 
            r={(size/2) - (strokeWidth/2)} 
            fill="none" 
            stroke={color === 'green' ? '#10b981' : color === 'red' ? '#ef4444' : color === 'yellow' ? '#f59e0b' : '#3b82f6'} 
            strokeWidth={strokeWidth} 
            strokeDasharray={2 * Math.PI * ((size/2) - (strokeWidth/2))}
            strokeDashoffset={2 * Math.PI * ((size/2) - (strokeWidth/2)) * (1 - percentage / 100)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-xs text-[#999]">{percentage.toFixed(1)}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-center text-[#e0e0e0]">{label}</p>
    </div>
  );

  // Tab navigation component
  const TabNav = () => (
    <div className="flex border-b border-[#444] mb-6 overflow-x-auto">
      <button 
        onClick={() => setActiveTab('overview')}
        className={`px-4 py-2 font-medium text-sm ${activeTab === 'overview' ? 
          'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 
          'text-[#999] hover:text-white'}`}
      >
        Overview
      </button>
      <button 
        onClick={() => setActiveTab('status')}
        className={`px-4 py-2 font-medium text-sm ${activeTab === 'status' ? 
          'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 
          'text-[#999] hover:text-white'}`}
      >
        Status Distribution
      </button>
      <button 
        onClick={() => setActiveTab('due-dates')}
        className={`px-4 py-2 font-medium text-sm ${activeTab === 'due-dates' ? 
          'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 
          'text-[#999] hover:text-white'}`}
      >
        Due Dates
      </button>
      <button 
        onClick={() => setActiveTab('owners')}
        className={`px-4 py-2 font-medium text-sm ${activeTab === 'owners' ? 
          'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 
          'text-[#999] hover:text-white'}`}
      >
        Task Owners
      </button>
    </div>
  );

  // Overview tab content
  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Tasks" 
          value={safeStats.totalTasks}
          icon="📊"
          bgColor="bg-blue-500/10"
          color="text-blue-400"
        />
        <StatCard 
          title="Completion Rate" 
          value={`${safeStats.completionRate.toFixed(1)}%`}
          icon="✅"
          bgColor="bg-green-500/10"
          color="text-green-400"
        />
        <StatCard 
          title="Avg Comments" 
          value={safeStats.avgCommentsPerTask.toFixed(1)}
          icon="💬"
          bgColor="bg-purple-500/10"
          color="text-purple-400"
        />
        <StatCard 
          title="Overdue Tasks" 
          value={safeStats.dueDateStats.overdue}
          icon="⏰"
          bgColor="bg-red-500/10"
          color="text-red-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#444] col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="text-[rgba(9,203,177,0.823)] mr-2">📈</span>
            Task Status Overview
          </h2>
          <div className="space-y-4">
            {Object.entries(safeStats.statusCounts).map(([status, count]) => (
              <ProgressBar 
                key={status}
                label={status}
                count={count}
                percentage={(count / safeStats.totalTasks) * 100} 
                color={getStatusColor(status)}
              />
            ))}
          </div>
        </div>
        
        <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#444]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="text-[rgba(9,203,177,0.823)] mr-2">🎯</span>
            Completion Progress
          </h2>
          <div className="flex justify-center py-4">
            <CircleProgress 
              percentage={safeStats.completionRate} 
              color="green"
              value={`${safeStats.completionRate.toFixed(0)}%`}
              label="Tasks Completed"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Status Distribution tab content
  const StatusDistributionTab = () => (
    <div className="space-y-6">
      <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#444]">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="text-[rgba(9,203,177,0.823)] mr-2">📊</span>
          Status Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(safeStats.statusCounts).map(([status, count]) => (
            <div key={status} className="bg-[#2a2a2a] p-4 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mb-2`}></div>
              <h3 className="text-sm text-[#e0e0e0] mb-1">{status}</h3>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-sm text-[#999]">
                  {safeStats.totalTasks > 0 ? ((count / safeStats.totalTasks) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <div className="flex h-8 rounded-lg overflow-hidden">
            {Object.entries(safeStats.statusCounts).map(([status, count]) => (
              <div 
                key={status} 
                className={`${getStatusColor(status)} h-full`}
                style={{ width: `${(count / safeStats.totalTasks) * 100}%` }}
                title={`${status}: ${count} tasks (${((count / safeStats.totalTasks) * 100).toFixed(1)}%)`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <div className="text-xs text-[#999]">0%</div>
            <div className="text-xs text-[#999]">100%</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Due Dates tab content
  const DueDatesTab = () => (
    <div className="space-y-6">
      <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#444]">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="text-[rgba(9,203,177,0.823)] mr-2">📅</span>
          Due Date Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <CircleProgress 
              percentage={(safeStats.dueDateStats.overdue / safeStats.totalTasks) * 100 || 0} 
              color="red"
              value={safeStats.dueDateStats.overdue}
              label="Overdue Tasks"
            />
          </div>
          <div className="flex flex-col items-center">
            <CircleProgress 
              percentage={(safeStats.dueDateStats.dueSoon / safeStats.totalTasks) * 100 || 0} 
              color="yellow"
              value={safeStats.dueDateStats.dueSoon}
              label="Due Soon (7 days)"
            />
          </div>
          <div className="flex flex-col items-center">
            <CircleProgress 
              percentage={(safeStats.dueDateStats.future / safeStats.totalTasks) * 100 || 0} 
              color="blue"
              value={safeStats.dueDateStats.future}
              label="Future Tasks"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Owners tab content
  const OwnersTab = () => (
    <div className="space-y-6">
      <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#444]">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="text-[rgba(9,203,177,0.823)] mr-2">👥</span>
          Task Distribution by Owner
        </h2>
        <div className="space-y-4">
          {Object.entries(safeStats.ownerDistribution).map(([owner, count]) => (
            <ProgressBar 
              key={owner}
              label={owner || 'Unassigned'}
              count={count}
              percentage={(count / safeStats.totalTasks) * 100} 
              color="bg-blue-500"
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] py-10 px-4 sm:px-6 lg:px-8">
      <Navbar />
      
      <div className="max-w-6xl mx-auto">
        {/* Header section with improved styling */}
        <div className="bg-gradient-to-r from-[#1e1e1e] to-[#2a2a2a] rounded-xl shadow-lg p-6 border border-[#444] mt-16 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="bg-[rgba(9,203,177,0.15)] p-3 rounded-lg mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Task Statistics</h1>
                {session && (
                  <p className="text-sm text-[rgba(9,203,177,0.823)]">
                    Welcome, {session.user.username}!
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[rgba(9,203,177,0.15)]">
                      {session.user.userProfile === 'work' ? 'Work' : 'Personal'} profile
                    </span>
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-[#2a2a2a] text-[#e0e0e0] py-2 px-4 rounded-lg border border-[#444] focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.823)]"
              >
                <option value="1day">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="1month">Last Month</option>
                <option value="6months">Last 6 Months</option>
                <option value="all">All Time</option>
              </select>
              
              <Link 
                href="/todo-list-manager" 
                className="bg-[rgba(9,203,177,0.15)] hover:bg-[rgba(9,203,177,0.3)] text-[rgba(9,203,177,0.823)] py-2 px-4 rounded-lg transition-all duration-300 flex items-center"
              >
                <span className="mr-2">←</span>
                Back to Tasks
              </Link>
            </div>
          </div>
        </div>
        
        {!session ? (
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg p-8 border border-[#444] text-center">
            <div className="bg-[rgba(9,203,177,0.05)] rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-4">Authentication Required</h2>
            <p className="text-[#bbb] mb-6">Please log in to view your task statistics</p>
            <Link
              href="/auth/signin?callbackUrl=/todo-list-manager/statistics"
              className="bg-[rgba(9,203,177,0.15)] hover:bg-[rgba(9,203,177,0.3)] text-[rgba(9,203,177,0.823)] px-6 py-3 rounded-lg transition-all duration-300 inline-flex items-center"
            >
              <span className="mr-2">🔑</span>
              Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg p-8 border border-[#444] text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
            <p className="text-[#bbb]">Loading your statistics...</p>
          </div>
        ) : (
          <div className="bg-[#1e1e1e] rounded-xl shadow-lg p-6 border border-[#444]">
            <TabNav />
            
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'status' && <StatusDistributionTab />}
            {activeTab === 'due-dates' && <DueDatesTab />}
            {activeTab === 'owners' && <OwnersTab />}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsDashboard; 