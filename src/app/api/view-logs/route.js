import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Admin password (in a real app, this would be stored securely)
const ADMIN_PASSWORD = 'admin123';

export async function GET(request) {
  try {
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // If password provided, verify it (only when accessed from admin dashboard)
    if (password !== null && password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Determine log file path - updated to the correct location
    const logFilePath = path.join(process.cwd(), 'user_input.log');

    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json({ logs: [] });
    }

    // Read log file content
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    
    // Parse log lines into structured data
    const logs = logContent.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const parts = line.split(' | ');
        if (parts.length >= 3) {
          return {
            timestamp: parts[0],
            page: parts[1],
            query: parts[2].replace(/^"|"$/g, ''), // Remove surrounding quotes
            userAgent: parts.slice(3).join(' | ') // Rejoin the rest in case user agent contains pipes
          };
        }
        return null;
      })
      .filter(log => log !== null)
      .reverse(); // Most recent logs first

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve logs' },
      { status: 500 }
    );
  }
} 