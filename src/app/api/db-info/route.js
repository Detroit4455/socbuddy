const { NextResponse } = require('next/server');
const { connectDB, getDbInfo } = require('@/lib/mongodb');
const { getToken } = require('next-auth/jwt');

// Configure route to use dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    console.log("DB-INFO API: Request received");
    
    // Get the current user from the session to verify admin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log("DB-INFO API: Token retrieved", token ? "token exists" : "no token");

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    console.log("DB-INFO API: Password provided:", password ? "yes" : "no");
    
    // For security, only allow this for authenticated admins or with the correct password
    // In a real application, use a more secure authentication method
    const isAdmin = token?.role === 'admin';
    // Use a consistent password across the application (matches what's used in page-analytics)
    const correctPassword = password === '1234'; // This is just for demo, use a more secure approach
    
    if (!isAdmin && !correctPassword) {
      console.log("DB-INFO API: Unauthorized access attempt");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("DB-INFO API: Authorization successful, connecting to DB");
    // Connect to the database if not already connected
    await connectDB();
    
    // Get database information
    const dbInfo = getDbInfo();
    console.log("DB-INFO API: DB info retrieved:", dbInfo);
    
    return NextResponse.json({
      provider: dbInfo.provider,
      databaseName: dbInfo.name,
      host: dbInfo.host,
      connectionStatus: dbInfo.connectionStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DB-INFO API: Error fetching database info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch database information',
      message: error.message
    }, { status: 500 });
  }
} 