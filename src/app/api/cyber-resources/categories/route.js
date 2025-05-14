import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CyberResource from '@/models/CyberResource';

// Set dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// GET handler to fetch unique types and categories
export async function GET() {
  try {
    // No authentication check - categories are public data
    
    // Connect to database
    await connectToDatabase();
    
    // Get unique types
    const types = await CyberResource.distinct('type');
    
    // Get unique categories
    const categories = await CyberResource.distinct('category');
    
    return NextResponse.json({
      types: ['All', ...types].sort(),
      categories: ['All', ...categories].sort()
    });
  } catch (error) {
    console.error('Error fetching cyber resource categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 