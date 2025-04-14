const { NextResponse } = require('next/server');
const Task = require('@/models/Task');
const { connectDB } = require('@/lib/mongodb');

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await connectDB();
    
    // Check if guest tasks already exist
    const existingGuestTasks = await Task.find({ owner: 'guest' });
    
    console.log(`[Guest Tasks] Found ${existingGuestTasks.length} existing guest tasks`);
    
    if (existingGuestTasks.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Guest tasks already exist",
        count: existingGuestTasks.length,
        tasks: existingGuestTasks
      });
    }
    
    // Create sample guest tasks
    const guestTasks = [
      {
        name: 'Welcome to Task Manager',
        status: 'Completed',
        owner: 'guest',
        userId: 'guest',
        detail: 'This is a sample task for guest users. You are viewing the application in guest mode. Sign in to create and manage your own tasks!',
        startDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        comments: [{
          text: 'Welcome! This task manager helps you organize your work efficiently.',
          date: new Date().toLocaleString(),
          timestamp: Date.now(),
          awaiting: false
        }]
      },
      {
        name: 'Learn Task Manager Features',
        status: 'In Progress',
        owner: 'guest',
        userId: 'guest',
        detail: 'As a guest, you can browse tasks but cannot create or edit them. Sign in to access all features!',
        startDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        comments: []
      },
      {
        name: 'Create Your Account',
        status: 'Pending',
        owner: 'guest',
        userId: 'guest',
        detail: 'Click the Sign In link to create your own account and start managing your personal tasks.',
        startDate: new Date(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        comments: []
      }
    ];
    
    console.log(`[Guest Tasks] Creating ${guestTasks.length} new guest tasks`);
    
    // Insert all guest tasks
    const createdTasks = await Task.insertMany(guestTasks);
    
    console.log(`[Guest Tasks] Successfully created ${createdTasks.length} guest tasks`);
    
    return NextResponse.json({
      success: true,
      message: "Guest tasks created successfully",
      count: createdTasks.length,
      tasks: createdTasks
    });
  } catch (error) {
    console.error('[Guest Tasks] Error creating guest tasks:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 