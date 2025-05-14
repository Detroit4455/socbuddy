import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    // Fetch all habits with their streak data
    const allHabits = await db.collection('habits')
      .find({ participateInMarathon: true })
      .project({ name: 1, userId: 1, streakData: 1 })
      .toArray();

    // Group by habit name
    const habitMap = {};
    allHabits.forEach(habit => {
      const name = habit.name;
      const userId = habit.userId.toString();
      // filter completed dates
      const dates = (habit.streakData || [])
        .filter(entry => entry.completed)
        .map(entry => entry.date);
      if (!habitMap[name]) {
        habitMap[name] = [];
      }
      habitMap[name].push({ userId, dates });
    });

    // Resolve usernames
    const allUserIds = Array.from(new Set(
      allHabits.map(h => h.userId.toString())
    )).map(id => new ObjectId(id));

    const users = await db.collection('users')
      .find({ _id: { $in: allUserIds } })
      .project({ _id: 1, username: 1 })
      .toArray();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.username; });

    // Build response array
    const result = Object.entries(habitMap).map(([habitName, participants]) => ({
      habitName,
      participants: participants.map(p => ({
        userId: p.userId,
        username: userMap[p.userId] || 'Unknown',
        completedDates: p.dates,
        totalCompletions: p.dates.length
      }))
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in public habits endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch public habits data' }, { status: 500 });
  }
} 