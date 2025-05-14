import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const mongoose = require("mongoose");
const Notification = require("@/models/Notification");
const Habit = require("@/models/Habit");
const User = require("@/models/User");
const Setting = require("@/models/Setting");

// Add a constant for the notification setting key
const NOTIFICATION_SETTING_KEY = "habit_notifications_enabled";

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
    
    // Check and award achievements
    const achievements = habit.achievements || [];
    const newAchievements = [];
    
    // 3-Day Streak Achievement
    if (currentStreak >= 3 && !achievements.includes('3 Day Streak')) {
      newAchievements.push('3 Day Streak');
    }
    
    // 7-Day Streak Achievement
    if (currentStreak >= 7 && !achievements.includes('7-Day Streak')) {
      newAchievements.push('7-Day Streak');
    }
    
    // 15-Day Streak Achievement
    if (currentStreak >= 15 && !achievements.includes('15-Day Streak')) {
      newAchievements.push('15-Day Streak');
    }
    
    // 30-Day Warrior Achievement
    if (currentStreak >= 30 && !achievements.includes('30-Day Warrior')) {
      newAchievements.push('30-Day Warrior');
    }
    
    // 100-Day Legend Achievement
    if (currentStreak >= 100 && !achievements.includes('100-Day Legend')) {
      newAchievements.push('100-Day Legend');
    }
    
    // Comeback Kid Achievement
    if (currentStreak >= 1 && !achievements.includes('Comeback Kid')) {
      // Check if there was a break of 3+ days before this streak
      const lastBreak = streakData.findIndex(entry => !entry.completed);
      if (lastBreak > 0) {
        const breakDate = new Date(streakData[lastBreak].date);
        const streakStartDate = new Date(streakData[0].date);
        const breakDuration = Math.ceil((breakDate - streakStartDate) / (1000 * 60 * 60 * 24));
        if (breakDuration >= 3) {
          newAchievements.push('Comeback Kid');
        }
      }
    }
    
    // Update the habit
    await db.collection("habits").updateOne(
      { _id: new ObjectId(habitId) },
      { 
        $set: { 
          streakData,
          currentStreak,
          longestStreak,
          updatedAt: new Date()
        },
        $push: {
          achievements: { $each: newAchievements }
        }
      }
    );

    // NOTIFICATION SYSTEM: If this habit is completed, handle marathon notifications
    if (completed) {
      try {
        console.log("🚀 Notification system triggered for habit:", habitId);
        console.log("🚀 User completing habit:", userId);
        
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Check if notifications are enabled in the system settings
        const notificationSetting = await Setting.findOne({ key: NOTIFICATION_SETTING_KEY });
        
        // IMPORTANT! 
        // Our tests show that a string "false" would evaluate to true with a simple check
        // So we need to explicitly check for values that we consider "enabled"
        // This prevents notifications from being sent when the setting is set to false
        const notificationsEnabled = notificationSetting ? 
          (notificationSetting.value === true || 
           notificationSetting.value === "true" || 
           notificationSetting.value === 1) : 
          true; // Default to true if setting doesn't exist
        
        console.log("🚀 Notification setting found:", JSON.stringify(notificationSetting));
        console.log("🚀 Notification value type:", notificationSetting ? typeof notificationSetting.value : "N/A");
        console.log("🚀 Notifications enabled?", notificationsEnabled);
        
        if (!notificationsEnabled) {
          console.log("🚀 Habit notifications are disabled in system settings. Skipping notification creation.");
          // Skip the notification creation process
        } else {
          // Get current user info
          const user = await User.findOne({ _id: new ObjectId(userId) });
          console.log("🚀 Found user:", user ? user.username : "User not found");
          const senderName = user ? user.username : 'A user';
          
          // SOLUTION FOR USER B & C: Find all habits with the same name that are part of a marathon
          // This is needed because the marathon data is only stored in the habit creator's document
          const habitName = habit.name;
          
          // First check if the current habit has marathon data
          let marathonsToProcess = [];
          
          if (Array.isArray(habit.marathons) && habit.marathons.length > 0) {
            console.log("🚀 Current habit has marathons:", habit.marathons.length);
            marathonsToProcess = [...habit.marathons];
          }
          
          // If this habit doesn't have marathon data, we need to find the original habit with marathon data
          if (marathonsToProcess.length === 0) {
            console.log("🚀 Current habit has no marathons. Looking for the original habit with marathon data.");
            
            // Find habits with the same name that have marathon data where this user is a participant
            const habitsWithMarathon = await db.collection("habits").find({
              name: habitName,
              marathons: { $exists: true, $ne: [] },
              "marathons.requested.to": new ObjectId(userId)
            }).toArray();
            
            console.log("🚀 Found potential marathon habits:", habitsWithMarathon.length);
            
            // Extract all marathon data from the found habits
            if (habitsWithMarathon.length > 0) {
              habitsWithMarathon.forEach(h => {
                if (Array.isArray(h.marathons)) {
                  marathonsToProcess.push(...h.marathons);
                }
              });
            }
          }
          
          console.log("🚀 Total marathons to process:", marathonsToProcess.length);
          
          // Process each marathon to notify participants
          for (const marathon of marathonsToProcess) {
            console.log("🚀 Processing marathon:", marathon.marathonId);
            
            // Check if marathon has participants
            if (marathon.requested && Array.isArray(marathon.requested)) {
              
              // Find all participants to notify (excluding the current user)
              const recipientIds = marathon.requested
                .filter(req => {
                  // Include users who have accepted or are the creator
                  // The creator doesn't have a "status" field because they didn't accept an invitation
                  return (req.status === 'accepted' || !req.hasOwnProperty('status')) && 
                        req.to.toString() !== userId.toString();
                })
                .map(req => req.to);
              
              const creatorId = marathon.creator;
              
              // If the current user is not the creator, also notify the creator
              if (creatorId && creatorId.toString() !== userId.toString() && 
                  !recipientIds.some(id => id.toString() === creatorId.toString())) {
                recipientIds.push(creatorId);
              }
              
              console.log("🚀 Notification recipients:", recipientIds.length);
              
              // Prepare notifications for all recipients
              if (recipientIds.length > 0) {
                const notifications = recipientIds.map(recipientId => new Notification({
                  recipientId: recipientId,
                  senderId: new ObjectId(userId),
                  senderName,
                  type: 'marathon-completion',
                  marathonId: marathon.marathonId,
                  habitId: new ObjectId(habitId),
                  habitName: habitName,
                  message: `${senderName} completed the "${habitName}" habit in your marathon group "${marathon.groupName || 'Unnamed Group'}"!`,
                  read: false
                }));
                
                console.log("🚀 Creating notifications for recipients:", notifications.length);
                
                // Bulk insert notifications
                if (notifications.length > 0) {
                  const result = await Notification.insertMany(notifications);
                  console.log("🚀 Notifications created:", result.length);
                }
              } else {
                console.log("🚀 No eligible recipients to notify");
              }
            } else {
              console.log("🚀 Marathon has no participants or requested array is missing");
            }
          }
        }
      } catch (notifError) {
        // Log error but don't fail the main request
        console.error("🚨 Error creating marathon notifications:", notifError);
      }
    } else {
      console.log("🚀 No notifications created: habit not completed");
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Habit tracked successfully",
        currentStreak,
        longestStreak,
        newAchievements
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