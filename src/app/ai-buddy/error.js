'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('AI Buddy error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] p-4 md:p-8">
      {/* Header section */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[rgba(9,203,177,0.823)]">AI Security Buddy</h1>
            <p className="text-[#bbb] mt-2">Your intelligent cybersecurity assistant</p>
          </div>
          <div>
            <Link href="/" className="text-[rgba(9,203,177,0.823)] hover:text-[rgba(9,203,177,1)] transition-all">
              Back to Home
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-[#1e1e1e] rounded-lg p-6 shadow-lg border border-red-500">
          <div className="flex flex-col items-center justify-center p-8">
            <svg 
              className="w-16 h-16 text-red-500 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
            <h2 className="text-xl font-semibold mb-2 text-red-500">Something went wrong!</h2>
            <p className="text-[#bbb] mb-6 text-center">
              We encountered an error while loading the AI Buddy. Please try again.
            </p>
            <button
              onClick={() => reset()}
              className="bg-[rgba(9,203,177,0.3)] hover:bg-[rgba(9,203,177,0.5)] text-[#e0e0e0] px-6 py-2 rounded-lg transition-all focus:outline-none"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 