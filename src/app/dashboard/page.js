'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// Component that uses searchParams
function DashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [accessDeniedMessage, setAccessDeniedMessage] = useState(null);

  useEffect(() => {
    const accessDenied = searchParams.get('accessDenied');
    if (accessDenied === 'administrator') {
      setAccessDeniedMessage('Access denied: You need administrator privileges to access that area.');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#bbb]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      
      <div className="pt-16 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {accessDeniedMessage && (
            <div className="mb-4 p-4 bg-red-900/25 border border-red-700 text-red-300 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>{accessDeniedMessage}</span>
              </div>
            </div>
          )}

          <div className="bg-[#1e1e1e] rounded-lg p-6 shadow-lg border border-[#444]">
            <h1 className="text-2xl font-bold text-white mb-6">
              Welcome to Your Dashboard, {session?.user?.username || 'User'}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444]">
                <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Username</p>
                    <p className="text-white">{session?.user?.username || 'Not available'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{session?.user?.email || 'Not available'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Role</p>
                    <p className="text-white capitalize">{session?.user?.role || 'user'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444]">
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                
                <div className="space-y-3">
                  <Link 
                    href="/todo-list-manager"
                    className="block w-full text-center py-2 px-4 bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)] rounded-md hover:bg-[rgba(9,203,177,0.3)] transition-colors"
                  >
                    Manage Tasks
                  </Link>
                  
                  <Link 
                    href="/profile"
                    className="block w-full text-center py-2 px-4 bg-[#333] text-white rounded-md hover:bg-[#444] transition-colors"
                  >
                    Edit Profile
                  </Link>
                  
                  {session?.user?.role === 'admin' && (
                    <Link 
                      href="/administrator"
                      className="block w-full text-center py-2 px-4 bg-purple-900/30 text-purple-300 rounded-md hover:bg-purple-900/50 transition-colors"
                    >
                      Administrator
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard component with Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#bbb]">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
} 