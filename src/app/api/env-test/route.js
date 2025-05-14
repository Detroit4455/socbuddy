import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are loaded
  // Don't return the actual API key, just whether it exists
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    hasApiKey,
    nodeEnv: process.env.NODE_ENV,
    // List other non-sensitive env vars to debug
    envVarsLoaded: Object.keys(process.env).length > 0
  });
} 