'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Profile() {
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(session?.user?.phoneNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        // Update session data
        session.user.phoneNumber = phoneNumber;
      } else {
        setMessage(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('An error occurred while updating the profile');
    } finally {
      setIsLoading(false);
    }
  };

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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm text-gray-400">Phone Number</label>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-[rgba(9,203,177,0.823)] hover:text-[rgba(9,203,177,1)] text-sm"
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-[#333] py-2 px-4 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[rgba(9,203,177,0.5)]"
                        placeholder="Enter phone number"
                      />
                      <button
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className="w-full bg-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,1)] text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Updating...' : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#333] py-2 px-4 rounded-md text-white">
                      {session?.user?.phoneNumber || 'Not available'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Account ID</label>
                  <div className="bg-[#333] py-2 px-4 rounded-md text-white font-mono text-sm">
                    {session?.user?.id || 'Not available'}
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-md ${message.includes('success') ? 'bg-green-900/50' : 'bg-red-900/50'} text-white text-center`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 