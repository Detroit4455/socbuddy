# Setting Up Environment Variables for AI Buddy

If you're seeing the error "API key not configured" when using the AI Buddy feature, follow these steps to fix it:

## 1. Create or Update Your .env.local File

Create a file named `.env.local` in the root directory of your project (same level as package.json) with the following content:

```
OPENAI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).

## 2. Restart Your Development Server

After adding the API key, you need to restart your Next.js development server for the changes to take effect:

1. Stop your current server (usually by pressing `Ctrl+C` in the terminal)
2. Start it again with:
   ```
   npm run dev
   ```

## 3. Common Issues and Solutions

### Environment Variables Not Loading

Next.js only loads environment variables at startup. If you've added or changed environment variables, you must restart the server.

### Incorrect File Name or Location

Make sure your environment file is:
- Named exactly `.env.local` (with the dot at the beginning)
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