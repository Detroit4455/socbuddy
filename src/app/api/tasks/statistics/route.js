const { NextResponse } = require('next/server');
const { connectDB } = require('@/lib/mongodb');
const Task = require('@/models/Task');
const { getToken } = require('next-auth/jwt');

// Add route segment configuration for dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get the current user from the session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    const userId = token?.id;
    
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter');

    let dateQuery = {};
    
    // Always filter by the current user if authenticated
    if (userId) {
      dateQuery.userId = userId;
    }
    
    if (dateFilter && dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch(dateFilter) {
        case '1day':
          const oneDayAgo = new Date(today);
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          dateQuery.startDate = { $gte: oneDayAgo };
          break;
        case '7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          dateQuery.startDate = { $gte: sevenDaysAgo };
          break;
        case '1month':
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          dateQuery.startDate = { $gte: oneMonthAgo };
          break;
        case '6months':
          const sixMonthsAgo = new Date(today);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          dateQuery.startDate = { $gte: sixMonthsAgo };
          break;
      }
    }

    // Get total tasks
    const totalTasks = await Task.countDocuments(dateQuery);

    // Get tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Convert the status array to an object format expected by the frontend
    const statusCounts = {};
    tasksByStatus.forEach(status => {
      if (status._id) {
        statusCounts[status._id] = status.count;
      }
    });

    // Get tasks by owner
    const tasksByOwner = await Task.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$owner', count: { $sum: 1 } } }
    ]);

    // Convert the owner array to an object format expected by the frontend
    const ownerDistribution = {};
    tasksByOwner.forEach(owner => {
      if (owner._id) {
        ownerDistribution[owner._id] = owner.count;
      }
    });

    // Calculate due date statistics
    const today = new Date();
    const allTasks = await Task.find(dateQuery);
    const dueDateStats = allTasks.reduce((acc, task) => {
      if (!task.dueDate) return acc;
      
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

    // Get tasks with due dates
    const tasksWithDueDates = await Task.countDocuments({
      ...dateQuery,
      dueDate: { $exists: true, $ne: null }
    });

    // Get tasks with comments
    const tasksWithComments = await Task.countDocuments({
      ...dateQuery,
      'comments.0': { $exists: true }
    });

    // Get tasks with awaiting comments
    const tasksWithAwaitingComments = await Task.countDocuments({
      ...dateQuery,
      'comments.awaiting': true
    });

    // Get average completion time
    const completedTasks = await Task.find({
      ...dateQuery,
      status: 'Completed'
    });

    let avgCompletionTime = 0;
    if (completedTasks.length > 0) {
      avgCompletionTime = completedTasks.reduce((acc, task) => {
        if (task.startDate && task.dueDate) {
          const completionTime = (task.dueDate - task.startDate) / (1000 * 60 * 60 * 24); // in days
          return acc + completionTime;
        }
        return acc;
      }, 0) / completedTasks.length;
    }

    // Calculate completion rate
    const completedTasksCount = statusCounts['Completed'] || 0;
    const completionRate = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;

    // Get average comments per task
    const totalComments = allTasks.reduce((sum, task) => sum + (task.comments?.length || 0), 0);
    const avgCommentsPerTask = totalTasks > 0 ? totalComments / totalTasks : 0;

    return NextResponse.json({
      totalTasks,
      statusCounts,
      ownerDistribution,
      dueDateStats,
      tasksWithDueDates,
      tasksWithComments,
      tasksWithAwaitingComments,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      completionRate,
      avgCommentsPerTask: Math.round(avgCommentsPerTask * 10) / 10
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
} 