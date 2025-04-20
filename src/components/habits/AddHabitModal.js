'use client';

import React, { useState, useEffect, useRef } from 'react';

const EMOJI_OPTIONS = [
  '📚', '💪', '🧘', '🏃', '🚶', '🥦', '💧', '😴', 
  '🧠', '🎨', '🎯', '📝', '🧹', '💰', '❤️', '🧘‍♂️',
  '🚴', '🏊', '🧩', '🎮', '🎸', '📱', '⏰', '🌱'
];

export default function AddHabitModal({ onClose, onSave, isLoading, darkMode }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const modalRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && event.target.id !== 'emoji-button') {
        setShowEmojiPicker(false);
      }
    }
    
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, description, icon });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className={`${darkMode ? 'bg-[#2a2a2a] border-[#444] text-white' : 'bg-white border-gray-200'} w-full max-w-md rounded-lg border shadow-xl overflow-hidden`}
      >
        <div className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} px-6 py-4 border-b flex justify-between items-center`}>
          <h3 className="text-lg font-medium">Create New Habit</h3>
          <button 
            type="button"
            onClick={onClose}
            className={`${darkMode ? 'text-[#bbb] hover:text-white' : 'text-gray-400 hover:text-gray-500'}`}
            disabled={isLoading}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="icon" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-[#bbb]' : 'text-gray-700'}`}>
              Icon
            </label>
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${darkMode ? 'bg-[#333]' : 'bg-gray-100'}`}>
                {icon}
              </div>
              <button
                id="emoji-button"
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className={`px-3 py-1 text-sm rounded-md ${
                  darkMode 
                    ? 'bg-[rgba(9,203,177,0.1)] hover:bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)]'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                }`}
                disabled={isLoading}
              >
                Change Icon
              </button>
              
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef} 
                  className={`absolute mt-40 ml-10 p-2 grid grid-cols-8 gap-1 rounded-lg shadow-lg z-10 ${
                    darkMode 
                      ? 'bg-[#2a2a2a] border border-[#444]'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {EMOJI_OPTIONS.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setIcon(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className={`text-xl h-8 w-8 flex items-center justify-center rounded hover:bg-${darkMode ? '[#333]' : 'gray-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-[#bbb]' : 'text-gray-700'}`}>
              Habit Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Read 30 minutes"
              className={`w-full px-3 py-2 rounded-md ${
                darkMode 
                  ? 'bg-[#333] border-[#444] text-white placeholder-[#777] focus:border-[rgba(9,203,177,0.5)]'
                  : 'border-gray-300 focus:border-purple-500 placeholder-gray-400'
              } border focus:ring-2 focus:ring-opacity-50 ${
                darkMode 
                  ? 'focus:ring-[rgba(9,203,177,0.2)]'
                  : 'focus:ring-purple-200'
              }`}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-[#bbb]' : 'text-gray-700'}`}>
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this habit is important to you"
              rows={3}
              className={`w-full px-3 py-2 rounded-md ${
                darkMode 
                  ? 'bg-[#333] border-[#444] text-white placeholder-[#777] focus:border-[rgba(9,203,177,0.5)]'
                  : 'border-gray-300 focus:border-purple-500 placeholder-gray-400'
              } border focus:ring-2 focus:ring-opacity-50 ${
                darkMode 
                  ? 'focus:ring-[rgba(9,203,177,0.2)]'
                  : 'focus:ring-purple-200'
              }`}
              disabled={isLoading}
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                darkMode 
                  ? 'bg-[#333] text-[#bbb] hover:bg-[#444]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                darkMode 
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              } flex items-center`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Habit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 