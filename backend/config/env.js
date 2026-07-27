const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Validate required environment variables on server startup.
 * If any critical variable (especially JWT_SECRET or DB connection) is missing,
 * throw an Error immediately so the server halts.
 */
function validateEnv() {
  if (process.env.DB_URL) {
    // If DB_URL is provided, we will parse it later. Just check JWT_SECRET and PORT.
    const requiredVars = ['PORT', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(v => !process.env[v] || process.env[v].trim() === '');
    
    if (missingVars.includes('JWT_SECRET')) {
      throw new Error('CRITICAL ERROR: JWT_SECRET is not defined in environment variables. Server startup aborted according to security rules.');
    }
    if (missingVars.length > 0) {
      throw new Error(`CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    }
    return;
  }

  const requiredVars = ['PORT', 'DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
  const missingVars = [];

  for (const varName of requiredVars) {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missingVars.push(varName);
    }
  }

  if (missingVars.includes('JWT_SECRET')) {
    throw new Error('CRITICAL ERROR: JWT_SECRET is not defined in environment variables. Server startup aborted according to security rules.');
  }

  if (missingVars.length > 0) {
    throw new Error(`CRITICAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Execute validation immediately when required
validateEnv();

let dbConfig = {
  HOST: process.env.DB_HOST,
  PORT: process.env.DB_PORT || 3306,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD || '',
  NAME: process.env.DB_NAME,
  CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10)
};

if (process.env.DB_URL) {
  try {
    const parsedUrl = new URL(process.env.DB_URL);
    dbConfig = {
      HOST: parsedUrl.hostname,
      PORT: parsedUrl.port || 3306,
      USER: parsedUrl.username,
      PASSWORD: parsedUrl.password,
      NAME: parsedUrl.pathname.replace('/', ''),
      CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10)
    };
  } catch (err) {
    console.error("Failed to parse DB_URL:", err.message);
  }
}

module.exports = {
  PORT: process.env.PORT || 5000,
  DB: dbConfig,
  JWT_SECRET: process.env.JWT_SECRET,
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'demo_cloud',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || ''
  }
};
