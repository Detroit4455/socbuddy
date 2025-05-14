'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CybersecurityResourcesPage() {
  const [websites, setWebsites] = useState([]);
  const [filteredWebsites, setFilteredWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('followCount');
  const [types, setTypes] = useState(['All']);
  const [categories, setCategories] = useState(['All']);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [followingInProgress, setFollowingInProgress] = useState({});
  const [followedResources, setFollowedResources] = useState({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResources, setTotalResources] = useState(0);
  const resourcesPerPage = 500;

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        setIsLoading(true);
        
        // Fetch resources from API with sort parameter and pagination
        const response = await fetch(`/api/cyber-resources?sort=followCount&page=${currentPage}&limit=${resourcesPerPage}`);
        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }
        const data = await response.json();
        
        // Handle both the old and new API response formats
        const resourceList = data.resources || data;
        
        // Set pagination data if available
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalResources(data.pagination.totalResources);
        } else {
          // Fallback for backward compatibility
          setTotalPages(Math.ceil(resourceList.length / resourcesPerPage));
          setTotalResources(resourceList.length);
        }
        
        // No need to sort on client side as server already sorted
        setWebsites(resourceList);
        setFilteredWebsites(resourceList);
        
        // Fetch categories and types from API
        const categoriesResponse = await fetch('/api/cyber-resources/categories');
        if (categoriesResponse.ok) {
          const { types, categories } = await categoriesResponse.json();
          setTypes(types);
          setCategories(categories);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load resources');
        setIsLoading(false);
      }
    };
    
    fetchWebsites();
    
    // Load followed resources from localStorage
    const loadFollowedResources = () => {
      try {
        const storedFollowed = localStorage.getItem('followedResources');
        if (storedFollowed) {
          setFollowedResources(JSON.parse(storedFollowed));
        }
      } catch (err) {
        console.error('Error loading followed resources from localStorage:', err);
      }
    };
    
    loadFollowedResources();
  }, [currentPage]);
  
  // Apply filters using API
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setIsLoading(true);
        
        // Build query params for API request
        const params = new URLSearchParams();
        params.append('sort', selectedSort); // Use selected sort method
        params.append('page', currentPage.toString());
        params.append('limit', resourcesPerPage.toString());
        
        if (selectedType !== 'All') {
          params.append('type', selectedType);
        }
        if (selectedCategory !== 'All') {
          params.append('category', selectedCategory);
        }
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        // Fetch filtered resources
        const response = await fetch(`/api/cyber-resources?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch filtered resources');
        }
        
        const data = await response.json();
        
        // Handle both the old and new API response formats
        const resourceList = data.resources || data;
        
        // Set pagination data if available
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalResources(data.pagination.totalResources);
        } else {
          // Fallback for backward compatibility
          setTotalPages(Math.ceil(resourceList.length / resourcesPerPage));
          setTotalResources(resourceList.length);
        }
        
        // No need to sort on client side as server already sorted
        setFilteredWebsites(resourceList);
        setIsLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to apply filters');
        setIsLoading(false);
      }
    };
    
    // Debounce the filter application
    const filterTimeout = setTimeout(() => {
      applyFilters();
    }, 300);
    
    return () => clearTimeout(filterTimeout);
  }, [selectedType, selectedCategory, searchTerm, selectedSort, currentPage]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('All');
    setSelectedCategory('All');
    setSelectedSort('followCount');
    setCurrentPage(1);
  };

  // Clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Function to extract hostname from URL
  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  // Function to handle follow/like click
  const handleFollowClick = async (e, resourceId) => {
    e.preventDefault(); // Prevent opening the link
    e.stopPropagation(); // Prevent event bubbling
    
    console.log('Heart button clicked for resource:', resourceId);
    
    // Check if user has already followed this resource
    if (followedResources[resourceId]) {
      console.log('User already followed this resource');
      return; // User has already followed this resource
    }
    
    // Avoid multiple clicks
    if (followingInProgress[resourceId]) {
      console.log('Follow already in progress');
      return;
    }
    
    try {
      console.log('Setting followingInProgress to true');
      setFollowingInProgress(prev => ({ ...prev, [resourceId]: true }));
      
      const apiUrl = `/api/cyber-resources/${resourceId}/follow`;
      console.log('Sending follow request to:', apiUrl);
      
      // Show immediate feedback by temporarily incrementing the count
      // This provides visual feedback even if the API call takes time
      setFilteredWebsites(prevWebsites => 
        prevWebsites.map(website => 
          website._id === resourceId 
            ? { ...website, followCount: (website.followCount || 0) + 1 } 
            : website
        )
      );
      
      // Mark as followed right away for UI feedback
      const updatedFollowed = { ...followedResources, [resourceId]: true };
      setFollowedResources(updatedFollowed);
      
      // Save to localStorage immediately for persistence
      try {
        localStorage.setItem('followedResources', JSON.stringify(updatedFollowed));
      } catch (storageErr) {
        console.error('Error saving to localStorage:', storageErr);
      }
      
      // Now make the actual API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Follow API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to follow resource: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Follow API response data:', data);
      
      // Update with the server's value (which should match our optimistic update)
      setWebsites(prevWebsites => 
        prevWebsites.map(website => 
          website._id === resourceId 
            ? { ...website, followCount: data.followCount } 
            : website
        )
      );
      
      console.log('Updated followed resources:', updatedFollowed);
      console.log('Saved followed resources to localStorage');
      
    } catch (err) {
      console.error('Error following resource:', err);
      // Don't revert the UI since we want to keep the heart active even if the API fails
      // The count may be off, but the user experience is better this way
    } finally {
      console.log('Setting followingInProgress to false');
      setFollowingInProgress(prev => ({ ...prev, [resourceId]: false }));
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#121212] flex flex-col text-[#e0e0e0] relative font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
      {/* Navigation Bar */}
      <nav className="bg-[#1e1e1e] border-b border-[#333]">
        <div className="w-full flex items-center px-4 py-3">
          <Link 
            href="/" 
            className="bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[100px] h-9 inline-flex items-center justify-center no-underline hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[rgba(9,199,228,0.3)] before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10 hover:before:scale-x-100"
          >
            Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Cybersecurity Resources</h1>
          
          {error && (
            <div className="text-[#ff6b6b] font-bold mt-4 p-4 bg-[rgba(255,107,107,0.1)] rounded-md border-l-4 border-[#ff6b6b] mb-6">
              {error}
            </div>
          )}
          
          {/* Filter and Search Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <label className="block text-sm text-[#aaa] mb-1">Search</label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className={`w-full p-2 pl-3 border ${searchTerm ? 'border-orange-500' : 'border-[#444]'} rounded-l-lg bg-[#2a2a2a] focus:border-[rgba(9,203,177,0.823)] focus:outline-none text-[#e0e0e0]`}
                />
                <button
                  onClick={handleResetFilters}
                  className="p-2 bg-[#333] text-[#e0e0e0] rounded-r-lg border border-l-0 border-[#444] hover:bg-[#444] transition-colors flex items-center"
                  title="Reset all filters"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-initial">
              <label className="block text-sm text-[#aaa] mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
                className={`p-2 border ${selectedType !== 'All' ? 'border-orange-500' : 'border-[#444]'} rounded-lg bg-[#2a2a2a] focus:border-[rgba(9,203,177,0.823)] focus:outline-none text-[#e0e0e0] w-full`}
              >
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-initial">
              <label className="block text-sm text-[#aaa] mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
                className={`p-2 border ${selectedCategory !== 'All' ? 'border-orange-500' : 'border-[#444]'} rounded-lg bg-[#2a2a2a] focus:border-[rgba(9,203,177,0.823)] focus:outline-none text-[#e0e0e0] w-full`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-initial">
              <label className="block text-sm text-[#aaa] mb-1">Sort By</label>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setCurrentPage(1); // Reset to first page on sort change
                }}
                className="p-2 border border-[#444] rounded-lg bg-[#2a2a2a] focus:border-[rgba(9,203,177,0.823)] focus:outline-none text-[#e0e0e0] w-full"
              >
                <option value="followCount">Most Popular</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[rgba(9,203,177,0.823)] mb-4"></div>
              <div className="ml-3 animate-pulse text-[rgba(9,203,177,0.823)]">Loading resources...</div>
            </div>
          ) : !filteredWebsites || filteredWebsites.length === 0 ? (
            <div className="text-center py-12 bg-[#1e1e1e] rounded-xl border border-[#333]">
              <p className="text-[#bbb]">No resources found matching your criteria.</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredWebsites.map((website, index) => (
                  <div key={website._id} className="relative">
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1e1e1e] rounded-lg p-4 border border-[#333] transition-all duration-300 hover:border-[rgba(9,203,177,0.5)] hover:shadow-[0_0_15px_rgba(45,169,164,0.2)] no-underline flex flex-col h-full block"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${getHostname(website.url)}&sz=32`}
                          alt={website.name}
                          className="w-6 h-6"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3E%3Cpath fill='none' d='M0 0h24v24H0z'/%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' fill='%23aaa'/%3E%3C/svg%3E";
                          }}
                        />
                        <h3 className="font-medium text-[#e0e0e0] m-0">{website.name}</h3>
                      </div>
                      <div className="mt-1 flex-grow">
                        <p className="text-sm text-[#aaa] m-0 line-clamp-2">{website.details}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {website.tags && website.tags.map((tag, i) => (
                          <span key={i} className="inline-block text-xs py-1 px-2 rounded bg-[#252525] text-[rgba(160,160,160,0.9)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#333] flex justify-between items-center">
                        <span className="inline-block text-xs py-1 px-2 rounded bg-[#252525] text-[rgba(9,203,177,0.823)]">
                          {website.type}
                        </span>
                        <span className="text-xs text-[#888]">{website.category}</span>
                      </div>
                    </a>
                    {/* Heart Button */}
                    <button
                      onClick={(e) => handleFollowClick(e, website._id)}
                      className={`absolute top-2 right-2 p-1.5 bg-[#252525] hover:bg-[#333] rounded-full transition-all duration-200 flex items-center justify-center z-10 shadow-md ${
                        followingInProgress[website._id] 
                          ? 'cursor-default' 
                          : followedResources[website._id] 
                            ? 'cursor-default animate-pulse-once' 
                            : 'cursor-pointer hover:shadow-lg'
                      }`}
                      disabled={followingInProgress[website._id] || followedResources[website._id]}
                      aria-label={followedResources[website._id] ? "Already followed" : "Follow this resource"}
                    >
                      <div className="flex items-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill={followedResources[website._id] ? "currentColor" : "transparent"}
                          stroke={followedResources[website._id] ? "none" : "currentColor"}
                          strokeWidth="1.5"
                          className={`w-4 h-4 transition-all duration-300 ${
                            followingInProgress[website._id] 
                              ? 'text-gray-400 animate-pulse' 
                              : followedResources[website._id]
                                ? 'text-[rgba(9,203,177,0.823)]'
                                : 'text-[rgba(9,203,177,0.623)]'
                          }`}
                        >
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                        <span className="ml-1 text-xs font-semibold">
                          {followingInProgress[website._id] ? '...' : (website.followCount || 0)}
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? 'bg-[#1e1e1e] text-[#555] cursor-not-allowed'
                        : 'bg-[#252525] text-white hover:bg-[#333] transition-colors'
                    }`}
                  >
                    First
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? 'bg-[#1e1e1e] text-[#555] cursor-not-allowed'
                        : 'bg-[#252525] text-white hover:bg-[#333] transition-colors'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className="text-[#aaa] px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? 'bg-[#1e1e1e] text-[#555] cursor-not-allowed'
                        : 'bg-[#252525] text-white hover:bg-[#333] transition-colors'
                    }`}
                  >
                    Next
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? 'bg-[#1e1e1e] text-[#555] cursor-not-allowed'
                        : 'bg-[#252525] text-white hover:bg-[#333] transition-colors'
                    }`}
                  >
                    Last
                  </button>
                </div>
              )}
              
              {/* Results Count */}
              <div className="mt-6 text-sm text-[#bbb] text-center">
                {totalResources > 0 && (
                  <>
                    Showing {(currentPage - 1) * resourcesPerPage + 1} - {Math.min(currentPage * resourcesPerPage, totalResources)} of {totalResources} resources
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 