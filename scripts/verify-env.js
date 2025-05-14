#!/usr/bin/env node

// This script checks if the required environment variables are set
// Run with: node scripts/verify-env.js

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Determine which env file to check based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFiles = [
  path.join(process.cwd(), `.env.${nodeEnv}.local`),
  path.join(process.cwd(), `.env.local`),
  path.join(process.cwd(), `.env.${nodeEnv}`),
  path.join(process.cwd(), '.env')
];

console.log('\n🔍 Environment Variable Checker');
console.log('================================\n');
console.log(`🌐 Current environment: ${nodeEnv}`);

// Check for env files in priority order
let envFileFound = false;
let envConfig = {};

for (const envFile of envFiles) {
  const relativePath = path.relative(process.cwd(), envFile);
  if (fs.existsSync(envFile)) {
    console.log(`✅ Found environment file: ${relativePath}`);
    
    // Parse the env file
    const parsedConfig = dotenv.parse(fs.readFileSync(envFile));
    envConfig = { ...envConfig, ...parsedConfig };
    envFileFound = true;
  } else {
    console.log(`ℹ️ Environment file not found: ${relativePath}`);
  }
}

if (!envFileFound) {
  console.log('❌ No environment files found');
  console.log(`   Please create a .env.${nodeEnv} or .env.local file in the project root`);
  
  // Create a sample env file
  console.log('\n📝 Creating a sample environment file...');
  const sampleFile = path.join(process.cwd(), `.env.${nodeEnv}`);
  const sampleContent = '# Add your OpenAI API key here\nOPENAI_API_KEY=your_api_key_here\n';
  
  try {
    fs.writeFileSync(sampleFile, sampleContent);
    console.log(`✅ Sample ${path.basename(sampleFile)} file created. Please edit it with your actual API key.`);
  } catch (err) {
    console.log(`❌ Failed to create sample environment file:`, err.message);
  }
}

// Check for OPENAI_API_KEY in parsed env files
if (envConfig.OPENAI_API_KEY) {
  console.log('✅ OPENAI_API_KEY is set in environment files');
  
  // Basic format check (don't log the actual key)
  const apiKey = envConfig.OPENAI_API_KEY;
  if (apiKey.startsWith('sk-') && apiKey.length > 20) {
    console.log('✅ OPENAI_API_KEY appears to be in the correct format');
  } else {
    console.log('❌ OPENAI_API_KEY does not appear to be in the correct format');
    console.log('   OpenAI API keys typically start with "sk-" and are quite long');
  }
} else {
  console.log('❌ OPENAI_API_KEY is not set in any environment file');
  console.log(`   Please add OPENAI_API_KEY=your_api_key to your .env.${nodeEnv} or .env.local file`);
}

console.log('\n📋 Environment Variables in Process:');
if (process.env.OPENAI_API_KEY) {
  console.log('✅ OPENAI_API_KEY is available in process.env');
} else {
  console.log('❌ OPENAI_API_KEY is NOT available in process.env');
  console.log('   This suggests that Next.js is not loading your environment variables correctly');
}

console.log('\n💡 Next Steps:');
console.log(`1. Make sure your environment files (.env.${nodeEnv}, .env.local) are in the project root directory`);
console.log('2. Make sure OPENAI_API_KEY is set correctly');
console.log('3. Restart your Next.js server after making changes');
console.log('4. Run this script again to verify: node scripts/verify-env.js\n'); 