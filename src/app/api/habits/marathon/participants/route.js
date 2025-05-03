import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
const Habit = require("@/models/Habit");
const User = require("@/models/User");
const mongoose = require("mongoose");

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const habitId = searchParams.get('habitId');
    const marathonId = searchParams.get('marathonId');

    if (!habitId || !marathonId) {
      return NextResponse.json({ error: "habitId and marathonId are required" }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const habit = await Habit.findOne({ _id: habitId });
    
    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const marathonSession = habit.marathons.find(m => m.marathonId.toString() === marathonId);
    if (!marathonSession) {
      return NextResponse.json({ error: "Marathon session not found" }, { status: 404 });
    }

    // Get all user IDs from requested
    const userIds = marathonSession.requested.map(request => request.to);
    // Fetch usernames from User collection
    const users = await User.find({ _id: { $in: userIds } }, { _id: 1, username: 1 });
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.username; });

    // Map usernames to participants
    const participants = marathonSession.requested.map(request => ({
      userId: request.to.toString(),
      username: userMap[request.to.toString()] || 'Unknown User',
      status: request.status,
      startDate: request.startDate
    }));

    return NextResponse.json({ participants });
  } catch (error) {
    console.error("Error fetching participant details:", error);
    return NextResponse.json({ error: "Failed to fetch participant details" }, { status: 500 });
  }
} 