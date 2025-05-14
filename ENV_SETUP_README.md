# Environment Variable Setup for SocBuddy

This document explains how environment variables are configured in the SocBuddy application.

## Environment Files

Next.js supports different environment files for different environments. The application has been updated to properly use these environment-specific files:

1. `.env.development` - Used in development mode (`npm run dev`)
2. `.env.production` - Used in production mode (`npm start` or `npm run start:prod`)
3. `.env.local` - Used in all environments, overrides the above files
4. `.env` - Base file used in all environments

## File Priority

Next.js loads environment variables in the following order (highest priority first):

1. `.env.{environment}.local` (e.g., `.env.production.local`)
2. `.env.local`
3. `.env.{environment}` (e.g., `.env.production`)
4. `.env`

Variables defined in files with higher priority override those in files with lower priority.

## Required Environment Variables

The following environment variables are required:

```
# OpenAI API Key for AI Buddy feature
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# MongoDB Connection String
MONGODB_URI=mongodb://username:password@hostname:port/database

# NextAuth Configuration
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=https://your-domain.com
```

## Environment-Specific Configuration

### Development Environment

For local development, create a `.env.development` file in the project root:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
MONGODB_URI=mongodb://localhost:27017/socbuddy
NEXTAUTH_SECRET=development_secret
NEXTAUTH_URL=http://localhost:3000
```

### Production Environment

For production deployment, create a `.env.production` file in the project root:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
MONGODB_URI=mongodb://username:password@hostname:port/database
NEXTAUTH_SECRET=secure_random_string
NEXTAUTH_URL=https://your-domain.com
```

## Verifying Environment Setup

The application includes two scripts to help verify your environment setup:

1. `npm run verify-env` - Checks if required environment variables are set
2. `npm run check-env` - Shows which environment files exist and which one is being used

## Troubleshooting

If you're experiencing issues with environment variables:

1. Make sure you're using the correct environment file for your environment
2. Restart the server after making changes to environment files
3. Check which environment files are being loaded with `npm run check-env`
4. Verify that your API keys are in the correct format
5. Check the environment status at `/api/env-test`

## Deployment

When deploying to production:

1. Create a `.env.production` file with your production values
2. Start the server with `npm run start:prod` to ensure production mode
3. For PM2, use: `pm2 start npm --name "socbuddy" -- run start:prod`

For more detailed information, see the [deployment guide](readmedeployment.md). 