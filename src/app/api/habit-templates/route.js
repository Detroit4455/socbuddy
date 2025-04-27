import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import HabitTemplate from '@/models/HabitTemplate';
import { getToken } from 'next-auth/jwt';

// Configure for dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET all habit templates
export async function GET(request) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Build query
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      // Search across multiple fields
      query.$or = [
        { habit: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Find templates with optional filtering
    const templates = await HabitTemplate.find(query).sort({ used_count: -1 });
    return NextResponse.json(templates);
    
  } catch (error) {
    console.error('Error fetching habit templates:', error);
    return NextResponse.json({ error: 'Failed to fetch habit templates' }, { status: 500 });
  }
}

// POST a new habit template
export async function POST(request) {
  try {
    // Verify admin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    await connectDB();
    
    const data = await request.json();
    
    // Check if it's a bulk import
    if (Array.isArray(data)) {
      return handleBulkImport(data);
    }
    
    // Validate required fields
    if (!data.habit || !data.category || !data.icon) {
      return NextResponse.json({ 
        error: 'Missing required fields: habit, category, and icon are required' 
      }, { status: 400 });
    }
    
    // Check if habit with same name already exists
    const existingHabit = await HabitTemplate.findOne({ habit: data.habit });
    if (existingHabit) {
      return NextResponse.json({ 
        error: 'A habit template with this name already exists' 
      }, { status: 409 });
    }
    
    // Create new template
    const newTemplate = new HabitTemplate({
      habit: data.habit,
      category: data.category,
      icon: data.icon,
      used_count: data.used_count || 0
    });
    
    await newTemplate.save();
    return NextResponse.json(newTemplate, { status: 201 });
    
  } catch (error) {
    console.error('Error creating habit template:', error);
    return NextResponse.json({ error: 'Failed to create habit template' }, { status: 500 });
  }
}

// Handle bulk import of habit templates
async function handleBulkImport(habitsArray) {
  try {
    const results = {
      imported: 0,
      skipped: 0,
      skippedItems: []
    };
    
    for (const habitData of habitsArray) {
      // Validate required fields
      if (!habitData.habit || !habitData.category || !habitData.icon) {
        results.skipped++;
        results.skippedItems.push({
          habit: habitData.habit || 'unnamed',
          reason: 'Missing required fields'
        });
        continue;
      }
      
      // Check if habit with same name already exists
      const existingHabit = await HabitTemplate.findOne({ habit: habitData.habit });
      if (existingHabit) {
        results.skipped++;
        results.skippedItems.push({
          habit: habitData.habit,
          reason: 'Duplicate habit name'
        });
        continue;
      }
      
      // Create new template
      const newTemplate = new HabitTemplate({
        habit: habitData.habit,
        category: habitData.category,
        icon: habitData.icon,
        used_count: habitData.used_count || 0
      });
      
      await newTemplate.save();
      results.imported++;
    }
    
    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error('Error importing habit templates:', error);
    return NextResponse.json({ error: 'Failed to import habit templates' }, { status: 500 });
  }
}

// PUT to update a habit template
export async function PUT(request) {
  try {
    // Verify admin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    await connectDB();
    
    const data = await request.json();
    
    if (!data._id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }
    
    // Check if habit name already exists (excluding the current template)
    if (data.habit) {
      const existingHabit = await HabitTemplate.findOne({
        habit: data.habit,
        _id: { $ne: data._id }
      });
      
      if (existingHabit) {
        return NextResponse.json({ 
          error: 'A habit template with this name already exists' 
        }, { status: 409 });
      }
    }
    
    const updated = await HabitTemplate.findByIdAndUpdate(
      data._id,
      { 
        habit: data.habit,
        category: data.category,
        icon: data.icon,
        used_count: data.used_count,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return NextResponse.json({ error: 'Habit template not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated);
    
  } catch (error) {
    console.error('Error updating habit template:', error);
    return NextResponse.json({ error: 'Failed to update habit template' }, { status: 500 });
  }
}

// DELETE a habit template
export async function DELETE(request) {
  try {
    // Verify admin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    await connectDB();
    
    const data = await request.json();
    
    if (!data._id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }
    
    const deleted = await HabitTemplate.findByIdAndDelete(data._id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Habit template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Habit template deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting habit template:', error);
    return NextResponse.json({ error: 'Failed to delete habit template' }, { status: 500 });
  }
} 