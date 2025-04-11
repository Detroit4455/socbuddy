const { NextResponse } = require('next/server');

export async function GET() {
  try {
    // Get statistics API response
    const statsResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/tasks/statistics?dateFilter=all`);
    const statsData = await statsResponse.json();
    
    // Check the structure of the statistics data
    const dataStructure = {
      received: statsData,
      properties: Object.keys(statsData),
      types: {},
      missingProps: [],
      requiredProps: [
        'totalTasks', 
        'statusCounts', 
        'ownerDistribution', 
        'dueDateStats',
        'completionRate', 
        'avgCommentsPerTask'
      ]
    };
    
    // Check the type of each property
    for (const prop in statsData) {
      dataStructure.types[prop] = typeof statsData[prop];
    }
    
    // Check for missing properties
    dataStructure.requiredProps.forEach(prop => {
      if (!(prop in statsData)) {
        dataStructure.missingProps.push(prop);
      }
    });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dataStructure,
      hasAllRequiredProps: dataStructure.missingProps.length === 0
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 