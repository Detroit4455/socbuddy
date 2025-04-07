import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to the log file
const LOG_FILE = path.join(process.cwd(), 'user_input.log');

export async function GET(request) {
  try {
    // Check for password in query parameters
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    
    if (password !== '1234') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if log file exists
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ logs: [], total: 0, page, limit });
    }
    
    // Read log file
    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    
    // Split log entries by delimiter and filter out empty entries
    const allLogEntries = logContent
      .split('++++++++++++++++++++++++++++++++++++++++++++')
      .filter(entry => entry.trim())
      .map(entry => entry.trim())
      .reverse(); // Reverse the array to get newest logs first
    
    // Filter logs by search term if provided
    const filteredLogs = search 
      ? allLogEntries.filter(log => log.toLowerCase().includes(search.toLowerCase()))
      : allLogEntries;
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get logs for the current page
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    // Return log entries with pagination info
    return NextResponse.json({
      logs: paginatedLogs,
      total: filteredLogs.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLogs.length / limit)
    });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve logs' },
      { status: 500 }
    );
  }
} 