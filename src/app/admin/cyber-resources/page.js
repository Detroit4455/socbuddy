'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function CyberResourcesAdmin() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResources, setFilteredResources] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [sortOption, setSortOption] = useState('followCount');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResources, setTotalResources] = useState(0);
  const resourcesPerPage = 500;
  
  // Bulk import states
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importResults, setImportResults] = useState(null);

  // Form state
  const [resourceForm, setResourceForm] = useState({
    name: '',
    details: '',
    url: '',
    type: '',
    category: '',
    tags: [],
    followCount: 0
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  
  // New tag input
  const [newTag, setNewTag] = useState('');

  // Check if user has admin role
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'admin') {
      router.replace('/');
    } else {
      loadResources();
    }
  }, [session, status, router]);

  // Load resources
  const loadResources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cyber-resources?sort=${sortOption}&page=${currentPage}&limit=${resourcesPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      
      const data = await response.json();
      
      // Check if the API returns pagination metadata
      if (data.resources && data.pagination) {
        setResources(data.resources);
        setFilteredResources(data.resources);
        setTotalPages(data.pagination.totalPages);
        setTotalResources(data.pagination.totalResources);
      } else {
        // Fallback for backward compatibility
        setResources(data);
        setFilteredResources(data);
        setTotalPages(Math.ceil(data.length / resourcesPerPage));
        setTotalResources(data.length);
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load resources');
      setIsLoading(false);
    }
  };

  // Filter resources based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResources(resources);
      return;
    }
    
    const search = searchTerm.toLowerCase();
    const filtered = resources.filter(resource => {
      return (
        resource.name.toLowerCase().includes(search) ||
        resource.details.toLowerCase().includes(search) ||
        resource.type.toLowerCase().includes(search) ||
        resource.category.toLowerCase().includes(search) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(search)))
      );
    });
    
    setFilteredResources(filtered);
  }, [searchTerm, resources]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResourceForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle tag input
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    // Add tag if it doesn't already exist
    if (!resourceForm.tags.includes(newTag.trim())) {
      setResourceForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
    }
    
    setNewTag('');
  };
  
  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    setResourceForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Handle bulk import
  const handleBulkImport = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setImportResults(null);
    
    try {
      // Validate JSON format
      let resources;
      try {
        resources = JSON.parse(jsonInput);
        if (!Array.isArray(resources)) {
          throw new Error('JSON must be an array of resource objects');
        }
      } catch (jsonError) {
        setError('Invalid JSON format. Please check your input.');
        return;
      }
      
      setIsLoading(true);
      
      // Send to API
      const response = await fetch('/api/cyber-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: jsonInput
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import resources');
      }
      
      // Set import results for display
      setImportResults(result);
      
      // Reset form and refresh data
      setJsonInput('');
      setSuccess(`Successfully imported ${result.stats?.inserted || 0} resource(s)${result.stats?.skipped > 0 ? `, skipped ${result.stats.skipped} duplicate(s)` : ''}`);
      loadResources();
      
    } catch (error) {
      console.error('Error importing resources:', error);
      setError(error.message || 'Failed to import resources');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!resourceForm.name.trim()) errors.name = 'Name is required';
    if (!resourceForm.details.trim()) errors.details = 'Details are required';
    if (!resourceForm.url.trim()) errors.url = 'URL is required';
    if (!resourceForm.type.trim()) errors.type = 'Type is required';
    if (!resourceForm.category.trim()) errors.category = 'Category is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setIsLoading(true);
      
      let response;
      
      if (isEditMode) {
        // Update existing resource
        response = await fetch(`/api/cyber-resources/${selectedResource._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resourceForm),
        });
      } else {
        // Create new resource
        response = await fetch('/api/cyber-resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resourceForm),
        });
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle duplicate resource error specifically
        if (response.status === 409) {
          throw new Error('A resource with this name or URL already exists');
        } else {
          throw new Error(data.error || 'Failed to save resource');
        }
      }
      
      // Reset form and state
      resetForm();
      setSuccess(isEditMode ? 'Resource updated successfully' : 'Resource created successfully');
      
      // Close the modal if it was open
      setShowEditModal(false);
      
      // Reload resources
      loadResources();
    } catch (err) {
      setError(err.message || 'Failed to save resource');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle edit resource
  const handleEditResource = (resource) => {
    setSelectedResource(resource);
    setResourceForm({
      name: resource.name,
      details: resource.details,
      url: resource.url,
      type: resource.type,
      category: resource.category,
      tags: resource.tags || [],
      followCount: resource.followCount || 0
    });
    setIsEditMode(true);
    setShowEditModal(true);
  };
  
  // Handle delete resource
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/cyber-resources/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
      
      setSuccess('Resource deleted successfully');
      
      // Reload resources
      loadResources();
    } catch (err) {
      setError(err.message || 'Failed to delete resource');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setResourceForm({
      name: '',
      details: '',
      url: '',
      type: '',
      category: '',
      tags: [],
      followCount: 0
    });
    setFormErrors({});
    setIsEditMode(false);
    setSelectedResource(null);
    setNewTag('');
    setShowEditModal(false);
  };

  // Close modal handler
  const closeEditModal = () => {
    setShowEditModal(false);
    // Optional: decide if you want to reset the form when closing
    // resetForm();
  };

  // Handle sorting change
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1); // Reset to first page when changing sort
  };

  // Effect to reload resources when page or sort changes
  useEffect(() => {
    if (session && session.user.role === 'admin') {
      loadResources();
    }
  }, [currentPage, sortOption]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-[#e0e0e0]' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-[#1e1e1e] border-b border-[#333]' : 'bg-white shadow'} p-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cybersecurity Resources Admin</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors"
          >
            Back to Admin
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
            <p>{error}</p>
            <button 
              className="float-right font-bold"
              onClick={() => setError('')}
            >
              &times;
            </button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded" role="alert">
            <p>{success}</p>
            <button 
              className="float-right font-bold"
              onClick={() => setSuccess('')}
            >
              &times;
            </button>
          </div>
        )}
        
        {/* Actions Bar */}
        <div className={`p-4 rounded-lg mb-6 flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-2 rounded border ${
                darkMode 
                  ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>
          
          <div className="flex-initial">
            <select
              value={sortOption}
              onChange={handleSortChange}
              className={`p-2 rounded border ${
                darkMode 
                  ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="followCount">Sort by Most Popular</option>
              <option value="name">Sort by Name (A-Z)</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className={`px-4 py-2 rounded ${
              darkMode 
                ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' 
                : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            {showBulkImport ? 'Cancel Bulk Import' : 'Bulk Import JSON'}
          </button>
        </div>

        {/* Bulk Import Form */}
        {showBulkImport && (
          <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
            <h2 className="text-xl font-semibold mb-4">Bulk Import Resources</h2>
            
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Paste a JSON array of resources in the format:
            </p>
            
            <pre className={`p-3 rounded mb-4 text-sm overflow-x-auto ${
              darkMode ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-50 text-gray-700'
            }`}>
{`[
  {
    "name": "Cybersecurity & Infrastructure Security Agency",
    "details": "U.S. federal agency responsible for improving cybersecurity across all levels of government and critical infrastructure.",
    "url": "https://www.cisa.gov/",
    "type": "Government",
    "tags": ["threat advisories", "critical infrastructure", "federal"],
    "category": "Organizations",
    "followCount": 42
  },
  {
    "name": "SecTools.org",
    "details": "Top network security tools curated by Nmap.",
    "url": "https://sectools.org/",
    "type": "Security Tool",
    "tags": ["tools list", "network security", "popular tools"],
    "category": "Resources",
    "followCount": 28
  }
]`}
            </pre>
            
            <form onSubmit={handleBulkImport}>
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
                  {isLoading ? 'Importing...' : 'Import Resources'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className={`ml-2 px-4 py-2 rounded ${
                    darkMode 
                      ? 'bg-[#333] text-[#e0e0e0] hover:bg-[#444]' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
            
            {/* Import Results */}
            {importResults && importResults.stats && (
              <div className={`mt-6 p-4 rounded ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                <h3 className="font-semibold mb-2">Import Results</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className={`p-3 rounded ${darkMode ? 'bg-[#333]' : 'bg-white border border-gray-200'}`}>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-xl font-semibold">{importResults.stats.total}</div>
                  </div>
                  <div className={`p-3 rounded ${darkMode ? 'bg-[#333]' : 'bg-white border border-gray-200'}`}>
                    <div className="text-sm text-green-500">Imported</div>
                    <div className="text-xl font-semibold text-green-500">{importResults.stats.inserted}</div>
                  </div>
                  <div className={`p-3 rounded ${darkMode ? 'bg-[#333]' : 'bg-white border border-gray-200'}`}>
                    <div className="text-sm text-yellow-500">Skipped</div>
                    <div className="text-xl font-semibold text-yellow-500">{importResults.stats.skipped}</div>
                  </div>
                </div>
                
                {importResults.skipped && importResults.skipped.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skipped Resources</h4>
                    <div className={`max-h-40 overflow-y-auto p-2 rounded ${darkMode ? 'bg-[#333]' : 'bg-white border border-gray-200'}`}>
                      <ul className="list-disc pl-5">
                        {importResults.skipped.map((item, index) => (
                          <li key={index} className="mb-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({item.reason})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Resource Form - Only shown when not in edit mode */}
        {!isEditMode && (
          <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
            <h2 className="text-xl font-semibold mb-4">Add New Resource</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Name */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={resourceForm.name}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    } ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>
                
                {/* URL */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={resourceForm.url}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    } ${formErrors.url ? 'border-red-500' : ''}`}
                  />
                  {formErrors.url && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.url}</p>
                  )}
                </div>
                
                {/* Type */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="type"
                    value={resourceForm.type}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    } ${formErrors.type ? 'border-red-500' : ''}`}
                  />
                  {formErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                  )}
                </div>
                
                {/* Category */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={resourceForm.category}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    } ${formErrors.category ? 'border-red-500' : ''}`}
                  />
                  {formErrors.category && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
                  )}
                </div>
                
                {/* Follow Count */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    Follow Count
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="followCount"
                      min="0"
                      value={resourceForm.followCount}
                      onChange={handleInputChange}
                      className={`w-full p-2 rounded border ${
                        darkMode 
                          ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <div className="ml-2 flex items-center text-[rgba(9,203,177,0.823)]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Details */}
              <div className="mb-4">
                <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                  Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="details"
                  value={resourceForm.details}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full p-2 rounded border ${
                    darkMode 
                      ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                      : 'bg-white border-gray-300'
                  } ${formErrors.details ? 'border-red-500' : ''}`}
                ></textarea>
                {formErrors.details && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.details}</p>
                )}
              </div>
              
              {/* Tags */}
              <div className="mb-4">
                <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {resourceForm.tags.map((tag, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                        darkMode ? 'bg-[#252525] text-[#aaa]' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    className={`flex-1 p-2 rounded-l border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    }`}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded-r hover:bg-[rgba(9,203,177,0.9)] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resources List */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white shadow'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Resources List</h2>
            <div className={`text-sm ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
              {totalResources > 0 && (
                <>
                  Showing {(currentPage - 1) * resourcesPerPage + 1} - {Math.min(currentPage * resourcesPerPage, totalResources)} of {totalResources} resources
                </>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)] mb-4"></div>
              <p className={darkMode ? 'text-[#aaa]' : 'text-gray-600'}>Loading resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-20 text-center">
              <p className={darkMode ? 'text-[#aaa]' : 'text-gray-600'}>No resources found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={darkMode ? 'bg-[#252525]' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Follows</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-[#333]' : 'divide-gray-200'}`}>
                    {filteredResources.map((resource) => (
                      <tr key={resource._id} className={darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{resource.name}</div>
                          <div className={`text-sm ${darkMode ? 'text-[#aaa]' : 'text-gray-500'}`}>
                            {resource.url.length > 30 ? `${resource.url.substring(0, 30)}...` : resource.url}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{resource.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{resource.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-[rgba(9,203,177,0.823)]">
                              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                            {resource.followCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditResource(resource)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteResource(resource._id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      darkMode 
                        ? 'bg-[#252525] text-white hover:bg-[#333] disabled:bg-[#1e1e1e] disabled:text-[#555]' 
                        : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'
                    }`}
                  >
                    First
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      darkMode 
                        ? 'bg-[#252525] text-white hover:bg-[#333] disabled:bg-[#1e1e1e] disabled:text-[#555]' 
                        : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className={darkMode ? 'text-[#aaa]' : 'text-gray-600'}>
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      darkMode 
                        ? 'bg-[#252525] text-white hover:bg-[#333] disabled:bg-[#1e1e1e] disabled:text-[#555]' 
                        : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'
                    }`}
                  >
                    Next
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      darkMode 
                        ? 'bg-[#252525] text-white hover:bg-[#333] disabled:bg-[#1e1e1e] disabled:text-[#555]' 
                        : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400'
                    }`}
                  >
                    Last
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Resource Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`relative w-full max-w-2xl p-6 rounded-lg shadow-lg ${darkMode ? 'bg-[#1e1e1e] border border-[#333]' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Resource</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Content */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Name */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={resourceForm.name}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    } ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>
                
                {/* URL */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={resourceForm.url}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    } ${formErrors.url ? 'border-red-500' : ''}`}
                  />
                  {formErrors.url && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.url}</p>
                  )}
                </div>
                
                {/* Type */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="type"
                    value={resourceForm.type}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    } ${formErrors.type ? 'border-red-500' : ''}`}
                  />
                  {formErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                  )}
                </div>
                
                {/* Category */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={resourceForm.category}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    } ${formErrors.category ? 'border-red-500' : ''}`}
                  />
                  {formErrors.category && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
                  )}
                </div>
                
                {/* Follow Count */}
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                    Follow Count
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="followCount"
                      min="0"
                      value={resourceForm.followCount}
                      onChange={handleInputChange}
                      className={`w-full p-2 rounded border ${
                        darkMode 
                          ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <div className="ml-2 flex items-center text-[rgba(9,203,177,0.823)]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Details */}
              <div className="mb-4">
                <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                  Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="details"
                  value={resourceForm.details}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full p-2 rounded border ${
                    darkMode 
                      ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                      : 'bg-white border-gray-300'
                  } ${formErrors.details ? 'border-red-500' : ''}`}
                ></textarea>
                {formErrors.details && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.details}</p>
                )}
              </div>
              
              {/* Tags */}
              <div className="mb-4">
                <label className={`block mb-1 ${darkMode ? 'text-[#aaa]' : 'text-gray-600'}`}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {resourceForm.tags.map((tag, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                        darkMode ? 'bg-[#252525] text-[#aaa]' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    className={`flex-1 p-2 rounded-l border ${
                      darkMode 
                        ? 'bg-[#2a2a2a] border-[#444] text-[#e0e0e0]' 
                        : 'bg-white border-gray-300'
                    }`}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded-r hover:bg-[rgba(9,203,177,0.9)] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {/* Modal Actions */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`px-4 py-2 rounded ${
                    darkMode 
                      ? 'bg-[#333] text-[#e0e0e0] hover:bg-[#444]' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[rgba(9,203,177,0.823)] text-white rounded hover:bg-[rgba(9,203,177,0.9)] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Update Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 