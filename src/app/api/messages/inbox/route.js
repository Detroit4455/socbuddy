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
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Handle different ID formats with an $or query
    const userIdQuery = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };

    // Try to also search for ObjectId version
    try {
      const objId = new ObjectId(userId);
      const objIdStr = objId.toString();
      
      // Only add these if they're different from the string version
      if (objIdStr !== userId) {
        userIdQuery.$or.push({ senderId: objIdStr });
        userIdQuery.$or.push({ receiverId: objIdStr });
      }
    } catch (e) {
      // Not a valid ObjectId, continue with just string
      console.log('User ID is not a valid ObjectId, continuing with string search');
    }
    
    // Fetch conversations grouped by partner
    const pipeline = [
      // Match messages where the current user is either sender or receiver
      {
        $match: userIdQuery
      },
      // Sort to get newest messages first
      { $sort: { createdAt: -1 } },
      // Create a field to identify the conversation partner
      {
        $addFields: {
          conversationPartnerId: {
            $cond: {
              if: { 
                $or: [
                  { $eq: ["$senderId", userId] },
                  // Try to match different ID formats
                  { $eq: ["$senderId", { $toString: { $toObjectId: userId } }] }
                ]
              },
              then: "$receiverId",
              else: "$senderId"
            }
          }
        }
      },
      // Group by conversation partner to get latest message
      {
        $group: {
          _id: "$conversationPartnerId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { 
                    $or: [
                      { $eq: ["$receiverId", userId] },
                      // Try to match different ID formats
                      { $eq: ["$receiverId", { $toString: { $toObjectId: userId } }] }
                    ] 
                  },
                  { $eq: ["$read", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      // Sort conversations by the timestamp of the last message
      { $sort: { "lastMessage.createdAt": -1 } },
      // Limit number of conversations returned
      { $limit: limit },
      // Get user information for conversation partner
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      // If no match, try with string conversion
      {
        $lookup: {
          from: "users",
          let: { partner_id: "$_id" },
          pipeline: [
            { 
              $match: {
                $expr: {
                  $eq: [{ $toString: "$_id" }, "$$partner_id"]
                }
              }
            }
          ],
          as: "userFromString"
        }
      },
      // Unwind the user arrays
      { 
        $addFields: {
          combinedUsers: {
            $concatArrays: ["$user", "$userFromString"]
          }
        }
      },
      {
        $unwind: { 
          path: "$combinedUsers", 
          preserveNullAndEmptyArrays: true 
        }
      },
      // Reshape the output
      {
        $project: {
          _id: 0,
          conversationId: "$_id",
          partner: {
            id: "$_id",
            name: { $ifNull: ["$combinedUsers.name", "Unknown User"] },
            username: { $ifNull: ["$combinedUsers.username", "unknown"] },
            image: "$combinedUsers.image"
          },
          lastMessage: {
            id: "$lastMessage._id",
            content: "$lastMessage.content",
            senderId: "$lastMessage.senderId",
            receiverId: "$lastMessage.receiverId",
            read: "$lastMessage.read",
            createdAt: "$lastMessage.createdAt"
          },
          unreadCount: 1
        }
      }
    ];

    const conversations = await db.collection("messages").aggregate(pipeline).toArray();
    
    return new Response(
      JSON.stringify({ conversations }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch inbox" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 