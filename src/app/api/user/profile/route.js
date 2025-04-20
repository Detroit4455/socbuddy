import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { userProfile } = await request.json();
    if (!userProfile || !['work', 'personal'].includes(userProfile)) {
      return NextResponse.json({ error: 'Invalid profile type' }, { status: 400 });
    }

    console.log(`[UserProfile API] Updating profile for user ${session.user.email} to ${userProfile}`);

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { userProfile },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`[UserProfile API] Profile updated successfully: ${updatedUser.userProfile}`);

    return NextResponse.json({
      message: 'Profile updated successfully',
      userProfile: updatedUser.userProfile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 