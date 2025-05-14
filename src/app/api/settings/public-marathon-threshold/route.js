import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const setting = await db.collection('settings').findOne({ _id: 'public-marathon-threshold' });
    const threshold = setting?.threshold ?? 10;
    const description = setting?.description ?? '';
    return NextResponse.json({ threshold, description });
  } catch (err) {
    console.error('Error fetching public marathon threshold:', err);
    return NextResponse.json({ error: 'Failed to fetch threshold' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { db } = await connectToDatabase();
    const { threshold, description } = await req.json();
    if (typeof threshold !== 'number' || threshold < 0) {
      return NextResponse.json({ error: 'Invalid threshold' }, { status: 400 });
    }
    if (typeof description !== 'string') {
      return NextResponse.json({ error: 'Invalid description' }, { status: 400 });
    }
    await db.collection('settings').updateOne(
      { _id: 'public-marathon-threshold' },
      { $set: { threshold, description } },
      { upsert: true }
    );
    return NextResponse.json({ threshold, description });
  } catch (err) {
    console.error('Error updating public marathon threshold:', err);
    return NextResponse.json({ error: 'Failed to update threshold' }, { status: 500 });
  }
} 