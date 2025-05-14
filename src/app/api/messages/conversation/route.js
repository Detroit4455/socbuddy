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
        JSON.stringify({ error: "You must be signed in to access messages" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    
    // Get the other user's ID
    const otherUserId = searchParams.get('otherUser');
    if (!otherUserId) {
      return new Response(
        JSON.stringify({ error: "Missing otherUser parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const before = searchParams.get('before'); // Timestamp for cursor-based pagination
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Verify the other user exists with flexible ID format
    const userQuery = {
      $or: [
        { _id: otherUserId },
        { _id: new ObjectId(otherUserId).toString() }
      ]
    };

    // For ObjectId compatibility, try/catch in case otherUserId is not a valid ObjectId
    try {
      userQuery.$or.push({ _id: new ObjectId(otherUserId) });
    } catch (e) {
      console.log('OtherUserId is not a valid ObjectId, continuing with string search');
    }
    
    const otherUser = await db.collection("users").findOne(userQuery);
    
    if (!otherUser) {
      console.error(`User not found with ID: ${otherUserId}`);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Use the consistent ID format for querying messages
    const otherUserIdFormatted = otherUser._id.toString();
    
    // Build query to fetch messages between users
    const query = {
      $or: [
        { senderId: userId, receiverId: otherUserIdFormatted },
        { senderId: otherUserIdFormatted, receiverId: userId }
      ]
    };
    
    // Add pagination if cursor is provided
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    // Fetch messages between the two users
    const messages = await db.collection("messages")
      .find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .toArray();
    
    // Check if there are more messages (for pagination)
    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[messages.length - 1].createdAt.toISOString() : null;
    
    // Format the response
    const formattedMessages = messages.map(message => ({
      id: message._id.toString(),
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      read: message.read,
      createdAt: message.createdAt
    }));
    
    // Get user info for display
    const partnerInfo = {
      id: otherUserIdFormatted,
      name: otherUser.name,
      username: otherUser.username,
      image: otherUser.image
    };
    
    return new Response(
      JSON.stringify({
        partner: partnerInfo,
        messages: formattedMessages.reverse(), // Send in chronological order
        hasMore,
        nextCursor
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch conversation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 