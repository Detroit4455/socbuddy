'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { toast, Toaster } from 'react-hot-toast';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function ConversationPage({ params }) {
  const { userId: partnerId } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
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

  // Fetch conversation data using SWR
  const { data: conversationData, error, mutate } = useSWR(
    session ? `/api/messages/conversation?otherUser=${partnerId}` : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      refreshInterval: 10000, // Poll for new messages every 10 seconds
      errorRetryCount: 3
    }
  );

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (conversationData?.messages?.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationData]);

  // Mark messages as read when we view them
  useEffect(() => {
    if (session && conversationData?.messages?.length > 0) {
      // Check if there are any unread messages from partner
      const hasUnreadMessages = conversationData.messages.some(
        msg => msg.senderId === partnerId && !msg.read
      );
      
      if (hasUnreadMessages) {
        // Mark all messages from this conversation partner as read
        fetch('/api/messages/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationPartnerId: partnerId })
        }).catch(err => console.error('Error marking messages as read:', err));
        
        // Optimistically update the UI immediately
        mutate(
          data => ({
            ...data,
            messages: data.messages.map(msg => 
              msg.senderId === partnerId ? { ...msg, read: true } : msg
            )
          }),
          false // Don't revalidate
        );
      }
    }
  }, [session, conversationData, partnerId, mutate]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (isSending) return;
    
    const messageContent = newMessage;
    setNewMessage('');
    setIsSending(true);
    
    // Optimistically update UI
    const optimisticMessage = {
      id: 'temp-' + Date.now(),
      content: messageContent,
      senderId: session.user.id,
      receiverId: partnerId,
      read: false,
      createdAt: new Date().toISOString(),
      pending: true
    };
    
    mutate(
      data => ({
        ...data,
        messages: [...(data?.messages || []), optimisticMessage]
      }),
      false // Don't revalidate from server immediately
    );
    
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: partnerId,
          content: messageContent
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      // Message sent successfully, update with real data
      const data = await res.json();
      
      // Replace optimistic message with real message
      mutate();
      
      // Focus back on input after sending
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      
      // Revert optimistic update on error
      mutate(
        data => ({
          ...data,
          messages: data.messages.filter(msg => msg.id !== optimisticMessage.id)
        }),
        false
      );
      
      // Restore message in input
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = (messages) => {
    if (!messages || messages.length === 0) return [];
    
    const groups = [];
    let currentDate = null;
    let currentGroup = null;
    
    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        currentGroup = {
          date: message.createdAt,
          messages: []
        };
        groups.push(currentGroup);
      }
      
      currentGroup.messages.push(message);
    });
    
    return groups;
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
          <p className="mb-6 text-center text-white/90">Please sign in to access your messages</p>
          <Link href="/auth/signin?redirect=/messages" className="px-6 py-2 bg-white bg-opacity-80 text-purple-700 rounded-lg hover:bg-opacity-100 transition">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-800'}`}>
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
      <header className={`px-4 py-3 shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-b border-[#333]' : 'bg-white border-b border-gray-200'} flex items-center`}>
        <Link href="/messages" className="mr-3">
          <svg className={`h-5 w-5 ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        
        {conversationData?.partner ? (
          <div className="flex items-center">
            {conversationData.partner.image ? (
              <Image 
                src={conversationData.partner.image} 
                alt={conversationData.partner.name || conversationData.partner.username} 
                width={32} 
                height={32} 
                className="rounded-full mr-2"
              />
            ) : (
              <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-[#444]' : 'bg-gray-200'} flex items-center justify-center mr-2`}>
                <span className={`font-medium text-sm ${darkMode ? 'text-[#bbb]' : 'text-gray-500'}`}>
                  {(conversationData.partner.name || conversationData.partner.username || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-medium">{conversationData.partner.name || conversationData.partner.username}</span>
          </div>
        ) : (
          <div className="h-8 flex items-center">
            <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-[#444]' : 'bg-gray-200'} mr-2`}></div>
            <div className={`${darkMode ? 'bg-[#444]' : 'bg-gray-200'} h-4 w-24 rounded`}></div>
          </div>
        )}
      </header>
      
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto p-4">
        {/* Messages Container */}
        <div className={`flex-1 overflow-y-auto mb-4 ${darkMode ? 'bg-[#2a2a2a] border-[#444]' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
          {error && (
            <div className="p-4 text-center">
              <p className={`${darkMode ? 'text-red-400' : 'text-red-500'}`}>Failed to load conversation</p>
            </div>
          )}
          
          {!error && !conversationData && (
            <div className="flex justify-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${darkMode ? 'border-[rgba(9,203,177,0.823)]' : 'border-purple-500'}`}></div>
            </div>
          )}
          
          {conversationData?.messages?.length === 0 && (
            <div className="py-12 text-center">
              <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>No messages yet</p>
              <p className={`${darkMode ? 'text-[#888]' : 'text-gray-500'} text-sm mt-1`}>Send a message to start the conversation</p>
            </div>
          )}
          
          {conversationData?.messages?.length > 0 && (
            <div className="space-y-4">
              {groupMessagesByDate(conversationData.messages).map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-2">
                  <div className="flex justify-center my-4">
                    <div className={`px-3 py-1 text-xs rounded-full ${darkMode ? 'bg-[#333] text-[#999]' : 'bg-gray-100 text-gray-500'}`}>
                      {formatMessageDate(group.date)}
                    </div>
                  </div>
                  
                  {group.messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.senderId === session.user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                          message.senderId === session.user.id
                            ? darkMode 
                              ? 'bg-[rgba(9,203,177,0.3)] text-white' 
                              : 'bg-purple-600 text-white'
                            : darkMode
                              ? 'bg-[#333] text-white'
                              : 'bg-gray-100 text-gray-800'
                        } ${message.pending ? 'opacity-70' : ''}`}
                      >
                        <div className="mb-1">{message.content}</div>
                        <div className={`text-xs text-right ${
                          message.senderId === session.user.id
                            ? 'text-white/70'
                            : darkMode ? 'text-[#aaa]' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(message.createdAt)}
                          {message.senderId === session.user.id && (
                            <span className="ml-1">
                              {message.pending ? (
                                <span>●</span>
                              ) : message.read ? (
                                <span>✓✓</span>
                              ) : (
                                <span>✓</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 p-3 rounded-l-lg ${
              darkMode 
                ? 'bg-[#333] border-[#444] text-white placeholder-[#888] focus:ring-[rgba(9,203,177,0.5)]' 
                : 'border-gray-300 focus:ring-purple-500'
            } border focus:outline-none focus:ring-2`}
            ref={messageInputRef}
            disabled={isSending}
          />
          <button
            type="submit"
            className={`px-4 py-3 rounded-r-lg ${
              darkMode 
                ? 'bg-[rgba(9,203,177,0.3)] text-white hover:bg-[rgba(9,203,177,0.4)]' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:opacity-50`}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 