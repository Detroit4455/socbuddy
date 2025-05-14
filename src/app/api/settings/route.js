import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const mongoose = require("mongoose");
const Setting = require("@/models/Setting");

// GET - get all settings or a specific setting by key
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role, except for certain settings that should be available to all users
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const category = searchParams.get('category');
    
    // Public settings that don't require admin access
    const publicSettings = ['habit_notifications_enabled'];
    
    if (!publicSettings.includes(key) && session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    if (key) {
      // Get a specific setting
      const setting = await Setting.findOne({ key });
      if (!setting) {
        return NextResponse.json({ key, found: false, value: null }, { status: 200 });
      }
      return NextResponse.json(setting);
    } else if (category) {
      // Get all settings in a category
      const settings = await Setting.find({ category }).sort({ key: 1 });
      return NextResponse.json(settings);
    } else {
      // Get all settings
      const settings = await Setting.find().sort({ category: 1, key: 1 });
      return NextResponse.json(settings);
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - update a setting or create if it doesn't exist
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await req.json();
    const { key, value, description, category } = data;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Use updateOne with upsert to create if it doesn't exist
    const result = await Setting.updateOne(
      { key },
      { 
        $set: { 
          value,
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          updatedBy: new ObjectId(session.user.id)
        } 
      },
      { upsert: true }
    );

    // Get the updated or created setting
    const updatedSetting = await Setting.findOne({ key });

    return NextResponse.json({ 
      success: true, 
      setting: updatedSetting,
      created: result.upsertedCount > 0,
      updated: result.modifiedCount > 0
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}

// DELETE - delete a setting (admin only)
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await req.json();
    const { key } = data;

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const result = await Setting.deleteOne({ key });

    return NextResponse.json({ 
      success: true, 
      deleted: result.deletedCount > 0
    });
  } catch (error) {
    console.error("Error deleting setting:", error);
    return NextResponse.json(
      { error: "Failed to delete setting" },
      { status: 500 }
    );
  }
} 