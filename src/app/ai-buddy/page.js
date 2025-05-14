'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ModernNavbar from '@/components/ModernNavbar';
import ThemeToggle from '@/components/ThemeToggle';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Add a new component for API key configuration notification
const ApiKeyNotice = ({ onClose, darkMode }) => {
  return (
    <div className={`${darkMode ? 'bg-[#303030]' : 'bg-amber-50'} border-l-4 border-yellow-500 p-4 mb-4 rounded`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-600">API Key Configuration Required</h3>
          <div className={`mt-2 text-sm ${darkMode ? 'text-[#e0e0e0]' : 'text-gray-700'}`}>
            <p>The OpenAI API key is not configured. To use AI Buddy:</p>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li>Create a <code className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'} px-1 rounded`}>.env.local</code> file in the project root</li>
              <li>Add <code className={`${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'} px-1 rounded`}>OPENAI_API_KEY=your_api_key_here</code></li>
              <li>Restart the development server</li>
            </ol>
            <p className="mt-2">
              <Link href="/api/env-test" target="_blank" className={`${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-purple-600'} hover:underline`}>
                Check environment status
              </Link>
            </p>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${darkMode ? 'text-[#bbb] hover:text-[#e0e0e0]' : 'text-gray-500 hover:text-gray-700'} focus:outline-none`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add a new component for access denied notification
const AccessDeniedNotice = ({ darkMode }) => {
  const router = useRouter();
  
  return (
    <div className={`${darkMode ? 'bg-[#303030]' : 'bg-red-50'} border-l-4 border-red-500 p-4 mb-4 rounded`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-600">Access Denied</h3>
          <div className={`mt-2 text-sm ${darkMode ? 'text-[#e0e0e0]' : 'text-gray-700'}`}>
            <p>You do not have permission to access AI Buddy.</p>
            <p className="mt-2">Please contact your administrator to request access.</p>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => router.push('/dashboard')}
              className={`inline-flex rounded-md p-1.5 ${darkMode ? 'bg-[#444] hover:bg-[#555]' : 'bg-red-50 hover:bg-red-100'} focus:outline-none`}
            >
              <span className="sr-only">Return to Dashboard</span>
              <span className={`text-sm ${darkMode ? 'text-[#e0e0e0]' : 'text-gray-700'}`}>Go to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AIBuddyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showApiKeyNotice, setShowApiKeyNotice] = useState(false);
  const [hasAccess, setHasAccess] = useState(true); // Initially assume the user has access
  const [checkingAccess, setCheckingAccess] = useState(true); // Track if we're still checking access
  const [darkMode, setDarkMode] = useState(true);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);
  
  // Check user permissions when session is available
  useEffect(() => {
    if (status === 'authenticated') {
      const checkUserPermissions = async () => {
        try {
          const response = await fetch('/api/rbac/check-permission', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ permission: 'access_ai_buddy' }),
          });
          
          const data = await response.json();
          setHasAccess(data.hasPermission);
        } catch (error) {
          console.error('Error checking permissions:', error);
          // Default to no access on error
          setHasAccess(false);
        } finally {
          setCheckingAccess(false);
        }
      };
      
      checkUserPermissions();
    } else if (status === 'unauthenticated') {
      // Redirect unauthenticated users to login
      router.push('/auth/signin?callbackUrl=/ai-buddy');
    }
  }, [status, router]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  useEffect(() => {
    // Scroll to bottom of chat when history updates
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Check API key configuration on page load
  useEffect(() => {
    const checkApiConfig = async () => {
      try {
        const response = await fetch('/api/env-test');
        const data = await response.json();
        
        if (!data.hasApiKey) {
          setShowApiKeyNotice(true);
        }
      } catch (error) {
        console.error('Error checking API configuration:', error);
      }
    };
    
    checkApiConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    // Add user message to chat
    const userMessage = { role: 'user', content: prompt };
    setChatHistory(prev => [...prev, userMessage]);
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-buddy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response to chat
      const aiMessage = { 
        role: 'assistant', 
        content: data.response,
        isDevFallback: data.isDevFallback 
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
      setResponse(data.response);
      
      // Show warning toast if this is a development fallback response
      if (data.isDevFallback) {
        toast.error('API key not configured. Using development fallback response.', {
          duration: 6000,
        });
        setShowApiKeyNotice(true);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to get response');
      
      // If the error is about API key, show the notice
      if (error.message?.includes('API key')) {
        setShowApiKeyNotice(true);
      }
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  // Show loading state while checking access
  if (status === 'loading' || checkingAccess) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-white text-gray-900'} flex flex-col`}>
        <ModernNavbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="pt-20 px-4 flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-white text-gray-900'} flex flex-col`}>
      {/* Use ModernNavbar component */}
      <ModernNavbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main content */}
      <div className="pt-20 px-4 md:px-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-[rgba(9,203,177,0.823)]' : 'text-gray-900'}`}>AI Security Buddy</h1>
              <p className={`mt-2 ${darkMode ? 'text-[#bbb]' : 'text-gray-600'}`}>Your intelligent cybersecurity assistant</p>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'} rounded-lg p-6 shadow-lg border`}>
            {/* Access Denied Notice */}
            {!hasAccess && (
              <AccessDeniedNotice darkMode={darkMode} />
            )}
            
            {/* API Key Notice */}
            {hasAccess && showApiKeyNotice && (
              <ApiKeyNotice onClose={() => setShowApiKeyNotice(false)} darkMode={darkMode} />
            )}
            
            {hasAccess && (
              <>
                <div 
                  ref={chatContainerRef}
                  className={`${darkMode ? 'bg-[#252525] border-[#444]' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 mb-4 h-[500px] overflow-y-auto border`}
                >
                  {chatHistory.length === 0 ? (
                    <div className={`text-center ${darkMode ? 'text-[#777]' : 'text-gray-500'} mt-32`}>
                      <p className="font-medium">Ask me anything about cybersecurity!</p>
                      <p className="text-sm mt-2">I can help with security best practices, threat analysis, and technical explanations.</p>
                    </div>
                  ) : (
                    chatHistory.map((message, index) => (
                      <div 
                        key={index} 
                        className={`mb-4 p-3 rounded-lg ${
                          message.role === 'user' 
                            ? darkMode 
                              ? 'bg-[#1e1e1e] text-white' 
                              : 'bg-blue-100 text-gray-800'
                            : message.isDevFallback
                              ? darkMode
                                ? 'bg-yellow-900/20 border border-yellow-600/50 text-white'
                                : 'bg-yellow-50 border border-yellow-200 text-gray-800' 
                              : darkMode
                                ? 'bg-[#2d2d2d] text-white'
                                : 'bg-green-50 text-gray-800'
                        }`}
                      >
                        <div className="mb-1 font-medium">
                          {message.role === 'user' ? 'You:' : 'AI Buddy:'}
                          {message.isDevFallback && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-600/40 text-yellow-100">DEV MODE</span>
                          )}
                        </div>
                        {message.role === 'user' ? (
                          <div>{message.content}</div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                code({node, inline, className, children, ...props}) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={darkMode ? vscDarkPlus : vs}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask a cybersecurity question..."
                    className={`flex-grow rounded-lg p-3 border focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.623)] ${
                      darkMode 
                        ? 'bg-[#252525] border-[#444] text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className={`rounded-lg px-5 py-3 font-medium flex items-center justify-center ${
                      isLoading || !prompt.trim()
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.9)] text-white'
                    }`}
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Send'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              This is a demonstration of OpenAI&apos;s GPT model integration.
              Responses are generated based on the provided prompt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 