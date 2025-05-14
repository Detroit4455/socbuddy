import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CyberResource from '@/models/CyberResource';
import mongoose from 'mongoose';

// Set dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// POST handler to increment follow/like count
export async function POST(request, { params }) {
  console.log('Follow API called with params:', params);
  
  try {
    // No authentication check - allow likes from non-authenticated users
    
    const { id } = params;
    console.log('Resource ID to follow:', id);
    
    // Validate the ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ID format:', id);
      return NextResponse.json(
        { error: 'Invalid resource ID format' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    console.log('Connected to database');
    
    // First check if resource exists
    const resourceExists = await CyberResource.findById(id);
    if (!resourceExists) {
      console.log('Resource not found with ID:', id);
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    // Find and increment the followCount field
    const resource = await CyberResource.findByIdAndUpdate(
      id,
      { $inc: { followCount: 1 } },
      { new: true } // Return the updated document
    );
    
    console.log('Updated resource:', resource ? resource._id : 'not found');
    console.log('New follow count:', resource.followCount);
    
    if (!resource) {
      console.log('Resource not found');
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    
    console.log('Returning success with followCount:', resource.followCount);
    return NextResponse.json({ 
      success: true, 
      followCount: resource.followCount 
    });
  } catch (error) {
    console.error('Error incrementing follow count:', error);
    return NextResponse.json(
      { error: `Failed to update follow count: ${error.message}` },
      { status: 500 }
    );
  }
} 