import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
const Habit = require("@/models/Habit");
const mongoose = require("mongoose");
import { NextResponse } from "next/server";

// GET - Retrieve all habits for the logged in user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;
    const { db } = await connectToDatabase();
    
    const habits = await db
      .collection("habits")
      .find({ 
        userId: new ObjectId(userId) 
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    return new Response(JSON.stringify(habits), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching habits:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch habits" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST - Create a new habit
export async function POST(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userId = session.user.id;
    const data = await req.json();
    console.log('Session user:', session.user);
    console.log('Request data:', data);

    // Derive username with fallbacks
    const username = session.user.username || session.user.email?.split('@')[0] || "User_" + userId.substring(0, 8);
    
    // Ensure userId is a valid ObjectId
    data.userId = new ObjectId(userId);
    data.owner = username;
    
    console.log('Modified data with userId and owner:', data);

    // Initialize streakData to store daily completions
    if (!data.streakData) {
      data.streakData = [];
    }
    
    // Initialize currentStreak and longestStreak if not provided
    if (!data.currentStreak) data.currentStreak = 0;
    if (!data.longestStreak) data.longestStreak = 0;

    const newHabit = new Habit(data);
    console.log('New habit before save:', newHabit);
    
    const savedHabit = await newHabit.save();
    console.log('Habit saved successfully');
    
    return NextResponse.json(savedHabit);
  } catch (error) {
    console.error('Error creating habit:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      // Extract field-specific validation errors
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return NextResponse.json({
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to create habit' }, { status: 500 });
  }
}

// PUT - Update an existing habit
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;
    const data = await req.json();
    
    if (!data._id) {
      return new Response(JSON.stringify({ error: "Habit ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const habitId = data._id;
    delete data._id; // Remove _id from update data
    
    // Make sure user can only update their own habits
    await mongoose.connect(process.env.MONGODB_URI);
    const habit = await Habit.findOne({ 
      _id: habitId,
      userId: userId
    });
    
    if (!habit) {
      return new Response(JSON.stringify({ error: "Habit not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Update the habit
    const updatedHabit = await Habit.findByIdAndUpdate(
      habitId,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    return new Response(JSON.stringify(updatedHabit), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating habit:", error);
    
    let errorMessage = "Failed to update habit";
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
      statusCode = 400;
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE - Delete a habit
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;
    const data = await req.json();
    
    if (!data._id) {
      return new Response(JSON.stringify({ error: "Habit ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Make sure user can only delete their own habits
    await mongoose.connect(process.env.MONGODB_URI);
    const habit = await Habit.findOne({ 
      _id: data._id,
      userId: userId
    });
    
    if (!habit) {
      return new Response(JSON.stringify({ error: "Habit not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Delete the habit
    await Habit.findByIdAndDelete(data._id);
    
    return new Response(JSON.stringify({ success: true, message: "Habit deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting habit:", error);
    return new Response(JSON.stringify({ error: "Failed to delete habit" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 