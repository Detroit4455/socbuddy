export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// GET - Get top 3 users for a marathon based on completion rate
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { db } = await connectToDatabase();
    
    // Get habitId and marathonId from URL
    const { searchParams } = new URL(req.url);
    const habitId = searchParams.get('habitId');
    const marathonId = searchParams.get('marathonId');
    
    if (!habitId || !marathonId) {
      return NextResponse.json({ error: "habitId and marathonId parameters are required" }, { status: 400 });
    }
    
    // Find the habit with the specified marathon session
    const habit = await db
      .collection("habits")
      .findOne({
        _id: new ObjectId(habitId),
        marathons: { $elemMatch: { marathonId: new ObjectId(marathonId) } },
        $or: [
          { userId: new ObjectId(userId) },
          { 'marathons.requested': { $elemMatch: { marathonId: new ObjectId(marathonId), to: new ObjectId(userId), status: 'accepted' } } }
        ]
      });
    
    if (!habit) {
      return NextResponse.json({ error: "Habit not found or you are not a participant or owner" }, { status: 404 });
    }
    
    // Extract the one marathon session
    const marathonSession = Array.isArray(habit.marathons)
      ? habit.marathons.find(m => m.marathonId.toString() === marathonId)
      : habit.marathon;
    if (!marathonSession) {
      return NextResponse.json({ error: "Marathon session not found" }, { status: 404 });
    }
    // Get participant IDs (owner + accepted)
    const participantIds = [
      habit.userId.toString(),
      ...marathonSession.requested.filter(r => r.status === 'accepted').map(r => r.to.toString())
    ];
    
    // Get all participants' habits with the same name (case insensitive)
    const participantsHabits = await db
      .collection("habits")
      .find({
        userId: { $in: participantIds.map(id => new ObjectId(id)) },
        name: { $regex: `^${habit.name}$`, $options: 'i' }
      })
      .project({ _id: 1, name: 1, userId: 1, owner: 1, streakData: 1 })
      .toArray();
    
    // Calculate progress for each participant
    const progressData = participantsHabits.map(h => {
      let participantStartDate;
      // Use the marathonSession for startDate
      if (h.userId.toString() === habit.userId.toString()) {
        // Owner: startDate is first accepted
        participantStartDate = marathonSession.requested.find(r => r.status === 'accepted')?.startDate || new Date().toISOString().split('T')[0];
      } else {
        participantStartDate = marathonSession.requested.find(r => r.to.toString() === h.userId.toString() && r.status === 'accepted')?.startDate || new Date().toISOString().split('T')[0];
      }
      const filtered = Array.isArray(h.streakData) ? h.streakData.filter(sd => sd.date >= participantStartDate) : [];
      const completed = filtered.filter(sd => sd.completed).length;
      return {
        userId: h.userId.toString(),
        username: h.owner || 'Unknown User',
        totalDays: filtered.length,
        completedDays: completed,
        completionRate: filtered.length > 0 ? Math.round((completed / filtered.length) * 100) : 0
      };
    });
    
    // Sort first by completedDays (highest first), then by completionRate if tied
    progressData.sort((a, b) => {
      // First compare by completed days
      if (b.completedDays !== a.completedDays) {
        return b.completedDays - a.completedDays;
      }
      // If completed days are the same, then compare by completion rate
      return b.completionRate - a.completionRate;
    });
    
    const topUsers = progressData.slice(0, 3);
    
    return NextResponse.json({
      habitId: habit._id.toString(),
      habitName: habit.name || 'Unnamed Habit',
      topUsers
    });
  } catch (error) {
    console.error("Error fetching top users:", error);
    return NextResponse.json({ error: "Failed to fetch top users" }, { status: 500 });
  }
} 