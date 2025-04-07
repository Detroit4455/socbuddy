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
  const [types, setTypes] = useState(['All']);
  const [categories, setCategories] = useState(['All']);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/data/website.json');
        if (!response.ok) {
          throw new Error('Failed to fetch websites');
        }
        const data = await response.json();
        setWebsites(data);
        setFilteredWebsites(data);
        
        // Extract unique types and categories for filter dropdowns
        const uniqueTypes = ['All', ...new Set(data.map(site => site.type))];
        const uniqueCategories = ['All', ...new Set(data.map(site => site.category))];
        setTypes(uniqueTypes);
        setCategories(uniqueCategories);
        
        setIsLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load websites');
        setIsLoading(false);
      }
    };
    
    fetchWebsites();
  }, []);
  
  // Function to log user searches
  const logUserSearch = async (query) => {
    if (!query.trim()) return; // Don't log empty searches
    
    try {
      const response = await fetch('/api/log-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          page: 'cybersecurity-resources',
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to log search query');
      }
    } catch (error) {
      console.error('Error logging search query:', error);
    }
  };
  
  // Handle search input with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set a new timeout to log the search after user stops typing for 1 second
    const timeout = setTimeout(() => {
      logUserSearch(value);
    }, 1000);
    
    setSearchTimeout(timeout);
  };
  
  // Apply filters whenever dependencies change
  useEffect(() => {
    if (websites.length === 0) return;
    
    let filtered = [...websites];
    
    // Apply type filter
    if (selectedType !== 'All') {
      filtered = filtered.filter(website => website.type === selectedType);
    }
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(website => website.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(website => {
        // Search in all string properties
        return Object.entries(website).some(([key, value]) => {
          // Check if value is string
          if (typeof value === 'string') {
            return value.toLowerCase().includes(search);
          }
          // Check if value is array of strings (tags)
          if (Array.isArray(value) && key === 'tags') {
            return value.some(tag => tag.toLowerCase().includes(search));
          }
          return false;
        });
      });
    }
    
    setFilteredWebsites(filtered);
  }, [websites, selectedType, selectedCategory, searchTerm]);

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
            <div className="flex-1">
              <label className="block text-sm text-[#aaa] mb-1">Search</label>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full p-2 pl-3 border border-[#444] rounded-lg bg-[#2a2a2a] focus:border-[rgba(9,203,177,0.823)] focus:outline-none text-[#e0e0e0]"
              />
            </div>
            
            <div className="flex-initial">
              <label className="block text-sm text-[#aaa] mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="p-2 border border-[#444] rounded-lg bg-[#2a2a2a] focus:border-[rgba(9,203,177,0.823)] focus:outline-none text-[#e0e0e0] w-full"
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
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 border border-[#444] rounded-lg bg-[#2a2a2a] focus:border-[rgba(9,203,177,0.823)] focus:outline-none text-[#e0e0e0] w-full"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-[rgba(9,203,177,0.823)]">Loading resources...</div>
            </div>
          ) : filteredWebsites.length === 0 ? (
            <div className="text-center py-12 bg-[#1e1e1e] rounded-xl border border-[#333]">
              <p className="text-[#bbb]">No resources found matching your criteria.</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredWebsites.map((website, index) => (
                  <a
                    key={index}
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1e1e1e] rounded-lg p-4 border border-[#333] transition-all duration-300 hover:border-[rgba(9,203,177,0.5)] hover:shadow-[0_0_15px_rgba(45,169,164,0.2)] no-underline flex flex-col h-full"
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
                ))}
              </div>
              
              {/* Results Count */}
              <div className="mt-6 text-sm text-[#bbb] text-center">
                Showing {filteredWebsites.length} of {websites.length} resources
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 