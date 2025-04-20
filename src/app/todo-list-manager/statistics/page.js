'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';

const StatisticsDashboard = () => {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [statistics, setStatistics] = useState(null);

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

    return {
      statusCounts,
      ownerDistribution,
      completionRate,
      avgCommentsPerTask,
      dueDateStats,
      totalTasks
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
    dueDateStats: calculatedStats?.dueDateStats || { overdue: 0, dueSoon: 0, future: 0 }
  };

  const StatCard = ({ title, value, color = 'text-[rgba(9,203,177,0.823)]' }) => (
    <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#444]">
      <h3 className="text-[#e0e0e0] text-sm mb-1">{title}</h3>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );

  const ProgressBar = ({ percentage, color }) => (
    <div className="w-full bg-[#2a2a2a] rounded-full h-2.5">
      <div 
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] py-10 px-4 sm:px-6 lg:px-8">
      <Navbar />
      
      <div className="max-w-4xl mx-auto bg-[#1e1e1e] rounded-2xl shadow-lg p-6 border border-[#444] mt-16">
        <div className="flex justify-between items-center mb-6">
          <div className="w-1/4">
            {session && (
              <p className="text-sm text-[rgba(9,203,177,0.823)]">
                Welcome, {session.user.username}!
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[rgba(9,203,177,0.15)]">
                  {session.user.userProfile === 'work' ? 'Work' : 'Personal'} profile
                </span>
              </p>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-white text-center w-2/4">Task Statistics</h1>
          <div className="w-1/4 flex justify-end">
            <Link 
              href="/todo-list-manager" 
              className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[rgba(9,203,177,0.823)] py-2 px-4 rounded border border-[rgba(9,203,177,0.823)] hover:shadow-[0_0_20px_rgba(45,169,164,0.3)] transition-all duration-300"
            >
              Back to Tasks
            </Link>
          </div>
        </div>
        
        <div className="mb-6">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full bg-[#2a2a2a] text-[#e0e0e0] py-1.5 px-4 rounded border border-[#444] focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.823)]"
          >
            <option value="1day">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="1month">Last Month</option>
            <option value="6months">Last 6 Months</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {!session ? (
          <div className="text-center py-8">
            <p className="text-[#bbb] mb-4">Please log in to view your task statistics</p>
            <Link
              href="/auth/signin?callbackUrl=/todo-list-manager/statistics"
              className="bg-[rgba(9,203,177,0.15)] hover:bg-[rgba(9,203,177,0.3)] text-[rgba(9,203,177,0.823)] px-6 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-[#bbb]">Loading statistics from MongoDB...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Tasks" 
                value={safeStats.totalTasks} 
              />
              <StatCard 
                title="Completion Rate" 
                value={`${safeStats.completionRate.toFixed(1)}%`} 
                color="text-green-500"
              />
              <StatCard 
                title="Avg Comments/Task" 
                value={safeStats.avgCommentsPerTask.toFixed(1)} 
                color="text-blue-500"
              />
              <StatCard 
                title="Overdue Tasks" 
                value={safeStats.dueDateStats.overdue} 
                color="text-red-500"
              />
            </div>

            {/* Status Distribution */}
            <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444]">
              <h2 className="text-xl font-semibold text-white mb-4">Status Distribution</h2>
              <div className="space-y-4">
                {Object.entries(safeStats.statusCounts).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#e0e0e0]">{status}</span>
                      <span className="text-[rgba(9,203,177,0.823)]">{count}</span>
                    </div>
                    <ProgressBar 
                      percentage={(count / safeStats.totalTasks) * 100} 
                      color="bg-[rgba(9,203,177,0.823)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Due Date Stats */}
            <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444]">
              <h2 className="text-xl font-semibold text-white mb-4">Due Date Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-[#e0e0e0] mb-1">Overdue</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-semibold text-red-500">{safeStats.dueDateStats.overdue}</span>
                    <ProgressBar 
                      percentage={(safeStats.dueDateStats.overdue / safeStats.totalTasks) * 100} 
                      color="bg-red-500"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-[#e0e0e0] mb-1">Due Soon (7 days)</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-semibold text-yellow-500">{safeStats.dueDateStats.dueSoon}</span>
                    <ProgressBar 
                      percentage={(safeStats.dueDateStats.dueSoon / safeStats.totalTasks) * 100} 
                      color="bg-yellow-500"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-[#e0e0e0] mb-1">Future</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-semibold text-blue-500">{safeStats.dueDateStats.future}</span>
                    <ProgressBar 
                      percentage={(safeStats.dueDateStats.future / safeStats.totalTasks) * 100} 
                      color="bg-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsDashboard; 