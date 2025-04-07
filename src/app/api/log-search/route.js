import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { query, page, timestamp } = data;

    if (!query || !page) {
      return NextResponse.json(
        { error: 'Query and page are required' },
        { status: 400 }
      );
    }

    const logEntry = {
      query,
      page,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'Unknown',
    };

    // Format the log entry as a string
    const logString = `${logEntry.timestamp} | ${logEntry.page} | "${logEntry.query}" | ${logEntry.userAgent}\n`;

    // Determine log file path - changed to root of the app
    const logFilePath = path.join(process.cwd(), 'user_input.log');

    // Append to log file
    fs.appendFileSync(logFilePath, logString);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging search:', error);
    return NextResponse.json(
      { error: 'Failed to log search' },
      { status: 500 }
    );
  }
} 