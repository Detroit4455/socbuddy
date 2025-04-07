'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchLogsLoading, setSearchLogsLoading] = useState(false);
  const [searchLogs, setSearchLogs] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Load logs when search term or pagination changes
  useEffect(() => {
    if (isAuthenticated) {
      loadLogs();
    }
  }, [debouncedSearchTerm, currentPage, pageSize, isAuthenticated]);

  // Load search logs when authenticated
  useEffect(() => {
    if (isAuthenticated && activeTab === 'searchlogs') {
      loadSearchLogs();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/page-analytics?password=${password}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Incorrect password');
        }
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
      setIsAuthenticated(true);
      
      // Initial logs load happens via useEffect after authentication
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadLogs = async () => {
    if (!isAuthenticated) return;
    
    setLogsLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        password,
        page: currentPage,
        limit: pageSize
      });
      
      if (debouncedSearchTerm) {
        queryParams.append('search', debouncedSearchTerm);
      }
      
      const response = await fetch(`/api/user-logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotalLogs(data.total);
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadSearchLogs = async () => {
    if (!isAuthenticated) return;
    
    setSearchLogsLoading(true);
    
    try {
      const response = await fetch(`/api/view-logs?password=${password}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search logs');
      }
      
      const data = await response.json();
      setSearchLogs(data.logs);
    } catch (err) {
      console.error('Error loading search logs:', err);
    } finally {
      setSearchLogsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleResetAnalytics = async () => {
    if (!confirm('Are you sure you want to reset all analytics data? This action cannot be undone.')) {
      return;
    }
    
    setResetLoading(true);
    setError('');
    setResetSuccess(false);
    
    try {
      const response = await fetch('/api/page-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset',
          password: password,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset analytics data');
      }
      
      // Reset local analytics state
      const resetData = {
        '/': 0,
        '/base64': 0,
        '/grabRedirectUrl': 0,
        '/indicator-extractor': 0,
      };
      
      setAnalytics(resetData);
      setResetSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setResetSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const getTotalHits = () => {
    return Object.values(analytics).reduce((sum, hits) => sum + hits, 0);
  };

  const formatPagePath = (path) => {
    if (path === '/') return 'Home';
    return path.substring(1).charAt(0).toUpperCase() + path.substring(2);
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="w-screen h-screen bg-[#121212] flex flex-col text-[#e0e0e0] relative font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] overflow-hidden">
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
      <div className="flex-1 p-2.5 flex justify-center items-start overflow-auto">
        <div className="bg-[#1e1e1e] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] w-[90%] max-w-[850px] border border-[#333] p-5 mt-5">
          <h1 className="text-center mb-4 text-[#e0e0e0] text-2xl">
            Admin Dashboard
          </h1>

          {!isAuthenticated ? (
            <div className="flex flex-col">
              <h2 className="text-xl mb-4 text-center">Login Required</h2>
              
              <div className="relative flex mb-4 border border-[#444] rounded-lg overflow-hidden bg-[#2a2a2a] focus-within:border-[rgba(9,203,177,0.823)] focus-within:shadow-[0_0_0_3px_rgba(9,203,177,0.2)]">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter password"
                  className="w-full p-3 border-none text-sm bg-transparent leading-normal m-0 outline-none box-border text-[#e0e0e0]"
                />
              </div>

              {error && (
                <div className="text-[#ff6b6b] font-bold mt-2 p-2 bg-[rgba(255,107,107,0.1)] rounded-md border-l-4 border-[#ff6b6b] mb-4">
                  {error}
                </div>
              )}

              <button 
                onClick={handleLogin}
                disabled={loading}
                className="bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-4 py-2 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(45,169,164,0.4)] min-w-[100px] h-9 inline-flex items-center justify-center self-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] hover:shadow-[0_0_25px_rgba(45,169,164,0.8)] hover:border-[rgba(10,238,162,0.8)] active:scale-95 active:shadow-[0_0_10px_rgba(45,169,164,0.5)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[rgba(9,199,228,0.3)] before:scale-x-0 before:origin-left before:transition-transform before:duration-300 before:ease-in-out before:-z-10 hover:before:scale-x-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </div>
          ) : (
            <div>
              {/* Tab Navigation */}
              <div className="flex border-b border-[#333] mb-4">
                <button 
                  onClick={() => setActiveTab('analytics')} 
                  className={`px-4 py-2 font-medium ${activeTab === 'analytics' ? 'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 'text-[#bbb] hover:text-white'}`}
                >
                  Analytics
                </button>
                <button 
                  onClick={() => setActiveTab('logs')} 
                  className={`px-4 py-2 font-medium ${activeTab === 'logs' ? 'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 'text-[#bbb] hover:text-white'}`}
                >
                  User Logs
                </button>
                <button 
                  onClick={() => setActiveTab('searchlogs')} 
                  className={`px-4 py-2 font-medium ${activeTab === 'searchlogs' ? 'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 'text-[#bbb] hover:text-white'}`}
                >
                  Search Logs
                </button>
              </div>
              
              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <>
                  <div className="bg-[#2a2a2a] p-4 rounded-lg mb-5 text-center">
                    <h2 className="text-lg mb-2">Total Website Hits</h2>
                    <div className="text-3xl font-bold text-[rgba(9,203,177,0.823)]">{getTotalHits()}</div>
                  </div>
                  
                  <div className="overflow-hidden rounded-lg border border-[#444] mb-6">
                    <table className="min-w-full bg-[#2a2a2a] divide-y divide-[#444]">
                      <thead className="bg-[#1a1a1a]">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#bbb] uppercase tracking-wider">Page</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#bbb] uppercase tracking-wider">Hits</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#bbb] uppercase tracking-wider">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#444]">
                        {Object.entries(analytics).map(([page, hits]) => (
                          <tr key={page} className="hover:bg-[#333]">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatPagePath(page)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{hits}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {getTotalHits() > 0 ? `${((hits / getTotalHits()) * 100).toFixed(1)}%` : '0%'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={handleResetAnalytics}
                      disabled={resetLoading}
                      className="bg-transparent border-2 border-[#ff6b6b] text-[#ff6b6b] px-4 py-2 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out min-w-[140px] h-9 inline-flex items-center justify-center hover:text-white hover:bg-[#ff6b6b] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? 'Resetting...' : 'Reset Analytics'}
                    </button>
                  </div>
                </>
              )}
              
              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg">User Input Logs</h2>
                    <button 
                      onClick={loadLogs}
                      disabled={logsLoading}
                      className="bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-3 py-1 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out min-w-[80px] h-8 inline-flex items-center justify-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {logsLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  
                  {/* Search and pagination controls */}
                  <div className="flex flex-col md:flex-row justify-between mb-4 gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full p-2 pl-8 border border-[#444] rounded-lg overflow-hidden bg-[#2a2a2a] focus:border-[rgba(9,203,177,0.823)] focus:outline-none"
                      />
                      <div className="absolute left-2 top-2.5 text-[#999]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="text-sm text-[#bbb] mr-2">Logs per page:</label>
                      <select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        className="bg-[#2a2a2a] border border-[#444] rounded p-1 text-sm"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                  
                  {logsLoading ? (
                    <div className="text-center py-8 text-[#bbb]">
                      Loading logs...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-[#bbb]">
                      {debouncedSearchTerm ? 'No logs matching your search.' : 'No logs available yet.'}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-[#bbb] mb-2">
                        Showing {logs.length} of {totalLogs} log entries
                      </div>
                      
                      <div className="space-y-4 mt-2 mb-4">
                        {logs.map((log, index) => (
                          <div key={index} className="bg-[#2a2a2a] p-3 rounded-lg border border-[#444] text-sm font-mono whitespace-pre-wrap break-words">
                            {log.includes('Status: Success') ? (
                              <>
                                {log.split('Status: Success').map((part, i) => (
                                  i === 0 
                                  ? <span key={i}>{part}<span className="text-[#4cd137] font-semibold">Status: Success</span></span>
                                  : <span key={i}>{part}</span>
                                ))}
                              </>
                            ) : log.includes('Status: Failure') ? (
                              <>
                                {log.split('Status: Failure').map((part, i) => (
                                  i === 0 
                                  ? <span key={i}>{part}<span className="text-[#ff6b6b] font-semibold">Status: Failure</span></span>
                                  : <span key={i}>{part}</span>
                                ))}
                              </>
                            ) : log.includes('Error:') ? (
                              <>
                                {log.split('Error:').map((part, i) => (
                                  i === 0 
                                  ? <span key={i}>{part}<span className="text-[#ff6b6b] font-semibold">Error:</span></span>
                                  : <span key={i}><span className="text-[#ff6b6b]">{part}</span></span>
                                ))}
                              </>
                            ) : (
                              log
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                          <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded disabled:opacity-50"
                          >
                            &laquo;
                          </button>
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded disabled:opacity-50"
                          >
                            &lsaquo;
                          </button>
                          
                          <div className="text-sm mx-2">
                            Page {currentPage} of {totalPages}
                          </div>
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded disabled:opacity-50"
                          >
                            &rsaquo;
                          </button>
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded disabled:opacity-50"
                          >
                            &raquo;
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              
              {/* Search Logs Content */}
              {activeTab === 'searchlogs' && (
                <div>
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl">User Search Logs</h2>
                    <button 
                      onClick={loadSearchLogs} 
                      className="px-3 py-1 bg-[#252525] text-[#e0e0e0] rounded-md hover:bg-[#333] transition-colors text-sm"
                    >
                      Refresh
                    </button>
                  </div>

                  {searchLogsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-pulse text-[rgba(9,203,177,0.823)]">Loading search logs...</div>
                    </div>
                  ) : searchLogs.length === 0 ? (
                    <div className="text-center py-12 bg-[#252525] rounded-md">
                      <p className="text-[#bbb]">No search logs found.</p>
                    </div>
                  ) : (
                    <div className="bg-[#252525] rounded-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#333]">
                          <thead className="bg-[#2a2a2a]">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#aaa] uppercase tracking-wider">Timestamp</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#aaa] uppercase tracking-wider">Page</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#aaa] uppercase tracking-wider">Search Query</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-[#aaa] uppercase tracking-wider">User Agent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#333]">
                            {searchLogs.map((log, index) => (
                              <tr key={index} className="hover:bg-[#3a3a3a]">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#e0e0e0]">{log.timestamp}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[#e0e0e0]">{log.page}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[rgba(9,203,177,0.823)]">{log.query}</td>
                                <td className="px-4 py-3 text-sm text-[#aaa] truncate max-w-xs">{log.userAgent}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-3 bg-[#2a2a2a] border-t border-[#333]">
                        <p className="text-sm text-[#aaa]">Total search logs: {searchLogs.length}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {resetSuccess && (
                <div className="text-[#4cd137] font-bold mt-4 p-2 bg-[rgba(76,209,55,0.1)] rounded-md border-l-4 border-[#4cd137]">
                  Analytics data has been reset successfully.
                </div>
              )}
              
              {error && (
                <div className="text-[#ff6b6b] font-bold mt-4 p-2 bg-[rgba(255,107,107,0.1)] rounded-md border-l-4 border-[#ff6b6b]">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 