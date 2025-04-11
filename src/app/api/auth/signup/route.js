const { NextResponse } = require('next/server');
const User = require('@/models/User');
const { connectDB } = require('@/lib/mongodb');

// Helper function to validate email format
const isEmailValid = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();
    
    // Validate input fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide username, email, and password' },
        { status: 400 }
      );
    }
    
    // Validate username length
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!isEmailValid(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }
    
    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if user already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }
    
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }
    
    // Create new user (password will be hashed by pre-save hook)
    const newUser = await User.create({
      username,
      email,
      password
    });
    
    // Return the created user without password
    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
} 