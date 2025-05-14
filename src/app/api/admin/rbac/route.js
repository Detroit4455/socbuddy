import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
const Setting = require("@/models/Setting");

// Constants
const ROLES_SETTING_KEY = "rbac_roles";
const PERMISSIONS_SETTING_KEY = "rbac_permissions";

// GET - Retrieve RBAC configuration
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Get roles from settings
    const rolesSetting = await Setting.findOne({ key: ROLES_SETTING_KEY });
    
    // Default roles if not found
    const roles = rolesSetting?.value || ['admin', 'user', 'premium', 'manager'];
    
    // Get permissions from settings
    const permissionsSetting = await Setting.findOne({ key: PERMISSIONS_SETTING_KEY });
    
    // Default permissions if not found
    const defaultPermissions = {
      access_secops: {
        admin: true,
        manager: true,
        user: false,
        premium: false
      },
      manage_users: {
        admin: true,
        manager: false,
        user: false,
        premium: false
      },
      access_ai_buddy: {
        admin: true,
        manager: false,
        user: false,
        premium: true
      }
    };
    
    const permissions = permissionsSetting?.value || defaultPermissions;

    return NextResponse.json({
      roles,
      permissions,
      userRole: session.user.role
    });
  } catch (error) {
    console.error("Error fetching RBAC config:", error);
    return NextResponse.json(
      { error: "Failed to fetch RBAC configuration" },
      { status: 500 }
    );
  }
}

// POST - Update RBAC permissions
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await req.json();
    const { permissions } = data;

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: "Permissions object is required" }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Update or create the permissions setting
    const result = await Setting.updateOne(
      { key: PERMISSIONS_SETTING_KEY },
      { 
        $set: { 
          value: permissions,
          description: "RBAC permissions configuration",
          category: "rbac",
          updatedBy: new mongoose.Types.ObjectId(session.user.id)
        } 
      },
      { upsert: true }
    );

    // Get the updated setting
    const updatedSetting = await Setting.findOne({ key: PERMISSIONS_SETTING_KEY });

    return NextResponse.json({ 
      success: true, 
      permissions: updatedSetting.value,
      created: result.upsertedCount > 0,
      updated: result.modifiedCount > 0
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
} 