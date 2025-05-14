#!/usr/bin/env node

// This script checks which environment files exist and which one is being used
// Run with: node scripts/check-env-files.js

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Determine the current environment
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`\n🌐 Current environment: ${nodeEnv}`);

// Define the environment files in order of priority
const envFiles = [
  { path: path.join(process.cwd(), `.env.${nodeEnv}.local`), priority: 1 },
  { path: path.join(process.cwd(), '.env.local'), priority: 2 },
  { path: path.join(process.cwd(), `.env.${nodeEnv}`), priority: 3 },
  { path: path.join(process.cwd(), '.env'), priority: 4 }
];

console.log('\n📁 Environment Files Check');
console.log('==========================');

// Check which files exist
let foundFiles = [];
for (const file of envFiles) {
  const relativePath = path.relative(process.cwd(), file.path);
  if (fs.existsSync(file.path)) {
    console.log(`✅ Found: ${relativePath} (Priority: ${file.priority})`);
    foundFiles.push({ ...file, relativePath });
  } else {
    console.log(`❌ Not found: ${relativePath} (Priority: ${file.priority})`);
  }
}

// If no files found, show a message
if (foundFiles.length === 0) {
  console.log('\n⚠️ No environment files found. You should create one of:');
  console.log(`  - .env.${nodeEnv}.local (highest priority)`);
  console.log('  - .env.local');
  console.log(`  - .env.${nodeEnv}`);
  console.log('  - .env (lowest priority)');
} else {
  // Sort by priority
  foundFiles.sort((a, b) => a.priority - b.priority);
  const highestPriorityFile = foundFiles[0];
  
  console.log(`\n🔍 Highest priority file: ${highestPriorityFile.relativePath}`);
  
  // Check if OPENAI_API_KEY exists in the highest priority file
  try {
    const envConfig = dotenv.parse(fs.readFileSync(highestPriorityFile.path));
    if (envConfig.OPENAI_API_KEY) {
      console.log('✅ OPENAI_API_KEY found in this file');
      
      // Basic format check
      const apiKey = envConfig.OPENAI_API_KEY;
      if (apiKey.startsWith('sk-') && apiKey.length > 20) {
        console.log('✅ OPENAI_API_KEY appears to be in the correct format');
      } else {
        console.log('⚠️ OPENAI_API_KEY does not appear to be in the correct format');
        console.log('   OpenAI API keys typically start with "sk-" and are quite long');
      }
    } else {
      console.log('❌ OPENAI_API_KEY not found in this file');
    }
  } catch (error) {
    console.log(`❌ Error reading file: ${error.message}`);
  }
}

console.log('\n💡 Next.js Environment Variable Loading:');
console.log('Next.js loads environment variables from these files in order:');
console.log(`1. .env.${nodeEnv}.local`);
console.log('2. .env.local');
console.log(`3. .env.${nodeEnv}`);
console.log('4. .env');
console.log('\nVariables in files with higher priority override those in files with lower priority.');
console.log('Remember to restart your server after changing environment files.\n'); 