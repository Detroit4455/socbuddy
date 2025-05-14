import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import { rateLimit } from "@/lib/rate-limit";
import { ObjectId } from "mongodb";

// Implement rate limiting - 20 messages per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  limit: 20,
});

export async function POST(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({ error: "You must be signed in to send messages" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    try {
      await limiter.check(20, session.user.id);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { receiverId, content } = await req.json();
    const senderId = session.user.id;

    // Input validation
    if (!receiverId || !content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: "Receiver ID and message content are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (content.trim().length === 0 || content.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Message must be between 1 and 2000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (senderId === receiverId) {
      return new Response(
        JSON.stringify({ error: "You cannot send messages to yourself" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Verify that the receiver exists
    // Try multiple ID formats (string ID, ObjectId)
    const query = {
      $or: [
        { _id: receiverId },
        { _id: new ObjectId(receiverId).toString() }
      ]
    };

    // For ObjectId compatibility, try/catch in case receiverId is not a valid ObjectId
    try {
      query.$or.push({ _id: new ObjectId(receiverId) });
    } catch (e) {
      console.log('ReceiverID is not a valid ObjectId, continuing with string search');
    }

    const receiver = await db.collection("users").findOne(query);

    if (!receiver) {
      console.error(`Receiver not found with ID: ${receiverId}`);
      return new Response(
        JSON.stringify({ error: "Receiver not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create and save the message
    const message = new Message({
      senderId,
      receiverId: receiver._id.toString(), // Ensure consistent ID format
      content: content.trim(),
      createdAt: new Date(),
      read: false
    });

    await message.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: message
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send message" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 