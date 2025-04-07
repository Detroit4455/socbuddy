import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for storing analytics data
const ANALYTICS_FILE = path.join(process.cwd(), 'analytics-data.json');

// Function to load analytics data from file
function loadAnalyticsData() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readFileSync(ANALYTICS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading analytics data:', error);
  }
  
  // Default data if file doesn't exist or has issues
  return {
    '/': 0,
    '/base64': 0,
    '/grabRedirectUrl': 0,
    '/indicator-extractor': 0,
  };
}

// Function to save analytics data to file
function saveAnalyticsData(data) {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving analytics data:', error);
  }
}

// Load initial data
let pageHits = loadAnalyticsData();

export async function POST(request) {
  try {
    const body = await request.json();
    const { page, action, password } = body;
    
    // Validate request
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    // Track page hit
    if (action === 'track') {
      if (!page) {
        return NextResponse.json(
          { error: 'Page is required for track action' },
          { status: 400 }
        );
      }
      
      // Initialize the page counter if it doesn't exist
      if (pageHits[page] === undefined) {
        pageHits[page] = 0;
      }
      
      // Increment the counter
      pageHits[page]++;
      
      // Save to file for persistence
      saveAnalyticsData(pageHits);
      
      return NextResponse.json({ success: true });
    }
    
    // Reset all analytics data
    if (action === 'reset') {
      // Check for password
      if (password !== '1234') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Reset to default values
      pageHits = {
        '/': 0,
        '/base64': 0,
        '/grabRedirectUrl': 0,
        '/indicator-extractor': 0,
      };
      
      // Save to file
      saveAnalyticsData(pageHits);
      
      return NextResponse.json({ success: true, message: 'Analytics data reset successfully' });
    }
    
    // Return error for unknown action
    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in page analytics:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Reload from file to ensure we have the latest data
    pageHits = loadAnalyticsData();
    
    // Check for password in query parameters
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    
    if (password !== '1234') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Return all page hits
    return NextResponse.json(pageHits);
  } catch (error) {
    console.error('Error retrieving analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
} 