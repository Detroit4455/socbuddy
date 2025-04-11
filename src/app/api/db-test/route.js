const { NextResponse } = require('next/server');
const Task = require('@/models/Task');
const { connectDB } = require('@/lib/mongodb');

export async function GET(request) {
  try {
    // Test MongoDB connection
    await connectDB();
    
    // Get task count to verify we're connected to the database
    const taskCount = await Task.countDocuments();
    
    return NextResponse.json({
      status: 'success',
      message: 'MongoDB connection is working properly',
      taskCount: taskCount,
      connectionTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to connect to MongoDB',
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    // Create a test task
    const testTask = {
      name: 'Test Task ' + new Date().toISOString(),
      status: 'Pending',
      owner: 'System Test',
      detail: 'This is a test task created via the DB test endpoint',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      comments: []
    };
    
    const task = await Task.create(testTask);
    
    return NextResponse.json({
      status: 'success',
      message: 'Test task created successfully',
      task: task
    });
  } catch (error) {
    console.error('Error creating test task:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to create test task',
      error: error.message 
    }, { status: 500 });
  }
} 