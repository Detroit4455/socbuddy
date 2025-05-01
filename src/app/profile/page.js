'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Profile() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgba(9,203,177,0.823)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#bbb]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      
      <div className="pt-16 px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#1e1e1e] rounded-lg p-6 shadow-lg border border-[#444]">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Your Profile</h1>
              <Link 
                href="/dashboard"
                className="bg-[#2a2a2a] px-4 py-2 rounded-md text-white hover:bg-[#333] transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-[rgba(9,203,177,0.15)] rounded-full flex items-center justify-center">
                  <span className="text-[rgba(9,203,177,0.823)] text-3xl font-bold">
                    {session?.user?.username ? session.user.username[0].toUpperCase() : 'U'}
                  </span>
                </div>
              </div>
              
              <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444] space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <div className="bg-[#333] py-2 px-4 rounded-md text-white">
                    {session?.user?.username || 'Not available'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <div className="bg-[#333] py-2 px-4 rounded-md text-white">
                    {session?.user?.email || 'Not available'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <div className="bg-[#333] py-2 px-4 rounded-md text-white capitalize">
                    {session?.user?.role || 'user'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Account ID</label>
                  <div className="bg-[#333] py-2 px-4 rounded-md text-white font-mono text-sm">
                    {session?.user?.id || 'Not available'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 