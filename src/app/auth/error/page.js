'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

// Component that uses searchParams
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages = {
    default: 'An authentication error occurred.',
    configuration: 'There is a problem with the server configuration.',
    accessdenied: 'You do not have permission to sign in.',
    verification: 'The sign in link is no longer valid.',
    passwordrequired: 'Password authentication is required for this account.',
    credentialssignin: 'The sign in failed. Check the email and password are correct.',
  };

  const errorMessage = errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      
      <div className="flex min-h-screen pt-16 items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6 bg-[#1e1e1e] rounded-xl shadow-lg border border-[#444]">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-900/30 flex items-center justify-center rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Authentication Error</h1>
            <p className="mt-2 text-sm text-red-300">{errorMessage}</p>
          </div>
          
          <div className="flex space-x-4">
            <Link 
              href="/auth/signin" 
              className="flex-1 py-2 px-4 text-center text-white bg-[rgba(9,203,177,0.5)] hover:bg-[rgba(9,203,177,0.7)] rounded-md transition-colors"
            >
              Back to Sign In
            </Link>
            <Link 
              href="/" 
              className="flex-1 py-2 px-4 text-center text-white bg-[#2a2a2a] hover:bg-[#333] rounded-md transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#bbb]">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
} 