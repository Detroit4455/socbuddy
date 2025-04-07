import { NextResponse } from 'next/server';

async function followRedirects(url, maxRedirects = 10) {
  const redirects = [];
  let currentUrl = url;
  let finalUrl = url;
  let statusCode = 200;
  let redirectCount = 0;
  let finalResponse = null;

  const followRedirects = async (url) => {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    finalResponse = response;
    statusCode = response.status;
    const headers = Object.fromEntries(response.headers.entries());

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        redirects.push({
          from: url,
          to: location,
          status: response.status,
          headers: {
            location: location
          }
        });
        redirectCount++;
        return location;
      }
    }
    return null;
  };

  while (redirectCount < maxRedirects) {
    const nextUrl = await followRedirects(currentUrl);
    if (!nextUrl) break;
    currentUrl = nextUrl;
    finalUrl = currentUrl;
  }

  return {
    originalUrl: url,
    finalUrl,
    statusCode,
    redirectCount,
    redirects,
    headers: Object.fromEntries(finalResponse.headers.entries())
  };
}

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

    const result = await followRedirects(url);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process URL' },
      { status: 500 }
    );
  }
} 