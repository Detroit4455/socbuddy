import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// Mark this API route as dynamic
export const dynamic = 'force-dynamic';

// GET - Retrieve all users that can be invited to marathons
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Get searchParams from URL
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const idsParam = searchParams.get('ids');
    
    let filter = {};
    if (idsParam) {
      // Fetch by IDs
      const ids = idsParam.split(',').map(id => new ObjectId(id));
      filter._id = { $in: ids };
    } else if (search) {
      filter.username = { $regex: search, $options: 'i' };
      filter._id = { $ne: session.user.id };
    } else {
      filter._id = { $ne: session.user.id };
    }
    
    // Get users matching the filter
    const users = await db
      .collection("users")
      .find(filter)
      .project({ _id: 1, username: 1, email: 1 }) // Only return these fields
      .limit(20)
      .sort({ username: 1 })
      .toArray();
    
    // Transform _id to id for consistency
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email
    }));
    
    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
} 

// PUT - Update user details
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const body = await req.json();
    const { phoneNumber } = body;

    // Update user details
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { phoneNumber } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
} 