import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the user's IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  // Determine the IP - use x-forwarded-for or x-real-ip or default to unknown
  const ip = (forwarded ? forwarded.split(',')[0] : realIp) || 'unknown';
  
  // Clone the request headers and add the IP
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-ip', ip);
  
  // Return response with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Only run this middleware on API routes
export const config = {
  matcher: '/api/:path*',
}; 