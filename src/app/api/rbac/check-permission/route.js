import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
const Setting = require("@/models/Setting");

// POST - Check if user has a specific permission
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ hasPermission: false, error: "Authentication required" }, { status: 401 });
    }

    const data = await req.json();
    const { permission } = data;

    if (!permission) {
      return NextResponse.json({ hasPermission: false, error: "Permission name is required" }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get user role
    const userRole = session.user.role || 'user';
    
    // Special case: admin always has all permissions
    if (userRole === 'admin') {
      return NextResponse.json({ hasPermission: true });
    }
    
    // Get permissions from settings
    const permissionsSetting = await Setting.findOne({ key: "rbac_permissions" });
    
    // If no permissions are set, default to no access
    if (!permissionsSetting || !permissionsSetting.value) {
      return NextResponse.json({ hasPermission: false });
    }
    
    // Check if the permission exists and if the user's role has access
    const permissions = permissionsSetting.value;
    const hasPermission = permissions[permission] && permissions[permission][userRole] === true;
    
    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error("Error checking permission:", error);
    return NextResponse.json(
      { hasPermission: false, error: "Failed to check permission" },
      { status: 500 }
    );
  }
} 