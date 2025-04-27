'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  
  // State for habit templates management
  const [habitTemplates, setHabitTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    habit: '',
    category: '',
    icon: '✓',
    used_count: 0
  });
  // Add search state
  const [searchTerm, setSearchTerm] = useState('');
  const [importJsonVisible, setImportJsonVisible] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importResults, setImportResults] = useState(null);

  // Check if user has admin role
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.replace('/');
    }
  }, [session, status, router]);
  
  // Initialize dark mode
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    } else {
      // Use system preference as default
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);
  
  // Load habit templates when visiting repository section
  useEffect(() => {
    if (activeSection === 'habit-repository') {
      loadHabitTemplates();
    }
  }, [activeSection]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };
  
  // Load habit templates from API
  const loadHabitTemplates = async () => {
    try {
      setIsLoading(true);
      // Add search parameter if search term exists
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/habit-templates${searchParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch habit templates');
      }
      const data = await response.json();
      setHabitTemplates(data);
    } catch (error) {
      console.error('Error loading habit templates:', error);
      setFormError('Failed to load habit templates');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    loadHabitTemplates();
  };
  
  // Handle JSON import
  const handleJsonImport = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setImportResults(null);
    
    try {
      // Validate JSON format
      let habitData;
      try {
        habitData = JSON.parse(jsonInput);
        if (!Array.isArray(habitData)) {
          throw new Error('JSON must be an array of habit objects');
        }
      } catch (jsonError) {
        setFormError('Invalid JSON format. Please check your input.');
        return;
      }
      
      setIsLoading(true);
      
      // Send to API
      const response = await fetch('/api/habit-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: jsonInput
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import habits');
      }
      
      const results = await response.json();
      setImportResults(results);
      setFormSuccess(`Successfully imported ${results.imported} habit templates.`);
      
      // Reset form and refresh data
      setJsonInput('');
      setImportJsonVisible(false);
      loadHabitTemplates();
      
    } catch (error) {
      console.error('Error importing habits:', error);
      setFormError(error.message || 'Failed to import habits');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateForm({
      ...templateForm,
      [name]: name === 'used_count' ? parseInt(value, 10) : value
    });
  };
  
  // Handle form submission
  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setFormError('');
      setFormSuccess('');
      
      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = '/api/habit-templates';
      
      const payload = isEditMode 
        ? { ...templateForm, _id: selectedTemplate._id }
        : templateForm;
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save habit template');
      }
      
      // Reset form and refresh data
      setFormSuccess(isEditMode ? 'Template updated successfully!' : 'Template added successfully!');
      resetForm();
      loadHabitTemplates();
      
    } catch (error) {
      console.error('Error saving habit template:', error);
      setFormError(error.message || 'Failed to save habit template');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Edit a template
  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      habit: template.habit,
      category: template.category,
      icon: template.icon,
      used_count: template.used_count
    });
    setIsEditMode(true);
  };
  
  // Delete a template
  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/habit-templates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ _id: id })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete habit template');
      }
      
      setFormSuccess('Template deleted successfully!');
      loadHabitTemplates();
      
    } catch (error) {
      console.error('Error deleting habit template:', error);
      setFormError(error.message || 'Failed to delete habit template');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setTemplateForm({
      habit: '',
      category: '',
      icon: '✓',
      used_count: 0
    });
    setIsEditMode(false);
    setSelectedTemplate(null);
  };
  
  // If loading or not authenticated, show loading state
  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
  return (
      <div className="flex min-h-screen flex-col bg-[#121212] text-white">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
        </div>
      </div>
    );
  }
  
  // If not admin, should be redirected by the useEffect

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar />
      
      <div className="flex pt-16">
        {/* Left Sidebar Navigation */}
        <div className={`w-64 fixed h-full ${darkMode ? 'bg-[#1e1e1e] border-r border-[#333]' : 'bg-white border-r border-gray-200'} p-4`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[rgba(9,203,177,0.823)]">Admin Panel</h2>
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              </div>

          <nav>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setActiveSection('dashboard')}
                  className={`w-full text-left px-4 py-2 rounded transition-colors ${
                    activeSection === 'dashboard' 
                      ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]' 
                      : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveSection('users')}
                  className={`w-full text-left px-4 py-2 rounded transition-colors ${
                    activeSection === 'users' 
                      ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]' 
                      : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                  }`}
                >
                  User Management
                </button>
              </li>
              
              {/* Habit Tracker Section */}
              <li className="pt-4">
                <div className={`px-4 py-2 text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Habit Tracker
                </div>
                <ul className="ml-2 space-y-1 mt-1">
                  <li>
                    <button 
                      onClick={() => setActiveSection('habit-overview')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${
                        activeSection === 'habit-overview' 
                          ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]' 
                          : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                      }`}
                    >
                      Overview
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveSection('habit-analytics')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${
                        activeSection === 'habit-analytics' 
                          ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]' 
                          : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                      }`}
                    >
                      Analytics
                    </button>
                  </li>
                  <li>
                <button 
                      onClick={() => setActiveSection('habit-repository')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${
                        activeSection === 'habit-repository' 
                          ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]' 
                          : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                      }`}
                    >
                      Repository
                </button>
                  </li>
                </ul>
              </li>
              
              {/* Tasks Section */}
              <li className="pt-4">
                <div className={`px-4 py-2 text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Task Management
                  </div>
                <ul className="ml-2 space-y-1 mt-1">
                  <li>
                    <button 
                      onClick={() => setActiveSection('task-overview')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${
                        activeSection === 'task-overview' 
                          ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]' 
                          : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                      }`}
                    >
                      Overview
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveSection('task-analytics')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${
                        activeSection === 'task-analytics' 
                          ? 'bg-[rgba(9,203,177,0.15)] text-[rgba(9,203,177,0.823)]' 
                          : darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                      }`}
                    >
                      Analytics
                    </button>
                  </li>
                </ul>
              </li>
              
              <li className="pt-4">
                <Link 
                  href="/administrator"
                  className={`block px-4 py-2 rounded transition-colors ${
                    darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                  }`}
                >
                  Legacy Admin Panel
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Main Content Area */}
        <div className="ml-64 flex-1 p-8">
          {activeSection === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
                <h2 className="text-xl font-semibold mb-4">Welcome, {session?.user?.username}</h2>
                <p className="mb-4">This is the admin dashboard where you can manage various aspects of SocBuddy.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <StatCard title="Active Users" value="--" darkMode={darkMode} />
                  <StatCard title="Total Habits" value="--" darkMode={darkMode} />
                  <StatCard title="Total Tasks" value="--" darkMode={darkMode} />
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'habit-overview' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Habit Tracker Overview</h1>
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
                <p>Here you can view and manage habits across all users.</p>
                <div className="mt-6">
                  <p className="italic">Feature under development.</p>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'habit-analytics' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Habit Analytics</h1>
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
                <p>View statistics and trends for user habits.</p>
                <div className="mt-6">
                  <p className="italic">Feature under development.</p>
                </div>
              </div>
                  </div>
          )}
          
          {activeSection === 'habit-repository' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Habit Repository</h1>
              
              {/* Actions Bar with Search and Import */}
              <div className={`p-4 rounded-lg mb-6 flex flex-col md:flex-row items-center justify-between ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
                {/* Search Form */}
                <form onSubmit={handleSearch} className="w-full md:w-auto mb-4 md:mb-0">
                  <div className="flex">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search habits or categories..."
                      className={`p-2 rounded-l border ${
                        darkMode 
                          ? 'bg-[#2a2a2a] border-[#444] text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-r bg-[rgba(9,203,177,0.823)] text-white hover:bg-[rgba(9,203,177,0.9)] transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </form>
                
                {/* Bulk Import Button */}
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setImportJsonVisible(!importJsonVisible)}
                    className={`px-4 py-2 rounded ${
                      darkMode 
                        ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {importJsonVisible ? 'Cancel Import' : 'Bulk Import JSON'}
                  </button>
                </div>
              </div>
              
              {/* JSON Import Form */}
              {importJsonVisible && (
                <div className={`p-6 rounded-lg mb-6 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
                  <h2 className="text-xl font-semibold mb-4">Import Habit Templates from JSON</h2>
                  
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Paste a JSON array of habit templates in the format:
                  </p>
                  
                  <pre className={`p-3 rounded mb-4 text-sm overflow-x-auto ${
                    darkMode ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-50 text-gray-700'
                  }`}>
{`[
  { "habit": "Meditation", "category": "Wellness", "icon": "🧘", "used_count": 1 },
  { "habit": "Exercise", "category": "Health", "icon": "🏋️", "used_count": 1 }
]`}
                  </pre>
                  
                  <form onSubmit={handleJsonImport}>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      rows={10}
                      className={`w-full p-3 rounded border font-mono ${
                        darkMode 
                          ? 'bg-[#2a2a2a] border-[#444] text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="Paste your JSON array here..."
                      required
                    />
                    
                    <div className="mt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-4 py-2 rounded bg-[rgba(9,203,177,0.823)] text-white hover:bg-[rgba(9,203,177,0.9)] transition-colors ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isLoading ? 'Importing...' : 'Import Habits'}
                      </button>
                    </div>
                  </form>
                  
                  {importResults && (
                    <div className={`mt-4 p-3 rounded ${
                      darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'
                    }`}>
                      <h3 className="font-semibold mb-2">Import Results:</h3>
                      <p>✅ Imported: {importResults.imported}</p>
                      <p>⚠️ Skipped: {importResults.skipped}</p>
                      
                      {importResults.skipped > 0 && importResults.skippedItems && (
                        <div className="mt-2">
                          <p className="font-semibold">Skipped items:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {importResults.skippedItems.map((item, idx) => (
                              <li key={idx} className="text-sm">
                                {item.habit}: {item.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Form for adding/editing habit templates */}
              <div className={`p-6 rounded-lg mb-6 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
                <h2 className="text-xl font-semibold mb-4">
                  {isEditMode ? 'Edit Habit Template' : 'Add New Habit Template'}
                </h2>
                
                {formError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {formError}
                  </div>
                )}
                
                {formSuccess && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {formSuccess}
                  </div>
                )}
                
                <form onSubmit={handleTemplateSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Habit Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="habit"
                        value={templateForm.habit}
                        onChange={handleInputChange}
                        required
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-[#2a2a2a] border-[#444] text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                        placeholder="e.g., Meditation"
                      />
                    </div>
                    
                    <div>
                      <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Category <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={templateForm.category}
                        onChange={handleInputChange}
                        required
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-[#2a2a2a] border-[#444] text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                        placeholder="e.g., Wellness"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Icon <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="icon"
                        value={templateForm.icon}
                        onChange={handleInputChange}
                        required
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-[#2a2a2a] border-[#444] text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                        placeholder="e.g., 🧘"
                      />
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Enter an emoji or symbol to represent this habit
                      </p>
                    </div>
                    
                    <div>
                      <label className={`block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Used Count
                      </label>
                      <input
                        type="number"
                        name="used_count"
                        value={templateForm.used_count}
                        onChange={handleInputChange}
                        min="0"
                        className={`w-full p-2 rounded border ${
                          darkMode 
                            ? 'bg-[#2a2a2a] border-[#444] text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        How many times this habit template has been used
                      </p>
                    </div>
                      </div>
                      
                  <div className="flex justify-between">
                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-4 py-2 rounded bg-[rgba(9,203,177,0.823)] text-white hover:bg-[rgba(9,203,177,0.9)] transition-colors ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isLoading ? 'Saving...' : isEditMode ? 'Update Template' : 'Add Template'}
                      </button>
                      
                      {isEditMode && (
                          <button
                          type="button"
                          onClick={resetForm}
                          className="ml-2 px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                          </button>
                      )}
                          </div>
                          
                    {isEditMode && (
                          <button
                        type="button"
                        onClick={() => handleDeleteTemplate(selectedTemplate._id)}
                        className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Delete
                          </button>
                  )}
                </div>
                </form>
              </div>
              
              {/* List of habit templates */}
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
                <h2 className="text-xl font-semibold mb-4">Habit Templates</h2>
                
                {isLoading && habitTemplates.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)]"></div>
                  </div>
                ) : habitTemplates.length === 0 ? (
                  <p className="text-center py-4 italic">No habit templates found. Add your first template above.</p>
                ) : (
                      <div className="overflow-x-auto">
                    <table className={`w-full ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <thead className={darkMode ? 'border-b border-[#444]' : 'border-b'}>
                        <tr>
                          <th className="py-2 px-4 text-left">Icon</th>
                          <th className="py-2 px-4 text-left">Habit</th>
                          <th className="py-2 px-4 text-left">Category</th>
                          <th className="py-2 px-4 text-right">Used Count</th>
                          <th className="py-2 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                      <tbody>
                        {habitTemplates.map((template) => (
                          <tr 
                            key={template._id} 
                            className={darkMode ? 'border-b border-[#333] hover:bg-[#2a2a2a]' : 'border-b hover:bg-gray-50'}
                          >
                            <td className="py-3 px-4 text-center text-xl">{template.icon}</td>
                            <td className="py-3 px-4">{template.habit}</td>
                            <td className="py-3 px-4">{template.category}</td>
                            <td className="py-3 px-4 text-right">{template.used_count}</td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleEditTemplate(template)}
                                className="p-1 text-[rgba(9,203,177,0.823)] hover:text-[rgba(9,203,177,0.9)]"
                                title="Edit"
                              >
                                Edit
                              </button>
                            </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                )}
                      </div>
                </div>
              )}
              
          {(activeSection === 'users' || activeSection === 'task-overview' || activeSection === 'task-analytics') && (
            <div>
              <h1 className="text-2xl font-bold mb-6">{getPageTitle(activeSection)}</h1>
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
                <p>This feature is currently under development.</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 

// Helper function to get page title
function getPageTitle(section) {
  switch (section) {
    case 'users': return 'User Management';
    case 'task-overview': return 'Task Overview';
    case 'task-analytics': return 'Task Analytics';
    default: return 'Admin Dashboard';
  }
}

// Stat Card Component
function StatCard({ title, value, darkMode }) {
  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50 border border-gray-200'}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-semibold mt-2 text-[rgba(9,203,177,0.823)]">{value}</p>
    </div>
  );
}