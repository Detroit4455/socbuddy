import { NextResponse } from 'next/server';
import { logUserInput } from '../../utils/logger';

export async function POST(request) {
  try {
    const body = await request.json();
    const { input, source, success = true, errorMessage = '' } = body;
    
    if (!input || !source) {
      return NextResponse.json(
        { error: 'Input and source are required' },
        { status: 400 }
      );
    }
    
    // Get user IP from the request headers (set by middleware)
    const userIp = request.headers.get('x-user-ip') || 'unknown';
    
    // Log the user input with status and error message
    await logUserInput(input, userIp, source, success, errorMessage);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging input:', error);
    return NextResponse.json(
      { error: 'Failed to log input' },
      { status: 500 }
    );
  }
} 