#!/usr/bin/env node

// This script checks if the required environment variables are set
// Run with: node scripts/verify-env.js

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');

console.log('\n🔍 Environment Variable Checker');
console.log('================================\n');

// Check if .env.local exists
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file found');
  
  // Parse the .env.local file
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  
  // Check for OPENAI_API_KEY
  if (envConfig.OPENAI_API_KEY) {
    console.log('✅ OPENAI_API_KEY is set in .env.local');
    
    // Basic format check (don't log the actual key)
    const apiKey = envConfig.OPENAI_API_KEY;
    if (apiKey.startsWith('sk-') && apiKey.length > 20) {
      console.log('✅ OPENAI_API_KEY appears to be in the correct format');
    } else {
      console.log('❌ OPENAI_API_KEY does not appear to be in the correct format');
      console.log('   OpenAI API keys typically start with "sk-" and are quite long');
    }
  } else {
    console.log('❌ OPENAI_API_KEY is not set in .env.local');
    console.log('   Please add OPENAI_API_KEY=your_api_key to your .env.local file');
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('   Please create a .env.local file in the project root with your environment variables');
  
  // Create a sample .env.local file
  console.log('\n📝 Creating a sample .env.local file...');
  const sampleContent = '# Add your OpenAI API key here\nOPENAI_API_KEY=your_api_key_here\n';
  
  try {
    fs.writeFileSync(envLocalPath, sampleContent);
    console.log('✅ Sample .env.local file created. Please edit it with your actual API key.');
  } catch (err) {
    console.log('❌ Failed to create sample .env.local file:', err.message);
  }
}

console.log('\n📋 Environment Variables in Process:');
if (process.env.OPENAI_API_KEY) {
  console.log('✅ OPENAI_API_KEY is available in process.env');
} else {
  console.log('❌ OPENAI_API_KEY is NOT available in process.env');
  console.log('   This suggests that Next.js is not loading your environment variables correctly');
}

console.log('\n💡 Next Steps:');
console.log('1. Make sure your .env.local file is in the project root directory');
console.log('2. Make sure OPENAI_API_KEY is set correctly');
console.log('3. Restart your Next.js server after making changes');
console.log('4. Run this script again to verify: node scripts/verify-env.js\n'); 