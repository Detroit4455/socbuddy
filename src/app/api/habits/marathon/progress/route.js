import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// Mark this route as dynamic, not static
export const dynamic = 'force-dynamic';

// GET - Get shared progress for a marathon
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { db } = await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const habitId = searchParams.get('habitId');
    const marathonId = searchParams.get('marathonId');
    
    if (!habitId || !marathonId) {
      return NextResponse.json({ error: "habitId and marathonId parameters are required" }, { status: 400 });
    }
    
    // Find the habit and the specific marathon session
    const habit = await db
      .collection("habits")
      .findOne({
        _id: new ObjectId(habitId),
        marathons: { $elemMatch: { marathonId: new ObjectId(marathonId) } },
        $or: [
          { userId: new ObjectId(userId) }, // Owner
          { 
            marathons: { $elemMatch: { marathonId: new ObjectId(marathonId), 'requested': { $elemMatch: { to: new ObjectId(userId), status: 'accepted' } } } }
          } // Participant
        ]
      });
    
    if (!habit) {
      return NextResponse.json({ error: "Habit not found or you're not a participant or owner" }, { status: 404 });
    }
    
    // Extract the marathon session
    const sessionObj = Array.isArray(habit.marathons)
      ? habit.marathons.find(m => m.marathonId.toString() === marathonId)
      : null;
    if (!sessionObj) {
      return NextResponse.json({ error: "Marathon session not found" }, { status: 404 });
    }
    
    const isOwner = habit.userId && habit.userId.toString() === userId;
    
    // Determine start date
    let startDate;
    if (isOwner) {
      // Owner: earliest accepted startDate
      const accepted = sessionObj.requested.filter(r => r.status === 'accepted' && r.startDate);
      if (!accepted.length) {
        return NextResponse.json({ error: "Marathon not started yet - no accepted invitations" }, { status: 400 });
      }
      startDate = accepted[0].startDate;
    } else {
      // Participant: their own startDate
      const invite = sessionObj.requested.find(r => r.to.toString() === userId && r.status === 'accepted');
      if (!invite || !invite.startDate) {
        return NextResponse.json({ error: "Marathon not started yet" }, { status: 400 });
      }
      startDate = invite.startDate;
    }
    
    // Gather participant IDs (owner + accepted participants)
    const participantIds = [
      habit.userId.toString(),
      ...sessionObj.requested.filter(r => r.status === 'accepted').map(r => r.to.toString())
    ];
    
    // Fetch each user's habit to calculate streaks
    const participantsHabits = await db
      .collection("habits")
      .find({
        userId: { $in: participantIds.map(id => new ObjectId(id)) },
        name: { $regex: `^${habit.name}$`, $options: 'i' }
      })
      .project({ _id: 1, name: 1, userId: 1, owner: 1, streakData: 1 })
      .toArray();
    
    // Build progress data
    const progressData = participantsHabits.map(h => {
      let participantStartDate;
      if (h.userId.toString() === habit.userId.toString()) {
        participantStartDate = startDate;
      } else {
        const inv = sessionObj.requested.find(
          r => r.to.toString() === h.userId.toString() && r.status === 'accepted'
        );
        participantStartDate = inv && inv.startDate ? inv.startDate : startDate;
      }
      const filtered = Array.isArray(h.streakData)
        ? h.streakData.filter(sd => sd.date >= participantStartDate)
        : [];
      const completed = filtered.filter(sd => sd.completed).length;
      return {
        userId: h.userId.toString(),
        username: h.owner || 'Unknown User',
        totalDays: filtered.length,
        completedDays: completed,
        completionRate: filtered.length > 0 ? Math.round((completed / filtered.length) * 100) : 0
      };
    });
    
    progressData.sort((a, b) => b.completionRate - a.completionRate);
    
    return NextResponse.json({
      marathonId,
      habitId: habit._id.toString(),
      habitName: habit.name,
      startDate,
      participants: progressData
    });
  } catch (error) {
    console.error("Error fetching marathon progress:", error);
    return NextResponse.json({ error: "Failed to fetch marathon progress" }, { status: 500 });
  }
} 