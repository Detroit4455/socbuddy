import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get content type
    const contentType = response.headers.get('content-type');
    
    // Handle different content types
    let content;
    if (contentType?.includes('text/html')) {
      content = await response.text();
    } else if (contentType?.includes('application/json')) {
      content = JSON.stringify(await response.json());
    } else {
      content = await response.text();
    }

    return NextResponse.json({
      content,
      contentType,
      status: response.status,
      url: response.url // Final URL after any redirects
    });

  } catch (error) {
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch URL content' },
      { status: 500 }
    );
  }
} 