import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id;
    
    // Get all habits for the user
    const habits = await db
      .collection("habits")
      .find({ userId: new ObjectId(userId) })
      .toArray();
    
    // Calculate stats
    const totalHabits = habits.length;
    
    // Completion rate calculation
    let completedCount = 0;
    let totalEntries = 0;
    
    habits.forEach(habit => {
      if (habit.streakData && habit.streakData.length > 0) {
        habit.streakData.forEach(entry => {
          totalEntries++;
          if (entry.completed) {
            completedCount++;
          }
        });
      }
    });
    
    const completionRate = totalEntries > 0 
      ? Math.round((completedCount / totalEntries) * 100) 
      : 0;
    
    // Find longest streak
    const longestStreak = habits.reduce((max, habit) => {
      return Math.max(max, habit.longestStreak || 0);
    }, 0);
    
    // Group habits by frequency
    const habitsByFrequency = {
      daily: habits.filter(h => h.frequency === "daily").length,
      weekly: habits.filter(h => h.frequency === "weekly").length,
      monthly: habits.filter(h => h.frequency === "monthly").length,
    };
    
    // Get current streaks for each habit
    const currentStreaks = {};
    habits.forEach(habit => {
      if (habit.currentStreak > 0) {
        currentStreaks[habit.name] = habit.currentStreak;
      }
    });
    
    return new Response(
      JSON.stringify({
        totalHabits,
        completionRate,
        longestStreak,
        habitsByFrequency,
        currentStreaks
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error getting habit stats:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve habit statistics" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 