'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WebsiteMap() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [siteMap, setSiteMap] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Categories to organize the pages
  const categories = {
    'Admin': [
      { path: '/admin', label: 'Admin Dashboard', description: 'Main admin control panel with site statistics and management tools' },
      { path: '/admin/rbac', label: 'Role-Based Access Control', description: 'Manage roles and permissions for different features' },
      { path: '/admin/users', label: 'User Management', description: 'View and manage user accounts and their roles' },
      { path: '/admin/logs', label: 'System Logs', description: 'View application logs and system events' },
      { path: '/admin/cyber-resources', label: 'Cyber Resources Management', description: 'Manage cybersecurity resources and links' },
      { path: '/admin/website-map', label: 'Website Map', description: 'Overview of all pages in the application' },
    ],
    'Administrator': [
      { path: '/administrator', label: 'Administrator Dashboard', description: 'Alternative admin interface for specific administrative tasks' },
    ],
    'User': [
      { path: '/profile', label: 'User Profile', description: 'User profile management and settings' },
      { path: '/dashboard', label: 'User Dashboard', description: 'Main user dashboard with personalized content' },
      { path: '/messages', label: 'Messages', description: 'User messaging and communication' },
    ],
    'Authentication': [
      { path: '/auth/signin', label: 'Sign In', description: 'User login page' },
      { path: '/auth/signup', label: 'Sign Up', description: 'New user registration' },
      { path: '/auth/reset-password', label: 'Reset Password', description: 'Password recovery process' },
    ],
    'Tools': [
      { path: '/todo-list-manager', label: 'Task Manager', description: 'Manage and organize tasks and to-do lists' },
      { path: '/habit-tracker', label: 'Habit Tracker', description: 'Track and manage personal habits' },
      { path: '/habit-marathon', label: 'Habit Marathon', description: 'Compete and track habits in marathon format' },
      { path: '/ai-buddy', label: 'AI Security Buddy', description: 'AI-powered security assistant and analysis tool' },
      { path: '/log-analyzer', label: 'Log Analyzer', description: 'Analyze and interpret security logs' },
      { path: '/sec-ops', label: 'Security Operations', description: 'Security operations dashboard and tools' },
      { path: '/cybersecurity-resources', label: 'Cybersecurity Resources', description: 'Collection of cybersecurity resources and references' },
      { path: '/indicator-extractor', label: 'Indicator Extractor', description: 'Extract indicators of compromise from text' },
      { path: '/base64', label: 'Base64 Encoder/Decoder', description: 'Encode and decode Base64 strings' },
    ],
    'Other': [
      { path: '/', label: 'Home Page', description: 'Main landing page of the application' },
      { path: '/db-test', label: 'Database Test', description: 'Test database connectivity and operations' },
      { path: '/grabRedirectUrl', label: 'URL Redirect Tool', description: 'Tool for managing URL redirections' },
      { path: '/index2', label: 'Alternative Home', description: 'Alternative home page design' },
    ],
  };

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/dashboard?accessDenied=admin');
        return;
      }
      
      // Initialize expanded categories
      const initialExpanded = {};
      Object.keys(categories).forEach(category => {
        initialExpanded[category] = true; // All categories expanded by default
      });
      setExpandedCategories(initialExpanded);
      
      // Set the site map
      setSiteMap(categories);
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/website-map');
    }
  }, [status, session, router]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredSiteMap = searchTerm ? 
    Object.entries(siteMap).reduce((acc, [category, pages]) => {
      const filteredPages = pages.filter(page => 
        page.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredPages.length > 0) {
        acc[category] = filteredPages;
      }
      
      return acc;
    }, {}) : 
    siteMap;

  if (status === 'loading') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[rgba(9,203,177,0.823)]">Website Map</h1>
          <Link 
            href="/admin"
            className={`px-4 py-2 rounded ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
          >
            Back to Admin Dashboard
          </Link>
        </div>

        <div className={`p-6 rounded-lg mb-6 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
          <p className="mb-4">This page provides a comprehensive map of all pages in the application, organized by category. Use it to navigate and understand the site structure.</p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} border ${darkMode ? 'border-[#444]' : 'border-gray-200'}`}>
              <h3 className="text-sm font-medium text-gray-500">Total Pages</h3>
              <p className="text-2xl font-semibold mt-1 text-[rgba(9,203,177,0.823)]">
                {Object.values(categories).reduce((total, pages) => total + pages.length, 0)}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} border ${darkMode ? 'border-[#444]' : 'border-gray-200'}`}>
              <h3 className="text-sm font-medium text-gray-500">Categories</h3>
              <p className="text-2xl font-semibold mt-1 text-[rgba(9,203,177,0.823)]">
                {Object.keys(categories).length}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg flex-1 ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} border ${darkMode ? 'border-[#444]' : 'border-gray-200'}`}>
              <h3 className="text-sm font-medium text-gray-500">Quick Navigation</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.keys(categories).map(category => (
                  <button 
                    key={category}
                    onClick={() => {
                      setExpandedCategories(prev => ({...prev, [category]: true}));
                      document.getElementById(category)?.scrollIntoView({behavior: 'smooth'});
                    }}
                    className={`px-3 py-1 rounded text-sm ${
                      darkMode 
                        ? 'bg-[#1e1e1e] hover:bg-[#333] text-gray-300' 
                        : 'bg-white hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pages..."
                className={`w-full px-4 py-2 pr-10 rounded-md focus:outline-none ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-[#444] text-white placeholder-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                } border`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {Object.keys(filteredSiteMap).length === 0 && searchTerm ? (
            <div className="text-center py-8">
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No pages found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredSiteMap).map(([category, pages]) => (
                <div key={category} id={category} className={`p-4 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} border ${darkMode ? 'border-[#444]' : 'border-gray-200'}`}>
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    <h2 className="text-xl font-semibold">{category}</h2>
                    <button className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {expandedCategories[category] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {expandedCategories[category] && (
                    <div className="mt-4 space-y-2">
                      {pages.map((page) => (
                        <div key={page.path} className={`p-3 rounded-md ${darkMode ? 'bg-[#303030] hover:bg-[#383838]' : 'bg-white hover:bg-gray-100'} transition-colors border ${darkMode ? 'border-[#444]' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{page.label}</p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-mono`}>{page.path}</p>
                              {page.description && (
                                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{page.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-[#252525] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                {category}
                              </span>
                              <Link
                                href={page.path}
                                className={`px-3 py-1 rounded text-sm ${
                                  darkMode 
                                    ? 'bg-[rgba(9,203,177,0.2)] text-[rgba(9,203,177,0.823)] hover:bg-[rgba(9,203,177,0.3)]' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                target="_blank"
                              >
                                Visit
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 