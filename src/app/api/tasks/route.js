const { NextResponse } = require('next/server');
const Task = require('@/models/Task');
const { connectDB } = require('@/lib/mongodb');
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
    const userProfile = token?.userProfile || 'work';
    const isGuest = !userId; // Flag to identify guest users
    
    console.log(`[Tasks API] User authentication status: ${isGuest ? 'Guest' : 'Authenticated'}`);
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFilter = searchParams.get('dateFilter');
    const searchTerm = searchParams.get('searchTerm');
    const profile = searchParams.get('profile') || userProfile;

    let query = {};
    
    // For non-signed in users, only show tasks with owner="guest"
    // For logged-in users, only show their tasks based on profile
    if (userId) {
      query.userId = userId;
      query.userProfile = profile;
      console.log(`[Tasks API] Filtering tasks for userId: ${userId}, profile: ${profile}`);
    } else {
      query.owner = "guest";
      console.log(`[Tasks API] Filtering tasks for guest users (owner='guest')`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status;
      console.log(`[Tasks API] Applying status filter: ${status}`);
    }

    // Apply date filter
    if (dateFilter && dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch(dateFilter) {
        case '1day':
          const oneDayAgo = new Date(today);
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          query.startDate = { $gte: oneDayAgo };
          break;
        case '7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          query.startDate = { $gte: sevenDaysAgo };
          break;
        case '1month':
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          query.startDate = { $gte: oneMonthAgo };
          break;
        case '6months':
          const sixMonthsAgo = new Date(today);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          query.startDate = { $gte: sixMonthsAgo };
          break;
      }
    }

    // Apply search filter
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { status: { $regex: searchTerm, $options: 'i' } },
        { owner: { $regex: searchTerm, $options: 'i' } },
        { detail: { $regex: searchTerm, $options: 'i' } },
        { 'comments.text': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    console.log(`[Tasks API] Found ${tasks.length} tasks matching query`);
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Get the current user from the session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Add the userId, userProfile, and profile_used to the task
    if (token?.id) {
      const userProfile = token.userProfile || 'work';
      body.userId = token.id;
      body.userProfile = userProfile;
      body.profile_used = `${userProfile} profile`;
      console.log(`[Tasks API] Creating task with profile_used: ${body.profile_used}`);
    }
    
    const task = await Task.create(body);
    console.log(`[Tasks API] Task created with ID: ${task._id}, profile_used: ${task.profile_used}`);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { _id, ...updateData } = await request.json();
    
    // Get the current user from the session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Find the task to ensure it belongs to the current user
    const task = await Task.findById(_id);
    
    // Prevent users from updating tasks they don't own
    if (token?.id && task.userId && task.userId !== token.id) {
      return NextResponse.json({ error: 'Unauthorized to update this task' }, { status: 403 });
    }
    
    const updatedTask = await Task.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { _id } = await request.json();
    
    // Get the current user from the session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Find the task to ensure it belongs to the current user
    const task = await Task.findById(_id);
    
    // Prevent users from deleting tasks they don't own
    if (token?.id && task.userId && task.userId !== token.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this task' }, { status: 403 });
    }
    
    await Task.findByIdAndDelete(_id);
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 