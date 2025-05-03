'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import AddHabitModal from './AddHabitModal';

export default function HabitTemplateSelector({ onClose, onSave, isLoading, darkMode }) {
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showAddCustom, setShowAddCustom] = useState(false);
  
  const modalRef = useRef(null);
  
  // Load templates when component mounts
  useEffect(() => {
    loadTemplates();
  }, []);
  
  // Extract unique categories once templates are loaded
  useEffect(() => {
    if (templates.length > 0) {
      const uniqueCategories = [...new Set(templates.map(template => template.category))];
      setCategories(uniqueCategories);
    }
  }, [templates]);
  
  // Reload templates when category changes
  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);
  
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
  
  // Load habit templates from API with optional search params
  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      
      // Build URL with search params
      let url = '/api/habit-templates';
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch habit templates');
      }
      
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error loading habit templates');
    } finally {
      setLoadingTemplates(false);
    }
  };
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Apply search in real-time
    const timeoutId = setTimeout(() => loadTemplates(), 300);
    return () => clearTimeout(timeoutId);
  };
  
  // Handle search form submission (still keeping this for form submission via Enter key)
  const handleSearch = (e) => {
    e.preventDefault();
    loadTemplates();
  };
  
  // Handle category selection
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  
  // Select a template to create habit
  const handleSelectTemplate = (template) => {
    onSave({
      name: template.habit,
      description: '',
      icon: template.icon,
      category: template.category,
      templateId: template._id
    });
  };
  
  // Handle custom habit save
  const handleCustomHabitSave = (habitData) => {
    onSave(habitData);
  };
  
  // If showing the custom habit form
  if (showAddCustom) {
    return <AddHabitModal 
      onClose={() => setShowAddCustom(false)} 
      onSave={handleCustomHabitSave}
      isLoading={isLoading}
      darkMode={darkMode}
    />;
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className={`${darkMode ? 'bg-[#2a2a2a] border-[#444] text-white' : 'bg-white border-gray-200'} w-full max-w-3xl rounded-lg border shadow-xl overflow-hidden`}
      >
        <div className={`${darkMode ? 'bg-[#333] border-[#444]' : 'bg-gray-50 border-gray-200'} px-6 py-4 border-b flex justify-between items-center`}>
          <h3 className="text-lg font-medium">Add New Habit</h3>
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
        
        <div className="p-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search habits..."
                  className={`flex-1 px-3 py-2 rounded-l-md ${
                    darkMode 
                      ? 'bg-[#333] border-[#444] text-white placeholder-[#777] focus:border-[rgba(9,203,177,0.5)]'
                      : 'border-gray-300 focus:border-purple-500 placeholder-gray-400'
                  } border focus:ring-2 focus:ring-opacity-50 ${
                    darkMode 
                      ? 'focus:ring-[rgba(9,203,177,0.2)]'
                      : 'focus:ring-purple-200'
                  }`}
                />
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-r-md ${
                    darkMode 
                      ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Search
                </button>
              </div>
            </form>
            
            <div className="w-full md:w-64">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode 
                    ? 'bg-[#333] border-[#444] text-white'
                    : 'border-gray-300 focus:border-purple-500'
                } border focus:ring-2 focus:ring-opacity-50 ${
                  darkMode 
                    ? 'focus:ring-[rgba(9,203,177,0.2)]'
                    : 'focus:ring-purple-200'
                }`}
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Templates Grid */}
          <div className="mb-6">
            <div className="h-96 overflow-y-auto">
              {loadingTemplates ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No habits found. Try another search or create a custom habit.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template._id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`p-2 sm:p-3 rounded-lg text-left transition-all group ${
                        darkMode 
                          ? 'bg-[#333] hover:bg-[#444] border border-[#444]'
                          : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`text-xl flex items-center justify-center h-8 w-8 rounded-full ${
                          darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                        }`}>
                          {template.icon}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <h4 className="font-medium text-sm whitespace-normal break-words">{template.habit}</h4>
                          <div className="flex justify-between">
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{template.category}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-2`}>Followers: {template.used_count || 0}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-between border-t pt-4 mt-4">
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
              type="button"
              onClick={() => setShowAddCustom(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                darkMode 
                  ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              disabled={isLoading}
            >
              Create Custom Habit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}