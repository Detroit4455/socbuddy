'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';

export default function FindUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  useEffect(() => {
    // Check if dark mode preference exists in localStorage
    const savedDarkMode = localStorage.getItem('socbuddy-dark-mode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/messages/find');
    }
  }, [status, router]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm.trim())}`);
      
      if (!response.ok) {
        throw new Error('Failed to search for users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error searching for users:', error);
      toast.error('Failed to search for users');
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = (userId) => {
    router.push(`/messages/${userId}`);
  };

  if (status === 'loading') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-400 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Sign In Required</h1>
          <p className="mb-6 text-center text-white/90">Please sign in to access messages</p>
          <Link href="/auth/signin?redirect=/messages/find" className="px-6 py-2 bg-white bg-opacity-80 text-purple-700 rounded-lg hover:bg-opacity-100 transition">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-800'}`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: darkMode ? '#2a2a2a' : '#f3f4f6',
            color: darkMode ? '#e0e0e0' : '#111827',
            borderRadius: '8px',
            border: darkMode ? '1px solid #444' : '1px solid #e5e7eb'
          }
        }}
      />
      
      {/* Header */}
      <header className={`px-4 py-3 shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-b border-[#333]' : 'bg-white border-b border-gray-200'} flex items-center justify-between`}>
        <div className="flex items-center">
          <Link href="/messages" className="mr-3">
            <svg className={`h-5 w-5 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold">Find People</h1>
        </div>
        
        <Link 
          href="/messages"
          className={`text-sm px-2 py-1 rounded ${
            darkMode 
              ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.25)]'
              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
          }`}
        >
          Back to Inbox
        </Link>
      </header>
      
      <div className="max-w-3xl mx-auto py-4 px-4">
        <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg shadow p-4`}>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or username..."
                className={`flex-1 p-3 rounded-l-lg ${
                  darkMode 
                    ? 'bg-[#333] border-[#444] text-white placeholder-[#888] focus:ring-[rgba(9,203,177,0.5)]' 
                    : 'border-gray-300 focus:ring-purple-500'
                } border focus:outline-none focus:ring-2`}
                disabled={isSearching}
              />
              <button
                type="submit"
                className={`px-4 py-3 rounded-r-lg ${
                  darkMode 
                    ? 'bg-[rgba(9,203,177,0.3)] text-white hover:bg-[rgba(9,203,177,0.4)]' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:opacity-50`}
                disabled={isSearching || !searchTerm.trim()}
              >
                {isSearching ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </form>
          
          {/* Results */}
          {isSearching && (
            <div className="flex justify-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
            </div>
          )}
          
          {hasSearched && !isSearching && users.length === 0 && (
            <div className="py-8 text-center">
              <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>No users found</p>
            </div>
          )}
          
          {!isSearching && users.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-4">Search Results</h2>
              <ul className="divide-y divide-gray-200 dark:divide-[#444]">
                {users.map(user => (
                  <li key={user._id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center">
                      {/* User Avatar */}
                      <div className="mr-3">
                        {user.image ? (
                          <Image 
                            src={user.image} 
                            alt={user.name || user.username} 
                            width={40} 
                            height={40} 
                            className="rounded-full"
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-[#444]' : 'bg-gray-200'} flex items-center justify-center`}>
                            <span className={`font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                              {(user.name || user.username || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.name || user.username}
                        </p>
                        {user.name && user.username && (
                          <p className={`text-sm truncate ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>
                            @{user.username}
                          </p>
                        )}
                      </div>
                      
                      {/* Message Button */}
                      <button
                        onClick={() => startConversation(user._id)}
                        className={`ml-4 px-3 py-1 rounded ${
                          darkMode 
                            ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' 
                            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        }`}
                      >
                        Message
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 