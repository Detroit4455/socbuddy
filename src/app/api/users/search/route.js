import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({ error: "You must be signed in to search users" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get search query from URL parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Search query must be at least 2 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Create exclude current user query with multiple ID formats
    const currentUserIdQuery = { $ne: session.user.id };
    
    // Try to create alternative ID formats for exclusion
    const excludeUserIds = [session.user.id];
    
    // Try ObjectId version too
    try {
      const objId = new ObjectId(session.user.id);
      excludeUserIds.push(objId); 
      excludeUserIds.push(objId.toString());
    } catch (e) {
      console.log('User ID is not a valid ObjectId');
    }
    
    // Search users by name or username
    const users = await db.collection("users").find({
      $and: [
        { _id: { $nin: excludeUserIds } }, // Exclude current user with all formats
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .project({
      _id: 1,
      name: 1,
      username: 1,
      image: 1,
      email: 1,
      role: 1
    })
    .limit(20)
    .toArray();
    
    // Make sure all user IDs are strings for consistent frontend handling
    const formattedUsers = users.map(user => ({
      ...user,
      _id: user._id.toString(),
      // Remove sensitive fields if not needed
      ...(user.email && { email: user.email.replace(/^(.{2})(.*)@(.{2})(.*)$/, '$1****@$3****') })
    }));
    
    return new Response(
      JSON.stringify({ users: formattedUsers }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error searching users:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search users" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 