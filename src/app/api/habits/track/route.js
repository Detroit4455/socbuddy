import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
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
    
    const { habitId, date, completed, notes } = await req.json();
    
    if (!habitId || !date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Check if the date is today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate.getTime() !== today.getTime() && selectedDate.getTime() !== yesterday.getTime()) {
      return new Response(
        JSON.stringify({ error: "You can only track habits for today and yesterday" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Verify the habit belongs to the user
    const habit = await db
      .collection("habits")
      .findOne({ 
        _id: new ObjectId(habitId),
        userId: new ObjectId(userId)
      });
    
    if (!habit) {
      return new Response(
        JSON.stringify({ error: "Habit not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Check if entry already exists for this date
    const existingEntryIndex = (habit.streakData || []).findIndex(
      entry => entry.date === date
    );
    
    let streakData = habit.streakData || [];
    const entryData = { date, completed, notes };
    
    if (existingEntryIndex >= 0) {
      // Update existing entry
      streakData[existingEntryIndex] = entryData;
    } else {
      // Add new entry
      streakData.push(entryData);
    }
    
    // Sort streak data by date (newest first)
    streakData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate current streak
    let currentStreak = 0;
    const todayString = today.toISOString().split('T')[0];
    
    // For daily habits
    if (habit.frequency === 'daily') {
      for (let i = 0; i < streakData.length; i++) {
        const entry = streakData[i];
        
        // Skip future dates
        if (entry.date > todayString) continue;
        
        // If completed, add to streak
        if (entry.completed) {
          currentStreak++;
        } else {
          // Break streak on first incomplete entry
          break;
        }
        
        // Check if next entry is consecutive day
        if (i < streakData.length - 1) {
          const currentDate = new Date(entry.date);
          const nextDate = new Date(streakData[i + 1].date);
          
          // Calculate day difference
          const diffTime = Math.abs(currentDate - nextDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays !== 1) {
            // Not consecutive days, break streak
            break;
          }
        }
      }
    } else if (habit.frequency === 'weekly') {
      // For weekly habits, count completed entries in current week
      // and check if meets targetDaysPerWeek
      // This is simplified - a more robust implementation would track week-by-week
      currentStreak = streakData.filter(entry => entry.completed).length > 0 ? 1 : 0;
    }
    
    // Update longest streak if current streak is longer
    const longestStreak = Math.max(habit.longestStreak || 0, currentStreak);
    
    // Update the habit
    await db.collection("habits").updateOne(
      { _id: new ObjectId(habitId) },
      { 
        $set: { 
          streakData,
          currentStreak,
          longestStreak,
          updatedAt: new Date()
        } 
      }
    );
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Habit tracked successfully",
        currentStreak,
        longestStreak
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error tracking habit:", error);
    return new Response(
      JSON.stringify({ error: "Failed to track habit" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 