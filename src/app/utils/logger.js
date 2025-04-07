import fs from 'fs';
import path from 'path';

// Path to the log file
const LOG_FILE = path.join(process.cwd(), 'user_input.log');

/**
 * Logs user input to a file with timestamp, IP address, and status
 * @param {string} input - The user input to log
 * @param {string} ip - The user's IP address
 * @param {string} source - The source/page where input was provided
 * @param {boolean} success - Whether the operation was successful
 * @param {string} errorMessage - Error message if operation failed
 */
export async function logUserInput(input, ip, source, success = true, errorMessage = '') {
  try {
    // Create timestamp
    const timestamp = new Date().toISOString();
    
    // Determine status
    const status = success ? 'Success' : 'Failure';
    
    // Format the log entry
    let logEntry = `${timestamp} ${ip} [${source}] Status: ${status} ${input}`;
    
    // Add error message if operation failed
    if (!success && errorMessage) {
      logEntry += `\nError: [${input}] > ${errorMessage}`;
    }
    
    // Add delimiter for entry separation
    logEntry += '\n++++++++++++++++++++++++++++++++++++++++++++\n\n';
    
    // Append to the log file
    fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
  } catch (error) {
    console.error('Error logging user input:', error);
  }
} 