import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const mongoose = require("mongoose");
const Notification = require("@/models/Notification");

// GET - get all notifications for the current user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const read = searchParams.get("read");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    console.log("📋 GET /api/notifications:", { userId, type, read, limit });

    await mongoose.connect(process.env.MONGODB_URI);

    // Build the query
    const query = { recipientId: new ObjectId(userId) };
    
    if (type) {
      query.type = type;
    }
    
    if (read !== null) {
      query.read = read === "true";
    }

    console.log("📋 Notification query:", JSON.stringify(query));

    const count = await Notification.countDocuments(query);
    console.log("📋 Total matching notifications in DB:", count);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    console.log("📋 Notifications returned:", notifications.length);
    
    // If no notifications are found, perform a broader search to check if any exist
    if (notifications.length === 0) {
      console.log("📋 No notifications found with filter. Checking if any notifications exist for this user.");
      const anyNotifications = await Notification.countDocuments({ recipientId: new ObjectId(userId) });
      console.log("📋 Total notifications for this user (unfiltered):", anyNotifications);
      
      // Check if any notifications exist at all in the collection
      const totalCount = await Notification.estimatedDocumentCount();
      console.log("📋 Total notifications in collection:", totalCount);
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("📋 Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PUT - mark notifications as read
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();
    const { notificationIds, allUnread } = data;

    await mongoose.connect(process.env.MONGODB_URI);

    let updateResult;

    if (allUnread) {
      // Mark all unread notifications as read
      updateResult = await Notification.updateMany(
        { recipientId: new ObjectId(userId), read: false },
        { $set: { read: true } }
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      updateResult = await Notification.updateMany(
        {
          _id: { $in: notificationIds.map(id => new ObjectId(id)) },
          recipientId: new ObjectId(userId)
        },
        { $set: { read: true } }
      );
    } else {
      return NextResponse.json(
        { error: "Either notificationIds array or allUnread flag is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      modified: updateResult.modifiedCount 
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// DELETE - delete notifications
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();
    const { notificationId, allRead, allNotifications } = data;

    console.log("🗑️ DELETE /api/notifications:", { userId, notificationId, allRead, allNotifications });

    await mongoose.connect(process.env.MONGODB_URI);

    let deleteResult;

    if (allNotifications) {
      // Delete ALL notifications for this user (both read and unread)
      console.log("🗑️ Deleting ALL notifications for user:", userId);
      deleteResult = await Notification.deleteMany({
        recipientId: new ObjectId(userId)
      });
    } else if (allRead) {
      // Delete all read notifications
      console.log("🗑️ Deleting all READ notifications for user:", userId);
      deleteResult = await Notification.deleteMany({
        recipientId: new ObjectId(userId),
        read: true
      });
    } else if (notificationId) {
      // Delete a specific notification
      console.log("🗑️ Deleting single notification:", notificationId);
      deleteResult = await Notification.deleteOne({
        _id: new ObjectId(notificationId),
        recipientId: new ObjectId(userId)
      });
    } else {
      return NextResponse.json(
        { error: "Either notificationId, allRead, or allNotifications flag is required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Delete result:", deleteResult);

    return NextResponse.json({ 
      success: true, 
      deleted: deleteResult.deletedCount 
    });
  } catch (error) {
    console.error("🗑️ Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
} 