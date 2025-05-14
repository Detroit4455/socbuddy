import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({ error: "You must be signed in to update messages" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;
    const { messageIds, conversationPartnerId } = await req.json();
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Validate input
    if (conversationPartnerId && !Array.isArray(messageIds)) {
      // Handle different ID formats for the conversation partner
      let partnerIdQuery;
      try {
        partnerIdQuery = {
          $or: [
            { senderId: conversationPartnerId },
            { senderId: new ObjectId(conversationPartnerId).toString() }
          ]
        };
        
        // Add ObjectId format if valid
        try {
          partnerIdQuery.$or.push({ senderId: new ObjectId(conversationPartnerId) });
        } catch (e) {
          // Not a valid ObjectId, continue with string
          console.log('Partner ID is not a valid ObjectId, continuing with string search');
        }
      } catch (error) {
        // Fallback to just using the ID as-is
        partnerIdQuery = { senderId: conversationPartnerId };
      }
      
      // Mark all unread messages from a specific sender as read
      const result = await db.collection("messages").updateMany(
        { 
          ...partnerIdQuery, 
          receiverId: userId, 
          read: false 
        },
        { $set: { read: true } }
      );
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          modifiedCount: result.modifiedCount 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Handle specific message IDs
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing messageIds" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Convert messageIds to ObjectIds, handling any invalid IDs
    const objectIds = messageIds.filter(id => id).map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        console.log(`Invalid ObjectId: ${id}, skipping...`);
        return null;
      }
    }).filter(id => id !== null);
    
    if (objectIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid message IDs provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Ensure user can only mark messages they received as read
    const result = await db.collection("messages").updateMany(
      { 
        _id: { $in: objectIds }, 
        receiverId: userId 
      },
      { $set: { read: true } }
    );
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        modifiedCount: result.modifiedCount 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return new Response(
      JSON.stringify({ error: "Failed to mark messages as read" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 