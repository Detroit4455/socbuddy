import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const url = new URL(request.url);
  const { pathname, hostname, protocol } = url;
  const isHabitSubdomain = hostname === 'habit.localhost' || hostname.startsWith('habit.');
  const isSecure = protocol === 'https:';

  // Helper function to create URLs that preserve protocol (http/https)
  const createUrl = (path) => {
    const newUrl = new URL(path, request.url);
    // Ensure protocol is preserved
    return newUrl;
  };
  
  // 1. Handling already authenticated users trying to access auth pages
  if (token && pathname.startsWith('/auth/')) {
    // If authenticated and trying to access auth pages, redirect appropriately
    if (isHabitSubdomain) {
      return NextResponse.redirect(createUrl('/habit-tracker'));
    }
    return NextResponse.redirect(createUrl('/dashboard'));
  }

  // 2. Handling public routes - allow access
  const publicRoutes = [
    '/auth/',
    '/api/auth/',
    '/todo-list-manager',
    '/api/tasks/guest-init',
    '/cybersecurity-resources',
    '/api/cyber-resources',
  ];
  
  if (publicRoutes.some(route => pathname.startsWith(route)) || 
      (pathname === '/api/tasks' && request.method === 'GET')) {
    return NextResponse.next();
  }
  
  // 3. Special case for habit subdomain root path
  if (isHabitSubdomain && pathname === '/' && !token) {
    const redirectUrl = createUrl('/auth/signin');
    // Store only the path, not the full URL to avoid encoding issues
    // For the habit subdomain, always preserve the domain in the callback
    if (isSecure) {
      // For HTTPS, ensure we use the secure protocol in the callback
      redirectUrl.searchParams.set('callbackUrl', `https://${hostname}/habit-tracker`);
    } else {
      redirectUrl.searchParams.set('callbackUrl', '/habit-tracker');
    }
    return NextResponse.redirect(redirectUrl);
  }
  
  // 4. API routes that require authentication but return JSON errors instead of redirects
  if (pathname.startsWith('/api/')) {
    // Skip authentication for public API routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 5. Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/administrator',
    '/admin',
    '/ai-buddy',
    '/habit-tracker',
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`));
  
  if (isProtectedRoute) {
    if (!token) {
      const redirectUrl = createUrl('/auth/signin');
      
      // For HTTPS or custom subdomains, preserve the domain in the callback
      if (isSecure || isHabitSubdomain) {
        redirectUrl.searchParams.set('callbackUrl', `${protocol}//${hostname}${pathname}`);
      } else {
        // Use simpler path-only redirects for regular HTTP
        redirectUrl.searchParams.set('callbackUrl', pathname);
      }
      
      return NextResponse.redirect(redirectUrl);
    }
    
    // Admin routes require admin role
    if ((pathname.startsWith('/administrator') || pathname.startsWith('/admin')) && 
        token.role !== 'admin') {
      const redirectUrl = createUrl('/dashboard');
      redirectUrl.searchParams.set('accessDenied', 'administrator');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 6. Allow all other routes
  return NextResponse.next();
}

// Specify which routes this middleware applies to
export const config = {
  matcher: [
    // Auth pages
    '/auth/:path*', 
    // Protected pages
    '/dashboard/:path*',
    '/todo-list-manager/:path*',
    '/administrator/:path*',
    '/admin/:path*',
    // AI Buddy pages and API
    '/ai-buddy/:path*',
    '/api/ai-buddy/:path*',
    // Habit tracker pages
    '/habit-tracker/:path*',
    // API routes
    '/api/:path*',
    // Home page also needs checking for session to update UI
    '/'
  ],
}; 