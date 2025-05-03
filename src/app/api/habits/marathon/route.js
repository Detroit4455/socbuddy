import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
const Habit = require("@/models/Habit");
const mongoose = require("mongoose");
const User = require("@/models/User");

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
        { 'marathon.requested.to': userObjectId },
        { userId: userObjectId }
      ] };
    } else {
      findFilter = { $or: [
        { 'marathons': { $elemMatch: { 'requested.to': userObjectId, 'requested.status': status } } },
        { 'marathon.requested': { $elemMatch: { to: userObjectId, status: status } } },
        { userId: userObjectId }
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
      .map(async ({ habit, session }) => {
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
        // Fetch usernames for all participants
        const userIds = reqs.map(r => r.to?.toString?.() || r.to);
        let userMap = {};
        if (userIds.length > 0) {
          const users = await db.collection('users').find({ _id: { $in: userIds.map(id => new ObjectId(id)) } }).project({ _id: 1, username: 1 }).toArray();
          users.forEach(u => { userMap[u._id.toString()] = u.username; });
        }
        const stats = reqs.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {});
        // Build participants array for all users
        const participants = reqs.map(r => ({
          userId: r.to?.toString?.() || r.to,
          username: userMap[r.to?.toString?.() || r.to] || 'Unknown User',
          status: r.status
        }));
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
          marathonStats: { pending: stats.pending||0, accepted: stats.accepted||0, rejected: stats.rejected||0, total: reqs.length },
          participants
        };
      });
    // Await all async map results
    const invitationsWithParticipants = await Promise.all(transformedInvitations);
    return NextResponse.json(invitationsWithParticipants.filter(i => i != null));
  } catch (error) {
    console.error("Error fetching marathon invitations:", error);
    return NextResponse.json({ error: "Failed to fetch marathon invitations" }, { status: 500 });
  }
}

// POST - Create a new marathon invitation
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
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

    // Check for existing invitations before proceeding
    const habit = await Habit.findOne({ _id: habitId });
    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Add participants to existing session
    if (marathonId) {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: "userIds array is required for adding participants" }, { status: 400 });
      }

      // Find the marathon session
      const marathonSession = habit.marathons.find(m => m.marathonId.toString() === marathonId);
      if (!marathonSession) {
        return NextResponse.json({ error: "Marathon session not found" }, { status: 404 });
      }

      // Check for existing invitations
      const existingInvites = marathonSession.requested || [];
      const duplicateUsers = [];
      const previouslyRejectedUsers = [];

      // Filter out users who already have invitations
      const newUserIds = userIds.filter(id => {
        const existingInvite = existingInvites.find(inv => inv.to.toString() === id);
        if (existingInvite) {
          if (existingInvite.status === 'rejected') {
            previouslyRejectedUsers.push(id);
          } else {
            duplicateUsers.push(id);
          }
          return false;
        }
        return true;
      });

      if (newUserIds.length === 0) {
        let errorMessage = '';
        if (duplicateUsers.length > 0) {
          errorMessage += `Users already invited: ${duplicateUsers.join(', ')}. `;
        }
        if (previouslyRejectedUsers.length > 0) {
          errorMessage += `Users previously rejected: ${previouslyRejectedUsers.join(', ')}. `;
        }
        return NextResponse.json({ 
          error: errorMessage.trim(),
          duplicateUsers,
          previouslyRejectedUsers
        }, { status: 400 });
      }

      const updated = await Habit.findOneAndUpdate(
        { _id: habitId, userId: userId, 'marathons.marathonId': new ObjectId(marathonId) },
        { $addToSet: { 'marathons.$.requested': { $each: newUserIds.map(id => ({ to: id, status: 'pending', startDate: null })) } } },
        { new: true }
      );

      if (!updated) {
        return NextResponse.json({ error: "Marathon session not found or unauthorized" }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true,
        duplicateUsers,
        previouslyRejectedUsers,
        message: `Invitations sent successfully. ${duplicateUsers.length > 0 ? `Some users were already invited. ` : ''}${previouslyRejectedUsers.length > 0 ? `Some users previously rejected the invitation.` : ''}`
      });
    }

    // Create a new marathon session
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array is required to create a marathon" }, { status: 400 });
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

    return NextResponse.json({ 
      success: true, 
      marathonId: newSession.marathonId.toString() 
    });
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

    let newHabitCreated = false;
    let newHabitName = '';
    // --- NEW LOGIC: Create similar habit for user if not already present ---
    if (data.status === 'accepted') {
      // Find the marathon session
      const marathonSession = result.marathons.find(m => m.marathonId.toString() === data.marathonId);
      // Find the original habit
      const originalHabit = await Habit.findOne({ _id: data.habitId });
      if (originalHabit) {
        // Check if user already has a habit with the same name
        const existing = await Habit.findOne({ userId: session.user.id, name: originalHabit.name });
        if (!existing) {
          // Create a new habit for the user
          const newHabit = new Habit({
            name: originalHabit.name,
            description: originalHabit.description,
            icon: originalHabit.icon,
            color: originalHabit.color,
            userId: session.user.id,
            owner: session.user.username,
            streakData: [],
            marathons: [],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await newHabit.save();
          newHabitCreated = true;
          newHabitName = originalHabit.name;
        }
      }
    }
    // --- END NEW LOGIC ---

    return NextResponse.json({ success: true, newHabitCreated, newHabitName });
  } catch (error) {
    console.error("Error updating invitation status:", error);
    return NextResponse.json({ error: "Failed to update marathon invitation" }, { status: 500 });
  }
}

// DELETE - Delete a marathon session or leave a marathon
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized"}, { status: 401 });
    const { searchParams } = new URL(req.url);
    const habitId = searchParams.get('habitId');
    const marathonId = searchParams.get('marathonId');
    const leave = searchParams.get('leave') === 'true';
    
    if (!habitId || !marathonId) return NextResponse.json({ error: "habitId and marathonId required"}, { status: 400 });
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    if (leave) {
      // User is leaving the marathon
      const updated = await Habit.findOneAndUpdate(
        { 
          _id: habitId,
          'marathons.marathonId': new ObjectId(marathonId),
          'marathons.requested.to': new ObjectId(session.user.id)
        },
        { 
          $set: { 'marathons.$[s].requested.$[r].status': 'rejected' }
        },
        {
          arrayFilters: [
            { 's.marathonId': new ObjectId(marathonId) },
            { 'r.to': new ObjectId(session.user.id) }
          ],
          new: true
        }
      );
      
      if (!updated) return NextResponse.json({ error: "Marathon not found or unauthorized"}, { status: 404 });
      return NextResponse.json({ success: true, message: "Successfully left the marathon" });
    } else {
      // Owner is deleting the entire marathon
      const updated = await Habit.findOneAndUpdate(
        { _id: habitId, userId: session.user.id },
        { $pull: { marathons: { marathonId: new ObjectId(marathonId) } } },
        { new: true }
      );
      if (!updated) return NextResponse.json({ error: "Not found or unauthorized"}, { status: 404 });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting marathon:", error);
    return NextResponse.json({ error: "Failed to delete marathon"}, { status: 500 });
  }
} 