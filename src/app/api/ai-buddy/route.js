import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import mongoose from 'mongoose';
const Setting = require('@/models/Setting');

// Function to check if user has AI Buddy access permission
async function hasAIBuddyAccess(userRole) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get permissions from settings
    const permissionsSetting = await Setting.findOne({ key: "rbac_permissions" });
    
    // If no permissions are set, default to admin-only access
    if (!permissionsSetting || !permissionsSetting.value) {
      return userRole === 'admin';
    }
    
    // Check if the access_ai_buddy permission exists and if the user's role has access
    const permissions = permissionsSetting.value;
    return permissions.access_ai_buddy && permissions.access_ai_buddy[userRole] === true;
  } catch (error) {
    console.error("Error checking AI Buddy permissions:", error);
    // In case of error, default to secure option (no access)
    return false;
  }
}

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if user has permission to access AI Buddy
    const userRole = session.user.role || 'user';
    const hasAccess = await hasAIBuddyAccess(userRole);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'You do not have permission to access AI Buddy. Please contact your administrator.' 
      }, { status: 403 });
    }
    
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Debug environment variables (don't log the actual key in production)
    console.log('Environment check:', { 
      hasApiKey: !!apiKey,
      nodeEnv: process.env.NODE_ENV,
      envVarsCount: Object.keys(process.env).length
    });
    
    if (!apiKey) {
      // Provide a more helpful error message
      console.error('OpenAI API key not found in environment variables');
      
      // In development, provide a dummy response for testing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          response: "This is a development fallback response. Please add OPENAI_API_KEY to your .env.local file and restart the server.",
          isDevFallback: true
        });
      }
      
      return NextResponse.json({ 
        error: 'API key not configured. Please add OPENAI_API_KEY to your environment variables.' 
      }, { status: 500 });
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful cybersecurity assistant. Format your responses in a visually engaging way with the following rules:\n\n1. Use markdown formatting throughout your responses\n2. Start with a clear title or definition of the key concept\n3. Highlight key terms in **bold**\n4. Use bullet points for lists and key points\n5. Include "Key points:" sections with bullet points for important information\n6. Use code blocks with syntax highlighting when showing technical content\n7. Use tables when comparing different concepts\n8. For examples, clearly label them as "Example:" and provide specific details\n9. Include comparisons to related concepts when relevant\n10. Structure your answers with clear sections and headers\n\nProactively explain cybersecurity concepts in an educational manner.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json({ error: error.error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('Error processing AI request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 