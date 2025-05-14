import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
const Setting = require("@/models/Setting");

// Constants
const ROLES_SETTING_KEY = "rbac_roles";

// GET - Retrieve all roles
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Get roles from settings
    const rolesSetting = await Setting.findOne({ key: ROLES_SETTING_KEY });
    
    // Default roles if not found
    const defaultRoles = ['admin', 'user', 'premium', 'manager'];
    
    if (!rolesSetting) {
      return NextResponse.json({
        roles: defaultRoles,
        isDefault: true
      });
    }

    return NextResponse.json({
      roles: rolesSetting.value,
      isDefault: false
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST - Create or update roles
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await req.json();
    const { roles } = data;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: "Roles array is required" }, { status: 400 });
    }

    // Ensure 'admin' and 'user' roles are always included
    if (!roles.includes('admin') || !roles.includes('user')) {
      return NextResponse.json({ 
        error: "The 'admin' and 'user' roles are required and cannot be removed" 
      }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Update or create the roles setting
    const result = await Setting.updateOne(
      { key: ROLES_SETTING_KEY },
      { 
        $set: { 
          value: roles,
          description: "RBAC roles configuration",
          category: "rbac",
          updatedBy: new mongoose.Types.ObjectId(session.user.id)
        } 
      },
      { upsert: true }
    );

    // Get the updated setting
    const updatedSetting = await Setting.findOne({ key: ROLES_SETTING_KEY });

    return NextResponse.json({ 
      success: true, 
      roles: updatedSetting.value,
      created: result.upsertedCount > 0,
      updated: result.modifiedCount > 0
    });
  } catch (error) {
    console.error("Error updating roles:", error);
    return NextResponse.json(
      { error: "Failed to update roles" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a role
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await req.json();
    const { role } = data;

    if (!role) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Cannot delete 'admin' or 'user' roles
    if (role === 'admin' || role === 'user') {
      return NextResponse.json({ 
        error: "The 'admin' and 'user' roles cannot be deleted" 
      }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Get current roles
    const rolesSetting = await Setting.findOne({ key: ROLES_SETTING_KEY });
    
    if (!rolesSetting || !rolesSetting.value || !Array.isArray(rolesSetting.value)) {
      return NextResponse.json({ error: "Roles not found" }, { status: 404 });
    }

    // Remove the role
    const updatedRoles = rolesSetting.value.filter(r => r !== role);
    
    // Update the roles setting
    await Setting.updateOne(
      { key: ROLES_SETTING_KEY },
      { 
        $set: { 
          value: updatedRoles,
          updatedBy: new mongoose.Types.ObjectId(session.user.id)
        } 
      }
    );

    return NextResponse.json({ 
      success: true, 
      roles: updatedRoles
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
} 