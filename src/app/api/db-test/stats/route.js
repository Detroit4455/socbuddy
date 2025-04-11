const { NextResponse } = require('next/server');
const { connectDB } = require('@/lib/mongodb');
const Task = require('@/models/Task');

export async function GET() {
  try {
    await connectDB();
    
    // Test basic MongoDB statistics operations
    const totalTasks = await Task.countDocuments();
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get tasks created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTasks = await Task.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    return NextResponse.json({
      success: true,
      message: "MongoDB statistics operations working properly",
      data: {
        totalTasks,
        tasksByStatus,
        recentTasks,
        testTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Statistics test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 