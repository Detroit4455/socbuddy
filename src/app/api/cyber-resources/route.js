import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CyberResource from '@/models/CyberResource';
import { getToken } from 'next-auth/jwt';

// Set dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// GET handler to fetch all resources or filter by query params
export async function GET(request) {
  try {
    // No authentication check for GET requests - cybersecurity resources are public
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'followCount'; // Default sort by followCount
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const skip = (page - 1) * limit;
    
    // Connect to database
    await connectToDatabase();
    
    // Build query based on filters
    let query = {};
    
    if (type && type !== 'All') {
      query.type = type;
    }
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      // Replace $text search with regex pattern matching across multiple fields
      const searchRegex = new RegExp(search, 'i'); // Case insensitive search
      query.$or = [
        { name: searchRegex },
        { details: searchRegex },
        { type: searchRegex },
        { category: searchRegex },
        { tags: searchRegex }
      ];
    }
    
    // Define sort options
    let sortOptions = {};
    if (sort === 'followCount') {
      sortOptions = { followCount: -1, name: 1 }; // Sort by followCount desc, then name asc
    } else if (sort === 'name') {
      sortOptions = { name: 1 };
    } else {
      sortOptions = { followCount: -1, name: 1 }; // Default sort
    }
    
    // Get total count for pagination
    const totalResources = await CyberResource.countDocuments(query);
    
    // Fetch resources with sorting and pagination
    const resources = await CyberResource.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalResources / limit);
    
    // Return resources with pagination metadata
    return NextResponse.json({
      resources,
      pagination: {
        page,
        limit,
        totalResources,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching cyber resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// Check if a resource is a duplicate
async function isDuplicate(resource) {
  // Check for duplicates based on URL or name
  const existingResource = await CyberResource.findOne({
    $or: [
      { url: resource.url },
      { name: resource.name }
    ]
  });
  
  return existingResource !== null;
}

// POST handler to create a new resource or bulk import resources
export async function POST(request) {
  try {
    // Check authentication and authorization
    const token = await getToken({ req: request });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Connect to database
    await connectToDatabase();
    
    // Check if it's a single resource or an array of resources
    if (Array.isArray(body)) {
      // Bulk import with duplicate checking
      const validResources = [];
      const skippedResources = [];
      
      // Check each resource for duplicates
      for (const resource of body) {
        const duplicate = await isDuplicate(resource);
        if (duplicate) {
          skippedResources.push({
            name: resource.name,
            url: resource.url,
            reason: 'Duplicate resource'
          });
        } else {
          validResources.push(resource);
        }
      }
      
      // Insert valid resources
      let insertedResources = [];
      if (validResources.length > 0) {
        insertedResources = await CyberResource.insertMany(validResources);
      }
      
      return NextResponse.json({
        inserted: insertedResources,
        skipped: skippedResources,
        stats: {
          total: body.length,
          inserted: insertedResources.length,
          skipped: skippedResources.length
        }
      }, { status: 201 });
    } else {
      // Single resource - check for duplicate
      const duplicate = await isDuplicate(body);
      
      if (duplicate) {
        return NextResponse.json(
          { error: 'Duplicate resource', details: 'A resource with this name or URL already exists' },
          { status: 409 }
        );
      }
      
      // Create new resource
      const resource = await CyberResource.create(body);
      return NextResponse.json(resource, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating cyber resource(s):', error);
    return NextResponse.json(
      { error: 'Failed to create resource(s)', details: error.message },
      { status: 500 }
    );
  }
} 