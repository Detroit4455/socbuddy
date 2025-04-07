import { writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(request) {
  try {
    const tasks = await request.json();
    
    // Define the path to the JSON file
    const filePath = path.join(process.cwd(), 'public', 'data', 'tool_todo_manager.json');
    
    // Write the updated tasks to the file
    await writeFile(filePath, JSON.stringify(tasks, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save tasks' },
      { status: 500 }
    );
  }
} 