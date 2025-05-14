import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
const User = require("@/models/User");
const Setting = require("@/models/Setting");

// Constants
const ROLES_SETTING_KEY = "rbac_roles";

// PUT - Update a user's role
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await req.json();
    const { userId, role } = data;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Validate that the role exists in settings
    const rolesSetting = await Setting.findOne({ key: ROLES_SETTING_KEY });
    
    // Default roles if not found in settings
    const validRoles = rolesSetting?.value || ['admin', 'user', 'premium', 'manager'];
    
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent changing own role (admin can't demote themselves)
    if (userId === session.user.id && role !== 'admin') {
      return NextResponse.json({ 
        error: "You cannot change your own admin role" 
      }, { status: 400 });
    }

    // Update the user's role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
} 