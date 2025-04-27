import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Allow authentication routes
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    // If user is already logged in and tries to access auth pages, redirect to dashboard
    if (token && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Allow access to todo-list-manager page without auth (login will be required for specific actions)
  if (pathname === '/todo-list-manager' || pathname === '/todo-list-manager/') {
    return NextResponse.next();
  }

  // Allow GET requests to specific API endpoints for non-signed in users
  if ((pathname === '/api/tasks' && request.method === 'GET') ||
      pathname === '/api/tasks/guest-init') {
    console.log(`[Middleware] Allowing access to ${pathname} for guest user`);
    return NextResponse.next();
  }

  // Protect API routes for tasks (POST, PUT, DELETE)
  if (pathname.startsWith('/api/tasks')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect dashboard, admin, and other sensitive pages
  const protectedPaths = ['/dashboard', '/administrator', '/admin'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    if (!token) {
      // Create URL to redirect to after login
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('callbackUrl', pathname);

      return NextResponse.redirect(redirectUrl);
    }

    // Check for admin paths
    if ((pathname.startsWith('/administrator') || pathname.startsWith('/admin')) && token.role !== 'admin') {
      // Redirect to dashboard with an access denied message
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('accessDenied', 'administrator');
      return NextResponse.redirect(redirectUrl);
    }
  }

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
    // Home page also needs checking for session to update UI
    '/'
  ],
}; 