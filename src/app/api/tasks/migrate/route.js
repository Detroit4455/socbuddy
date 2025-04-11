const { NextResponse } = require('next/server');
const mongoose = require('mongoose');
const { connectDB } = require('@/lib/mongodb');
const Task = require('@/models/Task');
const User = require('@/models/User');
const { getToken } = require('next-auth/jwt');

// This endpoint will migrate existing tasks to associate them with users
// It should only be accessible to admins
export async function POST(request) {
  try {
    await connectDB();
    
    // Verify that the request is from an admin
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
    
    // Find all tasks that don't have a userId
    const tasksWithoutUser = await Task.find({ userId: { $exists: false } });
    
    // Get all users to map tasks by owner name to user ID
    const users = await User.find({});
    const userMap = {};
    
    users.forEach(user => {
      userMap[user.username] = user._id.toString();
    });
    
    // For each task, find a matching user by owner name
    const updateResults = [];
    let defaultAdmin = null;
    
    // Find the first admin user to use as a fallback
    for (const user of users) {
      if (user.role === 'admin') {
        defaultAdmin = user._id.toString();
        break;
      }
    }
    
    // If no admin, use the first user
    if (!defaultAdmin && users.length > 0) {
      defaultAdmin = users[0]._id.toString();
    }
    
    for (const task of tasksWithoutUser) {
      let userId = userMap[task.owner] || defaultAdmin;
      
      if (!userId) {
        updateResults.push({
          taskId: task._id.toString(),
          status: 'skipped',
          reason: 'No matching user and no default user available'
        });
        continue;
      }
      
      try {
        await Task.findByIdAndUpdate(task._id, { userId });
        updateResults.push({
          taskId: task._id.toString(),
          owner: task.owner,
          matchedUserId: userId,
          status: 'updated'
        });
      } catch (error) {
        updateResults.push({
          taskId: task._id.toString(),
          status: 'error',
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      totalProcessed: tasksWithoutUser.length,
      results: updateResults
    });
  } catch (error) {
    console.error('Task migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 