import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CyberResource from '@/models/CyberResource';
import { getToken } from 'next-auth/jwt';

// Set dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// GET handler to fetch a specific resource by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Connect to database
    await connectToDatabase();
    
    // Fetch resource
    const resource = await CyberResource.findById(id);
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error fetching cyber resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

// PUT handler to update a resource
export async function PUT(request, { params }) {
  try {
    // Check authentication and authorization
    const token = await getToken({ req: request });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Connect to database
    await connectToDatabase();
    
    // Update resource
    const resource = await CyberResource.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error updating cyber resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a resource
export async function DELETE(request, { params }) {
  try {
    // Check authentication and authorization
    const token = await getToken({ req: request });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Connect to database
    await connectToDatabase();
    
    // Delete resource
    const resource = await CyberResource.findByIdAndDelete(id);
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cyber resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
} 