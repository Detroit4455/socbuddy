import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
const Habit = require("@/models/Habit");
const mongoose = require("mongoose");

// GET - Get marathon invitations for the current user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    // Optimize: only fetch habits where this user has marathon invitations
    const userObjectId = new ObjectId(userId);
    let findFilter;
    if (status === 'all') {
      findFilter = { $or: [
        { 'marathons.requested.to': userObjectId },
        { 'marathon.requested.to': userObjectId }
      ] };
    } else {
      findFilter = { $or: [
        { 'marathons': { $elemMatch: { 'requested.to': userObjectId, 'requested.status': status } } },
        { 'marathon.requested': { $elemMatch: { to: userObjectId, status: status } } }
      ] };
    }
    const habits = await db
      .collection('habits')
      .find(findFilter)
      .project({
        _id: 1,
        name: 1,
        description: 1,
        userId: 1,
        owner: 1,
        icon: 1,
        color: 1,
        marathons: 1,
        marathon: 1
      })
      .toArray();

    // Flatten new `marathons[]` sessions, and fallback to legacy `marathon`
    const invitations = [];
    habits.forEach(habit => {
      if (Array.isArray(habit.marathons) && habit.marathons.length > 0) {
        habit.marathons.forEach(session => {
          if (session.marathonId) invitations.push({ habit, session });
        });
      } else if (habit.marathon?.marathonId) {
        // Include legacy marathon only if it has a marathonId
        invitations.push({ habit, session: habit.marathon });
      }
    });

    // Map and filter each session
    const transformedInvitations = invitations
      .map(({ habit, session }) => {
        const isOwner = habit.userId.toString() === userId;
        // Ensure we have a valid marathonId
        const sessionId = session.marathonId?.toString();
        if (!sessionId) return null;
        // Safely access requested array
        const reqs = Array.isArray(session.requested) ? session.requested : [];
        // Find this user's invitation in session
        const userInvite = reqs.find(r => r.to && r.to.toString() === userId);
        const statusVal = isOwner ? 'owner' : (userInvite ? userInvite.status : 'unknown');
        if (status !== 'all' && statusVal !== status && !isOwner) return null;
        const stats = reqs.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {});
        return {
          marathonId: sessionId,
          habitId: habit._id.toString(),
          name: habit.name,
          description: habit.description,
          icon: habit.icon,
          color: habit.color,
          groupName: session.groupName || '',
          ownerId: habit.userId.toString(),
          ownerName: habit.owner,
          status: statusVal,
          startDate: userInvite? userInvite.startDate : null,
          isOwner,
          marathonStats: isOwner ? { pending: stats.pending||0, accepted: stats.accepted||0, rejected: stats.rejected||0, total: reqs.length } : undefined,
          participants: isOwner ? [] : undefined
        };
      })
      .filter(i => i != null);

    return NextResponse.json(transformedInvitations);
  } catch (error) {
    console.error("Error fetching marathon invitations:", error);
    return NextResponse.json({ error: "Failed to fetch marathon invitations" }, { status: 500 });
  }
}

// POST - Create a new marathon invitation
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    // Ensure user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const data = await req.json();
    await mongoose.connect(process.env.MONGODB_URI);
    const { habitId, marathonId, userIds, groupName } = data;
    if (!habitId) {
      return NextResponse.json({ error: "habitId is required" }, { status: 400 });
    }
    // Add participants to existing session
    if (marathonId) {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: "userIds array is required for adding participants" }, { status: 400 });
      }
      const updated = await Habit.findOneAndUpdate(
        { _id: habitId, userId: userId, 'marathons.marathonId': new ObjectId(marathonId) },
        { $addToSet: { 'marathons.$.requested': { $each: userIds.map(id => ({ to: id, status: 'pending', startDate: null })) } } },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: "Marathon session not found or unauthorized" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }
    // Create a new marathon session
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array is required to create a marathon" }, { status: 400 });
    }
    const habit = await Habit.findOne({ _id: habitId, userId: userId });
    if (!habit) {
      return NextResponse.json({ error: "Habit not found or unauthorized" }, { status: 404 });
    }
    const newSession = {
      marathonId: new mongoose.Types.ObjectId(),
      groupName: groupName || '',
      initiatedBy: userId,
      habitName: habit.name,
      requested: userIds.map(id => ({ to: id, status: 'pending', startDate: null }))
    };
    habit.marathons = Array.isArray(habit.marathons) ? habit.marathons : [];
    habit.marathons.push(newSession);
    await habit.save();
    return NextResponse.json({ success: true, marathonId: newSession.marathonId.toString() });
  } catch (error) {
    console.error("Error creating marathon invitation:", error);
    return NextResponse.json({ error: "Failed to create marathon invitation" }, { status: 500 });
  }
}

// PUT - Update marathon invitation status (accept/reject)
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized"}, { status: 401 });
    const data = await req.json();
    if (!data.habitId || !data.marathonId || !['accepted','rejected'].includes(data.status)) return NextResponse.json({ error: "habitId, marathonId, and valid status required"}, { status: 400 });
    await mongoose.connect(process.env.MONGODB_URI);
    const query = {
      _id: new ObjectId(data.habitId),
      marathons: {
        $elemMatch: {
          marathonId: new ObjectId(data.marathonId),
          'requested.to': new ObjectId(session.user.id)
        }
      }
    };
    const update = {
      $set: { 'marathons.$[s].requested.$[r].status': data.status }
    };
    if (data.status === 'accepted') update.$set['marathons.$[s].requested.$[r].startDate'] = new Date().toISOString().split('T')[0];
    const result = await Habit.findOneAndUpdate(query, update, {
      arrayFilters: [ { 's.marathonId': new ObjectId(data.marathonId) }, { 'r.to': new ObjectId(session.user.id) } ],
      new: true
    });
    if (!result) return NextResponse.json({ error: "Invitation not found"}, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating invitation status:", error);
    return NextResponse.json({ error: "Failed to update marathon invitation" }, { status: 500 });
  }
}

// DELETE - Delete a marathon session
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized"}, { status: 401 });
    const { searchParams } = new URL(req.url);
    const habitId = searchParams.get('habitId');
    const marathonId = searchParams.get('marathonId');
    if (!habitId || !marathonId) return NextResponse.json({ error: "habitId and marathonId required"}, { status: 400 });
    await mongoose.connect(process.env.MONGODB_URI);
    const updated = await Habit.findOneAndUpdate(
      { _id: habitId, userId: session.user.id },
      { $pull: { marathons: { marathonId: new ObjectId(marathonId) } } },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: "Not found or unauthorized"}, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting marathon:", error);
    return NextResponse.json({ error: "Failed to delete marathon"}, { status: 500 });
  }
} 