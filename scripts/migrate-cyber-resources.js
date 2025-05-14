// Script to migrate cybersecurity resources from JSON to MongoDB
// Run with: node -r dotenv/config scripts/migrate-cyber-resources.js

const fs = require('fs');
const path = require('path');
const { connectToDatabase } = require('../src/lib/mongodb');

// Path to the JSON file
const jsonFilePath = path.join(__dirname, '..', 'public', 'data', 'website.json');

async function migrateData() {
  try {
    console.log('Starting migration of cybersecurity resources...');
    
    // Read the JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const resources = JSON.parse(jsonData);
    
    console.log(`Found ${resources.length} resources in the JSON file`);
    
    // Connect to database
    const { client, db } = await connectToDatabase();
    console.log('Connected to database');
    
    // Check if resources already exist in the database
    const collection = db.collection('cyberresources');
    const count = await collection.countDocuments();
    
    if (count > 0) {
      console.log(`Database already has ${count} resources.`);
      console.log('Do you want to proceed and potentially create duplicates? (y/n)');
      
      // Simple way to get user input in Node.js script
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      process.stdin.on('data', async (input) => {
        const answer = input.trim().toLowerCase();
        
        if (answer === 'y' || answer === 'yes') {
          await importResources(collection, resources);
          process.exit(0);
        } else {
          console.log('Migration cancelled');
          await client.close();
          process.exit(0);
        }
      });
    } else {
      // No existing resources, proceed with import
      await importResources(collection, resources);
      await client.close();
      process.exit(0);
    }
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

async function importResources(collection, resources) {
  try {
    console.log('Starting import...');
    
    // Insert all resources
    const result = await collection.insertMany(resources);
    
    console.log(`Successfully imported ${result.insertedCount} resources`);
  } catch (error) {
    console.error('Error importing resources:', error);
  }
}

// Start the migration
migrateData(); 