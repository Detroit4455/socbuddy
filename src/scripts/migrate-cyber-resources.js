// Script to migrate cybersecurity resources from JSON to MongoDB
// Run with: node -r dotenv/config src/scripts/migrate-cyber-resources.js

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import CyberResource from '../models/CyberResource.js';

// Check for MongoDB URI
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not set');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Path to the JSON file
const jsonFilePath = path.join(process.cwd(), 'public', 'data', 'website.json');

// Read and parse the JSON file
async function migrateData() {
  try {
    // Read the JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const resources = JSON.parse(jsonData);
    
    console.log(`Found ${resources.length} resources in the JSON file`);
    
    // Check if resources already exist in the database
    const count = await CyberResource.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} resources. Do you want to proceed and potentially create duplicates? (y/n)`);
      
      // Simple way to get user input in Node.js script
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      process.stdin.on('data', async (input) => {
        const answer = input.trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
          await importResources(resources);
          process.exit(0);
        } else {
          console.log('Migration cancelled');
          process.exit(0);
        }
      });
    } else {
      // No existing resources, proceed with import
      await importResources(resources);
      process.exit(0);
    }
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Import resources to MongoDB
async function importResources(resources) {
  try {
    console.log('Starting import...');
    
    // Insert all resources
    const result = await CyberResource.insertMany(resources);
    
    console.log(`Successfully imported ${result.length} resources`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error importing resources:', error);
    mongoose.connection.close();
  }
}

// Start the migration
migrateData(); 