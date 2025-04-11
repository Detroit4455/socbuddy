const { NextResponse } = require('next/server');
const { connectDB } = require('@/lib/mongodb');
const Task = require('@/models/Task');

export async function GET() {
  try {
    await connectDB();
    
    // Create a test task
    const testTask = {
      name: `Test Task ${new Date().toISOString()}`,
      status: 'Pending',
      owner: 'System Tester',
      detail: 'This is a test task to verify MongoDB connection',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      comments: [{
        text: 'This is a test comment',
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
        awaiting: false
      }]
    };
    
    const createdTask = await Task.create(testTask);
    
    return NextResponse.json({
      success: true,
      message: "Test task created successfully in MongoDB",
      task: createdTask
    });
  } catch (error) {
    console.error('Task creation test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 