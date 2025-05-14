# Setting Up Environment Variables for AI Buddy

If you're seeing the error "API key not configured" when using the AI Buddy feature, follow these steps to fix it:

## 1. Create or Update Your Environment File

Create an environment file in the root directory of your project (same level as package.json) based on your environment:

### For Development Environment

Create a file named `.env.development` with:

```
OPENAI_API_KEY=your_actual_api_key_here
```

### For Production Environment

Create a file named `.env.production` with:

```
OPENAI_API_KEY=your_actual_api_key_here
```

You can also use `.env.local` which will override both environments.

Replace `your_actual_api_key_here` with your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).

## 2. Restart Your Server

After adding the API key, you need to restart your server for the changes to take effect:

1. Stop your current server (usually by pressing `Ctrl+C` in the terminal)
2. Start it again with:
   ```
   # For development
   npm run dev
   
   # For production
   npm run start
   ```

## 3. Common Issues and Solutions

### Environment Variables Not Loading

Next.js only loads environment variables at startup. If you've added or changed environment variables, you must restart the server.

### Environment File Priority

Next.js loads environment files in this order:
1. `.env.{environment}.local` (highest priority)
2. `.env.local`
3. `.env.{environment}`
4. `.env` (lowest priority)

Where `{environment}` is either `development` or `production`.

### Incorrect File Name or Location

Make sure your environment file is:
- Named correctly (`.env.development`, `.env.production`, or `.env.local`)
- Located in the root directory of your project
- Not inside any subfolder

### API Key Format

The API key should be in the format `sk-...` and should not include any quotes or extra spaces.

### Vercel Deployment

If you're deploying to Vercel, you need to add the environment variable in the Vercel dashboard:
1. Go to your project settings
2. Navigate to the "Environment Variables" section
3. Add `OPENAI_API_KEY` with your API key as the value

## 4. Debugging

You can check if your environment variables are being loaded correctly by visiting:
```
/api/env-test
```

This endpoint will tell you if the API key is being detected (without revealing the key itself). 