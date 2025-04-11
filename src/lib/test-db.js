import { connectDB } from './mongodb.js';
import Task from '../models/Task.js';
import mongoose from 'mongoose';

async function testDatabase() {
  try {
    console.log('Testing MongoDB connection...');
    await connectDB();
    console.log('✅ MongoDB connection successful');

    // Test creating a task
    console.log('\nTesting task creation...');
    const testTask = {
      name: 'Test Task',
      status: 'Pending',
      owner: 'Test User',
      detail: 'This is a test task',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      comments: []
    };

    const createdTask = await Task.create(testTask);
    console.log('✅ Task creation successful');
    console.log('Created task:', createdTask);

    // Test reading the task
    console.log('\nTesting task retrieval...');
    const retrievedTask = await Task.findById(createdTask._id);
    console.log('✅ Task retrieval successful');
    console.log('Retrieved task:', retrievedTask);

    // Test updating the task
    console.log('\nTesting task update...');
    const updatedTask = await Task.findByIdAndUpdate(
      createdTask._id,
      { status: 'Completed' },
      { new: true }
    );
    console.log('✅ Task update successful');
    console.log('Updated task:', updatedTask);

    // Test deleting the task
    console.log('\nTesting task deletion...');
    await Task.findByIdAndDelete(createdTask._id);
    console.log('✅ Task deletion successful');

    console.log('\nAll database operations completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database test:', error);
    process.exit(1);
  }
}

testDatabase(); 