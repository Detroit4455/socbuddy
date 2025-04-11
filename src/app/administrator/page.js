'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdministratorPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchLogsLoading, setSearchLogsLoading] = useState(false);
  const [searchLogs, setSearchLogs] = useState([]);
  const [dbInfo, setDbInfo] = useState(null);
  const [dbInfoLoading, setDbInfoLoading] = useState(false);
  
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

  // Load database info when authenticated
  useEffect(() => {
    if (isAuthenticated && activeTab === 'database') {
      loadDbInfo();
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

  const loadDbInfo = async () => {
    if (!isAuthenticated) return;
    
    setDbInfoLoading(true);
    console.log("Loading database info...");
    
    try {
      console.log("Fetching DB info with password:", password);
      const response = await fetch(`/api/db-info?password=${password}`);
      
      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);
        throw new Error('Failed to fetch database information');
      }
      
      const data = await response.json();
      console.log("Received DB info:", data);
      setDbInfo(data);
    } catch (err) {
      console.error('Error loading database info:', err);
      setError(err.message);
    } finally {
      setDbInfoLoading(false);
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

  // Add a function to handle task migration
  const handleMigrateTasks = async () => {
    if (!confirm('Are you sure you want to migrate all tasks to associate them with users? This operation will set user IDs for all tasks.')) {
      return;
    }
    
    setMigrationLoading(true);
    setError('');
    setMigrationSuccess(false);
    setMigrationResult(null);
    
    try {
      const response = await fetch('/api/tasks/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to migrate tasks');
      }
      
      const result = await response.json();
      setMigrationResult(result);
      setMigrationSuccess(true);
      
      // Hide success message after 10 seconds
      setTimeout(() => {
        setMigrationSuccess(false);
        setMigrationResult(null);
      }, 10000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setMigrationLoading(false);
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
            Administrator Dashboard
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
              <div className="mb-6">
                <nav className="flex border-b border-[#333] mb-4">
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
                  <button
                    onClick={() => setActiveTab('migration')}
                    className={`px-4 py-2 font-medium ${activeTab === 'migration' ? 'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 'text-[#bbb] hover:text-white'}`}
                  >
                    Task Migration
                  </button>
                  <button
                    onClick={() => setActiveTab('database')}
                    className={`px-4 py-2 font-medium ${activeTab === 'database' ? 'text-[rgba(9,203,177,0.823)] border-b-2 border-[rgba(9,203,177,0.823)]' : 'text-[#bbb] hover:text-white'}`}
                  >
                    Database Info
                  </button>
                </nav>
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
              
              {/* Database Info Tab */}
              {activeTab === 'database' && (
                <div>
                  <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6">
                    <h2 className="text-xl mb-4">Database Information</h2>
                    
                    {dbInfoLoading ? (
                      <div className="text-center py-8 text-[#bbb]">
                        Loading database information...
                      </div>
                    ) : dbInfo ? (
                      <div className="overflow-hidden bg-[#252525] rounded-lg border border-[#444]">
                        <dl className="divide-y divide-[#444]">
                          <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-[#bbb]">Database Provider</dt>
                            <dd className="mt-1 text-sm text-[#e0e0e0] sm:mt-0 sm:col-span-2">{dbInfo.provider}</dd>
                          </div>
                          <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-[#bbb]">Database Name</dt>
                            <dd className="mt-1 text-sm text-[#e0e0e0] sm:mt-0 sm:col-span-2">{dbInfo.databaseName}</dd>
                          </div>
                          <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-[#bbb]">Host</dt>
                            <dd className="mt-1 text-sm text-[#e0e0e0] sm:mt-0 sm:col-span-2">{dbInfo.host}</dd>
                          </div>
                          <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-[#bbb]">Connection Status</dt>
                            <dd className="mt-1 sm:mt-0 sm:col-span-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dbInfo.connectionStatus === 'Connected' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {dbInfo.connectionStatus}
                              </span>
                            </dd>
                          </div>
                          <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-[#bbb]">Last Updated</dt>
                            <dd className="mt-1 text-sm text-[#e0e0e0] sm:mt-0 sm:col-span-2">
                              {new Date(dbInfo.timestamp).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#bbb]">
                        <p>{error || 'No database information available'}</p>
                        <div className="mt-4 p-4 bg-[#1a1a1a] rounded text-left">
                          <p className="text-sm font-mono">Debug Info:</p>
                          <p className="text-xs font-mono mt-2">Authentication Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
                          <p className="text-xs font-mono mt-1">Active Tab: {activeTab}</p>
                          <p className="text-xs font-mono mt-1">DB Info State: {dbInfo === null ? 'null' : typeof dbInfo}</p>
                          <p className="text-xs font-mono mt-1">Loading State: {dbInfoLoading ? 'Loading' : 'Not Loading'}</p>
                          <p className="text-xs font-mono mt-1">Error State: {error ? error : 'No Error'}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={loadDbInfo}
                        disabled={dbInfoLoading}
                        className="bg-transparent border-2 border-[rgba(9,203,177,0.823)] text-[rgba(240,245,244,0.701)] px-3 py-1 text-xs cursor-pointer rounded-md uppercase font-semibold tracking-wider relative overflow-hidden transition-all duration-300 ease-in-out min-w-[80px] h-8 inline-flex items-center justify-center hover:text-[rgb(247,246,250)] hover:bg-[rgba(10,238,162,0.59)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {dbInfoLoading ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Migration Tab */}
              {activeTab === 'migration' && (
                <div>
                  <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6">
                    <h2 className="text-xl mb-4">Task Management Tools</h2>
                    
                    <div className="mb-6">
                      <h3 className="text-lg mb-3 text-[rgba(9,203,177,0.823)]">Migrate Tasks to Users</h3>
                      <p className="text-sm text-[#bbb] mb-4">
                        This will associate all existing tasks with appropriate user accounts based on the owner field.
                        Tasks will be matched by username if possible, or assigned to the first admin user as a fallback.
                      </p>
                      
                      <button
                        onClick={handleMigrateTasks}
                        disabled={migrationLoading}
                        className={`px-4 py-2 rounded-md bg-purple-700 text-white hover:bg-purple-600 transition-colors ${migrationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {migrationLoading ? 'Migrating...' : 'Migrate Tasks to Users'}
                      </button>
                    </div>
                    
                    {migrationSuccess && migrationResult && (
                      <div className="mt-4 p-3 bg-[rgba(76,209,55,0.1)] rounded-md border-l-4 border-[#4cd137]">
                        <h4 className="text-[#4cd137] font-bold">Migration Completed</h4>
                        <p className="text-sm mt-1">Processed {migrationResult.totalProcessed} tasks</p>
                        <div className="mt-2 max-h-60 overflow-y-auto">
                          <h5 className="text-sm font-medium mb-1">Results:</h5>
                          <pre className="text-xs bg-[#1a1a1a] p-2 rounded overflow-x-auto">
                            {JSON.stringify(migrationResult.results, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
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