import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

const mongoose = require("mongoose");
const Setting = require("@/models/Setting");

const NOTIFICATION_SETTING_KEY = "habit_notifications_enabled";

// GET - Get habit notification settings
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("⚙️ Fetching notification settings for user:", session.user.id);
    
    await mongoose.connect(process.env.MONGODB_URI);

    // Find the setting or create with default value if it doesn't exist
    let setting = await Setting.findOne({ key: NOTIFICATION_SETTING_KEY });
    
    console.log("⚙️ Retrieved setting from database:", setting);
    
    if (!setting) {
      console.log("⚙️ Setting not found, using default (enabled)");
      // Default to enabled if setting doesn't exist
      setting = {
        key: NOTIFICATION_SETTING_KEY,
        value: true,
        description: "Enable/disable habit completion notifications"
      };
    } else {
      // Ensure value is explicitly boolean
      console.log("⚙️ Original value type:", typeof setting.value);
      console.log("⚙️ Original value:", setting.value);
      
      // Convert to boolean if not already
      if (typeof setting.value !== 'boolean') {
        setting.value = setting.value === true || setting.value === 'true' || setting.value === 1;
        console.log("⚙️ Converted to boolean:", setting.value);
      }
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification settings: " + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update habit notification settings (admin only)
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await req.json();
    const { enabled } = data;
    
    console.log("⚙️ Updating notification settings:", { enabled, userId: session.user.id });

    if (enabled === undefined) {
      console.log("⚙️ Error: enabled status is required");
      return NextResponse.json(
        { error: "Enabled status is required" },
        { status: 400 }
      );
    }

    // Explicitly convert to boolean
    const enabledBool = enabled === true || enabled === "true" || enabled === 1;
    console.log("⚙️ Converted to boolean:", enabledBool);
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    try {
      // Log the value we're trying to save
      console.log("⚙️ Saving setting with value:", enabledBool);
      
      // First find if the setting already exists
      let settingDoc = await Setting.findOne({ key: NOTIFICATION_SETTING_KEY });
      
      if (settingDoc) {
        console.log("⚙️ Found existing setting, updating...");
        // Update existing document
        settingDoc.value = enabledBool;
        settingDoc.description = "Enable/disable habit completion notifications";
        settingDoc.category = "notifications";
        settingDoc.updatedBy = new mongoose.Types.ObjectId(session.user.id);
        settingDoc.updatedAt = new Date();
        
        await settingDoc.save();
      } else {
        console.log("⚙️ Setting not found, creating new...");
        // Create new document
        settingDoc = new Setting({
          key: NOTIFICATION_SETTING_KEY,
          value: enabledBool,
          description: "Enable/disable habit completion notifications",
          category: "notifications",
          updatedBy: new mongoose.Types.ObjectId(session.user.id)
        });
        
        await settingDoc.save();
      }
      
      // Get the updated setting to verify it was saved correctly
      const updatedSetting = await Setting.findOne({ key: NOTIFICATION_SETTING_KEY });
      console.log("⚙️ Updated setting:", updatedSetting);
      
      if (updatedSetting) {
        console.log("⚙️ Saved value type:", typeof updatedSetting.value);
        console.log("⚙️ Saved value:", updatedSetting.value);
      }

      return NextResponse.json({
        success: true,
        setting: updatedSetting,
        requested: enabledBool
      });
    } catch (dbError) {
      console.error("⚙️ Database error:", dbError);
      throw dbError; // Re-throw to be caught by the outer try/catch
    }
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings: " + error.message },
      { status: 500 }
    );
  }
} 