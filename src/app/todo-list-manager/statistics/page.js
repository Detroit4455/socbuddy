'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const StatisticsDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch('/data/tool_todo_manager.json');
        if (!response.ok) {
          throw new Error('Failed to load tasks');
        }
        const data = await response.json();
        setTasks(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading tasks:', error);
        const savedTasks = localStorage.getItem('todoTasks');
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

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

  const stats = calculateStatistics(tasks);

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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-white">Task Statistics Dashboard</h1>
          <div className="flex space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#1e1e1e] text-[#e0e0e0] py-1.5 px-4 rounded-lg border border-[#444]"
            >
              <option value="1day">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="1month">Last Month</option>
              <option value="6months">Last 6 Months</option>
            </select>
            <Link 
              href="/todo-list-manager"
              className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[rgba(9,203,177,0.823)] py-2 px-4 rounded border border-[rgba(9,203,177,0.823)]"
            >
              Back to Tasks
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Tasks" 
                value={stats.totalTasks} 
              />
              <StatCard 
                title="Completion Rate" 
                value={`${stats.completionRate.toFixed(1)}%`} 
                color="text-green-500"
              />
              <StatCard 
                title="Avg Comments/Task" 
                value={stats.avgCommentsPerTask.toFixed(1)} 
                color="text-blue-500"
              />
              <StatCard 
                title="Overdue Tasks" 
                value={stats.dueDateStats.overdue} 
                color="text-red-500"
              />
            </div>

            {/* Status Distribution */}
            <div className="bg-[#1e1e1e] p-6 rounded-lg border border-[#444]">
              <h2 className="text-xl font-semibold text-white mb-4">Status Distribution</h2>
              <div className="space-y-4">
                {Object.entries(stats.statusCounts).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#e0e0e0]">{status}</span>
                      <span className="text-[rgba(9,203,177,0.823)]">{count}</span>
                    </div>
                    <ProgressBar 
                      percentage={(count / stats.totalTasks) * 100} 
                      color="bg-[rgba(9,203,177,0.823)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Owner Distribution */}
            <div className="bg-[#1e1e1e] p-6 rounded-lg border border-[#444]">
              <h2 className="text-xl font-semibold text-white mb-4">Tasks by Owner</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stats.ownerDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .map(([owner, count]) => (
                    <div key={owner} className="flex items-center justify-between">
                      <span className="text-[#e0e0e0]">{owner}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[rgba(9,203,177,0.823)]">{count}</span>
                        <ProgressBar 
                          percentage={(count / stats.totalTasks) * 100} 
                          color="bg-[rgba(9,203,177,0.823)]"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Due Date Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1e1e1e] p-6 rounded-lg border border-[#444]">
                <h3 className="text-lg font-semibold text-white mb-2">Overdue Tasks</h3>
                <p className="text-3xl text-red-500">{stats.dueDateStats.overdue}</p>
              </div>
              <div className="bg-[#1e1e1e] p-6 rounded-lg border border-[#444]">
                <h3 className="text-lg font-semibold text-white mb-2">Due Soon (7 days)</h3>
                <p className="text-3xl text-yellow-500">{stats.dueDateStats.dueSoon}</p>
              </div>
              <div className="bg-[#1e1e1e] p-6 rounded-lg border border-[#444]">
                <h3 className="text-lg font-semibold text-white mb-2">Future Tasks</h3>
                <p className="text-3xl text-green-500">{stats.dueDateStats.future}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsDashboard; 