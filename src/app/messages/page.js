'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { toast, Toaster } from 'react-hot-toast';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function MessageInbox() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  
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
      router.push('/auth/signin?redirect=/messages');
    }
  }, [status, router]);

  // Fetch inbox data using SWR
  const { data: inboxData, error, mutate } = useSWR(
    session ? '/api/messages/inbox' : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      refreshInterval: 30000, // Refresh every 30 seconds
      errorRetryCount: 3
    }
  );

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
          <p className="mb-6 text-center text-white/90">Please sign in to access your messages</p>
          <Link href="/auth/signin?redirect=/messages" className="px-6 py-2 bg-white bg-opacity-80 text-purple-700 rounded-lg hover:bg-opacity-100 transition">Sign In</Link>
        </div>
      </div>
    );
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Same day - show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Within 7 days - show day name
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

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
      <header className={`px-4 py-3 shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-b border-[#333]' : 'bg-white border-b border-gray-200'}`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Link
              href="/messages/find"
              className={`text-sm px-2 py-1 rounded ${
                darkMode 
                  ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.25)]'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            >
              Find People
            </Link>
          </div>
          <Link 
            href="/"
            className={`hidden sm:inline-flex px-3 py-1 text-sm rounded-md ${
              darkMode 
                ? 'bg-[rgba(9,203,177,0.1)] hover:bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
            }`}
          >
            Back to Dashboard
          </Link>
        </div>
      </header>
      
      <div className="max-w-3xl mx-auto py-4 px-4">
        <div className={`${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg shadow`}>
          
          {/* Inbox Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#444]' : 'border-gray-200'} flex justify-between items-center`}>
            <h2 className="font-medium">Inbox</h2>
            <button
              onClick={() => mutate()}
              className={`flex items-center text-xs px-2 py-1 rounded ${
                darkMode 
                  ? 'bg-[#333] text-[#bbb] hover:bg-[#444]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Refresh messages"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          {/* Conversations List */}
          {error && (
            <div className="p-4 text-center">
              <p className={`${darkMode ? 'text-red-400' : 'text-red-500'}`}>Failed to load messages</p>
            </div>
          )}
          
          {!error && !inboxData && (
            <div className="flex justify-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
            </div>
          )}
          
          {inboxData && inboxData.conversations && inboxData.conversations.length === 0 && (
            <div className="py-12 text-center">
              <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} mb-4`}>No messages yet</p>
              <Link
                href="/messages/find"
                className={`${darkMode ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} px-4 py-2 rounded-lg transition`}
              >
                Find People to Message
              </Link>
            </div>
          )}
          
          {inboxData && inboxData.conversations && inboxData.conversations.length > 0 && (
            <ul className="divide-y divide-gray-200 dark:divide-[#444]">
              {inboxData.conversations.map((conversation) => (
                <li key={conversation.conversationId}>
                  <Link 
                    href={`/messages/${conversation.conversationId}`}
                    className={`flex items-center px-4 py-3 ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    {/* User Avatar */}
                    <div className="mr-3 relative">
                      {conversation.partner.image ? (
                        <Image 
                          src={conversation.partner.image} 
                          alt={conversation.partner.name || conversation.partner.username} 
                          width={40} 
                          height={40} 
                          className="rounded-full"
                        />
                      ) : (
                        <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-[#444]' : 'bg-gray-200'} flex items-center justify-center`}>
                          <span className={`font-medium ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                            {(conversation.partner.name || conversation.partner.username || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Unread Badge */}
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    {/* Message Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-medium truncate ${conversation.unreadCount > 0 ? 'font-semibold' : ''}`}>
                          {conversation.partner.name || conversation.partner.username || 'Unknown User'}
                        </h3>
                        <span className={`text-xs ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      
                      <p className={`text-sm truncate ${
                        conversation.unreadCount > 0 
                          ? (darkMode ? 'text-white font-medium' : 'text-gray-900 font-medium')
                          : (darkMode ? 'text-[#aaa]' : 'text-gray-500')
                      }`}>
                        {conversation.lastMessage.senderId === session.user.id ? (
                          <span>You: </span>
                        ) : null}
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                    
                    {/* Right arrow */}
                    <div className="ml-3">
                      <svg className={`h-5 w-5 ${darkMode ? 'text-[#666]' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 