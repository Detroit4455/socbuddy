const mongoose = require('mongoose');

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const env = process.env.NODE_ENV || 'development';

// Log environment and masked URI for debugging
const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log(`[MongoDB] Environment: ${env}`);
console.log(`[MongoDB] URI (masked): ${maskedUri}`);

let isConnected = false;
let dbInfo = {
  provider: 'Unknown',
  name: '',
  host: '',
  connectionStatus: 'Disconnected',
  environment: env
};

function detectDbProvider(uri) {
  if (uri.includes('docdb.amazonaws.com')) {
    return 'AWS DocumentDB';
  } else if (uri.includes('mongodb.net')) {
    return 'MongoDB Atlas';
  } else if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    return 'Local MongoDB';
  } else {
    return 'MongoDB';
  }
}

function parseDbInfo(uri) {
  try {
    // Extract host and database name from URI
    const matches = uri.match(/mongodb:\/\/(?:.*@)?([^\/]+)(?:\/([^?]+))?/);
    if (matches) {
      const host = matches[1];
      const dbName = matches[2] || 'Unknown';
      
      return {
        host,
        name: dbName
      };
    }
  } catch (error) {
    console.error('Error parsing MongoDB URI:', error);
  }
  
  return {
    host: 'Unknown',
    name: 'Unknown'
  };
}

async function connectDB() {
  if (isConnected) {
    console.log('[MongoDB] Using existing database connection');
    return dbInfo;
  }

  // Detect provider before connection
  dbInfo.provider = detectDbProvider(uri);
  const parsedInfo = parseDbInfo(uri);
  dbInfo.host = parsedInfo.host;
  dbInfo.name = parsedInfo.name;
  
  try {
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Add specific options for DocumentDB if needed
    if (dbInfo.provider === 'AWS DocumentDB') {
      connectionOptions.ssl = true;
      connectionOptions.retryWrites = false;
      if (process.env.DOCDB_TLS_CERT_PATH) {
        connectionOptions.tlsCAFile = process.env.DOCDB_TLS_CERT_PATH;
      }
    }

    // Add specific options for MongoDB Atlas
    if (dbInfo.provider === 'MongoDB Atlas') {
      connectionOptions.ssl = true;
    }

    console.log(`[MongoDB] Attempting to connect to ${dbInfo.provider}...`);
    const db = await mongoose.connect(uri, connectionOptions);

    isConnected = db.connections[0].readyState === 1;
    dbInfo.connectionStatus = isConnected ? 'Connected' : 'Disconnected';
    
    console.log(`[MongoDB] Connected to ${dbInfo.provider} successfully`);
  } catch (error) {
    console.error(`[MongoDB] ${dbInfo.provider} connection error:`, error);
    dbInfo.connectionStatus = 'Error: ' + error.message;
    throw error;
  }
  
  return dbInfo;
}

// Add a function to get DB info without connecting
function getDbInfo() {
  return dbInfo;
}

module.exports = { connectDB, getDbInfo }; 