# AI Security Buddy

This feature provides an AI assistant powered by OpenAI's ChatGPT API to help users with cybersecurity-related questions and tasks.

## Setup

1. Create or update your `.env.local` file in the project root with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

2. Restart your development server if it's already running.

## Usage

Navigate to `/ai-buddy` in your browser to use the AI Security Buddy. You can ask questions about:

- Cybersecurity best practices
- Security tool recommendations
- Threat analysis
- Vulnerability explanations
- Security concepts and terminology
- And more!

## Implementation Details

- The frontend is built with React and Next.js
- The backend uses Next.js API routes to communicate with the OpenAI API
- Chat history is maintained in the client's session
- Responsive design works on mobile and desktop

## Customization

You can customize the AI's behavior by modifying the system prompt in `src/app/api/ai-buddy/route.js`. The current system prompt is:

```
You are a helpful cybersecurity assistant.
```

You can make it more specific or add additional context to guide the AI's responses. 